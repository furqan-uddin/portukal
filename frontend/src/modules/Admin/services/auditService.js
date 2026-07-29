import api from '../../../shared/utils/api';

export const getAuditLogs = (params = {}) =>
    api.get('/admin/audit', { params });
