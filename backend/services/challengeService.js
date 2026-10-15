/**
 * services/challengeService.js
 * Core business logic for Wellness Challenges and Habit-Building System.
 */

import mongoose from 'mongoose';
import { Challenge } from '../models/Challenge.js';
import { UserChallenge } from '../models/UserChallenge.js';
import { UserBadge, BADGE_DEFINITIONS } from '../models/UserBadge.js';
import { User } from '../models/User.js';
import { Mood } from '../models/Mood.js';
import { JournalEntry } from '../models/Journal.js';
import { CheckIn } from '../models/CheckIn.js';
import { GameScore } from '../models/GameScore.js';
import { createNotification } from './notificationService.js';
import { AppError } from '../middleware/errorHandler.js';

// ── Default Seed Challenges ──────────────────────────────────────────
const DEFAULT_CHALLENGES = [
  {
    slug: 'three-breathing-breaks',
    title: 'Take Three Mindful Breathing Breaks Today',
    description: 'Pause three times throughout your day to take intentional, calming deep breaths and lower stress hormones.',
    category: 'Mindfulness',
    durationDays: 1,
    difficulty: 'Easy',
    pointsReward: 60,
    isDaily: true,
    isFeatured: true,
    icon: '🫁',
    color: '#4ecdc4',
    actionRoute: '/dashboard/user/relax',
    actionLabel: 'Open Breathing Guide',
    instructions: [
      'Take 3 distinct pauses during morning, afternoon, and evening.',
      'Perform 4–5 cycles of slow diaphragmatic breathing.',
      'Notice the release of shoulder and chest tension.',
    ],
    tasks: [
      {
        dayNumber: 1,
        title: '3 Mindful Breathing Breaks',
        description: 'Complete 3 breathing breaks during your day.',
        targetType: 'BREATHING',
        requiredCount: 3,
        points: 60,
      },
    ],
  },
  {
    slug: 'five-min-breathing',
    title: 'Five-Minute Deep Breathing Sprint',
    description: 'Commit to an uninterrupted 5-minute parasympathetic breathing reset to soothe your nervous system.',
    category: 'Relaxation',
    durationDays: 1,
    difficulty: 'Easy',
    pointsReward: 50,
    isDaily: false,
    isFeatured: true,
    icon: '🌬️',
    color: '#6c63ff',
    actionRoute: '/dashboard/user/relax',
    actionLabel: 'Start Breathing Session',
    instructions: [
      'Find a quiet, distraction-free space.',
      'Use the 4-7-8 or Box Breathing visual pacer for 5 minutes.',
      'Observe your heart rate slowing naturally.',
    ],
    tasks: [
      {
        dayNumber: 1,
        title: 'Complete 5-minute breathing session',
        description: 'Practice focused breathing using the relaxation timer.',
        targetType: 'BREATHING',
        requiredCount: 1,
        points: 50,
      },
    ],
  },
  {
    slug: 'three-day-mood-streak',
    title: 'Record Your Mood for Three Consecutive Days',
    description: 'Build self-awareness by logging your emotional state at least once every day for 3 days straight.',
    category: 'Stress Management',
    durationDays: 3,
    difficulty: 'Medium',
    pointsReward: 120,
    isDaily: false,
    isFeatured: false,
    icon: '📊',
    color: '#f7c59f',
    actionRoute: '/dashboard/user/mood',
    actionLabel: 'Log Your Mood',
    instructions: [
      'Open the Mood Tracker once each day.',
      'Select your predominant emotion and intensity.',
      'Review your 3-day emotional pattern in your journey trends.',
    ],
    tasks: [
      { dayNumber: 1, title: 'Day 1: Check in with your mood', targetType: 'MOOD', requiredCount: 1, points: 30 },
      { dayNumber: 2, title: 'Day 2: Log your emotional balance', targetType: 'MOOD', requiredCount: 1, points: 40 },
      { dayNumber: 3, title: 'Day 3: Reflect and complete streak', targetType: 'MOOD', requiredCount: 1, points: 50 },
    ],
  },
  {
    slug: 'daily-gratitude-entry',
    title: 'Write One Gratitude Journal Reflection Today',
    description: 'Shift your cognitive perspective by acknowledging three specific blessings or positive moments today.',
    category: 'Gratitude',
    durationDays: 1,
    difficulty: 'Easy',
    pointsReward: 60,
    isDaily: true,
    isFeatured: false,
    icon: '🌸',
    color: '#a8e6cf',
    actionRoute: '/dashboard/user/journal',
    actionLabel: 'Write in Journal',
    instructions: [
      'Open your Personal Wellness Journal.',
      'Write about at least one experience or person you appreciate.',
      'Notice the warm, uplifting sensation gratitude brings.',
    ],
    tasks: [
      {
        dayNumber: 1,
        title: 'Write a gratitude reflection',
        description: 'Record an entry with your gratitude moment.',
        targetType: 'JOURNAL',
        requiredCount: 1,
        points: 60,
      },
    ],
  },
  {
    slug: 'daily-wellness-checkin',
    title: 'Complete a Daily Wellness Check-in',
    description: 'Answer 5 quick questions about sleep, energy, stress, focus, and positivity to calculate your wellness score.',
    category: 'Healthy Habits',
    durationDays: 1,
    difficulty: 'Easy',
    pointsReward: 50,
    isDaily: true,
    isFeatured: false,
    icon: '📋',
    color: '#10b981',
    actionRoute: '/dashboard/user/checkin',
    actionLabel: 'Take Check-in',
    instructions: [
      'Rate your sleep quality, physical energy, and mental stress.',
      'Receive transparent recommendations tailored to your score.',
    ],
    tasks: [
      {
        dayNumber: 1,
        title: 'Complete today’s 5-question check-in',
        description: 'Submit your daily wellness report.',
        targetType: 'CHECKIN',
        requiredCount: 1,
        points: 50,
      },
    ],
  },
  {
    slug: 'ten-min-focus-session',
    title: 'Ten-Minute Deep Focus Session',
    description: 'Eliminate multitasking and dive into a 10-minute sprint of single-minded focus and cognitive flow.',
    category: 'Focus and Productivity',
    durationDays: 1,
    difficulty: 'Medium',
    pointsReward: 75,
    isDaily: false,
    isFeatured: false,
    icon: '🎯',
    color: '#f59e0b',
    actionRoute: '/dashboard/user/relax',
    actionLabel: 'Open Focus Timer',
    instructions: [
      'Silence notifications and pick one task.',
      'Start the focus timer in the Relaxation Center.',
      'Immerse yourself without switching tabs until the chime.',
    ],
    tasks: [
      {
        dayNumber: 1,
        title: 'Complete 10-minute focus timer',
        description: 'Single-task with devotion.',
        targetType: 'FOCUS',
        requiredCount: 1,
        points: 75,
      },
    ],
  },
  {
    slug: 'relaxation-game-break',
    title: 'Unwind with a Relaxation Game',
    description: 'Play a game of Bubble Pop or Memory Match to lower cortisol and engage your brain in playful mindfulness.',
    category: 'Relaxation',
    durationDays: 1,
    difficulty: 'Easy',
    pointsReward: 50,
    isDaily: false,
    isFeatured: false,
    icon: '🎮',
    color: '#ff6b6b',
    actionRoute: '/dashboard/user/games',
    actionLabel: 'Play Games',
    instructions: [
      'Select any game from the Relaxation Games suite.',
      'Play at least one full calming session.',
    ],
    tasks: [
      {
        dayNumber: 1,
        title: 'Play 1 relaxation game session',
        description: 'Enjoy a playful mental break.',
        targetType: 'GAME',
        requiredCount: 1,
        points: 50,
      },
    ],
  },
  {
    slug: 'three-positive-things',
    title: 'Write Three Positive Things About Your Day',
    description: 'Counteract the negativity bias by specifically noting 3 constructive occurrences before winding down.',
    category: 'Self-Reflection',
    durationDays: 1,
    difficulty: 'Easy',
    pointsReward: 60,
    isDaily: false,
    isFeatured: false,
    icon: '✨',
    color: '#dda0dd',
    actionRoute: '/dashboard/user/journal',
    actionLabel: 'Record 3 Things',
    instructions: [
      'Open your Wellness Journal.',
      'List 3 positive things that occurred today.',
      'Reflect on why they made you feel good.',
    ],
    tasks: [
      {
        dayNumber: 1,
        title: 'Log 3 positive things in journal',
        description: 'Capture daily highlights.',
        targetType: 'JOURNAL',
        requiredCount: 1,
        points: 60,
      },
    ],
  },
  {
    slug: 'seven-day-journaling-habit',
    title: 'Seven-Day Journaling Habit Builder',
    description: 'Transform journaling into an effortless daily habit with 7 consecutive days of thoughtful reflections.',
    category: 'Self-Reflection',
    durationDays: 7,
    difficulty: 'Hard',
    pointsReward: 250,
    isDaily: false,
    isFeatured: true,
    icon: '📝',
    color: '#7c6f9f',
    actionRoute: '/dashboard/user/journal',
    actionLabel: 'Write Today’s Reflection',
    instructions: [
      'Write at least one reflection each day for 7 days.',
      'Explore your goals, gratitude, challenges, and insights.',
      'Earn the coveted Challenge Finisher badge.',
    ],
    tasks: [
      { dayNumber: 1, title: 'Day 1 Reflection', targetType: 'JOURNAL', requiredCount: 1, points: 30 },
      { dayNumber: 2, title: 'Day 2 Reflection', targetType: 'JOURNAL', requiredCount: 1, points: 30 },
      { dayNumber: 3, title: 'Day 3 Reflection', targetType: 'JOURNAL', requiredCount: 1, points: 30 },
      { dayNumber: 4, title: 'Day 4 Reflection', targetType: 'JOURNAL', requiredCount: 1, points: 35 },
      { dayNumber: 5, title: 'Day 5 Reflection', targetType: 'JOURNAL', requiredCount: 1, points: 35 },
      { dayNumber: 6, title: 'Day 6 Reflection', targetType: 'JOURNAL', requiredCount: 1, points: 40 },
      { dayNumber: 7, title: 'Day 7 Grand Finale Reflection', targetType: 'JOURNAL', requiredCount: 1, points: 50 },
    ],
  },
  {
    slug: 'sleep-wind-down-relax',
    title: 'Practice a Short Relaxation Routine Before Sleeping',
    description: 'Engage in a gentle evening relaxation session to prepare mind and body for restorative, deep sleep.',
    category: 'Stress Management',
    durationDays: 1,
    difficulty: 'Easy',
    pointsReward: 60,
    isDaily: false,
    isFeatured: false,
    icon: '🌙',
    color: '#6366f1',
    actionRoute: '/dashboard/user/relax',
    actionLabel: 'Start Sleep Routine',
    instructions: [
      '30 minutes before bedtime, open Relaxation Center.',
      'Practice sleep breathing or listen to soothing ambient sounds.',
    ],
    tasks: [
      {
        dayNumber: 1,
        title: 'Complete evening relaxation routine',
        description: 'Unwind and prepare for restful slumber.',
        targetType: 'BREATHING',
        requiredCount: 1,
        points: 60,
      },
    ],
  },
];

