/**
 * models/GameScore.js
 * Stores per-game score history for authenticated users — Part 13.
 *
 * Each document represents one completed game session.
 *
 * Fields:
 *   user       — ref to User
 *   game       — game identifier enum
 *   score      — numeric score for that session
 *   meta       — optional JSON (level, moves, time, accuracy, etc.)
 *   playedAt   — timestamp of the session
 */

import mongoose from 'mongoose';

export const GAMES = Object.freeze([
  'bubble_pop',
  'memory_match',
  'breathing_game',
  'reaction_game',
]);

const gameScoreSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },

    game: {
      type: String,
      enum: {
        values: GAMES,
        message: `Game must be one of: ${GAMES.join(', ')}`,
      },
      required: [true, 'Game identifier is required'],
    },

    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: [0, 'Score cannot be negative'],
    },

    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,                  // createdAt = playedAt
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// Compound index for fast per-user per-game queries
gameScoreSchema.index({ user: 1, game: 1 });
gameScoreSchema.index({ user: 1, game: 1, score: -1 });

export const GameScore = mongoose.model('GameScore', gameScoreSchema);
