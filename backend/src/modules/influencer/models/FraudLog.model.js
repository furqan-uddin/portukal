import mongoose from 'mongoose';

const fraudLogSchema = new mongoose.Schema(
    {
        influencerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Influencer',
            default: null,
            index: true,
        },
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            default: null,
            index: true,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            default: null,
            index: true,
        },
        withdrawalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WithdrawalRequest',
            default: null,
            index: true,
        },
        fraudType: {
            type: String,
            required: true,
            index: true,
        },
        fraudScore: {
            type: Number,
            required: true,
            index: true,
        },
        fraudLevel: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            required: true,
            index: true,
        },
        breakdown: [
            {
                rule: { type: String, required: true },
                score: { type: Number, required: true },
                reason: { type: String, default: '' },
            },
        ],
        ipAddress: {
            type: String,
            default: '',
        },
        deviceFingerprint: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            enum: ['pending', 'under_review', 'safe', 'false_positive', 'investigating', 'suspended', 'blocked', 'resolved'],
            default: 'pending',
            index: true,
        },
        actionTaken: {
            type: String,
            default: '',
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
            default: null,
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
        timeline: [
            {
                event: { type: String, required: true },
                timestamp: { type: Date, default: Date.now },
                performedBy: { type: String, default: 'System' },
            },
        ],
    },
    { timestamps: true }
);

fraudLogSchema.index({ status: 1, fraudLevel: 1, createdAt: -1 });

const FraudLog = mongoose.models.FraudLog || mongoose.model('FraudLog', fraudLogSchema);
export default FraudLog;
