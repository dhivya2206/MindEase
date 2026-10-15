/**
 * services/checkInService.js (frontend)
 * API wrappers for daily wellness check-in — Part 7.
 */

import api from './api.js';

const BASE = '/api/checkin';

/** Get today's check-in (null data if not submitted yet) */
export const getTodayCheckIn = async () => {
  const { data } = await api.get(`${BASE}/today`);
  return data.data.checkIn; // null | CheckIn object
};

/** Get wellness trend (last N days) */
export const getWellnessTrend = async (days = 14) => {
  const { data } = await api.get(`${BASE}/trend`, { params: { days } });
  return data.data; // { trend, latest, averageScore, totalCheckIns }
};

/** Get paginated history */
export const getCheckIns = async ({ page = 1, limit = 14 } = {}) => {
  const { data } = await api.get(BASE, { params: { page, limit } });
  return { entries: data.data.entries, meta: data.meta };
};

/** Submit today's check-in */
export const createCheckIn = async (dto) => {
  const { data } = await api.post(BASE, dto);
  return data.data.checkIn;
};

/** Update a check-in (score auto-recalculated server-side) */
export const updateCheckIn = async (id, dto) => {
  const { data } = await api.patch(`${BASE}/${id}`, dto);
  return data.data.checkIn;
};
