import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import WithdrawalRequest from '../../influencer/models/WithdrawalRequest.model.js';
import InfluencerWallet from '../../influencer/models/InfluencerWallet.model.js';
import InfluencerWalletTransaction from '../../influencer/models/InfluencerWalletTransaction.model.js';
import { SettlementService } from '../../influencer/services/SettlementService.js';
import { roundVal } from '../../influencer/services/WalletService.js';
import { NotificationService } from '../../influencer/services/NotificationService.js';
import mongoose from 'mongoose';

// GET /api/admin/withdrawals
export const getAllWithdrawalRequests = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};
    if (status && status !== 'all') query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [withdrawals, total, statsAgg] = await Promise.all([
        WithdrawalRequest.find(query)
            .populate('influencerId', 'name email mobile referralCode profileImage')
            .populate('approvedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        WithdrawalRequest.countDocuments(query),
        WithdrawalRequest.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                },
            },
        ]),
    ]);

    const stats = {
        pendingCount: 0,
        pendingAmount: 0,
        approvedCount: 0,
        approvedAmount: 0,
        paidCount: 0,
        paidAmount: 0,
        rejectedCount: 0,
    };

    statsAgg.forEach((item) => {
        if (item._id === 'pending') {
            stats.pendingCount = item.count;
            stats.pendingAmount = roundVal(item.totalAmount);
        }
        if (item._id === 'approved') {
            stats.approvedCount = item.count;
            stats.approvedAmount = roundVal(item.totalAmount);
        }
        if (item._id === 'paid') {
            stats.paidCount = item.count;
            stats.paidAmount = roundVal(item.totalAmount);
        }
        if (item._id === 'rejected') {
            stats.rejectedCount = item.count;
        }
    });

    res.status(200).json(
        new ApiResponse(
            200,
            {
                withdrawals,
                stats,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit)),
                },
            },
            'Admin withdrawal requests fetched successfully.'
        )
    );
});

