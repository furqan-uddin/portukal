import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Reel from '../../../models/Reel.model.js';
import ReelInteraction from '../models/ReelInteraction.model.js';
import ReelFollow from '../models/ReelFollow.model.js';
import { aggregateDailyAnalytics } from '../services/reelAnalytics.service.js';

// Helper to get today's date bucket
const today = () => new Date().toISOString().split('T')[0];

// Helper to detect device from user-agent
const getDevice = (req) => {
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    if (/mobile|android|iphone/i.test(ua)) return 'mobile';
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    if (/curl|node|axios/i.test(ua)) return 'unknown';
    return 'desktop';
};

// Helper to get client IP
const getClientIP = (req) =>
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || '';

/**
 * GET /api/reels/feed
 * Ranked, paginated reel feed for users.
 * Ranking: trendingScore desc (boosted if user follows vendor)
 */
export const getFeed = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category } = req.query;
    const userId = req.user?.id;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { status: 'approved', visibility: 'public', publishedAt: { $lte: new Date() } };
    if (category) filter.category = category;

    // Get user's followed vendors to boost their reels
    let followedVendorIds = [];
    if (userId) {
        const follows = await ReelFollow.find({ followerId: userId, entityType: 'vendor' }, 'entityId').lean();
        followedVendorIds = follows.map((f) => f.entityId);
    }

    const [reels, total] = await Promise.all([
        Reel.find(filter)
            .populate('vendorId', 'storeName logoUrl')
            .populate('influencerId', 'name slug profileImage avatar')
            .populate('productId', 'name slug price images discountPercent')

            .populate({ path: 'taggedProducts.productId', select: 'name slug price images' })
            .sort({ isFeatured: -1, trendingScore: -1, publishedAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        Reel.countDocuments(filter),
    ]);

    // Attach interaction state for logged-in user
    let userLikes = new Set();
    let userSaves = new Set();
    if (userId) {
        const reelIds = reels.map((r) => r._id);
        const interactions = await ReelInteraction.find({
            userId,
            reelId: { $in: reelIds },
            type: { $in: ['like', 'save'] },
        }, 'reelId type').lean();
        interactions.forEach((i) => {
            if (i.type === 'like') userLikes.add(i.reelId.toString());
            if (i.type === 'save') userSaves.add(i.reelId.toString());
        });
    }

    // Get live interaction counts from ReelInteraction (lightweight counts)
    const reelIds = reels.map((r) => r._id);
    const [likeCounts, commentCounts] = await Promise.all([
        ReelInteraction.aggregate([
            { $match: { reelId: { $in: reelIds }, type: 'like' } },
            { $group: { _id: '$reelId', count: { $sum: 1 } } },
        ]),
        ReelInteraction.aggregate([
            { $match: { reelId: { $in: reelIds }, type: { $in: ['comment', 'reply'] } } },
            { $group: { _id: '$reelId', count: { $sum: 1 } } },
        ]),
    ]);

    const likeMap = {};
    const commentMap = {};
    likeCounts.forEach((l) => { likeMap[l._id.toString()] = l.count; });
    commentCounts.forEach((c) => { commentMap[c._id.toString()] = c.count; });

    const enriched = reels.map((reel) => {
        const rid = reel._id.toString();
        return {
            ...reel,
            isFollowedVendor: followedVendorIds.some((fid) => fid.toString() === reel.vendorId?._id?.toString()),
            isLiked: userLikes.has(rid),
            isSaved: userSaves.has(rid),
            likesCount: likeMap[rid] || 0,
            commentsCount: commentMap[rid] || 0,
        };
    });

    res.status(200).json(new ApiResponse(200, {
        reels: enriched,
        total,
        page: Number(page),
        limit: Number(limit),
        hasMore: skip + reels.length < total,
    }, 'Feed fetched.'));
});

/**
 * POST /api/reels/:id/view
 * Track reel view + watch duration.
 */
export const trackView = asyncHandler(async (req, res) => {
    const reel = await Reel.findOne({ _id: req.params.id, status: 'approved' }, '_id vendorId');
    if (!reel) return res.status(200).json(new ApiResponse(200, null, 'ok'));

    const userId = req.user?.id;
    const { watchDuration = 0, completed = false, reached3s = false, reached10s = false } = req.body;
    const dateBucket = today();
    const ip = getClientIP(req);
    const device = getDevice(req);

    try {
        await ReelInteraction.create({
            type: 'view',
            reelId: reel._id,
            vendorId: reel.vendorId,
            userId: userId || undefined,
            watchDuration: Number(watchDuration) || 0,
            completed: Boolean(completed),
            reached3s: Boolean(reached3s),
            reached10s: Boolean(reached10s),
            device,
            ip,
            dateBucket,
        });
    } catch (err) {
        // Duplicate key = already viewed today by this user → update watch duration
        if (err.code === 11000 && userId) {
            await ReelInteraction.findOneAndUpdate(
                { userId, reelId: reel._id, type: 'view', dateBucket },
                { $max: { watchDuration: Number(watchDuration) || 0 }, $set: { completed, reached3s, reached10s } }
            );
        }
    }

    // Trigger aggregation async (no await — fire and forget)
    aggregateDailyAnalytics(reel._id, dateBucket).catch(() => {});

    res.status(200).json(new ApiResponse(200, null, 'View tracked.'));
});

