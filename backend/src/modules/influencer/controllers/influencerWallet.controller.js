import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import InfluencerWallet from '../models/InfluencerWallet.model.js';
import InfluencerWalletTransaction from '../models/InfluencerWalletTransaction.model.js';
import WithdrawalRequest from '../models/WithdrawalRequest.model.js';
import CommissionSettlement from '../models/CommissionSettlement.model.js';
import { WalletService } from '../services/WalletService.js';
import mongoose from 'mongoose';

// GET /api/influencer/wallet/summary
export const getInfluencerWalletSummary = asyncHandler(async (req, res) => {
    const influencerId = req.user.id;
    const wallet = await WalletService.getOrCreateInfluencerWallet(influencerId);

    // Calculate upcoming pending settlements
    const pendingSettlements = await CommissionSettlement.find({ influencerId, status: 'pending' })
        .sort({ eligibleSettlementDate: 1 })
        .limit(5);

    const nextSettlementDate = pendingSettlements.length > 0 ? pendingSettlements[0].eligibleSettlementDate : null;

    res.status(200).json(
        new ApiResponse(
            200,
            {
                wallet,
                nextSettlementDate,
                pendingSettlementsCount: pendingSettlements.length,
            },
            'Influencer wallet summary retrieved successfully.'
        )
    );
});

// GET /api/influencer/wallet/transactions
export const getInfluencerWalletTransactions = asyncHandler(async (req, res) => {
    const influencerId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;

    const query = { influencerId };
    if (type) query.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
        InfluencerWalletTransaction.find(query)
            .populate('orderId', 'orderId totalAmount')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        InfluencerWalletTransaction.countDocuments(query),
    ]);

    res.status(200).json(
        new ApiResponse(
            200,
            {
                transactions,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit)),
                },
            },
            'Wallet transactions fetched successfully.'
        )
    );
});

// GET /api/influencer/wallet/settlements
export const getInfluencerSettlements = asyncHandler(async (req, res) => {
    const influencerId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    const query = { influencerId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [settlements, total] = await Promise.all([
        CommissionSettlement.find(query)
            .populate('orderId', 'orderId totalAmount items')
            .populate('vendorId', 'storeName storeLogo')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        CommissionSettlement.countDocuments(query),
    ]);

    res.status(200).json(
        new ApiResponse(
            200,
            {
                settlements,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit)),
                },
            },
            'Commission settlements fetched successfully.'
        )
    );
});

// POST /api/influencer/wallet/withdraw
export const requestWithdrawal = asyncHandler(async (req, res) => {
    const influencerId = req.user.id;
    const { amount, bankDetails, upiId } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
        throw new ApiError(400, 'Valid withdrawal amount is required.');
    }

    const idempotencyKey = `WITHDRAW_${influencerId}_${Date.now()}`;

    const session = await mongoose.startSession();
    let withdrawal;
    try {
        session.startTransaction();
        withdrawal = await WalletService.requestWithdrawal(
            {
                influencerId,
                amount: numAmount,
                bankDetails,
                upiId,
                idempotencyKey,
            },
            session
        );
        await session.commitTransaction();
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }

    res.status(200).json(new ApiResponse(200, { withdrawal }, 'Withdrawal request submitted successfully.'));
});

// GET /api/influencer/wallet/withdrawals
export const getInfluencerWithdrawals = asyncHandler(async (req, res) => {
    const influencerId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    const query = { influencerId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [withdrawals, total] = await Promise.all([
        WithdrawalRequest.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        WithdrawalRequest.countDocuments(query),
    ]);

    res.status(200).json(
        new ApiResponse(
            200,
            {
                withdrawals,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit)),
                },
            },
            'Withdrawal requests fetched successfully.'
        )
    );
});
