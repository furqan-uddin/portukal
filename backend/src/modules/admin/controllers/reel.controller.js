import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Reel from '../../../models/Reel.model.js';

// GET /api/admin/reels/pending
export const getPendingReels = asyncHandler(async (req, res) => {
    const reels = await Reel.find({ status: 'pending' })
        .populate('userId', 'name email')
        .populate('vendorId', 'storeName')
        .sort({ createdAt: 1 });
    res.status(200).json(new ApiResponse(200, reels, 'Pending reels fetched.'));
});

// PATCH /api/admin/reels/:id/moderate
export const moderateReel = asyncHandler(async (req, res) => {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) throw new ApiError(400, 'Invalid status.');

    const reel = await Reel.findByIdAndUpdate(
        req.params.id,
        { 
            status, 
            moderatedBy: req.user.id,
            moderatedAt: new Date()
        },
        { new: true }
    );

    if (!reel) throw new ApiError(404, 'Reel not found.');

    res.status(200).json(new ApiResponse(200, reel, `Reel ${status}.`));
});
