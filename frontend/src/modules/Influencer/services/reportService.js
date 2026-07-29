import api from '../../../shared/utils/api';

export const requestReportGeneration = (data) =>
    api.post('/reports/generate', data);

export const getReportHistory = (params = {}) =>
    api.get('/reports/history', { params });

export const downloadReport = (id) => {
    window.open(`/api/reports/download/${id}`, '_blank');
};
