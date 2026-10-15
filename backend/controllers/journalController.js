/**
 * controllers/journalController.js
 * HTTP controllers for Personal Wellness Journal.
 *
 * Employs sendSuccess and AppError for uniform responses.
 */

import * as journalService from '../services/journalService.js';
import { sendSuccess } from '../utils/responseFormatter.js';
import { AppError } from '../middleware/errorHandler.js';
import { validate, createJournalSchema, updateJournalSchema } from '../validators/journalValidators.js';

/**
 * POST /api/journal
 * Create a new journal entry.
 */
export const createEntry = async (req, res, next) => {
  const { value, errors } = validate(createJournalSchema, req.body);
  if (errors) {
    return next(new AppError('Validation failed', 422, errors));
  }

  const entry = await journalService.createEntry(req.user._id, value);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Journal entry saved successfully',
    data: { entry },
  });
};

/**
 * GET /api/journal
 * List journal entries with pagination and filters.
 */
export const getEntries = async (req, res) => {
  const { page, limit, search, mood, tag, startDate, endDate, sort } = req.query;

  const result = await journalService.getEntries(req.user._id, {
    page,
    limit,
    search,
    mood,
    tag,
    startDate,
    endDate,
    sort,
  });

  return sendSuccess(res, {
    message: 'Journal entries retrieved',
    data: result,
  });
};

/**
 * GET /api/journal/stats
 * Dashboard stats: streak, counts, calendar dates, recent entries.
 */
export const getStats = async (req, res) => {
  const stats = await journalService.getJournalStats(req.user._id);

  return sendSuccess(res, {
    message: 'Journal statistics retrieved',
    data: stats,
  });
};

/**
 * GET /api/journal/:id
 * Retrieve a specific journal entry.
 */
export const getEntryById = async (req, res) => {
  const { id } = req.params;
  const entry = await journalService.getEntryById(req.user._id, id);

  return sendSuccess(res, {
    message: 'Journal entry retrieved',
    data: { entry },
  });
};

/**
 * PUT /api/journal/:id
 * Update an existing journal entry.
 */
export const updateEntry = async (req, res, next) => {
  const { id } = req.params;
  const { value, errors } = validate(updateJournalSchema, req.body);
  if (errors) {
    return next(new AppError('Validation failed', 422, errors));
  }

  const updated = await journalService.updateEntry(req.user._id, id, value);

  return sendSuccess(res, {
    message: 'Journal entry updated successfully',
    data: { entry: updated },
  });
};

/**
 * DELETE /api/journal/:id
 * Remove a journal entry.
 */
export const deleteEntry = async (req, res) => {
  const { id } = req.params;
  const result = await journalService.deleteEntry(req.user._id, id);

  return sendSuccess(res, {
    message: 'Journal entry deleted successfully',
    data: result,
  });
};
