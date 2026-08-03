import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Daily follower growth analytics schema per creator
 */
const followAnalyticsSchema = new Schema(
    {
        influencerId: { type: Schema.Types.ObjectId, ref: 'Influencer', required: true, index: true },
        dateStr: { type: String, required: true, index: true }, // Format: "YYYY-MM-DD"
        newFollowers: { type: Number, default: 0 },
        unfollows: { type: Number, default: 0 },
        netGrowth: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Compound index: one record per influencer per date
followAnalyticsSchema.index({ influencerId: 1, dateStr: 1 }, { unique: true });

const FollowAnalytics = mongoose.models.FollowAnalytics || mongoose.model('FollowAnalytics', followAnalyticsSchema);
export default FollowAnalytics;
