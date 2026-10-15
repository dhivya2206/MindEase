/**
 * services/adminService.js
 * Core administrative business logic — Part 19.
 *
 * Implements platform statistics, user management, counsellor management,
 * appointment oversight, wellness activities CRUD, and analytics.
 * Strictly avoids exposing sensitive user data (passwords, tokens, private chat details).
 */

import { User } from '../models/User.js';
import { Counsellor } from '../models/Counsellor.js';
import { Appointment } from '../models/Appointment.js';
import { Mood } from '../models/Mood.js';
import { Conversation } from '../models/Conversation.js';
import { CheckIn } from '../models/CheckIn.js';
import { WellnessActivity } from '../models/WellnessActivity.js';
import { AppError } from '../middleware/errorHandler.js';

// Default initial activities to seed if collection is empty
const DEFAULT_ACTIVITIES = [
  {
    title: '4-7-8 Deep Relaxation Breath',
    description: 'Inhale for 4 seconds, hold for 7 seconds, exhale slowly for 8 seconds. Rapid parasympathetic calming.',
    category: 'Breathing',
    duration: '5 min',
    difficulty: 'beginner',
    icon: '🫁',
    color: '#6c63ff',
    tags: ['stress-relief', 'lungs', 'quick-calm'],
    instructions: [
      'Find a comfortable seated posture.',
      'Inhale quietly through your nose for 4 counts.',
      'Hold your breath for a count of 7.',
      'Exhale completely through your mouth for 8 counts.',
      'Repeat for 4 full breath cycles.',
    ],
    isActive: true,
  },
  {
    title: 'Progressive Body Scan',
    description: 'Mindfully scan bodily sensations from toes to crown, releasing chronic tension and physical anxiety.',
    category: 'Meditation',
    duration: '10 min',
    difficulty: 'beginner',
    icon: '🧘',
    color: '#4ecdc4',
    tags: ['mindfulness', 'relaxation', 'sleep'],
    instructions: [
      'Lie down or sit comfortably with spine upright.',
      'Close your eyes and bring gentle attention to your toes and feet.',
      'Notice any tension, temperature, or sensation without judgment.',
      'Gradually move your awareness upward through legs, torso, chest, shoulders, and face.',
      'Breathe deeply into any areas of tightness.',
    ],
    isActive: true,
  },
  {
    title: '5-4-3-2-1 Sensory Grounding Walk',
    description: 'Outdoor mindful stroll noticing 5 sights, 4 physical textures, 3 sounds, 2 scents, and 1 grateful breath.',
    category: 'Movement',
    duration: '15 min',
    difficulty: 'beginner',
    icon: '🚶',
    color: '#a8e6cf',
    tags: ['movement', 'nature', 'grounding'],
    instructions: [
      'Step outside into fresh air without headphones.',
      'Identify 5 distinct visual details around you.',
      'Notice 4 textures or physical sensations against your skin.',
      'Listen for 3 ambient sounds.',
      'Identify 2 subtle scents in the breeze.',
      'Take 1 deep centering breath of gratitude.',
    ],
    isActive: true,
  },
  {
    title: 'Evening Digital Sunset & Wind-Down',
    description: 'Switch off blue-light devices, dim illumination, and prepare mind and nervous system for restful sleep.',
    category: 'Sleep',
    duration: '20 min',
    difficulty: 'beginner',
    icon: '🌙',
    color: '#7c6f9f',
    tags: ['sleep', 'rest', 'evening-routine'],
    instructions: [
      'Power down or silence smartphones and laptops.',
      'Dim artificial room lights.',
      'Sip a caffeine-free tea or room-temperature water.',
      'Reflect on one positive occurrence from your day.',
      'Practice slow, rhythmic diaphragmatic breathing.',
    ],
    isActive: true,
  },
  {
    title: 'Three Good Things Gratitude Reflection',
    description: 'Cognitive reframing exercise noting three specific moments of joy, relief, or kindness today.',
    category: 'Journaling',
    duration: '5 min',
    difficulty: 'beginner',
    icon: '📝',
    color: '#ff9f7f',
    tags: ['gratitude', 'journal', 'positivity'],
    instructions: [
      'Open your journal or a blank note.',
      'Write down three specific events that went well today.',
      'For each event, reflect on why it occurred and how it made you feel.',
      'Embrace the sense of appreciation before continuing your day.',
    ],
    isActive: true,
  },
  {
    title: 'Deep Work Pomodoro Focus Sprint',
    description: '25 minutes of unbroken focused work followed by a 5-minute restorative mental intermission.',
    category: 'Focus',
    duration: '25 min',
    difficulty: 'intermediate',
    icon: '🎯',
    color: '#f7c59f',
    tags: ['focus', 'productivity', 'pomodoro'],
    instructions: [
      'Select a single task to complete.',
      'Eliminate all potential distractions and notifications.',
      'Set a timer for 25 minutes and work with singular devotion.',
      'When the timer sounds, take a 5-minute break away from screens.',
    ],
    isActive: true,
  },
];

