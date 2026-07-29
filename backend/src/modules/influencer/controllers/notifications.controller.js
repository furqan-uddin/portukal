import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import { NotificationService } from '../services/NotificationService.js';

// GET /api/notifications
export const getNotificationsHandler = asyncHandler(async (req, res) => {
    const role = req.influencer ? 'influencer' : req.user?.role || 'influencer';
    const entityId = req.influencer?._id || req.user?.id;
    const { page = 1, limit = 20, category } = req.query;

    const data = await NotificationService.getNotifications({
        recipientType: role,
        recipientId: entityId,
        page,
        limit,
        category,
    });

    res.status(200).json(new ApiResponse(200, data, 'Notifications retrieved.'));
});

// PUT /api/notifications/:id/read
export const markAsReadHandler = asyncHandler(async (req, res) => {
    const role = req.influencer ? 'influencer' : req.user?.role || 'influencer';
    const entityId = req.influencer?._id || req.user?.id;
    const { id } = req.params;

    const data = await NotificationService.markAsRead(id, role, entityId);
    res.status(200).json(new ApiResponse(200, data, 'Notification marked as read.'));
});

// PUT /api/notifications/read-all
export const markAllAsReadHandler = asyncHandler(async (req, res) => {
    const role = req.influencer ? 'influencer' : req.user?.role || 'influencer';
    const entityId = req.influencer?._id || req.user?.id;

    const data = await NotificationService.markAllAsRead(role, entityId);
    res.status(200).json(new ApiResponse(200, data, 'All notifications marked as read.'));
});

// DELETE /api/notifications/:id
export const archiveNotificationHandler = asyncHandler(async (req, res) => {
    const role = req.influencer ? 'influencer' : req.user?.role || 'influencer';
    const entityId = req.influencer?._id || req.user?.id;
    const { id } = req.params;

    const data = await NotificationService.softDeleteNotification(id, role, entityId);
    res.status(200).json(new ApiResponse(200, data, 'Notification archived.'));
});
