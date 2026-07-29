import FraudRule from '../models/FraudRule.model.js';
import FraudLog from '../models/FraudLog.model.js';
import ReferralClick from '../models/ReferralClick.model.js';
import Order from '../../../models/Order.model.js';
import WithdrawalRequest from '../models/WithdrawalRequest.model.js';

export class FraudDetectionService {
    /**
     * Evaluate event against Fraud Rules and calculate score
     */
    static async evaluateTransaction({ influencerId, vendorId, orderId, withdrawalId, ipAddress = '', deviceFingerprint = '' }) {
        const rules = await FraudRule.find({ enabled: true });
        const breakdown = [];
        let totalScore = 0;

        for (const rule of rules) {
            let triggered = false;
            let reason = '';

            if (rule.code === 'SELF_REFERRAL' && influencerId && orderId) {
                const order = await Order.findById(orderId);
                if (order && order.user && String(order.user) === String(influencerId)) {
                    triggered = true;
                    reason = 'Order placed by creator self account.';
                }
            } else if (rule.code === 'CLICK_VELOCITY' && influencerId) {
                const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
                const recentClicks = await ReferralClick.countDocuments({
                    influencerId,
                    createdAt: { $gte: tenMinAgo },
                });
                if (recentClicks > rule.threshold) {
                    triggered = true;
                    reason = `Extreme click velocity: ${recentClicks} clicks in 10 mins.`;
                }
            } else if (rule.code === 'WITHDRAWAL_SPIKE' && withdrawalId) {
                const withdrawal = await WithdrawalRequest.findById(withdrawalId);
                if (withdrawal && withdrawal.amount > (rule.threshold || 50000)) {
                    triggered = true;
                    reason = `Large single withdrawal request (₹${withdrawal.amount}).`;
                }
            }

            if (triggered) {
                totalScore += rule.weight;
                breakdown.push({
                    rule: rule.name,
                    score: rule.weight,
                    reason,
                });
            }
        }

        let fraudLevel = 'low';
        if (totalScore >= 80) fraudLevel = 'critical';
        else if (totalScore >= 50) fraudLevel = 'high';
        else if (totalScore >= 20) fraudLevel = 'medium';

        let fraudLog = null;
        if (totalScore > 0) {
            fraudLog = await FraudLog.create({
                influencerId,
                vendorId,
                orderId,
                withdrawalId,
                fraudType: breakdown.map((b) => b.rule).join(', ') || 'Risk Flag',
                fraudScore: totalScore,
                fraudLevel,
                breakdown,
                ipAddress,
                deviceFingerprint,
                status: totalScore >= 80 ? 'investigating' : 'pending',
                timeline: [
                    {
                        event: `Risk Evaluation Completed. Score: ${totalScore} (${fraudLevel.toUpperCase()})`,
                        timestamp: new Date(),
                        performedBy: 'System Engine',
                    },
                ],
            });
        }

        return { totalScore, fraudLevel, breakdown, fraudLog };
    }

    /**
     * Update Investigation Workflow
     */
    static async updateCaseStatus(caseId, status, actionTaken = '', adminId = null) {
        const caseLog = await FraudLog.findById(caseId);
        if (!caseLog) throw new Error('Fraud case not found.');

        caseLog.status = status;
        if (actionTaken) caseLog.actionTaken = actionTaken;
        if (adminId) caseLog.reviewedBy = adminId;
        caseLog.reviewedAt = new Date();

        caseLog.timeline.push({
            event: `Status updated to ${status}. Action: ${actionTaken || 'None'}`,
            timestamp: new Date(),
            performedBy: adminId ? `Admin (${adminId})` : 'Admin',
        });

        await caseLog.save();
        return caseLog;
    }
}
