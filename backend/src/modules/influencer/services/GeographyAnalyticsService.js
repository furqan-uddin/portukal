import Order from '../../../models/Order.model.js';
import { RevenueAnalyticsService } from './RevenueAnalyticsService.js';

export class GeographyAnalyticsService {
    static async getGeographicAnalytics(role = 'admin', entityId = null, filters = {}) {
        const { currentStart, currentEnd } = RevenueAnalyticsService.parseDateRange(
            filters.range,
            filters.startDate,
            filters.endDate
        );
        const matchFilter = { createdAt: { $gte: currentStart, $lte: currentEnd } };

        const geoStats = await Order.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: { $ifNull: ['$shippingAddress.state', 'Other'] },
                    orders: { $sum: 1 },
                    revenue: { $sum: { $ifNull: ['$totalAmount', 0] } },
                },
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 },
        ]);

        return { geographicBreakdown: geoStats };
    }
}
