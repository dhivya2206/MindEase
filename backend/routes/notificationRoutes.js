/**
 * routes/notificationRoutes.js
 * In-app notification routes — Part 18.
 *
 * All endpoints require a valid JWT (protect middleware).
 *
 * GET    /api/notifications              → fetch notifications list + unreadCount
 * GET    /api/notifications/unread-count → quick count of unread notifications
 * PATCH  /api/notifications/read-all     → mark all notifications as read
 * PATCH  /api/notifications/:id/read     → mark single notification as read
 * DELETE /api/notifications/:id          → delete single notification
 * POST   /api/notifications/seed         → seed sample notifications (testing helper)
 */

import { Router } from 'express';
import { protect } from '../middleware/protect.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  seedNotifications,
} from '../controllers/notificationController.js';

const router = Router();

// Require authenticated user for all notification actions
router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);
router.post('/seed', seedNotifications);

export default router;
