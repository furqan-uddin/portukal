import { RevenueAnalyticsService } from './RevenueAnalyticsService.js';
import { ConversionAnalyticsService } from './ConversionAnalyticsService.js';
import { LeaderboardService } from './LeaderboardService.js';
import { GeographyAnalyticsService } from './GeographyAnalyticsService.js';
import { PlatformHealthService } from './PlatformHealthService.js';

export { RevenueAnalyticsService } from './RevenueAnalyticsService.js';
export { ConversionAnalyticsService } from './ConversionAnalyticsService.js';
export { LeaderboardService } from './LeaderboardService.js';
export { GeographyAnalyticsService } from './GeographyAnalyticsService.js';
export { PlatformHealthService } from './PlatformHealthService.js';

export class AnalyticsService {
    static getInfluencerAnalytics(influencerId, filters) {
        return RevenueAnalyticsService.getInfluencerAnalytics(influencerId, filters);
    }

    static getVendorAnalytics(vendorId, filters) {
        return RevenueAnalyticsService.getVendorAnalytics(vendorId, filters);
    }

    static getAdminAnalytics(filters) {
        return RevenueAnalyticsService.getAdminAnalytics(filters);
    }

    static getConversionFunnel(role, entityId, filters) {
        return ConversionAnalyticsService.getConversionFunnel(role, entityId, filters);
    }

    static getLeaderboards(role, entityId, filters) {
        return LeaderboardService.getLeaderboards(role, entityId, filters);
    }

    static getGeographicAnalytics(role, entityId, filters) {
        return GeographyAnalyticsService.getGeographicAnalytics(role, entityId, filters);
    }

    static getHeatmapAnalytics(role, entityId, filters) {
        return ConversionAnalyticsService.getHeatmapAnalytics(role, entityId, filters);
    }

    static getPlatformHealth() {
        return PlatformHealthService.getPlatformHealth();
    }
}
