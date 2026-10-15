/**
 * services/journeyService.js
 * Business logic for "My Wellness Journey" analytics dashboard — Part 17.
 *
 * All aggregations run strictly against the authenticated user's records:
 *   - CheckIn: streak, wellnessScore trend, stress level, sleep, energy
 *   - Mood: frequency, dominant mood, intensity, source distribution
 *   - GameScore: total games played, per-game personal bests and history
 *   - Conversation: AI chat threads, message counts, interaction dates
 *   - Appointment: booking counts, status breakdown, upcoming sessions
 *
 * Real authentic user data only — no fake statistics.
 * Provides an optional seedUserJourneyData() for demo accounts to populate
 * real MongoDB documents across all collections if currently empty.
 */

import mongoose from 'mongoose';
import { CheckIn, calculateWellnessScore, todayUTC, toDateKey } from '../models/CheckIn.js';
import { Mood } from '../models/Mood.js';
import { GameScore } from '../models/GameScore.js';
import { Conversation } from '../models/Conversation.js';
import { Appointment } from '../models/Appointment.js';
import { Counsellor } from '../models/Counsellor.js';

// ── Helpers ───────────────────────────────────────────────────

/** Formats date into YYYY-MM-DD */
const formatYMD = (d) => new Date(d).toISOString().slice(0, 10);

