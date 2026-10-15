/**
 * services/challengeService.js
 * Frontend API client for Wellness Challenges & Habit-Building System.
 */

import api from './api';

/**
 * Lists challenges catalog with optional category and search filters
 */
export const getCatalog = async (params = {}) => {
  const response = await api.get('/api/challenges', { params });
  return response.data?.data?.challenges || [];
};

/**
 * Retrieves dashboard stats (streak, active count, completion rate, badges, recommendations)
 */
export const getDashboardStats = async () => {
  const response = await api.get('/api/challenges/dashboard-stats');
  return response.data?.data;
};

/**
 * Lists user's active, completed, or all challenges
 */
export const getMyChallenges = async (params = {}) => {
  const response = await api.get('/api/challenges/my', { params });
  return response.data?.data?.myChallenges || [];
};

/**
 * Gets full details for a challenge by ID or slug
 */
export const getChallengeDetails = async (idOrSlug) => {
  const response = await api.get(`/api/challenges/${idOrSlug}`);
  return response.data?.data;
};

/**
 * Enrolls the authenticated user into an available challenge
 */
export const joinChallenge = async (challengeId) => {
  const response = await api.post(`/api/challenges/${challengeId}/join`);
  return response.data?.data?.enrollment;
};

/**
 * Completes and verifies a specific day's task
 */
export const completeTask = async (userChallengeId, dayNumber) => {
  const response = await api.post(`/api/challenges/${userChallengeId}/tasks/${dayNumber}/complete`);
  return response.data?.data;
};

/**
 * Abandons an active challenge
 */
export const leaveChallenge = async (userChallengeId) => {
  const response = await api.post(`/api/challenges/${userChallengeId}/leave`);
  return response.data?.data;
};
