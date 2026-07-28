import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Affiliate from '../../../models/Affiliate.model.js';

// GET /api/admin/affiliates/payouts/pending
export const getPendingPayouts = asyncHandler(async (req, res) => {
    const affiliates = await Affiliate.find({ 'payoutHistory.status': 'pending' })
        .populate('userId', 'name email bankDetails');
    
    const pendingPayouts = affiliates.flatMap(a => 
        a.payoutHistory
            .filter(p => p.status === 'pending')
            .map(p => ({ ...p.toObject(), affiliateId: a._id, user: a.userId }))
    );

    res.status(200).json(new ApiResponse(200, pendingPayouts, 'Pending payouts fetched.'));
});

// PATCH /api/admin/affiliates/:id/payouts/:payoutId
export const completePayout = asyncHandler(async (req, res) => {
    const { transactionId, status = 'completed' } = req.body;
    
    const affiliate = await Affiliate.findOne({ _id: req.params.id });
    if (!affiliate) throw new ApiError(404, 'Affiliate not found.');

    const payout = affiliate.payoutHistory.id(req.params.payoutId);
    if (!payout) throw new ApiError(404, 'Payout record not found.');

    payout.status = status;
    payout.transactionId = transactionId;
    
    if (status === 'completed') {
        affiliate.balance -= payout.amount;
    }

    await affiliate.save();
    res.status(200).json(new ApiResponse(200, affiliate, 'Payout processed.'));
});
