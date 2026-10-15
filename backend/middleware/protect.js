/**
 * middleware/protect.js
 * JWT authentication middleware — Part 3.
 *
 * Attaches the decoded user to req.user for downstream route handlers.
 * Must be applied before any route handler that requires authentication.
 *
 * Usage:
 *   import { protect } from '../middleware/protect.js';
 *   router.get('/me', protect, authController.getMe);
 */

import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';

/**
 * Extracts the Bearer token from the Authorization header OR a cookie.
 * Returns null if not present.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  // Also accept from a signed cookie (future refresh-token flow)
  if (req.cookies?.mindease_token) {
    return req.cookies.mindease_token;
  }
  return null;
};

/**
 * Protect middleware — validates JWT and populates req.user.
 * Throws 401 AppError on any failure so the global error handler formats it.
 */
export const protect = async (req, _res, next) => {
  const token = extractToken(req);

  if (!token) {
    return next(new AppError('Authentication required — please log in', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'mindease-api',
      audience: 'mindease-client',
    });
  } catch (err) {
    // JsonWebTokenError and TokenExpiredError are caught by global error handler
    return next(err);
  }

  // Verify the user still exists in the database
  // (handles cases where account was deleted after token was issued)
  const user = await User.findById(decoded.sub);
  if (!user) {
    return next(new AppError('The account associated with this token no longer exists', 401));
  }

  if (user.isActive === false) {
    return next(new AppError('This account has been deactivated. Please contact support.', 403));
  }

  // Attach to request — downstream handlers use req.user.id etc.
  req.user = user;
  next();
};
