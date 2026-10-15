/**
 * routes/journeyRoutes.js
 * "My Wellness Journey" analytics endpoints — Part 17.
 *
 * GET  /api/journey/stats?range=week|month  — aggregates real user data across all pillars
 * POST /api/journey/seed                   — seed authentic sample activities for demo accounts
 */

import { Router } from 'express';
import { protect } from '../middleware/protect.js';
import * as journeyController from '../controllers/journeyController.js';

const router = Router();

// All journey endpoints require authenticated user session
router.use(protect);

router.get('/stats', journeyController.getStats);
router.post('/seed', journeyController.seedData);

export default router;
