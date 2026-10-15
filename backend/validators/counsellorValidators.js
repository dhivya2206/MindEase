/**
 * validators/counsellorValidators.js
 * Joi validation schemas for counsellor profile endpoints — Part 15.
 */

import Joi from 'joi';
import { validate } from './authValidators.js';

// ── Availability slot ─────────────────────────────────────────────────────────
const availabilitySlotSchema = Joi.object({
  day: Joi.string()
    .valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
    .required()
    .messages({ 'any.only': 'Day must be a valid weekday', 'any.required': 'Day is required' }),

  startTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({
      'string.pattern.base': 'Start time must be in HH:MM format (e.g. 09:00)',
      'any.required': 'Start time is required',
    }),

  endTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({
      'string.pattern.base': 'End time must be in HH:MM format (e.g. 17:00)',
      'any.required': 'End time is required',
    }),
});

// ── Profile upsert (create or full update) ────────────────────────────────────
export const profileUpsertSchema = Joi.object({
  name: Joi.string().trim().min(2).max(60).optional().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name must be at most 60 characters',
  }),

  specialization: Joi.string().trim().min(2).max(100).required().messages({
    'string.min': 'Specialization must be at least 2 characters',
    'string.max': 'Specialization must be at most 100 characters',
    'any.required': 'Specialization is required',
  }),

  experience: Joi.number().integer().min(0).max(60).required().messages({
    'number.base': 'Experience must be a number',
    'number.min': 'Experience cannot be negative',
    'any.required': 'Years of experience is required',
  }),

  description: Joi.string().trim().min(10).max(1000).required().messages({
    'string.min': 'Description must be at least 10 characters',
    'string.max': 'Description must be at most 1000 characters',
    'any.required': 'Description is required',
  }),

  location: Joi.string().trim().max(200).allow('').optional().messages({
    'string.max': 'Location must be at most 200 characters',
  }),

  availability: Joi.array().items(availabilitySlotSchema).max(14).optional(),

  profileImage: Joi.string().max(500000).allow('', null).optional(), // base64 or URL
});

// ── Partial profile update (PATCH) ────────────────────────────────────────────
export const profilePatchSchema = profileUpsertSchema.fork(
  ['specialization', 'experience', 'description'],
  (field) => field.optional()
);

export { validate };
