/**
 * services/journalService.js
 * Frontend API client for Personal Wellness Journal.
 */

import api from './api';

/**
 * Creates a new journal entry
 */
export const createEntry = async (data) => {
  const response = await api.post('/api/journal', data);
  return response.data?.data?.entry;
};

/**
 * Lists user's journal entries with search, filters, sorting, and pagination
 */
export const getEntries = async (params = {}) => {
  const response = await api.get('/api/journal', { params });
  return response.data?.data;
};

/**
 * Retrieves dashboard stats (total entries, week count, streak, calendar dates)
 */
export const getJournalStats = async () => {
  const response = await api.get('/api/journal/stats');
  return response.data?.data;
};

/**
 * Retrieves a single entry by ID
 */
export const getEntryById = async (id) => {
  const response = await api.get(`/api/journal/${id}`);
  return response.data?.data?.entry;
};

/**
 * Updates an existing entry
 */
export const updateEntry = async (id, data) => {
  const response = await api.put(`/api/journal/${id}`, data);
  return response.data?.data?.entry;
};

/**
 * Deletes an entry
 */
export const deleteEntry = async (id) => {
  const response = await api.delete(`/api/journal/${id}`);
  return response.data?.data;
};