/**
 * POST /api/reels/:id/like
 * Toggle like on a reel.
 */
export const toggleLike = asyncHandler(async (req, res) => {
    if (!req.user) throw new ApiError(401, 'Login required to like reels.');
    const reel = await Reel.findOne({ _id: req.params.id, status: 'approved' }, '_id vendorId');
    if (!reel) throw new ApiError(404, 'Reel not found.');

    const userId = req.user.id;
    const existing = await ReelInteraction.findOne({ userId, reelId: reel._id, type: 'like' });

    if (existing) {
        await existing.deleteOne();
        const count = await ReelInteraction.countDocuments({ reelId: reel._id, type: 'like' });
        return res.status(200).json(new ApiResponse(200, { isLiked: false, likesCount: count }, 'Unliked.'));
    }

    await ReelInteraction.create({ type: 'like', reelId: reel._id, userId, vendorId: reel.vendorId, dateBucket: today() });
    const count = await ReelInteraction.countDocuments({ reelId: reel._id, type: 'like' });
    res.status(200).json(new ApiResponse(200, { isLiked: true, likesCount: count }, 'Liked.'));
});

/**
 * POST /api/reels/:id/save
 * Toggle save/bookmark.
 */
export const toggleSave = asyncHandler(async (req, res) => {
    if (!req.user) throw new ApiError(401, 'Login required.');
    const reel = await Reel.findOne({ _id: req.params.id, status: 'approved' }, '_id vendorId');
    if (!reel) throw new ApiError(404, 'Reel not found.');

    const userId = req.user.id;
    const existing = await ReelInteraction.findOne({ userId, reelId: reel._id, type: 'save' });
    if (existing) {
        await existing.deleteOne();
        return res.status(200).json(new ApiResponse(200, { isSaved: false }, 'Removed from saved.'));
    }
    await ReelInteraction.create({ type: 'save', reelId: reel._id, userId, vendorId: reel.vendorId, dateBucket: today() });
    res.status(200).json(new ApiResponse(200, { isSaved: true }, 'Saved.'));
});

/**
 * POST /api/reels/:id/share
 * Track share event.
 */
export const trackShare = asyncHandler(async (req, res) => {
    const reel = await Reel.findOne({ _id: req.params.id, status: 'approved' }, '_id vendorId');
    if (!reel) return res.status(200).json(new ApiResponse(200, null, 'ok'));
    await ReelInteraction.create({
        type: 'share', reelId: reel._id, userId: req.user?.id, vendorId: reel.vendorId, dateBucket: today(),
    }).catch(() => {});
    res.status(200).json(new ApiResponse(200, null, 'Share tracked.'));
});

/**
 * POST /api/reels/:id/track/click
 * Track product click from reel.
 */
export const trackProductClick = asyncHandler(async (req, res) => {
    const reel = await Reel.findOne({ _id: req.params.id, status: 'approved' }, '_id vendorId');
    if (!reel) return res.status(200).json(new ApiResponse(200, null, 'ok'));
    const { productId } = req.body;
    await ReelInteraction.create({
        type: 'click', reelId: reel._id, userId: req.user?.id, vendorId: reel.vendorId,
        productId: productId || undefined, dateBucket: today(), ip: getClientIP(req),
    }).catch(() => {});
    aggregateDailyAnalytics(reel._id, today()).catch(() => {});
    res.status(200).json(new ApiResponse(200, null, 'Click tracked.'));
});

/**
 * GET /api/reels/:id/comments
 * Get comments (with replies) for a reel.
 */
export const getComments = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Top-level comments
    const [comments, total] = await Promise.all([
        ReelInteraction.find({ reelId: req.params.id, type: 'comment', parentId: { $exists: false }, isDeleted: { $ne: true } })
            .populate('userId', 'name profileImage')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        ReelInteraction.countDocuments({ reelId: req.params.id, type: 'comment', parentId: { $exists: false }, isDeleted: { $ne: true } }),
    ]);

    // Fetch replies for each comment
    const commentIds = comments.map((c) => c._id);
    const replies = await ReelInteraction.find({ parentId: { $in: commentIds }, type: 'reply', isDeleted: { $ne: true } })
        .populate('userId', 'name profileImage')
        .sort({ createdAt: 1 })
        .lean();

    const replyMap = {};
    replies.forEach((r) => {
        const pid = r.parentId.toString();
        if (!replyMap[pid]) replyMap[pid] = [];
        replyMap[pid].push(r);
    });

    const enrichedComments = comments.map((c) => ({ ...c, replies: replyMap[c._id.toString()] || [] }));

    res.status(200).json(new ApiResponse(200, { comments: enrichedComments, total }, 'Comments fetched.'));
});

