/**
 * services/journeyService.js
 * Frontend client for "My Wellness Journey" analytics dashboard — Part 17.
 *
 * Integrates:
 *   - Real backend data from /api/journey/stats (CheckIns, Moods, Games, Chats, Appointments)
 *   - Client-side relaxation session history from localStorage ('mindease-relax-sessions')
 *   - Demo seed endpoint for testing with populated real data
 */

import api from './api';

const RELAX_STORAGE_KEY = 'mindease-relax-sessions';

/**
 * Reads and aggregates client-side relaxation sessions from localStorage
 * @param {number} daysCount
 */
export const getLocalRelaxationStats = (daysCount = 7) => {
  let sessions = [];
  try {
    sessions = JSON.parse(localStorage.getItem(RELAX_STORAGE_KEY) || '[]');
  } catch {
    sessions = [];
  }

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - (daysCount - 1));
  cutoff.setUTCHours(0, 0, 0, 0);

  const rangeSessions = sessions.filter(
    (s) => s.completedAt && new Date(s.completedAt) >= cutoff
  );

  const totalSecAllTime = sessions.reduce((acc, s) => acc + (s.durationSec || 0), 0);
  const totalSecRange = rangeSessions.reduce((acc, s) => acc + (s.durationSec || 0), 0);

  const typeMap = {};
  sessions.forEach((s) => {
    const t = s.type || 'meditation';
    typeMap[t] = (typeMap[t] || 0) + 1;
  });

  return {
    totalSessionsAllTime: sessions.length,
    totalMinutesAllTime: Math.round(totalSecAllTime / 60),
    rangeSessionsCount: rangeSessions.length,
    rangeMinutes: Math.round(totalSecRange / 60),
    typeBreakdown: typeMap,
    recentSessions: sessions.slice(0, 10),
  };
};

/**
 * Seed realistic local relaxation sessions if none exist
 */
export const seedLocalRelaxationSessions = () => {
  try {
    const existing = JSON.parse(localStorage.getItem(RELAX_STORAGE_KEY) || '[]');
    if (existing.length < 3) {
      const now = Date.now();
      const demo = [
        {
          id: `seed-1`,
          type: 'breathing',
          label: 'Box Breathing',
          durationSec: 300,
          completedAt: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
        },
        {
          id: `seed-2`,
          type: 'meditation',
          label: '5-Minute Mindfulness',
          durationSec: 300,
          completedAt: new Date(now - 1000 * 60 * 60 * 28).toISOString(),
        },
        {
          id: `seed-3`,
          type: 'focus',
          label: 'Focus Timer (Pomodoro)',
          durationSec: 1500,
          completedAt: new Date(now - 1000 * 60 * 60 * 52).toISOString(),
        },
        {
          id: `seed-4`,
          type: 'guided',
          label: 'Body Scan Meditation',
          durationSec: 420,
          completedAt: new Date(now - 1000 * 60 * 60 * 76).toISOString(),
        },
      ];
      localStorage.setItem(RELAX_STORAGE_KEY, JSON.stringify(demo));
    }
  } catch {}
};

/**
 * Fetch complete journey statistics for the selected timeframe ('week' | 'month')
 * @param {'week'|'month'} range
 */
export const getJourneyStats = async (range = 'week') => {
  const res = await api.get(`/api/journey/stats?range=${range}`);
  const payload = res.data?.data;

  const daysCount = range === 'month' ? 30 : 7;
  const relaxation = getLocalRelaxationStats(daysCount);

  // Merge relaxation stats into payload
  return {
    ...payload,
    relaxation,
  };
};

/**
 * Call backend to seed realistic data in the current user's database records
 */
export const seedJourneyData = async () => {
  seedLocalRelaxationSessions();
  const res = await api.post('/api/journey/seed');
  return res.data?.data;
};
