/**
 * scripts/testConnection.js
 * Standalone MongoDB connection tester.
 *
 * Run with:
 *   node scripts/testConnection.js
 *
 * This script does NOT start the Express server.
 * It connects to MongoDB, runs a series of diagnostic checks,
 * prints a summary table, then exits cleanly.
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — connection or ping failed
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env.js';

// ── Colour helpers ─────────────────────────────────────────────────────────────
const C = {
  green:  (s) => `\x1b[32m${s}\x1b[0m`,
  red:    (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan:   (s) => `\x1b[36m${s}\x1b[0m`,
  bold:   (s) => `\x1b[1m${s}\x1b[0m`,
  dim:    (s) => `\x1b[2m${s}\x1b[0m`,
};

const PASS = C.green('✔ PASS');
const FAIL = C.red('✘ FAIL');

const log  = (...a) => console.log(...a);
const sep  = () => log(C.dim('─'.repeat(55)));

// ── Test runner ────────────────────────────────────────────────────────────────
const results = [];

const check = (label, value, pass) => {
  const icon = pass ? PASS : FAIL;
  log(`  ${icon}  ${label.padEnd(30)} ${C.cyan(String(value ?? '—'))}`);
  results.push(pass);
};

// ── Main ───────────────────────────────────────────────────────────────────────
const run = async () => {
  log('');
  log(C.bold('🧠 MindEase — MongoDB Connection Test'));
  sep();

  // Redact credentials from the URI before printing
  const displayUri = env.MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  log(`  ${C.dim('URI:')} ${displayUri}`);
  log(`  ${C.dim('ENV:')} ${env.NODE_ENV}`);
  sep();

  // ── Step 1: Connect ──────────────────────────────────────────────────────────
  log(C.bold('  Step 1: Connecting…'));
  let connected = false;
  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    connected = true;
  } catch (err) {
    log(C.red(`  ✘ Connection failed: ${err.message}`));
    sep();
    log(C.red('  All checks aborted — cannot reach MongoDB'));
    log(C.yellow('  Make sure MongoDB is running and MONGO_URI is correct'));
    log('');
    process.exit(1);
  }

  const conn = mongoose.connection;

  // ── Step 2: State checks ─────────────────────────────────────────────────────
  sep();
  log(C.bold('  Step 2: Connection State'));
  check('readyState === 1 (connected)', conn.readyState, conn.readyState === 1);
  check('host', conn.host, Boolean(conn.host));
  check('port', conn.port, conn.port > 0);
  check('database name', conn.name, Boolean(conn.name));

  // ── Step 3: Admin ping ───────────────────────────────────────────────────────
  sep();
  log(C.bold('  Step 3: Admin Ping'));
  let pingLatency = null;
  try {
    const t0 = Date.now();
    await conn.db.admin().ping();
    pingLatency = Date.now() - t0;
    check('Admin ping succeeded', `${pingLatency}ms`, true);
    check('Latency < 500ms', `${pingLatency}ms`, pingLatency < 500);
  } catch (err) {
    check('Admin ping succeeded', 'error: ' + err.message, false);
  }

  // ── Step 4: Server info ──────────────────────────────────────────────────────
  sep();
  log(C.bold('  Step 4: Server Info'));
  try {
    const info = await conn.db.admin().serverInfo();
    check('MongoDB version', info.version, Boolean(info.version));
    check('Server edition', info.modules?.[0] ?? 'community', true);
  } catch {
    check('Server info', 'unavailable', false);
  }

  // ── Step 5: List databases ───────────────────────────────────────────────────
  sep();
  log(C.bold('  Step 5: Permissions Check'));
  try {
    const { databases } = await conn.db.admin().listDatabases({ nameOnly: true });
    const dbNames = databases.map((d) => d.name).join(', ');
    check('listDatabases permission', dbNames, true);
  } catch {
    // Atlas free tier may restrict this — it's a soft check
    check('listDatabases permission', 'restricted (Atlas free tier?)', false);
  }

  // ── Step 6: Write round-trip ─────────────────────────────────────────────────
  sep();
  log(C.bold('  Step 6: Write/Read Round-Trip'));
  const testColName = '_mindease_connection_test';
  try {
    const testCol = conn.db.collection(testColName);
    const doc = { _id: new mongoose.Types.ObjectId(), ts: new Date(), test: true };
    await testCol.insertOne(doc);
    const found = await testCol.findOne({ _id: doc._id });
    check('Insert document', doc._id.toString(), Boolean(found));
    check('Read document back', found?.test, found?.test === true);
    await testCol.drop();
    check('Drop test collection', testColName, true);
  } catch (err) {
    check('Write round-trip', 'error: ' + err.message, false);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  sep();
  const passed = results.filter(Boolean).length;
  const total  = results.length;
  const allOk  = passed === total;

  log(
    allOk
      ? C.green(C.bold(`  ✔ All ${total} checks passed`))
      : C.yellow(C.bold(`  ⚠  ${passed}/${total} checks passed`))
  );
  sep();
  log('');

  await mongoose.connection.close();
  process.exit(allOk ? 0 : 1);
};

run().catch((err) => {
  console.error(C.red('Unexpected error:'), err.message);
  process.exit(1);
});
