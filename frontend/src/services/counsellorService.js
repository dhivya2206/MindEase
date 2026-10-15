/**
 * services/counsellorService.js
 * Frontend API calls for counsellor profile and appointment management — Part 15.
 */

import api from './api.js';

// ── Profile ───────────────────────────────────────────────────────────────────

/**
 * Fetch the authenticated counsellor's profile.
 * @returns {Promise<object|null>} profile or null if not yet created
 */
export const getMyProfile = async () => {
  const { data } = await api.get('/api/counsellors/me/profile');
  return data.data.profile;
};

/**
 * Create or fully replace the counsellor profile.
 * @param {object} profileData
 * @returns {Promise<object>} saved profile
 */
export const upsertProfile = async (profileData) => {
  const { data } = await api.put('/api/counsellors/me/profile', profileData);
  return data.data.profile;
};

/**
 * Partially update the counsellor profile.
 * @param {object} updates  Only the fields to change
 * @returns {Promise<object>} updated profile
 */
export const patchProfile = async (updates) => {
  const { data } = await api.patch('/api/counsellors/me/profile', updates);
  return data.data.profile;
};

// ── Appointments ──────────────────────────────────────────────────────────────

/**
 * Fetch all appointments for the authenticated counsellor.
 * @param {string} [status]  Optional filter: pending|accepted|rejected|cancelled|completed
 * @returns {Promise<object[]>} appointments
 */
export const getMyAppointments = async (status) => {
  const params = status ? { status } : {};
  const { data } = await api.get('/api/counsellors/me/appointments', { params });
  return data.data.appointments;
};

/**
 * Accept a pending appointment.
 * @param {string} id  Appointment ID
 * @returns {Promise<object>} updated appointment
 */
export const acceptAppointment = async (id) => {
  const { data } = await api.patch(`/api/counsellors/me/appointments/${id}/accept`);
  return data.data.appointment;
};

/**
 * Reject a pending appointment.
 * @param {string} id
 * @param {string} [reason]
 * @returns {Promise<object>} updated appointment
 */
export const rejectAppointment = async (id, reason = '') => {
  const { data } = await api.patch(`/api/counsellors/me/appointments/${id}/reject`, { reason });
  return data.data.appointment;
};

/**
 * Cancel a pending or accepted appointment.
 * @param {string} id
 * @param {string} [reason]
 * @returns {Promise<object>} updated appointment
 */
export const cancelAppointment = async (id, reason = '') => {
  const { data } = await api.patch(`/api/counsellors/me/appointments/${id}/cancel`, { reason });
  return data.data.appointment;
};

/**
 * Mark an accepted appointment as completed.
 * @param {string} id
 * @returns {Promise<object>} updated appointment
 */
export const completeAppointment = async (id) => {
  const { data } = await api.patch(`/api/counsellors/me/appointments/${id}/complete`);
  return data.data.appointment;
};
