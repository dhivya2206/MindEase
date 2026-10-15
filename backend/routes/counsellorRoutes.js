/**
 * routes/counsellorRoutes.js
 * Counsellor profile & browsing endpoints — Parts 15 & 16.
 *
 * Counsellor management endpoints (role: 'counsellor'):
 *   GET    /api/counsellors/me/profile         → get own profile
 *   PUT    /api/counsellors/me/profile         → create or replace profile
 *   PATCH  /api/counsellors/me/profile         → partial update
 *   GET    /api/counsellors/me/appointments              → list all
 *   PATCH  /api/counsellors/me/appointments/:id/accept   → accept pending
 *   PATCH  /api/counsellors/me/appointments/:id/reject   → reject pending
 *   PATCH  /api/counsellors/me/appointments/:id/cancel   → cancel appointment
 *   PATCH  /api/counsellors/me/appointments/:id/complete → complete appointment
 *
 * User browsing endpoints (authenticated):
 *   GET    /api/counsellors                    → list all active counsellors
 *   GET    /api/counsellors/:id                → view counsellor details & availability
 */

import { Router } from 'express';
import { protect } from '../middleware/protect.js';
import { authorize } from '../middleware/authorize.js';
import * as counsellorController from '../controllers/counsellorController.js';
import * as appointmentController from '../controllers/appointmentController.js';

const router = Router();

// ── Counsellor-scoped endpoints (/me/*) ───────────────────────────────────────
const counsellorOnly = [protect, authorize('counsellor')];

router.get('/me/profile',   ...counsellorOnly, counsellorController.getMyProfile);
router.put('/me/profile',   ...counsellorOnly, counsellorController.upsertProfile);
router.patch('/me/profile', ...counsellorOnly, counsellorController.patchProfile);

router.get('/me/appointments',                    ...counsellorOnly, appointmentController.getMyAppointments);
router.patch('/me/appointments/:id/accept',       ...counsellorOnly, appointmentController.acceptAppointment);
router.patch('/me/appointments/:id/reject',       ...counsellorOnly, appointmentController.rejectAppointment);
router.patch('/me/appointments/:id/cancel',       ...counsellorOnly, appointmentController.cancelAppointment);
router.patch('/me/appointments/:id/complete',     ...counsellorOnly, appointmentController.completeAppointment);

// ── Public / Client browsing endpoints ────────────────────────────────────────
router.get('/',    protect, counsellorController.listCounsellors);
router.get('/:id', protect, counsellorController.getCounsellorById);

export default router;
