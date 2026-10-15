/**
 * models/Mood.js
 * Mood entry schema — Part 11 update: FACIAL source added.
 *
 * Each document represents a single user mood log.
 * Fields:
 *   user      — ref to User (required, indexed for fast per-user queries)
 *   mood      — enum of 9 moods
 *   intensity — 1 (very mild) → 5 (very strong)
 *   note      — optional free-text reflection (max 500 chars)
 *   loggedAt  — when the user says the mood occurred (defaults to now,
 *               but users can back-date — useful for journalling)
 */

import mongoose from 'mongoose';

export const MOODS = Object.freeze([
  'happy', 'sad', 'calm', 'stressed',
  'anxious', 'angry', 'tired', 'excited', 'neutral',
]);

const moodSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },

    mood: {
      type: String,
      enum: {
        values: MOODS,
        message: `Mood must be one of: ${MOODS.join(', ')}`,
      },
      required: [true, 'Mood is required'],
    },

    intensity: {
      type: Number,
      min: [1, 'Intensity must be at least 1'],
      max: [5, 'Intensity must be at most 5'],
      default: 3,
    },

    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note must be at most 500 characters'],
      default: null,
    },

    // loggedAt: when the mood occurred (user-supplied, defaults to creation time)
    loggedAt: {
      type: Date,
      default: () => new Date(),
    },

    // source: how the mood was recorded
    //   MANUAL   — user selected from the mood picker
    //   TEXT_AI  — detected from free-text by AI (Part 10)
    //   FACIAL   — estimated from camera via face-api.js (Part 11)
    source: {
      type: String,
      enum: ['MANUAL', 'TEXT_AI', 'FACIAL'],
      default: 'MANUAL',
    },

    // rawText: the original user text (only set when source = TEXT_AI)
    rawText: {
      type: String,
      trim: true,
      maxlength: [1000, 'Raw text must be at most 1000 characters'],
      default: null,
    },

    // analysisConfidence: AI confidence 0.0 – 1.0 (only set when source = TEXT_AI)
    analysisConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt (system audit)
  }
);

// ── Compound index: fast per-user chronological queries ───────
moodSchema.index({ user: 1, loggedAt: -1 });
// Aggregate queries (e.g. "how often was I happy this week")
moodSchema.index({ user: 1, mood: 1, loggedAt: -1 });

// ── toJSON: clean output ──────────────────────────────────────
moodSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Mood = mongoose.model('Mood', moodSchema);
