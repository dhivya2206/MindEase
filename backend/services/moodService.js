/**
 * services/moodService.js
 * Business logic for mood CRUD + analytics — Part 6.
 *
 * All functions enforce user scoping:
 *   every query filters by { user: userId } — no cross-user data leakage.
 */

import { Mood } from '../models/Mood.js';
import { AppError } from '../middleware/errorHandler.js';

// ── CRUD ──────────────────────────────────────────────────────

/**
 * Create a new mood entry for the given user.
 * Accepts all sources: MANUAL (mood picker), TEXT_AI (text analysis), FACIAL (camera estimation).
 * @param {string} userId
 * @param {{ mood, intensity, note, loggedAt, source, analysisConfidence }} dto
 */
export const createMood = async (userId, dto) => {
  const entry = await Mood.create({ user: userId, ...dto });
  return entry.toJSON();
};

/**
 * Get paginated mood history for a user.
 * Supports filtering by mood type and date range.
 *
 * @param {string} userId
 * @param {{ limit, page, mood, from, to, sort }} query
 * @returns {{ entries: object[], total: number, page: number, pages: number }}
 */
export const getMoods = async (userId, { limit = 20, page = 1, mood, from, to, sort = 'desc' } = {}) => {
  const filter = { user: userId };
  if (mood)  filter.mood = mood;
  if (from || to) {
    filter.loggedAt = {};
    if (from) filter.loggedAt.$gte = new Date(from);
    if (to)   filter.loggedAt.$lte = new Date(to);
  }

  const sortDir = sort === 'asc' ? 1 : -1;
  const skip    = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    Mood.find(filter).sort({ loggedAt: sortDir }).skip(skip).limit(limit).lean(),
    Mood.countDocuments(filter),
  ]);

  // Normalise _id → id
  const formatted = entries.map(e => ({ ...e, id: e._id.toString(), _id: undefined }));

  return {
    entries: formatted,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

/**
 * Get a single mood entry — must belong to the requesting user.
 * @param {string} entryId
 * @param {string} userId
 */
export const getMoodById = async (entryId, userId) => {
  const entry = await Mood.findOne({ _id: entryId, user: userId });
  if (!entry) throw new AppError('Mood entry not found', 404);
  return entry.toJSON();
};

/**
 * Update a mood entry — ownership enforced.
 * @param {string} entryId
 * @param {string} userId
 * @param {object} dto
 */
export const updateMood = async (entryId, userId, dto) => {
  const entry = await Mood.findOneAndUpdate(
    { _id: entryId, user: userId },
    dto,
    { new: true, runValidators: true }
  );
  if (!entry) throw new AppError('Mood entry not found', 404);
  return entry.toJSON();
};

/**
 * Delete a mood entry — ownership enforced.
 * @param {string} entryId
 * @param {string} userId
 */
export const deleteMood = async (entryId, userId) => {
  const entry = await Mood.findOneAndDelete({ _id: entryId, user: userId });
  if (!entry) throw new AppError('Mood entry not found', 404);
  return { deleted: true, id: entryId };
};

// ── Analytics ─────────────────────────────────────────────────

/**
 * Get mood statistics for the dashboard charts.
 * Returns:
 *   weekly    — last 7 days, one data point per day
 *   frequency — count of each mood type (all time or last 30 days)
 *   trend     — last 14 days with average intensity per day
 *
 * @param {string} userId
 */
export const getMoodStats = async (userId) => {
  const now    = new Date();
  const day7   = new Date(now); day7.setDate(now.getDate() - 6);   // 7 days inclusive
  const day14  = new Date(now); day14.setDate(now.getDate() - 13);
  const day30  = new Date(now); day30.setDate(now.getDate() - 29);

  // ── Weekly: group by date, list all moods logged that day ────
  const weeklyRaw = await Mood.aggregate([
    { $match: { user: Mood.base.Types.ObjectId.createFromHexString(userId), loggedAt: { $gte: day7 } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$loggedAt', timezone: 'Asia/Kolkata' },
        },
        moods:     { $push: '$mood' },
        avgIntensity: { $avg: '$intensity' },
        count:     { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: '$_id', moods: 1, avgIntensity: { $round: ['$avgIntensity', 1] }, count: 1, _id: 0 } },
  ]);

  // Fill missing days with empty entries
  const weekly = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(day7);
    d.setDate(day7.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const found   = weeklyRaw.find(r => r.date === dateStr);
    weekly.push(found ?? { date: dateStr, moods: [], avgIntensity: null, count: 0 });
  }

  // ── Frequency: count per mood type (last 30 days) ────────────
  const frequencyRaw = await Mood.aggregate([
    { $match: { user: Mood.base.Types.ObjectId.createFromHexString(userId), loggedAt: { $gte: day30 } } },
    { $group: { _id: '$mood', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { mood: '$_id', count: 1, _id: 0 } },
  ]);

  // ── Trend: 14-day average intensity per day ───────────────────
  const trendRaw = await Mood.aggregate([
    { $match: { user: Mood.base.Types.ObjectId.createFromHexString(userId), loggedAt: { $gte: day14 } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$loggedAt', timezone: 'Asia/Kolkata' },
        },
        avgIntensity: { $avg: '$intensity' },
        count:        { $sum: 1 },
        moods:        { $push: '$mood' },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: '$_id', avgIntensity: { $round: ['$avgIntensity', 1] }, count: 1, moods: 1, _id: 0 } },
  ]);

  // Fill 14-day gap
  const trend = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(day14);
    d.setDate(day14.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const found   = trendRaw.find(r => r.date === dateStr);
    trend.push(found ?? { date: dateStr, avgIntensity: null, count: 0, moods: [] });
  }

  // ── Summary stats ─────────────────────────────────────────────
  const totalEntries = await Mood.countDocuments({ user: userId });
  const lastEntry    = await Mood.findOne({ user: userId }).sort({ loggedAt: -1 }).lean();

  return {
    weekly,
    frequency: frequencyRaw,
    trend,
    summary: {
      totalEntries,
      lastMood: lastEntry ? { mood: lastEntry.mood, intensity: lastEntry.intensity, loggedAt: lastEntry.loggedAt } : null,
    },
  };
};
