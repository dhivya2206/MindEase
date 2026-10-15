/**
 * controllers/authController.js
 * Thin HTTP handlers — delegate all business logic to authService.
 * Part 4 update: setRole handler added.
 */

import * as authService from '../services/authService.js';
import { sendSuccess } from '../utils/responseFormatter.js';
import { validate, registerSchema, loginSchema } from '../validators/authValidators.js';
import { AppError } from '../middleware/errorHandler.js';
import { User } from '../models/User.js';

// ── POST /api/auth/register ───────────────────────────────────────────────────
export const register = async (req, res, next) => {
  const { value, errors } = validate(registerSchema, req.body);
  if (errors) {
    return next(new AppError('Validation failed', 422, errors));
  }

  const { user, token } = await authService.registerUser(value);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Account created successfully',
    data: { user, token },
  });
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  const { value, errors } = validate(loginSchema, req.body);
  if (errors) {
    return next(new AppError('Validation failed', 422, errors));
  }

  const { user, token } = await authService.loginUser(value);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Logged in successfully',
    data: { user, token },
  });
};

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
// Stateless JWT — we just tell the client to discard the token.
// Cookie cleanup is handled here too for future cookie-based flows.
export const logout = (_req, res) => {
  res.clearCookie('mindease_token', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });

  return sendSuccess(res, { message: 'Logged out successfully' });
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
// Protected — req.user is set by the protect middleware
export const getMe = async (req, res) => {
  const user = await authService.getMe(req.user._id.toString());

  return sendSuccess(res, {
    message: 'User profile retrieved',
    data: { user },
  });
};

// ── PATCH /api/auth/set-role/:userId ────────────────────────────────────────────────────────────────
// Admin-only: assign a role to any user by ID.
export const setRole = async (req, res, next) => {
  const { userId } = req.params;
  const { role } = req.body;

  const VALID_ROLES = ['user', 'counsellor', 'admin'];
  if (!role || !VALID_ROLES.includes(role)) {
    return next(new AppError(`role must be one of: ${VALID_ROLES.join(', ')}`, 422));
  }

  const updated = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true, runValidators: true }
  );

  if (!updated) {
    return next(new AppError('User not found', 404));
  }

  return sendSuccess(res, {
    message: `Role updated to '${role}' for ${updated.email}`,
    data: { id: updated._id, email: updated.email, role: updated.role },
  });
};
