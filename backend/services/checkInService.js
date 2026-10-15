/**
 * services/checkInService.js
 * Business logic for daily wellness check-ins — Part 7.
 */

import mongoose from 'mongoose';
import { CheckIn, calculateWellnessScore, scoreBreakdown, todayUTC, toDateKey } from '../models/CheckIn.js';
import { AppError } from '../middleware/errorHandler.js';
import { createNotification } from './notificationService.js';

// ── Helpers ───────────────────────────────────────────────────

/** Returns a Date object for midnight UTC of a given YYYY-MM-DD string */
const toMidnightUTC = (dateStr) => new Date(`${dateStr}T00:00:00.000Z`);

/** Returns today's midnight UTC date */
const todayMidnight = () => toMidnightUTC(todayUTC());

// ── CRUD ──────────────────────────────────────────────────────

/**
 * Submit today's check-in (or for a specified date).
 * Throws 409 if a check-in already exists for that day.
 */
export const createCheckIn = async (userId, dto) => {
  const dateKey = dto.date ? toDateKey(dto.date) : todayUTC();
  const date    = toMidnightUTC(dateKey);

  // Enforce one-per-day
  const existing = await CheckIn.findOne({ user: userId, date });
  if (existing) {
    throw new AppError(
      `You have already submitted a check-in for ${dateKey}. You can edit it instead.`,
      409
    );
  }

  const checkIn = await CheckIn.create({ user: userId, date, ...dto });

  // In-app notification for daily check-in completion & streak
  createNotification({
    userId,
    title: 'Daily Check-in Complete! 🔥',
    message: `You earned a wellness score of ${checkIn.wellnessScore}/100 today. Keep up your healthy streak!`,
    type: 'STREAK',
    icon: '🔥',
    link: '/dashboard/user/journey',
  }).catch(() => {});

  return checkIn.toJSON();
};

/**
 * Get today's check-in for a user (null if not submitted yet).
 */
export const getTodayCheckIn = async (userId) => {
  const entry = await CheckIn.findOne({ user: userId, date: todayMidnight() });
  return entry ? entry.toJSON() : null;
};

/**
 * Get paginated check-in history for a user.
 */
export const getCheckIns = async (userId, { limit = 14, page = 1 } = {}) => {
  const skip = (page - 1) * limit;
  const [entries, total] = await Promise.all([
    CheckIn.find({ user: userId }).sort({ date: -1 }).skip(skip).limit(limit).lean(),
    CheckIn.countDocuments({ user: userId }),
  ]);

  const formatted = entries.map(e => ({
    ...e,
    id: e._id.toString(),
    _id: undefined,
    dateKey: toDateKey(e.date),
  }));

  return { entries: formatted, total, page, pages: Math.ceil(total / limit) };
};

/**
 * Get a single check-in by ID (must belong to user).
 */
export const getCheckInById = async (id, userId) => {
  const entry = await CheckIn.findOne({ _id: id, user: userId });
  if (!entry) throw new AppError('Check-in not found', 404);
  return entry.toJSON();
};

/**
 * Update a check-in (only allowed if it belongs to the user).
 * Recalculates wellness score automatically via model pre-save.
 */
export const updateCheckIn = async (id, userId, dto) => {
  const entry = await CheckIn.findOne({ _id: id, user: userId });
  if (!entry) throw new AppError('Check-in not found', 404);

  Object.assign(entry, dto);
  await entry.save(); // triggers pre-save score recalculation
  return entry.toJSON();
};

// ── Analytics ─────────────────────────────────────────────────

/**
 * Get wellness trend: last N days of check-in scores.
 * Fills missing days with null so charts render correctly.
 *
 * @param {string} userId
 * @param {number} days  — how many days back (default 14)
 */
export const getWellnessTrend = async (userId, days = 14) => {
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - (days - 1));
  from.setUTCHours(0, 0, 0, 0);

  const entries = await CheckIn.find({
    user: userId,
    date: { $gte: from },
  })
    .sort({ date: 1 })
    .lean();

  // Build a map keyed by YYYY-MM-DD
  const byDate = {};
  for (const e of entries) {
    byDate[toDateKey(e.date)] = e;
  }

  // Fill all days
  const trend = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setUTCDate(from.getUTCDate() + i);
    const dateKey = toDateKey(d);
    const e = byDate[dateKey];
    trend.push(
      e
        ? {
            dateKey,
            wellnessScore:  e.wellnessScore,
            sleep:      e.sleep,
            energy:     e.energy,
            stress:     e.stress,
            positivity: e.positivity,
            focus:      e.focus,
            id: e._id.toString(),
          }
        : { dateKey, wellnessScore: null }
    );
  }

  // Latest check-in summary
  const latest = entries.length ? entries[entries.length - 1] : null;
  const averageScore = entries.length
    ? Math.round(entries.reduce((s, e) => s + e.wellnessScore, 0) / entries.length)
    : null;

  return {
    trend,
    latest: latest
      ? {
          id: latest._id.toString(),
          dateKey: toDateKey(latest.date),
          wellnessScore: latest.wellnessScore,
          sleep:      latest.sleep,
          energy:     latest.energy,
          stress:     latest.stress,
          positivity: latest.positivity,
          focus:      latest.focus,
          note: latest.note,
          breakdown: scoreBreakdown(latest),
        }
      : null,
    averageScore,
    totalCheckIns: entries.length,
  };
};
