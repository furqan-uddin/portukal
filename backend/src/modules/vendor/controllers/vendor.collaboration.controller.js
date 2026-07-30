import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Influencer from '../../influencer/models/Influencer.model.js';
import CollaborationRequest from '../../influencer/models/CollaborationRequest.model.js';
import Product from '../../../models/Product.model.js';
import Notification from '../../influencer/models/Notification.model.js';

/**
 * GET /api/vendor/influencers
 * List all verified influencers available for product promotions.
 */
export const listVerifiedInfluencers = asyncHandler(async (req, res) => {
    const { category, search, page = 1, limit = 20 } = req.query;
    const filter = { isActive: { $ne: false } };

    if (category) filter.category = category;
    if (search) {
        filter.$or = [
            { name: new RegExp(search, 'i') },
            { slug: new RegExp(search, 'i') },
            { bio: new RegExp(search, 'i') },
            { email: new RegExp(search, 'i') },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [influencers, total] = await Promise.all([
        Influencer.find(filter, 'name slug category bio profileImage socials followersCount status createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        Influencer.countDocuments(filter),
    ]);

    res.status(200).json(new ApiResponse(200, { influencers, total, page: Number(page), limit: Number(limit) }, 'Influencers listed.'));
});

/**
 * POST /api/vendor/influencers/invite
 * Send product promotion invitation to a specific influencer.
 */
export const sendPromotionInvitation = asyncHandler(async (req, res) => {
    const vendorId = req.user.id;
    const { influencerId, productId, offeredCommissionPercent, message } = req.body;

    if (!influencerId || !productId) {
        throw new ApiError(400, 'Influencer and Product are required.');
    }

    const [influencer, product] = await Promise.all([
        Influencer.findById(influencerId),
        Product.findOne({ _id: productId, vendorId }),
    ]);

    if (!influencer) throw new ApiError(404, 'Influencer not found.');
    if (!product) throw new ApiError(404, 'Product not found in your store catalog.');

    // Check for existing pending invitation
    const existing = await CollaborationRequest.findOne({ vendorId, influencerId, productId, status: 'pending' });
    if (existing) {
        throw new ApiError(400, 'An active invitation for this product is already pending with this influencer.');
    }

    const invitation = await CollaborationRequest.create({
        vendorId,
        influencerId,
        productId,
        offeredCommissionPercent: Number(offeredCommissionPercent) || 10,
        message: message?.trim(),
        status: 'pending',
    });

    // Notify Influencer
    await Notification.create({
        recipientId: influencerId,
        recipientModel: 'Influencer',
        type: 'collaboration_invite',
        title: 'New Product Promotion Invitation! 🎁',
        message: `Vendor invited you to promote "${product.name}" with ${invitation.offeredCommissionPercent}% commission.`,
        data: { invitationId: invitation._id, productId: product._id },
    }).catch(() => {});

    res.status(201).json(new ApiResponse(201, invitation, `Promotion invitation sent to @${influencer.slug || influencer.name}!`));
});

/**
 * GET /api/vendor/influencers/invitations
 * Get all promotion invitations sent by this vendor.
 */
export const listVendorInvitations = asyncHandler(async (req, res) => {
    const vendorId = req.vendor?._id || req.user?.id;
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { $or: [{ vendorId }, { vendorId: req.user?.id }] };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [invitations, total] = await Promise.all([
        CollaborationRequest.find(filter)
            .populate('influencerId', 'name slug profileImage category socials')
            .populate('productId', 'name slug price originalPrice image images')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        CollaborationRequest.countDocuments(filter),
    ]);

    res.status(200).json(new ApiResponse(200, { invitations, total, page: Number(page), limit: Number(limit) }, 'Sent invitations listed.'));
});

/**
 * PATCH /api/vendor/influencers/requests/:id/respond
 * Vendor approves or declines a collaboration request initiated by an influencer.
 */
export const respondToInfluencerRequest = asyncHandler(async (req, res) => {
    const vendorId = req.user.id;
    const { action, responseMessage } = req.body; // 'accept' | 'decline'

    if (!['accept', 'decline'].includes(action)) {
        throw new ApiError(400, 'Action must be "accept" or "decline".');
    }

    const invitation = await CollaborationRequest.findOne({ _id: req.params.id, vendorId, status: 'pending' });
    if (!invitation) throw new ApiError(404, 'Pending collaboration request not found.');

    if (action === 'decline') {
        invitation.status = 'declined';
        invitation.responseMessage = responseMessage?.trim();
        invitation.respondedAt = new Date();
        await invitation.save();
        return res.status(200).json(new ApiResponse(200, invitation, 'Collaboration request declined.'));
    }

    // Accept request
    invitation.status = 'accepted';
    invitation.responseMessage = responseMessage?.trim();
    invitation.respondedAt = new Date();
    await invitation.save();

    // Auto-generate affiliate link for the influencer
    let link = await AffiliateLink.findOne({ influencerId: invitation.influencerId, productId: invitation.productId, status: 'active' });
    if (!link) {
        const inf = await Influencer.findById(invitation.influencerId, 'referralCode');
        const referralCode = `${inf?.referralCode || 'REF'}-APPROVED${invitation._id.toString().slice(-4).toUpperCase()}`;
        const slug = referralCode.toLowerCase();
        link = await AffiliateLink.create({
            influencerId: invitation.influencerId,
            vendorId,
            productId: invitation.productId,
            referralCode,
            slug,
            affiliateUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/ref/${slug}`,
            customCommissionPercent: invitation.offeredCommissionPercent,
        });
    }

    res.status(200).json(new ApiResponse(200, { invitation, link }, 'Collaboration request approved! Affiliate link issued to influencer.'));
});
