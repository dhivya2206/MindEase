/**
 * components/mood/MoodHistory.jsx
 * Paginated list of past mood entries with edit and delete actions.
 * Part 11 update: source badge added (FACIAL / TEXT_AI / MANUAL).
 *
 * Props:
 *   entries   — array of mood entry objects
 *   isLoading — bool
 *   meta      — { total, page, pages }
 *   onPageChange(n) — callback
 *   onEdit(entry)   — callback
 *   onDelete(id)    — callback
 *   filterMood      — currently selected mood filter
 *   onFilterChange(mood|null) — callback
 */

import { useState } from 'react';
import { getMoodMeta, MOOD_ORDER, MOOD_META, INTENSITY_LABELS } from '../../constants/moods.js';
import { Card, SkeletonBlock, EmptyState, Badge, SectionHeader, PillButton } from '../dashboard/ui.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { formatDate } from '../../utils/helpers.js';

// ── Source badge config ───────────────────────────────────────
const SOURCE_META = {
  FACIAL:  { icon: '📷', label: 'Facial Estimation', bg: 'rgba(108,99,255,0.1)',  border: 'rgba(108,99,255,0.25)',  text: '#6c63ff' },
  TEXT_AI: { icon: '✍️', label: 'Text AI',           bg: 'rgba(78,205,196,0.1)',  border: 'rgba(78,205,196,0.25)',  text: '#4ecdc4' },
};

// ── Entry card ────────────────────────────────────────────────
const EntryCard = ({ entry, onEdit, onDelete, isDark }) => {
  const { emoji, label, color } = getMoodMeta(entry.mood);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    await onDelete(entry.id);
    setDeleting(false);
    setConfirmDelete(false);
  };

  const dateLabel = formatDate(entry.loggedAt, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const srcMeta = SOURCE_META[entry.source] ?? null;

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '1rem',
      padding: '1rem', borderRadius: '1rem',
      background: isDark ? 'rgba(255,255,255,0.03)' : `${color}06`,
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : `${color}20`}`,
      transition: 'background 0.2s',
    }}>
      {/* Emoji bubble */}
      <div style={{ width: 46, height: 46, borderRadius: '12px', background: `${color}20`, border: `1.5px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
        {emoji}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
          <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.95rem', color }}>{label}</span>
          <Badge color="default" style={{ fontSize: '0.68rem' }}>
            {INTENSITY_LABELS[entry.intensity]} ({entry.intensity}/5)
          </Badge>
          {/* Source badge — only shown for AI-detected entries */}
          {srcMeta && (
            <span
              title={`Detected via ${srcMeta.label}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                padding: '0.15rem 0.55rem', borderRadius: '9999px',
                background: srcMeta.bg, border: `1px solid ${srcMeta.border}`,
                color: srcMeta.text, fontSize: '0.65rem', fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {srcMeta.icon} {srcMeta.label}
            </span>
          )}
        </div>
        {entry.note && (
          <p style={{ fontSize: '0.825rem', opacity: 0.7, margin: '0.2rem 0 0.4rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            "{entry.note}"
          </p>
        )}
        <span style={{ fontSize: '0.75rem', opacity: 0.45 }}>{dateLabel}</span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0, alignItems: 'flex-end' }}>
        <button
          id={`edit-mood-${entry.id}`}
          onClick={() => onEdit(entry)}
          style={{ padding: '0.3rem 0.7rem', borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.2)'}`, background: 'transparent', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: '#6c63ff' }}
        >Edit</button>
        {confirmDelete ? (
          <button
            id={`confirm-delete-mood-${entry.id}`}
            onClick={handleDelete}
            disabled={deleting}
            style={{ padding: '0.3rem 0.7rem', borderRadius: '8px', border: '1px solid rgba(255,107,107,0.4)', background: 'rgba(255,107,107,0.1)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: '#ff6b6b' }}
          >{deleting ? '…' : 'Confirm?'}</button>
        ) : (
          <button
            id={`delete-mood-${entry.id}`}
            onClick={handleDelete}
            style={{ padding: '0.3rem 0.7rem', borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(128,128,128,0.2)'}`, background: 'transparent', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, opacity: 0.6 }}
          >Delete</button>
        )}
      </div>
    </div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────
const HistorySkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
    {[1,2,3,4].map(i => (
      <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem', borderRadius: '1rem', background: 'transparent', border: '1px solid rgba(128,128,128,0.1)' }}>
        <SkeletonBlock width={46} height={46} radius={12} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <SkeletonBlock width="40%" height={14} />
          <SkeletonBlock width="75%" height={12} />
          <SkeletonBlock width="30%" height={11} />
        </div>
      </div>
    ))}
  </div>
);

// ── Mood filter chips ─────────────────────────────────────────
const MoodFilter = ({ active, onChange, isDark }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
    <button
      onClick={() => onChange(null)}
      style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', border: `1.5px solid ${!active ? '#6c63ff' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.2)')}`, background: !active ? 'rgba(108,99,255,0.12)' : 'transparent', color: !active ? '#6c63ff' : 'inherit', fontSize: '0.78rem', fontWeight: !active ? 700 : 500, cursor: 'pointer' }}
    >All</button>
    {MOOD_ORDER.map(key => {
      const { emoji, color } = MOOD_META[key];
      const isActive = active === key;
      return (
        <button key={key} onClick={() => onChange(key)}
          style={{ padding: '0.25rem 0.7rem', borderRadius: '9999px', border: `1.5px solid ${isActive ? color : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.15)')}`, background: isActive ? `${color}18` : 'transparent', color: isActive ? color : 'inherit', fontSize: '0.78rem', fontWeight: isActive ? 700 : 500, cursor: 'pointer' }}
        >{emoji}</button>
      );
    })}
  </div>
);

// ── Main ──────────────────────────────────────────────────────
const MoodHistory = ({ entries, isLoading, meta, onPageChange, onEdit, onDelete, filterMood, onFilterChange }) => {
  const { isDark } = useTheme();

  return (
    <Card id="mood-history-card">
      <SectionHeader
        title="Mood History"
        subtitle={meta?.total ? `${meta.total} entries total` : 'All logged moods'}
      />

      <MoodFilter active={filterMood} onChange={onFilterChange} isDark={isDark} />

      {isLoading ? (
        <HistorySkeleton />
      ) : entries.length === 0 ? (
        <EmptyState
          icon="📖"
          title={filterMood ? `No ${filterMood} entries found` : 'No entries yet'}
          message={filterMood ? 'Try a different mood filter, or log a new entry.' : 'Log your first mood above to start building your history.'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {entries.map(e => (
            <EntryCard key={e.id} entry={e} onEdit={onEdit} onDelete={onDelete} isDark={isDark} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
          <PillButton id="mood-prev-btn" variant="ghost" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)} style={{ fontSize: '0.8rem', padding: '0.35rem 0.9rem' }}>
            ← Prev
          </PillButton>
          <span style={{ fontSize: '0.825rem', opacity: 0.6, padding: '0 0.5rem' }}>
            Page {meta.page} of {meta.pages}
          </span>
          <PillButton id="mood-next-btn" variant="ghost" disabled={meta.page >= meta.pages} onClick={() => onPageChange(meta.page + 1)} style={{ fontSize: '0.8rem', padding: '0.35rem 0.9rem' }}>
            Next →
          </PillButton>
        </div>
      )}
    </Card>
  );
};

export default MoodHistory;