/**
 * Ensures default wellness activities are seeded once.
 */
export const ensureActivitiesSeeded = async () => {
  try {
    const count = await WellnessActivity.countDocuments();
    if (count === 0) {
      await WellnessActivity.insertMany(DEFAULT_ACTIVITIES);
    }
  } catch {
    // Non-fatal, fallback to runtime activities
  }
};

/**
 * Fetches platform-wide high-level metrics required by the Admin Dashboard.
 * Includes:
 *   - Total users
 *   - Total counsellors
 *   - Total appointments
 *   - Total mood entries
 *   - Total AI conversations
 *   - Active users
 */
export const getPlatformStats = async () => {
  const [
    totalUsers,
    totalCounsellors,
    totalAppointments,
    totalMoodEntries,
    totalConversations,
    activeUsersCount,
    totalAdmins,
    totalCheckIns,
    totalActivities,
  ] = await Promise.all([
    // Total users with role: 'user' (and total registered accounts)
    User.countDocuments({ role: 'user' }),
    Counsellor.countDocuments(),
    Appointment.countDocuments(),
    Mood.countDocuments(),
    Conversation.countDocuments(),
    // Active users: accounts not deactivated that have recent activity or isActive !== false
    User.countDocuments({
      isActive: { $ne: false },
      $or: [
        { lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      ],
    }),
    User.countDocuments({ role: 'admin' }),
    CheckIn.countDocuments(),
    WellnessActivity.countDocuments(),
  ]);

  // Total registered accounts overall
  const totalRegisteredAccounts = await User.countDocuments();

  // If no user has lastLoginAt set yet in dev/seed, fallback activeUsers gracefully
  const resolvedActiveUsers =
    activeUsersCount > 0
      ? activeUsersCount
      : await User.countDocuments({ isActive: { $ne: false } });

  return {
    totalUsers,
    totalRegisteredAccounts,
    totalCounsellors,
    totalAppointments,
    totalMoodEntries,
    totalConversations,
    activeUsers: resolvedActiveUsers,
    totalAdmins,
    totalCheckIns,
    totalActivities,
  };
};

/**
 * Fetches basic analytics breakdowns for charts and insights.
 */
export const getAnalytics = async () => {
  // Appointment status counts
  const appointmentStatuses = await Appointment.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const appointmentsByStatus = {
    pending: 0,
    accepted: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0,
  };
  appointmentStatuses.forEach((item) => {
    if (item._id) appointmentsByStatus[item._id] = item.count;
  });

  // Mood frequency distribution
  const moodsAgg = await Mood.aggregate([
    { $group: { _id: '$mood', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const moodDistribution = moodsAgg.map((m) => ({
    mood: m._id,
    count: m.count,
  }));

  // Role distribution
  const rolesAgg = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);

  const roleDistribution = {
    user: 0,
    counsellor: 0,
    admin: 0,
  };
  rolesAgg.forEach((r) => {
    if (r._id) roleDistribution[r._id] = r.count;
  });

  // User growth over past 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentUsersAgg = await User.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Generate 7-day array
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const match = recentUsersAgg.find((r) => r._id === dateStr);
    last7Days.push({
      date: dateStr,
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
      signups: match ? match.count : 0,
    });
  }

  // Recent mood logging activity over past 7 days
  const recentMoodsAgg = await Mood.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const recentMoodActivity = last7Days.map((day) => {
    const match = recentMoodsAgg.find((m) => m._id === day.date);
    return {
      date: day.date,
      label: day.label,
      moods: match ? match.count : 0,
    };
  });

  return {
    appointmentsByStatus,
    moodDistribution,
    roleDistribution,
    recentUserGrowth: last7Days,
    recentMoodActivity,
  };
};

/**
 * Lists users with search, role filter, status filter, and pagination.
 * Excludes sensitive fields (passwords, reset tokens).
 */
export const getUsers = async ({
  page = 1,
  limit = 10,
  search = '',
  role = '',
  status = 'all',
}) => {
  const query = {};

  if (role && ['user', 'counsellor', 'admin'].includes(role)) {
    query.role = role;
  }

  if (status === 'active') {
    query.isActive = { $ne: false };
  } else if (status === 'inactive') {
    query.isActive = false;
  }

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ name: regex }, { email: regex }];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('name email role isVerified isActive lastLoginAt createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(query),
  ]);

  return {
    users,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum) || 1,
    },
  };
};

