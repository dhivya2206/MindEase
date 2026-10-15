/**
 * scripts/testChallengeEndpoints.js
 * End-to-end integration test for Wellness Challenges and Habit-Building APIs.
 */

import { User } from '../models/User.js';
import { Challenge } from '../models/Challenge.js';
import { UserChallenge } from '../models/UserChallenge.js';
import { UserBadge } from '../models/UserBadge.js';
import { Mood } from '../models/Mood.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';

const runTests = async () => {
  await connectDB();

  // Create or retrieve 2 test users to verify privacy & ownership isolation
  let userA = await User.findOne({ email: 'userA.challenges@mindease.test' });
  if (!userA) {
    userA = await User.create({
      name: 'User A Challenges',
      email: 'userA.challenges@mindease.test',
      password: 'Password123!',
      role: 'user',
      isVerified: true,
      isActive: true,
      points: 0,
    });
  }

  let userB = await User.findOne({ email: 'userB.challenges@mindease.test' });
  if (!userB) {
    userB = await User.create({
      name: 'User B Challenges',
      email: 'userB.challenges@mindease.test',
      password: 'Password123!',
      role: 'user',
      isVerified: true,
      isActive: true,
      points: 0,
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

  // Clean test records for User A & User B
  await UserChallenge.deleteMany({ user: { $in: [userA._id, userB._id] } });
  await UserBadge.deleteMany({ user: { $in: [userA._id, userB._id] } });
  await Mood.deleteMany({ user: { $in: [userA._id, userB._id] } });

  const baseUrl = `http://localhost:${env.PORT}`;
  console.log(`\n🧪 Testing Challenges APIs at ${baseUrl}...\n`);

  const request = async (path, options = {}) => {
    const url = `${baseUrl}${path}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const res = await fetch(url, { ...options, headers });
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    return { status: res.status, ok: res.ok, body };
  };

  try {
    // 1. Fetch catalog
    console.log('1. Testing GET /api/challenges/catalog');
    const catalogRes = await request('/api/challenges/catalog', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    console.log(`   Status: ${catalogRes.status}, Total challenges: ${catalogRes.body?.data?.challenges?.length}`);
    if (catalogRes.status !== 200 || !catalogRes.body?.data?.challenges?.length) {
      throw new Error(`Failed to load catalog: ${JSON.stringify(catalogRes.body)}`);
    }

    const challenges = catalogRes.body.data.challenges;
    const moodChallenge = challenges.find((c) => c.slug === 'three-day-mood-streak') || challenges[0];
    console.log(`   Selected challenge to test: "${moodChallenge.title}" (ID: ${moodChallenge._id})`);

    // 2. Fetch Dashboard Stats
    console.log('\n2. Testing GET /api/challenges/dashboard-stats');
    const statsRes = await request('/api/challenges/dashboard-stats', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    console.log(`   Status: ${statsRes.status}, Current Streak: ${statsRes.body?.data?.currentStreak}, Points: ${statsRes.body?.data?.userPoints}`);
    if (statsRes.status !== 200) {
      throw new Error(`Failed to get dashboard stats: ${JSON.stringify(statsRes.body)}`);
    }

    // 3. Join Challenge as User A
    console.log(`\n3. Testing POST /api/challenges/${moodChallenge._id}/join`);
    const joinRes = await request(`/api/challenges/${moodChallenge._id}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    console.log(`   Status: ${joinRes.status}, Message: ${joinRes.body?.message}`);
    if (joinRes.status !== 201) {
      throw new Error(`Failed to join challenge: ${JSON.stringify(joinRes.body)}`);
    }

    // 4. Prevent duplicate join
    console.log(`\n4. Testing duplicate enrollment prevention`);
    const dupJoinRes = await request(`/api/challenges/${moodChallenge._id}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    console.log(`   Status: ${dupJoinRes.status} (Expected 400), Message: ${dupJoinRes.body?.message}`);
    if (dupJoinRes.status !== 400) {
      throw new Error(`Expected 400 on duplicate join, got ${dupJoinRes.status}`);
    }

    // 5. User isolation: User B should not see User A's active challenge as their own
    console.log(`\n5. Testing User Isolation for User B`);
    const userBChallengesRes = await request('/api/challenges/my', {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const userBList = userBChallengesRes.body?.data?.myChallenges;
    console.log(`   Status: ${userBChallengesRes.status}, User B Active Count: ${userBList?.length}`);
    if (!Array.isArray(userBList) || userBList.length !== 0) {
      throw new Error('User B incorrectly sees User A active challenges or response format invalid');
    }

    // 6. Test task completion without verified activity
    console.log(`\n6. Testing verification requirement for mood challenge task Day 1`);
    const unverifiedTaskRes = await request(`/api/challenges/${moodChallenge._id}/tasks/1/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    console.log(`   Status: ${unverifiedTaskRes.status} (Expected 400 because no mood logged yet), Message: ${unverifiedTaskRes.body?.message}`);
    if (unverifiedTaskRes.status !== 400) {
      throw new Error(`Expected 400 unverified activity block, got ${unverifiedTaskRes.status}`);
    }

    // Now log a mood entry for userA so backend verification passes!
    console.log('   Creating verified Mood entry in DB for User A...');
    await Mood.create({
      user: userA._id,
      mood: 'calm',
      intensity: 4,
      note: 'Feeling good testing challenges',
    });

    // 7. Test task completion with verified activity
    console.log(`\n7. Testing task completion after mood logged`);
    const verifiedTaskRes = await request(`/api/challenges/${moodChallenge._id}/tasks/1/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    console.log(`   Status: ${verifiedTaskRes.status}, Message: ${verifiedTaskRes.body?.message}, Points Awarded: ${verifiedTaskRes.body?.data?.pointsAwarded}`);
    if (verifiedTaskRes.status !== 200) {
      throw new Error(`Failed to complete verified task: ${JSON.stringify(verifiedTaskRes.body)}`);
    }

    // 8. Test duplicate task completion prevention
    console.log(`\n8. Testing duplicate task completion prevention`);
    const dupTaskRes = await request(`/api/challenges/${moodChallenge._id}/tasks/1/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    console.log(`   Status: ${dupTaskRes.status} (Expected 400), Message: ${dupTaskRes.body?.message}`);
    if (dupTaskRes.status !== 400) {
      throw new Error(`Expected 400 on duplicate task completion, got ${dupTaskRes.status}`);
    }

    // 9. Verify Points and Badges
    console.log(`\n9. Testing User Points and Badge unlock`);
    const updatedUser = await User.findById(userA._id);
    const badges = await UserBadge.find({ user: userA._id });
    console.log(`   User A Points in DB: ${updatedUser.points}`);
    console.log(`   User A Badges in DB: ${badges.map((b) => b.badgeId).join(', ') || 'None'}`);
    if (updatedUser.points <= 0) {
      throw new Error(`User points were not awarded: ${updatedUser.points}`);
    }
    if (badges.length === 0) {
      throw new Error('Badge (e.g. first-step) was not awarded');
    }

    // 10. Test Leaving an active challenge
    console.log(`\n10. Testing POST /api/challenges/${moodChallenge._id}/leave`);
    const leaveRes = await request(`/api/challenges/${moodChallenge._id}/leave`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    console.log(`   Status: ${leaveRes.status}, Message: ${leaveRes.body?.message}`);
    if (leaveRes.status !== 200) {
      throw new Error(`Failed to leave challenge: ${JSON.stringify(leaveRes.body)}`);
    }

    const recheckMy = await request('/api/challenges/my', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const activeRemaining = recheckMy.body?.data?.myChallenges?.filter((c) => c.status === 'active');
    console.log(`   Active challenges remaining after leave: ${activeRemaining?.length}`);
    if (activeRemaining?.length !== 0) {
      throw new Error('Challenge was not successfully abandoned/left');
    }

    console.log('\n===========================================');
    console.log('🎉 ALL CHALLENGES INTEGRATION TESTS PASSED!');
    console.log('===========================================\n');
  } catch (err) {
    console.error('\n❌ Test failure:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

runTests();
