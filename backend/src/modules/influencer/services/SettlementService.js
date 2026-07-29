import CommissionSettlement from '../models/CommissionSettlement.model.js';
import SettlementBatch from '../models/SettlementBatch.model.js';
import Order from '../../../models/Order.model.js';
import { CommissionEngineService } from './CommissionEngineService.js';
import { getGlobalCommissionSettingsData } from './commissionHelper.js';
import mongoose from 'mongoose';

export class SettlementService {
    /**
     * Run Settlement Engine Batch Process (Supports Retries & Failure Logging)
     */
    static async runSettlementBatch() {
        const globalSettings = await getGlobalCommissionSettingsData();
        if (globalSettings.autoSettlementEnabled === false) {
            console.log('[SettlementService] Auto-settlement is disabled by Admin.');
            return null;
        }

        const batchId = `BATCH_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const batch = new SettlementBatch({
            batchId,
            startedAt: new Date(),
            status: 'running',
            processedOrders: 0,
            successful: 0,
            failed: 0,
            logs: [],
        });
        await batch.save();

        try {
            // Find eligible pending or previously failed settlements (retryCount < 3)
            const eligibleSettlements = await CommissionSettlement.find({
                status: { $in: ['pending', 'failed'] },
                retryCount: { $lt: 3 },
                eligibleSettlementDate: { $lte: new Date() },
            });

            batch.processedOrders = eligibleSettlements.length;

            for (const settlement of eligibleSettlements) {
                const session = await mongoose.startSession();
                try {
                    session.startTransaction();

                    const order = await Order.findById(settlement.orderId).session(session);
                    if (order && (order.orderStatus === 'Cancelled' || order.orderStatus === 'Returned' || order.paymentStatus === 'Refunded')) {
                        await CommissionEngineService.reverseCommission(
                            settlement.orderId,
                            `Order ${order.orderStatus.toLowerCase()} before settlement release`,
                            session
                        );
                        batch.logs.push({
                            orderId: String(settlement.orderId),
                            status: 'reversed',
                            message: `Reversed due to order status: ${order.orderStatus}`,
                        });
                        batch.successful += 1;
                    } else {
                        await CommissionEngineService.releaseCommission(settlement._id, session);
                        batch.logs.push({
                            orderId: String(settlement.orderId),
                            status: 'settled',
                            message: `Successfully released ₹${settlement.commissionAmount} to influencer`,
                        });
                        batch.successful += 1;
                    }

                    await session.commitTransaction();
                } catch (err) {
                    await session.abortTransaction();
                    batch.failed += 1;

                    // Update retry tracking fields
                    settlement.status = 'failed';
                    settlement.retryCount = (settlement.retryCount || 0) + 1;
                    settlement.lastRetryAt = new Date();
                    settlement.lastError = err.message || 'Settlement execution failed';
                    settlement.nextRetryAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // Retry in 2 hours
                    await settlement.save();

                    batch.logs.push({
                        orderId: String(settlement.orderId),
                        status: 'failed',
                        message: err.message || 'Settlement execution failed',
                    });
                } finally {
                    session.endSession();
                }
            }

            batch.status = 'completed';
            batch.completedAt = new Date();
            await batch.save();

            return batch;
        } catch (err) {
            batch.status = 'failed';
            batch.completedAt = new Date();
            batch.logs.push({
                orderId: 'SYSTEM',
                status: 'failed',
                message: err.message || 'Batch execution fatal crash',
            });
            await batch.save();
            throw err;
        }
    }
}
