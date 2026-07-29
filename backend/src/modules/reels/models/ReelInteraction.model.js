import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Polymorphic interaction model — replaces separate View/Like/Comment/Share/Save/Click collections.
 * Each document represents ONE user interaction with ONE reel.
 */
const reelInteractionSchema = new Schema(
    {
        type: {
            type: String,
            enum: [
                'view',           // user watched the reel
                'like',           // user liked the reel
                'unlike',         // user unliked
                'comment',        // user posted a comment
                'reply',          // user replied to a comment
                'comment_like',   // user liked a comment
                'comment_report', // user reported a comment
                'share',          // user shared the reel
                'save',           // user bookmarked the reel
                'click',          // user clicked a tagged product
                'follow',         // user followed a vendor/influencer from reel
            ],
            required: true,
            index: true,
        },

        // References
        reelId:       { type: Schema.Types.ObjectId, ref: 'Reel', required: true, index: true },
        userId:       { type: Schema.Types.ObjectId, ref: 'User', index: true },
        vendorId:     { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
        influencerId: { type: Schema.Types.ObjectId, ref: 'Influencer', index: true },

        // Comment / Reply specific
        comment:      { type: String, trim: true, maxlength: 1000 },
        parentId:     { type: Schema.Types.ObjectId, ref: 'ReelInteraction', index: true }, // for replies
        mentions:     [{ type: String }],   // @username list
        isDeleted:    { type: Boolean, default: false },

        // Product Click specific
        productId:    { type: Schema.Types.ObjectId, ref: 'Product', index: true },

        // View / Watch tracking
        watchDuration:   { type: Number, default: 0 },   // seconds watched
        completed:       { type: Boolean, default: false },
        reached3s:       { type: Boolean, default: false },
        reached10s:      { type: Boolean, default: false },

        // Device / Geo
        device:   { type: String, enum: ['mobile', 'tablet', 'desktop', 'unknown'], default: 'unknown' },
        ip:       { type: String },
        country:  { type: String },
        city:     { type: String },

        // Analytics date bucket (for aggregation queries)
        dateBucket: { type: String, index: true },  // YYYY-MM-DD
    },
    {
        timestamps: true,
    }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
// Prevent duplicate likes (one like per user per reel)
reelInteractionSchema.index(
    { userId: 1, reelId: 1, type: 1 },
    { unique: true, partialFilterExpression: { type: { $in: ['like', 'save', 'follow'] }, userId: { $type: 'objectId' } } }
);

// Deduplicate views per user per day
reelInteractionSchema.index(
    { userId: 1, reelId: 1, type: 1, dateBucket: 1 },
    { unique: true, sparse: true, partialFilterExpression: { type: 'view', userId: { $exists: true } } }
);

// Fast feed queries
reelInteractionSchema.index({ reelId: 1, type: 1, createdAt: -1 });

// TTL: auto-expire raw view records after 180 days
reelInteractionSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 180 * 24 * 60 * 60, partialFilterExpression: { type: 'view' } }
);

// ─── Pre-save: set dateBucket ─────────────────────────────────────────────────
reelInteractionSchema.pre('save', function (next) {
    if (!this.dateBucket) {
        const d = new Date();
        this.dateBucket = d.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    next();
});

const ReelInteraction = mongoose.model('ReelInteraction', reelInteractionSchema);
export default ReelInteraction;
