/**
 * controllers/recommendationController.js
 * HTTP handler for the recommendation engine endpoint — Part 8.
 *
 * GET /api/recommendations
 *   Returns personalized, rule-based recommendations for the authenticated user.
 *   No AI — all recommendations are derived from deterministic rules applied
 *   to the user's own check-in and mood data.
 */

import * as recommendationService from '../services/recommendationService.js';
import { sendSuccess } from '../utils/responseFormatter.js';

/**
 * GET /api/recommendations
 *
 * Response shape:
 * {
 *   success: true,
 *   message: "Recommendations generated",
 *   data: {
 *     recommendations: [ { id, title, reason, triggerRule, ... } ],
 *     context: {
 *       hasCheckInToday, checkInScore, lastMood,
 *       rulesEvaluated, rulesMatched, engineType
 *     }
 *   }
 * }
 */
export const getRecommendations = async (req, res) => {
  const { recommendations, context } = await recommendationService.getRecommendations(
    req.user._id.toString()
  );

  return sendSuccess(res, {
    message: 'Recommendations generated',
    data: { recommendations, context },
  });
};