/**
 * Updates a user's role.
 * Protects against demoting the requesting administrator.
 */
export const updateUserRole = async (targetUserId, newRole, currentAdminId) => {
  const VALID_ROLES = ['user', 'counsellor', 'admin'];
  if (!newRole || !VALID_ROLES.includes(newRole)) {
    throw new AppError(`Role must be one of: ${VALID_ROLES.join(', ')}`, 400);
  }

  if (targetUserId.toString() === currentAdminId.toString() && newRole !== 'admin') {
    throw new AppError('Security violation: Cannot demote your own admin account.', 400);
  }

  const updated = await User.findByIdAndUpdate(
    targetUserId,
    { role: newRole },
    { new: true, runValidators: true }
  ).select('name email role isVerified isActive lastLoginAt createdAt updatedAt');

  if (!updated) {
    throw new AppError('User not found', 404);
  }

  return updated;
};

/**
 * Toggles or updates user active status (suspend/activate account).
 * Protects against self-deactivation.
 */
export const updateUserStatus = async (targetUserId, isActive, currentAdminId) => {
  if (targetUserId.toString() === currentAdminId.toString() && isActive === false) {
    throw new AppError('Security violation: Cannot deactivate your own admin account.', 400);
  }

  const updated = await User.findByIdAndUpdate(
    targetUserId,
    { isActive: Boolean(isActive) },
    { new: true }
  ).select('name email role isVerified isActive lastLoginAt createdAt updatedAt');

  if (!updated) {
    throw new AppError('User not found', 404);
  }

  return updated;
};

/**
 * Updates user verification status.
 */
export const updateUserVerification = async (targetUserId, isVerified) => {
  const updated = await User.findByIdAndUpdate(
    targetUserId,
    { isVerified: Boolean(isVerified) },
    { new: true }
  ).select('name email role isVerified isActive lastLoginAt createdAt updatedAt');

  if (!updated) {
    throw new AppError('User not found', 404);
  }

  return updated;
};

/**
 * Deletes a user account.
 * Guards against self-deletion and removing the last remaining administrator.
 */
