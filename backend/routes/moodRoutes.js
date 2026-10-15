/**
 * routes/moodRoutes.js
 * All mood endpoints.
 * Part 10 update: analyze-text added.
 * Part 11 update: POST /api/mood now accepts source=FACIAL (from facial analyzer).
 *
 * GET    /api/mood                — paginated history (with filters)
 * GET    /api/mood/stats          — chart data (weekly / frequency / trend)
 * POST   /api/mood                — create entry (source: MANUAL | TEXT_AI | FACIAL)
 * POST   /api/mood/analyze-text   — AI emotion analysis from free text
 * GET    /api/mood/:id            — single entry
 * PATCH  /api/mood/:id            — edit entry
 * DELETE /api/mood/:id            — delete entry
 */

import { Router } from 'express';
import * as moodController from '../controllers/moodController.js';
import { protect } from '../middleware/protect.js';

const router = Router();

// All mood routes require an authenticated user
router.use(protect);

// ── Collection ────────────────────────────────────────────────
router.route('/')
  .get(moodController.getMoods)
  .post(moodController.createMood);

// ── Stats (must come before /:id) ─────────────────────────────
router.get('/stats', moodController.getMoodStats);

// ── AI emotion analysis (must come before /:id) ───────────────
router.post('/analyze-text', moodController.analyzeText);

// ── Item ──────────────────────────────────────────────────────
router.route('/:id')
  .get(moodController.getMoodById)
  .patch(moodController.updateMood)
  .delete(moodController.deleteMood);

export default router;
