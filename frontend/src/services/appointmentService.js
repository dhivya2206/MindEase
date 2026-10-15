/**
 * services/appointmentService.js
 * Frontend client for browsing counsellors, booking, and managing appointments — Part 16.
 */

import api from './api.js';

/**
 * List all active counsellors for booking.
 * @param {{ specialization?: string }} [params]
 * @returns {Promise<object[]>} counsellors array
 */
export const browseCounsellors = async (params = {}) => {
  const { data } = await api.get('/api/counsellors', { params });
  return data.data.counsellors || [];
};

/**
 * Get details & availability of a single counsellor.
 * @param {string} id Counsellor ID or User ID
 * @returns {Promise<object>} counsellor object
 */
export const getCounsellorDetails = async (id) => {
  const { data } = await api.get(`/api/counsellors/${id}`);
  return data.data.counsellor;
};

/**
 * Book an appointment with a counsellor.
 * @param {{ counsellorId: string, scheduledAt: string, duration?: number, notes?: string }} payload
 * @returns {Promise<object>} created appointment
 */
export const bookAppointment = async ({ counsellorId, scheduledAt, duration = 60, notes = '' }) => {
  const { data } = await api.post('/api/appointments', {
    counsellorId,
    scheduledAt,
    duration,
    notes,
  });
  return data.data.appointment;
};

/**
 * Fetch the authenticated user's appointment records (upcoming and history).
 * @param {string} [status] Optional filter
 * @returns {Promise<object[]>} appointments array
 */
export const getMyAppointments = async (status) => {
  const params = status ? { status } : {};
  const { data } = await api.get('/api/appointments/my', { params });
  return data.data.appointments || [];
};

/**
 * Cancel an appointment booked by the user.
 * @param {string} id Appointment ID
 * @param {string} [reason] Cancellation reason
 * @returns {Promise<object>} updated appointment
 */
export const cancelAppointment = async (id, reason = '') => {
  const { data } = await api.patch(`/api/appointments/${id}/cancel`, { reason });
  return data.data.appointment;
};
