/**
 * services/notificationService.js
 * In-App Notification business logic — Part 18.
 *
 * Provides:
 *   - createNotification(data)
 *   - getNotifications(userId, query)
 *   - getUnreadCount(userId)
 *   - markAsRead(userId, notificationId)
 *   - markAllAsRead(userId)
 *   - deleteNotification(userId, notificationId)
 *   - seedDefaultNotifications(userId)
 */

import { Notification } from '../models/Notification.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Creates a single in-app notification
 */
export const createNotification = async ({
  userId,
  title,
  message,
  type = 'SYSTEM',
  icon = '🔔',
  link = null,
  metadata = {},
}) => {
  if (!userId) throw new AppError('userId is required to create a notification', 400);

  const notif = await Notification.create({
    user: userId,
    title,
    message,
    type,
    icon,
    link,
    metadata,
  });

  return notif.toJSON();
};

/**
 * Seeds contextual initial notifications for a user if they have 0 notifications.
 * Covers all 5 required examples:
 *   1. Daily check-in reminder
 *   2. Appointment confirmation
 *   3. Appointment reminder
 *   4. Activity recommendation
 *   5. Wellness streak notification
 */
export const seedDefaultNotifications = async (userId) => {
  const existingCount = await Notification.countDocuments({ user: userId });
  if (existingCount > 0) return [];

  const now = Date.now();
  const defaults = [
    {
      user: userId,
      title: 'Daily Check-in Reminder',
      message: "Time for your daily wellness check-in! Take 2 minutes to reflect on how you're feeling today.",
      type: 'CHECKIN_REMINDER',
      icon: '📋',
      link: '/dashboard/user/checkin',
      isRead: false,
      createdAt: new Date(now - 1000 * 60 * 15), // 15 mins ago
    },
    {
      user: userId,
      title: 'Wellness Streak Milestone',
      message: "You're building momentum! Keep up your daily check-in habit to maintain your wellness streak.",
      type: 'STREAK',
      icon: '🔥',
      link: '/dashboard/user/journey',
      isRead: false,
      createdAt: new Date(now - 1000 * 60 * 60 * 2), // 2 hrs ago
    },
    {
      user: userId,
      title: 'Activity Recommendation',
      message: 'Take a mindful pause: Try a 5-minute Box Breathing exercise to release tension and reset focus.',
      type: 'RECOMMENDATION',
      icon: '🧘',
      link: '/dashboard/user/relax',
      isRead: false,
      createdAt: new Date(now - 1000 * 60 * 60 * 6), // 6 hrs ago
    },
    {
      user: userId,
      title: 'Appointment Reminder',
      message: 'Reminder: Check your upcoming session schedule and connect with your wellness counselor.',
      type: 'APPOINTMENT_REMINDER',
      icon: '⏰',
      link: '/dashboard/user/appointments',
      isRead: false,
      createdAt: new Date(now - 1000 * 60 * 60 * 18), // 18 hrs ago
    },
    {
      user: userId,
      title: 'Appointment Confirmed',
      message: 'Your wellness consultation booking request has been confirmed. Tap to view session details.',
      type: 'APPOINTMENT_CONFIRMATION',
      icon: '📅',
      link: '/dashboard/user/appointments',
      isRead: true,
      readAt: new Date(now - 1000 * 60 * 60 * 24),
      createdAt: new Date(now - 1000 * 60 * 60 * 26), // 26 hrs ago
    },
  ];

  return Notification.insertMany(defaults);
};

/**
 * Fetch paginated list of notifications for a user, sorted newest first
 */
export const getNotifications = async (userId, { limit = 20, page = 1, unreadOnly = false } = {}) => {
  const numericLimit = Math.max(1, Math.min(50, parseInt(limit, 10) || 20));
  const numericPage = Math.max(1, parseInt(page, 10) || 1);
  const skip = (numericPage - 1) * numericLimit;

  // Auto-seed if user has zero notifications
  const totalUserCount = await Notification.countDocuments({ user: userId });
  if (totalUserCount === 0) {
    await seedDefaultNotifications(userId);
  }

  const filter = { user: userId };
  if (unreadOnly) {
    filter.isRead = false;
  }

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(numericLimit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  const notifications = items.map((doc) => ({
    id: doc._id.toString(),
    title: doc.title,
    message: doc.message,
    type: doc.type,
    icon: doc.icon,
    link: doc.link,
    isRead: doc.isRead,
    readAt: doc.readAt,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }));

  return {
    notifications,
    unreadCount,
    pagination: {
      total,
      page: numericPage,
      limit: numericLimit,
      totalPages: Math.ceil(total / numericLimit) || 1,
    },
  };
};

/**
 * Get just the unread count for quick navbar badge display
 */
export const getUnreadCount = async (userId) => {
  const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });
  return { unreadCount };
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

  return {
    notification: notification.toJSON(),
    unreadCount,
  };
};

/**
 * Mark all unread notifications as read for a user
 */
export const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return {
    modifiedCount: result.modifiedCount,
    unreadCount: 0,
  };
};

/**
 * Delete a single notification
 */
export const deleteNotification = async (userId, notificationId) => {
  const result = await Notification.deleteOne({
    _id: notificationId,
    user: userId,
  });

  if (result.deletedCount === 0) {
    throw new AppError('Notification not found', 404);
  }

  const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

  return {
    success: true,
    deletedId: notificationId,
    unreadCount,
  };
};
