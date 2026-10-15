/**
 * components/mood/MoodLogger.jsx
 * Mood entry form — add new or edit existing entry.
 *
 * Props:
 *   onSave(entry)     — called after successful save (create or update)
 *   editEntry         — if set, pre-populates the form for editing
 *   onCancel()        — called when user cancels edit mode
 */

import { useState, useEffect } from 'react';
import { MOOD_ORDER, MOOD_META, INTENSITY_LABELS } from '../../constants/moods.js';
import * as moodService from '../../services/moodService.js';
import { useTheme } from '../../context/ThemeContext.jsx';

// ── Intensity slider ──────────────────────────────────────────
const IntensitySlider = ({ value, onChange, color, isDark }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
      <label style={{ fontSize: '0.825rem', fontWeight: 600, opacity: 0.7 }}>Intensity</label>
      <span style={{ fontSize: '0.8rem', fontWeight: 700, color, padding: '0.15rem 0.6rem', borderRadius: '9999px', background: `${color}18` }}>
        {value} — {INTENSITY_LABELS[value]}
      </span>
    </div>
    <input
      type="range" min={1} max={5} step={1} value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{ width: '100%', accentColor: color, cursor: 'pointer', height: 4 }}
      id="mood-intensity-slider"
    />
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', opacity: 0.45, marginTop: '0.25rem' }}>
      <span>Very mild</span><span>Moderate</span><span>Very strong</span>
    </div>
  </div>
);

// ── Main logger ───────────────────────────────────────────────
const MoodLogger = ({ onSave, editEntry = null, onCancel }) => {
  const { isDark } = useTheme();
  const isEdit = Boolean(editEntry);

  const [selectedMood, setSelectedMood] = useState(editEntry?.mood ?? null);
  const [intensity,    setIntensity]    = useState(editEntry?.intensity ?? 3);
  const [note,         setNote]         = useState(editEntry?.note ?? '');
  const [loggedAt,     setLoggedAt]     = useState(
    editEntry?.loggedAt
      ? new Date(editEntry.loggedAt).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  // Sync when editing a different entry
  useEffect(() => {
    if (editEntry) {
      setSelectedMood(editEntry.mood);
      setIntensity(editEntry.intensity);
      setNote(editEntry.note ?? '');
      setLoggedAt(new Date(editEntry.loggedAt).toISOString().slice(0, 16));
    }
  }, [editEntry?.id]);

  const activeMeta = selectedMood ? MOOD_META[selectedMood] : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMood) { setError('Please select a mood.'); return; }
    setError('');
    setSaving(true);
    try {
      const dto = { mood: selectedMood, intensity, note: note.trim() || null, loggedAt: new Date(loggedAt).toISOString() };
      const saved = isEdit
        ? await moodService.updateMood(editEntry.id, dto)
        : await moodService.createMood(dto);
      onSave(saved);
      if (!isEdit) {
        // Reset form after create
        setSelectedMood(null);
        setIntensity(3);
        setNote('');
        setLoggedAt(new Date().toISOString().slice(0, 16));
      }
    } catch (err) {
      setError(err.message || 'Failed to save mood entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} id="mood-logger-form" aria-label={isEdit ? 'Edit mood entry' : 'Log new mood'}>
      {/* Mood grid */}
      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.825rem', fontWeight: 600, opacity: 0.7, marginBottom: '0.75rem' }}>
          {isEdit ? 'Change mood' : 'How are you feeling right now?'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {MOOD_ORDER.map(key => {
            const { emoji, label, color } = MOOD_META[key];
            const isActive = selectedMood === key;
            return (
              <button
                key={key}
                type="button"
                id={`mood-btn-${key}`}
                onClick={() => setSelectedMood(key)}
                style={{
                  padding: '0.65rem 0.4rem',
                  borderRadius: '12px',
                  border: isActive ? `2px solid ${color}` : `2px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.12)'}`,
                  background: isActive ? `${color}18` : (isDark ? 'rgba(255,255,255,0.03)' : '#f9f8ff'),
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                  transition: 'all 0.18s ease',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{emoji}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: isActive ? 700 : 500, color: isActive ? color : 'inherit', opacity: isActive ? 1 : 0.65 }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Intensity — only shown once mood is selected */}
      {selectedMood && (
        <div style={{ marginBottom: '1.25rem', animation: 'fadeInUp 0.25s ease' }}>
          <IntensitySlider value={intensity} onChange={setIntensity} color={activeMeta.color} isDark={isDark} />
        </div>
      )}

      {/* Date/time */}
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="mood-datetime" style={{ fontSize: '0.825rem', fontWeight: 600, opacity: 0.7, display: 'block', marginBottom: '0.4rem' }}>
          When did you feel this? <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional, defaults to now)</span>
        </label>
        <input
          id="mood-datetime" type="datetime-local" value={loggedAt}
          max={new Date().toISOString().slice(0, 16)}
          onChange={e => setLoggedAt(e.target.value)}
          style={{
            width: '100%', padding: '0.6rem 0.875rem', borderRadius: '10px',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.18)'}`,
            background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
            color: isDark ? '#e8e6ff' : '#1a1a2e', fontSize: '0.875rem', outline: 'none',
            colorScheme: isDark ? 'dark' : 'light',
          }}
        />
      </div>

      {/* Note */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="mood-note" style={{ fontSize: '0.825rem', fontWeight: 600, opacity: 0.7, display: 'block', marginBottom: '0.4rem' }}>
          Add a note <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional, max 500 chars)</span>
        </label>
        <textarea
          id="mood-note"
          value={note}
          maxLength={500}
          rows={3}
          placeholder="What's on your mind?"
          onChange={e => setNote(e.target.value)}
          style={{
            width: '100%', padding: '0.65rem 0.875rem', borderRadius: '10px', resize: 'vertical',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.18)'}`,
            background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
            color: isDark ? '#e8e6ff' : '#1a1a2e', fontSize: '0.875rem', outline: 'none',
            fontFamily: "'Inter', sans-serif", lineHeight: 1.5, minHeight: 70,
          }}
        />
        <div style={{ textAlign: 'right', fontSize: '0.7rem', opacity: 0.45, marginTop: '0.2rem' }}>{note.length}/500</div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '0.6rem 0.875rem', borderRadius: '8px', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', fontSize: '0.825rem', color: '#ff6b6b', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
        {isEdit && (
          <button type="button" onClick={onCancel} id="mood-logger-cancel-btn"
            style={{ padding: '0.6rem 1.2rem', borderRadius: '9999px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.2)'}`, background: 'transparent', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, color: isDark ? 'rgba(232,230,255,0.7)' : '#6c63ff' }}
          >Cancel</button>
        )}
        <button
          type="submit"
          id="mood-logger-submit-btn"
          disabled={saving || !selectedMood}
          style={{
            padding: '0.6rem 1.75rem', borderRadius: '9999px', border: 'none',
            background: selectedMood ? (activeMeta?.gradient ?? 'linear-gradient(135deg,#6c63ff,#4ecdc4)') : 'rgba(128,128,128,0.2)',
            color: selectedMood ? '#fff' : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'),
            cursor: saving || !selectedMood ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: '0.9rem',
            boxShadow: selectedMood ? `0 4px 18px ${activeMeta?.color ?? '#6c63ff'}40` : 'none',
            transition: 'all 0.25s ease',
          }}
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Log Mood'}
        </button>
      </div>
    </form>
  );
};

export default MoodLogger;