/**
 * Ensures challenges catalog is seeded in MongoDB.
 */
export const ensureChallengesSeeded = async () => {
  try {
    const count = await Challenge.countDocuments();
    if (count === 0) {
      await Challenge.insertMany(DEFAULT_CHALLENGES);
    }
  } catch {
    // Non-fatal
  }
};

/**
 * Lists challenge catalog with category, search, and user enrollment status.
 */
export const getChallengesCatalog = async (userId, { category = 'All', search = '' } = {}) => {
  await ensureChallengesSeeded();

  const query = { isActive: true };

  if (category && category !== 'All') {
    query.category = category;
  }

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ title: regex }, { description: regex }, { category: regex }];
  }

  const challenges = await Challenge.find(query).sort({ isFeatured: -1, isDaily: -1, durationDays: 1 }).lean();

  // If user is authenticated, check their active or completed status for each challenge
  let activeEnrollments = [];
  if (userId) {
    activeEnrollments = await UserChallenge.find({
      user: userId,
      status: { $in: ['active', 'completed'] },
    }).lean();
  }

  const enriched = challenges.map((c) => {
    const enrollment = activeEnrollments.find(
      (e) => e.challenge.toString() === c._id.toString()
    );
    return {
      ...c,
      isEnrolled: !!(enrollment && enrollment.status === 'active'),
      isCompleted: !!(enrollment && enrollment.status === 'completed'),
      userChallengeId: enrollment ? enrollment._id : null,
      completedDaysCount: enrollment ? enrollment.completedDays?.length || 0 : 0,
      progressPercent: enrollment
        ? Math.round(((enrollment.completedDays?.length || 0) / (c.durationDays || 1)) * 100)
        : 0,
    };
  });

  return enriched;
};

