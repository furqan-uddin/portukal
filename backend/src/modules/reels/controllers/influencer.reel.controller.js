import asyncHandler from '../../../utils/asyncHandler.js';
import mongoose from 'mongoose';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Reel from '../../../models/Reel.model.js';
import ReelInteraction from '../models/ReelInteraction.model.js';
import ReelFollow from '../models/ReelFollow.model.js';
import AffiliateLink from '../../influencer/models/AffiliateLink.model.js';
import Product from '../../../models/Product.model.js';
import CollaborationRequest from '../../influencer/models/CollaborationRequest.model.js';
import InfluencerCollaboration from '../../influencer/models/InfluencerCollaboration.model.js';
import InfluencerCollaborationMessage from '../../influencer/models/InfluencerCollaborationMessage.model.js';
import { uploadReelToCloudinary, validateVideoFile } from '../services/cloudinaryReel.service.js';
import { createNotification } from '../../../services/notification.service.js';

const FRONTEND_URL = process.env.CLIENT_URL || 'http://localhost:3000';

/**
 * GET /api/influencer/reels
 * Browse approved reels marketplace with smart sorting.
 */
export const browseReels = asyncHandler(async (req, res) => {
    const {
        sort = 'trending',    // trending | orders | commission | conversion | newest | featured | category | vendor
        category, vendorId, search,
        minCommission, page = 1, limit = 20,
    } = req.query;

    const filter = { status: 'approved', visibility: 'public' };
    if (category) filter.category = category;
    if (vendorId) filter.vendorId = vendorId;
    if (search) filter.$text = { $search: search };

    let sortObj = {};
    switch (sort) {
        case 'trending':  sortObj = { trendingScore: -1 }; break;
        case 'newest':    sortObj = { publishedAt: -1 };   break;
        case 'featured':  sortObj = { isFeatured: -1, trendingScore: -1 }; break;
        default:          sortObj = { trendingScore: -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [reels, total] = await Promise.all([
        Reel.find(filter)
            .populate('vendorId', 'storeName logoUrl influencerProgram')
            .populate('productId', 'name slug price images')
            .sort(sortObj)
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        Reel.countDocuments(filter),
    ]);

    // Attach aggregated stats + existing affiliate link for this influencer
    const influencerId = req.influencer._id;
    const reelIds = reels.map((r) => r._id);

    // Check which reels this influencer already has affiliate links for
    const existingLinks = await AffiliateLink.find({
        influencerId,
        productId: { $in: reels.map((r) => r.productId).filter(Boolean) },
        status: 'active',
    }).lean();

    const linkedProductIds = new Set(existingLinks.map((l) => l.productId.toString()));

    const enriched = reels.map((reel) => ({
        ...reel,
        hasAffiliateLink: reel.productId ? linkedProductIds.has(reel.productId.toString()) : false,
        commissionPercent: reel.vendorId?.influencerProgram?.defaultCommissionPercent || 5,
    }));

    res.status(200).json(new ApiResponse(200, {
        reels: enriched, total, page: Number(page), limit: Number(limit),
    }, 'Reels marketplace fetched.'));
});

/**
 * GET /api/influencer/reels/:id
 * Get single reel detail with stats.
 */
export const getReelDetail = asyncHandler(async (req, res) => {
    const reel = await Reel.findOne({ _id: req.params.id, status: 'approved' })
        .populate('vendorId', 'storeName logoUrl influencerProgram')
        .populate('productId', 'name slug price images')
        .lean();
    if (!reel) throw new ApiError(404, 'Reel not found.');
    const analytics = await getReelAggregatedStats(reel._id);
    res.status(200).json(new ApiResponse(200, { ...reel, analytics }, 'Reel detail.'));
});

/**
 * POST /api/influencer/reels/:id/generate-link
 * Generate or retrieve affiliate link for primary product of a reel.
 */
export const generateReelAffiliateLink = asyncHandler(async (req, res) => {
    const reel = await Reel.findOne({ _id: req.params.id, status: 'approved' })
        .populate('vendorId', 'storeName influencerProgram')
        .lean();
    if (!reel) throw new ApiError(404, 'Reel not found.');

    const productId = req.body.productId || reel.productId;
    if (!productId) throw new ApiError(400, 'This reel has no tagged product to generate a link for.');

    const influencerId = req.influencer._id;
    const vendorId = reel.vendorId._id;

    // Check for existing link
    let link = await AffiliateLink.findOne({ influencerId, productId, status: 'active' });
    if (!link) {
        const referralCode = `${req.influencer.referralCode || crypto.randomBytes(4).toString('hex').toUpperCase()}-R${reel._id.toString().slice(-4).toUpperCase()}`;
        const slug = referralCode.toLowerCase();
        link = await AffiliateLink.create({
            influencerId,
            vendorId,
            productId,
            referralCode,
            slug,
            affiliateUrl: `${FRONTEND_URL}/ref/${slug}?reel=${reel._id}`,
        });
    }

    res.status(200).json(new ApiResponse(200, {
        link,
        reel: { _id: reel._id, title: reel.title, thumbnailUrl: reel.thumbnailUrl },
    }, 'Affiliate link ready.'));
});

/**
 * POST /api/influencer/reels/:id/favourite
 * Toggle favourite reel for influencer.
 */
export const toggleFavouriteReel = asyncHandler(async (req, res) => {
    const reel = await Reel.findOne({ _id: req.params.id, status: 'approved' });
    if (!reel) throw new ApiError(404, 'Reel not found.');

    const influencerId = req.influencer._id;
    const existing = await ReelInteraction.findOne({ reelId: reel._id, userId: influencerId, type: 'save' });

    if (existing) {
        await existing.deleteOne();
        return res.status(200).json(new ApiResponse(200, { isFavourited: false }, 'Removed from favourites.'));
    }

    await ReelInteraction.create({ reelId: reel._id, userId: influencerId, type: 'save', vendorId: reel.vendorId });
    res.status(200).json(new ApiResponse(200, { isFavourited: true }, 'Added to favourites.'));
});

/**
 * POST /api/influencer/reels/follow/vendor/:vendorId
 * Follow or unfollow a vendor.
 */
export const toggleFollowVendor = asyncHandler(async (req, res) => {
    const { vendorId } = req.params;
    const influencerId = req.influencer._id;
    const existing = await ReelFollow.findOne({ followerId: influencerId, entityId: vendorId, entityType: 'vendor' });

    if (existing) {
        await existing.deleteOne();
        return res.status(200).json(new ApiResponse(200, { isFollowing: false }, 'Unfollowed vendor.'));
    }
    await ReelFollow.create({ followerId: influencerId, followerType: 'influencer', entityId: vendorId, entityType: 'vendor' });
    res.status(200).json(new ApiResponse(200, { isFollowing: true }, 'Now following vendor.'));
});

/**
 * GET /api/influencer/reels/my-analytics
 * Analytics for all affiliate links generated from reels by this influencer.
 */
export const getMyReelAnalytics = asyncHandler(async (req, res) => {
    const influencerId = req.influencer._id;
    const links = await AffiliateLink.find({ influencerId, status: 'active' })
        .populate('productId', 'name slug images')
        .lean();

    res.status(200).json(new ApiResponse(200, { links }, 'Reel affiliate analytics fetched.'));
});

/**
 * GET /api/influencer/reels/categories
 * Get all reel categories for marketplace filters.
 */
export const getReelCategories = asyncHandler(async (req, res) => {
    const categories = await Reel.distinct('category', { status: 'approved', category: { $ne: null } });
    res.status(200).json(new ApiResponse(200, categories.filter(Boolean), 'Categories fetched.'));
});

/**
 * POST /api/influencer/reels/upload
 * Influencer uploads their own promotional product video.
 */
export const uploadInfluencerReel = asyncHandler(async (req, res) => {
    validateVideoFile(req.file);

    const influencerId = req.influencer._id;
    const { title, description, caption, productId, category, tags } = req.body;

    if (!title || title.trim().length === 0) throw new ApiError(400, 'Reel title is required.');

    let targetVendorId;
    if (productId) {
        const prod = await Product.findById(productId, 'vendorId');
        if (prod?.vendorId) targetVendorId = prod.vendorId;
    }

    // Upload to Cloudinary
    const { video, thumbnail } = await uploadReelToCloudinary(req.file.path, `inf_${influencerId}`);

    const hasVendor = Boolean(targetVendorId);

    const reel = await Reel.create({
        title: title.trim(),
        description: description?.trim(),
        caption: caption?.trim(),
        influencerId,
        vendorId: targetVendorId,
        uploadedByModel: 'Influencer',
        productId: productId || undefined,
        video,
        videoUrl: video.secureUrl,
        thumbnail,
        thumbnailUrl: thumbnail.secureUrl,
        status: hasVendor ? 'vendor_pending' : 'pending',
        vendorApprovalStatus: hasVendor ? 'pending' : 'not_required',
        category: category?.trim(),
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
        visibility: 'public',
    });

    const msg = hasVendor
        ? 'Reel uploaded! Sent to product vendor for review.'
        : 'Reel uploaded! Submitted for admin review.';

    res.status(201).json(new ApiResponse(201, reel, msg));
});

/**
 * GET /api/influencer/invitations
 * List promotion requests received from vendors.
 */
export const getMyInvitations = asyncHandler(async (req, res) => {
    const influencerId = req.influencer._id;
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { influencerId };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [invitations, total] = await Promise.all([
        CollaborationRequest.find(filter)
            .populate('vendorId', 'storeName logoUrl storeEmail')
            .populate('productId', 'name slug price images')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        CollaborationRequest.countDocuments(filter),
    ]);

    res.status(200).json(new ApiResponse(200, { invitations, total, page: Number(page), limit: Number(limit) }, 'Invitations fetched.'));
});

/**
 * PATCH /api/influencer/invitations/:id/respond
 * Accept or decline vendor promotion invitation.
 */
export const respondToInvitation = asyncHandler(async (req, res) => {
    const influencerId = req.influencer._id;
    const { action, responseMessage } = req.body; // 'accept' | 'decline'

    if (!['accept', 'decline'].includes(action)) {
        throw new ApiError(400, 'Action must be "accept" or "decline".');
    }

    const invitation = await CollaborationRequest.findOne({ _id: req.params.id, influencerId, status: 'pending' });
    if (!invitation) throw new ApiError(404, 'Pending invitation not found.');

    if (action === 'decline') {
        invitation.status = 'declined';
        invitation.responseMessage = responseMessage?.trim();
        invitation.respondedAt = new Date();
        await invitation.save();
        return res.status(200).json(new ApiResponse(200, invitation, 'Invitation declined.'));
    }

    // Accept invitation
    invitation.status = 'accepted';
    invitation.responseMessage = responseMessage?.trim();
    invitation.respondedAt = new Date();
    await invitation.save();

    // Auto-generate affiliate link
    let link = await AffiliateLink.findOne({ influencerId, productId: invitation.productId, status: 'active' });
    if (!link) {
        const referralCode = `${req.influencer.referralCode || 'REF'}-PROMO${invitation._id.toString().slice(-4).toUpperCase()}`;
        const slug = referralCode.toLowerCase();
        link = await AffiliateLink.create({
            influencerId,
            vendorId: invitation.vendorId,
            productId: invitation.productId,
            referralCode,
            slug,
            affiliateUrl: `${FRONTEND_URL}/ref/${slug}`,
            customCommissionPercent: invitation.offeredCommissionPercent,
        });
    }

    res.status(200).json(new ApiResponse(200, { invitation, link }, 'Invitation accepted! Your affiliate link is active.'));
});

/**
 * POST /api/influencer/reels/request-collaboration
 * Influencer sends a product promotion / sample request to a Vendor.
 */
export const sendProductCollaborationRequest = asyncHandler(async (req, res) => {
    const influencerId = req.influencer._id;
    const { productId, message, requestedCommissionPercent } = req.body;

    const isObjectId = mongoose.Types.ObjectId.isValid(productId) && /^[a-fA-F0-9]{24}$/.test(productId);
    const product = isObjectId 
        ? await Product.findById(productId, 'name vendorId price') 
        : await Product.findOne({ slug: productId }, 'name vendorId price');

    if (!product) throw new ApiError(404, 'Product not found.');

    const resolvedProductId = product._id;

    // Check for existing pending request
    const existing = await CollaborationRequest.findOne({ influencerId, productId: resolvedProductId, status: 'pending' });
    if (existing) {
        throw new ApiError(400, 'You already have a pending collaboration request for this product.');
    }

    const commPercent = Number(requestedCommissionPercent) || 10;
    const requestDoc = await CollaborationRequest.create({
        influencerId,
        vendorId: product.vendorId,
        productId: resolvedProductId,
        initiatorModel: 'Influencer',
        offeredCommissionPercent: commPercent,
        message: message?.trim(),
        status: 'pending',
    });

    // Sync InfluencerCollaboration thread document so it shows in Vendor Creator Collaborations Hub
    let collabThread = await InfluencerCollaboration.findOne({
        vendorId: product.vendorId,
        influencerId,
        productId: resolvedProductId,
    });

    if (!collabThread) {
        collabThread = await InfluencerCollaboration.create({
            vendorId: product.vendorId,
            influencerId,
            productId: resolvedProductId,
            status: 'requested',
            offeredCommissionPercent: commPercent,
            offer: { commissionPercent: commPercent },
            lastMessage: message?.trim() || `Requested deal for ${product.name}`,
            lastMessageAt: new Date(),
        });
    } else {
        collabThread.status = 'requested';
        collabThread.offeredCommissionPercent = commPercent;
        collabThread.offer = { ...collabThread.offer, commissionPercent: commPercent };
        collabThread.lastMessage = message?.trim() || `Requested deal for ${product.name}`;
        collabThread.lastMessageAt = new Date();
        await collabThread.save();
    }

    if (message?.trim()) {
        await InfluencerCollaborationMessage.create({
            collaborationId: collabThread._id,
            senderId: influencerId,
            senderModel: 'Influencer',
            text: message.trim(),
        });
    }

    // Send real-time notification to Vendor
    const influencerName = req.influencer?.name || 'An Influencer';
    await createNotification({
        recipientId: product.vendorId,
        recipientType: 'vendor',
        title: '🤝 New Deal Request',
        message: `${influencerName} requested to promote "${product.name}" for ${commPercent}% commission.`,
        type: 'collaboration_request',
        data: {
            requestId: String(requestDoc._id),
            collabId: String(collabThread._id),
            productId: String(product._id),
            influencerId: String(influencerId),
            module: 'creator-collaborations'
        }
    }).catch(err => console.error("Failed to trigger collaboration request notification:", err));

    res.status(201).json(new ApiResponse(201, { requestDoc, collabThread }, `Collaboration request for "${product.name}" sent to vendor!`));
});
