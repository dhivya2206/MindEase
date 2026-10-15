/**
 * scripts/testJournalEndpoints.js
 * End-to-end integration test for Personal Wellness Journal APIs.
 */

import { User } from '../models/User.js';
import { JournalEntry } from '../models/Journal.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';

const runTests = async () => {
  await connectDB();

  // Create or retrieve 2 test users to verify privacy & ownership isolation
  let userA = await User.findOne({ email: 'userA.journal@mindease.test' });
  if (!userA) {
    userA = await User.create({
      name: 'User A Journal',
      email: 'userA.journal@mindease.test',
      password: 'Password123!',
      role: 'user',
      isVerified: true,
      isActive: true,
    });
  }

  let userB = await User.findOne({ email: 'userB.journal@mindease.test' });
  if (!userB) {
    userB = await User.create({
      name: 'User B Journal',
      email: 'userB.journal@mindease.test',
      password: 'Password123!',
      role: 'user',
      isVerified: true,
      isActive: true,
    });
  }

  const generateToken = (u) =>
    jwt.sign(
      { sub: u._id.toString(), email: u.email, role: u.role },
      env.JWT_SECRET,
      { expiresIn: '1h', issuer: 'mindease-api', audience: 'mindease-client' }
    );

  const tokenA = generateToken(userA);
  const tokenB = generateToken(userB);

  // Clean existing test entries for User A and B
  await JournalEntry.deleteMany({ user: { $in: [userA._id, userB._id] } });

  const baseUrl = `http://localhost:${env.PORT}`;
  console.log(`\n🧪 Testing Journal APIs at ${baseUrl}...\n`);

  const request = async (path, options = {}) => {
    const url = `${baseUrl}${path}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const res = await fetch(url, { ...options, headers });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, data };
  };

  let passed = 0;
  let failed = 0;

  const assert = (desc, condition) => {
    if (condition) {
      console.log(`  ✔ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ✘ FAIL: ${desc}`);
      failed++;
    }
  };

  // Test 1: Unauthenticated request should be 401
  const t1 = await request('/api/journal');
  assert('GET /api/journal without token returns 401 Unauthorized', t1.status === 401);

  // Test 2: Create Entry with User A
  const t2 = await request('/api/journal', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      title: 'Navigating Midterm Exams and Stress',
      content: 'Felt overwhelmed in the morning, but taking a mindful walk helped reset my perspective.',
      mood: 'stressed',
      intensity: 7,
      tags: ['College', 'Stress'],
      gratitude: 'My roommate made me warm tea when I was studying late.',
      highlightOfTheDay: 'Finished the challenging operating systems lab before deadline!',
    }),
  });
  assert('POST /api/journal creates entry (201)', t2.status === 201 && t2.data?.data?.entry?.title === 'Navigating Midterm Exams and Stress');
  const entryAId = t2.data?.data?.entry?._id || t2.data?.data?.entry?.id;

  // Test 3: List Entries for User A
  const t3 = await request('/api/journal', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert('GET /api/journal returns User A entries', t3.status === 200 && t3.data?.data?.entries?.length === 1);

  // Test 4: Privacy Barrier — User B must NOT see User A's entries
  const t4 = await request('/api/journal', {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert('User B list does not leak User A entries (0 entries)', t4.status === 200 && t4.data?.data?.entries?.length === 0);

  // Test 5: Privacy Barrier — User B cannot fetch User A's entry by ID (404)
  const t5 = await request(`/api/journal/${entryAId}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert('User B cannot access User A entry by ID (404 Not Found)', t5.status === 404);

  // Test 6: User A can fetch their own entry by ID
  const t6 = await request(`/api/journal/${entryAId}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert('User A can fetch their own entry by ID (200)', t6.status === 200 && t6.data?.data?.entry?.title === 'Navigating Midterm Exams and Stress');

  // Test 7: Update entry by User A
  const t7 = await request(`/api/journal/${entryAId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      title: 'Navigating Midterm Exams — Resolved',
      mood: 'calm',
      intensity: 4,
    }),
  });
  assert('PUT /api/journal/:id updates entry', t7.status === 200 && t7.data?.data?.entry?.title === 'Navigating Midterm Exams — Resolved');

  // Test 8: Privacy Barrier — User B cannot edit User A's entry
  const t8 = await request(`/api/journal/${entryAId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({ title: 'Hacked Title' }),
  });
  assert('User B cannot edit User A entry (404 Not Found)', t8.status === 404);

  // Test 9: Search filter works
  const t9 = await request('/api/journal?search=Resolved', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert('Search filter finds matching title', t9.status === 200 && t9.data?.data?.entries?.length === 1);

  const t10 = await request('/api/journal?search=NonExistentTermXYZ', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert('Search filter returns empty when no match', t10.status === 200 && t10.data?.data?.entries?.length === 0);

  // Test 10: Journal stats & streak
  const t11 = await request('/api/journal/stats', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert('GET /api/journal/stats returns totalEntries, streak, calendarDates', t11.status === 200 && t11.data?.data?.totalEntries === 1 && typeof t11.data?.data?.currentStreak === 'number');

  // Test 11: Privacy Barrier — User B cannot delete User A's entry
  const t12 = await request(`/api/journal/${entryAId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert('User B cannot delete User A entry (404 Not Found)', t12.status === 404);

  // Test 12: User A deletes their entry
  const t13 = await request(`/api/journal/${entryAId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert('User A can delete their entry (200)', t13.status === 200);

  // Test 13: Entry is permanently deleted
  const t14 = await request(`/api/journal/${entryAId}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert('Deleted entry no longer exists (404)', t14.status === 404);

  console.log(`\n🎉 Journal Tests: ${passed} passed, ${failed} failed.\n`);
  process.exit(failed > 0 ? 1 : 0);
};

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
