import api from '../../../shared/utils/api';

export const getSystemOperationsMetrics = () =>
    api.get('/admin/system/operations');
