/**
 * models/Counsellor.js
 * Counsellor profile model — Part 15.
 *
 * Each Counsellor document is linked 1-to-1 with a User document.
 * The User document holds authentication data (email/password/role).
 * This model holds professional/profile information.
 */

import mongoose from 'mongoose';

const availabilitySlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    startTime: { type: String, required: true }, // "09:00"
    endTime:   { type: String, required: true }, // "17:00"
  },
  { _id: false }
);

const counsellorSchema = new mongoose.Schema(
  {
    // Link to User account
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // Professional profile fields
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
      maxlength: [100, 'Specialization must be at most 100 characters'],
    },

    experience: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Experience cannot be negative'],
      max: [60, 'Experience value seems too large'],
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description must be at most 1000 characters'],
    },

    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location must be at most 200 characters'],
      default: '',
    },

    availability: {
      type: [availabilitySlotSchema],
      default: [],
    },

    // Profile image URL (stored as a URL string; base64 or cloud URL)
    profileImage: {
      type: String,
      default: null,
    },

    // Whether this counsellor profile is active/visible to users
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
counsellorSchema.index({ specialization: 1 });
counsellorSchema.index({ isActive: 1 });

// toJSON: expose id, hide __v
counsellorSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Counsellor = mongoose.model('Counsellor', counsellorSchema);