// PATCH /api/admin/withdrawals/:id/status
export const updateWithdrawalStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, remarks, bankTransactionId } = req.body;
    const adminId = req.user.id;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const clientDevice = req.headers['user-agent'] || 'desktop';

    if (!['approved', 'rejected', 'paid', 'cancelled'].includes(status)) {
        throw new ApiError(400, 'Invalid status specified.');
    }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const withdrawal = await WithdrawalRequest.findById(id).session(session);
        if (!withdrawal) {
            throw new ApiError(404, 'Withdrawal request not found.');
        }

        const wallet = await InfluencerWallet.findOne({ influencerId: withdrawal.influencerId }).session(session);
        if (!wallet) {
            throw new ApiError(404, 'Influencer wallet not found.');
        }

        const amount = withdrawal.amount;

        if (status === 'approved' && withdrawal.status === 'pending') {
            withdrawal.status = 'approved';
            withdrawal.approvedBy = adminId;
            withdrawal.approvedIp = clientIp;
            withdrawal.approvedDevice = clientDevice;
            if (remarks) withdrawal.remarks = remarks;

            await InfluencerWalletTransaction.create(
                [
                    {
                        influencerId: withdrawal.influencerId,
                        withdrawalId: withdrawal._id,
                        type: 'withdrawal_approved',
                        amount: 0,
                        balanceBefore: wallet.availableBalance,
                        balanceAfter: wallet.availableBalance,
                        status: 'completed',
                        description: `Withdrawal request #${withdrawal._id} approved by admin`,
                        createdBy: adminId,
                    },
                ],
                { session }
            );
        } else if (status === 'paid' && ['pending', 'approved'].includes(withdrawal.status)) {
            withdrawal.status = 'paid';
            withdrawal.paidAt = new Date();
            if (bankTransactionId) withdrawal.bankTransactionId = bankTransactionId;
            if (remarks) withdrawal.remarks = remarks;

            wallet.pendingBalance = roundVal(Math.max(0, wallet.pendingBalance - amount));
            wallet.withdrawn = roundVal(wallet.withdrawn + amount);
            wallet.totalWithdrawals = (wallet.totalWithdrawals || 0) + 1;
            await wallet.save({ session });

            await InfluencerWalletTransaction.create(
                [
                    {
                        influencerId: withdrawal.influencerId,
                        withdrawalId: withdrawal._id,
                        type: 'withdrawal_paid',
                        amount: -amount,
                        balanceBefore: wallet.availableBalance,
                        balanceAfter: wallet.availableBalance,
                        status: 'completed',
                        reference: bankTransactionId || '',
                        description: `Withdrawal payout of ₹${amount} completed (Ref: ${bankTransactionId || 'N/A'})`,
                        createdBy: adminId,
                    },
                ],
                { session }
            );
        } else if ((status === 'rejected' || status === 'cancelled') && ['pending', 'approved'].includes(withdrawal.status)) {
            withdrawal.status = status;
            withdrawal.rejectedBy = adminId;
            if (remarks) withdrawal.remarks = remarks;

            // Refund pending amount back to available balance
            const iBefore = wallet.availableBalance;
            wallet.pendingBalance = roundVal(Math.max(0, wallet.pendingBalance - amount));
            wallet.availableBalance = roundVal(wallet.availableBalance + amount);
            await wallet.save({ session });

            await InfluencerWalletTransaction.create(
                [
                    {
                        influencerId: withdrawal.influencerId,
                        withdrawalId: withdrawal._id,
                        type: 'withdrawal_rejected',
                        amount: amount,
                        balanceBefore: iBefore,
                        balanceAfter: wallet.availableBalance,
                        status: 'completed',
                        description: `Withdrawal request #${withdrawal._id} ${status} (${remarks || 'No reason specified'})`,
                        createdBy: adminId,
                    },
                ],
                { session }
            );
        }

        await withdrawal.save({ session });
        await session.commitTransaction();

        // Dispatch In-App Notification to Influencer
        try {
            await NotificationService.createNotification({
                recipientType: 'influencer',
                recipientId: withdrawal.influencerId,
                title: status === 'approved' ? '✅ Payout Approved' : status === 'paid' ? '💰 Payout Transferred!' : '❌ Payout Rejected',
                message: status === 'approved'
                    ? `Your withdrawal request of ₹${amount} has been approved by admin.`
                    : status === 'paid'
                    ? `₹${amount} has been transferred to your account (Ref UTR: ${bankTransactionId || 'N/A'}).`
                    : `Your withdrawal request of ₹${amount} was rejected. Funds returned to your available balance.`,
                category: 'financial',
                priority: 'high',
            });
        } catch (e) {
            console.error('Failed to create withdrawal notification:', e.message);
        }

        res.status(200).json(new ApiResponse(200, { withdrawal }, `Withdrawal request marked as ${status}.`));
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
});

// POST /api/admin/withdrawals/bulk-status
export const bulkUpdateWithdrawals = asyncHandler(async (req, res) => {
    const { ids, status, remarks } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !status) {
        throw new ApiError(400, 'Array of withdrawal IDs and target status are required.');
    }

    let successCount = 0;
    for (const id of ids) {
        try {
            req.params = { id };
            req.body = { status, remarks };
            await updateWithdrawalStatus(req, res);
            successCount += 1;
        } catch (e) {
            console.error(`Bulk update error for ${id}:`, e);
        }
    }

    res.status(200).json(new ApiResponse(200, { successCount }, `Processed ${successCount} withdrawal updates.`));
});

// POST /api/settlements/run
export const triggerSettlementRun = asyncHandler(async (req, res) => {
    const batch = await SettlementService.runSettlementBatch();
    res.status(200).json(new ApiResponse(200, { batch }, 'Settlement batch executed successfully.'));
});

// GET /api/admin/withdrawals/export-csv
export const exportWithdrawalsCSV = asyncHandler(async (req, res) => {
    const withdrawals = await WithdrawalRequest.find()
        .populate('influencerId', 'name email referralCode')
        .sort({ createdAt: -1 });

    let csv = 'ID,Influencer Name,Email,Referral Code,Amount,Status,UPI ID,Bank Account,Requested At,Paid At\n';
    withdrawals.forEach((w) => {
        csv += `"${w._id}","${w.influencerId?.name || ''}","${w.influencerId?.email || ''}","${w.influencerId?.referralCode || ''}",${w.amount},"${w.status}","${w.upiId || ''}","${w.bankDetails?.accountNumber || ''}","${w.requestedAt ? w.requestedAt.toISOString() : ''}","${w.paidAt ? w.paidAt.toISOString() : ''}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="influencer_withdrawals.csv"');
    res.status(200).send(csv);
});
