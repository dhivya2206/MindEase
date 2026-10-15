import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const FeaturesPage = () => {
  const { isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'AI & Emotion', 'Habits & Tracking', 'Relaxation', 'Professional Care'];

  const features = [
    {
      category: 'AI & Emotion',
      icon: '🤖',
      badge: 'Powered by Gemini 2.0',
      title: 'MindEase AI Companion',
      description:
        'A compassionate, 24/7 AI wellness companion capable of providing empathetic listening, stress grounding techniques, and safe guidance without judgment.',
      highlights: ['Hotline crisis detection', 'Persistent conversation threads', 'Empathetic conversation flow'],
      route: '/dashboard/user/chat',
      cta: 'Chat with MindEase',
    },
    {
      category: 'AI & Emotion',
      icon: '📊',
      badge: 'Camera AI & Manual',
      title: 'Mood Tracking & Emotion AI',
      description:
        'Track and understand your feelings over time with manual mood logging or automatic facial expression analysis using secure, private camera detection.',
      highlights: ['9 emotion categories', 'Intensity scale (1–5)', 'Facial emotion detector'],
      route: '/dashboard/user/mood',
      cta: 'Track Today’s Mood',
    },
    {
      category: 'Habits & Tracking',
      icon: '🏆',
      badge: 'Points & Badges',
      title: 'Wellness Challenges & Habits',
      description:
        'Transform mindfulness into lifelong habits. Enroll in daily and multi-day challenges with real backend verification, consecutive streaks, and badge rewards.',
      highlights: ['7 habit categories', 'Streak calculation engine', 'First Step & Gratitude Star Badges'],
      route: '/dashboard/user/challenges',
      cta: 'Explore Challenges',
    },
    {
      category: 'Habits & Tracking',
      icon: '📖',
      badge: 'Encrypted & Private',
      title: 'Personal Wellness Journal',
      description:
        'Reflect on your daily experiences with our distraction-free, rich wellness journal. Features mood association, prompt templates, search, and a calendar view.',
      highlights: ['Search & tag filtering', 'Interactive calendar history', 'Writing streaks'],
      route: '/dashboard/user/journal',
      cta: 'Open Your Journal',
    },
    {
      category: 'Habits & Tracking',
      icon: '📋',
      badge: '1-Minute Routine',
      title: 'Daily Wellness Check-in',
      description:
        'A quick 60-second holistic health audit capturing sleep duration, hydration levels, stress markers, and daily energy indices.',
      highlights: ['Sleep & hydration logs', 'Daily wellness score index', 'Historical trend charts'],
      route: '/dashboard/user/checkin',
      cta: 'Complete Check-in',
    },
    {
      category: 'Relaxation',
      icon: '🌬️',
      badge: 'Audio & Visual',
      title: 'Relaxation & Breathing Center',
      description:
        'Reset your nervous system with interactive visual pacers for Box Breathing (4-4-4-4) and 4-7-8 Sleep Breath, paired with relaxing audio soundscapes.',
      highlights: ['Box & 4-7-8 breathing pacers', 'Rain, forest, and wave soundscapes', 'Customizable session timers'],
      route: '/dashboard/user/relax',
      cta: 'Start Breathing Session',
    },
    {
      category: 'Relaxation',
      icon: '🎮',
      badge: 'Interactive Sensory',
      title: 'Stress-Relief Games',
      description:
        'Gentle, low-stakes sensory mini-games designed to defuse acute tension and bring your attention back into the present moment.',
      highlights: ['Zen Garden sand raking', 'Haptic Bubble Wrap Popper', 'Pattern Memory focus'],
      route: '/dashboard/user/games',
      cta: 'Play Relaxing Games',
    },
    {
      category: 'Professional Care',
      icon: '🩺',
      badge: 'Licensed Therapists',
      title: 'Counsellor Appointments',
      description:
        'Seamlessly book 1-on-1 virtual consultations with certified counsellors, psychologists, and therapists directly within the platform.',
      highlights: ['Verified counsellor directory', 'Real-time calendar slot booking', 'Instant confirmation & notes'],
      route: '/dashboard/user/appointments',
      cta: 'Book a Counsellor',
    },
    {
      category: 'Habits & Tracking',
      icon: '📈',
      badge: 'Analytics Engine',
      title: 'My Wellness Journey Analytics',
      description:
        'A unified visual cockpit illustrating your emotional trends, weekly wellness indices, modality usage breakdowns, and continuous streaks.',
      highlights: ['Interactive trend line charts', 'Modality distribution radar', 'Weekly progress summary'],
      route: '/dashboard/user/journey',
      cta: 'View Your Analytics',
    },
  ];

  const filtered =
    activeCategory === 'All'
      ? features
      : features.filter((f) => f.category === activeCategory);

  return (
    <div
      style={{
        minHeight: '100vh',
        paddingTop: '90px',
        paddingBottom: '80px',
        background: isDark
          ? 'radial-gradient(ellipse at top, #1e153a 0%, #0d0c18 60%, #07070e 100%)'
          : 'radial-gradient(ellipse at top, #f2f0ff 0%, #ffffff 80%)',
        color: isDark ? '#ffffff' : '#1a162b',
        transition: 'background 0.3s ease',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem 2rem', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1.1rem',
            borderRadius: '9999px',
            background: isDark ? 'rgba(108, 99, 255, 0.15)' : 'rgba(108, 99, 255, 0.08)',
            border: '1px solid rgba(108, 99, 255, 0.25)',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#6c63ff',
            marginBottom: '1.25rem',
          }}
        >
          <span>✨</span> Comprehensive Mental Wellness Suite
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            marginBottom: '1.25rem',
          }}
        >
          Everything You Need to{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #6c63ff 0%, #4ecdc4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Thrive & Reconnect
          </span>
        </h1>

        <p
          style={{
            fontSize: '1.15rem',
            maxWidth: '750px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.65,
            color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(26, 22, 43, 0.7)',
          }}
        >
          Discover MindEase’s integrated ecosystem — from intelligent AI companions and mood analytics to sensory
          relaxation games and professional human counselling.
        </p>

        {/* ── Category Filter Tabs ─────────────────────────────── */}
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '0.6rem 1.4rem',
                borderRadius: '9999px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background:
                  activeCategory === cat
                    ? 'linear-gradient(135deg, #6c63ff, #4ecdc4)'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(108, 99, 255, 0.08)',
                color: activeCategory === cat ? '#ffffff' : isDark ? 'rgba(255,255,255,0.7)' : '#1a162b',
                boxShadow: activeCategory === cat ? '0 4px 16px rgba(108, 99, 255, 0.35)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ── Feature Cards Grid ─────────────────────────────────── */}
      <section style={{ maxWidth: '1240px', margin: '1rem auto 4rem', padding: '0 1.5rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '2rem',
          }}
        >
          {filtered.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '2.2rem',
                borderRadius: '24px',
                background: isDark ? 'rgba(26, 22, 43, 0.55)' : 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.12)'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '16px',
                      background: isDark ? 'rgba(108,99,255,0.18)' : 'rgba(108,99,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.8rem',
                    }}
                  >
                    {item.icon}
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.3rem 0.8rem',
                      borderRadius: '9999px',
                      background: 'rgba(78, 205, 196, 0.15)',
                      color: '#4ecdc4',
                      border: '1px solid rgba(78, 205, 196, 0.3)',
                    }}
                  >
                    {item.badge}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    color: isDark ? 'rgba(255,255,255,0.68)' : 'rgba(26,22,43,0.7)',
                    marginBottom: '1.25rem',
                  }}
                >
                  {item.description}
                </p>

                <div style={{ marginBottom: '1.5rem' }}>
                  {item.highlights.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.85rem',
                        color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(26,22,43,0.85)',
                        marginBottom: '0.4rem',
                      }}
                    >
                      <span style={{ color: '#4ecdc4' }}>✓</span> {h}
                    </div>
                  ))}
                </div>
              </div>

              <Link
                to={isAuthenticated ? item.route : '/auth/login'}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '0.925rem',
                  textAlign: 'center',
                  textDecoration: 'none',
                  color: isDark ? '#ffffff' : '#6c63ff',
                  background: isDark ? 'rgba(108, 99, 255, 0.2)' : 'rgba(108, 99, 255, 0.08)',
                  border: '1px solid rgba(108, 99, 255, 0.35)',
                  transition: 'background 0.2s ease',
                }}
              >
                {item.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default FeaturesPage;
