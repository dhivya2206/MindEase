/**
 * utils/dbStatus.js
 * Builds a rich, safe-to-expose status object about the MongoDB connection.
 *
 * Used by both /api/health and /api/db-health endpoints.
 * Never includes credentials or the raw URI.
 */

import mongoose from 'mongoose';
import { getConnectionState, pingDB } from '../config/db.js';

/**
 * Returns a lightweight snapshot (no async I/O).
 * Safe to call from any route handler without latency overhead.
 */
export const getDBSnapshot = () => {
  const state = getConnectionState();
  return {
    status: state.isConnected ? 'connected' : 'disconnected',
    state: state.stateName,
    host: state.host,
    database: state.name,
    models: mongoose.modelNames(), // which Mongoose models are registered
  };
};

/**
 * Returns a full diagnostic object including a live ping.
 * Costs one round-trip to MongoDB — use only on the /db-health endpoint.
 *
 * @returns {Promise<{ connected: boolean, latencyMs: number|null, details: object, error?: string }>}
 */
export const getDBDiagnostics = async () => {
  const state = getConnectionState();

  if (!state.isConnected) {
    return {
      connected: false,
      latencyMs: null,
      details: {
        status: 'disconnected',
        state: state.stateName,
        host: null,
        database: null,
        models: [],
      },
    };
  }

  try {
    const latencyMs = await pingDB();

    // Mongoose driver exposes server description through the internal topology
    const topology = mongoose.connection.client?.topology;
    const serverDescriptions = topology
      ? [...(topology.description?.servers?.values() ?? [])]
      : [];

    const serverInfo = serverDescriptions.map((s) => ({
      address: s.address,
      type: s.type,         // e.g. 'RSPrimary', 'Standalone'
      roundTripTime: s.roundTripTime != null
        ? `${Math.round(s.roundTripTime)}ms`
        : null,
    }));

    return {
      connected: true,
      latencyMs,
      details: {
        status: 'connected',
        state: state.stateName,
        host: state.host,
        port: state.port,
        database: state.name,
        models: mongoose.modelNames(),
        servers: serverInfo,
        poolSize: {
          max: mongoose.connection.client?.options?.maxPoolSize ?? null,
          min: mongoose.connection.client?.options?.minPoolSize ?? null,
        },
      },
    };
  } catch (err) {
    return {
      connected: false,
      latencyMs: null,
      error: err.message,
      details: {
        status: 'error',
        state: state.stateName,
        host: state.host,
        database: state.name,
        models: [],
      },
    };
  }
};
