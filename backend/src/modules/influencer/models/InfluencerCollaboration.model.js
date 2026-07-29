import mongoose from 'mongoose';

const { Schema } = mongoose;

const influencerCollaborationSchema = new Schema(
    {
        vendorId:     { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
        influencerId: { type: Schema.Types.ObjectId, ref: 'Influencer', required: true, index: true },
        
        // Products involved in campaign
        products:     [{ type: Schema.Types.ObjectId, ref: 'Product' }],
        productId:    { type: Schema.Types.ObjectId, ref: 'Product' },

        // Associated artifacts
        campaignId:      { type: Schema.Types.ObjectId, ref: 'Campaign' },
        reelId:          { type: Schema.Types.ObjectId, ref: 'Reel' },
        affiliateLinkId: { type: Schema.Types.ObjectId, ref: 'AffiliateLink' },

        // Collaboration State
        status: {
            type: String,
            enum: ['pending', 'requested', 'accepted', 'rejected', 'paused', 'cancelled', 'completed'],
            default: 'pending',
            index: true,
        },

        // Commercial Offer
        offer: {
            commissionPercent: { type: Number, default: 10 },
            bonusAmount:       { type: Number, default: 0 },
            sampleRequired:    { type: Boolean, default: false },
            sampleShipped:     { type: Boolean, default: false },
            trackingNumber:    { type: String },
            budget:            { type: Number, default: 0 },
            notes:             { type: String },
        },

        // Audit Trail Timeline
        timeline: [
            {
                event:          { type: String, required: true },
                performerId:    { type: Schema.Types.ObjectId },
                performerModel: { type: String, enum: ['Influencer', 'Vendor', 'Admin'] },
                timestamp:      { type: Date, default: Date.now },
                notes:          { type: String },
            },
        ],

        // Messaging Metadata
        lastMessage:           { type: String, trim: true },
        lastMessageAt:         { type: Date, default: Date.now },
        unreadCountVendor:     { type: Number, default: 0 },
        unreadCountInfluencer: { type: Number, default: 0 },

        isArchived: { type: Boolean, default: false },
        isPinned:   { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

influencerCollaborationSchema.index({ vendorId: 1, influencerId: 1, status: 1 });

const InfluencerCollaboration = mongoose.model('InfluencerCollaboration', influencerCollaborationSchema);
export default InfluencerCollaboration;
