/**
 * models/Appointment.js
 * Appointment model — Part 15.
 *
 * Represents a counselling appointment between a user and a counsellor.
 * Booking (user-side creation) is out of scope for Part 15.
 * This model supports the counsellor's view: accept / reject / cancel / complete.
 */

import mongoose from 'mongoose';

const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'accepted', 'rejected', 'cancelled', 'completed'];

const appointmentSchema = new mongoose.Schema(
  {
    counsellor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',   // references the User document (who has role: counsellor)
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',   // references the User document (who booked)
      required: true,
    },

    // Requested date/time slot
    scheduledAt: {
      type: Date,
      required: [true, 'Appointment date/time is required'],
    },

    // Duration in minutes
    duration: {
      type: Number,
      default: 60,
      min: [15, 'Duration must be at least 15 minutes'],
      max: [180, 'Duration cannot exceed 180 minutes'],
    },

    status: {
      type: String,
      enum: {
        values: APPOINTMENT_STATUSES,
        message: `Status must be one of: ${APPOINTMENT_STATUSES.join(', ')}`,
      },
      default: 'pending',
    },

    // Reason/notes from the user when booking
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes must be at most 500 characters'],
      default: '',
    },

    // Reason for rejection or cancellation
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason must be at most 500 characters'],
      default: '',
    },

    // Who cancelled — for audit trail
    cancelledBy: {
      type: String,
      enum: ['user', 'counsellor', null],
      default: null,
    },

    // Timestamp of status changes (for audit)
    acceptedAt:   { type: Date, default: null },
    rejectedAt:   { type: Date, default: null },
    cancelledAt:  { type: Date, default: null },
    completedAt:  { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Indexes for counsellor and user queries
appointmentSchema.index({ counsellor: 1, status: 1 });
appointmentSchema.index({ user: 1, status: 1 });
appointmentSchema.index({ scheduledAt: 1 });

appointmentSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Appointment = mongoose.model('Appointment', appointmentSchema);
export { APPOINTMENT_STATUSES };
