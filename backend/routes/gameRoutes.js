/**
 * routes/gameRoutes.js
 * Game score endpoints — Part 13.
 *
 * POST /api/games/scores   — save a session score  (auth required)
 * GET  /api/games/scores   — get recent scores     (auth required)
 * GET  /api/games/stats    — get per-game stats    (auth required)
 */

import { Router } from 'express';
import { protect } from '../middleware/protect.js';
import { postScore, getScores, getStats } from '../controllers/gameController.js';

const router = Router();

router.use(protect);  // all game routes require authentication

router.post('/scores',  postScore);
router.get('/scores',   getScores);
router.get('/stats',    getStats);

export default router;
