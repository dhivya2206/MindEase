/**
 * pages/CheckInPage.jsx
 * Daily Wellness Check-in full page — Part 7.
 *
 * Layout (desktop):
 *   ┌──────────────────────────────────────────────────────────┐
 *   │  Page header + disclaimer banner                         │
 *   ├──────────────────────────────┬───────────────────────────┤
 *   │  Check-in Form  (left, 1fr)  │  Wellness Trend (right)   │
 *   ├──────────────────────────────┴───────────────────────────┤
 *   │  Previous Check-ins (full width)                         │
 *   └──────────────────────────────────────────────────────────┘
 *
 * State:
 *   - todayCheckIn      : null | CheckIn
 *   - trendData         : null | { trend, latest, averageScore, totalCheckIns }
 *   - historyEntries    : CheckIn[]
 *   - historyMeta       : { total, page, pages }
 *   - editEntry         : null | CheckIn  (pre-populate form for edit)
 *   - loading flags     : todayLoading, trendLoading, histLoading
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardShell from '../components/dashboard/DashboardShell.jsx';
import CheckInForm, { ScoreRing, liveScore } from '../components/checkin/CheckInForm.jsx';
import WellnessTrend from '../components/checkin/WellnessTrend.jsx';
import CheckInHistory from '../components/checkin/CheckInHistory.jsx';
import { Card, SectionHeader, Badge, SkeletonBlock } from '../components/dashboard/ui.jsx';
import { getScoreRange } from '../constants/checkIn.js';
import { useTheme } from '../context/ThemeContext.jsx';
import * as checkInService from '../services/checkInService.js';

// ── Today's score preview (when check-in already done) ────────
const TodayDonePanel = ({ entry, onEditClick, isDark }) => {
  const range = getScoreRange(entry.wellnessScore);
  const score = entry.wellnessScore;

  return (
    <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
      {/* Score ring */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <ScoreRing score={score} range={range} isDark={isDark} />
      </div>

      <h3 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.1rem', margin: '0 0 0.4rem', color: isDark ? '#e8e6ff' : '#1a1a2e' }}>
        Today's Check-in Complete ✅
      </h3>
      <p style={{ fontSize: '0.85rem', opacity: 0.6, margin: '0 0 1.25rem', lineHeight: 1.5 }}>
        Wellness score: <strong style={{ color: range.color }}>{score}</strong> — {range.label}
      </p>

      <button
        id="checkin-edit-today-btn"
        onClick={onEditClick}
        style={{
          padding: '0.6rem 1.5rem', borderRadius: '12px',
          border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(108,99,255,0.25)'}`,
          background: 'transparent', cursor: 'pointer', fontSize: '0.875rem',
          fontWeight: 600, color: '#6c63ff', transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(108,99,255,0.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        ✏️ Edit Today's Check-in
      </button>

      <p style={{ fontSize: '0.75rem', opacity: 0.4, margin: '1rem 0 0', fontStyle: 'italic' }}>
        ⚠️ Personal wellness indicator only — not a medical assessment.
      </p>
    </div>
  );
};

// ── Form panel skeleton ────────────────────────────────────────
const FormSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} style={{ padding: '1rem 0', borderBottom: '1px solid rgba(108,99,255,0.07)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <SkeletonBlock height={14} width="50%" />
          <SkeletonBlock height={28} width="14%" radius={8} />
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[1,2,3,4,5].map(j => <SkeletonBlock key={j} height={36} style={{ flex: 1 }} radius={8} />)}
        </div>
      </div>
    ))}
    <SkeletonBlock height={46} radius={12} style={{ marginTop: '0.5rem' }} />
  </div>
);

