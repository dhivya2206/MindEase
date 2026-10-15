/**
 * controllers/moodController.js
 * Thin HTTP handlers for mood endpoints.
 * Part 10 update: analyzeText added.
 * Part 11 update: POST /api/mood now also accepts source=FACIAL entries
 *   (sent by the browser-side FacialEmotionAnalyzer — no image data is ever transmitted).
 */

import * as moodService from '../services/moodService.js';
import * as emotionService from '../services/emotionService.js';
import { sendSuccess } from '../utils/responseFormatter.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  validate,
  createMoodSchema,
  updateMoodSchema,
  queryMoodSchema,
} from '../validators/moodValidators.js';

// ── POST /api/mood ────────────────────────────────────────────
export const createMood = async (req, res, next) => {
  const { value, errors } = validate(createMoodSchema, req.body);
  if (errors) return next(new AppError('Validation failed', 422, errors));

  const entry = await moodService.createMood(req.user._id.toString(), value);
  return sendSuccess(res, { statusCode: 201, message: 'Mood logged', data: { entry } });
};

// ── GET /api/mood ─────────────────────────────────────────────
export const getMoods = async (req, res, next) => {
  const { value, errors } = validate(queryMoodSchema, req.query);
  if (errors) return next(new AppError('Invalid query parameters', 422, errors));

  const result = await moodService.getMoods(req.user._id.toString(), value);
  return sendSuccess(res, {
    message: 'Mood history retrieved',
    data: { entries: result.entries },
    meta: { total: result.total, page: result.page, pages: result.pages },
  });
};

// ── GET /api/mood/stats ───────────────────────────────────────
export const getMoodStats = async (req, res) => {
  const stats = await moodService.getMoodStats(req.user._id.toString());
  return sendSuccess(res, { message: 'Mood stats retrieved', data: stats });
};

// ── GET /api/mood/:id ─────────────────────────────────────────
export const getMoodById = async (req, res) => {
  const entry = await moodService.getMoodById(req.params.id, req.user._id.toString());
  return sendSuccess(res, { message: 'Mood entry retrieved', data: { entry } });
};

// ── PATCH /api/mood/:id ───────────────────────────────────────
export const updateMood = async (req, res, next) => {
  const { value, errors } = validate(updateMoodSchema, req.body);
  if (errors) return next(new AppError('Validation failed', 422, errors));

  const entry = await moodService.updateMood(req.params.id, req.user._id.toString(), value);
  return sendSuccess(res, { message: 'Mood entry updated', data: { entry } });
};

// ── DELETE /api/mood/:id ──────────────────────────────────────
export const deleteMood = async (req, res) => {
  const result = await moodService.deleteMood(req.params.id, req.user._id.toString());
  return sendSuccess(res, { message: 'Mood entry deleted', data: result });
};

// ── POST /api/mood/analyze-text ───────────────────────────────
// Analyse free text → emotion estimation (NOT diagnosis).
// If req.body.saveMood === true, also persists a Mood doc with source=TEXT_AI.
export const analyzeText = async (req, res, next) => {
  const { text, saveMood = false } = req.body;

  if (!text || typeof text !== 'string') {
    return next(new AppError('text is required and must be a string', 400));
  }

  // Run emotion analysis via the reusable emotionService
  const analysis = await emotionService.analyzeEmotion(text);

  let savedEntry = null;

  // Optionally persist as a mood entry with source = TEXT_AI
  if (saveMood) {
    savedEntry = await moodService.createMood(req.user._id.toString(), {
      mood:               analysis.emotion,
      intensity:          analysis.intensity,
      note:               analysis.reasoning,
      source:             'TEXT_AI',
      rawText:            analysis.rawText,
      analysisConfidence: analysis.confidence,
    });
  }

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Emotion analysis complete',
    data: {
      analysis: {
        emotion:    analysis.emotion,
        confidence: analysis.confidence,
        intensity:  analysis.intensity,
        reasoning:  analysis.reasoning,
        wellness:   analysis.wellness,
      },
      savedEntry,
    },
  });
};
