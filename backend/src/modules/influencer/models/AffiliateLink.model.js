import mongoose from 'mongoose';

const affiliateLinkSchema = new mongoose.Schema(
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
        referralCode: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        affiliateUrl: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            trim: true,
        },
        clicks: {
            type: Number,
            default: 0,
            min: 0,
        },
        orders: {
            type: Number,
            default: 0,
            min: 0,
        },
        revenue: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'deleted', 'expired', 'archived'],
            default: 'active',
        },
    },
    { timestamps: true }
);

affiliateLinkSchema.index({ influencerId: 1, productId: 1 }, { unique: true });

const AffiliateLink = mongoose.model('AffiliateLink', affiliateLinkSchema);
export default AffiliateLink;
