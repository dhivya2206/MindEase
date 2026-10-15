/**
 * config/env.js
 * Centralised access to all environment variables.
 * Import this module instead of calling process.env directly.
 */

import 'dotenv/config';

const getEnv = (key, fallback) => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  // Server
  PORT: parseInt(getEnv('PORT', '5000'), 10),
  NODE_ENV: getEnv('NODE_ENV', 'development'),

  // Database
  MONGO_URI: getEnv('MONGO_URI', 'mongodb://127.0.0.1:27017/mindease'),

  // JWT
  JWT_SECRET: getEnv('JWT_SECRET', 'dev_secret_change_in_production'),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '7d'),

  // CORS
  CLIENT_ORIGIN: getEnv('CLIENT_ORIGIN', 'http://localhost:5173'),

  // AI (Gemini) — optional; 503 returned gracefully if not set
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? '',

  // Helpers
  get isDev() {
    return this.NODE_ENV === 'development';
  },
  get isProd() {
    return this.NODE_ENV === 'production';
  },
};
