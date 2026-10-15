/**
 * services/moodService.js (frontend)
 * All API calls related to mood tracking — Part 6.
 */

import api from './api.js';

const BASE = '/api/mood';

/** Log a new mood entry */
export const createMood = async ({ mood, intensity, note, loggedAt }) => {
  const { data } = await api.post(BASE, { mood, intensity, note, loggedAt });
  return data.data.entry;
};

/** Get paginated mood history with optional filters */
export const getMoods = async ({ page = 1, limit = 20, mood, from, to, sort = 'desc' } = {}) => {
  const params = { page, limit, sort };
  if (mood) params.mood = mood;
  if (from) params.from = from;
  if (to)   params.to   = to;
  const { data } = await api.get(BASE, { params });
  return { entries: data.data.entries, meta: data.meta };
};

/** Get dashboard chart data */
export const getMoodStats = async () => {
  const { data } = await api.get(`${BASE}/stats`);
  return data.data; // { weekly, frequency, trend, summary }
};

/** Get a single entry */
export const getMoodById = async (id) => {
  const { data } = await api.get(`${BASE}/${id}`);
  return data.data.entry;
};

/** Update a mood entry */
export const updateMood = async (id, dto) => {
  const { data } = await api.patch(`${BASE}/${id}`, dto);
  return data.data.entry;
};

/** Delete a mood entry */
export const deleteMood = async (id) => {
  const { data } = await api.delete(`${BASE}/${id}`);
  return data.data;
};

/**
 * Analyse free text for emotion (Part 10).
 * @param {string} text - User sentence describing how they feel
 * @param {boolean} saveMood - If true, also persists the detected mood to DB
 * @returns {Promise<{ analysis, savedEntry }>}
 */
export const analyzeText = async (text, saveMood = false) => {
  const { data } = await api.post(`${BASE}/analyze-text`, { text, saveMood });
  return data.data; // { analysis: { emotion, confidence, intensity, reasoning, wellness }, savedEntry }
};

/**
 * Save a facial emotion result to the mood log (Part 11).
 * NOTE: Only the detected emotion label and confidence are sent.
 *       No image data or camera frames are ever transmitted.
 *
 * @param {{ mood, intensity, confidence }} dto
 * @returns {Promise<object>} saved mood entry
 */
export const saveFacialMood = async ({ mood, intensity, confidence }) => {
  const { data } = await api.post(BASE, {
    mood,
    intensity,
    source: 'FACIAL',
    analysisConfidence: confidence,
    note: `Facial emotion estimation — ${Math.round(confidence * 100)}% confidence`,
  });
  return data.data.entry;
};


