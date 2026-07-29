import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Reel from '../../../models/Reel.model.js';
import ReelInteraction from '../models/ReelInteraction.model.js';
import ReelAnalyticsDaily from '../models/ReelAnalyticsDaily.model.js';
import { uploadReelToCloudinary, deleteReelFromCloudinary, validateVideoFile } from '../services/cloudinaryReel.service.js';
import { getReelAggregatedStats } from '../services/reelAnalytics.service.js';

// ─── Upload / Draft ──────────────────────────────────────────────────────────

/**
 * POST /api/vendor/reels/upload
 * Upload video to Cloudinary & save as draft.
 */
export const uploadReel = asyncHandler(async (req, res) => {
    validateVideoFile(req.file);

    const vendorId = req.user.id;
    const { title, description, caption, productId, taggedProducts, category, tags, visibility } = req.body;

    if (!title || title.trim().length === 0) throw new ApiError(400, 'Reel title is required.');

    // Upload to Cloudinary
    const { video, thumbnail } = await uploadReelToCloudinary(req.file.path, vendorId);

    // Parse taggedProducts if sent as JSON string
    let parsedTaggedProducts = [];
    if (taggedProducts) {
        try {
            parsedTaggedProducts = typeof taggedProducts === 'string' ? JSON.parse(taggedProducts) : taggedProducts;
        } catch {
            parsedTaggedProducts = [];
        }
    }

    const reel = await Reel.create({
        title: title.trim(),
        description: description?.trim(),
        caption: caption?.trim(),
        vendorId,
        productId: productId || (parsedTaggedProducts[0]?.productId),
        taggedProducts: parsedTaggedProducts,
        video,
        videoUrl: video.secureUrl,
        thumbnail,
        thumbnailUrl: thumbnail.secureUrl,
        status: 'draft',
        category: category?.trim(),
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
        visibility: visibility || 'public',
    });

    res.status(201).json(new ApiResponse(201, reel, 'Reel uploaded as draft. Preview and submit for review when ready.'));
});

/**
 * PUT /api/vendor/reels/:id
 * Update reel metadata (only if draft or change-requested).
 */
export const updateReel = asyncHandler(async (req, res) => {
    const reel = await Reel.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!reel) throw new ApiError(404, 'Reel not found.');
    if (!['draft', 'preview', 'rejected'].includes(reel.status)) {
        throw new ApiError(400, `Cannot edit a reel with status "${reel.status}". Only drafts and rejected reels can be edited.`);
    }

    const { title, description, caption, productId, taggedProducts, category, tags, visibility } = req.body;

    if (title) reel.title = title.trim();
    if (description !== undefined) reel.description = description?.trim();
    if (caption !== undefined) reel.caption = caption?.trim();
    if (productId) reel.productId = productId;
    if (taggedProducts) {
        try { reel.taggedProducts = typeof taggedProducts === 'string' ? JSON.parse(taggedProducts) : taggedProducts; } catch {}
    }
    if (category) reel.category = category.trim();
    if (tags) reel.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
    if (visibility) reel.visibility = visibility;

    await reel.save();
    res.status(200).json(new ApiResponse(200, reel, 'Reel updated successfully.'));
});

/**
 * PATCH /api/vendor/reels/:id/preview
 * Move reel from draft → preview (vendor internal review before submission).
 */
export const previewReel = asyncHandler(async (req, res) => {
    const reel = await Reel.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!reel) throw new ApiError(404, 'Reel not found.');
    if (reel.status !== 'draft') throw new ApiError(400, 'Only draft reels can be previewed.');
    reel.status = 'preview';
    await reel.save();
    res.status(200).json(new ApiResponse(200, reel, 'Reel moved to preview. Submit for admin review when ready.'));
});

/**
 * PATCH /api/vendor/reels/:id/submit
 * Submit reel for admin review (draft/preview/rejected → pending).
 */
