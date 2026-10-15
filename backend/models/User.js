/**
 * models/User.js
 * Mongoose User schema — Part 4 update: role field added.
 *
 * Security rules enforced here:
 *   - Password is hashed with bcrypt (cost factor 12) before every save
 *   - Password field is excluded from all queries by default (select: false)
 *   - comparePassword() is a safe instance method — never leaks the hash
 *   - toJSON transform strips __v and the password field from any serialisation
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

// ── Schema ────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name must be at most 60 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // NEVER returned in queries unless explicitly asked
    },

    avatar: {
      type: String,
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    role: {
      type: String,
      enum: {
        values: ['user', 'counsellor', 'admin'],
        message: 'Role must be one of: user, counsellor, admin',
      },
      default: 'user',
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    points: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// email already has a unique index from `unique: true`
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1 }); // fast role-based queries (admin panels, filters)

// ── Pre-save: hash password ───────────────────────────────────────────────────
userSchema.pre('save', async function hashPassword(next) {
  // Only rehash if the password field was actually modified
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ── Instance method: safe password comparison ─────────────────────────────────
/**
 * Compare a candidate plaintext password against the stored hash.
 * Must be called on a document fetched with .select('+password').
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── toJSON transform: strip sensitive fields ──────────────────────────────────
userSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password; // belt-and-suspenders — even if select: false was bypassed
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
