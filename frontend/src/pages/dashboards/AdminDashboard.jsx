/**
 * pages/dashboards/AdminDashboard.jsx
 * Comprehensive Admin Dashboard — Part 19.
 *
 * Implements:
 *   - Key Metric Display: Total users, Total counsellors, Total appointments,
 *     Total mood entries, Total AI conversations, Active users.
 *   - View & Manage Users: search, filter, role updates, account activate/deactivate, delete.
 *   - View & Manage Counsellors: search, view details, update status, edit profile, remove.
 *   - View Appointments: filter by status, search, update status (confirm, complete, cancel).
 *   - Manage Wellness Activities: view list, filter by category, create, edit, toggle active, delete.
 *   - Basic Analytics: registrations growth, mood distributions, appointment statuses.
 *   - Strict admin-only access and sanitized information display.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar,
  Tooltip, XAxis, YAxis, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getInitials } from '../../utils/helpers';
import * as adminService from '../../services/adminService';

// ── Chart Tooltip Component ──────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, isDark }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: isDark ? 'rgba(26,24,48,0.95)' : '#ffffff',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.15)'}`,
      padding: '0.6rem 0.9rem',
      borderRadius: '10px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      fontSize: '0.82rem',
    }}>
      <div style={{ fontWeight: 700, color: isDark ? '#e8e6ff' : '#1a1a2e', marginBottom: '0.2rem' }}>
        {label}
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#6c63ff', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span>●</span>
          <span>{p.name}:</span>
          <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // ── Dashboard state ───────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'counsellors' | 'appointments' | 'activities'
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Alerts & Notifications
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: '' }
  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4500);
  };

  // ── Users tab state ───────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [userPagination, setUserPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // ── Counsellors tab state ─────────────────────────────────────────
  const [counsellors, setCounsellors] = useState([]);
  const [counsellorSearch, setCounsellorSearch] = useState('');
  const [counsellorStatusFilter, setCounsellorStatusFilter] = useState('all');
  const [loadingCounsellors, setLoadingCounsellors] = useState(false);

  // ── Appointments tab state ────────────────────────────────────────
  const [appointments, setAppointments] = useState([]);
  const [apptPagination, setApptPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [apptStatusFilter, setApptStatusFilter] = useState('all');
  const [apptSearch, setApptSearch] = useState('');
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // ── Activities tab state ──────────────────────────────────────────
  const [activities, setActivities] = useState([]);
  const [activityCategoryFilter, setActivityCategoryFilter] = useState('All');
  const [activitySearch, setActivitySearch] = useState('');
  const [loadingActivities, setLoadingActivities] = useState(false);

  // ── Modal states ──────────────────────────────────────────────────
  const [activityModal, setActivityModal] = useState({ open: false, mode: 'create', data: null });
  const [counsellorModal, setCounsellorModal] = useState({ open: false, data: null });
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ open: false, type: '', id: '', title: '' });
  const [roleChangeModal, setRoleChangeModal] = useState({ open: false, user: null, newRole: 'user' });

  // ── Fetchers ──────────────────────────────────────────────────────
  const loadPlatformOverview = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [statsData, analyticsData] = await Promise.all([
        adminService.getStats(),
        adminService.getAnalytics(),
      ]);
      setStats(statsData);
      setAnalytics(analyticsData);
    } catch (err) {
      showAlert(err.message || 'Failed to load platform stats', 'error');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadUsers = useCallback(async (page = 1) => {
    setLoadingUsers(true);
    try {
      const data = await adminService.getUsers({
        page,
        limit: userPagination.limit,
        search: userSearch,
        role: userRoleFilter,
        status: userStatusFilter,
      });
      setUsers(data?.users || []);
      if (data?.pagination) setUserPagination(data.pagination);
    } catch (err) {
      showAlert(err.message || 'Failed to fetch users', 'error');
    } finally {
      setLoadingUsers(false);
    }
  }, [userPagination.limit, userSearch, userRoleFilter, userStatusFilter]);

  const loadCounsellors = useCallback(async () => {
    setLoadingCounsellors(true);
    try {
      const data = await adminService.getCounsellors({
        search: counsellorSearch,
        status: counsellorStatusFilter,
      });
      setCounsellors(data || []);
    } catch (err) {
      showAlert(err.message || 'Failed to fetch counsellors', 'error');
    } finally {
      setLoadingCounsellors(false);
    }
  }, [counsellorSearch, counsellorStatusFilter]);

  const loadAppointments = useCallback(async (page = 1) => {
    setLoadingAppointments(true);
    try {
      const data = await adminService.getAppointments({
        page,
        limit: apptPagination.limit,
        status: apptStatusFilter,
        search: apptSearch,
      });
      setAppointments(data?.appointments || []);
      if (data?.pagination) setApptPagination(data.pagination);
    } catch (err) {
      showAlert(err.message || 'Failed to fetch appointments', 'error');
    } finally {
      setLoadingAppointments(false);
    }
  }, [apptPagination.limit, apptStatusFilter, apptSearch]);

  const loadActivities = useCallback(async () => {
    setLoadingActivities(true);
    try {
      const data = await adminService.getWellnessActivities({
        category: activityCategoryFilter === 'All' ? '' : activityCategoryFilter,
        search: activitySearch,
      });
      setActivities(data || []);
    } catch (err) {
      showAlert(err.message || 'Failed to fetch activities', 'error');
    } finally {
      setLoadingActivities(false);
    }
  }, [activityCategoryFilter, activitySearch]);

  // Initial load
  useEffect(() => {
    loadPlatformOverview();
  }, [loadPlatformOverview]);

  // Dynamic tab switcher loader
  useEffect(() => {
    if (activeTab === 'users') loadUsers(1);
    if (activeTab === 'counsellors') loadCounsellors();
    if (activeTab === 'appointments') loadAppointments(1);
    if (activeTab === 'activities') loadActivities();
  }, [activeTab, loadUsers, loadCounsellors, loadAppointments, loadActivities]);

  // ── Color and theme helpers ───────────────────────────────────────
  const bg = isDark ? 'linear-gradient(135deg, #0d0c17, #17152b)' : 'linear-gradient(135deg, #f7f6fc, #fff5f2)';
  const surfaceBg = isDark ? 'rgba(26,24,48,0.85)' : '#ffffff';
  const surfaceBorder = isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(108,99,255,0.1)';
  const textPrimary = isDark ? '#e8e6ff' : '#1a1a2e';
  const textSecondary = isDark ? 'rgba(232,230,255,0.6)' : 'rgba(26,26,46,0.6)';
  const brandGradient = 'linear-gradient(135deg, #ff6b6b, #6c63ff)';

  // ── User management actions ───────────────────────────────────────
  const handleToggleUserStatus = async (targetUser) => {
    try {
      const newStatus = targetUser.isActive === false ? true : false;
      await adminService.updateUserStatus(targetUser._id || targetUser.id, newStatus);
      showAlert(`User account ${newStatus ? 'activated' : 'deactivated'} successfully`);
      loadUsers(userPagination.page);
      loadPlatformOverview();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  };

  const handleToggleUserVerification = async (targetUser) => {
    try {
      const newVer = !targetUser.isVerified;
      await adminService.updateUserVerification(targetUser._id || targetUser.id, newVer);
      showAlert(`User verification updated`);
      loadUsers(userPagination.page);
    } catch (err) {
      showAlert(err.message, 'error');
    }
  };

  const confirmRoleChange = async () => {
    if (!roleChangeModal.user) return;
    try {
      await adminService.updateUserRole(
        roleChangeModal.user._id || roleChangeModal.user.id,
        roleChangeModal.newRole
      );
      showAlert(`Role updated to ${roleChangeModal.newRole}`);
      setRoleChangeModal({ open: false, user: null, newRole: 'user' });
      loadUsers(userPagination.page);
      loadPlatformOverview();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  };

  // ── Counsellor actions ────────────────────────────────────────────
  const handleToggleCounsellorStatus = async (counsellor) => {
    try {
      const newStatus = !counsellor.isActive;
      await adminService.updateCounsellorStatus(counsellor._id || counsellor.id, newStatus);
      showAlert(`Counsellor profile ${newStatus ? 'activated' : 'deactivated'}`);
      loadCounsellors();
      loadPlatformOverview();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  };

  const handleSaveCounsellorProfile = async (e) => {
    e.preventDefault();
    const data = counsellorModal.data;
    try {
      await adminService.updateCounsellorProfile(data._id || data.id, {
        specialization: data.specialization,
        experience: Number(data.experience),
        location: data.location,
        description: data.description,
      });
      showAlert('Counsellor profile details saved');
      setCounsellorModal({ open: false, data: null });
      loadCounsellors();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  };

  // ── Appointment actions ───────────────────────────────────────────
  const handleUpdateAppointment = async (apptId, status) => {
    try {
      await adminService.updateAppointmentStatus(apptId, status);
      showAlert(`Appointment status set to ${status}`);
      loadAppointments(apptPagination.page);
      loadPlatformOverview();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  };

  // ── Activity actions ──────────────────────────────────────────────
  const handleToggleActivity = async (activityId) => {
    try {
      await adminService.toggleWellnessActivity(activityId);
      showAlert('Activity status toggled');
      loadActivities();
      loadPlatformOverview();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  };

  const handleSaveActivity = async (e) => {
    e.preventDefault();
    const { mode, data } = activityModal;
    try {
      if (mode === 'create') {
        await adminService.createWellnessActivity(data);
        showAlert('New wellness activity published');
      } else {
        await adminService.updateWellnessActivity(data._id || data.id, data);
        showAlert('Wellness activity updated');
      }
      setActivityModal({ open: false, mode: 'create', data: null });
      loadActivities();
      loadPlatformOverview();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  };

  // ── Delete confirmation execution ─────────────────────────────────
  const executeDelete = async () => {
    const { type, id } = deleteConfirmModal;
    try {
      if (type === 'user') {
        await adminService.deleteUser(id);
        showAlert('User account deleted');
        loadUsers(userPagination.page);
      } else if (type === 'counsellor') {
        await adminService.deleteCounsellor(id);
        showAlert('Counsellor profile removed');
        loadCounsellors();
      } else if (type === 'activity') {
        await adminService.deleteWellnessActivity(id);
        showAlert('Wellness activity deleted');
        loadActivities();
      }
      setDeleteConfirmModal({ open: false, type: '', id: '', title: '' });
      loadPlatformOverview();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  };

  // ── 6 Core Display Metrics ────────────────────────────────────────
  const metricCards = useMemo(() => [
    {
      label: 'Total Users',
      value: stats ? stats.totalUsers : '—',
      sub: `${stats ? stats.totalRegisteredAccounts : 0} total accounts`,
      icon: '👥',
      color: '#6c63ff',
      gradient: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(108,99,255,0.03))',
      border: 'rgba(108,99,255,0.25)',
      tab: 'users',
    },
    {
      label: 'Total Counsellors',
      value: stats ? stats.totalCounsellors : '—',
      sub: 'Verified clinical practitioners',
      icon: '👨‍⚕️',
      color: '#4ecdc4',
      gradient: 'linear-gradient(135deg, rgba(78,205,196,0.15), rgba(78,205,196,0.03))',
      border: 'rgba(78,205,196,0.25)',
      tab: 'counsellors',
    },
    {
      label: 'Total Appointments',
      value: stats ? stats.totalAppointments : '—',
      sub: 'All booked counselling sessions',
      icon: '📅',
      color: '#ff6b6b',
      gradient: 'linear-gradient(135deg, rgba(255,107,107,0.15), rgba(255,107,107,0.03))',
      border: 'rgba(255,107,107,0.25)',
      tab: 'appointments',
    },
    {
      label: 'Total Mood Entries',
      value: stats ? stats.totalMoodEntries : '—',
      sub: 'Emotional check-ins logged',
      icon: '🎭',
      color: '#f7c59f',
      gradient: 'linear-gradient(135deg, rgba(247,197,159,0.18), rgba(247,197,159,0.04))',
      border: 'rgba(247,197,159,0.3)',
      tab: 'overview',
    },
    {
      label: 'Total AI Conversations',
      value: stats ? stats.totalConversations : '—',
      sub: 'AI wellness companion dialogues',
      icon: '🤖',
      color: '#a8e6cf',
      gradient: 'linear-gradient(135deg, rgba(168,230,207,0.18), rgba(168,230,207,0.04))',
      border: 'rgba(168,230,207,0.3)',
      tab: 'overview',
    },
    {
      label: 'Active Users',
      value: stats ? stats.activeUsers : '—',
      sub: 'Active within past 30 days',
      icon: '🟢',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.03))',
      border: 'rgba(16,185,129,0.25)',
      tab: 'users',
    },
  ], [stats]);

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '1.75rem 1.25rem', color: textPrimary, transition: 'all 0.3s ease' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>

        {/* ── Top Bar ─────────────────────────────────────────────── */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem',
          padding: '0.85rem 1.25rem', borderRadius: '16px', background: surfaceBg, border: surfaceBorder,
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(108,99,255,0.06)',
        }}>
          {/* Logo & Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{
              width: 38, height: 38, borderRadius: '12px', background: brandGradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem',
              boxShadow: '0 4px 12px rgba(255,107,107,0.35)',
            }}>🧠</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', background: brandGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  MindEase
                </span>
                <span style={{
                  padding: '0.15rem 0.6rem', borderRadius: '9999px',
                  background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.3)',
                  fontSize: '0.72rem', fontWeight: 700, color: '#ff6b6b', textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  Admin Portal
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
                <span>Live Control Plane · Part 19</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title="Toggle Dark/Light Mode"
              style={{
                width: 36, height: 36, borderRadius: '10px',
                border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.06)',
                color: textPrimary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', transition: 'all 0.2s',
              }}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Admin Profile Details */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '10px', background: brandGradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: '0.85rem',
              }}>
                {getInitials(user?.name || 'AD')}
              </div>
              <div style={{ display: 'none', flexDirection: 'column' }} className="admin-profile-name">
                <span style={{ fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.1 }}>{user?.name}</span>
                <span style={{ fontSize: '0.72rem', color: '#ff6b6b' }}>{user?.email}</span>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              id="admin-logout-btn"
              style={{
                padding: '0.45rem 0.95rem', borderRadius: '10px',
                border: '1px solid rgba(255,107,107,0.3)',
                background: 'rgba(255,107,107,0.08)', color: '#ff6b6b',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              Sign out
            </button>
          </div>
        </header>

        {/* ── Toast Alert Banner ─────────────────────────────────── */}
        {alert && (
          <div style={{
            padding: '0.75rem 1.25rem', borderRadius: '12px', marginBottom: '1.25rem',
            background: alert.type === 'error' ? 'rgba(255,107,107,0.12)' : 'rgba(16,185,129,0.12)',
            border: `1px solid ${alert.type === 'error' ? 'rgba(255,107,107,0.3)' : 'rgba(16,185,129,0.3)'}`,
            color: alert.type === 'error' ? '#ff6b6b' : '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: '0.88rem', fontWeight: 600, animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span>{alert.type === 'error' ? '⚠️' : '✅'}</span>
              <span>{alert.message}</span>
            </div>
            <button onClick={() => setAlert(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* ── Hero Stat Counters (6 Required Metrics) ────────────── */}
        <section aria-label="Platform Key Metrics" style={{ marginBottom: '1.75rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
          }}>
            {metricCards.map((m) => (
              <div
                key={m.label}
                onClick={() => setActiveTab(m.tab)}
                style={{
                  padding: '1.25rem',
                  borderRadius: '16px',
                  background: isDark ? 'rgba(26,24,48,0.85)' : '#ffffff',
                  border: `1px solid ${m.border}`,
                  boxShadow: isDark ? '0 4px 18px rgba(0,0,0,0.25)' : '0 4px 18px rgba(108,99,255,0.06)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${m.border}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isDark ? '0 4px 18px rgba(0,0,0,0.25)' : '0 4px 18px rgba(108,99,255,0.06)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{m.icon}</span>
                  <span style={{
                    width: 24, height: 24, borderRadius: '50%', background: m.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: m.color,
                  }}>↗</span>
                </div>
                <div style={{
                  fontFamily: "'Outfit', sans-serif", fontSize: '1.9rem', fontWeight: 800,
                  color: m.color, lineHeight: 1.1, marginBottom: '0.25rem',
                }}>
                  {loadingStats ? '—' : m.value}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: textPrimary, marginBottom: '0.15rem' }}>
                  {m.label}
                </div>
                <div style={{ fontSize: '0.72rem', color: textSecondary }}>
                  {m.sub}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Main Tab Navigation Bar ────────────────────────────── */}
        <nav style={{
          display: 'flex', gap: '0.4rem', background: surfaceBg, padding: '0.35rem',
          borderRadius: '14px', border: surfaceBorder, marginBottom: '1.5rem',
          overflowX: 'auto', flexWrap: 'nowrap',
        }}>
          {[
            { id: 'overview',     label: 'Overview & Analytics', icon: '📊' },
            { id: 'users',        label: 'Users',                icon: '👥', badge: stats?.totalUsers },
            { id: 'counsellors',  label: 'Counsellors',          icon: '👨‍⚕️', badge: stats?.totalCounsellors },
            { id: 'appointments', label: 'Appointments',         icon: '📅', badge: stats?.totalAppointments },
            { id: 'activities',   label: 'Wellness Activities',  icon: '🌿', badge: stats?.totalActivities },
          ].map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                id={`admin-tab-${t.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.65rem 1.15rem', borderRadius: '10px', border: 'none',
                  background: isActive ? brandGradient : 'transparent',
                  color: isActive ? '#fff' : textSecondary,
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 4px 14px rgba(255,107,107,0.3)' : 'none',
                }}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
                {t.badge !== undefined && (
                  <span style={{
                    fontSize: '0.7rem', padding: '0.05rem 0.45rem', borderRadius: '9999px',
                    background: isActive ? 'rgba(255,255,255,0.25)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.1)'),
                    color: isActive ? '#fff' : textPrimary,
                  }}>
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ═══════════════════════════════════════════════════════════
            TAB 1: OVERVIEW & ANALYTICS
        ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Visual Analytics Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {/* Chart 1: User Growth (Past 7 Days) */}
              <div style={{
                background: surfaceBg, border: surfaceBorder, borderRadius: '18px', padding: '1.35rem',
                boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(108,99,255,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.2rem' }}>📈 User Growth Trend</h3>
                    <p style={{ fontSize: '0.78rem', color: textSecondary, margin: 0 }}>New registrations over the past 7 days</p>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6c63ff', padding: '0.2rem 0.6rem', borderRadius: '8px', background: 'rgba(108,99,255,0.1)' }}>
                    Live Aggregate
                  </span>
                </div>
                <div style={{ height: 220, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics?.recentUserGrowth || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6c63ff" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.08)'} />
                      <XAxis dataKey="label" stroke={textSecondary} fontSize={11} tickLine={false} />
                      <YAxis stroke={textSecondary} fontSize={11} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip isDark={isDark} />} />
                      <Area type="monotone" dataKey="signups" name="Signups" stroke="#6c63ff" strokeWidth={2.5} fill="url(#userGrowthGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Daily Mood Activity */}
              <div style={{
                background: surfaceBg, border: surfaceBorder, borderRadius: '18px', padding: '1.35rem',
                boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(108,99,255,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.2rem' }}>🎭 Mood Logging Activity</h3>
                    <p style={{ fontSize: '0.78rem', color: textSecondary, margin: 0 }}>Mental wellness checkpoint volume</p>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4ecdc4', padding: '0.2rem 0.6rem', borderRadius: '8px', background: 'rgba(78,205,196,0.1)' }}>
                    7-Day Logs
                  </span>
                </div>
                <div style={{ height: 220, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.recentMoodActivity || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.08)'} />
                      <XAxis dataKey="label" stroke={textSecondary} fontSize={11} tickLine={false} />
                      <YAxis stroke={textSecondary} fontSize={11} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip isDark={isDark} />} />
                      <Bar dataKey="moods" name="Moods Logged" fill="#4ecdc4" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Bottom Row: Breakdown summaries */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {/* Appointment Status Breakdown */}
              <div style={{ background: surfaceBg, border: surfaceBorder, borderRadius: '18px', padding: '1.35rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>📅</span> Appointments by Status
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {[
                    { label: 'Pending', count: analytics?.appointmentsByStatus?.pending ?? 0, color: '#f59e0b' },
                    { label: 'Confirmed / Accepted', count: (analytics?.appointmentsByStatus?.confirmed ?? 0) + (analytics?.appointmentsByStatus?.accepted ?? 0), color: '#10b981' },
                    { label: 'Completed', count: analytics?.appointmentsByStatus?.completed ?? 0, color: '#3b82f6' },
                    { label: 'Cancelled', count: analytics?.appointmentsByStatus?.cancelled ?? 0, color: '#6b7280' },
                    { label: 'Rejected', count: analytics?.appointmentsByStatus?.rejected ?? 0, color: '#ef4444' },
                  ].map((s) => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '3px', background: s.color }} />
                        <span style={{ color: textSecondary }}>{s.label}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: textPrimary }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mood Distribution */}
              <div style={{ background: surfaceBg, border: surfaceBorder, borderRadius: '18px', padding: '1.35rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>🌈</span> Emotional Distribution
                </h3>
                {analytics?.moodDistribution?.length ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {analytics.moodDistribution.map((m) => (
                      <span
                        key={m.mood}
                        style={{
                          padding: '0.35rem 0.75rem', borderRadius: '12px',
                          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.06)',
                          border: surfaceBorder, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                        }}
                      >
                        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{m.mood}</span>
                        <strong style={{ color: '#6c63ff' }}>{m.count}</strong>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: textSecondary, fontSize: '0.85rem' }}>No mood entries recorded yet.</div>
                )}
              </div>

              {/* Platform Role Composition */}
              <div style={{ background: surfaceBg, border: surfaceBorder, borderRadius: '18px', padding: '1.35rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>🔐</span> Account Roles
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {[
                    { role: 'Standard Users', count: analytics?.roleDistribution?.user ?? 0, color: '#6c63ff' },
                    { role: 'Counsellors', count: analytics?.roleDistribution?.counsellor ?? 0, color: '#4ecdc4' },
                    { role: 'Administrators', count: analytics?.roleDistribution?.admin ?? 0, color: '#ff6b6b' },
                  ].map((r) => (
                    <div key={r.role} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '3px', background: r.color }} />
                        <span style={{ color: textSecondary }}>{r.role}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: textPrimary }}>{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 2: USER MANAGEMENT
        ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <div style={{ background: surfaceBg, border: surfaceBorder, borderRadius: '18px', padding: '1.5rem', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(108,99,255,0.05)' }}>
            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.2rem' }}>👥 User Management</h2>
                <p style={{ fontSize: '0.8rem', color: textSecondary, margin: 0 }}>View, promote, suspend, or manage platform accounts</p>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadUsers(1)}
                  style={{
                    padding: '0.5rem 0.85rem', borderRadius: '10px',
                    border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa',
                    color: textPrimary, fontSize: '0.82rem', minWidth: 200,
                  }}
                />

                {/* Role filter */}
                <select
                  value={userRoleFilter}
                  onChange={(e) => { setUserRoleFilter(e.target.value); }}
                  style={{
                    padding: '0.5rem 0.85rem', borderRadius: '10px',
                    border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa',
                    color: textPrimary, fontSize: '0.82rem',
                  }}
                >
                  <option value="">All Roles</option>
                  <option value="user">Users Only</option>
                  <option value="counsellor">Counsellors</option>
                  <option value="admin">Admins</option>
                </select>

                {/* Status filter */}
                <select
                  value={userStatusFilter}
                  onChange={(e) => { setUserStatusFilter(e.target.value); }}
                  style={{
                    padding: '0.5rem 0.85rem', borderRadius: '10px',
                    border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa',
                    color: textPrimary, fontSize: '0.82rem',
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Deactivated</option>
                </select>

                <button
                  onClick={() => loadUsers(1)}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '10px', border: 'none',
                    background: '#6c63ff', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: surfaceBorder, color: textSecondary, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>User</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Email</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Role</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Account Status</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Verified</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Joined</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: textSecondary }}>
                        Loading users list...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: textSecondary }}>
                        No users match the criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isCurrentAdmin = (u._id || u.id) === user?.id;
                      const isActive = u.isActive !== false;
                      return (
                        <tr key={u._id || u.id} style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(108,99,255,0.05)'}` }}>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{
                                width: 30, height: 30, borderRadius: '8px',
                                background: u.role === 'admin' ? brandGradient : (u.role === 'counsellor' ? '#4ecdc4' : '#6c63ff'),
                                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '0.75rem', flexShrink: 0,
                              }}>
                                {getInitials(u.name || 'U')}
                              </div>
                              <span style={{ fontWeight: 600 }}>{u.name}</span>
                              {isCurrentAdmin && (
                                <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'rgba(255,107,107,0.15)', color: '#ff6b6b' }}>You</span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', color: textSecondary }}>{u.email}</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <span style={{
                              padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                              textTransform: 'uppercase',
                              background: u.role === 'admin' ? 'rgba(255,107,107,0.15)' : (u.role === 'counsellor' ? 'rgba(78,205,196,0.15)' : 'rgba(108,99,255,0.15)'),
                              color: u.role === 'admin' ? '#ff6b6b' : (u.role === 'counsellor' ? '#4ecdc4' : '#6c63ff'),
                            }}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                              padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 600,
                              background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                              color: isActive ? '#10b981' : '#ef4444',
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#10b981' : '#ef4444' }} />
                              {isActive ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <button
                              onClick={() => handleToggleUserVerification(u)}
                              title="Click to toggle verified status"
                              style={{
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                fontSize: '0.9rem', color: u.isVerified ? '#3b82f6' : textSecondary,
                              }}
                            >
                              {u.isVerified ? '✓ Verified' : '○ Unverified'}
                            </button>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', color: textSecondary, fontSize: '0.75rem' }}>
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                              {/* Change Role Button */}
                              <button
                                onClick={() => setRoleChangeModal({ open: true, user: u, newRole: u.role })}
                                title="Change Role"
                                style={{
                                  padding: '0.3rem 0.6rem', borderRadius: '6px', border: surfaceBorder,
                                  background: 'transparent', color: textPrimary, fontSize: '0.74rem', cursor: 'pointer',
                                }}
                              >
                                Role ▾
                              </button>

                              {/* Toggle Active status */}
                              {!isCurrentAdmin && (
                                <button
                                  onClick={() => handleToggleUserStatus(u)}
                                  title={isActive ? 'Deactivate account' : 'Reactivate account'}
                                  style={{
                                    padding: '0.3rem 0.6rem', borderRadius: '6px', border: 'none',
                                    background: isActive ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                                    color: isActive ? '#ef4444' : '#10b981', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer',
                                  }}
                                >
                                  {isActive ? 'Suspend' : 'Activate'}
                                </button>
                              )}

                              {/* Delete account */}
                              {!isCurrentAdmin && (
                                <button
                                  onClick={() => setDeleteConfirmModal({ open: true, type: 'user', id: u._id || u.id, title: `User: ${u.name} (${u.email})` })}
                                  title="Delete user account"
                                  style={{
                                    padding: '0.3rem 0.5rem', borderRadius: '6px', border: 'none',
                                    background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', fontSize: '0.74rem', cursor: 'pointer',
                                  }}
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {userPagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  disabled={userPagination.page <= 1}
                  onClick={() => loadUsers(userPagination.page - 1)}
                  style={{
                    padding: '0.4rem 0.8rem', borderRadius: '8px', border: surfaceBorder,
                    background: 'transparent', color: textPrimary, cursor: userPagination.page <= 1 ? 'not-allowed' : 'pointer',
                    opacity: userPagination.page <= 1 ? 0.4 : 1, fontSize: '0.8rem',
                  }}
                >
                  ← Previous
                </button>
                <span style={{ fontSize: '0.8rem', color: textSecondary }}>
                  Page {userPagination.page} of {userPagination.pages}
                </span>
                <button
                  disabled={userPagination.page >= userPagination.pages}
                  onClick={() => loadUsers(userPagination.page + 1)}
                  style={{
                    padding: '0.4rem 0.8rem', borderRadius: '8px', border: surfaceBorder,
                    background: 'transparent', color: textPrimary, cursor: userPagination.page >= userPagination.pages ? 'not-allowed' : 'pointer',
                    opacity: userPagination.page >= userPagination.pages ? 0.4 : 1, fontSize: '0.8rem',
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 3: COUNSELLOR MANAGEMENT
        ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'counsellors' && (
          <div style={{ background: surfaceBg, border: surfaceBorder, borderRadius: '18px', padding: '1.5rem', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(108,99,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.2rem' }}>👨‍⚕️ Counsellor Directory & Management</h2>
                <p style={{ fontSize: '0.8rem', color: textSecondary, margin: 0 }}>Review practitioner credentials, availability, and visibility status</p>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <input
                  type="text"
                  placeholder="Search counsellor, specialization, city..."
                  value={counsellorSearch}
                  onChange={(e) => setCounsellorSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadCounsellors()}
                  style={{
                    padding: '0.5rem 0.85rem', borderRadius: '10px',
                    border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa',
                    color: textPrimary, fontSize: '0.82rem', minWidth: 220,
                  }}
                />
                <select
                  value={counsellorStatusFilter}
                  onChange={(e) => { setCounsellorStatusFilter(e.target.value); }}
                  style={{
                    padding: '0.5rem 0.85rem', borderRadius: '10px',
                    border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa',
                    color: textPrimary, fontSize: '0.82rem',
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Roster</option>
                  <option value="inactive">Inactive / Hidden</option>
                </select>
                <button
                  onClick={loadCounsellors}
                  style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: 'none', background: '#4ecdc4', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Filter
                </button>
              </div>
            </div>

            {loadingCounsellors ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: textSecondary }}>Loading counsellors roster...</div>
            ) : counsellors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: textSecondary }}>No counsellors found matching your filters.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {counsellors.map((c) => (
                  <div
                    key={c._id || c.id}
                    style={{
                      padding: '1.35rem', borderRadius: '16px', background: isDark ? 'rgba(255,255,255,0.03)' : '#fcfbfe',
                      border: surfaceBorder, display: 'flex', flexDirection: 'column', gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #4ecdc4, #6c63ff)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1rem',
                        }}>
                          {getInitials(c.user?.name || 'DR')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{c.user?.name || 'Unnamed Counsellor'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#4ecdc4', fontWeight: 600 }}>{c.specialization}</div>
                        </div>
                      </div>

                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700,
                        background: c.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: c.isActive ? '#10b981' : '#ef4444',
                      }}>
                        {c.isActive ? 'Visible' : 'Inactive'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: textSecondary, margin: '0.2rem 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {c.description}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: textSecondary }}>
                      <span>📍 {c.location || 'Online sessions'}</span>
                      <span>·</span>
                      <span>🎓 {c.experience} years exp</span>
                      <span>·</span>
                      <span>📅 {c.appointmentCount ?? 0} sessions booked</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: surfaceBorder }}>
                      <button
                        onClick={() => setCounsellorModal({ open: true, data: { ...c } })}
                        style={{
                          flex: 1, padding: '0.45rem', borderRadius: '8px', border: surfaceBorder,
                          background: 'transparent', color: textPrimary, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        ✏️ Edit Profile
                      </button>
                      <button
                        onClick={() => handleToggleCounsellorStatus(c)}
                        style={{
                          padding: '0.45rem 0.85rem', borderRadius: '8px', border: 'none',
                          background: c.isActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                          color: c.isActive ? '#ef4444' : '#10b981', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        {c.isActive ? 'Hide' : 'Activate'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmModal({ open: true, type: 'counsellor', id: c._id || c.id, title: `Counsellor: ${c.user?.name}` })}
                        style={{
                          padding: '0.45rem 0.75rem', borderRadius: '8px', border: 'none',
                          background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', fontSize: '0.78rem', cursor: 'pointer',
                        }}
                        title="Delete profile"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 4: APPOINTMENTS MANAGEMENT
        ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'appointments' && (
          <div style={{ background: surfaceBg, border: surfaceBorder, borderRadius: '18px', padding: '1.5rem', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(108,99,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.2rem' }}>📅 Platform Appointments</h2>
                <p style={{ fontSize: '0.8rem', color: textSecondary, margin: 0 }}>Review appointments, update booking statuses, and manage schedules</p>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <input
                  type="text"
                  placeholder="Search user or counsellor..."
                  value={apptSearch}
                  onChange={(e) => setApptSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadAppointments(1)}
                  style={{
                    padding: '0.5rem 0.85rem', borderRadius: '10px',
                    border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa',
                    color: textPrimary, fontSize: '0.82rem',
                  }}
                />
                <select
                  value={apptStatusFilter}
                  onChange={(e) => { setApptStatusFilter(e.target.value); }}
                  style={{
                    padding: '0.5rem 0.85rem', borderRadius: '10px',
                    border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa',
                    color: textPrimary, fontSize: '0.82rem',
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="accepted">Accepted</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={() => loadAppointments(1)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: 'none', background: '#ff6b6b', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Filter
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: surfaceBorder, color: textSecondary, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Patient / User</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Counsellor</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Scheduled Time</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Duration</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Notes / Context</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingAppointments ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: textSecondary }}>Loading appointments...</td>
                    </tr>
                  ) : appointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: textSecondary }}>No appointments found.</td>
                    </tr>
                  ) : (
                    appointments.map((a) => {
                      const statusColorMap = {
                        pending: '#f59e0b',
                        confirmed: '#10b981',
                        accepted: '#10b981',
                        completed: '#3b82f6',
                        cancelled: '#6b7280',
                        rejected: '#ef4444',
                      };
                      const color = statusColorMap[a.status] || '#6c63ff';

                      return (
                        <tr key={a._id || a.id} style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(108,99,255,0.05)'}` }}>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <div style={{ fontWeight: 600 }}>{a.user?.name || 'User'}</div>
                            <div style={{ fontSize: '0.72rem', color: textSecondary }}>{a.user?.email || '—'}</div>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <div style={{ fontWeight: 600 }}>{a.counsellor?.name || 'Counsellor'}</div>
                            <div style={{ fontSize: '0.72rem', color: textSecondary }}>{a.counsellor?.email || '—'}</div>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <div>{new Date(a.scheduledAt).toLocaleDateString()}</div>
                            <div style={{ fontSize: '0.74rem', color: textSecondary }}>
                              {new Date(a.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', color: textSecondary }}>
                            {a.duration || 60} mins
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <span style={{
                              padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                              textTransform: 'uppercase',
                              background: `${color}18`, color, border: `1px solid ${color}30`,
                            }}>
                              {a.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', color: textSecondary, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.notes || a.reason || '—'}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                            <select
                              value={a.status}
                              onChange={(e) => handleUpdateAppointment(a._id || a.id, e.target.value)}
                              style={{
                                padding: '0.3rem 0.5rem', borderRadius: '6px', border: surfaceBorder,
                                background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', color: textPrimary, fontSize: '0.74rem',
                                cursor: 'pointer',
                              }}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirm</option>
                              <option value="accepted">Accept</option>
                              <option value="completed">Complete</option>
                              <option value="cancelled">Cancel</option>
                              <option value="rejected">Reject</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {apptPagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  disabled={apptPagination.page <= 1}
                  onClick={() => loadAppointments(apptPagination.page - 1)}
                  style={{
                    padding: '0.4rem 0.8rem', borderRadius: '8px', border: surfaceBorder,
                    background: 'transparent', color: textPrimary, cursor: apptPagination.page <= 1 ? 'not-allowed' : 'pointer',
                    opacity: apptPagination.page <= 1 ? 0.4 : 1, fontSize: '0.8rem',
                  }}
                >
                  ← Previous
                </button>
                <span style={{ fontSize: '0.8rem', color: textSecondary }}>
                  Page {apptPagination.page} of {apptPagination.pages}
                </span>
                <button
                  disabled={apptPagination.page >= apptPagination.pages}
                  onClick={() => loadAppointments(apptPagination.page + 1)}
                  style={{
                    padding: '0.4rem 0.8rem', borderRadius: '8px', border: surfaceBorder,
                    background: 'transparent', color: textPrimary, cursor: apptPagination.page >= apptPagination.pages ? 'not-allowed' : 'pointer',
                    opacity: apptPagination.page >= apptPagination.pages ? 0.4 : 1, fontSize: '0.8rem',
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 5: WELLNESS ACTIVITIES MANAGEMENT
        ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'activities' && (
          <div style={{ background: surfaceBg, border: surfaceBorder, borderRadius: '18px', padding: '1.5rem', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(108,99,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.2rem' }}>🌿 Wellness Activities Management</h2>
                <p style={{ fontSize: '0.8rem', color: textSecondary, margin: 0 }}>Configure guided breathwork, meditation exercises, mindfulness tasks, and habits</p>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadActivities()}
                  style={{
                    padding: '0.5rem 0.85rem', borderRadius: '10px',
                    border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa',
                    color: textPrimary, fontSize: '0.82rem',
                  }}
                />
                <select
                  value={activityCategoryFilter}
                  onChange={(e) => { setActivityCategoryFilter(e.target.value); }}
                  style={{
                    padding: '0.5rem 0.85rem', borderRadius: '10px',
                    border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa',
                    color: textPrimary, fontSize: '0.82rem',
                  }}
                >
                  <option value="All">All Categories</option>
                  <option value="Breathing">Breathing</option>
                  <option value="Meditation">Meditation</option>
                  <option value="Movement">Movement</option>
                  <option value="Sleep">Sleep</option>
                  <option value="Journaling">Journaling</option>
                  <option value="Focus">Focus</option>
                  <option value="Relaxation">Relaxation</option>
                </select>
                <button
                  onClick={() => setActivityModal({
                    open: true,
                    mode: 'create',
                    data: {
                      title: '',
                      description: '',
                      category: 'Relaxation',
                      duration: '5 min',
                      difficulty: 'beginner',
                      icon: '🌿',
                      color: '#6c63ff',
                      tags: 'wellness, mindfulness',
                      instructions: 'Find a comfortable space.\nFocus on your breath.',
                      isActive: true,
                    },
                  })}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '10px', border: 'none',
                    background: brandGradient, color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(255,107,107,0.3)',
                  }}
                >
                  + Create Activity
                </button>
              </div>
            </div>

            {loadingActivities ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: textSecondary }}>Loading wellness activities...</div>
            ) : activities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: textSecondary }}>No activities found.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.25rem' }}>
                {activities.map((act) => (
                  <div
                    key={act._id || act.id}
                    style={{
                      padding: '1.25rem', borderRadius: '16px',
                      background: isDark ? 'rgba(255,255,255,0.03)' : '#fcfbfe',
                      border: surfaceBorder, display: 'flex', flexDirection: 'column', gap: '0.65rem',
                      opacity: act.isActive ? 1 : 0.65,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{
                          width: 38, height: 38, borderRadius: '10px', background: `${act.color || '#6c63ff'}20`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
                        }}>
                          {act.icon || '🌿'}
                        </span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>{act.title}</div>
                          <span style={{ fontSize: '0.72rem', color: act.color || '#6c63ff', fontWeight: 700 }}>
                            {act.category} · {act.duration}
                          </span>
                        </div>
                      </div>

                      <span style={{
                        padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700,
                        background: act.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)',
                        color: act.isActive ? '#10b981' : '#6b7280',
                      }}>
                        {act.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: textSecondary, margin: '0.2rem 0', lineHeight: 1.4 }}>
                      {act.description}
                    </p>

                    {act.tags?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {act.tags.map((t, idx) => (
                          <span key={idx} style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: textSecondary }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.6rem', borderTop: surfaceBorder }}>
                      <button
                        onClick={() => setActivityModal({
                          open: true,
                          mode: 'edit',
                          data: {
                            ...act,
                            tags: Array.isArray(act.tags) ? act.tags.join(', ') : act.tags,
                            instructions: Array.isArray(act.instructions) ? act.instructions.join('\n') : act.instructions,
                          },
                        })}
                        style={{
                          flex: 1, padding: '0.4rem', borderRadius: '8px', border: surfaceBorder,
                          background: 'transparent', color: textPrimary, fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleToggleActivity(act._id || act.id)}
                        style={{
                          padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none',
                          background: act.isActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                          color: act.isActive ? '#ef4444' : '#10b981', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        {act.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmModal({ open: true, type: 'activity', id: act._id || act.id, title: `Activity: ${act.title}` })}
                        style={{
                          padding: '0.4rem 0.65rem', borderRadius: '8px', border: 'none',
                          background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', fontSize: '0.76rem', cursor: 'pointer',
                        }}
                        title="Delete activity"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Footer Link ────────────────────────────────────────── */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link to="/" style={{ color: textSecondary, textDecoration: 'none', fontSize: '0.82rem', opacity: 0.8 }}>
            ← Back to MindEase Homepage
          </Link>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════
          MODALS SECTION
      ═══════════════════════════════════════════════════════════ */}

      {/* Role Change Modal */}
      {roleChangeModal.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
        }}>
          <div style={{
            background: isDark ? '#1a1830' : '#ffffff', border: surfaceBorder,
            borderRadius: '16px', padding: '1.5rem', maxWidth: 400, width: '100%',
            boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Change Account Role</h3>
            <p style={{ fontSize: '0.84rem', color: textSecondary, marginBottom: '1rem' }}>
              Assign new system permissions for <strong>{roleChangeModal.user?.name}</strong>:
            </p>

            <select
              value={roleChangeModal.newRole}
              onChange={(e) => setRoleChangeModal((m) => ({ ...m, newRole: e.target.value }))}
              style={{
                width: '100%', padding: '0.65rem', borderRadius: '10px',
                border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.06)' : '#fafafa',
                color: textPrimary, fontSize: '0.9rem', marginBottom: '1.25rem',
              }}
            >
              <option value="user">User (Standard account)</option>
              <option value="counsellor">Counsellor (Licensed practitioner)</option>
              <option value="admin">Administrator (Platform full access)</option>
            </select>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRoleChangeModal({ open: false, user: null, newRole: 'user' })}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: surfaceBorder, background: 'transparent', color: textPrimary, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRoleChange}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#6c63ff', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                Save Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
        }}>
          <div style={{
            background: isDark ? '#1a1830' : '#ffffff', border: surfaceBorder,
            borderRadius: '16px', padding: '1.5rem', maxWidth: 420, width: '100%',
            boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#ff6b6b' }}>
              ⚠️ Confirm Deletion
            </h3>
            <p style={{ fontSize: '0.84rem', color: textSecondary, marginBottom: '1.25rem', lineHeight: 1.4 }}>
              Are you sure you want to permanently delete <strong>{deleteConfirmModal.title}</strong>? This action cannot be reversed.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirmModal({ open: false, type: '', id: '', title: '' })}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: surfaceBorder, background: 'transparent', color: textPrimary, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Counsellor Edit Profile Modal */}
      {counsellorModal.open && counsellorModal.data && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
        }}>
          <div style={{
            background: isDark ? '#1a1830' : '#ffffff', border: surfaceBorder,
            borderRadius: '18px', padding: '1.5rem', maxWidth: 500, width: '100%',
            boxShadow: '0 12px 36px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.4rem' }}>
              Edit Counsellor Profile
            </h3>
            <p style={{ fontSize: '0.82rem', color: textSecondary, marginBottom: '1rem' }}>
              {counsellorModal.data.user?.name} ({counsellorModal.data.user?.email})
            </p>

            <form onSubmit={handleSaveCounsellorProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Specialization</label>
                <input
                  type="text"
                  required
                  value={counsellorModal.data.specialization || ''}
                  onChange={(e) => setCounsellorModal((m) => ({ ...m, data: { ...m.data, specialization: e.target.value } }))}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa', color: textPrimary }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={counsellorModal.data.experience ?? ''}
                    onChange={(e) => setCounsellorModal((m) => ({ ...m, data: { ...m.data, experience: e.target.value } }))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa', color: textPrimary }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Location / Mode</label>
                  <input
                    type="text"
                    value={counsellorModal.data.location || ''}
                    onChange={(e) => setCounsellorModal((m) => ({ ...m, data: { ...m.data, location: e.target.value } }))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa', color: textPrimary }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Professional Bio / Description</label>
                <textarea
                  rows={4}
                  required
                  value={counsellorModal.data.description || ''}
                  onChange={(e) => setCounsellorModal((m) => ({ ...m, data: { ...m.data, description: e.target.value } }))}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa', color: textPrimary, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCounsellorModal({ open: false, data: null })}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: surfaceBorder, background: 'transparent', color: textPrimary, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', background: '#4ecdc4', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Wellness Activity Modal */}
      {activityModal.open && activityModal.data && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
        }}>
          <div style={{
            background: isDark ? '#1a1830' : '#ffffff', border: surfaceBorder,
            borderRadius: '18px', padding: '1.5rem', maxWidth: 540, width: '100%',
            boxShadow: '0 12px 36px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.3rem' }}>
              {activityModal.mode === 'create' ? '✨ Create Wellness Activity' : '✏️ Edit Wellness Activity'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: textSecondary, marginBottom: '1rem' }}>
              Configure activity details, guidelines, and target tags
            </p>

            <form onSubmit={handleSaveActivity} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 4-7-8 Breathing Technique"
                  value={activityModal.data.title || ''}
                  onChange={(e) => setActivityModal((m) => ({ ...m, data: { ...m.data, title: e.target.value } }))}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa', color: textPrimary }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Category</label>
                  <select
                    value={activityModal.data.category || 'Relaxation'}
                    onChange={(e) => setActivityModal((m) => ({ ...m, data: { ...m.data, category: e.target.value } }))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa', color: textPrimary }}
                  >
                    <option value="Breathing">Breathing</option>
                    <option value="Meditation">Meditation</option>
                    <option value="Movement">Movement</option>
                    <option value="Sleep">Sleep</option>
                    <option value="Journaling">Journaling</option>
                    <option value="Focus">Focus</option>
                    <option value="Relaxation">Relaxation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Duration</label>
                  <input
                    type="text"
                    placeholder="e.g., 5 min"
                    value={activityModal.data.duration || ''}
                    onChange={(e) => setActivityModal((m) => ({ ...m, data: { ...m.data, duration: e.target.value } }))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa', color: textPrimary }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Difficulty</label>
                  <select
                    value={activityModal.data.difficulty || 'beginner'}
                    onChange={(e) => setActivityModal((m) => ({ ...m, data: { ...m.data, difficulty: e.target.value } }))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa', color: textPrimary }}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Icon (Emoji)</label>
                  <input
                    type="text"
                    value={activityModal.data.icon || '🌿'}
                    onChange={(e) => setActivityModal((m) => ({ ...m, data: { ...m.data, icon: e.target.value } }))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa', color: textPrimary }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Theme Color</label>
                  <input
                    type="text"
                    placeholder="#6c63ff"
                    value={activityModal.data.color || '#6c63ff'}
                    onChange={(e) => setActivityModal((m) => ({ ...m, data: { ...m.data, color: e.target.value } }))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa', color: textPrimary }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Short overview of benefits and intent..."
                  value={activityModal.data.description || ''}
                  onChange={(e) => setActivityModal((m) => ({ ...m, data: { ...m.data, description: e.target.value } }))}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa', color: textPrimary }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Tags (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="calm, breathing, sleep, focus"
                  value={activityModal.data.tags || ''}
                  onChange={(e) => setActivityModal((m) => ({ ...m, data: { ...m.data, tags: e.target.value } }))}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa', color: textPrimary }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Instructions (One step per line)</label>
                <textarea
                  rows={3}
                  placeholder="Step 1: Sit straight\nStep 2: Breathe deeply"
                  value={activityModal.data.instructions || ''}
                  onChange={(e) => setActivityModal((m) => ({ ...m, data: { ...m.data, instructions: e.target.value } }))}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa', color: textPrimary }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="activity-active-toggle"
                  checked={activityModal.data.isActive ?? true}
                  onChange={(e) => setActivityModal((m) => ({ ...m, data: { ...m.data, isActive: e.target.checked } }))}
                />
                <label htmlFor="activity-active-toggle" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Active (Visible to users)</label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setActivityModal({ open: false, mode: 'create', data: null })}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: surfaceBorder, background: 'transparent', color: textPrimary, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', background: brandGradient, color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  {activityModal.mode === 'create' ? 'Create Activity' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
