/**
 * services/chatService.js
 * Frontend API service for the AI wellness chatbot — Part 9.
 * All calls go through the backend; the Gemini API key is NEVER in this file.
 */

import api from './api.js';

const BASE = '/api/chat/conversations';

/**
 * Create a new, empty conversation.
 * @returns {Promise<{ id, title, messages }>}
 */
export const createConversation = async () => {
  const { data } = await api.post(BASE);
  return data.data.conversation;
};

/**
 * List all conversations for the logged-in user (newest first).
 * Returns lightweight summaries — NOT full message arrays.
 * @returns {Promise<Array<{ id, title, updatedAt, messageCount, lastMessage }>>}
 */
export const listConversations = async () => {
  const { data } = await api.get(BASE);
  return data.data.conversations;
};

/**
 * Get a single conversation with full message history.
 * @param {string} conversationId
 * @returns {Promise<{ id, title, messages }>}
 */
export const getConversation = async (conversationId) => {
  const { data } = await api.get(`${BASE}/${conversationId}`);
  return data.data.conversation;
};

/**
 * Delete a conversation by ID.
 * @param {string} conversationId
 * @returns {Promise<void>}
 */
export const deleteConversation = async (conversationId) => {
  await api.delete(`${BASE}/${conversationId}`);
};

/**
 * Send a message and receive the AI reply.
 * @param {string} conversationId
 * @param {string} message
 * @returns {Promise<{ reply: string, conversationId: string, title: string }>}
 */
export const sendMessage = async (conversationId, message) => {
  const { data } = await api.post(`${BASE}/${conversationId}/messages`, { message });
  return data.data;
};
