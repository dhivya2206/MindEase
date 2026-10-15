/**
 * services/api.js
 * Axios instance pre-configured for MindEase backend.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // send cookies for refresh tokens (Part 2+)
});

// ── Request interceptor: attach JWT ──────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mindease-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: normalise errors ───────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'An unexpected error occurred';

    // 401: clear token (Part 2 will add refresh logic)
    if (error?.response?.status === 401) {
      localStorage.removeItem('mindease-token');
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
