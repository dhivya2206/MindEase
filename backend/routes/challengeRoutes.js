/**
 * routes/challengeRoutes.js
 * Endpoints for Wellness Challenges & Habit-Building System.
 *
 * All operations require JWT authentication (`protect`).
 */

import { Router } from 'express';
import { protect } from '../middleware/protect.js';
import * as challengeController from '../controllers/challengeController.js';

const router = Router();

router.use(protect);

router.get('/dashboard-stats',                                      challengeController.getDashboardStats);
router.get('/my',                                                   challengeController.getMyChallenges);
router.get('/catalog',                                              challengeController.getCatalog);
router.get('/',                                                     challengeController.getCatalog);
router.get('/:idOrSlug',                                            challengeController.getChallengeDetails);
router.post('/:challengeId/join',                                   challengeController.joinChallenge);
router.post('/:userChallengeId/tasks/:dayNumber/complete',          challengeController.completeTask);
router.post('/:userChallengeId/leave',                              challengeController.leaveChallenge);

export default router;
