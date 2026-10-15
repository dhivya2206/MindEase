/**
 * controllers/journeyController.js
 * HTTP handlers for "My Wellness Journey" analytics endpoints — Part 17.
 */

import * as journeyService from '../services/journeyService.js';
import { sendSuccess } from '../utils/responseFormatter.js';

/**
 * GET /api/journey/stats
 * Query params: ?range=week | month
 */
export const getStats = async (req, res, next) => {
  try {
    const range = req.query.range === 'month' ? 'month' : 'week';
    const stats = await journeyService.getJourneyStats(req.user._id, range);
    return sendSuccess(res, {
      message: 'Journey statistics retrieved successfully',
      data: stats,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/journey/seed
 * Helper endpoint to seed authentic sample activity data into the current user's account
 */
export const seedData = async (req, res, next) => {
  try {
    const result = await journeyService.seedUserJourneyData(req.user._id);
    return sendSuccess(res, {
      statusCode: 201,
      message: result.message,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
