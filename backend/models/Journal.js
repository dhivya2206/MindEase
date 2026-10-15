/**
 * models/Journal.js
 * Journal entry schema — Personal Wellness Journal.
 *
 * Stores user wellness reflections, mood & intensity, tags,
 * gratitude notes, and daily highlights.
 */

import mongoose from 'mongoose';
import { MOODS } from './Mood.js';

export const JOURNAL_TAGS = [
  'College',
  'Placement',
  'Family',
  'Personal Growth',
  'Gratitude',
  'Stress',
  'Other',
];

const journalEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Journal title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },

    content: {
      type: String,
      required: [true, 'Journal content is required'],
      trim: true,
      minlength: [1, 'Content cannot be empty'],
      maxlength: [10000, 'Content cannot exceed 10,000 characters'],
    },

    mood: {
      type: String,
      enum: {
        values: MOODS,
        message: `Mood must be one of: ${MOODS.join(', ')}`,
      },
      default: 'calm',
    },

    intensity: {
      type: Number,
      min: [1, 'Intensity must be at least 1'],
      max: [10, 'Intensity must be at most 10'],
      default: 5,
    },

    tags: {
      type: [String],
      default: [],
    },

    gratitude: {
      type: String,
      trim: true,
      maxlength: [1000, 'Gratitude note cannot exceed 1000 characters'],
      default: '',
    },

    highlightOfTheDay: {
      type: String,
      trim: true,
      maxlength: [1000, 'Highlight cannot exceed 1000 characters'],
      default: '',
    },

    entryDate: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: true, // provides createdAt & updatedAt
  }
);

// Indexes for fast per-user chronological and filter queries
journalEntrySchema.index({ user: 1, createdAt: -1 });
journalEntrySchema.index({ user: 1, entryDate: -1 });
journalEntrySchema.index({ user: 1, mood: 1 });
journalEntrySchema.index({ user: 1, tags: 1 });

journalEntrySchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);
export const Journal = JournalEntry; // convenience alias
