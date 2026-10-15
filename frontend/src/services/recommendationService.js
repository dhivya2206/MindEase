/**
 * services/recommendationService.js (frontend)
 * API wrapper for the rule-based recommendation engine — Part 8.
 */

import api from './api.js';

const BASE = '/api/recommendations';

/**
 * Fetch personalized, rule-based recommendations for the current user.
 *
 * Returns:
 *   recommendations — array of recommendation objects
 *   context         — { hasCheckInToday, checkInScore, lastMood, rulesEvaluated, rulesMatched, engineType }
 */
export const getRecommendations = async () => {
  const { data } = await api.get(BASE);
  return data.data; // { recommendations, context }
};
