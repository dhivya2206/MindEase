/**
 * pages/DashboardPage.jsx
 * Protected landing page after login — Part 3.
 * Placeholder that shows the authenticated user's info.
 * Will be fleshed out in Part 4+ (mood, chat, etc.).
 */

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getInitials, formatDate } from '../utils/helpers';

// ── Quick-action card ──────────────────────────────────────────
const QuickCard = ({ icon, title, desc, to, color, isDark }) => (
  <Link
    to={to}
    style={{
      display: 'block', padding: '1.5rem', borderRadius: '1.25rem', textDecoration: 'none',
      background: isDark ? 'rgba(26,24,48,0.8)' : '#fff',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.08)'}`,
      boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(108,99,255,0.06)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = isDark ? '0 12px 36px rgba(0,0,0,0.4)' : '0 12px 36px rgba(108,99,255,0.14)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(108,99,255,0.06)'; }}
  >
    <div style={{ width: 44, height: 44, borderRadius: '12px', background: `${color}20`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', marginBottom: '1rem' }}>{icon}</div>
    <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1rem', fontWeight: 700, color: isDark ? '#e8e6ff' : '#1a1a2e', marginBottom: '0.4rem' }}>{title}</h3>
    <p style={{ fontSize: '0.85rem', opacity: 0.6, lineHeight: 1.5, margin: 0 }}>{desc}</p>
    <div style={{ marginTop: '1rem', fontSize: '0.8rem', color, fontWeight: 600 }}>Coming soon →</div>
  </Link>
);

const quickActions = [
  { icon: '📊', title: 'Mood Check-In', desc: 'Log how you\'re feeling today and track your emotional patterns.', to: '/dashboard/mood', color: '#4ecdc4' },
  { icon: '🤖', title: 'AI Chat', desc: 'Talk to your AI wellness companion anytime you need support.', to: '/dashboard/chat', color: '#6c63ff' },
  { icon: '🧘', title: 'Guided Meditation', desc: 'Access breathing exercises and mindfulness sessions.', to: '/dashboard/meditate', color: '#ff6b6b' },
  { icon: '📅', title: 'Book a Session', desc: 'Schedule a session with a licensed therapist.', to: '/dashboard/appointments', color: '#f7c59f' },
];

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const initials = getInitials(user?.name || '');
  const joinDate = user?.createdAt ? formatDate(user.createdAt, { dateStyle: 'long' }) : '';

  const handleLogout = async () => {
    await logout();
    // AuthContext clears state; ProtectedRoute will redirect to /auth/login
  };

  return (
    <div style={{ minHeight: '100vh', background: isDark ? 'linear-gradient(135deg, #0f0e1a, #1a1830)' : 'linear-gradient(135deg, #f8f7ff, #f0eeff)', padding: '2rem' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 34, height: 34, borderRadius: '10px', background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🧠</span>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.1rem', background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>MindEase</span>
          </div>

          {/* User + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isDark ? '#e8e6ff' : '#1a1a2e' }}>{user?.name}</div>
              <div style={{ fontSize: '0.78rem', opacity: 0.5 }}>{user?.email}</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
              {initials}
            </div>
            <button
              id="dashboard-logout-btn"
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1.1rem', borderRadius: '9999px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(108,99,255,0.2)'}`,
                background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                color: isDark ? 'rgba(232,230,255,0.7)' : 'rgba(26,26,46,0.6)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.target.style.borderColor = '#ff6b6b'; e.target.style.color = '#ff6b6b'; }}
              onMouseLeave={e => { e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(108,99,255,0.2)'; e.target.style.color = isDark ? 'rgba(232,230,255,0.7)' : 'rgba(26,26,46,0.6)'; }}
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Welcome banner */}
        <div style={{
          padding: '2.5rem', borderRadius: '1.5rem', marginBottom: '2rem',
          background: 'linear-gradient(135deg, #6c63ff 0%, #4ecdc4 100%)',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(108,99,255,0.35)',
        }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, right: 80, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
            Welcome back, {user?.name?.split(' ')[0]}! 🌟
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
            How are you feeling today? Your wellness journey continues here.
          </p>
          {joinDate && (
            <span style={{ display: 'inline-block', padding: '0.35rem 0.9rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.8rem', fontWeight: 500 }}>
              🗓 Member since {joinDate}
            </span>
          )}
        </div>

        {/* Auth success notice */}
        <div style={{
          padding: '1rem 1.25rem', borderRadius: '1rem', marginBottom: '2rem',
          background: isDark ? 'rgba(78,205,196,0.1)' : 'rgba(78,205,196,0.08)',
          border: '1px solid rgba(78,205,196,0.25)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.25rem' }}>🔐</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#4ecdc4' }}>Authentication working!</div>
            <div style={{ fontSize: '0.825rem', opacity: 0.7 }}>You're viewing a JWT-protected page. Your token is stored securely in localStorage.</div>
          </div>
        </div>

        {/* Quick actions grid */}
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: isDark ? '#e8e6ff' : '#1a1a2e', marginBottom: '1.25rem' }}>
          What would you like to do?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {quickActions.map(card => (
            <QuickCard key={card.title} {...card} isDark={isDark} />
          ))}
        </div>

        {/* Back to home link */}
        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <Link to="/" style={{ color: '#6c63ff', fontSize: '0.875rem', textDecoration: 'none', opacity: 0.7 }}>
            ← Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
