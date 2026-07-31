import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Influencer from '../models/Influencer.model.js';
import Reel from '../../../models/Reel.model.js';
import ReelInteraction from '../../reels/models/ReelInteraction.model.js';
import ReelFollow from '../../reels/models/ReelFollow.model.js';
import AffiliateLink from '../models/AffiliateLink.model.js';
import User from '../../../models/User.model.js';
import mongoose from 'mongoose';

/**
 * GET /api/creator/:username or GET /api/influencer/public/:username
 * Fetch isolated creator profile, statistics, followers, following, and reels.
 */
export const getPublicCreatorProfile = asyncHandler(async (req, res) => {
    const rawUsername = String(req.params.username || '').trim();
    if (!rawUsername) {
        throw new ApiError(400, 'Username or creator handle is required.');
    }

    const cleanHandle = rawUsername.toLowerCase();
    const handleVariants = [
        cleanHandle,
        cleanHandle.replace(/_/g, '-'),
        cleanHandle.replace(/-/g, '_'),
        cleanHandle.replace(/\s+/g, ''),
        cleanHandle.replace(/\s+/g, '_'),
        cleanHandle.replace(/\s+/g, '-'),
    ];

    let influencer = null;

    // 1. Try finding by ObjectId
    if (mongoose.Types.ObjectId.isValid(rawUsername) && /^[a-fA-F0-9]{24}$/.test(rawUsername)) {
        influencer = await Influencer.findById(rawUsername).populate('user', 'name email avatar').lean();
    }

    // 2. Try finding by slug, referral code, or email
    if (!influencer) {
        const candidates = await Influencer.find({
            $or: [
                { slug: { $in: handleVariants } },
                { referralCode: rawUsername.toUpperCase() },
                { email: cleanHandle },
            ],
        }).populate('user', 'name email avatar').lean();

        if (candidates.length > 0) {
            if (candidates.length === 1) {
                influencer = candidates[0];
            } else {
                // If multiple candidates exist, pick the approved record or one with reels
                const candidateIds = candidates.map((c) => c._id);
                const reelCounts = await Reel.aggregate([
                    { $match: { influencerId: { $in: candidateIds } } },
                    { $group: { _id: '$influencerId', count: { $sum: 1 } } },
                ]);
                const countMap = {};
                reelCounts.forEach((r) => { countMap[String(r._id)] = r.count; });
                candidates.sort((a, b) => (countMap[String(b._id)] || 0) - (countMap[String(a._id)] || 0));
                influencer = candidates[0];
            }
        }
    }

    // 3. Try finding via User model if username matches User name or email
    if (!influencer) {
        const userDoc = await User.findOne({
            $or: [
                { email: cleanHandle },
                { name: new RegExp(`^${rawUsername}$`, 'i') },
            ],
        }).lean();

        if (userDoc) {
            influencer = await Influencer.findOne({ user: userDoc._id })
                .populate('user', 'name email avatar')
                .lean();
        }
    }

    if (!influencer) {
        throw new ApiError(404, `Creator profile "@${rawUsername}" not found.`);
    }

    const influencerId = influencer._id;

    // Step 2 & 3: Fetch ONLY reels uploaded by this influencer and calculate total reels count
    const reelFilter = {
        influencerId: influencerId,
        status: 'approved',
        visibility: 'public',
    };

    const [reels, totalReelsCount] = await Promise.all([
        Reel.find(reelFilter)
            .populate('vendorId', 'storeName logoUrl')
            .populate('productId', 'name slug price images discountPercent')
            .populate({ path: 'taggedProducts.productId', select: 'name slug price images' })
            .sort({ publishedAt: -1, createdAt: -1 })
            .lean(),
        Reel.countDocuments(reelFilter),
    ]);

    const reelIds = reels.map((r) => r._id);

    // Logging for Identity Resolution Verification
    console.log(`\n======================================================`);
    console.log(`[Public Profile Resolution] requested: "${rawUsername}"`);
    console.log(`[Public Profile Resolution] resolved Influencer _id: "${influencerId}" (slug: "${influencer.slug}", name: "${influencer.name}")`);
    console.log(`[Public Profile Resolution] fetched ${reels.length} public reels with influencerId = ${influencerId}`);
    reels.forEach((r, idx) => {
        console.log(`   -> Reel #${idx + 1}: _id=${r._id}, title="${r.title}", influencerId=${r.influencerId?._id || r.influencerId}`);
    });
    console.log(`======================================================\n`);

    // Step 4: Calculate statistics ONLY for this influencer's reels
    const [likeCount, saveCount, commentCount] = await Promise.all([
        ReelInteraction.countDocuments({ reelId: { $in: reelIds }, type: 'like' }),
        ReelInteraction.countDocuments({ reelId: { $in: reelIds }, type: 'save' }),
        ReelInteraction.countDocuments({ reelId: { $in: reelIds }, type: 'comment' }),
    ]);

    let totalViews = 0;
    let totalTaggedProducts = 0;

    reels.forEach((reel) => {
        totalViews += Number(reel.viewsCount || reel.views || 0);
        if (Array.isArray(reel.taggedProducts)) {
            totalTaggedProducts += reel.taggedProducts.length;
        } else if (reel.productId) {
            totalTaggedProducts += 1;
        }
    });

    // Step 5 & 6: Followers & Following counts strictly for this influencer
    const [followersCount, followingCount, affiliateLinksCount] = await Promise.all([
        ReelFollow.countDocuments({ entityId: influencerId, entityType: 'influencer' }),
        ReelFollow.countDocuments({ followerId: influencer.user?._id || influencerId }),
        AffiliateLink.countDocuments({ influencerId: influencerId }),
    ]);

    // Format response object
    const profile = {
        _id: influencer._id,
        id: influencer._id,
        name: influencer.name || influencer.user?.name || rawUsername,
        slug: influencer.slug,
        username: influencer.slug,
        referralCode: influencer.referralCode,
        email: influencer.email || influencer.user?.email || '',
        mobile: influencer.mobile || '',
        profileImage: influencer.profileImage || influencer.user?.avatar || '',
        bio: influencer.bio || 'Official Creator & Brand Ambassador on Porutkal Marketplace ✨',
        category: influencer.category || 'Lifestyle & Fashion',
        socialLinks: influencer.socialLinks || {},
        status: influencer.status,
    };

    const stats = {
        totalReels: totalReelsCount,
        followersCount: followersCount || influencer.followers || 0,
        followingCount: followingCount || 0,
        totalViews,
        totalLikes: likeCount,
        totalSaves: saveCount,
        totalComments: commentCount,
        totalTaggedProducts,
        totalAffiliateLinks: affiliateLinksCount,
    };

    res.status(200).json(
        new ApiResponse(
            200,
            {
                profile,
                stats,
                reels,
            },
            'Creator profile fetched successfully.'
        )
    );
});
