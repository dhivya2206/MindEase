/**
 * pages/RelaxationPage.jsx
 * Relaxation Center — Part 12.
 *
 * Six tabs:
 *   1. 🫁 Breathing   — animated breathing guide (BreathingGuide)
 *   2. 🧘 Meditation  — countdown meditation timer (MeditationTimer)
 *   3. 🎯 Focus       — Pomodoro focus timer (FocusTimer)
 *   4. 🌿 Guided      — guided relaxation scripts (GuidedRelaxation)
 *   5. 🌙 Sleep       — sleep wind-down (SleepRelaxation)
 *   6. 🎵 Sounds      — ambient sound mixer (AmbientSounds)
 *
 * Sessions are tracked in localStorage via useSessionTracker.
 */

import { useState, useCallback } from 'react';
import DashboardShell from '../components/dashboard/DashboardShell';
import { Card, SectionHeader } from '../components/dashboard/ui.jsx';
import { useTheme } from '../context/ThemeContext';

import BreathingGuide   from '../components/relaxation/BreathingGuide';
import MeditationTimer  from '../components/relaxation/MeditationTimer';
import FocusTimer       from '../components/relaxation/FocusTimer';
import GuidedRelaxation from '../components/relaxation/GuidedRelaxation';
import SleepRelaxation  from '../components/relaxation/SleepRelaxation';
import AmbientSounds    from '../components/relaxation/AmbientSounds';
import SessionHistory, { useSessionTracker, SESSION_TYPES } from '../components/relaxation/SessionTracker';

// ── Tab config ────────────────────────────────────────────────
const TABS = [
  { id: 'breathing',  label: 'Breathing',  emoji: '🫁', color: '#6c63ff', sessionType: 'breathing'  },
  { id: 'meditation', label: 'Meditation', emoji: '🧘', color: '#4ecdc4', sessionType: 'meditation' },
  { id: 'focus',      label: 'Focus',      emoji: '🎯', color: '#f7c59f', sessionType: 'focus'      },
  { id: 'guided',     label: 'Guided',     emoji: '🌿', color: '#a8e6cf', sessionType: 'guided'     },
  { id: 'sleep',      label: 'Sleep',      emoji: '🌙', color: '#7c6f9f', sessionType: 'sleep'      },
  { id: 'sounds',     label: 'Sounds',     emoji: '🎵', color: '#ff9f7f', sessionType: 'ambient'    },
];

