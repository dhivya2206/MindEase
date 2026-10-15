/**
 * controllers/counsellorController.js
 * Counsellor profile management — Part 15.
 *
 * Routes handled (all require protect + authorize('counsellor')):
 *   GET    /api/counsellors/me/profile  → getMyProfile
 *   PUT    /api/counsellors/me/profile  → upsertProfile (create or replace)
 *   PATCH  /api/counsellors/me/profile  → patchProfile  (partial update)
 */

import mongoose from 'mongoose';
import { Counsellor } from '../models/Counsellor.js';
import { User } from '../models/User.js';
import { sendSuccess } from '../utils/responseFormatter.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  validate,
  profileUpsertSchema,
  profilePatchSchema,
} from '../validators/counsellorValidators.js';

// ── GET /api/counsellors/me/profile ──────────────────────────────────────────
export const getMyProfile = async (req, res, next) => {
  const profile = await Counsellor.findOne({ user: req.user._id }).populate(
    'user',
    'name email avatar role createdAt'
  );

  if (!profile) {
    // Return a 200 with null data so the frontend can show the "setup profile" flow
    return sendSuccess(res, {
      message: 'No counsellor profile found — please create one',
      data: { profile: null },
    });
  }

  return sendSuccess(res, {
    message: 'Counsellor profile retrieved',
    data: { profile },
  });
};

// ── PUT /api/counsellors/me/profile ──────────────────────────────────────────
export const upsertProfile = async (req, res, next) => {
  const { value, errors } = validate(profileUpsertSchema, req.body);
  if (errors) return next(new AppError('Validation failed', 422, errors));

  const { name, ...profileFields } = value;

  if (name) {
    await User.findByIdAndUpdate(req.user._id, { name: name.trim() });
  }

  const profile = await Counsellor.findOneAndUpdate(
    { user: req.user._id },
    { ...profileFields, user: req.user._id },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).populate('user', 'name email avatar role createdAt');

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Counsellor profile saved successfully',
    data: { profile },
  });
};

// ── PATCH /api/counsellors/me/profile ────────────────────────────────────────
export const patchProfile = async (req, res, next) => {
  const { value, errors } = validate(profilePatchSchema, req.body);
  if (errors) return next(new AppError('Validation failed', 422, errors));

  // Ensure the profile exists before patching
  const existing = await Counsellor.findOne({ user: req.user._id });
  if (!existing) {
    return next(new AppError('Counsellor profile not found — please create it first (PUT /me/profile)', 404));
  }

  const { name, ...profileFields } = value;

  if (name) {
    await User.findByIdAndUpdate(req.user._id, { name: name.trim() });
  }

  // Apply only the provided fields
  Object.assign(existing, profileFields);
  await existing.save();
  await existing.populate('user', 'name email avatar role createdAt');

  return sendSuccess(res, {
    message: 'Profile updated',
    data: { profile: existing },
  });
};

// ── GET /api/counsellors ─────────────────────────────────────────────────────
export const listCounsellors = async (req, res, next) => {
  const filter = { isActive: true };
  if (req.query.specialization) {
    filter.specialization = new RegExp(req.query.specialization, 'i');
  }

  const counsellors = await Counsellor.find(filter)
    .populate('user', 'name email avatar')
    .sort({ experience: -1, createdAt: -1 });

  return sendSuccess(res, {
    message: 'Counsellors retrieved successfully',
    data: { counsellors },
    meta: { total: counsellors.length },
  });
};

// ── GET /api/counsellors/:id ─────────────────────────────────────────────────
export const getCounsellorById = async (req, res, next) => {
  let counsellor = null;
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    counsellor = await Counsellor.findById(req.params.id).populate('user', 'name email avatar');
    if (!counsellor) {
      counsellor = await Counsellor.findOne({ user: req.params.id }).populate('user', 'name email avatar');
    }
  }

  if (!counsellor || !counsellor.isActive) {
    return next(new AppError('Counsellor profile not found', 404));
  }

  return sendSuccess(res, {
    message: 'Counsellor details retrieved',
    data: { counsellor },
  });
};
