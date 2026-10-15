/**
 * routes/checkInRoutes.js
 * All check-in endpoints — Part 7. All routes require authentication.
 *
 * GET  /api/checkin/today   — today's check-in (null if not done)
 * GET  /api/checkin/trend   — wellness trend (last 14 days default)
 * GET  /api/checkin          — paginated history
 * POST /api/checkin          — submit today's check-in
 * GET  /api/checkin/:id      — single entry
 * PATCH /api/checkin/:id     — edit check-in (recalculates score)
 */

import { Router } from 'express';
import * as checkInController from '../controllers/checkInController.js';
import { protect } from '../middleware/protect.js';

const router = Router();

router.use(protect);

// Named routes before /:id
router.get('/today', checkInController.getTodayCheckIn);
router.get('/trend', checkInController.getWellnessTrend);

// Collection
router.route('/')
  .get(checkInController.getCheckIns)
  .post(checkInController.createCheckIn);

// Item
router.route('/:id')
  .get(checkInController.getCheckInById)
  .patch(checkInController.updateCheckIn);

export default router;