export const deleteUser = async (targetUserId, currentAdminId) => {
  if (targetUserId.toString() === currentAdminId.toString()) {
    throw new AppError('Security violation: Cannot delete your own admin account.', 400);
  }

  const userToDelete = await User.findById(targetUserId);
  if (!userToDelete) {
    throw new AppError('User not found', 404);
  }

  if (userToDelete.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      throw new AppError('Cannot delete the last remaining platform administrator.', 400);
    }
  }

  // If user was a counsellor, clean up Counsellor document
  if (userToDelete.role === 'counsellor') {
    await Counsellor.findOneAndDelete({ user: targetUserId });
  }

  await User.findByIdAndDelete(targetUserId);

  return { id: targetUserId, email: userToDelete.email };
};

/**
 * Lists counsellors with populated user profile and stats.
 */
export const getCounsellors = async ({ search = '', status = 'all' }) => {
  const query = {};

  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }

  let counsellors = await Counsellor.find(query)
    .populate('user', 'name email avatar isVerified isActive createdAt')
    .sort({ createdAt: -1 })
    .lean();

  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    counsellors = counsellors.filter(
      (c) =>
        c.user?.name?.toLowerCase().includes(term) ||
        c.user?.email?.toLowerCase().includes(term) ||
        c.specialization?.toLowerCase().includes(term) ||
        c.location?.toLowerCase().includes(term)
    );
  }

  // Augment with appointment counts for each counsellor
  const augmented = await Promise.all(
    counsellors.map(async (c) => {
      const apptCount = c.user?._id
        ? await Appointment.countDocuments({ counsellor: c.user._id })
        : 0;
      return {
        ...c,
        appointmentCount: apptCount,
      };
    })
  );

  return augmented;
};

/**
 * Updates counsellor active/visibility status.
 */
export const updateCounsellorStatus = async (counsellorId, isActive) => {
  const updated = await Counsellor.findByIdAndUpdate(
    counsellorId,
    { isActive: Boolean(isActive) },
    { new: true }
  ).populate('user', 'name email avatar isVerified isActive');

  if (!updated) {
    throw new AppError('Counsellor profile not found', 404);
  }

  return updated;
};

/**
 * Updates counsellor profile data.
 */
export const updateCounsellorProfile = async (counsellorId, data) => {
  const allowed = ['specialization', 'experience', 'description', 'location', 'isActive'];
  const updateData = {};
  allowed.forEach((k) => {
    if (data[k] !== undefined) updateData[k] = data[k];
  });

  const updated = await Counsellor.findByIdAndUpdate(counsellorId, updateData, {
    new: true,
    runValidators: true,
  }).populate('user', 'name email avatar isVerified isActive');

  if (!updated) {
    throw new AppError('Counsellor profile not found', 404);
  }

  return updated;
};

/**
 * Removes a counsellor profile document.
 */
export const deleteCounsellorProfile = async (counsellorId) => {
  const counsellor = await Counsellor.findById(counsellorId);
  if (!counsellor) {
    throw new AppError('Counsellor profile not found', 404);
  }

  await Counsellor.findByIdAndDelete(counsellorId);

  // Downgrade user role to 'user' if currently 'counsellor'
  await User.findByIdAndUpdate(counsellor.user, { role: 'user' });

  return { id: counsellorId };
};

/**
 * Lists appointments with pagination, status filter, and patient/counsellor details.
 */
export const getAppointments = async ({
  page = 1,
  limit = 15,
  status = 'all',
  search = '',
}) => {
  const query = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
  const skip = (pageNum - 1) * limitNum;

  const [appointments, total] = await Promise.all([
    Appointment.find(query)
      .populate('user', 'name email avatar')
      .populate('counsellor', 'name email avatar')
      .sort({ scheduledAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Appointment.countDocuments(query),
  ]);

  let filtered = appointments;
  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    filtered = appointments.filter(
      (a) =>
        a.user?.name?.toLowerCase().includes(term) ||
        a.user?.email?.toLowerCase().includes(term) ||
        a.counsellor?.name?.toLowerCase().includes(term) ||
        a.counsellor?.email?.toLowerCase().includes(term) ||
        a.notes?.toLowerCase().includes(term)
    );
  }

  return {
    appointments: filtered,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum) || 1,
    },
  };
};

