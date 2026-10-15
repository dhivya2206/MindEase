/**
 * controllers/notificationController.js
 * HTTP handlers for Notification endpoints — Part 18.
 *
 * All routes require authentication (req.user is populated by protect middleware).
 */

import * as notificationService from '../services/notificationService.js';
import { sendSuccess } from '../utils/responseFormatter.js';

/**
 * GET /api/notifications
 * Query params: ?limit=20&page=1&unreadOnly=false
 */
export const getNotifications = async (req, res, next) => {
  try {
    const { limit, page, unreadOnly } = req.query;
    const result = await notificationService.getNotifications(req.user.id, {
      limit,
      page,
      unreadOnly: unreadOnly === 'true',
    });

    sendSuccess(res, {
      statusCode: 200,
      message: 'Notifications retrieved successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const result = await notificationService.getUnreadCount(req.user.id);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Unread count retrieved',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/notifications/:id/read
 */
export const markAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAsRead(req.user.id, req.params.id);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Notification marked as read',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/notifications/read-all
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    sendSuccess(res, {
      statusCode: 200,
      message: 'All notifications marked as read',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const result = await notificationService.deleteNotification(req.user.id, req.params.id);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Notification deleted successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/notifications/seed
 * Demo helper to re-seed sample notifications
 */
export const seedNotifications = async (req, res, next) => {
  try {
    const seeded = await notificationService.seedDefaultNotifications(req.user.id);
    const result = await notificationService.getNotifications(req.user.id);
    sendSuccess(res, {
      statusCode: 201,
      message: 'Sample notifications seeded',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
