/**
 * layouts/AuthLayout.jsx
 * Standalone layout for login / signup pages.
 * No navbar — clean, centered, full-screen design.
 */

import { Outlet, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const AuthLayout = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: isDark
          ? 'linear-gradient(135deg, #0f0e1a 0%, #1a1830 50%, #0f1a18 100%)'
          : 'linear-gradient(135deg, #f8f7ff 0%, #f0eeff 50%, #edf8f7 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative orbs */}
      <div style={{
        position: 'absolute', top: '10%', left: '5%', width: 350, height: 350,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.2) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
        animation: 'float 7s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '5%', width: 250, height: 250,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(78,205,196,0.2) 0%, transparent 70%)',
        filter: 'blur(50px)', pointerEvents: 'none',
        animation: 'float 9s ease-in-out infinite reverse',
      }} />

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.25rem 2rem', position: 'relative', zIndex: 1,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <span style={{
            width: 34, height: 34, borderRadius: '10px',
            background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
          }}>🧠</span>
          <span style={{
            fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.1rem',
            background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>MindEase</span>
        </Link>

        <button
          onClick={toggleTheme}
          title="Toggle theme"
          style={{
            width: 36, height: 36, borderRadius: '10px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.15)'}`,
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.05)',
            cursor: 'pointer', fontSize: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >{isDark ? '☀️' : '🌙'}</button>
      </div>

      {/* Centered card area */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          width: '100%', maxWidth: 440,
          background: isDark ? 'rgba(26,24,48,0.85)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '1.75rem',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.1)'}`,
          boxShadow: isDark
            ? '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(108,99,255,0.1)'
            : '0 24px 64px rgba(108,99,255,0.12)',
          padding: '2.5rem',
          animation: 'fadeInUp 0.4s ease',
        }}>
          <Outlet />
        </div>
      </div>

      {/* Footer note */}
      <p style={{ textAlign: 'center', padding: '1rem', fontSize: '0.8rem', opacity: 0.4, position: 'relative', zIndex: 1 }}>
        © {new Date().getFullYear()} MindEase · Your data is encrypted and private
      </p>
    </div>
  );
};

export default AuthLayout;
