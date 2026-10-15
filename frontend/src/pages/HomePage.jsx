/**
 * pages/HomePage.jsx
 * MindEase Landing Page — production-quality hero + feature sections.
 */

import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

// ── Feature Card Data ─────────────────────────────────────────
const features = [
  {
    icon: '🤖',
    title: 'AI-Powered Therapy',
    desc: 'Chat with our empathetic AI assistant trained on evidence-based CBT and mindfulness techniques.',
    color: '#6c63ff',
    delay: '0s',
  },
  {
    icon: '📊',
    title: 'Mood Tracking',
    desc: 'Log daily moods and emotions. Visualise patterns and gain insights into your mental wellbeing.',
    color: '#4ecdc4',
    delay: '0.1s',
  },
  {
    icon: '🧘',
    title: 'Guided Meditation',
    desc: 'Access a library of breathing exercises, body scans, and mindfulness sessions.',
    color: '#ff6b6b',
    delay: '0.2s',
  },
  {
    icon: '👨‍⚕️',
    title: 'Professional Support',
    desc: 'Book sessions with certified therapists and counsellors directly through the platform.',
    color: '#f7c59f',
    delay: '0.3s',
  },
  {
    icon: '🎮',
    title: 'Gamified Wellness',
    desc: 'Earn badges, complete wellness challenges, and build healthy habits through fun activities.',
    color: '#a8e6cf',
    delay: '0.4s',
  },
  {
    icon: '🔒',
    title: 'Private & Secure',
    desc: 'End-to-end encrypted conversations. Your data is yours — we never share or sell it.',
    color: '#dda0dd',
    delay: '0.5s',
  },
];

// ── Stats Data ────────────────────────────────────────────────
const stats = [
  { value: '50K+', label: 'Active Users' },
  { value: '94%', label: 'Report Improvement' },
  { value: '200+', label: 'Licensed Therapists' },
  { value: '4.9⭐', label: 'App Rating' },
];

// ── Hero Section ──────────────────────────────────────────────
const HeroSection = ({ isDark }) => (
  <section
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '6rem 2rem 4rem',
      background: isDark
        ? 'linear-gradient(135deg, #0f0e1a 0%, #1a1830 50%, #0f0e1a 100%)'
        : 'linear-gradient(135deg, #f8f7ff 0%, #f0eeff 50%, #e8f8f7 100%)',
    }}
  >
    {/* Decorative orbs */}
    <div
      style={{
        position: 'absolute',
        top: '15%',
        left: '10%',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,99,255,0.3) 0%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'float 6s ease-in-out infinite',
        pointerEvents: 'none',
      }}
    />
    <div
      style={{
        position: 'absolute',
        bottom: '10%',
        right: '8%',
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(78,205,196,0.25) 0%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'float 8s ease-in-out infinite reverse',
        pointerEvents: 'none',
      }}
    />
    <div
      style={{
        position: 'absolute',
        top: '50%',
        right: '20%',
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,107,0.2) 0%, transparent 70%)',
        filter: 'blur(50px)',
        animation: 'float 7s ease-in-out infinite',
        pointerEvents: 'none',
      }}
    />

    {/* Content */}
    <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
      {/* Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1.2rem',
          borderRadius: '9999px',
          background: isDark ? 'rgba(108,99,255,0.15)' : 'rgba(108,99,255,0.08)',
          border: '1px solid rgba(108,99,255,0.25)',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: '#6c63ff',
          marginBottom: '2rem',
          animation: 'fadeInUp 0.5s ease forwards',
        }}
      >
        <span>✨</span> AI-Powered Mental Wellness Platform
      </div>

      {/* Headline */}
      <h1
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: '1.5rem',
          color: isDark ? '#e8e6ff' : '#1a1a2e',
          animation: 'fadeInUp 0.6s ease 0.1s both',
        }}
      >
        Your Mind Deserves{' '}
        <span
          style={{
            background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Better Care
        </span>
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
          color: isDark ? 'rgba(232,230,255,0.65)' : 'rgba(26,26,46,0.65)',
          maxWidth: 640,
          margin: '0 auto 2.5rem',
          lineHeight: 1.7,
          animation: 'fadeInUp 0.6s ease 0.2s both',
        }}
      >
        MindEase combines AI-powered therapy, mood tracking, and professional support
        into one seamless wellness experience — tailored to you.
      </p>

      {/* CTAs */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          animation: 'fadeInUp 0.6s ease 0.3s both',
        }}
      >
        <Link
          to="/auth/signup"
          id="hero-get-started-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.9rem 2.25rem',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, #6c63ff, #5a4fd9)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '1rem',
            textDecoration: 'none',
            boxShadow: '0 8px 32px rgba(108,99,255,0.4)',
            transition: 'all 0.25s ease',
          }}
        >
          Start Your Journey 🚀
        </Link>
        <Link
          to="/features"
          id="hero-learn-more-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.9rem 2.25rem',
            borderRadius: '9999px',
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.06)',
            color: isDark ? '#a48dff' : '#6c63ff',
            border: '1px solid rgba(108,99,255,0.25)',
            fontWeight: 600,
            fontSize: '1rem',
            textDecoration: 'none',
            transition: 'all 0.25s ease',
          }}
        >
          Learn More ↓
        </Link>
      </div>

      {/* Floating emoji orbs */}
      <div style={{ position: 'relative', height: 120, marginTop: '3.5rem', animation: 'fadeInUp 0.6s ease 0.4s both' }}>
        {['😊', '🧘', '💪', '🌱', '❤️'].map((emoji, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              fontSize: '2rem',
              top: `${Math.sin(i * 1.2) * 30 + 40}px`,
              left: `${(i / 4) * 80 + 10}%`,
              animation: `float ${4 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
              filter: 'drop-shadow(0 4px 12px rgba(108,99,255,0.2))',
              userSelect: 'none',
            }}
          >
            {emoji}
          </span>
        ))}
      </div>
    </div>
  </section>
);

// ── Stats Section ─────────────────────────────────────────────
const StatsSection = ({ isDark }) => (
  <section
    style={{
      padding: '4rem 2rem',
      background: isDark
        ? 'linear-gradient(135deg, rgba(108,99,255,0.12), rgba(78,205,196,0.08))'
        : 'linear-gradient(135deg, rgba(108,99,255,0.06), rgba(78,205,196,0.06))',
      borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.08)'}`,
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.08)'}`,
    }}
  >
    <div
      style={{
        maxWidth: 900,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '2rem',
        textAlign: 'center',
      }}
    >
      {stats.map(({ value, label }) => (
        <div key={label}>
          <div
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '2.5rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.1,
              marginBottom: '0.5rem',
            }}
          >
            {value}
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 500, opacity: 0.6 }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  </section>
);

