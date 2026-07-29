import api from '../../../shared/utils/api';

export const getNotifications = (params = {}) =>
    api.get('/notifications', { params });

export const markNotificationRead = (id) =>
    api.put(`/notifications/${id}/read`);

export const markAllNotificationsRead = () =>
    api.put('/notifications/read-all');

export const archiveNotification = (id) =>
    api.delete(`/notifications/${id}`);
