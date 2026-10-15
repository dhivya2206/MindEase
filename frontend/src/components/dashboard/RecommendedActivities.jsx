/**
 * components/dashboard/RecommendedActivities.jsx
 * Curated wellness suggestions — static, editorially chosen content.
 * These are real suggestions (not user data), so they are always shown.
 * Each card links to the future feature route.
 */

import { SectionHeader, Badge } from './ui.jsx';
import { useTheme } from '../../context/ThemeContext';

const RECOMMENDATIONS = [
  {
    id: 'rec-breathe',
    icon: '🫁',
    title: '4-7-8 Breathing',
    category: 'Breathwork',
    duration: '5 min',
    description: 'A simple breathing technique to quickly lower your anxiety and ease into calm.',
    color: '#4ecdc4',
    categoryColor: 'teal',
    path: '/dashboard/user/meditate',
  },
  {
    id: 'rec-gratitude',
    icon: '💛',
    title: 'Gratitude Journal',
    category: 'Journaling',
    duration: '10 min',
    description: 'Writing 3 things you\'re grateful for is shown to reduce stress within days.',
    color: '#f7c59f',
    categoryColor: 'amber',
    path: '/dashboard/user/journal',
  },
  {
    id: 'rec-walk',
    icon: '🚶',
    title: 'Mindful Walk',
    category: 'Movement',
    duration: '15 min',
    description: 'A slow, screen-free walk outdoors can reset your nervous system significantly.',
    color: '#a8e6cf',
    categoryColor: 'green',
    path: '/dashboard/user/challenges',
  },
  {
    id: 'rec-body-scan',
    icon: '🧘',
    title: 'Body Scan Meditation',
    category: 'Meditation',
    duration: '8 min',
    description: 'Progressively relax muscle groups to release physical stress and improve sleep.',
    color: '#6c63ff',
    categoryColor: 'purple',
    path: '/dashboard/user/meditate',
  },
];

const RecommendedCard = ({ rec, isDark }) => {
  const { id, icon, title, category, duration, description, color, categoryColor } = rec;

  return (
    <div id={id} style={{
      background: isDark ? 'rgba(26,24,48,0.8)' : '#fff',
      borderRadius: '1.1rem',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.09)'}`,
      boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.25)' : '0 2px 14px rgba(108,99,255,0.06)',
      padding: '1.25rem',
      display: 'flex', flexDirection: 'column', gap: '0.75rem',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = isDark ? '0 10px 32px rgba(0,0,0,0.35)' : '0 10px 32px rgba(108,99,255,0.13)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isDark ? '0 2px 16px rgba(0,0,0,0.25)' : '0 2px 14px rgba(108,99,255,0.06)'; }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
          background: `${color}18`, border: `1.5px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
        }}>{icon}</div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Badge color={categoryColor}>{category}</Badge>
          <Badge color="default">⏱ {duration}</Badge>
        </div>
      </div>

      {/* Content */}
      <div>
        <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.95rem', fontWeight: 700, color: isDark ? '#e8e6ff' : '#1a1a2e', margin: '0 0 0.35rem' }}>{title}</h3>
        <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: 0, lineHeight: 1.55 }}>{description}</p>
      </div>

      {/* CTA — disabled, feature coming soon */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
        fontSize: '0.8rem', fontWeight: 600, color,
        opacity: 0.8, cursor: 'default',
      }}>
        Start activity <span style={{ fontSize: '0.9rem' }}>→</span>
        <span style={{ marginLeft: '0.25rem', fontSize: '0.7rem', opacity: 0.6, fontWeight: 400 }}>(Coming soon)</span>
      </div>
    </div>
  );
};

const RecommendedActivities = () => {
  const { isDark } = useTheme();

  return (
    <section id="recommended-activities-section" aria-labelledby="rec-title">
      <SectionHeader
        id="rec-title"
        title="Recommended for You"
        subtitle="Curated wellness activities to try today"
      />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '1rem',
      }}>
        {RECOMMENDATIONS.map(rec => (
          <RecommendedCard key={rec.id} rec={rec} isDark={isDark} />
        ))}
      </div>
    </section>
  );
};

export default RecommendedActivities;
