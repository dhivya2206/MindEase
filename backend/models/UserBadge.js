/**
 * models/UserBadge.js
 * User badge achievements schema.
 *
 * Guarantees that rewards and badges are awarded at most once per user.
 */

import mongoose from 'mongoose';

export const BADGE_DEFINITIONS = {
  'first-step': {
    badgeId: 'first-step',
    title: 'First Step',
    description: 'Complete your first task in any wellness challenge',
    icon: '🌱',
    points: 25,
  },
  'mindful-beginner': {
    badgeId: 'mindful-beginner',
    title: 'Mindful Beginner',
    description: 'Complete three mindfulness or breathing challenge tasks',
    icon: '🫁',
    points: 50,
  },
  'gratitude-star': {
    badgeId: 'gratitude-star',
    title: 'Gratitude Star',
    description: 'Complete five gratitude reflections or journal tasks',
    icon: '⭐',
    points: 75,
  },
  'consistency-champion': {
    badgeId: 'consistency-champion',
    title: 'Consistency Champion',
    description: 'Maintain a verified multi-day streak across challenges',
    icon: '🔥',
    points: 100,
  },
  'challenge-finisher': {
    badgeId: 'challenge-finisher',
    title: 'Challenge Finisher',
    description: 'Complete a full multi-day wellness challenge from start to finish',
    icon: '🏆',
    points: 150,
  },
};

const userBadgeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    badgeId: {
      type: String,
      required: true,
      enum: Object.keys(BADGE_DEFINITIONS),
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    icon: {
      type: String,
      default: '🎖️',
    },

    pointsAwarded: {
      type: Number,
      default: 0,
    },

    earnedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index prevents duplicate badge awards
userBadgeSchema.index({ user: 1, badgeId: 1 }, { unique: true });

userBadgeSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const UserBadge = mongoose.model('UserBadge', userBadgeSchema);
