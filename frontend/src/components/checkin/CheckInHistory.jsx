/**
 * components/checkin/CheckInHistory.jsx
 * Paginated list of past daily wellness check-ins — Part 7.
 *
 * Props:
 *   entries      — CheckIn[]
 *   meta         — { total, page, pages }
 *   isLoading    — bool
 *   onPageChange — (page: number) => void
 *   onEdit       — (entry: CheckIn) => void
 */

import { Card, SkeletonBlock, SectionHeader, EmptyState, Badge } from '../dashboard/ui.jsx';
import { QUESTIONS, getScoreRange } from '../../constants/checkIn.js';
import { useTheme } from '../../context/ThemeContext.jsx';

// ── Date formatter ────────────────────────────────────────────
const formatDate = (dateKey) => {
  const d = new Date(dateKey + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
};

// ── Score badge ────────────────────────────────────────────────
const ScoreChip = ({ score }) => {
  const range = getScoreRange(score);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.25rem 0.75rem', borderRadius: '9999px',
      background: `${range.color}18`, border: `1px solid ${range.color}35`,
      color: range.color, fontSize: '0.78rem', fontWeight: 700,
      fontFamily: "'Outfit',sans-serif",
    }}>
      {range.icon} {score}
    </span>
  );
};

// ── Mini bar for one question ─────────────────────────────────
const MiniBar = ({ q, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
    <span style={{ fontSize: '0.8rem', flexShrink: 0 }} title={q.label}>{q.icon}</span>
    <div style={{ flex: 1, height: 5, borderRadius: 9999, background: 'rgba(128,128,128,0.15)', overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${(value / 5) * 100}%`,
        borderRadius: 9999,
        background: q.color,
        transition: 'width 0.6s ease',
      }} />
    </div>
    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: q.color, minWidth: 14, textAlign: 'right' }}>{value}</span>
  </div>
);

// ── Single history entry card ──────────────────────────────────
const HistoryCard = ({ entry, onEdit, isDark }) => {
  const range = getScoreRange(entry.wellnessScore);

  return (
    <div style={{
      padding: '1.1rem 1.25rem',
      borderRadius: '1rem',
      background: isDark ? 'rgba(26,24,48,0.6)' : '#fff',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.09)'}`,
      boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.2)' : '0 2px 14px rgba(108,99,255,0.05)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = isDark ? '0 8px 28px rgba(0,0,0,0.3)' : '0 8px 28px rgba(108,99,255,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isDark ? '0 2px 16px rgba(0,0,0,0.2)' : '0 2px 14px rgba(108,99,255,0.05)'; }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.9rem', color: isDark ? '#e8e6ff' : '#1a1a2e' }}>
            {formatDate(entry.dateKey)}
          </div>
          <div style={{ fontSize: '0.72rem', opacity: 0.45, marginTop: '0.1rem' }}>
            {range.label} — {range.description}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ScoreChip score={entry.wellnessScore} />
          <button
            id={`checkin-edit-${entry.id}`}
            onClick={() => onEdit(entry)}
            style={{
              padding: '0.3rem 0.75rem', borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.2)'}`,
              background: 'transparent', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
              color: '#6c63ff', transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(108,99,255,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            ✏️ Edit
          </button>
        </div>
      </div>

      {/* Question mini bars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem 1rem', marginBottom: entry.note ? '0.875rem' : 0 }}>
        {QUESTIONS.map(q => (
          <MiniBar key={q.key} q={q} value={entry[q.key]} />
        ))}
      </div>

      {/* Note */}
      {entry.note && (
        <div style={{
          marginTop: '0.875rem', padding: '0.6rem 0.875rem', borderRadius: '8px',
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(108,99,255,0.03)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.08)'}`,
          fontSize: '0.8rem', fontStyle: 'italic', opacity: 0.75,
          lineHeight: 1.5,
        }}>
          "{entry.note}"
        </div>
      )}
    </div>
  );
};

// ── Skeleton loader ────────────────────────────────────────────
const HistorySkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
    {[1, 2, 3].map(i => (
      <div key={i} style={{ padding: '1.1rem 1.25rem', borderRadius: '1rem', border: '1px solid rgba(108,99,255,0.07)', background: 'transparent' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <SkeletonBlock height={14} width="40%" />
          <SkeletonBlock height={24} width="20%" radius={9999} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {[1, 2, 3, 4, 5].map(j => <SkeletonBlock key={j} height={8} radius={9999} />)}
        </div>
      </div>
    ))}
  </div>
);

// ── Pagination ─────────────────────────────────────────────────
const Pagination = ({ meta, onPageChange, isDark }) => {
  if (!meta || meta.pages <= 1) return null;
  const { page, pages } = meta;

  const btnStyle = (active) => ({
    width: 32, height: 32, borderRadius: '8px', border: `1px solid ${active ? '#6c63ff' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.15)')}`,
    background: active ? 'rgba(108,99,255,0.15)' : 'transparent',
    color: active ? '#6c63ff' : (isDark ? 'rgba(232,230,255,0.6)' : 'rgba(26,26,46,0.6)'),
    cursor: 'pointer', fontSize: '0.825rem', fontWeight: active ? 700 : 500,
    transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center',
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '1.25rem' }}>
      <button
        id="checkin-history-prev"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        style={{ ...btnStyle(false), opacity: page <= 1 ? 0.35 : 1 }}
      >←</button>
      {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
        <button
          key={p}
          id={`checkin-history-page-${p}`}
          onClick={() => onPageChange(p)}
          style={btnStyle(p === page)}
        >{p}</button>
      ))}
      <button
        id="checkin-history-next"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pages}
        style={{ ...btnStyle(false), opacity: page >= pages ? 0.35 : 1 }}
      >→</button>
    </div>
  );
};

// ── Main export ────────────────────────────────────────────────
const CheckInHistory = ({ entries = [], meta = null, isLoading = false, onPageChange, onEdit }) => {
  const { isDark } = useTheme();

  return (
    <Card id="checkin-history-card">
      <SectionHeader
        title="Previous Check-ins"
        subtitle={meta?.total ? `${meta.total} total entr${meta.total === 1 ? 'y' : 'ies'}` : 'Your wellness log'}
        action={
          meta?.total > 0 && (
            <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
              Page {meta.page} of {meta.pages}
            </span>
          )
        }
      />

      {isLoading ? (
        <HistorySkeleton />
      ) : entries.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No check-ins yet"
          message="Submit your first daily check-in to start building your wellness history."
        />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {entries.map(entry => (
              <HistoryCard
                key={entry.id || entry.dateKey}
                entry={entry}
                onEdit={onEdit}
                isDark={isDark}
              />
            ))}
          </div>
          <Pagination meta={meta} onPageChange={onPageChange} isDark={isDark} />
        </>
      )}
    </Card>
  );
};

export default CheckInHistory;
