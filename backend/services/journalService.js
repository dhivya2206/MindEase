/**
 * services/journalService.js
 * Business logic for the Personal Wellness Journal module.
 *
 * Enforces strict per-user data isolation: all operations require
 * and verify the authenticated user ID.
 */

import { JournalEntry } from '../models/Journal.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Creates a new journal entry for the user.
 */
export const createEntry = async (userId, data) => {
  const entry = await JournalEntry.create({
    ...data,
    user: userId,
  });
  return entry;
};

/**
 * Lists journal entries with search, filters, sorting, and pagination.
 */
export const getEntries = async (userId, options = {}) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    mood = '',
    tag = '',
    startDate = '',
    endDate = '',
    sort = 'newest',
  } = options;

  // Strict ownership filter
  const filter = { user: userId };

  // Search by title or content
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ title: regex }, { content: regex }, { gratitude: regex }, { highlightOfTheDay: regex }];
  }

  // Filter by mood
  if (mood && mood !== 'all') {
    filter.mood = mood;
  }

  // Filter by tag
  if (tag && tag !== 'all') {
    filter.tags = tag;
  }

  // Filter by date range
  if (startDate || endDate) {
    filter.entryDate = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filter.entryDate.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.entryDate.$lte = end;
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const sortOrder = sort === 'oldest' ? { entryDate: 1, createdAt: 1 } : { entryDate: -1, createdAt: -1 };

  const [entries, total] = await Promise.all([
    JournalEntry.find(filter)
      .sort(sortOrder)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    JournalEntry.countDocuments(filter),
  ]);

  return {
    entries,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum) || 1,
    },
  };
};

/**
 * Retrieves a single journal entry ensuring ownership.
 */
export const getEntryById = async (userId, entryId) => {
  const entry = await JournalEntry.findOne({ _id: entryId, user: userId });
  if (!entry) {
    throw new AppError('Journal entry not found or access denied', 404);
  }
  return entry;
};

/**
 * Updates an existing journal entry ensuring ownership.
 */
export const updateEntry = async (userId, entryId, updateData) => {
  const entry = await JournalEntry.findOne({ _id: entryId, user: userId });
  if (!entry) {
    throw new AppError('Journal entry not found or access denied', 404);
  }

  Object.assign(entry, updateData);
  await entry.save();
  return entry;
};

/**
 * Deletes a journal entry ensuring ownership.
 */
export const deleteEntry = async (userId, entryId) => {
  const entry = await JournalEntry.findOneAndDelete({ _id: entryId, user: userId });
  if (!entry) {
    throw new AppError('Journal entry not found or access denied', 404);
  }
  return { id: entryId, title: entry.title };
};

/**
 * Calculates user journal dashboard stats:
 * - Total entries
 * - Entries written this week
 * - Current journaling streak from actual dates
 * - Calendar days with journal entries
 * - Recent entries
 */
export const getJournalStats = async (userId) => {
  const now = new Date();

  // Beginning of current week (Monday 00:00)
  const dayOfWeek = now.getDay(); // 0 is Sunday
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - distanceToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const [totalEntries, entriesThisWeek, allEntries, recentEntries] = await Promise.all([
    JournalEntry.countDocuments({ user: userId }),
    JournalEntry.countDocuments({
      user: userId,
      entryDate: { $gte: startOfWeek },
    }),
    JournalEntry.find({ user: userId })
      .select('entryDate createdAt mood intensity')
      .sort({ entryDate: -1, createdAt: -1 })
      .lean(),
    JournalEntry.find({ user: userId })
      .sort({ entryDate: -1, createdAt: -1 })
      .limit(3)
      .lean(),
  ]);

  // Extract distinct calendar days in 'YYYY-MM-DD'
  const dateSet = new Set();
  const dateEntriesCount = {};

  allEntries.forEach((e) => {
    const d = new Date(e.entryDate || e.createdAt);
    const dateStr = d.toISOString().split('T')[0];
    dateSet.add(dateStr);
    dateEntriesCount[dateStr] = (dateEntriesCount[dateStr] || 0) + 1;
  });

  const uniqueDatesDesc = Array.from(dateSet).sort().reverse();

  // Streak Calculation from actual consecutive dates
  let streak = 0;
  if (uniqueDatesDesc.length > 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Streak is active if user wrote today or yesterday
    const firstEntryDate = uniqueDatesDesc[0];
    let checkDate;

    if (firstEntryDate === todayStr) {
      streak = 1;
      checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (firstEntryDate === yesterdayStr) {
      streak = 1;
      checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - 2);
    } else {
      // Streak broken
      streak = 0;
    }

    if (streak > 0) {
      let idx = 1;
      while (idx < uniqueDatesDesc.length) {
        const expectedDateStr = checkDate.toISOString().split('T')[0];
        if (uniqueDatesDesc[idx] === expectedDateStr) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
          idx++;
        } else {
          break;
        }
      }
    }
  }

  // Mood breakdown for mini-insights
  const moodBreakdown = {};
  allEntries.forEach((e) => {
    if (e.mood) {
      moodBreakdown[e.mood] = (moodBreakdown[e.mood] || 0) + 1;
    }
  });

  return {
    totalEntries,
    entriesThisWeek,
    currentStreak: streak,
    calendarDates: uniqueDatesDesc,
    dateEntriesCount,
    recentEntries,
    moodBreakdown,
  };
};
