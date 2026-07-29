import api from '../../../shared/utils/api';

export const getInfluencerAnalytics = (params = {}) =>
    api.get('/analytics/influencer', { params });

export const getVendorAnalytics = (params = {}) =>
    api.get('/analytics/vendor', { params });

export const getAdminAnalytics = (params = {}) =>
    api.get('/analytics/admin', { params });

export const getConversionFunnel = (params = {}) =>
    api.get('/analytics/funnel', { params });

export const getLeaderboards = (params = {}) =>
    api.get('/analytics/leaderboards', { params });

export const getGeographicAnalytics = (params = {}) =>
    api.get('/analytics/geography', { params });

export const getHeatmapAnalytics = (params = {}) =>
    api.get('/analytics/heatmap', { params });

export const getPlatformHealth = () =>
    api.get('/analytics/admin/health');
