/**
 * controllers/checkInController.js
 * HTTP handlers for check-in endpoints — Part 7.
 */

import * as checkInService from '../services/checkInService.js';
import { sendSuccess } from '../utils/responseFormatter.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  validate,
  createCheckInSchema,
  updateCheckInSchema,
} from '../validators/checkInValidators.js';

// ── GET /api/checkin/today ────────────────────────────────────
export const getTodayCheckIn = async (req, res) => {
  const entry = await checkInService.getTodayCheckIn(req.user._id.toString());
  return sendSuccess(res, {
    message: entry ? "Today's check-in retrieved" : 'No check-in for today yet',
    data: { checkIn: entry },
  });
};

// ── GET /api/checkin/trend ────────────────────────────────────
export const getWellnessTrend = async (req, res) => {
  const days  = Math.min(parseInt(req.query.days, 10) || 14, 90);
  const trend = await checkInService.getWellnessTrend(req.user._id.toString(), days);
  return sendSuccess(res, { message: 'Wellness trend retrieved', data: trend });
};

// ── GET /api/checkin ──────────────────────────────────────────
export const getCheckIns = async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 14);
  const result = await checkInService.getCheckIns(req.user._id.toString(), { page, limit });
  return sendSuccess(res, {
    message: 'Check-in history retrieved',
    data: { entries: result.entries },
    meta: { total: result.total, page: result.page, pages: result.pages },
  });
};

// ── POST /api/checkin ─────────────────────────────────────────
export const createCheckIn = async (req, res, next) => {
  const { value, errors } = validate(createCheckInSchema, req.body);
  if (errors) return next(new AppError('Validation failed', 422, errors));

  const entry = await checkInService.createCheckIn(req.user._id.toString(), value);
  return sendSuccess(res, { statusCode: 201, message: 'Check-in submitted', data: { checkIn: entry } });
};

// ── GET /api/checkin/:id ──────────────────────────────────────
export const getCheckInById = async (req, res) => {
  const entry = await checkInService.getCheckInById(req.params.id, req.user._id.toString());
  return sendSuccess(res, { message: 'Check-in retrieved', data: { checkIn: entry } });
};

// ── PATCH /api/checkin/:id ────────────────────────────────────
export const updateCheckIn = async (req, res, next) => {
  const { value, errors } = validate(updateCheckInSchema, req.body);
  if (errors) return next(new AppError('Validation failed', 422, errors));

  const entry = await checkInService.updateCheckIn(req.params.id, req.user._id.toString(), value);
  return sendSuccess(res, { message: 'Check-in updated', data: { checkIn: entry } });
};