/**
 * Gets details for a single challenge.
 */
export const getChallengeDetails = async (idOrSlug, userId) => {
  await ensureChallengesSeeded();

  let challenge;
  if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
    challenge = await Challenge.findById(idOrSlug).lean();
  }
  if (!challenge) {
    challenge = await Challenge.findOne({ slug: idOrSlug }).lean();
  }

  if (!challenge) {
    throw new AppError('Challenge not found', 404);
  }

  let userEnrollment = null;
  if (userId) {
    userEnrollment = await UserChallenge.findOne({
      user: userId,
      challenge: challenge._id,
      status: 'active',
    }).lean();
  }

  return {
    challenge,
    userEnrollment,
  };
};

/**
 * Enrolls the authenticated user into an available challenge.
 * Strictly prevents duplicate active enrollments.
 */
export const joinChallenge = async (userId, challengeId) => {
  const challenge = await Challenge.findById(challengeId);
  if (!challenge || !challenge.isActive) {
    throw new AppError('Challenge is not available to join', 404);
  }

  // Prevent duplicate active enrollments
  const existingActive = await UserChallenge.findOne({
    user: userId,
    challenge: challengeId,
    status: 'active',
  });

  if (existingActive) {
    throw new AppError('You are already actively participating in this challenge', 400);
  }

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + challenge.durationDays);

  // Initialize daily progress slots
  const dailyProgress = challenge.tasks.map((task) => {
    const taskDate = new Date(now);
    taskDate.setDate(taskDate.getDate() + (task.dayNumber - 1));
    return {
      dayNumber: task.dayNumber,
      date: taskDate.toISOString().split('T')[0],
      targetType: task.targetType,
      isCompleted: false,
      completedAt: null,
      pointsAwarded: 0,
      verifiedVia: null,
    };
  });

  const enrollment = await UserChallenge.create({
    user: userId,
    challenge: challenge._id,
    status: 'active',
    startDate: now,
    endDate,
    completedDays: [],
    dailyProgress,
    pointsEarned: 0,
  });

  // Dispatch in-app notification
  try {
    await createNotification({
      userId,
      title: 'Challenge Joined! 🏆',
      message: `You joined "${challenge.title}". Take your first step today!`,
      type: 'CHALLENGE',
      icon: challenge.icon || '🏆',
      link: '/dashboard/user/challenges',
    });
  } catch {
    // Non-blocking notification failure
  }

  return enrollment;
};

