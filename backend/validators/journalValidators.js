/**
 * validators/journalValidators.js
 * Joi input validation schemas for Journal endpoints.
 */

import Joi from 'joi';
import { MOODS } from '../models/Mood.js';
import { validate } from './authValidators.js';

export const createJournalSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(150)
    .required()
    .messages({
      'string.empty': 'Journal title cannot be empty',
      'string.max': 'Journal title cannot exceed 150 characters',
      'any.required': 'Journal title is required',
    }),

  content: Joi.string()
    .trim()
    .min(1)
    .max(10000)
    .required()
    .messages({
      'string.empty': 'Journal content cannot be empty',
      'string.max': 'Journal content cannot exceed 10,000 characters',
      'any.required': 'Journal content is required',
    }),

  mood: Joi.string()
    .valid(...MOODS)
    .default('calm')
    .messages({
      'any.only': `Mood must be one of: ${MOODS.join(', ')}`,
    }),

  intensity: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .default(5)
    .messages({
      'number.min': 'Emotion intensity must be between 1 and 10',
      'number.max': 'Emotion intensity must be between 1 and 10',
    }),

  tags: Joi.array()
    .items(Joi.string().trim().max(30))
    .default([]),

  gratitude: Joi.string()
    .trim()
    .max(1000)
    .allow('', null)
    .default('')
    .messages({
      'string.max': 'Gratitude section cannot exceed 1000 characters',
    }),

  highlightOfTheDay: Joi.string()
    .trim()
    .max(1000)
    .allow('', null)
    .default('')
    .messages({
      'string.max': 'Highlight cannot exceed 1000 characters',
    }),

  entryDate: Joi.date()
    .default(() => new Date())
    .messages({
      'date.base': 'entryDate must be a valid date',
    }),
});

export const updateJournalSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(150),

  content: Joi.string()
    .trim()
    .min(1)
    .max(10000),

  mood: Joi.string()
    .valid(...MOODS),

  intensity: Joi.number()
    .integer()
    .min(1)
    .max(10),

  tags: Joi.array()
    .items(Joi.string().trim().max(30)),

  gratitude: Joi.string()
    .trim()
    .max(1000)
    .allow('', null),

  highlightOfTheDay: Joi.string()
    .trim()
    .max(1000)
    .allow('', null),

  entryDate: Joi.date(),
}).min(1);

export { validate };
