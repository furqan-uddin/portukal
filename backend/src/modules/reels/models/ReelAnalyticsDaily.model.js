import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Pre-aggregated daily analytics per reel.
 * Populated by the hourly aggregation worker (not by real-time writes).
 */
const reelAnalyticsDailySchema = new Schema(
    {
        reelId:    { type: Schema.Types.ObjectId, ref: 'Reel', required: true, index: true },
        vendorId:  { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
        date:      { type: String, required: true },  // YYYY-MM-DD

        // Viewership
        impressions:      { type: Number, default: 0 },
        uniqueViews:      { type: Number, default: 0 },
        totalViews:       { type: Number, default: 0 },
        views3s:          { type: Number, default: 0 },   // watched ≥3 seconds
        views10s:         { type: Number, default: 0 },   // watched ≥10 seconds
        completions:      { type: Number, default: 0 },
        totalWatchTime:   { type: Number, default: 0 },   // seconds
        avgWatchDuration: { type: Number, default: 0 },   // seconds
        completionRate:   { type: Number, default: 0 },   // 0-100%

        // Engagement
        likes:    { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        replies:  { type: Number, default: 0 },
        shares:   { type: Number, default: 0 },
        saves:    { type: Number, default: 0 },

        // Commerce
        productClicks:   { type: Number, default: 0 },
        ctr:             { type: Number, default: 0 },      // productClicks / totalViews
        orders:          { type: Number, default: 0 },
        revenue:         { type: Number, default: 0 },
        commission:      { type: Number, default: 0 },
        conversionRate:  { type: Number, default: 0 },      // orders / productClicks

        // Geo breakdown
        topCountries: [{ country: String, views: Number }],
        topCities:    [{ city: String, views: Number }],
        topDevices:   [{ device: String, views: Number }],
    },
    { timestamps: true }
);

// Unique index: one record per reel per day
reelAnalyticsDailySchema.index({ reelId: 1, date: 1 }, { unique: true });
reelAnalyticsDailySchema.index({ vendorId: 1, date: 1 });

// TTL: auto-expire analytics after 2 years
reelAnalyticsDailySchema.index({ createdAt: 1 }, { expireAfterSeconds: 2 * 365 * 24 * 60 * 60 });

const ReelAnalyticsDaily = mongoose.model('ReelAnalyticsDaily', reelAnalyticsDailySchema);
export default ReelAnalyticsDaily;
