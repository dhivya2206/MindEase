/**
 * routes/chatRoutes.js
 * Chat / AI conversation endpoints — Part 9.
 * All routes require authentication (protect middleware).
 *
 * POST   /api/chat/conversations              → create new conversation
 * GET    /api/chat/conversations              → list user's conversations
 * GET    /api/chat/conversations/:id          → get single conversation + messages
 * DELETE /api/chat/conversations/:id          → delete conversation
 * POST   /api/chat/conversations/:id/messages → send a message (AI reply returned)
 */

import { Router } from 'express';
import { protect } from '../middleware/protect.js';
import {
  createConversation,
  listConversations,
  getConversation,
  deleteConversation,
  sendMessage,
} from '../controllers/chatController.js';

const router = Router();

// All chat routes require a valid JWT
router.use(protect);

// Conversation CRUD
router.post('/',         createConversation);
router.get('/',          listConversations);
router.get('/:id',       getConversation);
router.delete('/:id',    deleteConversation);

// Send a message within a conversation
router.post('/:id/messages', sendMessage);

export default router;
