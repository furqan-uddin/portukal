import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Reel from '../../../models/Reel.model.js';
import ReelInteraction from '../models/ReelInteraction.model.js';
import ReelAnalyticsDaily from '../models/ReelAnalyticsDaily.model.js';
import { deleteReelFromCloudinary } from '../services/cloudinaryReel.service.js';
import { getReelAggregatedStats } from '../services/reelAnalytics.service.js';
import Notification from '../../influencer/models/Notification.model.js';

// ─── Listing ─────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/reels
 */
export const listReels = asyncHandler(async (req, res) => {
    const {
        status = 'pending', page = 1, limit = 20,
        search, vendorId, category, sort = '-createdAt',
    } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (vendorId) filter.vendorId = vendorId;
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const [reels, total] = await Promise.all([
        Reel.find(filter)
            .populate('vendorId', 'storeName logoUrl email')
            .populate('productId', 'name slug price')
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        Reel.countDocuments(filter),
    ]);

    // Status counts
    const statusCounts = await Reel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const counts = {};
    statusCounts.forEach((s) => { counts[s._id] = s.count; });

    res.status(200).json(new ApiResponse(200, { reels, total, page: Number(page), limit: Number(limit), statusCounts: counts }, 'Reels fetched.'));
});

/**
 * GET /api/admin/reels/:id
 */
export const getReelDetail = asyncHandler(async (req, res) => {
    const reel = await Reel.findById(req.params.id)
        .populate('vendorId', 'storeName logoUrl email phone')
        .populate('productId', 'name slug price images')
        .populate('approvedBy', 'name email')
        .lean();
    if (!reel) throw new ApiError(404, 'Reel not found.');
    const analytics = await getReelAggregatedStats(reel._id);
    res.status(200).json(new ApiResponse(200, { ...reel, analytics }, 'Reel detail fetched.'));
});

// ─── Moderation Actions ────────────────────────────────────────────────────

const notifyVendor = async (vendorId, type, title, message, reelId) => {
    try {
        await Notification.create({
            recipientType: 'vendor',
            recipientId: vendorId,
            recipientModel: 'Vendor',
            title,
            message,
            category: 'system',
            data: { reelId, notificationType: type },
        });
    } catch { /* non-fatal */ }
};

/**
 * PATCH /api/admin/reels/:id/approve
 */
export const approveReel = asyncHandler(async (req, res) => {
    const reel = await Reel.findById(req.params.id);
    if (!reel) throw new ApiError(404, 'Reel not found.');
    if (reel.status !== 'pending') throw new ApiError(400, `Cannot approve a reel with status "${reel.status}".`);

    reel.status = 'approved';
    reel.approvedBy = req.user.id;
    reel.approvedAt = new Date();
    reel.publishedAt = reel.scheduledPublishAt || new Date();
    reel.rejectionReason = undefined;
    reel.changeRequest = undefined;

    // If this is a new version, retire the parent
    if (reel.parentReelId) {
        await Reel.findByIdAndUpdate(reel.parentReelId, { status: 'archived', isLatestVersion: false });
        reel.isLatestVersion = true;
    }

    await reel.save();

    await notifyVendor(reel.vendorId, 'reel_approved', '🎉 Reel Approved!', `Your reel "${reel.title}" has been approved and is now live.`, reel._id);

    res.status(200).json(new ApiResponse(200, reel, 'Reel approved and published.'));
});

/**
 * PATCH /api/admin/reels/:id/reject
 */
export const rejectReel = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    if (!reason || reason.trim().length < 5) throw new ApiError(400, 'A rejection reason (min 5 chars) is required.');

    const reel = await Reel.findById(req.params.id);
    if (!reel) throw new ApiError(404, 'Reel not found.');
    if (!['pending', 'approved'].includes(reel.status)) throw new ApiError(400, `Cannot reject a reel with status "${reel.status}".`);

    reel.status = 'rejected';
    reel.rejectionReason = reason.trim();
    reel.moderatedBy = req.user.id;
    reel.moderatedAt = new Date();
    await reel.save();

    await notifyVendor(reel.vendorId, 'reel_rejected', '⚠️ Reel Rejected', `Your reel "${reel.title}" was rejected: ${reason}`, reel._id);

    res.status(200).json(new ApiResponse(200, reel, 'Reel rejected.'));
});

/**
 * PATCH /api/admin/reels/:id/request-changes
 */
export const requestChanges = asyncHandler(async (req, res) => {
    const { changes } = req.body;
    if (!changes || changes.trim().length < 10) throw new ApiError(400, 'Change request details (min 10 chars) are required.');

    const reel = await Reel.findById(req.params.id);
    if (!reel) throw new ApiError(404, 'Reel not found.');
    if (reel.status !== 'pending') throw new ApiError(400, 'Only pending reels can have changes requested.');

    reel.status = 'rejected';
    reel.changeRequest = changes.trim();
    reel.rejectionReason = `Changes requested: ${changes.trim()}`;
    await reel.save();

    await notifyVendor(reel.vendorId, 'reel_changes_requested', '📝 Changes Requested', `Admin has requested changes to your reel "${reel.title}": ${changes}`, reel._id);

    res.status(200).json(new ApiResponse(200, reel, 'Change request sent to vendor.'));
});

