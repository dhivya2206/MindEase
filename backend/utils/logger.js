/**
 * utils/logger.js
 * Lightweight console logger with log levels and timestamps.
 */

import { env } from '../config/env.js';

const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const COLORS = {
  error: '\x1b[31m', // red
  warn: '\x1b[33m',  // yellow
  info: '\x1b[36m',  // cyan
  debug: '\x1b[90m', // grey
  reset: '\x1b[0m',
};

const timestamp = () => new Date().toISOString();

const log = (level, ...args) => {
  const currentLevel = env.isDev ? LEVELS.debug : LEVELS.info;
  if (LEVELS[level] > currentLevel) return;

  const color = COLORS[level];
  const reset = COLORS.reset;
  const prefix = `${color}[${timestamp()}] [${level.toUpperCase()}]${reset}`;
  console[level === 'debug' ? 'log' : level](prefix, ...args);
};

export const logger = {
  error: (...args) => log('error', ...args),
  warn: (...args) => log('warn', ...args),
  info: (...args) => log('info', ...args),
  debug: (...args) => log('debug', ...args),
};
