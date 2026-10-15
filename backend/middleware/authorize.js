/**
 * middleware/authorize.js
 * Role-based authorization middleware — Part 4.
 *
 * Must ALWAYS run AFTER the `protect` middleware, which populates req.user.
 *
 * Usage (single role):
 *   router.delete('/users/:id', protect, authorize('admin'), handler);
 *
 * Usage (multiple allowed roles):
 *   router.get('/sessions', protect, authorize('counsellor', 'admin'), handler);
 *
 * Roles (defined in models/User.js):
 *   'user'       — standard registered user
 *   'counsellor' — licensed mental-health professional
 *   'admin'      — platform administrator
 */

import { AppError } from './errorHandler.js';

/**
 * Returns an Express middleware that allows only the specified roles.
 *
 * @param {...string} allowedRoles  One or more role strings from the enum.
 * @returns {import('express').RequestHandler}
 */
export const authorize = (...allowedRoles) => {
  return (req, _res, next) => {
    // protect() must have run first — req.user must be set
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return next(
        new AppError(
          `Access denied — this resource requires one of the following roles: ${allowedRoles.join(', ')}`,
          403
        )
      );
    }

    next();
  };
};