// ── Main page component ────────────────────────────────────────
const CheckInPage = () => {
  const { isDark } = useTheme();
  const formRef = useRef(null);

  // ── State ──────────────────────────────────────────────────
  const [todayCheckIn,  setTodayCheckIn]  = useState(null);
  const [trendData,     setTrendData]     = useState(null);
  const [historyEntries, setHistoryEntries] = useState([]);
  const [historyMeta,   setHistoryMeta]   = useState(null);
  const [historyPage,   setHistoryPage]   = useState(1);

  const [editEntry,     setEditEntry]     = useState(null); // null = create mode

  const [todayLoading,  setTodayLoading]  = useState(true);
  const [trendLoading,  setTrendLoading]  = useState(true);
  const [histLoading,   setHistLoading]   = useState(true);

  const [error,         setError]         = useState('');

  // ── Data fetchers ──────────────────────────────────────────
  const fetchToday = useCallback(async () => {
    setTodayLoading(true);
    try {
      const entry = await checkInService.getTodayCheckIn();
      setTodayCheckIn(entry);
    } catch (err) {
      setError(err.message || 'Failed to load today\'s check-in');
    } finally {
      setTodayLoading(false);
    }
  }, []);

  const fetchTrend = useCallback(async () => {
    setTrendLoading(true);
    try {
      const data = await checkInService.getWellnessTrend(14);
      setTrendData(data);
    } catch {
      // Trend degrades gracefully
    } finally {
      setTrendLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const result = await checkInService.getCheckIns({ page: historyPage, limit: 7 });
      setHistoryEntries(result.entries);
      setHistoryMeta(result.meta);
    } catch {
      // History degrades gracefully
    } finally {
      setHistLoading(false);
    }
  }, [historyPage]);

  useEffect(() => { fetchToday();   }, [fetchToday]);
  useEffect(() => { fetchTrend();   }, [fetchTrend]);
  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // ── After save: refresh all data ───────────────────────────
  const handleSave = (saved) => {
    setEditEntry(null);
    setTodayCheckIn(saved);
    fetchTrend();
    fetchHistory();
  };

  // ── Edit callback (from history list) ─────────────────────
  const handleEdit = (entry) => {
    setEditEntry(entry);
    // scroll form panel into view
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleEditToday = () => {
    setEditEntry(todayCheckIn);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const isEditMode = Boolean(editEntry);
  const todayDone  = Boolean(todayCheckIn) && !isEditMode;

  return (
    <DashboardShell>
      {/* ── Page header ─────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 'clamp(1.1rem,2.5vw,1.4rem)', fontWeight: 800, color: isDark ? '#e8e6ff' : '#1a1a2e', margin: 0 }}>
              📋 Daily Wellness Check-in
            </h2>
            <p style={{ fontSize: '0.85rem', opacity: 0.55, margin: '0.3rem 0 0' }}>
              5 questions · takes about 30 seconds · one per day
            </p>
          </div>
          {todayCheckIn && !isEditMode && (
            <Badge color="teal">✅ Done today</Badge>
          )}
          {isEditMode && (
            <Badge color="amber">✏️ Editing entry</Badge>
          )}
        </div>

        {/* Disclaimer banner */}
        <div style={{
          padding: '0.7rem 1rem', borderRadius: '10px',
          background: isDark ? 'rgba(247,197,159,0.08)' : 'rgba(247,197,159,0.12)',
          border: '1px solid rgba(247,197,159,0.3)',
          display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
          fontSize: '0.8rem', lineHeight: 1.5,
        }}>
          <span style={{ flexShrink: 0, marginTop: '0.05rem' }}>⚠️</span>
          <span style={{ opacity: 0.75 }}>
            This tool is for <strong>personal wellness self-reflection only</strong> and is <strong>not a medical assessment</strong>.
            It does not diagnose, treat, or replace professional healthcare advice.
          </span>
        </div>
      </div>

      {/* Global error */}
      {error && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.25rem', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)', fontSize: '0.875rem', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ⚠️ {error}
          <button onClick={() => { setError(''); fetchToday(); }} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 'inherit' }}>retry</button>
        </div>
      )}

      {/* ── Two-column: form + trend ─────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)',
        gap: '1.25rem',
        marginBottom: '1.75rem',
        alignItems: 'start',
      }} className="checkin-two-col">

        {/* Left: form panel */}
        <div ref={formRef}>
          <Card id="checkin-form-card">
            <SectionHeader
              title={isEditMode ? 'Edit Check-in' : 'Today\'s Check-in'}
              subtitle={
                isEditMode
                  ? `Editing entry for ${editEntry?.dateKey}`
                  : todayDone
                  ? 'Already submitted — edit below or scroll down for history'
                  : 'Rate each area from 1 (low) to 5 (high)'
              }
              action={
                isEditMode && (
                  <button
                    id="checkin-cancel-edit-btn"
                    onClick={() => setEditEntry(null)}
                    style={{ background: 'none', border: 'none', color: isDark ? 'rgba(232,230,255,0.5)' : 'rgba(26,26,46,0.4)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, padding: 0 }}
                  >
                    ✕ Cancel
                  </button>
                )
              }
            />

            {todayLoading ? (
              <FormSkeleton />
            ) : (isEditMode || !todayCheckIn) ? (
              /* Create mode (no check-in yet) OR edit mode (editing any entry) */
              <CheckInForm
                existing={editEntry}
                onSave={handleSave}
                todayDone={false}
              />
            ) : (
              /* Today done and not editing — show summary panel */
              <TodayDonePanel entry={todayCheckIn} onEditClick={handleEditToday} isDark={isDark} />
            )}
          </Card>
        </div>

        {/* Right: wellness trend */}
        <WellnessTrend trendData={trendData} isLoading={trendLoading} />
      </div>

      {/* ── Full-width: history ──────────────────────────────── */}
      <CheckInHistory
        entries={historyEntries}
        meta={historyMeta}
        isLoading={histLoading}
        onPageChange={(p) => setHistoryPage(p)}
        onEdit={handleEdit}
      />

      <style>{`
        @media (max-width: 860px) {
          .checkin-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </DashboardShell>
  );
};

export default CheckInPage;
