/**
 * pages/NotFoundPage.jsx
 * Friendly 404 page.
 */

import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const NotFoundPage = () => {
  const { isDark } = useTheme();

  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
        background: isDark
          ? 'linear-gradient(135deg, #0f0e1a, #1a1830)'
          : 'linear-gradient(135deg, #f8f7ff, #f0eeff)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background orb */}
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108,99,255,0.2) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, animation: 'fadeInUp 0.5s ease' }}>
        {/* 404 display */}
        <div
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(6rem, 15vw, 10rem)',
            fontWeight: 900,
            lineHeight: 1,
            background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '0.5rem',
            filter: 'drop-shadow(0 8px 32px rgba(108,99,255,0.3))',
          }}
        >
          404
        </div>

        <div style={{ fontSize: '3rem', marginBottom: '1.5rem', animation: 'float 3s ease-in-out infinite' }}>
          🧩
        </div>

        <h1
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: 700,
            color: isDark ? '#e8e6ff' : '#1a1a2e',
            marginBottom: '1rem',
          }}
        >
          Page Not Found
        </h1>

        <p
          style={{
            fontSize: '1rem',
            opacity: 0.6,
            maxWidth: 400,
            margin: '0 auto 2.5rem',
            lineHeight: 1.6,
          }}
        >
          Looks like this page went on a mindfulness retreat and never came back.
          Let's get you back to wellness.
        </p>

        <Link
          to="/"
          id="notfound-home-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.85rem 2rem',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, #6c63ff, #5a4fd9)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.95rem',
            textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(108,99,255,0.4)',
            transition: 'all 0.25s ease',
          }}
        >
          🏠 Back to Home
        </Link>
      </div>
    </section>
  );
};

export default NotFoundPage;
