/**
 * controllers/appointmentController.js
 * Comprehensive appointment management for Users & Counsellors — Parts 15 & 16.
 *
 * User flow:
 *   POST   /api/appointments             → bookAppointment (with double-booking prevention)
 *   GET    /api/appointments/my          → getUserAppointments (active + history)
 *   PATCH  /api/appointments/:id/cancel  → userCancelAppointment
 *
 * Counsellor flow:
 *   GET    /api/counsellors/me/appointments              → getMyAppointments
 *   PATCH  /api/counsellors/me/appointments/:id/accept   → acceptAppointment (status -> confirmed)
 *   PATCH  /api/counsellors/me/appointments/:id/reject   → rejectAppointment (status -> rejected)
 *   PATCH  /api/counsellors/me/appointments/:id/cancel   → cancelAppointment (status -> cancelled)
 *   PATCH  /api/counsellors/me/appointments/:id/complete → completeAppointment (status -> completed)
 */

import { Appointment } from '../models/Appointment.js';
import { Counsellor } from '../models/Counsellor.js';
import { sendSuccess } from '../utils/responseFormatter.js';
import { AppError } from '../middleware/errorHandler.js';
import { createNotification } from '../services/notificationService.js';
import mongoose from 'mongoose';

// ── USER: Book Appointment ───────────────────────────────────────────────────
export const bookAppointment = async (req, res, next) => {
  const { counsellorId, scheduledAt, duration = 60, notes = '' } = req.body;

  if (!counsellorId) {
    return next(new AppError('Counsellor ID is required', 400));
  }
  if (!scheduledAt) {
    return next(new AppError('Appointment date and time is required', 400));
  }

  const requestedStart = new Date(scheduledAt);
  if (isNaN(requestedStart.getTime())) {
    return next(new AppError('Invalid appointment date format', 400));
  }
  if (requestedStart <= new Date()) {
    return next(new AppError('Appointment must be scheduled for a future date and time', 400));
  }

  const requestedDuration = Math.max(15, Math.min(180, Number(duration) || 60));
  const requestedEnd = new Date(requestedStart.getTime() + requestedDuration * 60000);

  // 1. Resolve Counsellor profile & associated User account
  let counsellorDoc = null;
  if (mongoose.Types.ObjectId.isValid(counsellorId)) {
    counsellorDoc = await Counsellor.findById(counsellorId).populate('user');
    if (!counsellorDoc) {
      counsellorDoc = await Counsellor.findOne({ user: counsellorId }).populate('user');
    }
  }

  if (!counsellorDoc || !counsellorDoc.isActive) {
    return next(new AppError('Selected counsellor is unavailable or inactive', 404));
  }

  const counsellorUserId = counsellorDoc.user._id;

  // 2. Prevent self-booking
  if (req.user._id.toString() === counsellorUserId.toString()) {
    return next(new AppError('You cannot book an appointment with yourself', 400));
  }

  // 3. Double-Booking Prevention: Check Counsellor overlap
  const activeStatuses = ['pending', 'confirmed', 'accepted'];
  const existingCounsellorAppts = await Appointment.find({
    counsellor: counsellorUserId,
    status: { $in: activeStatuses },
  });

  const hasCounsellorConflict = existingCounsellorAppts.some((appt) => {
    const existingStart = new Date(appt.scheduledAt).getTime();
    const existingEnd = existingStart + (appt.duration || 60) * 60000;
    return existingStart < requestedEnd.getTime() && existingEnd > requestedStart.getTime();
  });

  if (hasCounsellorConflict) {
    return next(
      new AppError(
        'This time slot is already booked for this counsellor. Please select another time.',
        409
      )
    );
  }

  // 4. Double-Booking Prevention: Check User's own overlapping schedule
  const existingUserAppts = await Appointment.find({
    user: req.user._id,
    status: { $in: activeStatuses },
  });

  const hasUserConflict = existingUserAppts.some((appt) => {
    const existingStart = new Date(appt.scheduledAt).getTime();
    const existingEnd = existingStart + (appt.duration || 60) * 60000;
    return existingStart < requestedEnd.getTime() && existingEnd > requestedStart.getTime();
  });

  if (hasUserConflict) {
    return next(
      new AppError('You already have an active appointment scheduled during this time slot.', 409)
    );
  }

  // 5. Create Appointment
  const newAppointment = await Appointment.create({
    counsellor: counsellorUserId,
    user: req.user._id,
    scheduledAt: requestedStart,
    duration: requestedDuration,
    notes: notes?.trim() || '',
    status: 'pending',
  });

  await newAppointment.populate('counsellor', 'name email avatar');
  await newAppointment.populate('user', 'name email avatar');

  // Trigger in-app notification for the user
  createNotification({
    userId: req.user._id,
    title: 'Appointment Request Submitted',
    message: `Your booking request with ${counsellorDoc.user?.name || 'counselor'} for ${new Date(requestedStart).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} has been submitted.`,
    type: 'APPOINTMENT_CONFIRMATION',
    icon: '📅',
    link: '/dashboard/user/appointments',
  }).catch(() => {});

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Appointment request booked successfully. Awaiting counsellor confirmation.',
    data: {
      appointment: {
        ...newAppointment.toJSON(),
        counsellorProfile: {
          id: counsellorDoc.id,
          specialization: counsellorDoc.specialization,
          profileImage: counsellorDoc.profileImage,
          location: counsellorDoc.location,
        },
      },
    },
  });
};

