/**
 * components/dashboard/QuickActions.jsx
 * Horizontal row of quick-action shortcut cards.
 * Part 12 update: Meditate card now links to Relaxation Center.
 * Part 13 update: Games card added.
 */

import { Link } from 'react-router-dom';
import { Card, SectionHeader, Badge } from './ui.jsx';
import { useTheme } from '../../context/ThemeContext';

const ACTIONS = [
  {
    id: 'qa-journey',
    icon: '🌿',
    label: 'My Journey',
    desc: 'Analytics, streak & wellness trends',
    color: '#6c63ff',
    path: '/dashboard/user/journey',
    badge: 'NEW',
    soon: false,
  },
  {
    id: 'qa-mood',
    icon: '📊',
    label: 'Log Mood',
    desc: 'How are you feeling right now?',
    color: '#4ecdc4',
    path: '/dashboard/user/mood',
    badge: null,
    soon: false,
  },
  {
    id: 'qa-face-scan',
    icon: '📷',
    label: 'Face Scan',
    desc: 'Estimate emotion from your expression',
    color: '#6c63ff',
    path: '/dashboard/user/mood',
    badge: null,
    soon: false,
  },
  {
    id: 'qa-checkin',
    icon: '📋',
    label: 'Daily Check-in',
    desc: 'Rate sleep, energy, stress & more',
    color: '#6c63ff',
    path: '/dashboard/user/checkin',
    badge: null,
    soon: false,
  },
  {
    id: 'qa-chat',
    icon: '🤖',
    label: 'AI Chat',
    desc: 'Talk to your wellness companion',
    color: '#6c63ff',
    path: '/dashboard/user/chat',
    badge: null,
    soon: false,
  },
  {
    id: 'qa-meditate',
    icon: '🧘',
    label: 'Relax',
    desc: 'Breathing, meditation & ambient sounds',
    color: '#ff6b6b',
    path: '/dashboard/user/relax',
    badge: null,
    soon: false,
  },
  {
    id: 'qa-games',
    icon: '🎮',
    label: 'Games',
    desc: 'Mindful mini-games to boost focus',
    color: '#a8e6cf',
    path: '/dashboard/user/games',
    badge: null,
    soon: false,
  },
  {
    id: 'qa-book',
    icon: '📅',
    label: 'Book Session',
    desc: 'Schedule with a counsellor',
    color: '#f7c59f',
    path: '/dashboard/user/appointments',
    badge: null,
    soon: false,
  },
  {
    id: 'qa-journal',
    icon: '📝',
    label: 'Journal',
    desc: 'Write freely, no judgement',
    color: '#dda0dd',
    path: '/dashboard/user/journal',
    badge: null,
    soon: true,
  },
  {
    id: 'qa-challenge',
    icon: '🏆',
    label: 'Challenge',
    desc: 'Today\'s wellness challenge',
    color: '#a8e6cf',
    path: '/dashboard/user/challenges',
    badge: null,
    soon: true,
  },
];

const QuickActionCard = ({ action, isDark }) => {
  const { id, icon, label, desc, color, path, soon } = action;

  const content = (
    <>
      {/* Icon */}
      <div style={{
        width: 46, height: 46, borderRadius: '12px', flexShrink: 0,
        background: `${color}18`,
        border: `1.5px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem',
        transition: 'transform 0.2s ease',
      }}>
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
          <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.9rem', color: isDark ? '#e8e6ff' : '#1a1a2e' }}>{label}</span>
          {soon && <Badge color="default" style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>Soon</Badge>}
        </div>
        <p style={{ fontSize: '0.78rem', opacity: 0.55, margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</p>
      </div>

      {/* Arrow */}
      <span style={{ color, fontSize: '1rem', opacity: 0.7, flexShrink: 0, transition: 'transform 0.2s ease' }}>→</span>
    </>
  );

  const sharedStyle = {
    display: 'flex', alignItems: 'center', gap: '0.85rem',
    padding: '1rem 1.1rem', borderRadius: '1rem',
    background: isDark ? 'rgba(26,24,48,0.8)' : '#fff',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.09)'}`,
    boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.25)' : '0 2px 14px rgba(108,99,255,0.06)',
    textDecoration: 'none',
    cursor: soon ? 'default' : 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  };

  if (soon) {
    return (
      <div id={id} style={{ ...sharedStyle, opacity: 0.85 }}>
        {content}
      </div>
    );
  }

  return (
    <Link id={id} to={path}
      style={sharedStyle}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = isDark ? '0 8px 28px rgba(0,0,0,0.35)' : '0 8px 28px rgba(108,99,255,0.14)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isDark ? '0 2px 16px rgba(0,0,0,0.25)' : '0 2px 14px rgba(108,99,255,0.06)'; }}
    >
      {content}
    </Link>
  );
};

const QuickActions = () => {
  const { isDark } = useTheme();

  return (
    <section id="quick-actions-section" aria-labelledby="qa-title">
      <SectionHeader
        id="qa-title"
        title="Quick Actions"
        subtitle="Jump into a wellness activity"
      />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '0.75rem',
      }}>
        {ACTIONS.map(action => (
          <QuickActionCard key={action.id} action={action} isDark={isDark} />
        ))}
      </div>
    </section>
  );
};

export default QuickActions;
