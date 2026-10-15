/**
 * layouts/MainLayout.jsx
 * Primary layout shell — Part 3 update: auth-aware Navbar.
 */

import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';

// ── Navbar ────────────────────────────────────────────────────
const Navbar = () => {
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout, dashboardPath } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/features', label: 'Features' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 2rem', height: '70px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: isDark ? 'rgba(15, 14, 26, 0.88)' : 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108, 99, 255, 0.08)'}`,
        transition: 'background 0.3s ease',
      }}
    >
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
        <span style={{ width: 36, height: 36, borderRadius: '12px', background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🧠</span>
        <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.25rem', background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>MindEase</span>
      </Link>

      {/* Nav links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {navLinks.map(({ to, label }) => (
          <NavLink key={to} to={to} end
            style={({ isActive }) => ({
              padding: '0.45rem 1rem', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: 500,
              textDecoration: 'none',
              color: isActive ? '#6c63ff' : isDark ? 'rgba(255,255,255,0.7)' : 'rgba(26, 26, 46, 0.7)',
              background: isActive ? (isDark ? 'rgba(108,99,255,0.15)' : 'rgba(108,99,255,0.08)') : 'transparent',
              transition: 'all 0.2s ease',
            })}
          >{label}</NavLink>
        ))}
      </nav>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Theme toggle */}
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            width: 40, height: 40, borderRadius: '12px',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.15)'}`,
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.05)',
            cursor: 'pointer', fontSize: '1.1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease',
          }}
        >{isDark ? '☀️' : '🌙'}</button>

        {/* Auth-aware CTA */}
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Link
              to={dashboardPath}
              id="nav-dashboard-btn"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.45rem 1rem', borderRadius: '9999px', textDecoration: 'none',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.2)'}`,
                fontSize: '0.875rem', fontWeight: 600,
                color: isDark ? 'rgba(232,230,255,0.8)' : '#6c63ff',
                transition: 'all 0.2s ease',
              }}
            >
              Dashboard
            </Link>
            {/* Avatar button */}
            <button
              id="nav-user-avatar"
              title={`Logged in as ${user?.name}`}
              onClick={handleLogout}
              style={{
                width: 36, height: 36, borderRadius: '10px',
                background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)',
                border: 'none', cursor: 'pointer', color: '#fff',
                fontWeight: 700, fontSize: '0.8rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                title: 'Click to log out',
              }}
            >
              {getInitials(user?.name || '')}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link
              to="/auth/login"
              id="nav-login-btn"
              style={{
                padding: '0.45rem 1rem', borderRadius: '9999px', textDecoration: 'none',
                fontSize: '0.875rem', fontWeight: 600,
                color: isDark ? 'rgba(232,230,255,0.7)' : 'rgba(26,26,46,0.7)',
              }}
            >Log in</Link>
            <Link
              to="/auth/signup"
              id="nav-signup-btn"
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '9999px', textDecoration: 'none',
                background: 'linear-gradient(135deg, #6c63ff, #5a4fd9)',
                color: '#fff', fontSize: '0.875rem', fontWeight: 700,
                boxShadow: '0 4px 16px rgba(108,99,255,0.35)',
                transition: 'all 0.2s ease',
              }}
            >Get Started</Link>
          </div>
        )}
      </div>
    </header>
  );
};

// ── Footer ────────────────────────────────────────────────────
const Footer = () => {
  const { isDark } = useTheme();
  return (
    <footer style={{ padding: '3rem 2rem 2rem', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.08)'}`, textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '1.2rem' }}>🧠</span>
        <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>MindEase</span>
      </div>
      <p style={{ fontSize: '0.85rem', opacity: 0.5, margin: 0 }}>
        © {new Date().getFullYear()} MindEase. All rights reserved. Built with 💜 for mental wellness.
      </p>
    </footer>
  );
};

// ── Main Layout ───────────────────────────────────────────────
const MainLayout = () => (
  <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
    <Navbar />
    <main style={{ flex: 1, paddingTop: '70px' }}>
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default MainLayout;