// ── Features Section ──────────────────────────────────────────
const FeaturesSection = ({ isDark }) => (
  <section style={{ padding: '6rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
      <p style={{ color: '#6c63ff', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
        Everything You Need
      </p>
      <h2
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 'clamp(1.8rem, 4vw, 2.75rem)',
          fontWeight: 800,
          color: isDark ? '#e8e6ff' : '#1a1a2e',
          marginBottom: '1rem',
        }}
      >
        Your Complete Wellness Toolkit
      </h2>
      <p style={{ fontSize: '1.05rem', opacity: 0.6, maxWidth: 540, margin: '0 auto' }}>
        From daily check-ins to professional therapy — MindEase has all the tools to support your mental health journey.
      </p>
    </div>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
      }}
    >
      {features.map(({ icon, title, desc, color, delay }) => (
        <div
          key={title}
          style={{
            padding: '2rem',
            borderRadius: '1.5rem',
            background: isDark ? 'rgba(26,24,48,0.8)' : '#fff',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.08)'}`,
            boxShadow: isDark
              ? '0 4px 24px rgba(0,0,0,0.3)'
              : '0 4px 24px rgba(108,99,255,0.06)',
            transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            cursor: 'default',
            animation: `fadeInUp 0.6s ease ${delay} both`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.boxShadow = isDark
              ? '0 12px 40px rgba(0,0,0,0.4)'
              : '0 12px 40px rgba(108,99,255,0.14)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isDark
              ? '0 4px 24px rgba(0,0,0,0.3)'
              : '0 4px 24px rgba(108,99,255,0.06)';
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '14px',
              background: `${color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              marginBottom: '1.25rem',
              border: `1px solid ${color}30`,
            }}
          >
            {icon}
          </div>
          <h3
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '1.1rem',
              fontWeight: 700,
              marginBottom: '0.65rem',
              color: isDark ? '#e8e6ff' : '#1a1a2e',
            }}
          >
            {title}
          </h3>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, opacity: 0.65 }}>
            {desc}
          </p>
        </div>
      ))}
    </div>
  </section>
);

// ── CTA Section ───────────────────────────────────────────────
const CTASection = ({ isDark }) => (
  <section style={{ padding: '5rem 2rem' }}>
    <div
      style={{
        maxWidth: 780,
        margin: '0 auto',
        textAlign: 'center',
        padding: '4rem 3rem',
        borderRadius: '2rem',
        background: 'linear-gradient(135deg, #6c63ff 0%, #4ecdc4 100%)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(108,99,255,0.4)',
      }}
    >
      {/* Overlay pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />
      <h2
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
          fontWeight: 800,
          color: '#fff',
          marginBottom: '1rem',
          position: 'relative',
        }}
      >
        Ready to Start Feeling Better?
      </h2>
      <p
        style={{
          color: 'rgba(255,255,255,0.85)',
          fontSize: '1.05rem',
          marginBottom: '2rem',
          position: 'relative',
        }}
      >
        Join 50,000+ users who've transformed their mental wellness with MindEase.
        Your first month is free — no credit card required.
      </p>
      <Link
        to="/auth/signup"
        id="cta-signup-btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.9rem 2.5rem',
          borderRadius: '9999px',
          background: '#fff',
          color: '#6c63ff',
          fontWeight: 700,
          fontSize: '1rem',
          textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          transition: 'all 0.25s ease',
          position: 'relative',
        }}
      >
        Get Started Free ✨
      </Link>
    </div>
  </section>
);

// ── Page ──────────────────────────────────────────────────────
const HomePage = () => {
  const { isDark } = useTheme();

  return (
    <>
      <HeroSection isDark={isDark} />
      <StatsSection isDark={isDark} />
      <FeaturesSection isDark={isDark} />
      <CTASection isDark={isDark} />
    </>
  );
};

export default HomePage;