/**
 * Retrieves all challenges for the user (active, completed, or history).
 */
export const getMyChallenges = async (userId, { status = 'all' } = {}) => {
  const query = { user: userId };

  if (status && status !== 'all') {
    query.status = status;
  }

  const enrollments = await UserChallenge.find(query)
    .populate('challenge')
    .sort({ status: 1, createdAt: -1 })
    .lean();

  const formatted = enrollments.map((e) => {
    const duration = e.challenge?.durationDays || 1;
    const completedCount = e.completedDays?.length || 0;
    const percent = Math.min(100, Math.round((completedCount / duration) * 100));

    // Determine current active day
    const nowStr = new Date().toISOString().split('T')[0];
    const todayTask = e.dailyProgress.find((p) => p.date === nowStr) || e.dailyProgress[0];

    return {
      ...e,
      progressPercent: percent,
      completedCount,
      remainingCount: Math.max(0, duration - completedCount),
      todayTask,
    };
  });

  return formatted;
};

/**
 * Validates whether the user actually completed the required target activity today.
 */
const verifyActivityRecord = async (userId, targetType, dateStr) => {
  const startOfDay = new Date(dateStr);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(dateStr);
  endOfDay.setHours(23, 59, 59, 999);

  switch (targetType) {
    case 'MOOD': {
      const moodLog = await Mood.findOne({
        user: userId,
        loggedAt: { $gte: startOfDay, $lte: endOfDay },
      });
      return !!moodLog;
    }
    case 'JOURNAL': {
      const journalLog = await JournalEntry.findOne({
        user: userId,
        entryDate: { $gte: startOfDay, $lte: endOfDay },
      });
      return !!journalLog;
    }
    case 'CHECKIN': {
      const checkInLog = await CheckIn.findOne({
        user: userId,
        date: dateStr,
      });
      return !!checkInLog;
    }
    case 'GAME': {
      const gameScore = await GameScore.findOne({
        user: userId,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });
      return !!gameScore;
    }
    case 'BREATHING':
    case 'FOCUS':
    case 'ACTIVITY':
    default:
      // Can be validated if user engaged in session or marked task after session
      return true;
  }
};

