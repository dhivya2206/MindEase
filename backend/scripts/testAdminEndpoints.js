/**
 * scripts/testAdminEndpoints.js
 * End-to-end integration test for Part 19 Admin Dashboard APIs.
 */

import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';

const runTests = async () => {
  await connectDB();

  // Create or retrieve a test admin and a test regular user
  let admin = await User.findOne({ email: 'admin@mindease.test' });
  if (!admin) {
    admin = await User.create({
      name: 'Admin Chief',
      email: 'admin@mindease.test',
      password: 'Password123!',
      role: 'admin',
      isVerified: true,
      isActive: true,
    });
  }

  let regularUser = await User.findOne({ role: 'user' });
  if (!regularUser) {
    regularUser = await User.create({
      name: 'Test Regular User',
      email: 'testuser@mindease.test',
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

  const adminToken = generateToken(admin);
  const userToken = generateToken(regularUser);

  // Import server so it runs on env.PORT
  await import('../server.js');
  // Wait 1.5s for listen to establish
  await new Promise((r) => setTimeout(r, 1500));

  const baseUrl = `http://localhost:${env.PORT}`;
  console.log(`\n🧪 Testing Part 19 Admin APIs at ${baseUrl}...\n`);

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
  const t1 = await request('/api/admin/stats');
  assert('GET /api/admin/stats without token returns 401 Unauthorized', t1.status === 401);

  // Test 2: Standard user role request should be 403 Forbidden
  const t2 = await request('/api/admin/stats', {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert('GET /api/admin/stats with role:user returns 403 Forbidden', t2.status === 403);

  // Test 3: Admin role request succeeds with 200 and all 6 required counters
  const t3 = await request('/api/admin/stats', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('GET /api/admin/stats with role:admin returns 200 OK', t3.status === 200 && t3.data.success);
  const stats = t3.data?.data;
  assert('Stats has totalUsers', typeof stats?.totalUsers === 'number');
  assert('Stats has totalCounsellors', typeof stats?.totalCounsellors === 'number');
  assert('Stats has totalAppointments', typeof stats?.totalAppointments === 'number');
  assert('Stats has totalMoodEntries', typeof stats?.totalMoodEntries === 'number');
  assert('Stats has totalConversations', typeof stats?.totalConversations === 'number');
  assert('Stats has activeUsers', typeof stats?.activeUsers === 'number');

  // Test 4: Admin analytics
  const t4 = await request('/api/admin/analytics', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('GET /api/admin/analytics returns 200 with breakdown trends', t4.status === 200 && Array.isArray(t4.data?.data?.recentUserGrowth));

  // Test 5: Admin view users (sanitized)
  const t5 = await request('/api/admin/users', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('GET /api/admin/users returns 200 and paginated list', t5.status === 200 && Array.isArray(t5.data?.data?.users));
  const sampleUser = t5.data?.data?.users?.[0];
  assert('User data does not leak password', sampleUser && !sampleUser.password);

  // Test 6: Admin view counsellors
  const t6 = await request('/api/admin/counsellors', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('GET /api/admin/counsellors returns 200 and array', t6.status === 200 && Array.isArray(t6.data?.data?.counsellors));

  // Test 7: Admin view appointments
  const t7 = await request('/api/admin/appointments', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('GET /api/admin/appointments returns 200 and array', t7.status === 200 && Array.isArray(t7.data?.data?.appointments));

  // Test 8: Admin wellness activities CRUD
  const t8 = await request('/api/admin/activities', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('GET /api/admin/activities returns 200 and array', t8.status === 200 && Array.isArray(t8.data?.data?.activities));

  // Create an activity
  const t9 = await request('/api/admin/activities', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: 'Mindful Morning Sunshine Meditation',
      description: 'Spend 10 minutes sitting under gentle morning sunlight with rhythmic breath.',
      category: 'Meditation',
      duration: '10 min',
      difficulty: 'beginner',
      icon: '☀️',
      color: '#f59e0b',
      tags: ['sunlight', 'morning', 'energy'],
      instructions: ['Sit near a window or outdoors.', 'Feel the warmth on your face.'],
      isActive: true,
    }),
  });
  assert('POST /api/admin/activities creates new activity (201)', t9.status === 201 && t9.data?.data?.activity?.title === 'Mindful Morning Sunshine Meditation');
  const createdActId = t9.data?.data?.activity?._id || t9.data?.data?.activity?.id;

  // Toggle activity
  const t10 = await request(`/api/admin/activities/${createdActId}/toggle`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('PATCH /api/admin/activities/:id/toggle toggles status', t10.status === 200 && t10.data?.data?.activity?.isActive === false);

  // Delete activity
  const t11 = await request(`/api/admin/activities/${createdActId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('DELETE /api/admin/activities/:id deletes activity', t11.status === 200);

  // Self-protection: Admin cannot demote or delete self
  const t12 = await request(`/api/admin/users/${admin._id}/role`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ role: 'user' }),
  });
  assert('Admin cannot demote own account (400)', t12.status === 400);

  const t13 = await request(`/api/admin/users/${admin._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('Admin cannot delete own account (400)', t13.status === 400);

  console.log(`\n🎉 Results: ${passed} passed, ${failed} failed.\n`);
  process.exit(failed > 0 ? 1 : 0);
};

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
