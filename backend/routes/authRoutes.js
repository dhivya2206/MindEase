/**
 * routes/authRoutes.js
 * Auth router — Part 4 update: role-protected endpoints added.
 *
 * Public:
 *   POST  /api/auth/register
 *   POST  /api/auth/login
 *   POST  /api/auth/logout
 *
 * Protected (any authenticated user):
 *   GET   /api/auth/me
 *
 * Protected (admin only — for testing role assignment):
 *   PATCH /api/auth/set-role/:userId
 *
 * Role-scoped examples (Part 5+ will add real content here):
 *   GET   /api/auth/admin-ping   (admin only)
 *   GET   /api/auth/counsellor-ping  (counsellor + admin)
 */

import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { protect } from '../middleware/protect.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

// ── Public ────────────────────────────────────────────────────
router.post('/register', authController.register);
router.post('/login',    authController.login);
router.post('/logout',   authController.logout);

// ── Any authenticated user ────────────────────────────────────
router.get('/me', protect, authController.getMe);

// ── Admin only: assign a role to a user (dev / seeding utility) ──
router.patch('/set-role/:userId', protect, authorize('admin'), authController.setRole);

// ── Role-scoped smoke-test endpoints ─────────────────────────
router.get('/ping/admin',
  protect, authorize('admin'),
  (_req, res) => res.json({ success: true, message: 'Admin ping OK', role: 'admin' })
);

router.get('/ping/counsellor',
  protect, authorize('counsellor', 'admin'),
  (_req, res) => res.json({ success: true, message: 'Counsellor ping OK', role: 'counsellor' })
);

router.get('/ping/user',
  protect, authorize('user', 'counsellor', 'admin'),
  (_req, res) => res.json({ success: true, message: 'User ping OK', role: 'user' })
);

export default router;
