/**
 * context/NotificationContext.jsx
 * Global state management for in-app notifications — Part 18.
 *
 * Keeps notification unread count synchronized across:
 * - Top header notification bell
 * - Notification dropdown menu
 * - Dashboard notification feed
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as notificationService from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch full notification list and unread count
  const fetchNotifications = useCallback(async (showLoader = false) => {
    if (!user) return;
    if (showLoader) setIsLoading(true);
    try {
      const data = await notificationService.getNotifications({ limit: 30 });
      setNotifications(data?.notifications || []);
      setUnreadCount(data?.unreadCount || 0);
    } catch {
      // Graceful fallback
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [user]);

  // Fetch just the unread count (lightweight)
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count ?? 0);
    } catch {
      // Graceful fallback
    }
  }, [user]);

  // Initial load when user logs in
  useEffect(() => {
    if (user) {
      fetchNotifications(true);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, fetchNotifications]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await notificationService.markAsRead(id);
      if (typeof res?.unreadCount === 'number') {
        setUnreadCount(res.unreadCount);
      }
    } catch {
      // Re-sync on error
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await notificationService.markAllAsRead();
    } catch {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // Delete a notification
  const deleteNotification = useCallback(async (id) => {
    const target = notifications.find((n) => n.id === id);
    const wasUnread = target && !target.isRead;

    // Optimistic remove
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      const res = await notificationService.deleteNotification(id);
      if (typeof res?.unreadCount === 'number') {
        setUnreadCount(res.unreadCount);
      }
    } catch {
      fetchNotifications();
    }
  }, [notifications, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
};
