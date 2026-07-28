import api from '../../../shared/utils/api';

// Marketplace Products
export const getMarketplaceProducts = (params = {}) =>
    api.get('/influencer/marketplace', { params });

export const getMarketplaceProductBySlug = (slug) =>
    api.get(`/influencer/marketplace/product/${slug}`);

// Affiliate Links
export const generateAffiliateLink = (productId) =>
    api.post('/influencer/affiliate-links/generate', { productId });

export const getMyAffiliateLinks = (params = {}) =>
    api.get('/influencer/affiliate-links', { params });

export const deleteAffiliateLink = (id) =>
    api.delete(`/influencer/affiliate-links/${id}`);

// Referral Tracking
export const trackReferralClick = (data) =>
    api.post('/referrals/track-click', data);

export const validateReferralCode = (code) =>
    api.get(`/referrals/validate/${code}`);

// Commission Settings
export const getGlobalCommissionSettings = () =>
    api.get('/influencer/commission-settings/global');

export const updateGlobalCommissionSettings = (data) =>
    api.put('/influencer/commission-settings/global', data);

export const getVendorInfluencerSettings = () =>
    api.get('/influencer/commission-settings/vendor-settings');

export const updateVendorInfluencerSettings = (data) =>
    api.put('/influencer/commission-settings/vendor-settings', data);