/**
 * PATCH /api/admin/reels/:id/feature
 */
export const featureReel = asyncHandler(async (req, res) => {
    const reel = await Reel.findById(req.params.id);
    if (!reel) throw new ApiError(404, 'Reel not found.');
    if (reel.status !== 'approved') throw new ApiError(400, 'Only approved reels can be featured.');
    reel.isFeatured = !reel.isFeatured;
    reel.featuredAt = reel.isFeatured ? new Date() : undefined;
    await reel.save();

    if (reel.isFeatured) {
        await notifyVendor(reel.vendorId, 'reel_featured', '⭐ Reel Featured!', `Your reel "${reel.title}" has been featured on the platform!`, reel._id);
    }

    res.status(200).json(new ApiResponse(200, reel, `Reel ${reel.isFeatured ? 'featured' : 'unfeatured'}.`));
});

/**
 * PATCH /api/admin/reels/:id/hide
 */
export const hideReel = asyncHandler(async (req, res) => {
    const reel = await Reel.findById(req.params.id);
    if (!reel) throw new ApiError(404, 'Reel not found.');
    reel.status = 'hidden';
    await reel.save();
    res.status(200).json(new ApiResponse(200, reel, 'Reel hidden from public feed.'));
});

/**
 * PATCH /api/admin/reels/:id/restore
 */
export const restoreReel = asyncHandler(async (req, res) => {
    const reel = await Reel.findById(req.params.id);
    if (!reel) throw new ApiError(404, 'Reel not found.');
    if (!['hidden', 'archived'].includes(reel.status)) throw new ApiError(400, 'Only hidden or archived reels can be restored.');
    reel.status = 'approved';
    await reel.save();
    res.status(200).json(new ApiResponse(200, reel, 'Reel restored to live feed.'));
});

/**
 * DELETE /api/admin/reels/:id
 * Hard delete from DB + Cloudinary.
 */
export const deleteReel = asyncHandler(async (req, res) => {
    const reel = await Reel.findById(req.params.id);
    if (!reel) throw new ApiError(404, 'Reel not found.');
    await deleteReelFromCloudinary(reel.video?.publicId, reel.thumbnail?.publicId);
    await ReelInteraction.deleteMany({ reelId: reel._id });
    await ReelAnalyticsDaily.deleteMany({ reelId: reel._id });
    await Reel.findByIdAndDelete(reel._id);
    res.status(200).json(new ApiResponse(200, null, 'Reel permanently deleted.'));
});

// ─── Analytics ────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/reels/analytics
 * Platform-wide reel analytics dashboard.
 */
export const getAdminReelAnalytics = asyncHandler(async (req, res) => {
    const { range = '30d' } = req.query;
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const sinceStr = since.toISOString().split('T')[0];

    const [statusCounts, platformAgg, topReels, topVendors] = await Promise.all([
        Reel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        ReelAnalyticsDaily.aggregate([
            { $match: { date: { $gte: sinceStr } } },
            {
                $group: {
                    _id: null,
                    totalViews:    { $sum: '$totalViews' },
                    productClicks: { $sum: '$productClicks' },
                    orders:        { $sum: '$orders' },
                    revenue:       { $sum: '$revenue' },
                    commission:    { $sum: '$commission' },
                    likes:         { $sum: '$likes' },
                    shares:        { $sum: '$shares' },
                },
            },
        ]),
        // Top reels by views in range
        ReelAnalyticsDaily.aggregate([
            { $match: { date: { $gte: sinceStr } } },
            { $group: { _id: '$reelId', totalViews: { $sum: '$totalViews' }, orders: { $sum: '$orders' } } },
            { $sort: { totalViews: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'reels', localField: '_id', foreignField: '_id', as: 'reel' } },
            { $unwind: '$reel' },
            { $project: { title: '$reel.title', thumbnailUrl: '$reel.thumbnailUrl', totalViews: 1, orders: 1 } },
        ]),
        // Top vendors by revenue
        ReelAnalyticsDaily.aggregate([
            { $match: { date: { $gte: sinceStr } } },
            { $group: { _id: '$vendorId', revenue: { $sum: '$revenue' }, totalViews: { $sum: '$totalViews' } } },
            { $sort: { revenue: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'vendors', localField: '_id', foreignField: '_id', as: 'vendor' } },
            { $unwind: '$vendor' },
            { $project: { storeName: '$vendor.storeName', revenue: 1, totalViews: 1 } },
        ]),
    ]);

    const counts = {};
    statusCounts.forEach((s) => { counts[s._id] = s.count; });

    res.status(200).json(new ApiResponse(200, {
        statusCounts: counts,
        platform: platformAgg[0] || {},
        topReels,
        topVendors,
    }, 'Admin reel analytics fetched.'));
});
