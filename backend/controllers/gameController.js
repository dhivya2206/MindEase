/**
 * controllers/gameController.js
 * HTTP handlers for game score endpoints — Part 13.
 */

import * as gameService from '../services/gameService.js';
import { sendSuccess } from '../utils/responseFormatter.js';

/**
 * POST /api/games/scores
 * Body: { game, score, meta? }
 */
export const postScore = async (req, res, next) => {
  try {
    const entry = await gameService.saveScore(req.user.id, req.body);
    sendSuccess(res, {
      statusCode: 201,
      message:    'Score saved',
      data:       { entry },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/games/scores
 * Query: ?limit=50
 */
export const getScores = async (req, res, next) => {
  try {
    const limit   = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const scores  = await gameService.getRecentScores(req.user.id, limit);
    sendSuccess(res, { message: 'Scores retrieved', data: { scores } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/games/stats
 */
export const getStats = async (req, res, next) => {
  try {
    const stats = await gameService.getGameStats(req.user.id);
    sendSuccess(res, { message: 'Stats retrieved', data: { stats } });
  } catch (err) {
    next(err);
  }
};
