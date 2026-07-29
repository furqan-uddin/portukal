import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        recipientType: {
            type: String,
            enum: ['influencer', 'vendor', 'admin'],
            required: true,
            index: true,
        },
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'recipientModel',
            default: null,
            index: true,
        },
        recipientModel: {
            type: String,
            enum: ['Influencer', 'Vendor', 'Admin'],
            default: 'Influencer',
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            enum: ['commission', 'withdrawal', 'settlement', 'report', 'system', 'fraud', 'wallet'],
            default: 'system',
            index: true,
        },
        priority: {
            type: String,
            enum: ['low', 'normal', 'high', 'critical'],
            default: 'normal',
            index: true,
        },
        action: {
            type: String,
            default: '',
        },
        actionUrl: {
            type: String,
            default: '',
        },
        read: {
            type: Boolean,
            default: false,
            index: true,
        },
        readAt: {
            type: Date,
            default: null,
        },
        deletedAt: {
            type: Date,
            default: null,
            index: true,
        },
        data: {
            type: Object,
            default: {},
        },
    },
    { timestamps: true }
);

notificationSchema.index({ recipientType: 1, recipientId: 1, deletedAt: 1, read: 1, createdAt: -1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export default Notification;
