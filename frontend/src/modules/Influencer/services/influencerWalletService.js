import api from '../../../shared/utils/api';

// ─── Influencer Portal Endpoints ─────────────────────────────────────────────

export const getInfluencerWalletSummary = async () => {
    const response = await api.get('/influencer/wallet/summary');
    return response.data;
};

export const getInfluencerWalletTransactions = async (params = {}) => {
    const response = await api.get('/influencer/wallet/transactions', { params });
    return response.data;
};

export const getInfluencerSettlements = async (params = {}) => {
    const response = await api.get('/influencer/wallet/settlements', { params });
    return response.data;
};

export const requestInfluencerWithdrawal = async (data) => {
    const response = await api.post('/influencer/wallet/withdraw', data);
    return response.data;
};

export const getInfluencerWithdrawals = async (params = {}) => {
    const response = await api.get('/influencer/wallet/withdrawals', { params });
    return response.data;
};

// ─── Vendor Panel Endpoints ──────────────────────────────────────────────────

export const getVendorWalletSummary = async () => {
    const response = await api.get('/vendor/influencer-wallet/summary');
    return response.data;
};

export const getVendorLedger = async (params = {}) => {
    const response = await api.get('/vendor/influencer-wallet/ledger', { params });
    return response.data;
};

export const getVendorSettlements = async (params = {}) => {
    const response = await api.get('/vendor/influencer-wallet/settlements', { params });
    return response.data;
};

// ─── Admin Panel Endpoints ───────────────────────────────────────────────────

export const getAdminWithdrawalRequests = async (params = {}) => {
    const response = await api.get('/admin/withdrawals', { params });
    return response.data;
};

export const updateAdminWithdrawalStatus = async (id, data) => {
    const response = await api.patch(`/admin/withdrawals/${id}/status`, data);
    return response.data;
};

export const bulkUpdateAdminWithdrawals = async (data) => {
    const response = await api.post('/admin/withdrawals/bulk-status', data);
    return response.data;
};

export const triggerAdminSettlementRun = async () => {
    const response = await api.post('/admin/withdrawals/settlements/run');
    return response.data;
};

export const exportAdminWithdrawalsCSV = async () => {
    const response = await api.get('/admin/withdrawals/export-csv', { responseType: 'blob' });
    return response;
};