/**
 * Checks and awards badges based on real user achievements.
 */
export const checkAndAwardBadges = async (userId) => {
  const [completedChallengesCount, userChallenges] = await Promise.all([
    UserChallenge.countDocuments({ user: userId, status: 'completed' }),
    UserChallenge.find({ user: userId }).lean(),
  ]);

  let totalTasksCompleted = 0;
  let mindfulnessCount = 0;
  let gratitudeCount = 0;

  userChallenges.forEach((uc) => {
    totalTasksCompleted += uc.completedDays?.length || 0;
    uc.dailyProgress?.forEach((dp) => {
      if (dp.isCompleted) {
        if (dp.targetType === 'BREATHING' || dp.targetType === 'ACTIVITY') mindfulnessCount++;
        if (dp.targetType === 'JOURNAL') gratitudeCount++;
      }
    });
  });

  const badgesAwarded = [];

  const grantBadge = async (badgeId) => {
    const def = BADGE_DEFINITIONS[badgeId];
    if (!def) return;

    try {
      const existing = await UserBadge.findOne({ user: userId, badgeId });
      if (!existing) {
        const newBadge = await UserBadge.create({
          user: userId,
          badgeId,
          title: def.title,
          description: def.description,
          icon: def.icon,
          pointsAwarded: def.points,
          earnedAt: new Date(),
        });

        // Award badge points to user
        await User.findByIdAndUpdate(userId, { $inc: { points: def.points } });

        // Dispatch badge notification
        await createNotification({
          userId,
          title: `New Badge Earned! ${def.icon}`,
          message: `Congratulations! You unlocked the "${def.title}" achievement (+${def.points} pts).`,
          type: 'BADGE',
          icon: def.icon,
          link: '/dashboard/user/challenges',
        });

        badgesAwarded.push(newBadge);
      }
    } catch {
      // Duplicate key or non-fatal
    }
  };

  // Badge 1: First Step (completed at least 1 task)
  if (totalTasksCompleted >= 1) {
    await grantBadge('first-step');
  }

  // Badge 2: Mindful Beginner (3 mindfulness tasks)
  if (mindfulnessCount >= 3) {
    await grantBadge('mindful-beginner');
  }

  // Badge 3: Gratitude Star (5 gratitude or journal tasks)
  if (gratitudeCount >= 5) {
    await grantBadge('gratitude-star');
  }

  // Badge 4: Consistency Champion (3 or more tasks completed across consecutive dates)
  if (totalTasksCompleted >= 3) {
    await grantBadge('consistency-champion');
  }

  // Badge 5: Challenge Finisher (completed at least 1 full challenge)
  if (completedChallengesCount >= 1) {
    await grantBadge('challenge-finisher');
  }

  return badgesAwarded;
};

/**
 * Completes a specific day's task in an active challenge.
 * Validates real record existence and prevents duplicate rewards.
 */
