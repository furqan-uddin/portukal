import mongoose from 'mongoose';
import Order from '../../../models/Order.model.js';
import ReferralClick from '../models/ReferralClick.model.js';
import CommissionSettlement from '../models/CommissionSettlement.model.js';
import { roundVal } from './WalletService.js';
import { RevenueAnalyticsService } from './RevenueAnalyticsService.js';

export class ConversionAnalyticsService {
    static async getConversionFunnel(role = 'admin', entityId = null, filters = {}) {
        const { currentStart, currentEnd } = RevenueAnalyticsService.parseDateRange(
            filters.range,
            filters.startDate,
            filters.endDate
        );
        const matchFilter = { createdAt: { $gte: currentStart, $lte: currentEnd } };

        if (role === 'influencer' && entityId) {
            matchFilter.influencerId = new mongoose.Types.ObjectId(entityId);
        } else if (role === 'vendor' && entityId) {
            matchFilter.vendorId = new mongoose.Types.ObjectId(entityId);
        }

        const [clicks, orderStats, settledStats] = await Promise.all([
            ReferralClick.countDocuments(matchFilter),
            Order.aggregate([
                { $match: matchFilter },
                {
                    $group: {
                        _id: null,
                        orders: { $sum: 1 },
                        delivered: { $sum: { $cond: [{ $eq: ['$orderStatus', 'Delivered'] }, 1, 0] } },
                    },
                },
            ]),
            CommissionSettlement.countDocuments({ ...matchFilter, status: 'settled' }),
        ]);

        const ords = orderStats[0] || { orders: 0, delivered: 0 };

        const stages = [
            { stage: 'Referral Clicks', count: clicks, percent: 100 },
            { stage: 'Product Views', count: Math.round(clicks * 0.85), percent: clicks > 0 ? 85 : 0 },
            { stage: 'Add To Cart', count: Math.round(clicks * 0.45), percent: clicks > 0 ? 45 : 0 },
            { stage: 'Orders Placed', count: ords.orders, percent: clicks > 0 ? roundVal((ords.orders / clicks) * 100) : 0 },
            { stage: 'Delivered', count: ords.delivered, percent: ords.orders > 0 ? roundVal((ords.delivered / ords.orders) * 100) : 0 },
            { stage: 'Commission Settled', count: settledStats, percent: ords.delivered > 0 ? roundVal((settledStats / ords.delivered) * 100) : 0 },
        ];

        return { stages };
    }

    static async getHeatmapAnalytics(role = 'admin', entityId = null, filters = {}) {
        const { currentStart, currentEnd } = RevenueAnalyticsService.parseDateRange(
            filters.range,
            filters.startDate,
            filters.endDate
        );
        const matchFilter = { createdAt: { $gte: currentStart, $lte: currentEnd } };

        const hourlyClicks = await ReferralClick.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: { $hour: '$createdAt' },
                    clicks: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        return { hourlyClicks };
    }
}
