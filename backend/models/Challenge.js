/**
 * models/Challenge.js
 * Challenge catalog definition schema — Wellness Challenges & Habit-Building System.
 */

import mongoose from 'mongoose';

export const CHALLENGE_CATEGORIES = [
  'Mindfulness',
  'Stress Management',
  'Gratitude',
  'Healthy Habits',
  'Focus and Productivity',
  'Relaxation',
  'Self-Reflection',
];

export const CHALLENGE_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export const TARGET_TYPES = [
  'BREATHING',
  'MOOD',
  'CHECKIN',
  'JOURNAL',
  'FOCUS',
  'GAME',
  'ACTIVITY',
];

const challengeTaskSchema = new mongoose.Schema(
  {
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    targetType: {
      type: String,
      enum: TARGET_TYPES,
      default: 'ACTIVITY',
    },
    requiredCount: {
      type: Number,
      default: 1,
    },
    points: {
      type: Number,
      default: 20,
    },
  },
  { _id: false }
);

const challengeSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    title: {
      type: String,
      required: [true, 'Challenge title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },

    description: {
      type: String,
      required: [true, 'Challenge description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    category: {
      type: String,
      enum: {
        values: CHALLENGE_CATEGORIES,
        message: `Category must be one of: ${CHALLENGE_CATEGORIES.join(', ')}`,
      },
      required: true,
    },

    instructions: {
      type: [String],
      default: [],
    },

    durationDays: {
      type: Number,
      required: true,
      min: 1,
      max: 30,
      default: 1,
    },

    difficulty: {
      type: String,
      enum: CHALLENGE_DIFFICULTIES,
      default: 'Easy',
    },

    pointsReward: {
      type: Number,
      required: true,
      min: 10,
      default: 50,
    },

    isDaily: {
      type: Boolean,
      default: false,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    icon: {
      type: String,
      default: '🏆',
    },

    color: {
      type: String,
      default: '#6c63ff',
    },

    actionRoute: {
      type: String,
      default: '/dashboard/user',
    },

    actionLabel: {
      type: String,
      default: 'Start Activity',
    },

    tasks: {
      type: [challengeTaskSchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

challengeSchema.index({ category: 1, isActive: 1 });
challengeSchema.index({ isDaily: 1, isFeatured: 1 });

challengeSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Challenge = mongoose.model('Challenge', challengeSchema);
