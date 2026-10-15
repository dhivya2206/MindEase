/**
 * config/db.js
 * Mongoose connection manager — Part 2 (MongoDB Foundation).
 *
 * Responsibilities:
 *   - Connect to MongoDB using MONGO_URI from env
 *   - Expose real-time connection state via getConnectionState()
 *   - Log all Mongoose lifecycle events
 *   - Handle reconnection gracefully (Mongoose does this automatically,
 *     but we surface it in logs)
 *   - Perform a lightweight ping to confirm round-trip on startup
 *   - Register SIGINT / SIGTERM shutdown handlers
 */

import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// ── Mongoose global settings ──────────────────────────────────────────────────
// Throw on unknown model fields — prevents silent data corruption
mongoose.set('strictQuery', true);

// ── Connection options ────────────────────────────────────────────────────────
const CONNECT_OPTIONS = {
  // How long the driver waits to find an available server (ms)
  serverSelectionTimeoutMS: 5000,
  // How long to wait before timing out a socket (ms)
  socketTimeoutMS: 45000,
  // Max size of the connection pool
  maxPoolSize: 10,
  // Min size of the connection pool — keeps connections warm
  minPoolSize: 2,
  // Keep-alive to prevent firewalls from closing idle connections
  heartbeatFrequencyMS: 10000,
};

// ── Mongoose connection state map (matches readyState numbers) ────────────────
const STATE_NAMES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
  99: 'uninitialized',
};

/**
 * Returns the current Mongoose connection state as a plain object.
 * Safe to call at any time — never throws.
 */
export const getConnectionState = () => {
  const conn = mongoose.connection;
  const readyState = conn.readyState ?? 99;
  return {
    readyState,
    stateName: STATE_NAMES[readyState] ?? 'unknown',
    host: conn.host ?? null,
    port: conn.port ?? null,
    name: conn.name ?? null,
    isConnected: readyState === 1,
  };
};

// ── Lifecycle event listeners ─────────────────────────────────────────────────
const registerMongooseEvents = () => {
  const conn = mongoose.connection;

  conn.on('connected', () => {
    const { host, port, name } = getConnectionState();
    logger.info(`[DB] ✅ Connected  →  ${host}:${port}/${name}`);
  });

  conn.on('disconnected', () => {
    logger.warn('[DB] ⚠️  Disconnected from MongoDB');
  });

  conn.on('reconnected', () => {
    logger.info('[DB] 🔄 Reconnected to MongoDB');
  });

  conn.on('error', (err) => {
    logger.error(`[DB] ❌ Connection error: ${err.message}`);
  });

  conn.on('close', () => {
    logger.info('[DB] Connection closed');
  });
};

// ── Ping helper ───────────────────────────────────────────────────────────────
/**
 * Sends a lightweight admin ping command to MongoDB.
 * Returns the round-trip latency in milliseconds.
 * @returns {Promise<number>} latency in ms
 */
export const pingDB = async () => {
  const start = Date.now();
  await mongoose.connection.db.admin().ping();
  return Date.now() - start;
};

// ── Main connect function ─────────────────────────────────────────────────────
/**
 * Connects to MongoDB. Called once at server startup.
 * Exits the process on unrecoverable connection failure.
 */
export const connectDB = async () => {
  // Avoid duplicate connections (e.g., in hot-reload dev environments)
  if (mongoose.connection.readyState === 1) {
    logger.debug('[DB] Already connected — skipping reconnect');
    return;
  }

  registerMongooseEvents();

  const redactedUri = env.MONGO_URI.replace(
    /\/\/([^:]+):([^@]+)@/,
    '//***:***@'
  );
  logger.info(`[DB] Connecting to MongoDB → ${redactedUri}`);

  try {
    await mongoose.connect(env.MONGO_URI, CONNECT_OPTIONS);

    // Confirm round-trip with an admin ping
    const latencyMs = await pingDB();
    logger.info(`[DB] Ping successful — round-trip: ${latencyMs}ms`);
  } catch (err) {
    logger.error(`[DB] Failed to connect: ${err.message}`);
    logger.error('[DB] Shutting down — cannot start without database');
    process.exit(1);
  }
};

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  logger.info(`[DB] ${signal} received — closing MongoDB connection`);
  try {
    await mongoose.connection.close(false); // false = don't force
    logger.info('[DB] Connection closed cleanly');
  } catch (err) {
    logger.error(`[DB] Error during shutdown: ${err.message}`);
  }
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
