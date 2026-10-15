/**
 * utils/responseFormatter.js
 * Standard API response shape for all endpoints.
 *
 * Success: { success: true, message, data, meta }
 * Error:   { success: false, message, errors }
 */

/**
 * Send a standardised success response.
 * @param {import('express').Response} res
 * @param {object} options
 * @param {number}  [options.statusCode=200]
 * @param {string}  [options.message='Success']
 * @param {*}       [options.data=null]
 * @param {object}  [options.meta=null]  - pagination metadata etc.
 */
export const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null, meta = null } = {}) => {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  if (meta !== null) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

/**
 * Send a standardised error response.
 * @param {import('express').Response} res
 * @param {object} options
 * @param {number}   [options.statusCode=500]
 * @param {string}   [options.message='Internal Server Error']
 * @param {string[]} [options.errors=[]]
 */
export const sendError = (res, { statusCode = 500, message = 'Internal Server Error', errors = [] } = {}) => {
  const payload = { success: false, message };
  if (errors.length) payload.errors = errors;
  return res.status(statusCode).json(payload);
};
