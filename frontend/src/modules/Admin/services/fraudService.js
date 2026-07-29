import api from '../../../shared/utils/api';

export const getFraudRules = () =>
    api.get('/admin/influencer/fraud/rules');

export const updateFraudRule = (id, data) =>
    api.put(`/admin/influencer/fraud/rules/${id}`, data);

export const getFraudCases = (params = {}) =>
    api.get('/admin/influencer/fraud/cases', { params });

export const updateFraudCase = (id, data) =>
    api.put(`/admin/influencer/fraud/cases/${id}`, data);
