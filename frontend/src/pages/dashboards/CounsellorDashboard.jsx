/**
 * pages/dashboards/CounsellorDashboard.jsx
 * Counsellor role dashboard — Part 15.
 *
 * Provides:
 * - Real-time appointment counts (pending, accepted, completed)
 * - Counsellor profile summary card with status
 * - Quick action links to Profile (`/dashboard/counsellor/profile`)
 *   and Appointments (`/dashboard/counsellor/appointments`)
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getInitials } from '../../utils/helpers';
import * as counsellorService from '../../services/counsellorService';

const CounsellorDashboard = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();

  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        const [profData, apptsData] = await Promise.allSettled([
          counsellorService.getMyProfile(),
          counsellorService.getMyAppointments(),
        ]);
        if (isMounted) {
          if (profData.status === 'fulfilled') setProfile(profData.value);
          if (apptsData.status === 'fulfilled') setAppointments(apptsData.value || []);
        }
      } catch {
        // Fallbacks are graceful
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDashboardData();
    return () => { isMounted = false; };
  }, []);

  const pendingRequests = appointments.filter(a => a.status === 'pending').length;
  const scheduledSessions = appointments.filter(a => a.status === 'accepted' || a.status === 'confirmed').length;
  const completedSessions = appointments.filter(a => a.status === 'completed').length;

  const bg = isDark ? 'linear-gradient(135deg, #0f0e1a, #1a1830)' : 'linear-gradient(135deg, #f8f7ff, #edf8f5)';
  const cardBg = isDark ? 'rgba(26,24,48,0.85)' : '#fff';
  const cardBorder = isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(108,99,255,0.1)';
  const textPrimary = isDark ? '#e8e6ff' : '#1a1a2e';
  const textSecondary = isDark ? 'rgba(232,230,255,0.6)' : 'rgba(26,26,46,0.6)';

  const counsellorDisplayName = profile?.user?.name || user?.name || 'Counsellor';
  const displayImage = profile?.profileImage;

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 34, height: 34, borderRadius: '10px', background: 'linear-gradient(135deg, #4ecdc4, #6c63ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🧠</span>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.1rem', background: 'linear-gradient(135deg, #4ecdc4, #6c63ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>MindEase</span>
            <span style={{ padding: '0.2rem 0.7rem', borderRadius: '9999px', background: 'rgba(78,205,196,0.12)', border: '1px solid rgba(78,205,196,0.25)', fontSize: '0.75rem', fontWeight: 600, color: '#4ecdc4', marginLeft: '0.25rem' }}>Counsellor</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {displayImage ? (
              <img src={displayImage} alt="Avatar" style={{ width: 38, height: 38, borderRadius: '10px', objectFit: 'cover', border: '1px solid #4ecdc4' }} />
            ) : (
              <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'linear-gradient(135deg, #4ecdc4, #6c63ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
                {getInitials(counsellorDisplayName)}
              </div>
            )}
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: textPrimary }}>{counsellorDisplayName}</div>
              <div style={{ fontSize: '0.75rem', color: '#4ecdc4', fontWeight: 500 }}>
                {profile?.specialization || 'Licensed Counsellor'}
              </div>
            </div>
            <Link to="/dashboard/user/games" style={{ padding: '0.4rem 0.9rem', borderRadius: '9999px', background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)', color: '#6c63ff', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
              🎮 Play Games
            </Link>
            <button onClick={logout} id="counsellor-dashboard-logout" style={{ padding: '0.4rem 0.9rem', borderRadius: '9999px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(78,205,196,0.3)'}`, background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', color: textSecondary }}>
              Sign out
            </button>
          </div>
        </div>

        {/* Welcome banner */}
        <div style={{ padding: '2.25rem', borderRadius: '1.5rem', marginBottom: '1.75rem', background: 'linear-gradient(135deg, #4ecdc4, #6c63ff)', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 36px rgba(78,205,196,0.3)' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.3rem, 3vw, 1.9rem)', fontWeight: 800, color: '#fff', marginBottom: '0.4rem' }}>
            Welcome, Dr. {counsellorDisplayName.split(' ')[0]} 👨‍⚕️
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.92rem', maxWidth: 600, margin: 0 }}>
            Your professional clinical dashboard. Manage your public profile, review client appointment requests, and handle sessions.
          </p>
        </div>

        {/* Profile Alert banner (if profile is not setup yet) */}
        {!isLoading && !profile && (
          <div style={{ padding: '1.25rem', borderRadius: '1rem', background: 'rgba(247, 197, 159, 0.15)', border: '1px solid rgba(247, 197, 159, 0.3)', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.6rem' }}>ℹ️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f7c59f' }}>Complete your counsellor profile</div>
                <div style={{ fontSize: '0.82rem', color: textSecondary }}>Add your specialization, bio, experience, and availability slots to start accepting appointments.</div>
              </div>
            </div>
            <Link to="/dashboard/counsellor/profile" style={{ padding: '0.5rem 1.2rem', borderRadius: '9999px', background: '#f7c59f', color: '#1a1a2e', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
              Setup Profile →
            </Link>
          </div>
        )}

        {/* Quick stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ padding: '1.35rem', borderRadius: '1.1rem', background: cardBg, border: cardBorder, textAlign: 'center', boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.2)' : '0 4px 16px rgba(108,99,255,0.05)' }}>
            <div style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>⏳</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.75rem', fontWeight: 800, color: '#f7c59f', marginBottom: '0.2rem' }}>
              {isLoading ? '…' : pendingRequests}
            </div>
            <div style={{ fontSize: '0.82rem', color: textSecondary }}>Pending Requests</div>
          </div>

          <div style={{ padding: '1.35rem', borderRadius: '1.1rem', background: cardBg, border: cardBorder, textAlign: 'center', boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.2)' : '0 4px 16px rgba(108,99,255,0.05)' }}>
            <div style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>✅</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.75rem', fontWeight: 800, color: '#4ecdc4', marginBottom: '0.2rem' }}>
              {isLoading ? '…' : scheduledSessions}
            </div>
            <div style={{ fontSize: '0.82rem', color: textSecondary }}>Scheduled Sessions</div>
          </div>

          <div style={{ padding: '1.35rem', borderRadius: '1.1rem', background: cardBg, border: cardBorder, textAlign: 'center', boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.2)' : '0 4px 16px rgba(108,99,255,0.05)' }}>
            <div style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>🎉</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.75rem', fontWeight: 800, color: '#6c63ff', marginBottom: '0.2rem' }}>
              {isLoading ? '…' : completedSessions}
            </div>
            <div style={{ fontSize: '0.82rem', color: textSecondary }}>Completed Sessions</div>
          </div>

          <div style={{ padding: '1.35rem', borderRadius: '1.1rem', background: cardBg, border: cardBorder, textAlign: 'center', boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.2)' : '0 4px 16px rgba(108,99,255,0.05)' }}>
            <div style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>💼</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.75rem', fontWeight: 800, color: '#4ecdc4', marginBottom: '0.2rem' }}>
              {profile ? `${profile.experience || 0} yrs` : '—'}
            </div>
            <div style={{ fontSize: '0.82rem', color: textSecondary }}>Experience</div>
          </div>
        </div>

        {/* Primary Action Modules */}
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', fontWeight: 700, color: textPrimary, marginBottom: '1rem' }}>
          Active Workspaces
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>

          {/* Module 1: Appointments */}
          <Link
            to="/dashboard/counsellor/appointments"
            id="counsellor-appointments-module"
            style={{
              textDecoration: 'none',
              padding: '1.75rem',
              borderRadius: '1.25rem',
              background: cardBg,
              border: cardBorder,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: isDark ? '0 6px 24px rgba(0,0,0,0.25)' : '0 6px 24px rgba(108,99,255,0.07)',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = '#4ecdc4';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.1)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'rgba(78,205,196,0.15)', border: '1px solid rgba(78,205,196,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                📅
              </div>
              {pendingRequests > 0 && (
                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(247,197,159,0.2)', border: '1px solid #f7c59f', color: '#f7c59f', fontSize: '0.78rem', fontWeight: 700 }}>
                  {pendingRequests} pending
                </span>
              )}
            </div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: textPrimary, margin: '0 0 0.5rem 0' }}>
              Appointment Management
            </h3>
            <p style={{ color: textSecondary, fontSize: '0.875rem', lineHeight: 1.5, margin: 0, flex: 1 }}>
              Review appointment requests, accept or reject incoming bookings, manage scheduled sessions, and mark appointments as completed.
            </p>
            <div style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: '#4ecdc4', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              Open Appointment Hub →
            </div>
          </Link>

          {/* Module 2: Profile */}
          <Link
            to="/dashboard/counsellor/profile"
            id="counsellor-profile-module"
            style={{
              textDecoration: 'none',
              padding: '1.75rem',
              borderRadius: '1.25rem',
              background: cardBg,
              border: cardBorder,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: isDark ? '0 6px 24px rgba(0,0,0,0.25)' : '0 6px 24px rgba(108,99,255,0.07)',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = '#6c63ff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.1)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                👤
              </div>
              <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', background: profile ? 'rgba(78,205,196,0.15)' : 'rgba(255,107,107,0.15)', color: profile ? '#4ecdc4' : '#ff6b6b', fontSize: '0.78rem', fontWeight: 600 }}>
                {profile ? (profile.isActive ? 'Active' : 'Inactive') : 'Unconfigured'}
              </span>
            </div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: textPrimary, margin: '0 0 0.5rem 0' }}>
              Counsellor Profile
            </h3>
            <p style={{ color: textSecondary, fontSize: '0.875rem', lineHeight: 1.5, margin: 0, flex: 1 }}>
              View and edit your public profile details: Name, Specialization, Experience, Bio description, Location, Availability slots, and Profile photo.
            </p>
            <div style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: '#6c63ff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              Manage Profile & Availability →
            </div>
          </Link>

        </div>

        {/* Security Role Notice */}
        <div style={{ padding: '0.875rem 1.1rem', borderRadius: '0.875rem', marginBottom: '1.75rem', background: isDark ? 'rgba(78,205,196,0.08)' : 'rgba(78,205,196,0.07)', border: '1px solid rgba(78,205,196,0.2)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: textSecondary }}>
          <span>🔐</span>
          <span>Role verification active: Counsellor workspace is restricted to certified counsellors. User appointment booking is handled in user portal.</span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link to="/" style={{ color: '#4ecdc4', fontSize: '0.85rem', textDecoration: 'none', opacity: 0.7 }}>
            ← MindEase Home
          </Link>
        </div>

      </div>
    </div>
  );
};

export default CounsellorDashboard;
