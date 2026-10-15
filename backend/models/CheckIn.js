/**
 * models/CheckIn.js
 * Daily wellness check-in schema — Part 7.
 *
 * Each document represents ONE check-in for ONE user for ONE calendar day.
 * A unique compound index on { user, date } enforces the "one per day" rule.
 *
 * Score formula (transparent):
 *   rawScore = sleep + energy + (6 − stress) + positivity + focus
 *   wellnessScore = Math.round((rawScore / 25) * 100)
 *
 *   Range: 20 (all 1s, stress=5) → 100 (all 5s, stress=1)
 *   Stress is inverted because higher stress = worse wellness.
 *
 * ⚠️  Not a medical assessment. For personal wellness tracking only.
 */

import mongoose from 'mongoose';

// ── Score calculator (shared with frontend via this module) ───
export const calculateWellnessScore = ({ sleep, energy, stress, positivity, focus }) => {
  const raw = sleep + energy + (6 - stress) + positivity + focus;
  return Math.round((raw / 25) * 100);
};

// ── Score breakdown (human-readable factors) ──────────────────
export const scoreBreakdown = ({ sleep, energy, stress, positivity, focus }) => ({
  sleep:      { value: sleep,       contribution: sleep,       label: 'Sleep Quality' },
  energy:     { value: energy,      contribution: energy,      label: 'Energy Level' },
  stress:     { value: stress,      contribution: 6 - stress,  label: 'Stress (inverted)' },
  positivity: { value: positivity,  contribution: positivity,  label: 'Positivity' },
  focus:      { value: focus,       contribution: focus,       label: 'Focus' },
});

// ── Helpers ───────────────────────────────────────────────────
/** Returns today's date as YYYY-MM-DD string (UTC) */
export const todayUTC = () => new Date().toISOString().slice(0, 10);

/** Normalise any Date/string to a YYYY-MM-DD key */
export const toDateKey = (d) => new Date(d).toISOString().slice(0, 10);

// ── Schema ────────────────────────────────────────────────────
const questionField = (label) =>
  ({
    type: Number,
    required: [true, `${label} is required`],
    min: [1, `${label} must be between 1 and 5`],
    max: [5, `${label} must be between 1 and 5`],
    validate: {
      validator: Number.isInteger,
      message: `${label} must be a whole number`,
    },
  });

const checkInSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },

    // Calendar date this check-in belongs to (YYYY-MM-DD, stored as ISO Date at midnight UTC)
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },

    // ── The 5 questions (1 = lowest, 5 = highest) ─────────────
    sleep:      questionField('Sleep quality'),
    energy:     questionField('Energy level'),
    stress:     questionField('Stress level'),       // 1=not stressed, 5=very stressed
    positivity: questionField('Positivity'),
    focus:      questionField('Focus'),

    // ── Calculated score (stored for query efficiency) ────────
    wellnessScore: {
      type: Number,
      min: 20,
      max: 100,
    },

    // ── Optional reflection note ──────────────────────────────
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note must be at most 500 characters'],
      default: null,
    },
  },
  { timestamps: true }
);

// ── Pre-save: auto-calculate score ────────────────────────────
checkInSchema.pre('save', function (next) {
  this.wellnessScore = calculateWellnessScore(this);
  next();
});

// ── Unique: one check-in per user per day ─────────────────────
checkInSchema.index({ user: 1, date: 1 }, { unique: true });

// ── For trend queries ─────────────────────────────────────────
checkInSchema.index({ user: 1, date: -1 });

// ── toJSON ────────────────────────────────────────────────────
checkInSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    // Add dateKey for convenient frontend use
    ret.dateKey = toDateKey(ret.date);
    return ret;
  },
});

export const CheckIn = mongoose.model('CheckIn', checkInSchema);
