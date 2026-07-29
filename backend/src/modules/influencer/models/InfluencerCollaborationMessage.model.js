import mongoose from 'mongoose';

const { Schema } = mongoose;

const influencerCollaborationMessageSchema = new Schema(
    {
        collaborationId: { type: Schema.Types.ObjectId, ref: 'InfluencerCollaboration', required: true, index: true },
        senderId:        { type: Schema.Types.ObjectId, required: true },
        senderModel:     { type: String, enum: ['Influencer', 'Vendor', 'Admin'], required: true },

        messageType: {
            type: String,
            enum: [
                'text',
                'image',
                'video',
                'document',
                'audio',
                'system',
                'product_card',
                'reel_card',
                'affiliate_card',
                'sample_request',
                'offer_update',
            ],
            default: 'text',
        },

        text: { type: String, trim: true, maxlength: 2000 },

        // Media attachments
        attachments: [
            {
                url:      { type: String, required: true },
                fileName: { type: String },
                fileType: { type: String },
                fileSize: { type: Number },
            },
        ],

        // Rich embedded card data
        productData: {
            productId: { type: Schema.Types.ObjectId, ref: 'Product' },
            name:      { type: String },
            price:     { type: Number },
            image:     { type: String },
        },

        reelData: {
            reelId:       { type: Schema.Types.ObjectId, ref: 'Reel' },
            title:        { type: String },
            thumbnailUrl: { type: String },
        },

        affiliateData: {
            referralCode: { type: String },
            slug:         { type: String },
            affiliateUrl: { type: String },
        },

        offerData: {
            commissionPercent: { type: Number },
            bonusAmount:       { type: Number },
            notes:             { type: String },
        },

        isRead: { type: Boolean, default: false, index: true },
        readAt: { type: Date },
    },
    {
        timestamps: true,
    }
);

influencerCollaborationMessageSchema.index({ collaborationId: 1, createdAt: 1 });

const InfluencerCollaborationMessage = mongoose.model('InfluencerCollaborationMessage', influencerCollaborationMessageSchema);
export default InfluencerCollaborationMessage;
