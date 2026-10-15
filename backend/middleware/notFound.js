/**
 * middleware/notFound.js
 * 404 handler — catches all unmatched routes.
 */

import { sendError } from '../utils/responseFormatter.js';

export const notFound = (req, res) => {
  sendError(res, {
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};
