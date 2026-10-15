/**
 * models/Conversation.js
 * Chat conversation schema — Part 9.
 *
 * Each Conversation document belongs to one user and stores the full
 * message history as an embedded array. This avoids a separate Message
 * collection for the simple back-and-forth chat use-case.
 *
 * Message roles match the Gemini API convention: 'user' | 'model'.
 * We expose 'assistant' as an alias in the frontend for readability.
 */

import mongoose from 'mongoose';

// ── Embedded message sub-schema ────────────────────────────────
const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'model'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: [8000, 'Message must be at most 8000 characters'],
    },
  },
  {
    timestamps: true, // gives each message a createdAt
    _id: true,        // each message gets its own _id for referencing
  }
);

// toJSON: rename role 'model' → 'assistant' for frontend clarity
messageSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id      = ret._id;
    delete ret._id;
    delete ret.__v;
    // Normalize 'model' → 'assistant' so the frontend uses intuitive naming
    if (ret.role === 'model') ret.role = 'assistant';
    return ret;
  },
});

// ── Conversation schema ────────────────────────────────────────
const conversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Auto-generated from the first user message (max 50 chars)
    title: {
      type: String,
      trim: true,
      maxlength: [80, 'Title must be at most 80 characters'],
      default: 'New Conversation',
    },

    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  {
    timestamps: true, // conversation-level createdAt + updatedAt
  }
);

// ── Indexes ───────────────────────────────────────────────────
// Fast listing of a user's conversations sorted by most recent activity
conversationSchema.index({ user: 1, updatedAt: -1 });

// ── Virtual: message count ─────────────────────────────────────
conversationSchema.virtual('messageCount').get(function () {
  return this.messages.length;
});

// ── toJSON ────────────────────────────────────────────────────
conversationSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Conversation = mongoose.model('Conversation', conversationSchema);
