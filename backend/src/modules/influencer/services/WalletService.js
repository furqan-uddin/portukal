import InfluencerWallet from '../models/InfluencerWallet.model.js';
import VendorWallet from '../models/VendorWallet.model.js';
import InfluencerWalletTransaction from '../models/InfluencerWalletTransaction.model.js';
import VendorWalletLedger from '../models/VendorWalletLedger.model.js';
import WithdrawalRequest from '../models/WithdrawalRequest.model.js';
import ApiError from '../../../utils/ApiError.js';
import { getGlobalCommissionSettingsData } from './commissionHelper.js';

export const roundVal = (num) => Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;

export class WalletService {
    /**
     * Get or initialize Influencer Wallet
     */
    static async getOrCreateInfluencerWallet(influencerId, session = null) {
        let wallet = await InfluencerWallet.findOne({ influencerId }).session(session);
        if (!wallet) {
            wallet = new InfluencerWallet({ influencerId });
            await wallet.save({ session });
        }
        return wallet;
    }

    /**
     * Get or initialize Vendor Wallet
     */
    static async getOrCreateVendorWallet(vendorId, session = null) {
        let wallet = await VendorWallet.findOne({ vendorId }).session(session);
        if (!wallet) {
            wallet = new VendorWallet({ vendorId });
            await wallet.save({ session });
        }
        return wallet;
    }

    /**
     * Reserve Commission for an Order
     */
    static async reserveCommission({ influencerId, vendorId, orderId, amount, idempotencyKey, description }, session = null) {
        amount = roundVal(amount);
        if (amount <= 0) return null;

        if (idempotencyKey) {
            const existingVendorLedger = await VendorWalletLedger.findOne({ idempotencyKey: `${idempotencyKey}_V` }).session(session);
            if (existingVendorLedger) return existingVendorLedger;
        }

        const vWallet = await this.getOrCreateVendorWallet(vendorId, session);
        const vBefore = vWallet.reservedBalance;
        vWallet.balance = roundVal(vWallet.balance + amount);
        vWallet.reservedBalance = roundVal(vWallet.reservedBalance + amount);
        vWallet.totalReserved = roundVal(vWallet.totalReserved + amount);
        await vWallet.save({ session });

        await VendorWalletLedger.create(
            [
                {
                    vendorId,
                    orderId,
                    influencerId,
                    type: 'reserve',
                    amount,
                    balanceBefore: vBefore,
                    balanceAfter: vWallet.reservedBalance,
                    status: 'completed',
                    description: description || `Commission reserved for order #${orderId}`,
                    idempotencyKey: idempotencyKey ? `${idempotencyKey}_V` : undefined,
                },
            ],
            { session }
        );

        const iWallet = await this.getOrCreateInfluencerWallet(influencerId, session);
        const iBefore = iWallet.reservedBalance;
        iWallet.reservedBalance = roundVal(iWallet.reservedBalance + amount);
        iWallet.totalCommission = roundVal(iWallet.totalCommission + amount);
        iWallet.totalOrders = (iWallet.totalOrders || 0) + 1;
        await iWallet.save({ session });

        await InfluencerWalletTransaction.create(
            [
                {
                    influencerId,
                    vendorId,
                    orderId,
                    type: 'commission_reserved',
                    amount,
                    balanceBefore: iBefore,
                    balanceAfter: iWallet.reservedBalance,
                    status: 'completed',
                    description: description || `Commission reserved for order #${orderId}`,
                    idempotencyKey: idempotencyKey ? `${idempotencyKey}_I` : undefined,
                },
            ],
            { session }
        );

        return { vendorWallet: vWallet, influencerWallet: iWallet };
    }

    /**
     * Release Commission after Return Window Expiry (Post-Settlement)
     */
    static async releaseCommission({ influencerId, vendorId, orderId, amount, idempotencyKey, description }, session = null) {
        amount = roundVal(amount);
        if (amount <= 0) return null;

        if (idempotencyKey) {
            const existingTx = await InfluencerWalletTransaction.findOne({ idempotencyKey: `${idempotencyKey}_I` }).session(session);
            if (existingTx) return existingTx;
        }

        const vWallet = await this.getOrCreateVendorWallet(vendorId, session);
        const vBefore = vWallet.reservedBalance;
        vWallet.reservedBalance = roundVal(Math.max(0, vWallet.reservedBalance - amount));
        vWallet.releasedBalance = roundVal(vWallet.releasedBalance + amount);
        vWallet.totalReleased = roundVal(vWallet.totalReleased + amount);
        await vWallet.save({ session });

        await VendorWalletLedger.create(
            [
                {
                    vendorId,
                    orderId,
                    influencerId,
                    type: 'release',
                    amount,
                    balanceBefore: vBefore,
                    balanceAfter: vWallet.reservedBalance,
                    status: 'completed',
                    description: description || `Commission released for order #${orderId}`,
                    idempotencyKey: idempotencyKey ? `${idempotencyKey}_V` : undefined,
                },
            ],
            { session }
        );

        const iWallet = await this.getOrCreateInfluencerWallet(influencerId, session);
        const iBefore = iWallet.availableBalance;
        iWallet.reservedBalance = roundVal(Math.max(0, iWallet.reservedBalance - amount));
        iWallet.availableBalance = roundVal(iWallet.availableBalance + amount);
        iWallet.lifetimeEarnings = roundVal(iWallet.lifetimeEarnings + amount);
        iWallet.lastSettlementDate = new Date();
        await iWallet.save({ session });

        await InfluencerWalletTransaction.create(
            [
                {
                    influencerId,
                    vendorId,
                    orderId,
                    type: 'commission_released',
                    amount,
                    balanceBefore: iBefore,
                    balanceAfter: iWallet.availableBalance,
                    status: 'completed',
                    description: description || `Commission released for order #${orderId}`,
                    idempotencyKey: idempotencyKey ? `${idempotencyKey}_I` : undefined,
                },
            ],
            { session }
        );

        return { vendorWallet: vWallet, influencerWallet: iWallet };
    }

