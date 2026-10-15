/**
 * services/gameService.js
 * Business logic for game score persistence — Part 13.
 *
 * Endpoints served:
 *   POST  /api/games/scores        — save a completed session score
 *   GET   /api/games/scores        — get current user's score history (all games)
 *   GET   /api/games/stats         — per-game best score, play count, last played
 */

import mongoose from 'mongoose';
import { GameScore, GAMES } from '../models/GameScore.js';

/**
 * Save a new game score for the given user.
 * @param {string} userId
 * @param {{ game, score, meta? }} dto
 */
export const saveScore = async (userId, { game, score, meta = {} }) => {
  const entry = await GameScore.create({ user: userId, game, score, meta });
  return entry;
};

/**
 * Return the last N score entries for this user (all games combined).
 * @param {string} userId
 * @param {number} limit
 */
export const getRecentScores = async (userId, limit = 50) => {
  return GameScore.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('game score meta createdAt')
    .lean();
};

/**
 * Return per-game aggregated stats for the user:
 *   { game, gamesPlayed, bestScore, lastPlayedAt }
 * @param {string} userId
 */
export const getGameStats = async (userId) => {
  const userObjectId = typeof userId === 'string'
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const pipeline = [
    { $match: { user: userObjectId } },
    {
      $group: {
        _id:          '$game',
        gamesPlayed:  { $sum: 1 },
        bestScore:    { $max: '$score' },
        lastPlayedAt: { $max: '$createdAt' },
        totalScore:   { $sum: '$score' },
      },
    },
    {
      $project: {
        _id:         0,
        game:        '$_id',
        gamesPlayed: 1,
        bestScore:   1,
        lastPlayedAt:1,
        totalScore:  1,
        avgScore:    { $round: [{ $divide: ['$totalScore', '$gamesPlayed'] }, 0] },
      },
    },
    { $sort: { game: 1 } },
  ];

  const results = await GameScore.aggregate(pipeline);

  // Fill in zero stats for games the user hasn't played yet
  return GAMES.map((g) => {
    const found = results.find((r) => r.game === g);
    return found ?? { game: g, gamesPlayed: 0, bestScore: 0, lastPlayedAt: null, totalScore: 0, avgScore: 0 };
  });
};
