/**
 * controllers/chatController.js
 * Thin HTTP handlers for chat endpoints — Part 9.
 * All business logic lives in chatService.js.
 *
 * Routes served:
 *   POST   /api/chat/conversations              → createConversation
 *   GET    /api/chat/conversations              → listConversations
 *   GET    /api/chat/conversations/:id          → getConversation
 *   DELETE /api/chat/conversations/:id          → deleteConversation
 *   POST   /api/chat/conversations/:id/messages → sendMessage
 */

import * as chatService from '../services/chatService.js';
import { sendSuccess } from '../utils/responseFormatter.js';
import { AppError } from '../middleware/errorHandler.js';

// ── POST /api/chat/conversations ──────────────────────────────
export const createConversation = async (req, res) => {
  const convo = await chatService.createConversation(req.user._id.toString());
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Conversation created',
    data: { conversation: convo },
  });
};

// ── GET /api/chat/conversations ───────────────────────────────
export const listConversations = async (req, res) => {
  const conversations = await chatService.listConversations(req.user._id.toString());
  return sendSuccess(res, {
    message: 'Conversations retrieved',
    data: { conversations },
  });
};

// ── GET /api/chat/conversations/:id ──────────────────────────
export const getConversation = async (req, res) => {
  const convo = await chatService.getConversation(
    req.user._id.toString(),
    req.params.id
  );
  return sendSuccess(res, {
    message: 'Conversation retrieved',
    data: { conversation: convo },
  });
};

// ── DELETE /api/chat/conversations/:id ───────────────────────
export const deleteConversation = async (req, res) => {
  await chatService.deleteConversation(
    req.user._id.toString(),
    req.params.id
  );
  return sendSuccess(res, { message: 'Conversation deleted' });
};

// ── POST /api/chat/conversations/:id/messages ─────────────────
export const sendMessage = async (req, res, next) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return next(new AppError('message is required and must be a string', 400));
  }

  const result = await chatService.sendMessage(
    req.user._id.toString(),
    req.params.id,
    message
  );

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Message sent',
    data: result,
  });
};