// ── USER: Get My Appointments (History + Upcoming) ───────────────────────────
export const getUserAppointments = async (req, res) => {
  const filter = { user: req.user._id };

  if (req.query.status) {
    if (req.query.status === 'confirmed' || req.query.status === 'accepted') {
      filter.status = { $in: ['confirmed', 'accepted'] };
    } else {
      filter.status = req.query.status;
    }
  }

  const appointments = await Appointment.find(filter)
    .populate('counsellor', 'name email avatar')
    .sort({ scheduledAt: -1 });

  // Attach counsellor profiles for rich card view
  const counsellorUserIds = [...new Set(appointments.map((a) => a.counsellor?._id?.toString()).filter(Boolean))];
  const profiles = await Counsellor.find({ user: { $in: counsellorUserIds } });
  const profileMap = new Map(profiles.map((p) => [p.user.toString(), p]));

  const enriched = appointments.map((appt) => {
    const cId = appt.counsellor?._id?.toString();
    const prof = profileMap.get(cId);
    return {
      ...appt.toJSON(),
      counsellorProfile: prof
        ? {
            id: prof.id,
            specialization: prof.specialization,
            profileImage: prof.profileImage,
            location: prof.location,
          }
        : null,
    };
  });

  return sendSuccess(res, {
    message: 'User appointments retrieved',
    data: { appointments: enriched },
    meta: { total: enriched.length },
  });
};

// ── USER: Cancel Appointment ──────────────────────────────────────────────────
export const userCancelAppointment = async (req, res, next) => {
  const appt = await Appointment.findById(req.params.id)
    .populate('counsellor', 'name email avatar')
    .populate('user', 'name email avatar');

  if (!appt) {
    return next(new AppError('Appointment not found', 404));
  }

  if (appt.user._id.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have permission to cancel this appointment', 403));
  }

  const cancellable = ['pending', 'confirmed', 'accepted'];
  if (!cancellable.includes(appt.status)) {
    return next(new AppError(`Cannot cancel appointment with status '${appt.status}'`, 400));
  }

  appt.status = 'cancelled';
  appt.cancelledAt = new Date();
  appt.cancelledBy = 'user';
  appt.reason = req.body.reason?.trim() || '';
  await appt.save();

  return sendSuccess(res, {
    message: 'Appointment cancelled successfully',
    data: { appointment: appt },
  });
};

