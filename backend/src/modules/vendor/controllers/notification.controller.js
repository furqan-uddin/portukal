import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Notification from '../../../models/Notification.model.js';

const getVendorIds = (req) => {
    const ids = [];
    if (req.user?.id) ids.push(req.user.id);
    if (req.user?._id) ids.push(req.user._id);
    if (req.vendor?._id) ids.push(req.vendor._id);
    if (req.user?.vendorId) ids.push(req.user.vendorId);
    return Array.from(new Set(ids.map(id => String(id))));
};

// GET /api/vendor/notifications
export const getVendorNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, type, isRead } = req.query;
    const numericPage = Math.max(1, Number(page) || 1);
    const numericLimit = Math.max(1, Number(limit) || 20);
    const skip = (numericPage - 1) * numericLimit;

    const vendorIds = getVendorIds(req);

    const filter = {
        recipientId: { $in: vendorIds },
        recipientType: 'vendor',
    };

    if (type && type !== 'all') {
        filter.type = type;
    }
    if (isRead === 'true') {
        filter.isRead = true;
    } else if (isRead === 'false') {
        filter.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(numericLimit),
        Notification.countDocuments(filter),
        Notification.countDocuments({
            recipientId: { $in: vendorIds },
            recipientType: 'vendor',
            isRead: false,
        }),
    ]);

    res.status(200).json(
        new ApiResponse(
            200,
            {
                notifications,
                total,
                unreadCount,
                page: numericPage,
                pages: Math.ceil(total / numericLimit),
            },
            'Vendor notifications fetched.'
        )
    );
});

// PUT /api/vendor/notifications/:id/read
export const markVendorNotificationAsRead = asyncHandler(async (req, res) => {
    const vendorIds = getVendorIds(req);
    const notification = await Notification.findOneAndUpdate(
        {
            _id: req.params.id,
            recipientId: { $in: vendorIds },
            recipientType: 'vendor',
        },
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        throw new ApiError(404, 'Notification not found.');
    }

    res.status(200).json(
        new ApiResponse(200, notification, 'Vendor notification marked as read.')
    );
});

// PUT /api/vendor/notifications/read-all
export const markAllVendorNotificationsAsRead = asyncHandler(async (req, res) => {
    const vendorIds = getVendorIds(req);
    await Notification.updateMany(
        {
            recipientId: { $in: vendorIds },
            recipientType: 'vendor',
            isRead: false,
        },
        { isRead: true }
    );

    res.status(200).json(
        new ApiResponse(200, null, 'All vendor notifications marked as read.')
    );
});

// DELETE /api/vendor/notifications/:id
export const deleteVendorNotification = asyncHandler(async (req, res) => {
    const vendorIds = getVendorIds(req);
    const deleted = await Notification.findOneAndDelete({
        _id: req.params.id,
        recipientId: { $in: vendorIds },
        recipientType: 'vendor',
    });

    if (!deleted) {
        throw new ApiError(404, 'Notification not found.');
    }

    res.status(200).json(new ApiResponse(200, null, 'Vendor notification deleted.'));
});
