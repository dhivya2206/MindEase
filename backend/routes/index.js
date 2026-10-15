/**
 * routes/index.js
 * Root API router.
 * Part 9 update: chat routes mounted.
 * Part 13 update: game routes mounted.
 * Part 15 update: counsellor routes mounted.
 */

import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { getDBSnapshot, getDBDiagnostics } from '../utils/dbStatus.js';
import authRoutes            from './authRoutes.js';
import moodRoutes            from './moodRoutes.js';
import checkInRoutes         from './checkInRoutes.js';
import recommendationRoutes  from './recommendationRoutes.js';
import chatRoutes            from './chatRoutes.js';
import gameRoutes            from './gameRoutes.js';
import counsellorRoutes      from './counsellorRoutes.js';
import appointmentRoutes     from './appointmentRoutes.js';
import journeyRoutes         from './journeyRoutes.js';
import notificationRoutes    from './notificationRoutes.js';
import adminRoutes           from './adminRoutes.js';
import journalRoutes         from './journalRoutes.js';
import challengeRoutes       from './challengeRoutes.js';

const router = Router();

// ── GET /api/health ───────────────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  const db = getDBSnapshot();
  sendSuccess(res, {
    message: 'MindEase API is running',
    data: {
      server: {
        status: 'ok',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(process.uptime())}s`,
      },
      database: db,
    },
  });
});

// ── GET /api/db-health ────────────────────────────────────────────────────────
router.get('/db-health', async (_req, res) => {
  const diagnostics = await getDBDiagnostics();
  if (!diagnostics.connected) {
    return sendError(res, {
      statusCode: 503,
      message: 'Database is not connected',
      errors: diagnostics.error ? [diagnostics.error] : [],
    });
  }
  sendSuccess(res, {
    message: 'Database connection is healthy',
    data: { connected: diagnostics.connected, latencyMs: diagnostics.latencyMs, ...diagnostics.details },
  });
});

// ── /api/auth/* ────────────────────────────────────────────────────
router.use('/auth', authRoutes);

// ── /api/mood/* ────────────────────────────────────────────────────
router.use('/mood', moodRoutes);
router.use('/checkin', checkInRoutes);

// ── /api/recommendations/* ──────────────────────────────────────
router.use('/recommendations', recommendationRoutes);

// ── /api/chat/conversations/* ─────────────────────────────────
router.use('/chat/conversations', chatRoutes);

// ── /api/games/* ──────────────────────────────────────────────
router.use('/games', gameRoutes);

// ── /api/counsellors/* ────────────────────────────────────────
router.use('/counsellors', counsellorRoutes);

// ── /api/appointments/* ───────────────────────────────────────
router.use('/appointments', appointmentRoutes);

// ── /api/journey/* ────────────────────────────────────────────
router.use('/journey', journeyRoutes);

// ── /api/notifications/* ──────────────────────────────────────
router.use('/notifications', notificationRoutes);

// ── /api/admin/* ──────────────────────────────────────────────
router.use('/admin', adminRoutes);

// ── /api/journal/* ────────────────────────────────────────────
router.use('/journal', journalRoutes);

// ── /api/challenges/* ─────────────────────────────────────────
router.use('/challenges', challengeRoutes);

export default router;
