/**
 * components/dashboard/DashboardShell.jsx
 * Shared layout shell for the user dashboard.
 *
 * Provides:
 *   - Fixed left sidebar (desktop) / bottom nav (mobile)
 *   - Top header bar with greeting, avatar, theme toggle
 *   - Scrollable main content area
 *   - Responsive: sidebar collapses at ≤768px
 */

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { getInitials } from '../../utils/helpers';
import NotificationDropdown from './NotificationDropdown';

// ── Nav items ─────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: '🏠', label: 'Overview',    path: '/dashboard/user',              id: 'nav-overview' },
  { icon: '🌿', label: 'My Journey',  path: '/dashboard/user/journey',      id: 'nav-journey'  },
  { icon: '📊', label: 'Mood',        path: '/dashboard/user/mood',         id: 'nav-mood' },
  { icon: '📋', label: 'Check-in',    path: '/dashboard/user/checkin',      id: 'nav-checkin' },
  { icon: '🤖', label: 'AI Chat',     path: '/dashboard/user/chat',         id: 'nav-chat' },
  { icon: '🧘', label: 'Relax',       path: '/dashboard/user/relax',        id: 'nav-relax'  },
  { icon: '🎮', label: 'Games',       path: '/dashboard/user/games',        id: 'nav-games'  },
  { icon: '📅', label: 'Appointments',path: '/dashboard/user/appointments', id: 'nav-appointments' },
  { icon: '📝', label: 'Journal',     path: '/dashboard/user/journal',      id: 'nav-journal' },
  { icon: '🏆', label: 'Challenges',  path: '/dashboard/user/challenges',   id: 'nav-challenges' },
];

// ── Sidebar ────────────────────────────────────────────────────
const Sidebar = ({ collapsed, onToggle }) => {
  const { isDark } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0,
      width: collapsed ? 72 : 240,
      display: 'flex', flexDirection: 'column',
      background: isDark ? 'rgba(15,14,26,0.95)' : '#fff',
      borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.08)'}`,
      backdropFilter: 'blur(20px)',
      transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
      zIndex: 200,
      overflow: 'hidden',
    }}>
      {/* Logo + collapse toggle */}
      <div style={{
        padding: collapsed ? '1.25rem 0' : '1.25rem 1rem',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.07)'}`,
        minHeight: 64,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 30, height: 30, borderRadius: '8px', background: 'linear-gradient(135deg,#6c63ff,#4ecdc4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>🧠</span>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1rem', background: 'linear-gradient(135deg,#6c63ff,#4ecdc4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', whiteSpace: 'nowrap' }}>MindEase</span>
          </div>
        )}
        {collapsed && <span style={{ fontSize: '1.1rem' }}>🧠</span>}
        <button
          id="sidebar-toggle-btn"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: 28, height: 28, borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.15)'}`,
            background: 'transparent', cursor: 'pointer', color: isDark ? 'rgba(232,230,255,0.6)' : '#6c63ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
            transition: 'all 0.2s', flexShrink: 0,
          }}
        >{collapsed ? '→' : '←'}</button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0.75rem 0', overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ icon, label, path, id }) => (
          <NavLink key={path} to={path} end={path === '/dashboard/user'} id={id}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center',
              gap: collapsed ? 0 : '0.75rem',
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '0.75rem' : '0.65rem 1rem',
              margin: '0.1rem 0.5rem',
              borderRadius: '10px',
              textDecoration: 'none',
              background: isActive ? (isDark ? 'rgba(108,99,255,0.15)' : 'rgba(108,99,255,0.09)') : 'transparent',
              color: isActive ? '#6c63ff' : (isDark ? 'rgba(232,230,255,0.65)' : 'rgba(26,26,46,0.65)'),
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              borderLeft: isActive ? '3px solid #6c63ff' : '3px solid transparent',
            })}
            title={collapsed ? label : undefined}
          >
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{icon}</span>
            {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{
        padding: collapsed ? '1rem 0' : '1rem',
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.07)'}`,
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : '0.65rem',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <div style={{ width: 32, height: 32, borderRadius: '9px', background: 'linear-gradient(135deg,#6c63ff,#4ecdc4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.78rem', flexShrink: 0 }}>
          {getInitials(user?.name || '')}
        </div>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isDark ? '#e8e6ff' : '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
          </div>
        )}
        {!collapsed && (
          <button id="sidebar-logout-btn" onClick={handleLogout} title="Sign out"
            style={{ padding: '0.3rem', borderRadius: '7px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1rem', opacity: 0.5, transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
          >🚪</button>
        )}
      </div>
    </aside>
  );
};

// ── Top header ─────────────────────────────────────────────────
const TopHeader = ({ greeting }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '1rem 1.5rem',
      background: isDark ? 'rgba(15,14,26,0.85)' : 'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.07)'}`,
      position: 'sticky', top: 0, zIndex: 100,
      gap: '1rem', flexWrap: 'wrap',
    }}>
      <div>
        <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 'clamp(1rem,2.5vw,1.25rem)', fontWeight: 700, color: isDark ? '#e8e6ff' : '#1a1a2e', margin: 0, lineHeight: 1.3 }}>
          {greeting}, <span style={{ background: 'linear-gradient(135deg,#6c63ff,#4ecdc4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: '0.15rem 0 0', fontWeight: 400 }}>{dateStr} · {timeStr}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {/* Notification bell container */}
        <div style={{ position: 'relative' }}>
          <button
            id="header-notifications-btn"
            onClick={() => setDropdownOpen((prev) => !prev)}
            title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'Notifications'}
            style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              border: `1.5px solid ${dropdownOpen ? '#6c63ff' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.15)')}`,
              background: dropdownOpen
                ? (isDark ? 'rgba(108,99,255,0.2)' : 'rgba(108,99,255,0.1)')
                : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(108,99,255,0.04)'),
              cursor: 'pointer',
              fontSize: '1.05rem',
              position: 'relative',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span
                id="header-notifications-count-badge"
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  background: 'linear-gradient(135deg,#ff4757,#ff6b6b)',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  boxShadow: '0 2px 6px rgba(255,71,87,0.4)',
                  border: `1.5px solid ${isDark ? '#0f0e1a' : '#ffffff'}`,
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Interactive dropdown */}
          <NotificationDropdown
            isOpen={dropdownOpen}
            onClose={() => setDropdownOpen(false)}
          />
        </div>

        {/* Theme toggle */}
        <button id="header-theme-btn" onClick={toggleTheme} title="Toggle theme"
          style={{ width: 38, height: 38, borderRadius: '10px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.15)'}`, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(108,99,255,0.04)', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s' }}
        >{isDark ? '☀️' : '🌙'}</button>
      </div>
    </div>
  );
};

// ── Shell export ───────────────────────────────────────────────
const DashboardShell = ({ children }) => {
  const { isDark } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const sidebarW = collapsed ? 72 : 240;

  return (
    <div style={{ minHeight: '100vh', background: isDark ? 'linear-gradient(160deg,#0f0e1a 0%,#1a1830 100%)' : 'linear-gradient(160deg,#f8f7ff 0%,#f0eeff 100%)' }}>
      {/* Desktop sidebar */}
      <div className="dashboard-sidebar-wrap" style={{ display: 'block' }}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      </div>

      {/* Main area */}
      <div style={{
        marginLeft: sidebarW,
        transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
      }}>
        <TopHeader greeting={greeting} />
        <main style={{ flex: 1, padding: 'clamp(1rem,2vw,1.75rem)', maxWidth: 1200, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {children}
        </main>
      </div>

      {/* Responsive: push sidebar off on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .dashboard-sidebar-wrap { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default DashboardShell;
