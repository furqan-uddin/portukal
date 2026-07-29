import mongoose from 'mongoose';

const { Schema } = mongoose;

// ─── Tagged Product Sub-document ────────────────────────────────────────────
const taggedProductSchema = new Schema({
    productId:   { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    vendorId:    { type: Schema.Types.ObjectId, ref: 'Vendor' },
    label:       { type: String, trim: true },       // e.g. "₹499 · Shirt"
    position:    { type: Number, default: 0 },       // display order in UI
}, { _id: false });

// ─── Video Metadata Sub-document ────────────────────────────────────────────
const videoMetaSchema = new Schema({
    publicId:     { type: String },
    secureUrl:    { type: String, required: true },
    hlsUrl:       { type: String },                  // future HLS streaming URL
    dashUrl:      { type: String },                  // future DASH streaming URL
    deliveryType: { type: String, enum: ['direct', 'hls', 'dash'], default: 'direct' },
    duration:     { type: Number },                  // seconds
    width:        { type: Number },
    height:       { type: Number },
    format:       { type: String, default: 'mp4' },
    fileSize:     { type: Number },                  // bytes
}, { _id: false });

// ─── Thumbnail Sub-document ──────────────────────────────────────────────────
const thumbnailSchema = new Schema({
    publicId:  { type: String },
    secureUrl: { type: String },
}, { _id: false });

// ─── AI / Moderation Sub-document ───────────────────────────────────────────
const aiMetaSchema = new Schema({
    tags:              [{ type: String }],
    category:          { type: String },
    transcript:        { type: String },
    autoCaptions:      { type: String },
    language:          { type: String, default: 'en' },
    moderationScore:   { type: Number, min: 0, max: 1 }, // 0=safe, 1=unsafe
    moderationFlags:   [{ type: String }],
}, { _id: false });

// ─── Main Reel Schema ────────────────────────────────────────────────────────
const reelSchema = new Schema(
    {
        // Core
        title:          { type: String, required: true, trim: true, maxlength: 120 },
        description:    { type: String, trim: true, maxlength: 500 },
        caption:        { type: String, trim: true, maxlength: 300 },  // backward compat

        // Ownership
        vendorId:       { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
        influencerId:   { type: Schema.Types.ObjectId, ref: 'Influencer', index: true },
        userId:         { type: Schema.Types.ObjectId, ref: 'User', index: true },  // backward compat

        // Products (multi-product support)
        taggedProducts: { type: [taggedProductSchema], default: [] },
        productId:      { type: Schema.Types.ObjectId, ref: 'Product', index: true }, // primary / backward compat

        // Video & Thumbnail
        video:          { type: videoMetaSchema, required: true },
        videoUrl:       { type: String },      // backward compat alias for video.secureUrl
        thumbnail:      { type: thumbnailSchema },
        thumbnailUrl:   { type: String },      // backward compat alias for thumbnail.secureUrl

        // Workflow Status
        status: {
            type: String,
            enum: ['draft', 'preview', 'vendor_pending', 'pending', 'approved', 'rejected', 'archived', 'hidden'],
            default: 'draft',
            index: true,
        },
        uploadedByModel: { type: String, enum: ['Vendor', 'Influencer'], default: 'Vendor' },
        vendorApprovalStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'not_required'], default: 'not_required', index: true },
        vendorRejectionReason: { type: String, trim: true },
        rejectionReason: { type: String, trim: true },
        changeRequest:   { type: String, trim: true },  // Admin requested edits text

        // Moderation
        moderatedBy:    { type: Schema.Types.ObjectId, ref: 'Admin' },  // backward compat
        moderatedAt:    { type: Date },                                  // backward compat
        approvedBy:     { type: Schema.Types.ObjectId, ref: 'Admin' },
        approvedAt:     { type: Date },

        // Scheduling & Publishing
        scheduledPublishAt: { type: Date, index: true },
        publishedAt:        { type: Date, index: true },

        // Versioning
        version:        { type: Number, default: 1, min: 1 },
        parentReelId:   { type: Schema.Types.ObjectId, ref: 'Reel', index: true },
        isLatestVersion: { type: Boolean, default: true, index: true },

        // Discovery & Ranking
        category:       { type: String, trim: true, index: true },
        tags:           [{ type: String, trim: true }],
        visibility:     { type: String, enum: ['public', 'unlisted', 'private'], default: 'public' },
        isFeatured:     { type: Boolean, default: false, index: true },
        featuredAt:     { type: Date },

        // Trending Score (computed by worker, stored for fast sorting)
        trendingScore:  { type: Number, default: 0, index: true },

        // AI / Future-readiness
        ai: { type: aiMetaSchema },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
reelSchema.index({ status: 1, publishedAt: -1 });
reelSchema.index({ vendorId: 1, status: 1 });
reelSchema.index({ trendingScore: -1, status: 1 });
reelSchema.index({ category: 1, status: 1, trendingScore: -1 });
reelSchema.index({ tags: 1 });

// ─── Virtual: primaryProductId ───────────────────────────────────────────────
reelSchema.virtual('primaryProductId').get(function () {
    if (this.productId) return this.productId;
    if (this.taggedProducts && this.taggedProducts.length > 0) return this.taggedProducts[0].productId;
    return null;
});

// ─── Pre-save: sync backward-compat aliases ──────────────────────────────────
reelSchema.pre('save', function (next) {
    if (this.video?.secureUrl && !this.videoUrl) this.videoUrl = this.video.secureUrl;
    if (this.thumbnail?.secureUrl && !this.thumbnailUrl) this.thumbnailUrl = this.thumbnail.secureUrl;
    next();
});

const Reel = mongoose.model('Reel', reelSchema);
export default Reel;