export const submitReel = asyncHandler(async (req, res) => {
    const reel = await Reel.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!reel) throw new ApiError(404, 'Reel not found.');
    if (!['draft', 'preview', 'rejected'].includes(reel.status)) {
        throw new ApiError(400, `Reel with status "${reel.status}" cannot be submitted for review.`);
    }
    reel.status = 'pending';
    reel.rejectionReason = undefined;
    await reel.save();
    res.status(200).json(new ApiResponse(200, reel, 'Reel submitted for admin review.'));
});

/**
 * PATCH /api/vendor/reels/:id/schedule
 * Schedule a reel for future publication (approved reels only).
 */
export const scheduleReel = asyncHandler(async (req, res) => {
    const { scheduledPublishAt } = req.body;
    if (!scheduledPublishAt) throw new ApiError(400, 'scheduledPublishAt date is required.');
    const schedDate = new Date(scheduledPublishAt);
    if (isNaN(schedDate.getTime()) || schedDate <= new Date()) {
        throw new ApiError(400, 'scheduledPublishAt must be a valid future date.');
    }
    const reel = await Reel.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!reel) throw new ApiError(404, 'Reel not found.');
    if (reel.status !== 'approved') throw new ApiError(400, 'Only approved reels can be scheduled.');
    reel.scheduledPublishAt = schedDate;
    await reel.save();
    res.status(200).json(new ApiResponse(200, reel, `Reel scheduled for publication on ${schedDate.toISOString()}.`));
});

/**
 * POST /api/vendor/reels/:id/new-version
 * Create a new version of an approved reel (keeps current live until new one is approved).
 */
export const createNewVersion = asyncHandler(async (req, res) => {
    validateVideoFile(req.file);
    const original = await Reel.findOne({ _id: req.params.id, vendorId: req.user.id, status: 'approved' });
    if (!original) throw new ApiError(404, 'Approved reel not found.');

    const { video, thumbnail } = await uploadReelToCloudinary(req.file.path, req.user.id);

    const newVersion = await Reel.create({
        ...original.toObject(),
        _id: undefined,
        video,
        videoUrl: video.secureUrl,
        thumbnail,
        thumbnailUrl: thumbnail.secureUrl,
        status: 'pending',
        version: original.version + 1,
        parentReelId: original._id,
        isLatestVersion: false,   // becomes true after admin approval
        approvedBy: undefined,
        approvedAt: undefined,
        publishedAt: undefined,
        trendingScore: 0,
        createdAt: undefined,
        updatedAt: undefined,
    });

    res.status(201).json(new ApiResponse(201, newVersion, 'New version submitted for admin review. Current live reel remains active until this version is approved.'));
});

/**
 * GET /api/vendor/reels
 * List all reels for the authenticated vendor.
 */
export const listMyReels = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const filter = { vendorId: req.user.id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [reels, total] = await Promise.all([
        Reel.find(filter)
            .populate('productId', 'name slug price images')
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        Reel.countDocuments(filter),
    ]);

    const reelIds = reels.map((r) => r._id);
    const [viewCounts, clickCounts] = await Promise.all([
        ReelInteraction.aggregate([
            { $match: { reelId: { $in: reelIds }, type: 'view' } },
            { $group: { _id: '$reelId', count: { $sum: 1 } } },
        ]),
        ReelInteraction.aggregate([
            { $match: { reelId: { $in: reelIds }, type: 'click' } },
            { $group: { _id: '$reelId', count: { $sum: 1 } } },
        ]),
    ]);

    const viewMap = {};
    const clickMap = {};
    viewCounts.forEach((v) => { viewMap[v._id.toString()] = v.count; });
    clickCounts.forEach((c) => { clickMap[c._id.toString()] = c.count; });

    const enriched = reels.map((reel) => ({
        ...reel,
        viewsCount: viewMap[reel._id.toString()] || 0,
        clicksCount: clickMap[reel._id.toString()] || 0,
    }));

    res.status(200).json(new ApiResponse(200, { reels: enriched, total, page: Number(page), limit: Number(limit) }, 'Reels fetched.'));
});

/**
 * GET /api/vendor/reels/:id
 * Get single reel with analytics.
 */
