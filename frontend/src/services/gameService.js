/**
 * services/gameService.js (frontend)
 * API calls for game score persistence — Part 13.
 */

import api from './api.js';

const BASE = '/api/games';

/**
 * Save a completed game session.
 * @param {{ game: string, score: number, meta?: object }} payload
 */
export const saveScore = async ({ game, score, meta = {} }) => {
  const { data } = await api.post(`${BASE}/scores`, { game, score, meta });
  return data.data.entry;
};

/**
 * Get the current user's recent score history.
 * @param {number} limit
 */
export const getRecentScores = async (limit = 50) => {
  const { data } = await api.get(`${BASE}/scores`, { params: { limit } });
  return data.data.scores;
};

/**
 * Get per-game aggregated stats.
 * Returns: [{ game, gamesPlayed, bestScore, lastPlayedAt, avgScore }]
 */
export const getGameStats = async () => {
  const { data } = await api.get(`${BASE}/stats`);
  return data.data.stats;
};
