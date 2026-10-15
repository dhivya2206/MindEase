/**
 * services/notificationService.js
 * Frontend client for in-app notifications — Part 18.
 */

import api from './api.js';

const BASE = '/api/notifications';

/**
 * Fetch notifications list and unread count.
 * @param {{ limit?: number, page?: number, unreadOnly?: boolean }} params
 */
export const getNotifications = async ({ limit = 20, page = 1, unreadOnly = false } = {}) => {
  const { data } = await api.get(BASE, {
    params: { limit, page, unreadOnly },
  });
  return data.data; // { notifications, unreadCount, pagination }
};

/**
 * Fetch just the unread count (ideal for lightweight navbar badges).
 */
export const getUnreadCount = async () => {
  const { data } = await api.get(`${BASE}/unread-count`);
  return data.data.unreadCount;
};

/**
 * Mark a single notification as read.
 * @param {string} notificationId
 */
export const markAsRead = async (notificationId) => {
  const { data } = await api.patch(`${BASE}/${notificationId}/read`);
  return data.data; // { notification, unreadCount }
};

/**
 * Mark all notifications as read.
 */
export const markAllAsRead = async () => {
  const { data } = await api.patch(`${BASE}/read-all`);
  return data.data; // { modifiedCount, unreadCount: 0 }
};

/**
 * Delete a notification.
 * @param {string} notificationId
 */
export const deleteNotification = async (notificationId) => {
  const { data } = await api.delete(`${BASE}/${notificationId}`);
  return data.data; // { success, deletedId, unreadCount }
};

/**
 * Re-seed demo notifications if list is empty.
 */
export const seedNotifications = async () => {
  const { data } = await api.post(`${BASE}/seed`);
  return data.data;
};