    /**
     * Reverse Commission on Return / Cancellation (Full or Partial)
     */
    static async reverseCommission({ influencerId, vendorId, orderId, amount, idempotencyKey, reason }, session = null) {
        amount = roundVal(amount);
        if (amount <= 0) return null;

        if (idempotencyKey) {
            const existingTx = await InfluencerWalletTransaction.findOne({ idempotencyKey: `${idempotencyKey}_I` }).session(session);
            if (existingTx) return existingTx;
        }

        const vWallet = await this.getOrCreateVendorWallet(vendorId, session);
        const vBefore = vWallet.reservedBalance;
        vWallet.reservedBalance = roundVal(Math.max(0, vWallet.reservedBalance - amount));
        vWallet.balance = roundVal(Math.max(0, vWallet.balance - amount));
        await vWallet.save({ session });

        await VendorWalletLedger.create(
            [
                {
                    vendorId,
                    orderId,
                    influencerId,
                    type: 'refund_reversal',
                    amount: -amount,
                    balanceBefore: vBefore,
                    balanceAfter: vWallet.reservedBalance,
                    status: 'completed',
                    description: reason || `Commission reversed for order #${orderId}`,
                    idempotencyKey: idempotencyKey ? `${idempotencyKey}_V` : undefined,
                },
            ],
            { session }
        );

        const iWallet = await this.getOrCreateInfluencerWallet(influencerId, session);
        const iBefore = iWallet.reservedBalance;
        iWallet.reservedBalance = roundVal(Math.max(0, iWallet.reservedBalance - amount));
        await iWallet.save({ session });

        await InfluencerWalletTransaction.create(
            [
                {
                    influencerId,
                    vendorId,
                    orderId,
                    type: 'commission_reversed',
                    amount: -amount,
                    balanceBefore: iBefore,
                    balanceAfter: iWallet.reservedBalance,
                    status: 'completed',
                    description: reason || `Commission reversed for order #${orderId}`,
                    idempotencyKey: idempotencyKey ? `${idempotencyKey}_I` : undefined,
                },
            ],
            { session }
        );

        return { vendorWallet: vWallet, influencerWallet: iWallet };
    }

    /**
     * Submit Withdrawal Request (with strict Production Guardrails)
     */
    static async requestWithdrawal({ influencerId, amount, bankDetails, upiId, idempotencyKey }, session = null) {
        amount = roundVal(amount);
        const wallet = await this.getOrCreateInfluencerWallet(influencerId, session);

        // Guardrail 1: Wallet Lock Check
        if (wallet.walletLocked) {
            throw new ApiError(403, 'Your wallet is temporarily locked by Admin. Please contact support.');
        }

        // Guardrail 2: Single Active Pending Request Rule
        const existingPending = await WithdrawalRequest.findOne({ influencerId, status: 'pending' }).session(session);
        if (existingPending) {
            throw new ApiError(400, 'You already have an active pending withdrawal request. Please wait until it is processed.');
        }

        // Guardrail 3: Min Withdrawal Limit
        const globalSettings = await getGlobalCommissionSettingsData();
        const minLimit = globalSettings.minWithdrawalAmount || 100;
        if (amount < minLimit) {
            throw new ApiError(400, `Minimum withdrawal amount is ₹${minLimit}.`);
        }

        // Guardrail 4: Available Balance Validation
        if (wallet.availableBalance < amount) {
            throw new ApiError(400, `Insufficient available balance. Available: ₹${wallet.availableBalance}, Requested: ₹${amount}`);
        }

        if (wallet.processingWithdrawal) {
            throw new ApiError(400, 'Another withdrawal is currently being processed. Please try again.');
        }

        wallet.processingWithdrawal = true;
        const iBefore = wallet.availableBalance;
        wallet.availableBalance = roundVal(wallet.availableBalance - amount);
        wallet.pendingBalance = roundVal(wallet.pendingBalance + amount);
        await wallet.save({ session });

        const withdrawal = await WithdrawalRequest.create(
            [
                {
                    influencerId,
                    amount,
                    bankDetails,
                    upiId,
                    status: 'pending',
                    idempotencyKey,
                },
            ],
            { session }
        );

        await InfluencerWalletTransaction.create(
            [
                {
                    influencerId,
                    withdrawalId: withdrawal[0]._id,
                    type: 'withdrawal_request',
                    amount: -amount,
                    balanceBefore: iBefore,
                    balanceAfter: wallet.availableBalance,
                    status: 'pending',
                    description: `Withdrawal request of ₹${amount} submitted`,
                    idempotencyKey: idempotencyKey ? `${idempotencyKey}_TX` : undefined,
                },
            ],
            { session }
        );

        wallet.processingWithdrawal = false;
        await wallet.save({ session });

        return withdrawal[0];
    }
}
