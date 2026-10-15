/**
 * validators/checkInValidators.js
 * Joi schemas for daily wellness check-in — Part 7.
 */

import Joi from 'joi';
import { validate } from './authValidators.js';

// ── Reusable question field ───────────────────────────────────
const questionField = (label) =>
  Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      'number.base':    `${label} must be a number`,
      'number.integer': `${label} must be a whole number`,
      'number.min':     `${label} must be between 1 and 5`,
      'number.max':     `${label} must be between 1 and 5`,
      'any.required':   `${label} is required`,
    });

/** POST /api/checkin */
export const createCheckInSchema = Joi.object({
  sleep:      questionField('Sleep quality'),
  energy:     questionField('Energy level'),
  stress:     questionField('Stress level'),
  positivity: questionField('Positivity'),
  focus:      questionField('Focus'),

  note: Joi.string()
    .trim()
    .max(500)
    .allow('', null)
    .default(null)
    .messages({ 'string.max': 'Note must be at most 500 characters' }),

  // Optional override date (for back-dating — within last 7 days only)
  date: Joi.date()
    .max('now')
    .messages({ 'date.max': 'Cannot check-in for a future date' }),
});

/** PATCH /api/checkin/:id — allow updating same-day check-in */
export const updateCheckInSchema = Joi.object({
  sleep:      Joi.number().integer().min(1).max(5),
  energy:     Joi.number().integer().min(1).max(5),
  stress:     Joi.number().integer().min(1).max(5),
  positivity: Joi.number().integer().min(1).max(5),
  focus:      Joi.number().integer().min(1).max(5),
  note:       Joi.string().trim().max(500).allow('', null),
}).min(1);

export { validate };
