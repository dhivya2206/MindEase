/**
 * routes/adminRoutes.js
 * Admin API routes — Part 19.
 *
 * ALL routes require:
 *   1. JWT authentication (`protect`)
 *   2. Strict ADMIN role authorization (`authorize('admin')`)
 */

import { Router } from 'express';
import { protect } from '../middleware/protect.js';
import { authorize } from '../middleware/authorize.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

// Enforce authentication & ADMIN role for ALL endpoints in this router
router.use(protect);
router.use(authorize('admin'));

// ── Statistics & Analytics ──────────────────────────────────────────
router.get('/stats',     adminController.getStats);
router.get('/analytics', adminController.getAnalytics);

// ── User Management ─────────────────────────────────────────────────
router.get('/users',                adminController.getUsers);
router.patch('/users/:id/role',     adminController.updateUserRole);
router.patch('/users/:id/status',   adminController.updateUserStatus);
router.patch('/users/:id/verify',   adminController.updateUserVerification);
router.delete('/users/:id',         adminController.deleteUser);

// ── Counsellor Management ───────────────────────────────────────────
router.get('/counsellors',             adminController.getCounsellors);
router.patch('/counsellors/:id/status', adminController.updateCounsellorStatus);
router.patch('/counsellors/:id',        adminController.updateCounsellorProfile);
router.delete('/counsellors/:id',       adminController.deleteCounsellor);

// ── Appointment Management ──────────────────────────────────────────
router.get('/appointments',            adminController.getAppointments);
router.patch('/appointments/:id/status', adminController.updateAppointmentStatus);

// ── Wellness Activities Management ──────────────────────────────────
router.get('/activities',             adminController.getWellnessActivities);
router.post('/activities',            adminController.createWellnessActivity);
router.patch('/activities/:id',       adminController.updateWellnessActivity);
router.delete('/activities/:id',      adminController.deleteWellnessActivity);
router.patch('/activities/:id/toggle', adminController.toggleWellnessActivity);

export default router;
