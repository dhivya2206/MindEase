/**
 * components/relaxation/SessionTracker.jsx
 * Tracks completed relaxation sessions — Part 12.
 *
 * Storage: localStorage key 'mindease-relax-sessions'
 * Each session: { id, type, label, durationSec, completedAt }
 *
 * Exports:
 *   useSessionTracker()   — { sessions, logSession, clearSessions }
 *   SessionHistory        — compact display panel
 */

import { useState, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';

const STORAGE_KEY = 'mindease-relax-sessions';
const MAX_SESSIONS = 50;

// ── Session type config ───────────────────────────────────────
export const SESSION_TYPES = {
  breathing:  { icon: '🫁', label: 'Breathing',         color: '#6c63ff' },
  meditation: { icon: '🧘', label: 'Meditation',        color: '#4ecdc4' },
  focus:      { icon: '🎯', label: 'Focus Timer',       color: '#f7c59f' },
  guided:     { icon: '🌿', label: 'Guided Relaxation', color: '#a8e6cf' },
  sleep:      { icon: '🌙', label: 'Sleep Relaxation',  color: '#7c6f9f' },
  ambient:    { icon: '🎵', label: 'Ambient Sound',     color: '#ff9f7f' },
};

// ── Hook ──────────────────────────────────────────────────────
export const useSessionTracker = () => {
  const [sessions, setSessions] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  });

  const logSession = useCallback(({ type, label, durationSec }) => {
    const entry = {
      id:          `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      label:       label || SESSION_TYPES[type]?.label || type,
      durationSec: durationSec ?? 0,
      completedAt: new Date().toISOString(),
    };
    setSessions(prev => {
      const updated = [entry, ...prev].slice(0, MAX_SESSIONS);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const clearSessions = useCallback(() => {
    setSessions([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return { sessions, logSession, clearSessions };
};

// ── Helpers ───────────────────────────────────────────────────
const fmtDuration = (sec) => {
  if (!sec || sec < 60) return sec ? `${sec}s` : '—';
  const m = Math.floor(sec / 60), s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

const fmtRelative = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ── SessionHistory display component ─────────────────────────
const SessionHistory = ({ sessions, onClear }) => {
  const { isDark } = useTheme();
  const textMain  = isDark ? '#e8e6ff' : '#1a1a2e';
  const textMuted = isDark ? 'rgba(232,230,255,0.45)' : 'rgba(26,26,46,0.45)';
  const border    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.09)';

  const totalMin = Math.round(sessions.reduce((a, s) => a + (s.durationSec || 0), 0) / 60);
  const streak = (() => {
    if (!sessions.length) return 0;
    const days = new Set(sessions.map(s => s.completedAt.slice(0, 10)));
    let count = 0;
    const d = new Date();
    while (days.has(d.toISOString().slice(0, 10))) { count++; d.setDate(d.getDate() - 1); }
    return count;
  })();

  if (!sessions.length) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✨</div>
        <p style={{ fontSize: '0.85rem', color: textMuted }}>
          Complete a session to start tracking your progress.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.65rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Sessions',   value: sessions.length,                     icon: '🏅' },
          { label: 'Total time', value: totalMin < 1 ? '<1 min' : `${totalMin}m`, icon: '⏱️' },
          { label: 'Day streak', value: streak,                               icon: '🔥' },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{
            padding: '0.75rem', borderRadius: '12px', textAlign: 'center',
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(108,99,255,0.05)',
            border: `1px solid ${border}`,
          }}>
            <div style={{ fontSize: '1.3rem', marginBottom: '0.2rem' }}>{icon}</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#6c63ff' }}>{value}</div>
            <div style={{ fontSize: '0.68rem', color: textMuted, marginTop: '0.1rem' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Recent sessions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 240, overflowY: 'auto' }}>
        {sessions.slice(0, 12).map(s => {
          const meta = SESSION_TYPES[s.type] ?? { icon: '✅', color: '#6c63ff' };
          return (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.65rem',
              padding: '0.5rem 0.7rem', borderRadius: '10px',
              background: isDark ? 'rgba(255,255,255,0.03)' : `${meta.color}06`,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : `${meta.color}18`}`,
            }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{meta.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: textMain, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</div>
                <div style={{ fontSize: '0.68rem', color: textMuted }}>{fmtDuration(s.durationSec)}</div>
              </div>
              <div style={{ fontSize: '0.65rem', color: textMuted, flexShrink: 0 }}>{fmtRelative(s.completedAt)}</div>
            </div>
          );
        })}
      </div>

      {onClear && (
        <div style={{ textAlign: 'right', marginTop: '0.65rem' }}>
          <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: textMuted, opacity: 0.65 }}>
            Clear history
          </button>
        </div>
      )}
    </div>
  );
};

export default SessionHistory;
