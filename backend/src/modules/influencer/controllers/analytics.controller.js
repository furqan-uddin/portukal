import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import { RevenueAnalyticsService } from '../services/RevenueAnalyticsService.js';
import { ConversionAnalyticsService } from '../services/ConversionAnalyticsService.js';
import { LeaderboardService } from '../services/LeaderboardService.js';
import { GeographyAnalyticsService } from '../services/GeographyAnalyticsService.js';
import { PlatformHealthService } from '../services/PlatformHealthService.js';

// GET /api/influencer/analytics (Influencer Only)
export const getInfluencerAnalyticsHandler = asyncHandler(async (req, res) => {
    const influencerId = req.influencer._id;
    const filters = req.query;

    const data = await RevenueAnalyticsService.getInfluencerAnalytics(influencerId, filters);
    res.status(200).json(new ApiResponse(200, data, 'Influencer analytics retrieved successfully.'));
});

// GET /api/vendor/influencer-analytics (Vendor Only)
export const getVendorAnalyticsHandler = asyncHandler(async (req, res) => {
    const vendorId = req.user.id;
    const filters = req.query;

    const data = await RevenueAnalyticsService.getVendorAnalytics(vendorId, filters);
    res.status(200).json(new ApiResponse(200, data, 'Vendor influencer analytics retrieved successfully.'));
});

// GET /api/admin/influencers/analytics (Admin Only)
export const getAdminAnalyticsHandler = asyncHandler(async (req, res) => {
    const filters = req.query;

    const data = await RevenueAnalyticsService.getAdminAnalytics(filters);
    res.status(200).json(new ApiResponse(200, data, 'Admin ecosystem analytics retrieved successfully.'));
});

// GET /api/analytics/funnel (Role Scoped)
export const getConversionFunnelHandler = asyncHandler(async (req, res) => {
    const role = req.user?.role || 'admin';
    const entityId = req.influencer?._id || req.user?.id;
    const filters = req.query;

    const data = await ConversionAnalyticsService.getConversionFunnel(role, entityId, filters);
    res.status(200).json(new ApiResponse(200, data, 'Conversion funnel metrics retrieved.'));
});

// GET /api/analytics/leaderboards
export const getLeaderboardsHandler = asyncHandler(async (req, res) => {
    const role = req.user?.role || 'admin';
    const entityId = req.influencer?._id || req.user?.id;
    const filters = req.query;

    const data = await LeaderboardService.getLeaderboards(role, entityId, filters);
    res.status(200).json(new ApiResponse(200, data, 'Leaderboard rankings retrieved.'));
});

// GET /api/analytics/geography
export const getGeographicAnalyticsHandler = asyncHandler(async (req, res) => {
    const role = req.user?.role || 'admin';
    const entityId = req.influencer?._id || req.user?.id;
    const filters = req.query;

    const data = await GeographyAnalyticsService.getGeographicAnalytics(role, entityId, filters);
    res.status(200).json(new ApiResponse(200, data, 'Geographic analytics retrieved.'));
});

// GET /api/analytics/heatmap
export const getHeatmapAnalyticsHandler = asyncHandler(async (req, res) => {
    const role = req.user?.role || 'admin';
    const entityId = req.influencer?._id || req.user?.id;
    const filters = req.query;

    const data = await ConversionAnalyticsService.getHeatmapAnalytics(role, entityId, filters);
    res.status(200).json(new ApiResponse(200, data, 'Heatmap analytics retrieved.'));
});

// GET /api/admin/influencers/health (Admin Only)
export const getPlatformHealthHandler = asyncHandler(async (req, res) => {
    const data = await PlatformHealthService.getPlatformHealth();
    res.status(200).json(new ApiResponse(200, data, 'Platform health operational metrics retrieved.'));
});
