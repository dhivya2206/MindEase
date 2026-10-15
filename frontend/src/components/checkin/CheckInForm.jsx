/**
 * components/checkin/CheckInForm.jsx
 * Daily wellness check-in form — 5 questions + optional note.
 *
 * Shows live score preview as the user adjusts sliders.
 * Transparent score formula is displayed below the preview.
 * Handles both create (new day) and update (edit existing) modes.
 *
 * Props:
 *   existing     — pre-populated CheckIn object (edit mode)
 *   onSave(entry) — called after successful submit
 *   todayDone    — bool; if true and not in edit mode, shows "already done" state
 */

import { useState, useMemo } from 'react';
import { QUESTIONS, getScoreRange } from '../../constants/checkIn.js';
import * as checkInService from '../../services/checkInService.js';
import { useTheme } from '../../context/ThemeContext.jsx';

// ── Live score calculator (mirrors backend formula) ───────────
const liveScore = (answers) => {
  const { sleep = 3, energy = 3, stress = 3, positivity = 3, focus = 3 } = answers;
  return Math.round(((sleep + energy + (6 - stress) + positivity + focus) / 25) * 100);
};

// ── Single question row ───────────────────────────────────────
const QuestionRow = ({ q, value, onChange, isDark }) => {
  const dotColors = [1, 2, 3, 4, 5].map(v => {
    if (q.inverted) return v <= value ? q.color : 'rgba(128,128,128,0.2)';
    return v <= value ? q.color : 'rgba(128,128,128,0.2)';
  });

  return (
    <div style={{ padding: '1.1rem 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.07)'}` }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{q.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isDark ? '#e8e6ff' : '#1a1a2e' }}>{q.label}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.1rem' }}>{q.question}</div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
          background: `${q.color}20`, border: `1.5px solid ${q.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1rem', color: q.color,
        }}>{value}</div>
      </div>

      {/* Dot selector */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', opacity: 0.5, flexShrink: 0, minWidth: 52 }}>{q.lowLabel}</span>
        <div style={{ flex: 1, display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5].map(v => (
            <button
              key={v}
              type="button"
              id={`checkin-${q.key}-${v}`}
              onClick={() => onChange(v)}
              title={`${q.label}: ${v}`}
              style={{
                flex: 1, height: 36, borderRadius: '8px', border: 'none',
                background: v <= value ? q.color : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.07)'),
                cursor: 'pointer',
                transform: v === value ? 'scale(1.12)' : 'scale(1)',
                transition: 'all 0.15s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: v <= value ? '#fff' : 'transparent',
                fontSize: '0.65rem', fontWeight: 700,
              }}
            >
              {v}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '0.7rem', opacity: 0.5, flexShrink: 0, minWidth: 56, textAlign: 'right' }}>{q.highLabel}</span>
      </div>

      {q.inverted && (
        <p style={{ fontSize: '0.72rem', opacity: 0.45, margin: '0.4rem 0 0', fontStyle: 'italic' }}>
          ↑ Lower score = better for wellness (stress is inverted in the formula)
        </p>
      )}
    </div>
  );
};

// ── Score preview ring ────────────────────────────────────────
const ScoreRing = ({ score, range, isDark }) => {
  const size = 100;
  const r = 38;
  const circumference = 2 * Math.PI * r;
  const progress = (score - 20) / 80; // normalise 20-100 → 0-1
  const dash = circumference * Math.min(Math.max(progress, 0), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <svg width={size} height={size} viewBox="0 0 100 100" aria-label={`Wellness score: ${score}`}>
        {/* Track */}
        <circle cx="50" cy="50" r={r} fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.1)'}
          strokeWidth="7"
        />
        {/* Progress */}
        <circle cx="50" cy="50" r={r} fill="none"
          stroke={range.color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.3s ease' }}
        />
        {/* Icon */}
        <text x="50" y="45" textAnchor="middle" fontSize="18" dominantBaseline="middle">{range.icon}</text>
        {/* Score */}
        <text x="50" y="62" textAnchor="middle" fontSize="13" fontWeight="800" fill={range.color} fontFamily="Outfit,sans-serif">{score}</text>
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.95rem', color: range.color }}>{range.label}</div>
        <div style={{ fontSize: '0.75rem', opacity: 0.55, maxWidth: 160, lineHeight: 1.4 }}>{range.description}</div>
      </div>
    </div>
  );
};

// ── Score formula explainer ───────────────────────────────────
const FormulaExplainer = ({ answers, score, isDark }) => {
  const { sleep = 3, energy = 3, stress = 3, positivity = 3, focus = 3 } = answers;
  const parts = [
    { label: 'Sleep',          value: sleep,       contribution: sleep },
    { label: 'Energy',         value: energy,      contribution: energy },
    { label: 'Stress (inv.)',   value: stress,      contribution: 6 - stress, note: `6−${stress}=${6-stress}` },
    { label: 'Positivity',     value: positivity,  contribution: positivity },
    { label: 'Focus',          value: focus,        contribution: focus },
  ];
  const raw = parts.reduce((s, p) => s + p.contribution, 0);

  return (
    <details style={{ marginTop: '0.75rem' }}>
      <summary style={{ fontSize: '0.78rem', opacity: 0.6, cursor: 'pointer', fontWeight: 600, userSelect: 'none' }}>
        How is my score calculated? ▾
      </summary>
      <div style={{ marginTop: '0.6rem', padding: '0.875rem', borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(108,99,255,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.1)'}`, fontSize: '0.8rem' }}>
        <p style={{ margin: '0 0 0.5rem', opacity: 0.6, fontStyle: 'italic' }}>
          ⚠️ This is a personal wellness indicator, <strong>not a medical assessment</strong>.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {parts.map(p => (
            <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ opacity: 0.75 }}>{p.label}</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {p.note ?? p.contribution}
              </span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.15)'}`, paddingTop: '0.4rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ opacity: 0.75 }}>Raw sum / 25 × 100</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#6c63ff' }}>{raw} / 25 × 100 = <strong>{score}</strong></span>
          </div>
        </div>
      </div>
    </details>
  );
};

// ── Main form ─────────────────────────────────────────────────
const CheckInForm = ({ existing = null, onSave, todayDone = false }) => {
  const { isDark } = useTheme();
  const isEdit = Boolean(existing);

  const [answers, setAnswers] = useState({
    sleep:      existing?.sleep      ?? 3,
    energy:     existing?.energy     ?? 3,
    stress:     existing?.stress     ?? 3,
    positivity: existing?.positivity ?? 3,
    focus:      existing?.focus      ?? 3,
  });
  const [note,    setNote]    = useState(existing?.note ?? '');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const score = useMemo(() => liveScore(answers), [answers]);
  const range = getScoreRange(score);

  const setAnswer = (key, value) => setAnswers(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const dto = { ...answers, note: note.trim() || null };
      const saved = isEdit
        ? await checkInService.updateCheckIn(existing.id, dto)
        : await checkInService.createCheckIn(dto);
      onSave(saved);
    } catch (err) {
      setError(err.message || 'Failed to save check-in.');
    } finally {
      setSaving(false);
    }
  };

  // Already done today (and not editing)
  if (todayDone && !isEdit) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✅</div>
        <h3 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, margin: '0 0 0.5rem' }}>Check-in complete!</h3>
        <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>You've already done today's check-in. Come back tomorrow!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} id="checkin-form">
      {/* Questions */}
      {QUESTIONS.map(q => (
        <QuestionRow
          key={q.key}
          q={q}
          value={answers[q.key]}
          onChange={(v) => setAnswer(q.key, v)}
          isDark={isDark}
        />
      ))}

      {/* Note */}
      <div style={{ marginTop: '1.25rem', marginBottom: '0.75rem' }}>
        <label htmlFor="checkin-note" style={{ fontSize: '0.825rem', fontWeight: 600, opacity: 0.7, display: 'block', marginBottom: '0.4rem' }}>
          Reflection note <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span>
        </label>
        <textarea
          id="checkin-note"
          value={note}
          maxLength={500}
          rows={2}
          placeholder="Anything on your mind today?"
          onChange={e => setNote(e.target.value)}
          style={{
            width: '100%', padding: '0.6rem 0.875rem', borderRadius: '10px', resize: 'vertical',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.18)'}`,
            background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
            color: isDark ? '#e8e6ff' : '#1a1a2e', fontSize: '0.875rem', outline: 'none',
            fontFamily: "'Inter', sans-serif", lineHeight: 1.5,
          }}
        />
      </div>

      {/* Formula explainer */}
      <FormulaExplainer answers={answers} score={score} isDark={isDark} />

      {error && (
        <div style={{ padding: '0.6rem 0.875rem', borderRadius: '8px', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', fontSize: '0.825rem', color: '#ff6b6b', margin: '0.875rem 0' }}>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        id="checkin-submit-btn"
        disabled={saving}
        style={{
          width: '100%', marginTop: '1rem',
          padding: '0.75rem', borderRadius: '12px', border: 'none',
          background: `linear-gradient(135deg, ${range.color}, #6c63ff)`,
          color: '#fff', fontWeight: 700, fontSize: '0.95rem',
          cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
          boxShadow: `0 4px 20px ${range.color}40`,
          transition: 'all 0.25s ease',
        }}
      >
        {saving ? 'Saving…' : isEdit ? 'Update Check-in' : 'Submit Check-in'}
      </button>
    </form>
  );
};

export { CheckInForm, ScoreRing, liveScore };
export default CheckInForm;