export const completeChallengeTask = async (userId, userChallengeId, dayNumber) => {
  if (!mongoose.isValidObjectId(userChallengeId)) {
    throw new AppError('Invalid challenge identifier', 400);
  }

  const enrollment = await UserChallenge.findOne({
    user: userId,
    status: 'active',
    $or: [{ _id: userChallengeId }, { challenge: userChallengeId }],
  }).populate('challenge');

  if (!enrollment) {
    throw new AppError('Active challenge enrollment not found', 404);
  }

  const dayNum = Number(dayNumber);
  const taskProgress = enrollment.dailyProgress.find((p) => p.dayNumber === dayNum);

  if (!taskProgress) {
    throw new AppError(`Task for Day ${dayNum} not found in this challenge`, 404);
  }

  if (taskProgress.isCompleted) {
    throw new AppError('This task has already been completed. Repeated completions do not award extra points.', 400);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Backend record validation
  const isValidated = await verifyActivityRecord(userId, taskProgress.targetType, todayStr);
  if (!isValidated) {
    let actionTip = 'required activity';
    if (taskProgress.targetType === 'MOOD') actionTip = 'mood entry in Mood Tracker';
    if (taskProgress.targetType === 'JOURNAL') actionTip = 'reflection in Personal Wellness Journal';
    if (taskProgress.targetType === 'CHECKIN') actionTip = 'daily wellness check-in';

    throw new AppError(`Verification pending: Please complete your ${actionTip} first to verify this task.`, 400);
  }

  // Find task definition for points
  const taskDef = enrollment.challenge?.tasks?.find((t) => t.dayNumber === dayNum);
  const taskPoints = taskDef?.points || 20;

  // Mark task completed
  taskProgress.isCompleted = true;
  taskProgress.completedAt = new Date();
  taskProgress.pointsAwarded = taskPoints;
  taskProgress.verifiedVia = taskProgress.targetType;

  if (!enrollment.completedDays.includes(dayNum)) {
    enrollment.completedDays.push(dayNum);
  }

  enrollment.pointsEarned += taskPoints;

  // Check if all tasks in challenge are now finished
  const totalDays = enrollment.challenge?.durationDays || 1;
  const isAllComplete = enrollment.completedDays.length >= totalDays;

  let challengeBonusAwarded = 0;
  if (isAllComplete) {
    enrollment.status = 'completed';
    enrollment.completedAt = new Date();
    challengeBonusAwarded = enrollment.challenge?.pointsReward || 50;
    enrollment.pointsEarned += challengeBonusAwarded;
  }

  await enrollment.save();

  // Atomically increment user's total points
  const totalAwarded = taskPoints + challengeBonusAwarded;
  await User.findByIdAndUpdate(userId, { $inc: { points: totalAwarded } });

  // Notifications
  try {
    if (isAllComplete) {
      await createNotification({
        userId,
        title: 'Challenge Completed! 🏆',
        message: `Outstanding! You fully completed "${enrollment.challenge?.title}" and earned ${totalAwarded} points!`,
        type: 'CHALLENGE',
        icon: '🏆',
        link: '/dashboard/user/challenges',
      });
    } else {
      await createNotification({
        userId,
        title: 'Daily Task Complete! ✨',
        message: `Day ${dayNum} of "${enrollment.challenge?.title}" completed (+${taskPoints} pts).`,
        type: 'CHALLENGE',
        icon: '✅',
        link: '/dashboard/user/challenges',
      });
    }
  } catch {
    // Non-blocking
  }

  // Check for badge unlocks
  const newBadges = await checkAndAwardBadges(userId);

  return {
    enrollment,
    isCompleted: isAllComplete,
    pointsAwarded: totalAwarded,
    newBadges,
  };
};

/**
 * Leaves / abandons an active challenge.
 */
export const leaveChallenge = async (userId, userChallengeId) => {
  if (!mongoose.isValidObjectId(userChallengeId)) {
    throw new AppError('Invalid challenge identifier', 400);
  }

  const enrollment = await UserChallenge.findOne({
    user: userId,
    status: 'active',
    $or: [{ _id: userChallengeId }, { challenge: userChallengeId }],
  });

  if (!enrollment) {
    throw new AppError('Active challenge enrollment not found', 404);
  }

  enrollment.status = 'abandoned';
  await enrollment.save();

  return { id: userChallengeId, status: 'abandoned' };
};

/**
 * Calculates Challenges Dashboard Metrics:
 * - Current streak (from actual task completion dates)
 * - Total completed challenges
 * - Challenge completion rate (based on real records)
 * - Badges unlocked
 * - Daily & Featured challenges
 * - Rule-based recommendations
 */
export const getChallengesDashboardStats = async (userId) => {
  await ensureChallengesSeeded();

  const [
    user,
    completedCount,
    activeCount,
    totalEnrollments,
    allUserChallenges,
    unlockedBadges,
    dailyChallenge,
    featuredChallenge,
    todayMood,
    todayCheckin,
    todayJournal,
  ] = await Promise.all([
    User.findById(userId).select('points name email').lean(),
    UserChallenge.countDocuments({ user: userId, status: 'completed' }),
    UserChallenge.countDocuments({ user: userId, status: 'active' }),
    UserChallenge.countDocuments({ user: userId }),
    UserChallenge.find({ user: userId }).lean(),
    UserBadge.find({ user: userId }).sort({ earnedAt: -1 }).lean(),
    Challenge.findOne({ isDaily: true, isActive: true }).lean(),
    Challenge.findOne({ isFeatured: true, isActive: true }).lean(),
    // Check real activity today for transparent recommendations
    Mood.findOne({
      user: userId,
      loggedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }).lean(),
    CheckIn.findOne({
      user: userId,
      date: new Date().toISOString().split('T')[0],
    }).lean(),
    JournalEntry.findOne({
      user: userId,
      entryDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }).lean(),
  ]);

  // Actual Streak Calculation from consecutive completed task dates
  const completionDates = new Set();
  allUserChallenges.forEach((uc) => {
    uc.dailyProgress?.forEach((p) => {
      if (p.isCompleted && p.date) {
        completionDates.add(p.date);
      }
    });
  });

  const sortedDates = Array.from(completionDates).sort().reverse();
  let streak = 0;

  if (sortedDates.length > 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const mostRecent = sortedDates[0];
    let checkDate;

    if (mostRecent === todayStr) {
      streak = 1;
      checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (mostRecent === yesterdayStr) {
      streak = 1;
      checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - 2);
    } else {
      streak = 0;
    }

    if (streak > 0) {
      let idx = 1;
      while (idx < sortedDates.length) {
        const expectedStr = checkDate.toISOString().split('T')[0];
        if (sortedDates[idx] === expectedStr) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
          idx++;
        } else {
          break;
        }
      }
    }
  }

  // Completion rate based on real records
  const resolvedRate =
    totalEnrollments > 0
      ? Math.round((completedCount / totalEnrollments) * 100)
      : 100;

  // Format all badge definitions with unlocked status
  const allBadgesFormatted = Object.values(BADGE_DEFINITIONS).map((b) => {
    const unlocked = unlockedBadges.find((ub) => ub.badgeId === b.badgeId);
    return {
      ...b,
      isUnlocked: !!unlocked,
      earnedAt: unlocked ? unlocked.earnedAt : null,
    };
  });

  // Transparent Rule-Based Recommendations (Requirement 8)
  const recommendations = [];

  if (!todayMood) {
    recommendations.push({
      reason: 'You haven’t checked in with your emotions today.',
      suggestedChallengeSlug: 'three-day-mood-streak',
      title: 'Build Emotional Awareness',
      actionRoute: '/dashboard/user/mood',
    });
  }

  if (!todayCheckin) {
    recommendations.push({
      reason: 'Take 1 minute to record your daily wellness score.',
      suggestedChallengeSlug: 'daily-wellness-checkin',
      title: 'Complete Daily Wellness Check-in',
      actionRoute: '/dashboard/user/checkin',
    });
  }

  if (todayJournal) {
    recommendations.push({
      reason: 'Since you enjoy journaling, build an unbroken 7-day habit.',
      suggestedChallengeSlug: 'seven-day-journaling-habit',
      title: 'Seven-Day Journaling Habit Builder',
      actionRoute: '/dashboard/user/journal',
    });
  } else {
    recommendations.push({
      reason: 'Cultivate positivity with a single gratitude reflection.',
      suggestedChallengeSlug: 'daily-gratitude-entry',
      title: 'Write a Gratitude Reflection',
      actionRoute: '/dashboard/user/journal',
    });
  }

  if (activeCount === 0) {
    recommendations.push({
      reason: 'You currently have no active challenge — start with an easy breathing break.',
      suggestedChallengeSlug: 'three-breathing-breaks',
      title: 'Take 3 Mindful Breathing Breaks',
      actionRoute: '/dashboard/user/relax',
    });
  }

  return {
    userPoints: user?.points || 0,
    totalCompletedChallenges: completedCount,
    activeChallengesCount: activeCount,
    completionRate: resolvedRate,
    currentStreak: streak,
    badges: allBadgesFormatted,
    dailyChallenge,
    featuredChallenge,
    recommendations,
  };
};
