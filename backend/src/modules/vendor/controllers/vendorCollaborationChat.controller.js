import asyncHandler from '../../../utils/asyncHandler.js';
import mongoose from 'mongoose';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';

import InfluencerCollaboration from '../../influencer/models/InfluencerCollaboration.model.js';
import InfluencerCollaborationMessage from '../../influencer/models/InfluencerCollaborationMessage.model.js';
import CollaborationRequest from '../../influencer/models/CollaborationRequest.model.js';
import AffiliateLink from '../../influencer/models/AffiliateLink.model.js';
import Influencer from '../../influencer/models/Influencer.model.js';
import { emitToRoom } from '../../../services/socket.service.js';
import { createNotification } from '../../../services/notification.service.js';

/**
 * GET /api/vendor/creator-collaborations
 */
export const getVendorCollaborations = asyncHandler(async (req, res) => {
    const vendorId = req.vendor?._id || req.user?.id;
    const { status, page = 1, limit = 20 } = req.query;

    const vendorIds = Array.from(new Set([
        String(vendorId || ''),
        String(req.user?.id || ''),
        String(req.user?._id || ''),
        String(req.vendor?._id || '')
    ].filter(Boolean))).map(id => new mongoose.Types.ObjectId(id));

    // Auto-sync any CollaborationRequests missing thread documents
    const rawRequests = await CollaborationRequest.find({
        vendorId: { $in: vendorIds }
    }).lean();

    for (const r of rawRequests) {
        const existingThread = await InfluencerCollaboration.findOne({
            vendorId: r.vendorId,
            influencerId: r.influencerId,
            productId: r.productId,
        });

        if (!existingThread) {
            await InfluencerCollaboration.create({
                vendorId: r.vendorId,
                influencerId: r.influencerId,
                productId: r.productId,
                status: r.status === 'pending' ? 'requested' : r.status,
                offeredCommissionPercent: r.offeredCommissionPercent || 10,
                offer: { commissionPercent: r.offeredCommissionPercent || 10 },
                lastMessage: r.message || 'Requested promotional deal',
                lastMessageAt: r.createdAt || new Date(),
            });
        }
    }

    const filter = { vendorId: { $in: vendorIds } };
    if (status && status !== 'all') {
        if (status === 'active') filter.status = { $in: ['accepted', 'requested'] };
        else if (status === 'pending') filter.status = { $in: ['pending', 'requested'] };
        else filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [collaborations, total] = await Promise.all([
        InfluencerCollaboration.find(filter)
            .populate('influencerId', 'name slug profileImage category socials bio followersCount')
            .populate('products', 'name slug price originalPrice image images')
            .populate('productId', 'name slug price originalPrice image images')
            .sort({ lastMessageAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        InfluencerCollaboration.countDocuments(filter),
    ]);

    res.status(200).json(new ApiResponse(200, { collaborations, total, page: Number(page), limit: Number(limit) }, 'Collaborations fetched.'));
});

/**
 * GET /api/vendor/creator-collaborations/:id
 */
export const getCollaborationDetail = asyncHandler(async (req, res) => {
    const vendorId = req.vendor?._id || req.user?.id;
    const vendorIds = Array.from(new Set([
        String(vendorId || ''),
        String(req.user?.id || ''),
        String(req.user?._id || ''),
        String(req.vendor?._id || '')
    ].filter(Boolean))).map(id => new mongoose.Types.ObjectId(id));

    const collab = await InfluencerCollaboration.findOne({ _id: req.params.id, vendorId: { $in: vendorIds } })
        .populate('influencerId', 'name slug profileImage category socials bio email')
        .populate('products', 'name slug price originalPrice image images')
        .populate('productId', 'name slug price originalPrice image images')
        .lean();

    if (!collab) throw new ApiError(404, 'Collaboration thread not found.');


    const messages = await InfluencerCollaborationMessage.find({ collaborationId: collab._id })
        .sort({ createdAt: 1 })
        .lean();

    // Reset unread count for vendor
    await InfluencerCollaboration.updateOne({ _id: collab._id }, { $set: { unreadCountVendor: 0 } });

    res.status(200).json(new ApiResponse(200, { collaboration: collab, messages }, 'Collaboration thread loaded.'));
});

/**
 * POST /api/vendor/creator-collaborations/:id/message
 */
export const sendCollaborationMessage = asyncHandler(async (req, res) => {
    const vendorId = req.user.id;
    const { text, messageType = 'text', productData, reelData, offerData, attachments } = req.body;

    const collab = await InfluencerCollaboration.findOne({ _id: req.params.id, vendorId });
    if (!collab) throw new ApiError(404, 'Collaboration thread not found.');

    const messageDoc = await InfluencerCollaborationMessage.create({
        collaborationId: collab._id,
        senderId: vendorId,
        senderModel: 'Vendor',
        messageType,
        text: text?.trim(),
        productData,
        reelData,
        offerData,
        attachments: attachments || [],
    });

    // Update thread metadata
    collab.lastMessage = text?.trim() || `[${messageType.replace('_', ' ')}]`;
    collab.lastMessageAt = new Date();
    collab.unreadCountInfluencer += 1;
    await collab.save();

    const msgPayload = messageDoc.toObject();

    // Emit live socket updates
    emitToRoom(`collab_${collab._id}`, 'new_collaboration_message', msgPayload);
    emitToRoom(`influencer_${collab.influencerId}`, 'new_collaboration_message', msgPayload);

    // Persist real-time notification
    createNotification({
        recipientId: collab.influencerId,
        recipientType: 'influencer',
        title: 'New Vendor Message',
        message: text?.trim() || 'New collaboration message from vendor.',
        type: 'collaboration',
    }).catch(() => {});

    res.status(201).json(new ApiResponse(201, messageDoc, 'Message sent.'));
});

/**
 * PATCH /api/vendor/creator-collaborations/:id/status
 */
export const updateCollaborationStatus = asyncHandler(async (req, res) => {
    const vendorId = req.user.id;
    const { status, notes } = req.body;

    const allowed = ['accepted', 'rejected', 'paused', 'cancelled', 'completed'];
    if (!allowed.includes(status)) {
        throw new ApiError(400, `Status must be one of: ${allowed.join(', ')}`);
    }

    const collab = await InfluencerCollaboration.findOne({ _id: req.params.id, vendorId });
    if (!collab) throw new ApiError(404, 'Collaboration thread not found.');

    collab.status = status;
    collab.timeline.push({
        event: `Status updated to ${status.toUpperCase()}`,
        performerId: vendorId,
        performerModel: 'Vendor',
        timestamp: new Date(),
        notes: notes?.trim(),
    });
    await collab.save();

    // If accepted, auto issue affiliate link if not present
    if (status === 'accepted' && collab.productId) {
        let link = await AffiliateLink.findOne({ influencerId: collab.influencerId, productId: collab.productId, status: 'active' });
        if (!link) {
            const inf = await Influencer.findById(collab.influencerId, 'referralCode');
            const referralCode = `${inf?.referralCode || 'REF'}-COLLAB${collab._id.toString().slice(-4).toUpperCase()}`;
            const slug = referralCode.toLowerCase();
            link = await AffiliateLink.create({
                influencerId: collab.influencerId,
                vendorId,
                productId: collab.productId,
                referralCode,
                slug,
                affiliateUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/ref/${slug}`,
                customCommissionPercent: collab.offer?.commissionPercent || 10,
            });
            collab.affiliateLinkId = link._id;
            await collab.save();
        }
    }

    // Sync CollaborationRequest status
    await CollaborationRequest.updateMany(
        { productId: collab.productId, influencerId: collab.influencerId },
        { status: status === 'accepted' ? 'accepted' : status === 'rejected' ? 'declined' : status }
    ).catch(() => {});

    // Emit socket events
    emitToRoom(`collab_${collab._id}`, 'collaboration_updated', { collaborationId: collab._id, status, collab });
    emitToRoom(`influencer_${collab.influencerId}`, 'collaboration_updated', { collaborationId: collab._id, status, collab });

    // Send real-time notification to influencer
    createNotification({
        recipientId: collab.influencerId,
        recipientType: 'influencer',
        title: status === 'accepted' ? '🎉 Deal Approved!' : 'Deal Status Updated',
        message: status === 'accepted' ? 'Vendor approved your promotional deal request!' : `Vendor updated your deal status to ${status}.`,
        type: 'collaboration',
        data: { collabId: String(collab._id), productId: String(collab.productId) },
    }).catch(() => {});

    res.status(200).json(new ApiResponse(200, collab, `Collaboration status updated to ${status}.`));
});

/**
 * PATCH /api/vendor/creator-collaborations/:id/sample
 */
export const updateSampleShipping = asyncHandler(async (req, res) => {
    const vendorId = req.user.id;
    const { trackingNumber, notes } = req.body;

    const collab = await InfluencerCollaboration.findOne({ _id: req.params.id, vendorId });
    if (!collab) throw new ApiError(404, 'Collaboration thread not found.');

    if (!collab.offer) collab.offer = {};
    collab.offer.sampleRequired = true;
    collab.offer.sampleShipped = true;
    if (trackingNumber) collab.offer.trackingNumber = trackingNumber.trim();

    collab.timeline.push({
        event: 'Product Sample Shipped to Creator',
        performerId: vendorId,
        performerModel: 'Vendor',
        timestamp: new Date(),
        notes: notes || `Tracking #: ${trackingNumber || 'N/A'}`,
    });

    await collab.save();

    emitToRoom(`collab_${collab._id}`, 'collaboration_updated', { collaborationId: collab._id, collab });
    emitToRoom(`influencer_${collab.influencerId}`, 'collaboration_updated', { collaborationId: collab._id, collab });

    res.status(200).json(new ApiResponse(200, collab, 'Sample shipping status updated.'));
});
