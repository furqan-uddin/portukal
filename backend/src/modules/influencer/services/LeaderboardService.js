import CommissionSettlement from '../models/CommissionSettlement.model.js';
import { RevenueAnalyticsService } from './RevenueAnalyticsService.js';

export class LeaderboardService {
    static async getLeaderboards(role = 'admin', entityId = null, filters = {}) {
        const { currentStart, currentEnd } = RevenueAnalyticsService.parseDateRange(
            filters.range,
            filters.startDate,
            filters.endDate
        );

        const [topInfluencers, topVendors] = await Promise.all([
            CommissionSettlement.aggregate([
                { $match: { createdAt: { $gte: currentStart, $lte: currentEnd } } },
                {
                    $group: {
                        _id: '$influencerId',
                        totalCommission: { $sum: '$commissionAmount' },
                        ordersCount: { $sum: 1 },
                    },
                },
                { $sort: { totalCommission: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'influencers',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'influencer',
                    },
                },
                { $unwind: { path: '$influencer', preserveNullAndEmptyArrays: true } },
            ]),
            CommissionSettlement.aggregate([
                { $match: { createdAt: { $gte: currentStart, $lte: currentEnd } } },
                {
                    $group: {
                        _id: '$vendorId',
                        totalCommissionPaid: { $sum: '$commissionAmount' },
                        ordersCount: { $sum: 1 },
                    },
                },
                { $sort: { totalCommissionPaid: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'vendors',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'vendor',
                    },
                },
                { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },
            ]),
        ]);

        return { topInfluencers, topVendors };
    }
}
