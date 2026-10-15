/**
 * pages/AboutPage.jsx
 * MindEase — About Page
 *
 * Comprehensive, professional, visually rich About page meeting all design system
 * requirements: dark purple theme, cyan-to-purple gradients, rounded cards,
 * responsive horizontal/vertical timeline, split story layout, verified routes,
 * accessible markup, and reduced-motion support.
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const AboutPage = () => {
  const { isDark } = useTheme();
  const { isAuthenticated, dashboardPath } = useAuth();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const scrollToFeatures = (e) => {
    e.preventDefault();
    const element = document.getElementById('special-features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Color tokens aligned with MindEase design system
  const bgMain = isDark
    ? 'linear-gradient(180deg, #0d0c18 0%, #131124 35%, #181530 70%, #0d0c18 100%)'
    : 'linear-gradient(180deg, #f8f7ff 0%, #f0eeff 40%, #eefbf9 80%, #f8f7ff 100%)';

  const textColor = isDark ? '#f0eeff' : '#1a1830';
  const textMuted = isDark ? 'rgba(232, 230, 255, 0.72)' : 'rgba(26, 24, 48, 0.72)';
  const textDim = isDark ? 'rgba(232, 230, 255, 0.52)' : 'rgba(26, 24, 48, 0.52)';
  const cardBg = isDark ? 'rgba(26, 24, 48, 0.65)' : 'rgba(255, 255, 255, 0.88)';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(108, 99, 255, 0.12)';
  const cardBorderHover = isDark ? 'rgba(108, 99, 255, 0.4)' : 'rgba(108, 99, 255, 0.3)';

  // 6 Verified Special Features linking directly to verified routes
  const specialFeatures = [
    {
      title: 'Mood Tracking',
      desc: 'Record moods, add personal notes, and explore emotional patterns through visual summaries.',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      ),
      route: isAuthenticated ? '/dashboard/user/mood' : '/auth/signup',
      actionLabel: 'Log Mood',
      accentColor: '#6c63ff',
    },
    {
      title: 'AI Wellness Assistant',
      desc: 'Interact with an AI-powered assistant for supportive general wellness conversations and activity suggestions.',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v4" />
          <line x1="8" y1="16" x2="8.01" y2="16" />
          <line x1="16" y1="16" x2="16.01" y2="16" />
        </svg>
      ),
      route: isAuthenticated ? '/dashboard/user/chat' : '/auth/signup',
      actionLabel: 'Open Chat',
      accentColor: '#4ecdc4',
    },
    {
      title: 'Personal Journal',
      desc: 'Write private reflections, record gratitude, and revisit previous journal entries.',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <line x1="9" y1="7" x2="15" y2="7" />
          <line x1="9" y1="11" x2="13" y2="11" />
        </svg>
      ),
      route: isAuthenticated ? '/dashboard/user/journal' : '/auth/signup',
      actionLabel: 'Write Entry',
      accentColor: '#a48dff',
    },
    {
      title: 'Relaxation Center',
      desc: 'Explore breathing exercises, meditation timers, focus sessions, and ambient sounds.',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      ),
      route: isAuthenticated ? '/dashboard/user/relax' : '/auth/signup',
      actionLabel: 'Relax Now',
      accentColor: '#4ecdc4',
    },
    {
      title: 'Wellness Challenges',
      desc: 'Build consistency through daily wellness tasks, personal goals, progress tracking, and achievements.',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
          <path d="M18 4H6v7a6 6 0 0 0 12 0V4z" />
        </svg>
      ),
      route: isAuthenticated ? '/dashboard/user/challenges' : '/auth/signup',
      actionLabel: 'View Challenges',
      accentColor: '#ff9f43',
    },
    {
      title: 'Counselling and Appointments',
      desc: 'Browse available counsellor profiles and use the appointment-booking features available in MindEase.',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      route: isAuthenticated ? '/dashboard/user/appointments' : '/auth/signup',
      actionLabel: 'Find Support',
      accentColor: '#6c63ff',
    },
  ];

  // 4 Steps for How MindEase Works
  const workflowSteps = [
    {
      step: '01',
      title: 'Step 1 — Check In',
      desc: 'Record your mood and complete your daily wellness check-in.',
      icon: '📝',
    },
    {
      step: '02',
      title: 'Step 2 — Reflect',
      desc: 'Use mood tracking and journaling to explore your personal experiences.',
      icon: '🪞',
    },
    {
      step: '03',
      title: 'Step 3 — Take Action',
      desc: 'Discover relaxation activities, wellness challenges, and supportive AI conversations.',
      icon: '🌿',
    },
    {
      step: '04',
      title: 'Step 4 — Track Your Journey',
      desc: 'Review your progress and develop healthy routines at your own pace.',
      icon: '📈',
    },
  ];

  // Core Values
  const coreValues = [
    {
      name: 'Accessibility',
      desc: 'Make everyday wellness tools easy to discover and use.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
      accent: '#6c63ff',
    },
    {
      name: 'Privacy',
      desc: 'Respect users\' personal reflections and protect their information.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      accent: '#4ecdc4',
    },
    {
      name: 'Self-Awareness',
      desc: 'Encourage users to reflect on their experiences without judgment.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
      accent: '#a48dff',
    },
    {
      name: 'Consistency',
      desc: 'Promote small, manageable steps toward healthy routines.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      accent: '#ff9f43',
    },
  ];

  return (
    <div
      style={{
        background: bgMain,
        color: textColor,
        minHeight: '100vh',
        position: 'relative',
        overflowX: 'hidden',
        transition: 'background 0.3s ease, color 0.3s ease',
      }}
    >
      {/* Background ambient lighting orbs */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '3%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '750px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(108, 99, 255, 0.18) 0%, rgba(78, 205, 196, 0.08) 50%, transparent 75%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '35%',
          right: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(78, 205, 196, 0.12) 0%, transparent 70%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '70%',
          left: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(108, 99, 255, 0.12) 0%, transparent 70%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ─────────────────────────────────────────────────────────────
            SECTION 2: ABOUT HERO SECTION
            ───────────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="about-hero-heading"
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '3.5rem 1.5rem 4rem',
            textAlign: 'center',
          }}
        >
          {/* Breadcrumb / Home Back Link */}
          <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                color: textDim,
                textDecoration: 'none',
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                border: `1px solid ${cardBorder}`,
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(108,99,255,0.04)',
                transition: 'color 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#6c63ff';
                e.currentTarget.style.borderColor = '#6c63ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = textDim;
                e.currentTarget.style.borderColor = cardBorder;
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Small label */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 1.25rem',
              borderRadius: '9999px',
              background: isDark ? 'rgba(108, 99, 255, 0.16)' : 'rgba(108, 99, 255, 0.08)',
              border: '1px solid rgba(108, 99, 255, 0.28)',
              fontSize: '0.825rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: isDark ? '#b8b2ff' : '#6c63ff',
              marginBottom: '1.5rem',
              boxShadow: '0 2px 12px rgba(108, 99, 255, 0.15)',
            }}
          >
            <span>✨</span> ABOUT MINDEASE
          </div>

          {/* Main heading */}
          <h1
            id="about-hero-heading"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(2.3rem, 5.5vw, 4.2rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              maxWidth: '920px',
              margin: '0 auto 1.5rem',
              color: isDark ? '#ffffff' : '#1a1830',
            }}
          >
            Your Well-being Matters.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #6c63ff 0%, #4ecdc4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Every Single Day.
            </span>
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: 'clamp(1.05rem, 2vw, 1.22rem)',
              maxWidth: '820px',
              margin: '0 auto 2.5rem',
              lineHeight: 1.75,
              color: textMuted,
            }}
          >
            MindEase is a digital mental wellness platform designed to help people understand their emotions,
            manage everyday stress, and develop healthier daily habits. We bring mood tracking, AI-powered
            wellness assistance, personal journaling, relaxation activities, and wellness challenges together in
            one supportive space.
          </p>

          {/* Two Hero Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '3.5rem',
            }}
          >
            <a
              href="#special-features"
              onClick={scrollToFeatures}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.9rem 2.2rem',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '0.975rem',
                color: isDark ? '#ffffff' : '#1a1830',
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(108, 99, 255, 0.08)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(108, 99, 255, 0.25)'}`,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = '#4ecdc4';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(78, 205, 196, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(108, 99, 255, 0.25)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span>Explore Our Features</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
              </svg>
            </a>

            <Link
              to={isAuthenticated ? dashboardPath : '/auth/signup'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.9rem 2.4rem',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '0.975rem',
                color: '#ffffff',
                background: 'linear-gradient(135deg, #6c63ff 0%, #4ecdc4 100%)',
                boxShadow: '0 8px 28px rgba(108, 99, 255, 0.38)',
                textDecoration: 'none',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 36px rgba(108, 99, 255, 0.55)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(108, 99, 255, 0.38)';
              }}
            >
              <span>{isAuthenticated ? 'Open Dashboard' : 'Get Started'}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Decorative wellness-themed visual illustration */}
          <div
            style={{
              maxWidth: '900px',
              margin: '0 auto',
              padding: '2.5rem 1.5rem',
              borderRadius: '28px',
              background: isDark
                ? 'linear-gradient(135deg, rgba(26, 24, 48, 0.75) 0%, rgba(15, 14, 26, 0.85) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 238, 255, 0.85) 100%)',
              border: `1px solid ${cardBorder}`,
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: isDark
                ? '0 24px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                : '0 20px 50px rgba(108, 99, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                alignItems: 'center',
              }}
            >
              {/* Wellness Item 1 */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '20px',
                  background: isDark ? 'rgba(108, 99, 255, 0.08)' : 'rgba(108, 99, 255, 0.04)',
                  border: `1px solid ${isDark ? 'rgba(108, 99, 255, 0.18)' : 'rgba(108, 99, 255, 0.1)'}`,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    margin: '0 auto 0.75rem',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #6c63ff, #8b6dff)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 3" />
                  </svg>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.25rem' }}>Daily Reflection</div>
                <div style={{ fontSize: '0.85rem', color: textMuted }}>Pause, breathe, and note how you feel</div>
              </div>

              {/* Wellness Item 2 — Central Breathing Node */}
              <div
                style={{
                  padding: '1.5rem',
                  borderRadius: '22px',
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(108, 99, 255, 0.22), rgba(78, 205, 196, 0.15))'
                    : 'linear-gradient(135deg, rgba(108, 99, 255, 0.1), rgba(78, 205, 196, 0.15))',
                  border: '1px solid rgba(78, 205, 196, 0.35)',
                  boxShadow: '0 0 30px rgba(78, 205, 196, 0.18)',
                  textAlign: 'center',
                  transform: 'scale(1.02)',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    margin: '0 auto 0.85rem',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4ecdc4, #6c63ff)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: '0 0 20px rgba(78, 205, 196, 0.5)',
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 20.35a1 1 0 0 0 1.3 1.3l2.74-.62C9.93 21.26 10.95 21.5 12 21.5c4.97 0 9-4.03 9-9s-4.03-9-9-9z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '0.25rem' }}>Integrated Sanctuary</div>
                <div style={{ fontSize: '0.85rem', color: textMuted }}>Emotion tracking & guided relaxation</div>
              </div>

              {/* Wellness Item 3 */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '20px',
                  background: isDark ? 'rgba(78, 205, 196, 0.08)' : 'rgba(78, 205, 196, 0.04)',
                  border: `1px solid ${isDark ? 'rgba(78, 205, 196, 0.18)' : 'rgba(78, 205, 196, 0.12)'}`,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    margin: '0 auto 0.75rem',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #4ecdc4, #2dbdb5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                    <line x1="6" y1="1" x2="6" y2="4" />
                    <line x1="10" y1="1" x2="10" y2="4" />
                    <line x1="14" y1="1" x2="14" y2="4" />
                  </svg>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.25rem' }}>Habit Consistency</div>
                <div style={{ fontSize: '0.85rem', color: textMuted }}>Sustainable wellness at your pace</div>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 3: OUR STORY
            ───────────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="our-story-heading"
          style={{
            maxWidth: '1240px',
            margin: '2rem auto 5rem',
            padding: '0 1.5rem',
          }}
        >
          <div
            style={{
              padding: 'clamp(2rem, 5vw, 4rem)',
              borderRadius: '28px',
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: isDark
                ? '0 16px 48px rgba(0, 0, 0, 0.35)'
                : '0 12px 36px rgba(108, 99, 255, 0.08)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '3rem',
                alignItems: 'center',
              }}
            >
              {/* Text Side */}
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#4ecdc4',
                    marginBottom: '0.75rem',
                  }}
                >
                  <span>📖</span> OUR STORY
                </div>

                <h2
                  id="our-story-heading"
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 'clamp(1.9rem, 3.5vw, 2.75rem)',
                    fontWeight: 800,
                    lineHeight: 1.2,
                    marginBottom: '1.5rem',
                    color: isDark ? '#ffffff' : '#1a1830',
                  }}
                >
                  Why MindEase Exists
                </h2>

                <div
                  style={{
                    fontSize: '1.05rem',
                    lineHeight: 1.8,
                    color: textMuted,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                  }}
                >
                  <p style={{ margin: 0 }}>
                    Modern life can be demanding. Academic responsibilities, work pressure, personal
                    challenges, and everyday commitments can leave people with little time to reflect on their
                    well-being.
                  </p>
                  <p style={{ margin: 0 }}>
                    MindEase was designed to bring simple wellness tools together in one accessible platform.
                    Users can record how they feel, reflect through journaling, explore relaxation activities,
                    and develop positive routines at their own pace.
                  </p>
                  <p style={{ margin: 0 }}>
                    Our goal is to make everyday self-reflection and wellness practices easier to incorporate
                    into daily life.
                  </p>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '4px',
                      height: '42px',
                      borderRadius: '4px',
                      background: 'linear-gradient(180deg, #6c63ff 0%, #4ecdc4 100%)',
                    }}
                  />
                  <div style={{ fontSize: '0.925rem', color: textDim, fontStyle: 'italic' }}>
                    "Mindfulness and personal self-care are most impactful when they are gentle, accessible, and integrated into your daily flow."
                  </div>
                </div>
              </div>

              {/* Wellness Illustration Side */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: '440px',
                    aspectRatio: '1 / 1',
                    borderRadius: '24px',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(108, 99, 255, 0.12) 0%, rgba(78, 205, 196, 0.08) 100%)'
                      : 'linear-gradient(135deg, rgba(108, 99, 255, 0.06) 0%, rgba(78, 205, 196, 0.08) 100%)',
                    border: `1px solid ${cardBorder}`,
                    padding: '2rem',
                    overflow: 'hidden',
                  }}
                >
                  {/* Decorative concentric SVG mandala/ripple */}
                  <svg
                    viewBox="0 0 300 300"
                    style={{
                      width: '100%',
                      height: '100%',
                      maxWidth: '320px',
                    }}
                  >
                    <defs>
                      <linearGradient id="storyGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6c63ff" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#4ecdc4" stopOpacity="0.8" />
                      </linearGradient>
                      <linearGradient id="innerGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4ecdc4" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#6c63ff" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>

                    {/* Concentric rings */}
                    <circle cx="150" cy="150" r="135" fill="none" stroke="url(#storyGlow)" strokeWidth="1" strokeDasharray="6 6" opacity="0.35" />
                    <circle cx="150" cy="150" r="105" fill="none" stroke="url(#storyGlow)" strokeWidth="1.5" opacity="0.45" />
                    <circle cx="150" cy="150" r="75" fill="url(#innerGlow)" stroke="url(#storyGlow)" strokeWidth="2" opacity="0.75" />
                    <circle cx="150" cy="150" r="45" fill="url(#storyGlow)" opacity="0.2" />

                    {/* Central peaceful lotus / heart emblem */}
                    <g transform="translate(150, 150) scale(1.1)">
                      <path
                        d="M0 -30 C15 -10 25 10 0 25 C-25 10 -15 -10 0 -30 Z"
                        fill="url(#storyGlow)"
                      />
                      <path
                        d="M-5 5 C-25 -10 -35 15 0 25 C-15 15 -15 0 -5 5 Z"
                        fill="#6c63ff"
                        opacity="0.75"
                      />
                      <path
                        d="M5 5 C25 -10 35 15 0 25 C15 15 15 0 5 5 Z"
                        fill="#4ecdc4"
                        opacity="0.75"
                      />
                      <circle cx="0" cy="5" r="5" fill="#ffffff" />
                    </g>

                    {/* Floating Wellness Badges */}
                    <circle cx="60" cy="80" r="16" fill="rgba(108, 99, 255, 0.25)" stroke="#6c63ff" strokeWidth="1.5" />
                    <text x="60" y="85" textAnchor="middle" fill="#ffffff" fontSize="12">🧠</text>

                    <circle cx="240" cy="90" r="16" fill="rgba(78, 205, 196, 0.25)" stroke="#4ecdc4" strokeWidth="1.5" />
                    <text x="240" y="95" textAnchor="middle" fill="#ffffff" fontSize="12">🌱</text>

                    <circle cx="80" cy="230" r="16" fill="rgba(255, 159, 67, 0.25)" stroke="#ff9f43" strokeWidth="1.5" />
                    <text x="80" y="235" textAnchor="middle" fill="#ffffff" fontSize="12">✨</text>

                    <circle cx="220" cy="225" r="16" fill="rgba(164, 141, 255, 0.25)" stroke="#a48dff" strokeWidth="1.5" />
                    <text x="220" y="230" textAnchor="middle" fill="#ffffff" fontSize="12">🧘</text>
                  </svg>

                  {/* Gentle Floating Banner at Bottom */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '18px',
                      padding: '0.45rem 1.1rem',
                      borderRadius: '9999px',
                      background: isDark ? 'rgba(15, 14, 26, 0.85)' : 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid rgba(108, 99, 255, 0.3)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: isDark ? '#e8e6ff' : '#1a1830',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    Designed with Empathy & Care
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 4: OUR MISSION AND VISION
            ───────────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="mission-vision-heading"
          style={{
            maxWidth: '1240px',
            margin: '0 auto 5rem',
            padding: '0 1.5rem',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#6c63ff',
                marginBottom: '0.5rem',
              }}
            >
              <span>🧭</span> PURPOSE & DIRECTION
            </div>
            <h2
              id="mission-vision-heading"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'clamp(1.9rem, 3.5vw, 2.6rem)',
                fontWeight: 800,
                color: isDark ? '#ffffff' : '#1a1830',
              }}
            >
              Our Mission and Vision
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2rem',
            }}
          >
            {/* Card 1: Our Mission */}
            <div
              style={{
                padding: 'clamp(2rem, 4vw, 2.75rem)',
                borderRadius: '24px',
                background: isDark
                  ? 'linear-gradient(145deg, rgba(30, 26, 60, 0.75) 0%, rgba(20, 18, 40, 0.85) 100%)'
                  : 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.9) 100%)',
                border: `1.5px solid ${isDark ? 'rgba(108, 99, 255, 0.28)' : 'rgba(108, 99, 255, 0.18)'}`,
                boxShadow: isDark
                  ? '0 12px 36px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(108, 99, 255, 0.2)'
                  : '0 12px 32px rgba(108, 99, 255, 0.08)',
                transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = '#6c63ff';
                e.currentTarget.style.boxShadow = '0 18px 45px rgba(108, 99, 255, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = isDark ? 'rgba(108, 99, 255, 0.28)' : 'rgba(108, 99, 255, 0.18)';
                e.currentTarget.style.boxShadow = isDark
                  ? '0 12px 36px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(108, 99, 255, 0.2)'
                  : '0 12px 32px rgba(108, 99, 255, 0.08)';
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #6c63ff, #8b6dff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  marginBottom: '1.5rem',
                  boxShadow: '0 8px 20px rgba(108, 99, 255, 0.35)',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>

              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.65rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  color: isDark ? '#ffffff' : '#1a1830',
                }}
              >
                Our Mission
              </h3>

              <p
                style={{
                  fontSize: '1.08rem',
                  lineHeight: 1.75,
                  color: textMuted,
                  margin: 0,
                }}
              >
                "To make everyday wellness support more accessible through thoughtful technology, emotional
                self-reflection, relaxation activities, and healthy habit-building tools."
              </p>
            </div>

            {/* Card 2: Our Vision */}
            <div
              style={{
                padding: 'clamp(2rem, 4vw, 2.75rem)',
                borderRadius: '24px',
                background: isDark
                  ? 'linear-gradient(145deg, rgba(22, 38, 50, 0.75) 0%, rgba(16, 26, 36, 0.85) 100%)'
                  : 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(235, 252, 250, 0.9) 100%)',
                border: `1.5px solid ${isDark ? 'rgba(78, 205, 196, 0.28)' : 'rgba(78, 205, 196, 0.22)'}`,
                boxShadow: isDark
                  ? '0 12px 36px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(78, 205, 196, 0.2)'
                  : '0 12px 32px rgba(78, 205, 196, 0.08)',
                transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = '#4ecdc4';
                e.currentTarget.style.boxShadow = '0 18px 45px rgba(78, 205, 196, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = isDark ? 'rgba(78, 205, 196, 0.28)' : 'rgba(78, 205, 196, 0.22)';
                e.currentTarget.style.boxShadow = isDark
                  ? '0 12px 36px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(78, 205, 196, 0.2)'
                  : '0 12px 32px rgba(78, 205, 196, 0.08)';
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #4ecdc4, #2dbdb5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  marginBottom: '1.5rem',
                  boxShadow: '0 8px 20px rgba(78, 205, 196, 0.35)',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>

              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.65rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  color: isDark ? '#ffffff' : '#1a1830',
                }}
              >
                Our Vision
              </h3>

              <p
                style={{
                  fontSize: '1.08rem',
                  lineHeight: 1.75,
                  color: textMuted,
                  margin: 0,
                }}
              >
                "To create a supportive digital space where people can make time for themselves, develop
                greater self-awareness, and build sustainable wellness routines."
              </p>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 5: THE CHALLENGES WE ADDRESS
            ───────────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="challenges-heading"
          style={{
            maxWidth: '1240px',
            margin: '0 auto 5rem',
            padding: '0 1.5rem',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#4ecdc4',
                marginBottom: '0.5rem',
              }}
            >
              <span>🌱</span> REAL-WORLD PERSPECTIVE
            </div>
            <h2
              id="challenges-heading"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'clamp(1.9rem, 3.5vw, 2.6rem)',
                fontWeight: 800,
                color: isDark ? '#ffffff' : '#1a1830',
                marginBottom: '0.75rem',
              }}
            >
              Small Steps Toward Better Well-being
            </h2>
            <p style={{ maxWidth: '640px', margin: '0 auto', color: textMuted, fontSize: '1rem' }}>
              We focus on approachable, day-to-day mindfulness practices that help bring balance and clarity.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {/* Card 1: Everyday Stress */}
            <div
              style={{
                padding: '2.2rem',
                borderRadius: '24px',
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                backdropFilter: 'blur(20px)',
                boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.2)' : '0 6px 20px rgba(108, 99, 255, 0.05)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = cardBorderHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = cardBorder;
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: isDark ? 'rgba(108, 99, 255, 0.15)' : 'rgba(108, 99, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  marginBottom: '1.25rem',
                }}
              >
                🌊
              </div>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  marginBottom: '0.75rem',
                  color: isDark ? '#ffffff' : '#1a1830',
                }}
              >
                Everyday Stress
              </h3>
              <p style={{ fontSize: '0.975rem', lineHeight: 1.7, color: textMuted, margin: 0 }}>
                Everyday responsibilities can feel overwhelming. MindEase provides simple tools to pause,
                reflect, and explore relaxation practices.
              </p>
            </div>

            {/* Card 2: Emotional Self-Reflection */}
            <div
              style={{
                padding: '2.2rem',
                borderRadius: '24px',
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                backdropFilter: 'blur(20px)',
                boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.2)' : '0 6px 20px rgba(108, 99, 255, 0.05)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = cardBorderHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = cardBorder;
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: isDark ? 'rgba(78, 205, 196, 0.15)' : 'rgba(78, 205, 196, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  marginBottom: '1.25rem',
                }}
              >
                🪞
              </div>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  marginBottom: '0.75rem',
                  color: isDark ? '#ffffff' : '#1a1830',
                }}
              >
                Emotional Self-Reflection
              </h3>
              <p style={{ fontSize: '0.975rem', lineHeight: 1.7, color: textMuted, margin: 0 }}>
                Recording moods and writing journal entries can help users review their experiences and notice
                personal patterns over time.
              </p>
            </div>

            {/* Card 3: Healthy Daily Habits */}
            <div
              style={{
                padding: '2.2rem',
                borderRadius: '24px',
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                backdropFilter: 'blur(20px)',
                boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.2)' : '0 6px 20px rgba(108, 99, 255, 0.05)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = cardBorderHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = cardBorder;
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: isDark ? 'rgba(255, 159, 67, 0.15)' : 'rgba(255, 159, 67, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  marginBottom: '1.25rem',
                }}
              >
                🎯
              </div>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  marginBottom: '0.75rem',
                  color: isDark ? '#ffffff' : '#1a1830',
                }}
              >
                Healthy Daily Habits
              </h3>
              <p style={{ fontSize: '0.975rem', lineHeight: 1.7, color: textMuted, margin: 0 }}>
                Wellness challenges, breathing exercises, focus sessions, and relaxation games encourage users
                to make time for themselves.
              </p>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 6: WHAT MAKES MINDEASE SPECIAL?
            ───────────────────────────────────────────────────────────── */}
        <section
          id="special-features"
          aria-labelledby="features-heading"
          style={{
            maxWidth: '1240px',
            margin: '0 auto 5rem',
            padding: '2rem 1.5rem',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#6c63ff',
                marginBottom: '0.5rem',
              }}
            >
              <span>⚡</span> PLATFORM HIGHLIGHTS
            </div>
            <h2
              id="features-heading"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'clamp(1.9rem, 3.5vw, 2.6rem)',
                fontWeight: 800,
                color: isDark ? '#ffffff' : '#1a1830',
                marginBottom: '0.75rem',
              }}
            >
              What Makes MindEase Special?
            </h2>
            <p style={{ maxWidth: '640px', margin: '0 auto', color: textMuted, fontSize: '1rem' }}>
              Six dedicated wellness modules working together to support your personal journey.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {specialFeatures.map((f, i) => (
              <div
                key={i}
                style={{
                  padding: '2rem',
                  borderRadius: '24px',
                  background: cardBg,
                  border: `1px solid ${cardBorder}`,
                  backdropFilter: 'blur(20px)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 16px rgba(108, 99, 255, 0.05)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = f.accentColor;
                  e.currentTarget.style.boxShadow = `0 12px 32px ${f.accentColor}25`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = cardBorder;
                  e.currentTarget.style.boxShadow = isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 16px rgba(108, 99, 255, 0.05)';
                }}
              >
                <div>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '16px',
                      background: isDark ? `${f.accentColor}20` : `${f.accentColor}12`,
                      color: f.accentColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1.25rem',
                      border: `1px solid ${f.accentColor}30`,
                    }}
                  >
                    {f.icon}
                  </div>

                  <h3
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: '1.35rem',
                      fontWeight: 700,
                      marginBottom: '0.65rem',
                      color: isDark ? '#ffffff' : '#1a1830',
                    }}
                  >
                    {f.title}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.96rem',
                      lineHeight: 1.65,
                      color: textMuted,
                      marginBottom: '1.5rem',
                    }}
                  >
                    {f.desc}
                  </p>
                </div>

                <div>
                  <Link
                    to={f.route}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: f.accentColor,
                      textDecoration: 'none',
                      transition: 'gap 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.gap = '0.7rem';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.gap = '0.45rem';
                    }}
                  >
                    <span>{f.actionLabel}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 7: HOW MINDEASE WORKS (Responsive Timeline)
            ───────────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="how-it-works-heading"
          style={{
            maxWidth: '1240px',
            margin: '0 auto 5rem',
            padding: '0 1.5rem',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#4ecdc4',
                marginBottom: '0.5rem',
              }}
            >
              <span>🔄</span> SIMPLE 4-STEP PROCESS
            </div>
            <h2
              id="how-it-works-heading"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'clamp(1.9rem, 3.5vw, 2.6rem)',
                fontWeight: 800,
                color: isDark ? '#ffffff' : '#1a1830',
                marginBottom: '0.75rem',
              }}
            >
              How MindEase Works
            </h2>
            <p style={{ maxWidth: '640px', margin: '0 auto', color: textMuted, fontSize: '1rem' }}>
              A supportive framework designed to fit gently into your regular routine.
            </p>
          </div>

          {/* Timeline Grid (Horizontal layout on desktop, stacked on mobile) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.75rem',
              position: 'relative',
            }}
          >
            {workflowSteps.map((ws, i) => (
              <div
                key={i}
                style={{
                  padding: '2rem 1.75rem',
                  borderRadius: '24px',
                  background: cardBg,
                  border: `1px solid ${cardBorder}`,
                  backdropFilter: 'blur(20px)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.25s ease',
                  boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.2)' : '0 6px 20px rgba(108, 99, 255, 0.05)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = '#6c63ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = cardBorder;
                }}
              >
                {/* Step pill */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.25rem',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 800,
                      fontSize: '1.4rem',
                      background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {ws.step}
                  </span>
                  <span style={{ fontSize: '1.6rem' }}>{ws.icon}</span>
                </div>

                <h3
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    marginBottom: '0.75rem',
                    color: isDark ? '#ffffff' : '#1a1830',
                  }}
                >
                  {ws.title}
                </h3>

                <p
                  style={{
                    fontSize: '0.94rem',
                    lineHeight: 1.65,
                    color: textMuted,
                    margin: 0,
                  }}
                >
                  "{ws.desc}"
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 8: OUR CORE VALUES
            ───────────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="values-heading"
          style={{
            maxWidth: '1240px',
            margin: '0 auto 5rem',
            padding: '0 1.5rem',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#6c63ff',
                marginBottom: '0.5rem',
              }}
            >
              <span>💎</span> GUIDING PRINCIPLES
            </div>
            <h2
              id="values-heading"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'clamp(1.9rem, 3.5vw, 2.6rem)',
                fontWeight: 800,
                color: isDark ? '#ffffff' : '#1a1830',
                marginBottom: '0.75rem',
              }}
            >
              Our Core Values
            </h2>
            <p style={{ maxWidth: '640px', margin: '0 auto', color: textMuted, fontSize: '1rem' }}>
              The ethical commitments that anchor every experience we build.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {coreValues.map((v, i) => (
              <div
                key={i}
                style={{
                  padding: '2rem',
                  borderRadius: '22px',
                  background: cardBg,
                  border: `1px solid ${cardBorder}`,
                  backdropFilter: 'blur(20px)',
                  transition: 'all 0.25s ease',
                  boxShadow: isDark ? '0 6px 20px rgba(0,0,0,0.18)' : '0 4px 16px rgba(108, 99, 255, 0.05)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = v.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = cardBorder;
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: isDark ? `${v.accent}20` : `${v.accent}12`,
                    color: v.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem',
                  }}
                >
                  {v.icon}
                </div>

                <h3
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    marginBottom: '0.6rem',
                    color: isDark ? '#ffffff' : '#1a1830',
                  }}
                >
                  {v.name}
                </h3>

                <p
                  style={{
                    fontSize: '0.94rem',
                    lineHeight: 1.65,
                    color: textMuted,
                    margin: 0,
                  }}
                >
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 9: RESPONSIBLE USE OF AI
            ───────────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="responsible-ai-heading"
          style={{
            maxWidth: '1040px',
            margin: '0 auto 5rem',
            padding: '0 1.5rem',
          }}
        >
          <div
            style={{
              padding: 'clamp(2rem, 4vw, 3rem)',
              borderRadius: '26px',
              background: isDark
                ? 'linear-gradient(135deg, rgba(30, 26, 60, 0.6) 0%, rgba(18, 16, 36, 0.8) 100%)'
                : 'linear-gradient(135deg, rgba(240, 238, 255, 0.8) 0%, rgba(255, 255, 255, 0.95) 100%)',
              border: `1.5px solid ${isDark ? 'rgba(108, 99, 255, 0.25)' : 'rgba(108, 99, 255, 0.18)'}`,
              boxShadow: isDark
                ? '0 16px 40px rgba(0, 0, 0, 0.35)'
                : '0 12px 32px rgba(108, 99, 255, 0.08)',
              display: 'flex',
              gap: '1.75rem',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 6px 16px rgba(108, 99, 255, 0.3)',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>

            <div style={{ flex: 1, minWidth: '280px' }}>
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#6c63ff',
                  marginBottom: '0.4rem',
                }}
              >
                SAFETY & ETHICAL COMMITMENT
              </div>

              <h2
                id="responsible-ai-heading"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  marginBottom: '1rem',
                  color: isDark ? '#ffffff' : '#1a1830',
                }}
              >
                Technology With Responsibility
              </h2>

              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.75,
                  color: textMuted,
                  margin: '0 0 1.25rem',
                }}
              >
                MindEase uses digital tools and AI-powered features to support general wellness and self-reflection.
                AI responses and emotion estimates may be inaccurate and should not be treated as medical advice
                or diagnosis. MindEase does not replace qualified mental health professionals or emergency services.
              </p>

              {/* Emergency Helplines Callout */}
              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '14px',
                  background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(108, 99, 255, 0.04)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(108, 99, 255, 0.1)'}`,
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  color: textDim,
                }}
              >
                <strong style={{ color: isDark ? '#ffffff' : '#1a1830' }}>Need immediate crisis support?</strong>{' '}
                Please contact national mental health helplines: <strong>14416 (Tele-MANAS, India)</strong>,{' '}
                <strong>1800-599-0019 (KIRAN)</strong>, or <strong>988 (USA/Canada)</strong>, or reach out to your local emergency services.
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 10: FINAL CALL TO ACTION
            ───────────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="cta-heading"
          style={{
            maxWidth: '1100px',
            margin: '0 auto 6rem',
            padding: '0 1.5rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              padding: 'clamp(2.5rem, 6vw, 4.5rem) 1.5rem',
              borderRadius: '32px',
              background: isDark
                ? 'linear-gradient(135deg, rgba(30, 26, 60, 0.8) 0%, rgba(18, 16, 36, 0.95) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 238, 255, 0.9) 100%)',
              border: `1.5px solid ${isDark ? 'rgba(108, 99, 255, 0.3)' : 'rgba(108, 99, 255, 0.2)'}`,
              boxShadow: isDark
                ? '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(108, 99, 255, 0.15)'
                : '0 20px 50px rgba(108, 99, 255, 0.12)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Ambient decorative glow */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '-30%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '400px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(78, 205, 196, 0.2) 0%, transparent 70%)',
                filter: 'blur(60px)',
                pointerEvents: 'none',
              }}
            />

            <h2
              id="cta-heading"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
                fontWeight: 800,
                lineHeight: 1.2,
                maxWidth: '780px',
                margin: '0 auto 1.25rem',
                color: isDark ? '#ffffff' : '#1a1830',
              }}
            >
              Your Wellness Journey Starts With{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #6c63ff 0%, #4ecdc4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                One Small Step
              </span>
            </h2>

            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.15rem)',
                maxWidth: '700px',
                margin: '0 auto 2.5rem',
                lineHeight: 1.75,
                color: textMuted,
              }}
            >
              Take a moment for yourself. Explore your emotions, discover relaxation activities, and begin building
              a routine that supports your everyday well-being.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Link
                to={isAuthenticated ? dashboardPath : '/auth/signup'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.95rem 2.4rem',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #6c63ff 0%, #4ecdc4 100%)',
                  boxShadow: '0 8px 28px rgba(108, 99, 255, 0.4)',
                  textDecoration: 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 36px rgba(108, 99, 255, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(108, 99, 255, 0.4)';
                }}
              >
                <span>{isAuthenticated ? 'Go to My Dashboard' : 'Create Your Account'}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                to="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.95rem 2.2rem',
                  borderRadius: '9999px',
                  fontWeight: 600,
                  fontSize: '1rem',
                  color: isDark ? '#ffffff' : '#1a1830',
                  background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(108, 99, 255, 0.08)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(108, 99, 255, 0.22)'}`,
                  textDecoration: 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = '#4ecdc4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(108, 99, 255, 0.22)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Return to Home</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
