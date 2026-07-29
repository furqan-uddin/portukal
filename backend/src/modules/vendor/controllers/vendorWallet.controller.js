import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import VendorWallet from '../../influencer/models/VendorWallet.model.js';
import VendorWalletLedger from '../../influencer/models/VendorWalletLedger.model.js';
import CommissionSettlement from '../../influencer/models/CommissionSettlement.model.js';
import { WalletService } from '../../influencer/services/WalletService.js';

// GET /api/vendor/influencer-wallet/summary
export const getVendorInfluencerWalletSummary = asyncHandler(async (req, res) => {
    const vendorId = req.user.vendorId || req.user.id;
    const wallet = await WalletService.getOrCreateVendorWallet(vendorId);

    // Calculate today's released commission
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const releasedToday = await VendorWalletLedger.aggregate([
        {
            $match: {
                vendorId: wallet.vendorId,
                type: 'release',
                createdAt: { $gte: startOfToday },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' },
            },
        },
    ]);

    const releasedTodayAmount = releasedToday.length > 0 ? releasedToday[0].total : 0;

    res.status(200).json(
        new ApiResponse(
            200,
            {
                wallet,
                releasedToday: releasedTodayAmount,
            },
            'Vendor influencer wallet summary retrieved successfully.'
        )
    );
});

// GET /api/vendor/influencer-wallet/ledger
export const getVendorLedger = asyncHandler(async (req, res) => {
    const vendorId = req.user.vendorId || req.user.id;
    const { page = 1, limit = 20, type } = req.query;

    const query = { vendorId };
    if (type) query.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    const [ledger, total] = await Promise.all([
        VendorWalletLedger.find(query)
            .populate('orderId', 'orderId totalAmount')
            .populate('influencerId', 'name referralCode slug')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        VendorWalletLedger.countDocuments(query),
    ]);

    res.status(200).json(
        new ApiResponse(
            200,
            {
                ledger,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit)),
                },
            },
            'Vendor wallet ledger entries fetched successfully.'
        )
    );
});

// GET /api/vendor/influencer-wallet/settlements
export const getVendorSettlements = asyncHandler(async (req, res) => {
    const vendorId = req.user.vendorId || req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    const query = { vendorId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [settlements, total] = await Promise.all([
        CommissionSettlement.find(query)
            .populate('orderId', 'orderId totalAmount')
            .populate('influencerId', 'name referralCode slug')
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
            'Vendor settlements fetched successfully.'
        )
    );
});
