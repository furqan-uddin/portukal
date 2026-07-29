import express from 'express';
import {
    getInfluencerAnalyticsHandler,
    getVendorAnalyticsHandler,
    getAdminAnalyticsHandler,
    getConversionFunnelHandler,
    getLeaderboardsHandler,
    getGeographicAnalyticsHandler,
    getHeatmapAnalyticsHandler,
    getPlatformHealthHandler,
} from '../controllers/analytics.controller.js';
import { influencerAuthenticate, enforceApprovedInfluencer } from '../middleware/influencerAuth.js';
import { authenticate } from '../../../middlewares/authenticate.js';
import { authorize, enforceAccountStatus } from '../../../middlewares/authorize.js';

const router = express.Router();

// Influencer Analytics Route
router.get('/influencer', influencerAuthenticate, enforceApprovedInfluencer, getInfluencerAnalyticsHandler);

// Vendor Analytics Route
router.get('/vendor', authenticate, authorize('vendor'), enforceAccountStatus, getVendorAnalyticsHandler);

// Admin Ecosystem Analytics Route
router.get('/admin', authenticate, authorize('admin'), getAdminAnalyticsHandler);
router.get('/admin/health', authenticate, authorize('admin'), getPlatformHealthHandler);

// Common Scoped Analytics Routes
router.get('/funnel', authenticate, getConversionFunnelHandler);
router.get('/leaderboards', authenticate, getLeaderboardsHandler);
router.get('/geography', authenticate, getGeographicAnalyticsHandler);
router.get('/heatmap', authenticate, getHeatmapAnalyticsHandler);

export default router;
