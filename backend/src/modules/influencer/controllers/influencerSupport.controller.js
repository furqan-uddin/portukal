import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import SupportTicket from '../../../models/SupportTicket.model.js';
import TicketType from '../../../models/TicketType.model.js';
import InfluencerCollaboration from '../models/InfluencerCollaboration.model.js';
import InfluencerCollaborationMessage from '../models/InfluencerCollaborationMessage.model.js';
import Product from '../../../models/Product.model.js';
import AffiliateLink from '../models/AffiliateLink.model.js';
import { emitToRoom } from '../../../services/socket.service.js';
import { createNotification } from '../../../services/notification.service.js';

// =============================================================================
// DOMAIN 1: INFLUENCER ↔ ADMIN SUPPORT TICKETS
// =============================================================================

/**
 * GET /api/influencer/support/ticket-types
 */
export const getTicketTypes = asyncHandler(async (req, res) => {
    const types = await TicketType.find({
        isActive: true,
        isArchived: false,
    }).sort({ sortOrder: 1 });
    res.status(200).json(new ApiResponse(200, types, 'Support categories fetched.'));
});

/**
 * GET /api/influencer/support/tickets
 */
export const getMyAdminTickets = asyncHandler(async (req, res) => {
    const influencerId = req.influencer._id;
    const tickets = await SupportTicket.find({ influencerId })
        .populate('ticketTypeId', 'name icon')
        .sort({ updatedAt: -1 })
        .lean();
    res.status(200).json(new ApiResponse(200, tickets, 'Admin support tickets fetched.'));
});

/**
 * POST /api/influencer/support/tickets
 */
export const createAdminTicket = asyncHandler(async (req, res) => {
    const influencerId = req.influencer._id;
    const { subject, message, priority = 'medium', ticketTypeId } = req.body;

    const trimmedSubject = String(subject || '').trim();
    const trimmedMessage = String(message || '').trim();

    if (!trimmedSubject || !trimmedMessage) {
        throw new ApiError(400, 'Subject and message are required.');
    }

    const ticket = await SupportTicket.create({
        influencerId,
        ticketTypeId: ticketTypeId || undefined,
        subject: trimmedSubject,
        priority,
        messages: [{
            senderId: influencerId,
            senderType: 'influencer',
            message: trimmedMessage,
        }],
    });

    // Notify Admin
    emitToRoom('admin_room', 'new_notification', {
        type: 'new_support_ticket',
        ticketId: ticket._id,
        from: req.influencer.name || 'Influencer',
        subject: ticket.subject,
    });

    res.status(201).json(new ApiResponse(201, ticket, 'Support ticket created.'));
});

/**
 * POST /api/influencer/support/tickets/:id/message
 */
export const replyToAdminTicket = asyncHandler(async (req, res) => {
    const influencerId = req.influencer._id;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
        throw new ApiError(400, 'Message body is required.');
    }

    const ticket = await SupportTicket.findOne({ _id: req.params.id, influencerId });
    if (!ticket) throw new ApiError(404, 'Ticket not found.');
    if (ticket.status === 'closed') throw new ApiError(400, 'Cannot reply to a closed ticket.');

    const newMessage = {
        senderId: influencerId,
        senderType: 'influencer',
        message: message.trim(),
    };

    ticket.messages.push(newMessage);
    ticket.status = 'open';
    await ticket.save();

    const latestMsg = ticket.messages[ticket.messages.length - 1].toObject();
    const msgPayload = {
        ...latestMsg,
        ticketId: ticket._id,
        status: ticket.status,
        updatedAt: ticket.updatedAt,
    };

    // Emit live socket updates
    emitToRoom(`ticket_${ticket._id}`, 'new_support_message', msgPayload);
    emitToRoom(`influencer_${influencerId}`, 'new_support_message', msgPayload);
    emitToRoom('admin_room', 'new_support_message', msgPayload);

    res.status(200).json(new ApiResponse(200, ticket, 'Reply added.'));
});

// =============================================================================
// DOMAIN 2: INFLUENCER ↔ VENDOR CREATOR COLLABORATIONS
// =============================================================================

/**
 * GET /api/influencer/collaborations
 */
export const getVendorCollaborations = asyncHandler(async (req, res) => {
    const influencerId = req.influencer._id;
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { influencerId };
    if (status && status !== 'all') filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [collaborations, total] = await Promise.all([
        InfluencerCollaboration.find(filter)
            .populate('vendorId', 'storeName logoUrl storeEmail')
            .populate('products', 'name slug price images')
            .populate('productId', 'name slug price images')
            .sort({ lastMessageAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        InfluencerCollaboration.countDocuments(filter),
    ]);

    res.status(200).json(new ApiResponse(200, { collaborations, total, page: Number(page), limit: Number(limit) }, 'Collaborations fetched.'));
});

/**
 * GET /api/influencer/collaborations/:id
 */
export const getCollaborationDetail = asyncHandler(async (req, res) => {
    const influencerId = req.influencer._id;
    const collab = await InfluencerCollaboration.findOne({ _id: req.params.id, influencerId })
        .populate('vendorId', 'storeName logoUrl storeEmail')
        .populate('products', 'name slug price images')
        .populate('productId', 'name slug price images')
        .lean();

    if (!collab) throw new ApiError(404, 'Collaboration thread not found.');

    const messages = await InfluencerCollaborationMessage.find({ collaborationId: collab._id })
        .sort({ createdAt: 1 })
        .lean();

    // Reset unread count for influencer
    await InfluencerCollaboration.updateOne({ _id: collab._id }, { $set: { unreadCountInfluencer: 0 } });

    res.status(200).json(new ApiResponse(200, { collaboration: collab, messages }, 'Collaboration thread loaded.'));
});

/**
 * POST /api/influencer/collaborations/:id/message
 */
export const sendCollaborationMessage = asyncHandler(async (req, res) => {
    const influencerId = req.influencer._id;
    const { text, messageType = 'text', productData, reelData, offerData, attachments } = req.body;

    const collab = await InfluencerCollaboration.findOne({ _id: req.params.id, influencerId });
    if (!collab) throw new ApiError(404, 'Collaboration thread not found.');

    const messageDoc = await InfluencerCollaborationMessage.create({
        collaborationId: collab._id,
        senderId: influencerId,
        senderModel: 'Influencer',
        messageType,
        text: text?.trim(),
        productData,
        reelData,
        offerData,
        attachments: attachments || [],
    });

    // Update thread lastMessage & unread count for vendor
    collab.lastMessage = text?.trim() || `[${messageType.replace('_', ' ')}]`;
    collab.lastMessageAt = new Date();
    collab.unreadCountVendor += 1;
    await collab.save();

    const msgPayload = messageDoc.toObject();

    // Emit live socket updates
    emitToRoom(`collab_${collab._id}`, 'new_collaboration_message', msgPayload);
    emitToRoom(`vendor_${collab.vendorId}`, 'new_collaboration_message', msgPayload);

    // Persist real-time notification
    createNotification({
        recipientId: collab.vendorId,
        recipientType: 'vendor',
        title: 'New Creator Message',
        message: text?.trim() || 'New collaboration message received.',
        type: 'collaboration',
    }).catch(() => {});

    res.status(201).json(new ApiResponse(201, messageDoc, 'Message sent.'));
});
