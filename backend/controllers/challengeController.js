/**
 * controllers/challengeController.js
 * HTTP controllers for Wellness Challenges & Habit-Building System.
 */

import * as challengeService from '../services/challengeService.js';
import { sendSuccess } from '../utils/responseFormatter.js';

/**
 * GET /api/challenges
 * Retrieve challenge catalog with category & search filters.
 */
export const getCatalog = async (req, res) => {
  const { category, search } = req.query;
  const challenges = await challengeService.getChallengesCatalog(req.user?._id, {
    category,
    search,
  });

  return sendSuccess(res, {
    message: 'Challenges retrieved successfully',
    data: { challenges },
  });
};

/**
 * GET /api/challenges/dashboard-stats
 * High-level challenges metrics, streak, points, badges, recommendations.
 */
export const getDashboardStats = async (req, res) => {
  const stats = await challengeService.getChallengesDashboardStats(req.user._id);

  return sendSuccess(res, {
    message: 'Challenge dashboard metrics retrieved',
    data: stats,
  });
};

/**
 * GET /api/challenges/my
 * User's active and completed challenge enrollments.
 */
export const getMyChallenges = async (req, res) => {
  const { status } = req.query;
  const myChallenges = await challengeService.getMyChallenges(req.user._id, { status });

  return sendSuccess(res, {
    message: 'User challenges retrieved',
    data: { myChallenges },
  });
};

/**
 * GET /api/challenges/:idOrSlug
 * Detailed view of a challenge and active user enrollment.
 */
export const getChallengeDetails = async (req, res) => {
  const { idOrSlug } = req.params;
  const details = await challengeService.getChallengeDetails(idOrSlug, req.user?._id);

  return sendSuccess(res, {
    message: 'Challenge details retrieved',
    data: details,
  });
};

/**
 * POST /api/challenges/:challengeId/join
 * Join an available challenge.
 */
export const joinChallenge = async (req, res) => {
  const { challengeId } = req.params;
  const enrollment = await challengeService.joinChallenge(req.user._id, challengeId);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Challenge joined successfully',
    data: { enrollment },
  });
};

/**
 * POST /api/challenges/:userChallengeId/tasks/:dayNumber/complete
 * Verify and complete a day's task.
 */
export const completeTask = async (req, res) => {
  const { userChallengeId, dayNumber } = req.params;
  const result = await challengeService.completeChallengeTask(
    req.user._id,
    userChallengeId,
    dayNumber
  );

  return sendSuccess(res, {
    message: result.isCompleted ? 'Challenge completed!' : 'Daily task completed!',
    data: result,
  });
};

/**
 * POST /api/challenges/:userChallengeId/leave
 * Abandon an active challenge.
 */
export const leaveChallenge = async (req, res) => {
  const { userChallengeId } = req.params;
  const result = await challengeService.leaveChallenge(req.user._id, userChallengeId);

  return sendSuccess(res, {
    message: 'Challenge left',
    data: result,
  });
};