/**
 * POST /api/reels/:id/comments
 * Post a comment on a reel.
 */
export const addComment = asyncHandler(async (req, res) => {
    if (!req.user) throw new ApiError(401, 'Login required to comment.');
    const reel = await Reel.findOne({ _id: req.params.id, status: 'approved' }, '_id vendorId');
    if (!reel) throw new ApiError(404, 'Reel not found.');

    const { comment, parentId, mentions } = req.body;
    if (!comment || comment.trim().length === 0) throw new ApiError(400, 'Comment text is required.');
    if (comment.trim().length > 1000) throw new ApiError(400, 'Comment too long (max 1000 chars).');

    const type = parentId ? 'reply' : 'comment';
    const interaction = await ReelInteraction.create({
        type,
        reelId: reel._id,
        userId: req.user.id,
        vendorId: reel.vendorId,
        comment: comment.trim(),
        parentId: parentId || undefined,
        mentions: mentions || [],
        dateBucket: today(),
    });

    await interaction.populate('userId', 'name profileImage');
    res.status(201).json(new ApiResponse(201, interaction, 'Comment posted.'));
});

/**
 * DELETE /api/reels/comments/:commentId
 * Delete own comment (soft delete).
 */
export const deleteComment = asyncHandler(async (req, res) => {
    if (!req.user) throw new ApiError(401, 'Login required.');
    const comment = await ReelInteraction.findOne({ _id: req.params.commentId, type: { $in: ['comment', 'reply'] } });
    if (!comment) throw new ApiError(404, 'Comment not found.');
    if (comment.userId.toString() !== req.user.id.toString()) throw new ApiError(403, 'Cannot delete another user\'s comment.');
    comment.isDeleted = true;
    comment.comment = '[deleted]';
    await comment.save();
    res.status(200).json(new ApiResponse(200, null, 'Comment deleted.'));
});

/**
 * POST /api/reels/comments/:commentId/like
 * Like a comment.
 */
export const likeComment = asyncHandler(async (req, res) => {
    if (!req.user) throw new ApiError(401, 'Login required.');
    const existing = await ReelInteraction.findOne({ userId: req.user.id, parentId: req.params.commentId, type: 'comment_like' });
    if (existing) {
        await existing.deleteOne();
        return res.status(200).json(new ApiResponse(200, { isLiked: false }, 'Like removed.'));
    }
    const parent = await ReelInteraction.findById(req.params.commentId, 'reelId');
    if (!parent) throw new ApiError(404, 'Comment not found.');
    await ReelInteraction.create({ type: 'comment_like', userId: req.user.id, reelId: parent.reelId, parentId: parent._id, dateBucket: today() });
    res.status(200).json(new ApiResponse(200, { isLiked: true }, 'Comment liked.'));
});

/**
 * POST /api/reels/comments/:commentId/report
 * Report a comment.
 */
export const reportComment = asyncHandler(async (req, res) => {
    if (!req.user) throw new ApiError(401, 'Login required.');
    const parent = await ReelInteraction.findById(req.params.commentId, 'reelId');
    if (!parent) throw new ApiError(404, 'Comment not found.');
    await ReelInteraction.findOneAndUpdate(
        { type: 'comment_report', userId: req.user.id, parentId: parent._id },
        { $set: { reelId: parent.reelId, dateBucket: today(), comment: req.body.reason || 'Reported' } },
        { upsert: true }
    );
    res.status(200).json(new ApiResponse(200, null, 'Comment reported.'));
});

/**
 * POST /api/reels/follow/vendor/:vendorId
 * User follows a vendor to personalize feed.
 */
export const toggleFollowVendor = asyncHandler(async (req, res) => {
    if (!req.user) throw new ApiError(401, 'Login required.');
    const { vendorId } = req.params;
    const userId = req.user.id;
    const existing = await ReelFollow.findOne({ followerId: userId, entityId: vendorId, entityType: 'vendor' });
    if (existing) {
        await existing.deleteOne();
        return res.status(200).json(new ApiResponse(200, { isFollowing: false }, 'Unfollowed.'));
    }
    await ReelFollow.create({ followerId: userId, followerType: 'user', entityId: vendorId, entityType: 'vendor' });
    res.status(200).json(new ApiResponse(200, { isFollowing: true }, 'Following vendor.'));
});

/**
 * GET /api/reels/categories
 * Public list of reel categories.
 */
export const getReelCategories = asyncHandler(async (req, res) => {
    const categories = await Reel.distinct('category', { status: 'approved', category: { $ne: null } });
    res.status(200).json(new ApiResponse(200, categories.filter(Boolean), 'Categories fetched.'));
});