// ── COUNSELLOR: Get My Appointments ──────────────────────────────────────────
export const getMyAppointments = async (req, res) => {
  const filter = { counsellor: req.user._id };
  const allowedStatuses = ['pending', 'confirmed', 'accepted', 'rejected', 'cancelled', 'completed'];

  if (req.query.status && allowedStatuses.includes(req.query.status)) {
    if (req.query.status === 'confirmed' || req.query.status === 'accepted') {
      filter.status = { $in: ['confirmed', 'accepted'] };
    } else {
      filter.status = req.query.status;
    }
  }

  const appointments = await Appointment.find(filter)
    .populate('user', 'name email avatar')
    .sort({ scheduledAt: 1, createdAt: -1 });

  return sendSuccess(res, {
    message: 'Appointments retrieved',
    data: { appointments },
    meta: { total: appointments.length },
  });
};

// ── COUNSELLOR: Assert Ownership Helper ───────────────────────────────────────
const getOwnedAppointment = async (appointmentId, counsellorId, next) => {
  const appt = await Appointment.findById(appointmentId).populate('user', 'name email avatar');
  if (!appt) {
    next(new AppError('Appointment not found', 404));
    return null;
  }
  if (appt.counsellor.toString() !== counsellorId.toString()) {
    next(new AppError('You do not have permission to manage this appointment', 403));
    return null;
  }
  return appt;
};

// ── COUNSELLOR: Accept Appointment (Status -> confirmed) ──────────────────────
export const acceptAppointment = async (req, res, next) => {
  const appt = await getOwnedAppointment(req.params.id, req.user._id, next);
  if (!appt) return;

  if (appt.status !== 'pending') {
    return next(new AppError(`Cannot accept an appointment with status '${appt.status}'`, 400));
  }

  appt.status = 'confirmed';
  appt.acceptedAt = new Date();
  await appt.save();

  // Trigger notification for the user
  createNotification({
    userId: appt.user,
    title: 'Appointment Confirmed! 📅',
    message: `Your appointment scheduled for ${new Date(appt.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} has been confirmed by your counselor.`,
    type: 'APPOINTMENT_CONFIRMATION',
    icon: '📅',
    link: '/dashboard/user/appointments',
  }).catch(() => {});

  return sendSuccess(res, {
    message: 'Appointment confirmed successfully',
    data: { appointment: appt },
  });
};

// ── COUNSELLOR: Reject Appointment ───────────────────────────────────────────
export const rejectAppointment = async (req, res, next) => {
  const appt = await getOwnedAppointment(req.params.id, req.user._id, next);
  if (!appt) return;

  if (appt.status !== 'pending') {
    return next(new AppError(`Cannot reject an appointment with status '${appt.status}'`, 400));
  }

  appt.status = 'rejected';
  appt.rejectedAt = new Date();
  appt.reason = req.body.reason?.trim() || '';
  await appt.save();

  return sendSuccess(res, {
    message: 'Appointment request rejected',
    data: { appointment: appt },
  });
};

// ── COUNSELLOR: Cancel Appointment ───────────────────────────────────────────
export const cancelAppointment = async (req, res, next) => {
  const appt = await getOwnedAppointment(req.params.id, req.user._id, next);
  if (!appt) return;

  const cancellableStatuses = ['pending', 'confirmed', 'accepted'];
  if (!cancellableStatuses.includes(appt.status)) {
    return next(new AppError(`Cannot cancel an appointment with status '${appt.status}'`, 400));
  }

  appt.status = 'cancelled';
  appt.cancelledAt = new Date();
  appt.cancelledBy = 'counsellor';
  appt.reason = req.body.reason?.trim() || '';
  await appt.save();

  return sendSuccess(res, {
    message: 'Appointment cancelled',
    data: { appointment: appt },
  });
};

// ── COUNSELLOR: Mark Appointment Completed ────────────────────────────────────
export const completeAppointment = async (req, res, next) => {
  const appt = await getOwnedAppointment(req.params.id, req.user._id, next);
  if (!appt) return;

  if (appt.status !== 'confirmed' && appt.status !== 'accepted') {
    return next(
      new AppError(
        `Cannot complete an appointment with status '${appt.status}'. It must first be confirmed.`,
        400
      )
    );
  }

  appt.status = 'completed';
  appt.completedAt = new Date();
  await appt.save();

  return sendSuccess(res, {
    message: 'Appointment marked as completed',
    data: { appointment: appt },
  });
};
