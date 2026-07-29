import ReelInteraction from '../models/ReelInteraction.model.js';
import ReelAnalyticsDaily from '../models/ReelAnalyticsDaily.model.js';
import Reel from '../../../models/Reel.model.js';

/**
 * Trending score formula:
 * score = (views * 0.3 + orders * 2.0 + completionRate * 1.5 + ctr * 2.0) / (ageHours ^ 0.5)
 * Higher score = more trending
 */
export const computeTrendingScore = (stats, createdAt) => {
    const ageMs = Date.now() - new Date(createdAt).getTime();
    const ageHours = Math.max(ageMs / (1000 * 60 * 60), 1);

    const score =
        (stats.totalViews * 0.3 +
            stats.orders * 2.0 +
            (stats.completionRate || 0) * 1.5 +
            (stats.ctr || 0) * 2.0) /
        Math.sqrt(ageHours);

    return Math.round(score * 100) / 100;
};

/**
 * Get aggregated stats for a single reel from ReelAnalyticsDaily.
 */
export const getReelAggregatedStats = async (reelId) => {
    const pipeline = [
        { $match: { reelId: reelId } },
        {
            $group: {
                _id: '$reelId',
                totalViews:      { $sum: '$totalViews' },
                uniqueViews:     { $sum: '$uniqueViews' },
                likes:           { $sum: '$likes' },
                comments:        { $sum: '$comments' },
                shares:          { $sum: '$shares' },
                saves:           { $sum: '$saves' },
                productClicks:   { $sum: '$productClicks' },
                orders:          { $sum: '$orders' },
                revenue:         { $sum: '$revenue' },
                commission:      { $sum: '$commission' },
                totalWatchTime:  { $sum: '$totalWatchTime' },
                completions:     { $sum: '$completions' },
                avgCompletionRate: { $avg: '$completionRate' },
                avgCTR:          { $avg: '$ctr' },
            },
        },
    ];

    const [result] = await ReelAnalyticsDaily.aggregate(pipeline);
    if (!result) {
        return {
            totalViews: 0, uniqueViews: 0, likes: 0, comments: 0,
            shares: 0, saves: 0, productClicks: 0, orders: 0,
            revenue: 0, commission: 0, totalWatchTime: 0,
            completions: 0, completionRate: 0, ctr: 0,
        };
    }

    return {
        ...result,
        completionRate: result.avgCompletionRate || 0,
        ctr: result.avgCTR || 0,
    };
};

/**
 * Aggregate interactions for a date bucket and upsert ReelAnalyticsDaily.
 * Called by the hourly analytics worker.
 */
export const aggregateDailyAnalytics = async (reelId, dateBucket) => {
    const mongoose = (await import('mongoose')).default;
    const reelObjId = typeof reelId === 'string' ? new mongoose.Types.ObjectId(reelId) : reelId;

    const [viewStats, engagementStats, clickStats] = await Promise.all([
        // View stats
        ReelInteraction.aggregate([
            { $match: { reelId: reelObjId, type: 'view', dateBucket } },
            {
                $group: {
                    _id: null,
                    totalViews:     { $sum: 1 },
                    uniqueViews:    { $addToSet: '$userId' },
                    views3s:        { $sum: { $cond: ['$reached3s', 1, 0] } },
                    views10s:       { $sum: { $cond: ['$reached10s', 1, 0] } },
                    completions:    { $sum: { $cond: ['$completed', 1, 0] } },
                    totalWatchTime: { $sum: '$watchDuration' },
                    // Geo
                    countries: { $push: '$country' },
                    cities:    { $push: '$city' },
                    devices:   { $push: '$device' },
                },
            },
        ]),
        // Engagement stats
        ReelInteraction.aggregate([
            { $match: { reelId: reelObjId, type: { $in: ['like', 'comment', 'share', 'save'] }, dateBucket } },
            { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
        // Product click stats
        ReelInteraction.aggregate([
            { $match: { reelId: reelObjId, type: 'click', dateBucket } },
            { $group: { _id: null, clicks: { $sum: 1 } } },
        ]),
    ]);

    const vs = viewStats[0] || {};
    const totalViews = vs.totalViews || 0;
    const uniqueViews = (vs.uniqueViews || []).filter(Boolean).length;
    const completions = vs.completions || 0;
    const totalWatchTime = vs.totalWatchTime || 0;
    const avgWatchDuration = totalViews > 0 ? totalWatchTime / totalViews : 0;
    const completionRate = totalViews > 0 ? (completions / totalViews) * 100 : 0;

    const engMap = {};
    engagementStats.forEach((e) => { engMap[e._id] = e.count; });
    const productClicks = clickStats[0]?.clicks || 0;
    const ctr = totalViews > 0 ? (productClicks / totalViews) * 100 : 0;

    // Count top geo
    const countFreq = (arr) => {
        const freq = {};
        (arr || []).filter(Boolean).forEach((v) => { freq[v] = (freq[v] || 0) + 1; });
        return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => ({ name: k, count: v }));
    };

    const reel = await Reel.findById(reelId, 'vendorId');

    await ReelAnalyticsDaily.findOneAndUpdate(
        { reelId: reelObjId, date: dateBucket },
        {
            $set: {
                vendorId:        reel?.vendorId,
                totalViews,      uniqueViews,
                views3s:         vs.views3s || 0,
                views10s:        vs.views10s || 0,
                completions,     totalWatchTime,
                avgWatchDuration: Math.round(avgWatchDuration * 10) / 10,
                completionRate:  Math.round(completionRate * 10) / 10,
                likes:           engMap['like'] || 0,
                comments:        engMap['comment'] || 0,
                shares:          engMap['share'] || 0,
                saves:           engMap['save'] || 0,
                productClicks,   ctr: Math.round(ctr * 100) / 100,
                topCountries:    countFreq(vs.countries),
                topCities:       countFreq(vs.cities),
                topDevices:      countFreq(vs.devices),
            },
        },
        { upsert: true, new: true }
    );
};

/**
 * Update trending score for all published reels.
 * Called by the trending worker every 6 hours.
 */
export const updateAllTrendingScores = async () => {
    const reels = await Reel.find({ status: 'approved', publishedAt: { $exists: true } }, '_id createdAt').lean();
    const updates = await Promise.allSettled(
        reels.map(async (reel) => {
            const stats = await getReelAggregatedStats(reel._id);
            const score = computeTrendingScore(stats, reel.createdAt);
            return Reel.updateOne({ _id: reel._id }, { $set: { trendingScore: score } });
        })
    );
    return updates.filter((r) => r.status === 'fulfilled').length;
};
