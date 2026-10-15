/**
 * models/UserChallenge.js
 * User enrollment and daily progress tracking schema.
 */

import mongoose from 'mongoose';

const userTaskProgressSchema = new mongoose.Schema(
  {
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    date: {
      type: String, // 'YYYY-MM-DD'
      required: true,
    },
    targetType: {
      type: String,
      default: 'ACTIVITY',
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    pointsAwarded: {
      type: Number,
      default: 0,
    },
    verifiedVia: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const userChallengeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned', 'expired'],
      default: 'active',
      index: true,
    },

    startDate: {
      type: Date,
      default: () => new Date(),
    },

    endDate: {
      type: Date,
      required: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    completedDays: {
      type: [Number],
      default: [],
    },

    dailyProgress: {
      type: [userTaskProgressSchema],
      default: [],
    },

    pointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast per-user lookups and preventing duplicate active enrollments
userChallengeSchema.index({ user: 1, challenge: 1, status: 1 });
userChallengeSchema.index({ user: 1, status: 1, createdAt: -1 });

userChallengeSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const UserChallenge = mongoose.model('UserChallenge', userChallengeSchema);
