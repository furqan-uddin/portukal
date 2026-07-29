import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import SupportTicket from '../../../models/SupportTicket.model.js';
import Influencer from '../../influencer/models/Influencer.model.js';
import InfluencerWallet from '../../influencer/models/InfluencerWallet.model.js';
import { emitToRoom } from '../../../services/socket.service.js';

/**
 * GET /api/admin/influencer-support/tickets
 */
export const getAdminInfluencerTickets = asyncHandler(async (req, res) => {
    const { status, search, page = 1, limit = 50 } = req.query;

    const filter = { influencerId: { $exists: true } };
    if (status && status !== 'all') filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [tickets, total] = await Promise.all([
        SupportTicket.find(filter)
            .populate('influencerId', 'name slug profileImage email referralCode status category')
            .populate('ticketTypeId', 'name icon')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        SupportTicket.countDocuments(filter),
    ]);

    res.status(200).json(new ApiResponse(200, { tickets, total, page: Number(page), limit: Number(limit) }, 'Admin influencer tickets fetched.'));
});

/**
 * GET /api/admin/influencer-support/tickets/:id
 */
export const getInfluencerTicketDetail = asyncHandler(async (req, res) => {
    const ticket = await SupportTicket.findById(req.params.id)
        .populate('influencerId', 'name slug profileImage email referralCode status category socials bio createdAt')
        .populate('ticketTypeId', 'name icon')
        .lean();

    if (!ticket || !ticket.influencerId) {
        throw new ApiError(404, 'Influencer support ticket not found.');
    }

    const wallet = await InfluencerWallet.findOne({ influencerId: ticket.influencerId._id }).lean();

    res.status(200).json(new ApiResponse(200, { ticket, wallet }, 'Ticket details fetched.'));
});

/**
 * POST /api/admin/influencer-support/tickets/:id/message
 */
export const replyToInfluencerTicket = asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
        throw new ApiError(400, 'Message body is required.');
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) throw new ApiError(404, 'Ticket not found.');

    const newMessage = {
        senderId: adminId,
        senderType: 'admin',
        message: message.trim(),
    };

    ticket.messages.push(newMessage);
    ticket.status = 'in_progress';
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
    if (ticket.influencerId) {
        emitToRoom(`influencer_${ticket.influencerId}`, 'new_support_message', msgPayload);
    }
    emitToRoom('admin_room', 'new_support_message', msgPayload);

    res.status(200).json(new ApiResponse(200, ticket, 'Admin reply added.'));
});
