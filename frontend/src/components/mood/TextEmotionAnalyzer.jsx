/**
 * components/mood/TextEmotionAnalyzer.jsx
 * AI-powered text emotion analysis widget — Part 10.
 *
 * Features:
 *   - Free-text input (textarea)
 *   - Example prompts to guide the user
 *   - Displays: detected emotion, confidence bar, intensity, reasoning
 *   - Recommended wellness activity card
 *   - "Save to Mood Log" button (sets source=TEXT_AI in DB)
 *   - Clear disclaimer: estimation only, not medical diagnosis
 *   - Graceful error handling (AI unavailable, etc.)
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { SectionHeader, Badge, SkeletonBlock } from '../dashboard/ui.jsx';
import * as moodService from '../../services/moodService.js';

// ── Emotion config ────────────────────────────────────────────
const EMOTION_CONFIG = {
  happy:    { icon: '😊', color: '#f7c59f', badge: 'amber',  label: 'Happy'    },
  sad:      { icon: '😔', color: '#7c6f9f', badge: 'purple', label: 'Sad'      },
  stressed: { icon: '😰', color: '#4ecdc4', badge: 'teal',   label: 'Stressed' },
  anxious:  { icon: '😟', color: '#6c63ff', badge: 'purple', label: 'Anxious'  },
  angry:    { icon: '😠', color: '#ff6b6b', badge: 'red',    label: 'Angry'    },
  calm:     { icon: '😌', color: '#4ecdc4', badge: 'teal',   label: 'Calm'     },
  neutral:  { icon: '😐', color: '#a8e6cf', badge: 'green',  label: 'Neutral'  },
};

// ── Example prompts ───────────────────────────────────────────
const EXAMPLES = [
  'I am very stressed because of my placement preparation.',
  'I feel anxious about my upcoming presentation.',
  'Today has been a wonderful day, I feel really good!',
  'I cannot stop worrying about everything.',
  'I feel calm and focused today.',
  'Everything feels overwhelming right now.',
];

// ── Confidence bar ────────────────────────────────────────────
const ConfidenceBar = ({ confidence, color, isDark }) => {
  const pct = Math.round(confidence * 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <span style={{ fontSize: '0.78rem', opacity: 0.6 }}>Confidence</span>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{
        height: 8, borderRadius: 999,
        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          borderRadius: 999,
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  );
};

// ── Intensity dots ────────────────────────────────────────────
const IntensityDots = ({ intensity, color }) => (
  <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} style={{
        width: 10, height: 10, borderRadius: '50%',
        background: i <= intensity ? color : 'rgba(128,128,128,0.15)',
        transition: 'background 0.3s',
      }} />
    ))}
    <span style={{ fontSize: '0.72rem', opacity: 0.55, marginLeft: '0.25rem' }}>
      {intensity}/5 intensity
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
const TextEmotionAnalyzer = ({ onMoodSaved }) => {
  const { isDark } = useTheme();

  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);   // { emotion, confidence, intensity, reasoning, wellness }
  const [error, setError]       = useState(null);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  const textMain  = isDark ? '#e8e6ff' : '#1a1a2e';
  const textMuted = isDark ? 'rgba(232,230,255,0.45)' : 'rgba(26,26,46,0.45)';
  const border    = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.1)';

  const emotionCfg = result ? (EMOTION_CONFIG[result.emotion] ?? EMOTION_CONFIG.neutral) : null;

  // ── Analyse text ─────────────────────────────────────────────
  const handleAnalyze = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);

    try {
      const { analysis } = await moodService.analyzeText(trimmed, false);
      setResult(analysis);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Save to mood log ─────────────────────────────────────────
  const handleSave = async () => {
    if (!result || saved || saving) return;
    setSaving(true);
    try {
      await moodService.analyzeText(text.trim(), true);
      setSaved(true);
      onMoodSaved?.();
    } catch (err) {
      setError(err.message || 'Failed to save mood entry.');
    } finally {
      setSaving(false);
    }
  };

  const handleExample = (example) => {
    setText(example);
    setResult(null);
    setSaved(false);
    setError(null);
  };

  const handleClear = () => {
    setText('');
    setResult(null);
    setSaved(false);
    setError(null);
  };

  return (
    <div id="text-emotion-analyzer">
      <SectionHeader
        title="✍️ Text Emotion Analysis"
        subtitle="Describe how you feel in your own words — AI estimates your emotion"
      />

      {/* Disclaimer banner */}
      <div style={{
        padding: '0.6rem 0.9rem', borderRadius: '10px', marginBottom: '1rem',
        background: isDark ? 'rgba(108,99,255,0.07)' : 'rgba(108,99,255,0.05)',
        border: `1px solid ${isDark ? 'rgba(108,99,255,0.18)' : 'rgba(108,99,255,0.12)'}`,
        fontSize: '0.75rem', color: textMuted, lineHeight: 1.5,
        display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
      }}>
        <span style={{ flexShrink: 0 }}>🔬</span>
        <span>
          This is <strong style={{ color: textMain }}>emotion estimation only</strong> — not medical diagnosis.
          For mental health concerns, please consult a qualified professional.
        </span>
      </div>

      {/* Textarea */}
      <div style={{ marginBottom: '0.85rem' }}>
        <textarea
          id="emotion-text-input"
          value={text}
          onChange={(e) => { setText(e.target.value); setResult(null); setSaved(false); }}
          placeholder='Describe how you feel… e.g. "I am very stressed because of my placement preparation."'
          rows={4}
          maxLength={1000}
          style={{
            width: '100%', padding: '0.85rem 1rem', borderRadius: '14px',
            border: `1.5px solid ${border}`,
            background: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa',
            color: textMain, fontSize: '0.9rem', lineHeight: 1.6,
            resize: 'vertical', outline: 'none', fontFamily: 'inherit',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => { e.target.style.borderColor = '#6c63ff'; e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.1)'; }}
          onBlur={(e) => { e.target.style.borderColor = border; e.target.style.boxShadow = 'none'; }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', fontSize: '0.72rem', color: textMuted }}>
          <span>{text.length}/1000 characters</span>
          {text && (
            <button onClick={handleClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, fontSize: '0.72rem', padding: 0 }}>
              Clear ✕
            </button>
          )}
        </div>
      </div>

      {/* Example prompts */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.73rem', fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          Try an example
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => handleExample(ex)}
              style={{
                padding: '0.3rem 0.7rem', borderRadius: '20px', fontSize: '0.73rem',
                border: `1px solid ${border}`,
                background: text === ex ? 'rgba(108,99,255,0.12)' : 'transparent',
                color: text === ex ? '#6c63ff' : textMuted,
                cursor: 'pointer', transition: 'all 0.18s',
              }}
              onMouseEnter={(e) => { if (text !== ex) { e.currentTarget.style.borderColor = '#6c63ff'; e.currentTarget.style.color = '#6c63ff'; } }}
              onMouseLeave={(e) => { if (text !== ex) { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textMuted; } }}
            >
              "{ex.slice(0, 38)}{ex.length > 38 ? '…' : ''}"
            </button>
          ))}
        </div>
      </div>

      {/* Analyse button */}
      <button
        id="analyze-emotion-btn"
        onClick={handleAnalyze}
        disabled={loading || !text.trim()}
        style={{
          width: '100%', padding: '0.8rem', borderRadius: '12px', border: 'none',
          background: loading || !text.trim()
            ? (isDark ? 'rgba(108,99,255,0.2)' : 'rgba(108,99,255,0.12)')
            : 'linear-gradient(135deg,#6c63ff,#4ecdc4)',
          color: loading || !text.trim()
            ? (isDark ? 'rgba(232,230,255,0.3)' : 'rgba(108,99,255,0.4)')
            : '#fff',
          fontSize: '0.9rem', fontWeight: 700, cursor: loading || !text.trim() ? 'not-allowed' : 'pointer',
          transition: 'all 0.25s ease',
          boxShadow: !loading && text.trim() ? '0 4px 20px rgba(108,99,255,0.35)' : 'none',
          marginBottom: '1rem',
        }}
      >
        {loading ? '⏳ Analysing…' : '🔍 Analyse Emotion'}
      </button>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '1.25rem', borderRadius: '14px', border: `1px solid ${border}`, background: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa' }}>
          <SkeletonBlock width="40%" height={22} />
          <SkeletonBlock width="70%" height={14} />
          <SkeletonBlock width="100%" height={8} radius={4} />
          <SkeletonBlock width="55%" height={14} />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div style={{
          padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '0.75rem',
          background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.22)',
          color: isDark ? '#ff9494' : '#c0392b', fontSize: '0.85rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          animation: 'fadeInUp 0.3s ease',
        }}>
          <span>⚠️</span>
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6, fontSize: '0.9rem' }}>✕</button>
        </div>
      )}

      {/* Result card */}
      {result && !loading && emotionCfg && (
        <div style={{
          borderRadius: '16px', overflow: 'hidden',
          border: `1.5px solid ${emotionCfg.color}30`,
          background: isDark ? 'rgba(26,24,48,0.9)' : '#fff',
          boxShadow: `0 6px 28px ${emotionCfg.color}18`,
          animation: 'scaleIn 0.4s ease forwards',
        }}>
          {/* Emotion header strip */}
          <div style={{
            padding: '1rem 1.25rem',
            background: `linear-gradient(135deg, ${emotionCfg.color}18, ${emotionCfg.color}08)`,
            borderBottom: `1px solid ${emotionCfg.color}20`,
            display: 'flex', alignItems: 'center', gap: '0.85rem',
          }}>
            <div style={{
              width: 54, height: 54, borderRadius: '14px', flexShrink: 0,
              background: `linear-gradient(135deg, ${emotionCfg.color}30, ${emotionCfg.color}15)`,
              border: `1.5px solid ${emotionCfg.color}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem',
            }}>
              {emotionCfg.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.15rem', color: textMain }}>
                  {emotionCfg.label}
                </span>
                <Badge color={emotionCfg.badge}>Detected</Badge>
                <Badge color="default" style={{ fontSize: '0.65rem' }}>Estimation only</Badge>
              </div>
              <IntensityDots intensity={result.intensity} color={emotionCfg.color} />
            </div>
          </div>

          <div style={{ padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {/* Confidence bar */}
            <ConfidenceBar
              confidence={result.confidence}
              color={emotionCfg.color}
              isDark={isDark}
            />

            {/* AI reasoning */}
            <div style={{
              padding: '0.7rem 0.9rem', borderRadius: '10px',
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(108,99,255,0.04)',
              border: `1px solid ${border}`,
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: textMuted, marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI Reasoning
              </div>
              <p style={{ fontSize: '0.855rem', color: textMain, lineHeight: 1.6, margin: 0 }}>
                {result.reasoning}
              </p>
            </div>

            {/* Wellness recommendation */}
            {result.wellness && (
              <div style={{
                padding: '0.85rem 1rem', borderRadius: '12px',
                background: `${result.wellness.color}12`,
                border: `1px solid ${result.wellness.color}28`,
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: textMuted, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  💡 Recommended Activity
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{result.wellness.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: textMain, marginBottom: '0.25rem' }}>
                      {result.wellness.activity}
                    </div>
                    <p style={{ fontSize: '0.82rem', color: textMuted, margin: '0 0 0.6rem', lineHeight: 1.55 }}>
                      {result.wellness.description}
                    </p>
                    <Link
                      to={result.wellness.path}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        fontSize: '0.78rem', fontWeight: 600, color: result.wellness.color,
                        textDecoration: 'none', opacity: 0.9,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                    >
                      Try it now →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Save to mood log */}
            <button
              id="save-emotion-to-mood-btn"
              onClick={handleSave}
              disabled={saving || saved}
              style={{
                padding: '0.7rem 1rem', borderRadius: '10px', border: 'none',
                background: saved
                  ? 'rgba(78,205,196,0.12)'
                  : `${emotionCfg.color}18`,
                color: saved ? '#4ecdc4' : emotionCfg.color,
                fontWeight: 600, fontSize: '0.85rem', cursor: saving || saved ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                border: `1px solid ${saved ? '#4ecdc430' : `${emotionCfg.color}30`}`,
              }}
              onMouseEnter={(e) => { if (!saving && !saved) { e.currentTarget.style.background = `${emotionCfg.color}28`; } }}
              onMouseLeave={(e) => { if (!saving && !saved) { e.currentTarget.style.background = `${emotionCfg.color}18`; } }}
            >
              {saving ? '⏳ Saving…' : saved ? '✅ Saved to Mood Log' : '💾 Save to Mood Log'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextEmotionAnalyzer;
