/**
 * server.js
 * MindEase Express application entry point — Part 9 update: serves frontend build.
 */

import 'express-async-errors'; // Must be first import
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIST = join(__dirname, '..', 'frontend', 'dist');

import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';
import apiRoutes from './routes/index.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({
  // Disable CSP so Vite-built assets (hashed JS/CSS) load correctly
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

// Auth-specific rate limiter — tighter limit on login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isDev ? 100 : 20, // relaxed in dev to avoid blocking test scripts
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// General rate limiter (200 req/15 min — relaxed to support AI chat back-and-forth)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
  })
);

// Apply stricter limiter to auth endpoints
app.use('/api/auth', authLimiter);

// ── Parsing ───────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser()); // needed for logout cookie clearing & future refresh tokens

// ── Logging ───────────────────────────────────────────────────────────────────
if (env.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);
app.use('/chat/conversations', chatRoutes); // Direct route alias
app.use('/notifications', notificationRoutes); // Direct route alias

// ── Serve React frontend (production / single-URL mode) ──────────────────────
if (existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  // Catch-all: React Router handles the rest
  app.get('*', (_req, res) => res.sendFile(join(FRONTEND_DIST, 'index.html')));
} else {
  // ── 404 + Error Handlers (dev mode, no build yet) ─────────────────────────
  app.use(notFound);
}

// ── Error Handler (always last) ───────────────────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  app.listen(env.PORT, () => {
    logger.info(`🧠 MindEase API running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });
};

startServer();

export default app;