// ─────────────────────────────────────────────────────────────
const RelaxationPage = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('breathing');
  const [showHistory, setShowHistory] = useState(false);

  const { sessions, logSession, clearSessions } = useSessionTracker();

  const textMain  = isDark ? '#e8e6ff' : '#1a1a2e';
  const textMuted = isDark ? 'rgba(232,230,255,0.45)' : 'rgba(26,26,46,0.45)';
  const border    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.09)';

  const activeTabCfg = TABS.find(t => t.id === activeTab);

  // Called by each sub-component when a session ends
  const handleComplete = useCallback((data = {}) => {
    logSession({
      type:        activeTabCfg.sessionType,
      label:       data.label || `${activeTabCfg.emoji} ${activeTabCfg.label} — ${data.pattern || data.type || ''}`.trim(),
      durationSec: data.durationSec ?? 0,
    });
  }, [activeTabCfg, logSession]);

  return (
    <DashboardShell>
      {/* ── Page header ──────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 'clamp(1.2rem,3vw,1.6rem)', fontWeight: 800, margin: '0 0 0.3rem', background: 'linear-gradient(135deg,#6c63ff,#4ecdc4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              🧘 Relaxation Center
            </h2>
            <p style={{ fontSize: '0.85rem', color: textMuted, margin: 0 }}>
              Breathing · Meditation · Focus · Guided · Sleep · Ambient Sounds
            </p>
          </div>

          {/* History toggle */}
          <button
            id="relaxation-history-btn"
            onClick={() => setShowHistory(h => !h)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1rem', borderRadius: '10px',
              border: `1px solid ${border}`,
              background: showHistory ? 'rgba(108,99,255,0.1)' : 'transparent',
              color: showHistory ? '#6c63ff' : textMuted,
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            }}>
            🏅 History {sessions.length > 0 && <span style={{ background: '#6c63ff', color: '#fff', borderRadius: '9999px', padding: '0.05rem 0.45rem', fontSize: '0.68rem' }}>{sessions.length}</span>}
          </button>
        </div>
      </div>

      {/* ── Two-column grid: tabs+content | history ──────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: showHistory ? '1fr 320px' : '1fr', gap: '1.25rem', alignItems: 'start' }} className="relax-grid">

        {/* Main content column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: '0.3rem', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(108,99,255,0.05)', borderRadius: '16px', padding: '0.35rem', flexWrap: 'wrap' }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`relax-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: '1 1 auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                    padding: '0.55rem 0.75rem', borderRadius: '12px', border: 'none',
                    background: isActive ? tab.color : 'transparent',
                    color: isActive ? '#fff' : textMuted,
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 'clamp(0.72rem, 1.5vw, 0.85rem)',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    boxShadow: isActive ? `0 3px 14px ${tab.color}40` : 'none',
                    whiteSpace: 'nowrap',
                  }}>
                  <span style={{ fontSize: '1.05rem' }}>{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active section card */}
          <Card id={`relaxation-${activeTab}-card`}>
            <SectionHeader
              title={`${activeTabCfg.emoji} ${activeTabCfg.label}`}
              subtitle={getTabSubtitle(activeTab)}
              style={{ marginBottom: '1.25rem' }}
            />

            {/* Route to correct component */}
            {activeTab === 'breathing'  && <BreathingGuide  onComplete={handleComplete} />}
            {activeTab === 'meditation' && <MeditationTimer onComplete={handleComplete} />}
            {activeTab === 'focus'      && <FocusTimer      onComplete={handleComplete} />}
            {activeTab === 'guided'     && <GuidedRelaxation onComplete={handleComplete} />}
            {activeTab === 'sleep'      && <SleepRelaxation  onComplete={handleComplete} />}
            {activeTab === 'sounds'     && <AmbientSounds    onComplete={handleComplete} />}
          </Card>

          {/* Info banner per tab */}
          <InfoBanner tab={activeTab} isDark={isDark} textMuted={textMuted} textMain={textMain} border={border} />
        </div>

        {/* History panel */}
        {showHistory && (
          <Card id="relaxation-history-card" style={{ position: 'sticky', top: '1rem' }}>
            <SectionHeader title="🏅 Session History" subtitle="Your completed relaxation sessions" />
            <SessionHistory sessions={sessions} onClear={clearSessions} />
          </Card>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .relax-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(108,99,255,0.25); }
          50%       { box-shadow: 0 0 40px rgba(108,99,255,0.55); }
        }
      `}</style>
    </DashboardShell>
  );
};

// ── Per-tab subtitle ─────────────────────────────────────────
function getTabSubtitle(tab) {
  switch (tab) {
    case 'breathing':  return 'Animated breathing patterns for anxiety, stress & calm';
    case 'meditation': return 'Silent countdown timer with gentle bells';
    case 'focus':      return 'Pomodoro technique — focused work with structured breaks';
    case 'guided':     return 'Step-by-step scripts: Body Scan, Visualisation & PMR';
    case 'sleep':      return 'Wind-down practices for a restful night';
    case 'sounds':     return 'Browser-synthesized ambient soundscapes — no downloads';
    default: return '';
  }
}

// ── Info banner per tab ───────────────────────────────────────
const TAB_INFO = {
  breathing:  { icon: '🫁', text: 'Regular breathing exercises can reduce cortisol levels and activate the parasympathetic nervous system within minutes.' },
  meditation: { icon: '🔬', text: 'Even 5 minutes of daily meditation has been shown to measurably reduce stress and improve focus over time.' },
  focus:      { icon: '🎯', text: 'The Pomodoro Technique was developed by Francesco Cirillo. Work in focused sprints to reduce mental fatigue.' },
  guided:     { icon: '🧠', text: 'Progressive Muscle Relaxation (PMR) is a clinically validated technique for anxiety and insomnia management.' },
  sleep:      { icon: '😴', text: '4-7-8 breathing activates the vagus nerve and can reduce the time to sleep onset significantly.' },
  sounds:     { icon: '🎵', text: 'All sounds here are synthesized by your browser in real time. No audio files are downloaded or streamed.' },
};

const InfoBanner = ({ tab, isDark, textMuted, textMain, border }) => {
  const info = TAB_INFO[tab];
  if (!info) return null;
  return (
    <div style={{ padding: '0.7rem 1rem', borderRadius: '12px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(108,99,255,0.04)', border: `1px solid ${border}`, display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
      <span style={{ flexShrink: 0, fontSize: '1.1rem' }}>{info.icon}</span>
      <p style={{ fontSize: '0.78rem', color: textMuted, margin: 0, lineHeight: 1.6 }}>{info.text}</p>
    </div>
  );
};

export default RelaxationPage;
