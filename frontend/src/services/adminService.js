/**
 * services/adminService.js
 * Frontend API client for administrative operations — Part 19.
 *
 * All endpoints require ADMIN authentication.
 */

import api from './api';

/**
 * Fetch platform stats overview
 */
export const getStats = async () => {
  const response = await api.get('/api/admin/stats');
  return response.data?.data;
};

/**
 * Fetch analytics data for charts and trends
 */
export const getAnalytics = async () => {
  const response = await api.get('/api/admin/analytics');
  return response.data?.data;
};

/**
 * List users with pagination and search
 */
export const getUsers = async (params = {}) => {
  const response = await api.get('/api/admin/users', { params });
  return response.data?.data;
};

/**
 * Update user role ('user', 'counsellor', 'admin')
 */
export const updateUserRole = async (userId, role) => {
  const response = await api.patch(`/api/admin/users/${userId}/role`, { role });
  return response.data?.data?.user;
};

/**
 * Activate or deactivate user account
 */
export const updateUserStatus = async (userId, isActive) => {
  const response = await api.patch(`/api/admin/users/${userId}/status`, { isActive });
  return response.data?.data?.user;
};

/**
 * Toggle user verification
 */
export const updateUserVerification = async (userId, isVerified) => {
  const response = await api.patch(`/api/admin/users/${userId}/verify`, { isVerified });
  return response.data?.data?.user;
};

/**
 * Permanently remove user account
 */
export const deleteUser = async (userId) => {
  const response = await api.delete(`/api/admin/users/${userId}`);
  return response.data?.data;
};

/**
 * List counsellors
 */
export const getCounsellors = async (params = {}) => {
  const response = await api.get('/api/admin/counsellors', { params });
  return response.data?.data?.counsellors || [];
};

/**
 * Update counsellor active/visibility status
 */
export const updateCounsellorStatus = async (counsellorId, isActive) => {
  const response = await api.patch(`/api/admin/counsellors/${counsellorId}/status`, { isActive });
  return response.data?.data?.counsellor;
};

/**
 * Update counsellor profile details
 */
export const updateCounsellorProfile = async (counsellorId, data) => {
  const response = await api.patch(`/api/admin/counsellors/${counsellorId}`, data);
  return response.data?.data?.counsellor;
};

/**
 * Delete counsellor profile
 */
export const deleteCounsellor = async (counsellorId) => {
  const response = await api.delete(`/api/admin/counsellors/${counsellorId}`);
  return response.data?.data;
};

/**
 * List platform appointments
 */
export const getAppointments = async (params = {}) => {
  const response = await api.get('/api/admin/appointments', { params });
  return response.data?.data;
};

/**
 * Update appointment status
 */
export const updateAppointmentStatus = async (appointmentId, status, reason = '') => {
  const response = await api.patch(`/api/admin/appointments/${appointmentId}/status`, { status, reason });
  return response.data?.data?.appointment;
};

/**
 * List wellness activities
 */
export const getWellnessActivities = async (params = {}) => {
  const response = await api.get('/api/admin/activities', { params });
  return response.data?.data?.activities || [];
};

/**
 * Create a new wellness activity
 */
export const createWellnessActivity = async (data) => {
  const response = await api.post('/api/admin/activities', data);
  return response.data?.data?.activity;
};

/**
 * Update an existing wellness activity
 */
export const updateWellnessActivity = async (activityId, data) => {
  const response = await api.patch(`/api/admin/activities/${activityId}`, data);
  return response.data?.data?.activity;
};

/**
 * Delete a wellness activity
 */
export const deleteWellnessActivity = async (activityId) => {
  const response = await api.delete(`/api/admin/activities/${activityId}`);
  return response.data?.data;
};

/**
 * Toggle active state of a wellness activity
 */
export const toggleWellnessActivity = async (activityId) => {
  const response = await api.patch(`/api/admin/activities/${activityId}/toggle`);
  return response.data?.data?.activity;
};
