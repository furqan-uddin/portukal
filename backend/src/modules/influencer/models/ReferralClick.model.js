import mongoose from 'mongoose';

const referralClickSchema = new mongoose.Schema(
    {
        influencerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Influencer',
            required: true,
            index: true,
        },
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            required: true,
            index: true,
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
            index: true,
        },
        affiliateLinkId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AffiliateLink',
            index: true,
        },
        referralCode: {
            type: String,
            required: true,
            index: true,
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        sessionId: {
            type: String,
            trim: true,
            index: true,
        },
        ipAddress: {
            type: String,
            trim: true,
        },
        userAgent: {
            type: String,
            trim: true,
        },
        device: {
            type: String,
            enum: ['desktop', 'mobile', 'tablet', 'unknown'],
            default: 'unknown',
        },
        clickedAt: {
            type: Date,
            default: Date.now,
        },
        converted: {
            type: Boolean,
            default: false,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            index: true,
        },
    },
    { timestamps: true }
);

const ReferralClick = mongoose.model('ReferralClick', referralClickSchema);
export default ReferralClick;
