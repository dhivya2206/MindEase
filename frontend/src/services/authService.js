/**
 * services/authService.js
 * All API calls related to authentication.
 * Keeps axios logic out of context/components.
 */

import api from './api.js';

/** Register a new user */
export const register = async ({ name, email, password, confirmPassword }) => {
  const { data } = await api.post('/api/auth/register', { name, email, password, confirmPassword });
  return data.data; // { user, token }
};

/** Login with email + password */
export const login = async ({ email, password }) => {
  const { data } = await api.post('/api/auth/login', { email, password });
  return data.data; // { user, token }
};

/** Logout — clears server-side cookie, client handles token removal */
export const logout = async () => {
  await api.post('/api/auth/logout');
};

/** Fetch the currently authenticated user */
export const getMe = async () => {
  const { data } = await api.get('/api/auth/me');
  return data.data.user;
};
