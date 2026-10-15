/**
 * middleware/errorHandler.js
 * Global error-handling middleware — must be last in the Express chain.
 */

import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { sendError } from '../utils/responseFormatter.js';

// Custom application error class
export class AppError extends Error {
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`);
  if (env.isDev) logger.debug(err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return sendError(res, { statusCode: 422, message: 'Validation failed', errors });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, { statusCode: 409, message: `${field} already exists` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, { statusCode: 401, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, { statusCode: 401, message: 'Token expired' });
  }

  // Operational errors (thrown with AppError)
  if (err.isOperational) {
    return sendError(res, { statusCode: err.statusCode, message: err.message, errors: err.errors });
  }

  // Unknown / programmer errors
  return sendError(res, { statusCode: 500, message: env.isProd ? 'Something went wrong' : err.message });
};