/**
 * Updates an appointment status (e.g., confirm, complete, cancel, reject).
 */
export const updateAppointmentStatus = async (appointmentId, status, reason = '') => {
  const VALID_STATUSES = ['pending', 'confirmed', 'accepted', 'rejected', 'cancelled', 'completed'];
  if (!status || !VALID_STATUSES.includes(status)) {
    throw new AppError(`Status must be one of: ${VALID_STATUSES.join(', ')}`, 400);
  }

  const updateFields = { status };
  if (reason) updateFields.reason = reason;

  const now = new Date();
  if (status === 'accepted' || status === 'confirmed') updateFields.acceptedAt = now;
  if (status === 'completed') updateFields.completedAt = now;
  if (status === 'cancelled') {
    updateFields.cancelledAt = now;
    updateFields.cancelledBy = 'admin';
  }
  if (status === 'rejected') updateFields.rejectedAt = now;

  const updated = await Appointment.findByIdAndUpdate(appointmentId, updateFields, {
    new: true,
  })
    .populate('user', 'name email avatar')
    .populate('counsellor', 'name email avatar');

  if (!updated) {
    throw new AppError('Appointment not found', 404);
  }

  return updated;
};

/**
 * Lists wellness activities with filters.
 */
export const getWellnessActivities = async ({
  category = '',
  status = 'all',
  search = '',
}) => {
  await ensureActivitiesSeeded();

  const query = {};

  if (category && category !== 'All') {
    query.category = category;
  }

  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ title: regex }, { description: regex }, { tags: regex }];
  }

  const activities = await WellnessActivity.find(query).sort({ createdAt: -1 }).lean();
  return activities;
};

/**
 * Creates a new wellness activity.
 */
export const createWellnessActivity = async (activityData, adminId) => {
  const { title, description, category, duration, difficulty, icon, color, tags, instructions, isActive } = activityData;

  if (!title || !description) {
    throw new AppError('Title and description are required for wellness activity', 400);
  }

  const newActivity = await WellnessActivity.create({
    title,
    description,
    category: category || 'Relaxation',
    duration: duration || '5 min',
    difficulty: difficulty || 'beginner',
    icon: icon || '🌿',
    color: color || '#6c63ff',
    tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    instructions: Array.isArray(instructions) ? instructions : typeof instructions === 'string' ? instructions.split('\n').map((i) => i.trim()).filter(Boolean) : [],
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    createdBy: adminId || null,
  });

  return newActivity;
};

/**
 * Updates a wellness activity.
 */
export const updateWellnessActivity = async (activityId, data) => {
  if (data.tags && typeof data.tags === 'string') {
    data.tags = data.tags.split(',').map((t) => t.trim()).filter(Boolean);
  }
  if (data.instructions && typeof data.instructions === 'string') {
    data.instructions = data.instructions.split('\n').map((i) => i.trim()).filter(Boolean);
  }

  const updated = await WellnessActivity.findByIdAndUpdate(activityId, data, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    throw new AppError('Wellness activity not found', 404);
  }

  return updated;
};

/**
 * Deletes a wellness activity.
 */
export const deleteWellnessActivity = async (activityId) => {
  const deleted = await WellnessActivity.findByIdAndDelete(activityId);
  if (!deleted) {
    throw new AppError('Wellness activity not found', 404);
  }
  return { id: activityId };
};

/**
 * Toggles a wellness activity active status.
 */
export const toggleWellnessActivity = async (activityId) => {
  const activity = await WellnessActivity.findById(activityId);
  if (!activity) {
    throw new AppError('Wellness activity not found', 404);
  }

  activity.isActive = !activity.isActive;
  await activity.save();

  return activity;
};
