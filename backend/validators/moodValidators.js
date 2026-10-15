/**
 * validators/moodValidators.js
 * Joi schemas for mood endpoints — Part 11 update: source + analysisConfidence added.
 */

import Joi from 'joi';
import { MOODS } from '../models/Mood.js';
import { validate } from './authValidators.js'; // reuse the validate helper

// ── Schemas ───────────────────────────────────────────────────

/** POST /api/mood */
export const createMoodSchema = Joi.object({
  mood: Joi.string()
    .valid(...MOODS)
    .required()
    .messages({
      'any.only': `mood must be one of: ${MOODS.join(', ')}`,
      'any.required': 'mood is required',
    }),

  intensity: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .default(3)
    .messages({
      'number.min': 'intensity must be between 1 and 5',
      'number.max': 'intensity must be between 1 and 5',
    }),

  note: Joi.string()
    .trim()
    .max(500)
    .allow('', null)
    .default(null)
    .messages({ 'string.max': 'note must be at most 500 characters' }),

  loggedAt: Joi.date()
    .max('now')
    .default(() => new Date())
    .messages({ 'date.max': 'loggedAt cannot be in the future' }),

  // Optional fields set by AI-based sources (TEXT_AI, FACIAL)
  source: Joi.string()
    .valid('MANUAL', 'TEXT_AI', 'FACIAL')
    .default('MANUAL'),

  analysisConfidence: Joi.number()
    .min(0)
    .max(1)
    .allow(null)
    .default(null),
});

/** PATCH /api/mood/:id  — all fields optional */
export const updateMoodSchema = Joi.object({
  mood: Joi.string()
    .valid(...MOODS)
    .messages({ 'any.only': `mood must be one of: ${MOODS.join(', ')}` }),

  intensity: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .messages({
      'number.min': 'intensity must be between 1 and 5',
      'number.max': 'intensity must be between 1 and 5',
    }),

  note: Joi.string()
    .trim()
    .max(500)
    .allow('', null)
    .messages({ 'string.max': 'note must be at most 500 characters' }),

  loggedAt: Joi.date()
    .max('now')
    .messages({ 'date.max': 'loggedAt cannot be in the future' }),
}).min(1); // at least one field required for an update

/** Query params for GET /api/mood */
export const queryMoodSchema = Joi.object({
  limit:  Joi.number().integer().min(1).max(100).default(20),
  page:   Joi.number().integer().min(1).default(1),
  mood:   Joi.string().valid(...MOODS),
  from:   Joi.date(),
  to:     Joi.date().when('from', { is: Joi.exist(), then: Joi.date().min(Joi.ref('from')) }),
  sort:   Joi.string().valid('asc', 'desc').default('desc'),
});

export { validate };
