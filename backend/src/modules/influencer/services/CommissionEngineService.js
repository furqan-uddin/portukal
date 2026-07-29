import { calculateEffectiveCommission, getGlobalCommissionSettingsData } from './commissionHelper.js';
import { WalletService, roundVal } from './WalletService.js';
import CommissionSettlement from '../models/CommissionSettlement.model.js';
import Product from '../../../models/Product.model.js';
import Vendor from '../../../models/Vendor.model.js';
import ApiError from '../../../utils/ApiError.js';

export class CommissionEngineService {
    /**
     * Calculate and Reserve Commission for a placed order (Line-Itemized)
     */
    static async reserveCommission(order, session = null) {
        if (!order || !order.influencerId || !order.referralCode) {
            return null;
        }

        const globalSettings = await getGlobalCommissionSettingsData();
        if (!globalSettings.isEnabled) {
            return null;
        }

        const existingSettlement = await CommissionSettlement.findOne({ orderId: order._id }).session(session);
        if (existingSettlement) {
            return existingSettlement;
        }

        let totalCommissionAmount = 0;
        let mainVendorId = order.vendorId || (order.items && order.items[0]?.vendorId);
        const settlementItems = [];

        for (const item of order.items || []) {
            const product = await Product.findById(item.productId || item.product).session(session);
            if (product && product.allowInfluencer && product.isActive) {
                const itemVendorId = product.vendorId || item.vendorId || mainVendorId;
                const vendor = await Vendor.findById(itemVendorId).session(session);

                if (vendor && vendor.status === 'approved' && vendor.influencerProgram?.enabled !== false) {
                    const comm = await calculateEffectiveCommission(product, vendor);
                    const qty = Number(item.quantity || 1);
                    const unitPrice = Number(item.price || product.price);
                    const itemTotal = roundVal(unitPrice * qty);
                    const itemComm = roundVal((itemTotal * comm.commissionPercent) / 100);

                    totalCommissionAmount = roundVal(totalCommissionAmount + itemComm);
                    if (!mainVendorId) mainVendorId = vendor._id;

                    settlementItems.push({
                        productId: product._id,
                        vendorId: vendor._id,
                        originalQuantity: qty,
                        returnedQuantity: 0,
                        remainingQuantity: qty,
                        unitPrice,
                        commissionPercent: comm.commissionPercent,
                        commissionAmount: itemComm,
                        status: 'reserved',
                    });
                }
            }
        }

        if (totalCommissionAmount <= 0 || settlementItems.length === 0) {
            return null;
        }

        const returnWindowDays = globalSettings.returnWindowDays || 7;
        const eligibleSettlementDate = new Date(Date.now() + returnWindowDays * 24 * 60 * 60 * 1000);
        const idempotencyKey = `RESERVE_ORD_${order._id}`;

        await WalletService.reserveCommission(
            {
                influencerId: order.influencerId,
                vendorId: mainVendorId || order.vendorId,
                orderId: order._id,
                amount: totalCommissionAmount,
                idempotencyKey,
                description: `Commission reserved for referral order #${order.orderId || order._id}`,
            },
            session
        );

        const settlement = await CommissionSettlement.create(
            [
                {
                    orderId: order._id,
                    influencerId: order.influencerId,
                    vendorId: mainVendorId || order.vendorId,
                    items: settlementItems,
                    commissionAmount: totalCommissionAmount,
                    status: 'pending',
                    eligibleSettlementDate,
                    idempotencyKey,
                },
            ],
            { session }
        );

        return settlement[0];
    }

    /**
     * Release Commission for a settled order
     */
    static async releaseCommission(settlementId, session = null) {
        const settlement = await CommissionSettlement.findById(settlementId).session(session);
        if (!settlement || settlement.status !== 'pending') {
            return null;
        }

        const idempotencyKey = `RELEASE_ORD_${settlement.orderId}`;

        await WalletService.releaseCommission(
            {
                influencerId: settlement.influencerId,
                vendorId: settlement.vendorId,
                orderId: settlement.orderId,
                amount: settlement.commissionAmount,
                idempotencyKey,
                description: `Commission released after 7-day return window for order #${settlement.orderId}`,
            },
            session
        );

        settlement.status = 'settled';
        settlement.settledAt = new Date();
        settlement.items.forEach((it) => {
            if (it.status === 'reserved') it.status = 'released';
        });
        await settlement.save({ session });

        return settlement;
    }

    /**
     * Reverse Full Commission for Order
     */
    static async reverseCommission(orderId, reason = 'Order returned/cancelled', session = null) {
        const settlement = await CommissionSettlement.findOne({ orderId }).session(session);
        if (!settlement || settlement.status === 'reversed') {
            return null;
        }

        const idempotencyKey = `REVERSE_ORD_${orderId}`;

        await WalletService.reverseCommission(
            {
                influencerId: settlement.influencerId,
                vendorId: settlement.vendorId,
                orderId: settlement.orderId,
                amount: settlement.commissionAmount,
                idempotencyKey,
                reason,
            },
            session
        );

        settlement.status = 'reversed';
        settlement.reversedAt = new Date();
        settlement.items.forEach((it) => {
            it.status = 'reversed';
            it.returnedQuantity = it.originalQuantity;
            it.remainingQuantity = 0;
        });
        await settlement.save({ session });

        return settlement;
    }

    /**
     * Reverse Partial Commission for a Returned Product Line Item
     */
    static async reversePartialCommission(orderId, returnedProductId, returnedQuantity = 1, reason = 'Partial item return', session = null) {
        const settlement = await CommissionSettlement.findOne({ orderId }).session(session);
        if (!settlement || settlement.status === 'reversed') {
            return null;
        }

        const itemIndex = settlement.items.findIndex(
            (it) => String(it.productId) === String(returnedProductId) && ['reserved', 'pending'].includes(it.status)
        );

        if (itemIndex === -1) {
            return null;
        }

        const item = settlement.items[itemIndex];
        const returnQty = Math.min(returnedQuantity, item.remainingQuantity);
        if (returnQty <= 0) return null;

        // Calculate unit commission amount
        const unitCommission = item.commissionAmount / item.originalQuantity;
        const reversalAmount = roundVal(unitCommission * returnQty);

        // Update item quantities & status
        item.returnedQuantity += returnQty;
        item.remainingQuantity -= returnQty;
        if (item.remainingQuantity <= 0) {
            item.status = 'reversed';
        } else {
            item.status = 'partially_reversed';
        }

        // Update overall settlement amount & status
        settlement.commissionAmount = roundVal(Math.max(0, settlement.commissionAmount - reversalAmount));
        const allReversed = settlement.items.every((it) => it.status === 'reversed');
        if (allReversed) {
            settlement.status = 'reversed';
            settlement.reversedAt = new Date();
        } else {
            settlement.status = 'partially_reversed';
        }

        const idempotencyKey = `REVERSE_PARTIAL_${orderId}_${returnedProductId}_${Date.now()}`;

        // Reverse through WalletService
        await WalletService.reverseCommission(
            {
                influencerId: settlement.influencerId,
                vendorId: item.vendorId || settlement.vendorId,
                orderId: settlement.orderId,
                amount: reversalAmount,
                idempotencyKey,
                reason: `${reason} (${returnQty} unit(s) of product ${returnedProductId})`,
            },
            session
        );

        await settlement.save({ session });
        return settlement;
    }
}
