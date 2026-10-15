/**
 * controllers/adminController.js
 * Admin HTTP controllers — Part 19.
 *
 * All handlers require 'admin' role (enforced via protect and authorize('admin') middleware).
 */

import * as adminService from '../services/adminService.js';
import { sendSuccess } from '../utils/responseFormatter.js';
import { AppError } from '../middleware/errorHandler.js';

// ── GET /api/admin/stats ──────────────────────────────────────────────
export const getStats = async (_req, res) => {
  const stats = await adminService.getPlatformStats();
  return sendSuccess(res, {
    message: 'Platform statistics retrieved',
    data: stats,
  });
};

// ── GET /api/admin/analytics ──────────────────────────────────────────
export const getAnalytics = async (_req, res) => {
  const analytics = await adminService.getAnalytics();
  return sendSuccess(res, {
    message: 'Platform analytics retrieved',
    data: analytics,
  });
};

// ── GET /api/admin/users ──────────────────────────────────────────────
export const getUsers = async (req, res) => {
  const { page, limit, search, role, status } = req.query;
  const result = await adminService.getUsers({ page, limit, search, role, status });
  return sendSuccess(res, {
    message: 'Users retrieved',
    data: result,
  });
};

// ── PATCH /api/admin/users/:id/role ───────────────────────────────────
export const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const updated = await adminService.updateUserRole(id, role, req.user._id);
  return sendSuccess(res, {
    message: `User role updated to '${role}'`,
    data: { user: updated },
  });
};

// ── PATCH /api/admin/users/:id/status ─────────────────────────────────
export const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  if (isActive === undefined) {
    throw new AppError('isActive field is required', 400);
  }
  const updated = await adminService.updateUserStatus(id, isActive, req.user._id);
  return sendSuccess(res, {
    message: `User account ${isActive ? 'activated' : 'deactivated'}`,
    data: { user: updated },
  });
};

// ── PATCH /api/admin/users/:id/verify ─────────────────────────────────
export const updateUserVerification = async (req, res) => {
  const { id } = req.params;
  const { isVerified } = req.body;
  if (isVerified === undefined) {
    throw new AppError('isVerified field is required', 400);
  }
  const updated = await adminService.updateUserVerification(id, isVerified);
  return sendSuccess(res, {
    message: `User verification set to ${isVerified}`,
    data: { user: updated },
  });
};

// ── DELETE /api/admin/users/:id ───────────────────────────────────────
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  const result = await adminService.deleteUser(id, req.user._id);
  return sendSuccess(res, {
    message: 'User account removed successfully',
    data: result,
  });
};

// ── GET /api/admin/counsellors ────────────────────────────────────────
export const getCounsellors = async (req, res) => {
  const { search, status } = req.query;
  const counsellors = await adminService.getCounsellors({ search, status });
  return sendSuccess(res, {
    message: 'Counsellors retrieved',
    data: { counsellors },
  });
};

// ── PATCH /api/admin/counsellors/:id/status ───────────────────────────
export const updateCounsellorStatus = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  if (isActive === undefined) {
    throw new AppError('isActive field is required', 400);
  }
  const updated = await adminService.updateCounsellorStatus(id, isActive);
  return sendSuccess(res, {
    message: `Counsellor ${isActive ? 'activated' : 'deactivated'}`,
    data: { counsellor: updated },
  });
};

// ── PATCH /api/admin/counsellors/:id ──────────────────────────────────
export const updateCounsellorProfile = async (req, res) => {
  const { id } = req.params;
  const updated = await adminService.updateCounsellorProfile(id, req.body);
  return sendSuccess(res, {
    message: 'Counsellor profile updated',
    data: { counsellor: updated },
  });
};

// ── DELETE /api/admin/counsellors/:id ─────────────────────────────────
export const deleteCounsellor = async (req, res) => {
  const { id } = req.params;
  const result = await adminService.deleteCounsellorProfile(id);
  return sendSuccess(res, {
    message: 'Counsellor profile deleted',
    data: result,
  });
};

// ── GET /api/admin/appointments ───────────────────────────────────────
export const getAppointments = async (req, res) => {
  const { page, limit, status, search } = req.query;
  const result = await adminService.getAppointments({ page, limit, status, search });
  return sendSuccess(res, {
    message: 'Appointments retrieved',
    data: result,
  });
};

// ── PATCH /api/admin/appointments/:id/status ──────────────────────────
export const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  const updated = await adminService.updateAppointmentStatus(id, status, reason);
  return sendSuccess(res, {
    message: `Appointment status updated to '${status}'`,
    data: { appointment: updated },
  });
};

// ── GET /api/admin/activities ─────────────────────────────────────────
export const getWellnessActivities = async (req, res) => {
  const { category, status, search } = req.query;
  const activities = await adminService.getWellnessActivities({ category, status, search });
  return sendSuccess(res, {
    message: 'Wellness activities retrieved',
    data: { activities },
  });
};

// ── POST /api/admin/activities ────────────────────────────────────────
export const createWellnessActivity = async (req, res) => {
  const created = await adminService.createWellnessActivity(req.body, req.user._id);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Wellness activity created',
    data: { activity: created },
  });
};

// ── PATCH /api/admin/activities/:id ───────────────────────────────────
export const updateWellnessActivity = async (req, res) => {
  const { id } = req.params;
  const updated = await adminService.updateWellnessActivity(id, req.body);
  return sendSuccess(res, {
    message: 'Wellness activity updated',
    data: { activity: updated },
  });
};

// ── DELETE /api/admin/activities/:id ──────────────────────────────────
export const deleteWellnessActivity = async (req, res) => {
  const { id } = req.params;
  const result = await adminService.deleteWellnessActivity(id);
  return sendSuccess(res, {
    message: 'Wellness activity removed',
    data: result,
  });
};

// ── PATCH /api/admin/activities/:id/toggle ────────────────────────────
export const toggleWellnessActivity = async (req, res) => {
  const { id } = req.params;
  const toggled = await adminService.toggleWellnessActivity(id);
  return sendSuccess(res, {
    message: `Activity status toggled to ${toggled.isActive ? 'Active' : 'Inactive'}`,
    data: { activity: toggled },
  });
};
