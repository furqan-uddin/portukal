import Notification from '../models/Notification.model.js';
import Influencer from '../models/Influencer.model.js';
import Vendor from '../../../models/Vendor.model.js';
import { emitToRoom } from '../../../services/socket.service.js';

export class NotificationService {
    /**
     * Create In-App Notification and optional Email Dispatch
     */
    static async createNotification({
        recipientType,
        recipientId = null,
        title,
        message,
        category = 'system',
        priority = 'normal',
        action = '',
        actionUrl = '',
        data = {},
    }) {
        const notification = await Notification.create({
            recipientType,
            recipientId,
            recipientModel: recipientType === 'influencer' ? 'Influencer' : recipientType === 'vendor' ? 'Vendor' : 'Admin',
            title,
            message,
            category,
            priority,
            action,
            actionUrl,
            data,
        });

        // Trigger real-time socket broadcast to recipient room
        if (recipientId) {
            const room = `${recipientType}_${recipientId}`;
            emitToRoom(room, 'notification', notification);
            emitToRoom(room, 'new_notification', notification);
            if (category === 'NEW_FOLLOWER' || category === 'follower') {
                emitToRoom(room, 'new_follower', notification);
            }
        }

        return notification;
    }

    /**
     * Fetch paginated notification feed
     */
    static async getNotifications({ recipientType, recipientId, page = 1, limit = 20, category = null }) {
        const query = {
            recipientType,
            deletedAt: null,
        };

        if (recipientId) {
            query.recipientId = recipientId;
        }

        if (category) {
            query.category = category;
        }

        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            Notification.countDocuments(query),
            Notification.countDocuments({ ...query, read: false }),
        ]);

        return {
            notifications,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / limit),
            },
            unreadCount,
        };
    }

    /**
     * Mark single notification read
     */
    static async markAsRead(notificationId, recipientType, recipientId) {
        const query = { _id: notificationId, recipientType };
        if (recipientId) query.recipientId = recipientId;

        const notif = await Notification.findOneAndUpdate(
            query,
            { $set: { read: true, readAt: new Date() } },
            { new: true }
        );
        return notif;
    }

    /**
     * Mark all notifications read
     */
    static async markAllAsRead(recipientType, recipientId) {
        const query = { recipientType, read: false, deletedAt: null };
        if (recipientId) query.recipientId = recipientId;

        await Notification.updateMany(query, { $set: { read: true, readAt: new Date() } });
        return { success: true };
    }

    /**
     * Soft delete / archive notification
     */
    static async softDeleteNotification(notificationId, recipientType, recipientId) {
        const query = { _id: notificationId, recipientType };
        if (recipientId) query.recipientId = recipientId;

        const notif = await Notification.findOneAndUpdate(
            query,
            { $set: { deletedAt: new Date() } },
            { new: true }
        );
        return notif;
    }
}
