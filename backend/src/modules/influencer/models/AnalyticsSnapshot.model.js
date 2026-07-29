import mongoose from 'mongoose';

const analyticsSnapshotSchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: true,
            index: true,
        },
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            default: null,
            index: true,
        },
        influencerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Influencer',
            default: null,
            index: true,
        },
        ordersCount: {
            type: Number,
            default: 0,
        },
        deliveredOrdersCount: {
            type: Number,
            default: 0,
        },
        cancelledOrdersCount: {
            type: Number,
            default: 0,
        },
        revenue: {
            type: Number,
            default: 0,
        },
        commission: {
            type: Number,
            default: 0,
        },
        reservedCommission: {
            type: Number,
            default: 0,
        },
        releasedCommission: {
            type: Number,
            default: 0,
        },
        clicks: {
            type: Number,
            default: 0,
        },
        conversions: {
            type: Number,
            default: 0,
        },
        settlementsAmount: {
            type: Number,
            default: 0,
        },
        withdrawalsAmount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Compound index for fast queries
analyticsSnapshotSchema.index({ date: -1, influencerId: 1, vendorId: 1 });

const AnalyticsSnapshot = mongoose.models.AnalyticsSnapshot || mongoose.model('AnalyticsSnapshot', analyticsSnapshotSchema);
export default AnalyticsSnapshot;
