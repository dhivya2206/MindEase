/**
 * services/authService.js
 * Business logic for authentication — Part 3.
 *
 * The controller stays thin (HTTP concerns only).
 * All DB operations, token generation, and security logic live here.
 */

import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

// ── Token helpers ─────────────────────────────────────────────────────────────

/**
 * Sign a JWT access token for the given user id.
 * @param {string} userId
 * @returns {string} signed JWT
 */
export const signToken = (userId) =>
  jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'mindease-api',
    audience: 'mindease-client',
  });

/**
 * Build the safe user object that goes into API responses.
 * Password is never included — toJSON transform on the model handles this,
 * but we're explicit here as a second layer.
 *
 * @param {import('../models/User.js').User} user  Mongoose document
 * @returns {object}
 */
export const sanitizeUser = (user) => {
  const obj = user.toJSON();
  delete obj.password;   // redundant but explicit
  return obj;
};

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Register a new user.
 * Throws AppError on duplicate email (409) — Mongoose 11000 code is also
 * handled by the global error handler as a fallback.
 *
 * @param {{ name: string, email: string, password: string }} dto
 * @returns {{ user: object, token: string }}
 */
export const registerUser = async ({ name, email, password }) => {
  // Check for duplicate email with a clear, friendly message
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('An account with that email already exists', 409);
  }

  // Create — the pre-save hook hashes the password before writing
  const user = await User.create({ name, email, password });

  const token = signToken(user._id.toString());
  return { user: sanitizeUser(user), token };
};

/**
 * Login an existing user.
 * Uses a timing-safe comparison via bcrypt to prevent user-enumeration.
 *
 * @param {{ email: string, password: string }} dto
 * @returns {{ user: object, token: string }}
 */
export const loginUser = async ({ email, password }) => {
  // Fetch with password field (excluded by default via select: false)
  const user = await User.findOne({ email }).select('+password');

  // Both "no user" and "wrong password" return the same 401 message
  // to prevent attacker from confirming which emails are registered.
  const INVALID_MSG = 'Invalid email or password';

  if (!user) {
    // Still run bcrypt to prevent timing attacks even when the user doesn't exist
    await User.hashFallback(); // see static below — constant-time dummy hash
    throw new AppError(INVALID_MSG, 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError(INVALID_MSG, 401);
  }

  // Update last login timestamp (non-blocking — don't await)
  User.updateOne({ _id: user._id }, { lastLoginAt: new Date() }).exec();

  const token = signToken(user._id.toString());
  return { user: sanitizeUser(user), token };
};

/**
 * Return the authenticated user's profile.
 * req.user is populated by the protect middleware.
 *
 * @param {string} userId
 * @returns {object} sanitized user
 */
export const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return sanitizeUser(user);
};

// ── Static fallback for timing attack prevention ──────────────────────────────
// When no user is found, we still run a dummy bcrypt to ensure the response
// time is indistinguishable from a real failed comparison.
import bcrypt from 'bcryptjs';
const _DUMMY_HASH = '$2b$12$invalidhashfortimingreasonsonlyXXXXXXXXXXXXXXXXXXXX';
User.hashFallback = async () => {
  try { await bcrypt.compare('dummy', _DUMMY_HASH); } catch { /* no-op */ }
};
