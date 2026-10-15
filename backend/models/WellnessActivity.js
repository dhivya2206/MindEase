/**
 * models/WellnessActivity.js
 * Wellness Activity model — Part 19.
 *
 * Defines wellness exercises, challenges, and mindfulness routines
 * managed by platform administrators.
 */

import mongoose from 'mongoose';

export const ACTIVITY_CATEGORIES = [
  'Breathing',
  'Meditation',
  'Movement',
  'Sleep',
  'Journaling',
  'Focus',
  'Relaxation',
  'Other',
];

export const ACTIVITY_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

const wellnessActivitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Activity title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    description: {
      type: String,
      required: [true, 'Activity description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    category: {
      type: String,
      enum: {
        values: ACTIVITY_CATEGORIES,
        message: `Category must be one of: ${ACTIVITY_CATEGORIES.join(', ')}`,
      },
      default: 'Relaxation',
    },

    duration: {
      type: String,
      trim: true,
      default: '5 min',
      maxlength: [30, 'Duration cannot exceed 30 characters'],
    },

    difficulty: {
      type: String,
      enum: {
        values: ACTIVITY_DIFFICULTIES,
        message: `Difficulty must be one of: ${ACTIVITY_DIFFICULTIES.join(', ')}`,
      },
      default: 'beginner',
    },

    icon: {
      type: String,
      default: '🌿',
      trim: true,
      maxlength: [20, 'Icon string cannot exceed 20 characters'],
    },

    color: {
      type: String,
      default: '#6c63ff',
      trim: true,
      maxlength: [20, 'Color cannot exceed 20 characters'],
    },

    tags: {
      type: [String],
      default: [],
    },

    instructions: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

wellnessActivitySchema.index({ category: 1, isActive: 1 });
wellnessActivitySchema.index({ createdAt: -1 });

wellnessActivitySchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const WellnessActivity = mongoose.model('WellnessActivity', wellnessActivitySchema);