export const getReelById = asyncHandler(async (req, res) => {
    const reel = await Reel.findOne({ _id: req.params.id, vendorId: req.user.id })
        .populate('productId', 'name slug price images')
        .lean();
    if (!reel) throw new ApiError(404, 'Reel not found.');

    const stats = await getReelAggregatedStats(reel._id);
    res.status(200).json(new ApiResponse(200, { ...reel, analytics: stats }, 'Reel fetched.'));
});

/**
 * GET /api/vendor/reels/:id/analytics
 * Get detailed analytics for a reel.
 */
export const getReelAnalytics = asyncHandler(async (req, res) => {
    const { range = '30d' } = req.query;
    const reel = await Reel.findOne({ _id: req.params.id, vendorId: req.user.id }, '_id vendorId title status');
    if (!reel) throw new ApiError(404, 'Reel not found.');

    // Date range
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const sinceStr = since.toISOString().split('T')[0];

    const daily = await ReelAnalyticsDaily.find({ reelId: reel._id, date: { $gte: sinceStr } }).sort('date').lean();
    const totals = await getReelAggregatedStats(reel._id);

    res.status(200).json(new ApiResponse(200, { reel, totals, daily }, 'Reel analytics fetched.'));
});

/**
 * DELETE /api/vendor/reels/:id
 * Soft delete a reel (mark as archived, not removed from Cloudinary immediately).
 */
export const deleteReel = asyncHandler(async (req, res) => {
    const reel = await Reel.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!reel) throw new ApiError(404, 'Reel not found.');
    reel.status = 'archived';
    await reel.save();
    res.status(200).json(new ApiResponse(200, null, 'Reel archived successfully.'));
});

/**
 * GET /api/vendor/reels/analytics/overview
 * Aggregated analytics across all vendor reels.
 */
export const getVendorReelAnalyticsOverview = asyncHandler(async (req, res) => {
    const { range = '30d' } = req.query;
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const sinceStr = since.toISOString().split('T')[0];
    const mongoose = (await import('mongoose')).default;
    const vendorObjId = new mongoose.Types.ObjectId(req.user.id);

    const [counts, analyticsAgg] = await Promise.all([
        Reel.aggregate([
            { $match: { vendorId: vendorObjId } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        ReelAnalyticsDaily.aggregate([
            { $match: { vendorId: vendorObjId, date: { $gte: sinceStr } } },
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
    ]);

    const statusMap = {};
    counts.forEach((c) => { statusMap[c._id] = c.count; });
    const analytics = analyticsAgg[0] || {};

    res.status(200).json(new ApiResponse(200, { statusCounts: statusMap, analytics }, 'Overview fetched.'));
});

/**
 * PATCH /api/vendor/reels/:id/approve-influencer
 * Vendor approves an influencer's reel uploaded for their product.
 */
export const approveInfluencerReel = asyncHandler(async (req, res) => {
    const reel = await Reel.findOne({ _id: req.params.id, vendorId: req.user.id, status: 'vendor_pending' });
    if (!reel) throw new ApiError(404, 'Influencer reel pending your review was not found.');

    reel.vendorApprovalStatus = 'approved';
    reel.status = 'pending'; // Moves to admin review
    await reel.save();

    res.status(200).json(new ApiResponse(200, reel, 'Influencer reel approved! Submitted for admin review.'));
});

/**
 * PATCH /api/vendor/reels/:id/reject-influencer
 * Vendor rejects an influencer's reel with a reason.
 */
export const rejectInfluencerReel = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    if (!reason || reason.trim().length < 5) throw new ApiError(400, 'Rejection reason is required (min 5 chars).');

    const reel = await Reel.findOne({ _id: req.params.id, vendorId: req.user.id, status: 'vendor_pending' });
    if (!reel) throw new ApiError(404, 'Influencer reel pending your review was not found.');

    reel.vendorApprovalStatus = 'rejected';
    reel.status = 'rejected';
    reel.vendorRejectionReason = reason.trim();
    reel.rejectionReason = `Vendor Rejection: ${reason.trim()}`;
    await reel.save();

    res.status(200).json(new ApiResponse(200, reel, 'Influencer reel rejected.'));
});
