/**
 * routes/appointmentRoutes.js
 * User-facing appointment booking and history endpoints — Part 16.
 *
 * All routes require JWT authentication (`protect`).
 *
 * POST  /api/appointments            → bookAppointment
 * GET   /api/appointments/my         → getUserAppointments
 * PATCH /api/appointments/:id/cancel → userCancelAppointment
 */

import { Router } from 'express';
import { protect } from '../middleware/protect.js';
import * as appointmentController from '../controllers/appointmentController.js';

const router = Router();

router.use(protect);

router.post('/',            appointmentController.bookAppointment);
router.get('/my',           appointmentController.getUserAppointments);
router.patch('/:id/cancel', appointmentController.userCancelAppointment);

export default router;
