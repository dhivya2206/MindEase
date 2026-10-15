/**
 * models/Notification.js
 * In-App Notification schema — Part 18.
 *
 * Supports notification categories:
 *   - CHECKIN_REMINDER         Daily check-in reminder
 *   - APPOINTMENT_CONFIRMATION Appointment confirmation
 *   - APPOINTMENT_REMINDER     Appointment reminder
 *   - RECOMMENDATION           Activity recommendation
 *   - STREAK                   Wellness streak notification
 *   - SYSTEM                   General wellness updates / system messages
 */

import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = Object.freeze([
  'CHECKIN_REMINDER',
  'APPOINTMENT_CONFIRMATION',
  'APPOINTMENT_REMINDER',
  'RECOMMENDATION',
  'STREAK',
  'SYSTEM',
  'CHALLENGE',
  'BADGE',
]);

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },

    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },

    type: {
      type: String,
      enum: {
        values: NOTIFICATION_TYPES,
        message: `Type must be one of: ${NOTIFICATION_TYPES.join(', ')}`,
      },
      default: 'SYSTEM',
      index: true,
    },

    icon: {
      type: String,
      default: '🔔',
      maxlength: 10,
    },

    // In-app destination route if clicked (e.g. /dashboard/user/checkin)
    link: {
      type: String,
      default: null,
      trim: true,
      maxlength: 200,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying a user's notifications sorted by recency and filtered by read state
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });

// Clean JSON serialization
notificationSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Notification = mongoose.model('Notification', notificationSchema);