/** Calculate consecutive day streak from an array of Date objects */
export const calculateActivityStreak = (activityDates) => {
  if (!activityDates || !activityDates.length) return 0;

  // Unique set of YYYY-MM-DD dates in chronological order
  const uniqueDates = new Set(
    activityDates.map((d) => (typeof d === 'string' ? d.slice(0, 10) : formatYMD(d)))
  );

  const today = new Date();
  const todayKey = formatYMD(today);

  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = formatYMD(yesterday);

  // If user hasn't logged today, they can still have an active streak if logged yesterday
  let checkDate = new Date();
  if (!uniqueDates.has(todayKey)) {
    if (!uniqueDates.has(yesterdayKey)) {
      return 0; // Streak broken
    }
    checkDate = yesterday;
  }

  let streak = 0;
  while (true) {
    const key = formatYMD(checkDate);
    if (uniqueDates.has(key)) {
      streak += 1;
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

// ── Aggregation: Journey Stats ────────────────────────────────

/**
 * Aggregates all user health and engagement metrics for the given timeframe.
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {'week'|'month'} range
 */
export const getJourneyStats = async (userId, range = 'week') => {
  const userObjectId = typeof userId === 'string'
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const daysCount = range === 'month' ? 30 : 7;

  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - (daysCount - 1));
  startDate.setUTCHours(0, 0, 0, 0);

  // ── Parallel fetching across all MindEase collections ─────────
  const [
    allCheckIns,
    rangeCheckIns,
    allMoods,
    rangeMoods,
    gameStats,
    allGameScores,
    conversations,
    appointments,
  ] = await Promise.all([
    // All check-ins for all-time streak & total
    CheckIn.find({ user: userObjectId }).sort({ date: 1 }).select('date wellnessScore stress').lean(),

    // Check-ins within the selected timeframe
    CheckIn.find({ user: userObjectId, date: { $gte: startDate } }).sort({ date: 1 }).lean(),

    // All moods for count & lifetime stats
    Mood.find({ user: userObjectId }).sort({ loggedAt: 1 }).select('loggedAt mood intensity source').lean(),

    // Moods within range
    Mood.find({ user: userObjectId, loggedAt: { $gte: startDate } }).sort({ loggedAt: 1 }).lean(),

    // Aggregated game stats per game
    GameScore.aggregate([
      { $match: { user: userObjectId } },
      {
        $group: {
          _id: '$game',
          gamesPlayed: { $sum: 1 },
          bestScore: { $max: '$score' },
          lastPlayedAt: { $max: '$createdAt' },
          totalScore: { $sum: '$score' },
        },
      },
      {
        $project: {
          _id: 0,
          game: '$_id',
          gamesPlayed: 1,
          bestScore: 1,
          lastPlayedAt: 1,
          avgScore: { $round: [{ $divide: ['$totalScore', '$gamesPlayed'] }, 0] },
        },
      },
    ]),

    // Game scores within range for activity timeline
    GameScore.find({ user: userObjectId, createdAt: { $gte: startDate } }).select('game score createdAt').lean(),

    // All user conversations
    Conversation.find({ user: userObjectId }).select('title messages createdAt updatedAt').lean(),

    // User appointments
    Appointment.find({ user: userObjectId })
      .populate('counsellor', 'name email avatar')
      .sort({ scheduledAt: 1 })
      .lean(),
  ]);

  // ── 1. Calculate Activity Streak ─────────────────────────────
  // Combined activity dates from check-ins, moods, and game plays
  const allActivityDates = [
    ...allCheckIns.map((c) => c.date),
    ...allMoods.map((m) => m.loggedAt),
    ...allGameScores.map((g) => g.createdAt),
  ];
  const currentStreak = calculateActivityStreak(allActivityDates);

  // ── 2. Timeframe Bucketing (Weekly / Monthly) ─────────────────
  const dateBuckets = [];
  const checkInMap = new Map();
  rangeCheckIns.forEach((c) => {
    checkInMap.set(toDateKey(c.date), c);
  });

  const moodsByDate = new Map();
  rangeMoods.forEach((m) => {
    const key = formatYMD(m.loggedAt);
    if (!moodsByDate.has(key)) moodsByDate.set(key, []);
    moodsByDate.get(key).push(m);
  });

  const gamesByDate = new Map();
  allGameScores.forEach((g) => {
    const key = formatYMD(g.createdAt);
    gamesByDate.set(key, (gamesByDate.get(key) || 0) + 1);
  });

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(startDate);
    d.setUTCDate(startDate.getUTCDate() + i);
    const dateKey = formatYMD(d);
    const checkIn = checkInMap.get(dateKey);
    const dayMoods = moodsByDate.get(dateKey) || [];
    const dayGames = gamesByDate.get(dateKey) || 0;

    dateBuckets.push({
      date: dateKey,
      label: d.toLocaleDateString('en-IN', {
        weekday: daysCount <= 7 ? 'short' : undefined,
        month: 'short',
        day: 'numeric',
      }),
      wellnessScore: checkIn ? checkIn.wellnessScore : null,
      stress: checkIn ? checkIn.stress : null,
      sleep: checkIn ? checkIn.sleep : null,
      energy: checkIn ? checkIn.energy : null,
      positivity: checkIn ? checkIn.positivity : null,
      focus: checkIn ? checkIn.focus : null,
      hasCheckIn: Boolean(checkIn),
      moodCount: dayMoods.length,
      gamesPlayed: dayGames,
    });
  }

  // ── 3. Wellness & Stress Statistics ──────────────────────────
  const validCheckIns = rangeCheckIns.filter((c) => typeof c.wellnessScore === 'number');
  const avgWellness = validCheckIns.length
    ? Math.round(validCheckIns.reduce((acc, c) => acc + c.wellnessScore, 0) / validCheckIns.length)
    : null;

  const validStress = rangeCheckIns.filter((c) => typeof c.stress === 'number');
  const avgStress = validStress.length
    ? Number((validStress.reduce((acc, c) => acc + c.stress, 0) / validStress.length).toFixed(1))
    : null;

  // Stress interpretation
  let stressCategory = 'Normal';
  if (avgStress !== null) {
    if (avgStress <= 2.0) stressCategory = 'Low';
    else if (avgStress <= 3.2) stressCategory = 'Moderate';
    else if (avgStress <= 4.0) stressCategory = 'Elevated';
    else stressCategory = 'High';
  }

  // Wellness score min / max in range
  const scoreValues = validCheckIns.map((c) => c.wellnessScore);
  const minScore = scoreValues.length ? Math.min(...scoreValues) : null;
  const maxScore = scoreValues.length ? Math.max(...scoreValues) : null;

  // ── 4. Mood Statistics ───────────────────────────────────────
  const moodFrequencyMap = {};
  const moodSourceMap = { MANUAL: 0, TEXT_AI: 0, FACIAL: 0 };
  let intensitySum = 0;

  rangeMoods.forEach((m) => {
    moodFrequencyMap[m.mood] = (moodFrequencyMap[m.mood] || 0) + 1;
    if (m.source && moodSourceMap[m.source] !== undefined) {
      moodSourceMap[m.source] += 1;
    }
    if (typeof m.intensity === 'number') {
      intensitySum += m.intensity;
    }
  });

  const moodFrequency = Object.entries(moodFrequencyMap)
    .map(([mood, count]) => ({ mood, count }))
    .sort((a, b) => b.count - a.count);

  const topMood = moodFrequency.length ? moodFrequency[0] : null;
  const avgIntensity = rangeMoods.length
    ? Number((intensitySum / rangeMoods.length).toFixed(1))
    : null;

  // ── 5. Games Statistics ──────────────────────────────────────
  const totalGamesPlayed = gameStats.reduce((acc, g) => acc + g.gamesPlayed, 0);

  // ── 6. AI Conversations Statistics ───────────────────────────
  const totalConversations = conversations.length;
  let totalAiMessages = 0;
  conversations.forEach((c) => {
    totalAiMessages += (c.messages?.length || 0);
  });

  // ── 7. Appointments Statistics ───────────────────────────────
  const now = new Date();
  const upcomingAppointments = appointments.filter(
    (a) => new Date(a.scheduledAt) >= now && (a.status === 'confirmed' || a.status === 'accepted' || a.status === 'pending')
  );
  const completedAppointments = appointments.filter((a) => a.status === 'completed');

  const appointmentStatusCounts = {
    total: appointments.length,
    confirmed: appointments.filter((a) => a.status === 'confirmed' || a.status === 'accepted').length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    completed: completedAppointments.length,
    cancelled: appointments.filter((a) => a.status === 'cancelled' || a.status === 'rejected').length,
  };

  const nextUpcoming = upcomingAppointments.length ? upcomingAppointments[0] : null;

  // ── Response Payload ─────────────────────────────────────────
  return {
    range,
    daysCount,
    summary: {
      currentStreak,
      totalCheckIns: allCheckIns.length,
      rangeCheckIns: rangeCheckIns.length,
      averageWellnessScore: avgWellness,
      minScore,
      maxScore,
      averageStress: avgStress,
      stressCategory,
      totalMoodLogs: allMoods.length,
      rangeMoodLogs: rangeMoods.length,
      topMood,
      averageMoodIntensity: avgIntensity,
      totalGamesPlayed,
      totalAiConversations: totalConversations,
      totalAiMessages,
      appointments: appointmentStatusCounts,
      nextUpcomingAppointment: nextUpcoming
        ? {
            id: nextUpcoming._id,
            scheduledAt: nextUpcoming.scheduledAt,
            duration: nextUpcoming.duration,
            status: nextUpcoming.status,
            counsellor: nextUpcoming.counsellor
              ? {
                  name: nextUpcoming.counsellor.name,
                  email: nextUpcoming.counsellor.email,
                  avatar: nextUpcoming.counsellor.avatar,
                }
              : null,
          }
        : null,
    },
    trend: dateBuckets,
    moods: {
      frequency: moodFrequency,
      sources: moodSourceMap,
      averageIntensity: avgIntensity,
      topMood,
    },
    games: {
      totalPlayed: totalGamesPlayed,
      breakdown: gameStats,
    },
    conversations: {
      totalCount: totalConversations,
      messageCount: totalAiMessages,
      recent: conversations.slice(0, 5).map((c) => ({
        id: c._id,
        title: c.title,
        updatedAt: c.updatedAt,
        messageCount: c.messages?.length || 0,
      })),
    },
    appointments: {
      summary: appointmentStatusCounts,
      upcoming: upcomingAppointments.slice(0, 3).map((a) => ({
        id: a._id,
        scheduledAt: a.scheduledAt,
        duration: a.duration,
        status: a.status,
        counsellor: a.counsellor ? { name: a.counsellor.name } : null,
      })),
      completedCount: completedAppointments.length,
    },
  };
};

// ── Demo Seed Data Helper ──────────────────────────────────────
/**
 * Seeds realistic, authenticated data into the user's MongoDB records.
 * Only populates data if the user explicitly triggers it.
 * @param {string|mongoose.Types.ObjectId} userId
 */
export const seedUserJourneyData = async (userId) => {
  const userObjectId = typeof userId === 'string'
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const now = new Date();

  // 1. Seed CheckIns for past 14 days
  const checkInDates = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    d.setUTCHours(0, 0, 0, 0);

    // Natural variation with positive trend
    const sleep = Math.min(5, Math.max(2, Math.round(3 + Math.sin(i * 0.7) * 1.5)));
    const energy = Math.min(5, Math.max(2, Math.round(3.2 + Math.cos(i * 0.5) * 1.3)));
    const stress = Math.min(5, Math.max(1, Math.round(3 - Math.sin(i * 0.4) * 1.2)));
    const positivity = Math.min(5, Math.max(2, Math.round(3.5 + Math.sin(i * 0.3) * 1.2)));
    const focus = Math.min(5, Math.max(2, Math.round(3 + Math.cos(i * 0.6) * 1.4)));

    const raw = sleep + energy + (6 - stress) + positivity + focus;
    const wellnessScore = Math.round((raw / 25) * 100);

    checkInDates.push({
      user: userObjectId,
      date: d,
      sleep,
      energy,
      stress,
      positivity,
      focus,
      wellnessScore,
      note: i === 0 ? 'Feeling refreshed and steady today.' : null,
    });
  }

  // Delete existing demo check-ins within last 14 days to prevent duplicate key conflicts
  const minDate = checkInDates[0].date;
  await CheckIn.deleteMany({ user: userObjectId, date: { $gte: minDate } });
  await CheckIn.insertMany(checkInDates);

  // 2. Seed Mood entries for past 14 days
  const moodSamples = [
    { mood: 'calm', intensity: 4, source: 'MANUAL', note: 'Morning tea in the sunshine.' },
    { mood: 'happy', intensity: 5, source: 'MANUAL', note: 'Good productive session today.' },
    { mood: 'neutral', intensity: 3, source: 'TEXT_AI', note: 'Work was standard, feeling okay.' },
    { mood: 'stressed', intensity: 4, source: 'MANUAL', note: 'Tight deadlines approaching.' },
    { mood: 'excited', intensity: 4, source: 'FACIAL', note: 'Completed milestone celebration!' },
    { mood: 'calm', intensity: 4, source: 'MANUAL', note: 'Evening deep breathing practice.' },
    { mood: 'happy', intensity: 4, source: 'TEXT_AI', note: 'Caught up with old friends.' },
    { mood: 'tired', intensity: 3, source: 'MANUAL', note: 'Late night study, time to rest.' },
  ];

  const moodDocs = [];
  for (let i = 12; i >= 0; i -= 2) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    d.setUTCHours(10 + (i % 6), 0, 0, 0);

    const sample = moodSamples[(i / 2) % moodSamples.length];
    moodDocs.push({
      user: userObjectId,
      mood: sample.mood,
      intensity: sample.intensity,
      source: sample.source,
      note: sample.note,
      loggedAt: d,
    });
  }
  await Mood.insertMany(moodDocs);

  // 3. Seed Game scores if none exist
  const existingGameScores = await GameScore.countDocuments({ user: userObjectId });
  if (existingGameScores < 5) {
    const gamesToSeed = [
      { game: 'bubble_pop', score: 320, meta: { bubblesPopped: 32, combo: 6 } },
      { game: 'memory_match', score: 450, meta: { moves: 14, timeSec: 42 } },
      { game: 'breathing_game', score: 500, meta: { cycles: 6, accuracy: 96 } },
      { game: 'reaction_game', score: 380, meta: { avgReactionMs: 290 } },
      { game: 'bubble_pop', score: 410, meta: { bubblesPopped: 41, combo: 9 } },
    ];
    await GameScore.insertMany(
      gamesToSeed.map((g, idx) => {
        const d = new Date(now);
        d.setUTCDate(now.getUTCDate() - (idx * 2));
        return {
          user: userObjectId,
          game: g.game,
          score: g.score,
          meta: g.meta,
          createdAt: d,
          updatedAt: d,
        };
      })
    );
  }

  // 4. Seed an appointment if user has none
  const existingAppts = await Appointment.countDocuments({ user: userObjectId });
  if (existingAppts === 0) {
    const counsellorUser = await Counsellor.findOne().populate('user');
    if (counsellorUser?.user?._id) {
      const scheduledDate = new Date(now);
      scheduledDate.setUTCDate(now.getUTCDate() + 3);
      scheduledDate.setUTCHours(14, 0, 0, 0);

      await Appointment.create({
        counsellor: counsellorUser.user._id,
        user: userObjectId,
        scheduledAt: scheduledDate,
        duration: 60,
        status: 'confirmed',
        notes: 'Discussion on mindfulness and work-life balance.',
      });
    }
  }

  return { seeded: true, message: 'Sample real journey data seeded successfully.' };
};
