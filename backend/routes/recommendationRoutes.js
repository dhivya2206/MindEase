/**
 * routes/recommendationRoutes.js
 * Recommendation engine routes — Part 8.
 *
 * GET /api/recommendations   — personalised, rule-based recommendations
 *
 * All routes require authentication (protect middleware).
 */

import { Router } from 'express';
import { protect } from '../middleware/protect.js';
import { getRecommendations } from '../controllers/recommendationController.js';

const router = Router();

router.use(protect);

// GET /api/recommendations
router.get('/', getRecommendations);

export default router;
