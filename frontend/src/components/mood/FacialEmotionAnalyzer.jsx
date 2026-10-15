/**
 * components/mood/FacialEmotionAnalyzer.jsx
 * Camera-based facial emotion estimation — Part 11.
 *
 * Architecture:
 *   - All face detection runs in the browser (face-api.js + TensorFlow.js)
 *   - NO images or frames are ever sent to the server
 *   - Only the detected emotion label + confidence is saved to the backend
 *   - faceEmotionProvider.js is the ONLY face-api import — fully modular
 *
 * States:
 *   idle → loading_models → ready → streaming → analyzing → result → saved
 *
 * Error cases handled:
 *   - Permission denied
 *   - Camera unavailable / no device
 *   - No face detected
 *   - Multiple faces detected (warns, uses primary)
 *   - Models fail to load
 *   - Backend save fails
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { SectionHeader, Badge } from '../dashboard/ui.jsx';
import * as faceProvider from '../../utils/faceEmotionProvider.js';
import * as moodService from '../../services/moodService.js';

// ── Emotion display config (aligned with TextEmotionAnalyzer) ─
const EMOTION_CONFIG = {
  happy:   { icon: '😊', color: '#f7c59f', badge: 'amber',  label: 'Happy'   },
  sad:     { icon: '😔', color: '#7c6f9f', badge: 'purple', label: 'Sad'     },
  stressed:{ icon: '😰', color: '#4ecdc4', badge: 'teal',   label: 'Stressed'},
  anxious: { icon: '😟', color: '#6c63ff', badge: 'purple', label: 'Anxious' },
  angry:   { icon: '😠', color: '#ff6b6b', badge: 'red',    label: 'Angry'   },
  calm:    { icon: '😌', color: '#4ecdc4', badge: 'teal',   label: 'Calm'    },
  neutral: { icon: '😐', color: '#a8e6cf', badge: 'green',  label: 'Neutral' },
};

// ── Wellness recommendations (same as TextEmotionAnalyzer) ────
const WELLNESS_MAP = {
  happy:   { icon: '🌟', activity: 'Gratitude Journal',       path: '/dashboard/user/chat', description: 'Channel this positive energy — write 3 things you are grateful for right now.' },
  sad:     { icon: '🕊️', activity: 'Mindfulness Session',     path: '/dashboard/user/chat', description: 'A gentle 10-minute mindfulness session to help you process difficult feelings.' },
  stressed:{ icon: '🫁', activity: '4-7-8 Breathing',         path: '/dashboard/user/chat', description: 'Inhale 4 s → Hold 7 s → Exhale 8 s. Repeat 4 cycles to calm your nervous system.' },
  anxious: { icon: '🌿', activity: '5-4-3-2-1 Grounding',     path: '/dashboard/user/chat', description: '5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.' },
  angry:   { icon: '🏃', activity: 'Physical Movement Break', path: '/dashboard/user/chat', description: 'A brisk 5-minute walk metabolises adrenaline faster than anything else.' },
  calm:    { icon: '🧘', activity: 'Body Scan Meditation',    path: '/dashboard/user/chat', description: 'Deepen this calm with an 8-minute progressive body scan.' },
  neutral: { icon: '💨', activity: 'Mindful Breathing',       path: '/dashboard/user/chat', description: 'Six breaths per minute (5 s in, 5 s out) maintains your baseline wellbeing.' },
};

// ── Confidence bar ────────────────────────────────────────────
const ConfidenceBar = ({ confidence, color, isDark }) => {
  const pct = Math.round(confidence * 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={{ fontSize: '0.75rem', opacity: 0.55 }}>Confidence</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ height: 7, borderRadius: 999, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.07)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${color}88,${color})`, borderRadius: 999, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
    </div>
  );
};

// ── Intensity dots ────────────────────────────────────────────
const IntensityDots = ({ intensity, color }) => (
  <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
    {[1,2,3,4,5].map(i => (
      <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: i <= intensity ? color : 'rgba(128,128,128,0.15)', transition: 'background 0.3s' }} />
    ))}
    <span style={{ fontSize: '0.7rem', opacity: 0.5, marginLeft: '0.2rem' }}>{intensity}/5</span>
  </div>
);

// ── Camera permission state icon ──────────────────────────────
const CameraIcon = ({ size = 48, color = '#6c63ff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
const FacialEmotionAnalyzer = ({ onMoodSaved }) => {
  const { isDark } = useTheme();

  // ── State machine ─────────────────────────────────────────
  // 'idle' | 'loading_models' | 'ready' | 'requesting_camera' |
  // 'streaming' | 'analyzing' | 'result' | 'error'
  const [phase, setPhase]           = useState('idle');
  const [error, setError]           = useState(null);
  const [modelsProgress, setModelsProgress] = useState('');

  // Detection result
  const [result, setResult]         = useState(null);  // { emotion, confidence, allScores, faceCount }
  const [multiFaceWarn, setMultiFaceWarn] = useState(false);

  // Save state
  const [saving, setSaving]         = useState(false);
  const [saved,  setSaved]          = useState(false);

  // ── Refs ──────────────────────────────────────────────────
  const videoRef   = useRef(null);
  const streamRef  = useRef(null);  // MediaStream

  const textMain  = isDark ? '#e8e6ff' : '#1a1a2e';
  const textMuted = isDark ? 'rgba(232,230,255,0.45)' : 'rgba(26,26,46,0.45)';
  const border    = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.1)';

  const emotionCfg  = result ? (EMOTION_CONFIG[result.emotion] ?? EMOTION_CONFIG.neutral) : null;
  const wellnessCfg = result ? WELLNESS_MAP[result.emotion] : null;

  // ── Cleanup: stop camera on unmount ──────────────────────
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // ── Step 1: Load models ───────────────────────────────────
  const handleStart = useCallback(async () => {
    setError(null);
    setResult(null);
    setSaved(false);
    setMultiFaceWarn(false);

    if (!faceProvider.isReady()) {
      setPhase('loading_models');
      setModelsProgress('Loading face detection models…');
      try {
        await faceProvider.loadModels();
        setModelsProgress('');
      } catch (err) {
        setPhase('error');
        setError('Failed to load face detection models. Please refresh the page and try again.');
        return;
      }
    }

    // ── Step 2: Request camera permission ─────────────────
    setPhase('requesting_camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase('streaming');
    } catch (err) {
      setPhase('error');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission was denied. Please allow camera access in your browser settings and try again.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on this device. Please connect a camera and try again.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application. Please close it and try again.');
      } else {
        setError(`Camera error: ${err.message}`);
      }
    }
  }, []);

  // ── Step 3: Capture and analyse ───────────────────────────
  const handleCapture = useCallback(async () => {
    if (!videoRef.current || phase !== 'streaming') return;

    setPhase('analyzing');
    setError(null);
    setMultiFaceWarn(false);

    try {
      const detection = await faceProvider.detectEmotion(videoRef.current);

      stopCamera();

      if (!detection) {
        setPhase('streaming');
        // Restart camera for retry
        await handleStart();
        setError('No face detected. Please ensure your face is clearly visible and well-lit, then try again.');
        return;
      }

      if (detection.faceCount > 1) {
        setMultiFaceWarn(true);
      }

      setResult(detection);
      setPhase('result');
    } catch (err) {
      setPhase('error');
      setError(err.message || 'Detection failed. Please try again.');
      stopCamera();
    }
  }, [phase, stopCamera, handleStart]);

  // ── Step 4: Save to mood log ──────────────────────────────
  const handleSave = useCallback(async () => {
    if (!result || saving || saved) return;
    setSaving(true);
    setError(null);
    try {
      // Confidence → intensity mapping: 0-0.4 → 2, 0.4-0.7 → 3, 0.7-0.85 → 4, 0.85+ → 5
      const intensity = result.confidence >= 0.85 ? 5
        : result.confidence >= 0.70 ? 4
        : result.confidence >= 0.40 ? 3 : 2;

      await moodService.saveFacialMood({
        mood:       result.emotion,
        intensity,
        confidence: result.confidence,
      });
      setSaved(true);
      onMoodSaved?.();
    } catch (err) {
      setError(err.message || 'Failed to save mood entry. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [result, saving, saved, onMoodSaved]);

  const handleReset = () => {
    stopCamera();
    setPhase('idle');
    setResult(null);
    setError(null);
    setSaved(false);
    setMultiFaceWarn(false);
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div id="facial-emotion-analyzer">
      <SectionHeader
        title="📷 Facial Emotion Estimation"
        subtitle="Point your camera at your face — AI estimates your emotion from your expression"
      />

      {/* Disclaimer */}
      <div style={{
        padding: '0.6rem 0.9rem', borderRadius: '10px', marginBottom: '1rem',
        background: isDark ? 'rgba(108,99,255,0.07)' : 'rgba(108,99,255,0.05)',
        border: `1px solid ${isDark ? 'rgba(108,99,255,0.18)' : 'rgba(108,99,255,0.12)'}`,
        fontSize: '0.75rem', color: textMuted, lineHeight: 1.5,
        display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
      }}>
        <span style={{ flexShrink: 0 }}>🔒</span>
        <span>
          <strong style={{ color: textMain }}>Privacy:</strong> Face detection runs entirely in your browser.
          No images are sent to the server — only the detected emotion label.{' '}
          This is <strong style={{ color: textMain }}>facial emotion estimation only</strong>, not mental health diagnosis.
        </span>
      </div>

      {/* Video preview + controls */}
      <div style={{
        borderRadius: '16px', overflow: 'hidden',
        border: `1px solid ${border}`,
        background: isDark ? 'rgba(15,14,26,0.7)' : '#f8f7ff',
        marginBottom: '1rem',
        minHeight: 280,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {/* Video element — always mounted, hidden when not streaming */}
        <video
          ref={videoRef}
          id="facial-camera-feed"
          muted
          playsInline
          style={{
            width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block',
            display: ['streaming', 'analyzing'].includes(phase) ? 'block' : 'none',
            transform: 'scaleX(-1)', // mirror effect
            borderRadius: '14px',
          }}
        />

        {/* Idle state */}
        {phase === 'idle' && (
          <div style={{ textAlign: 'center', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(78,205,196,0.1))',
              border: `1.5px solid rgba(108,99,255,0.2)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CameraIcon size={36} color="#6c63ff" />
            </div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '1rem', color: textMain }}>
              Start Camera
            </div>
            <p style={{ fontSize: '0.82rem', color: textMuted, maxWidth: 320, lineHeight: 1.6, margin: 0 }}>
              Click the button below to start your camera. Your browser will ask for permission.
            </p>
          </div>
        )}

        {/* Loading models */}
        {phase === 'loading_models' && (
          <div style={{ textAlign: 'center', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(108,99,255,0.2)', borderTopColor: '#6c63ff', animation: 'spin 0.9s linear infinite' }} />
            <div style={{ fontSize: '0.88rem', color: textMuted }}>{modelsProgress}</div>
            <div style={{ fontSize: '0.75rem', color: textMuted, opacity: 0.7 }}>
              First load downloads ~600 KB. Subsequent uses are instant.
            </div>
          </div>
        )}

        {/* Requesting camera */}
        {phase === 'requesting_camera' && (
          <div style={{ textAlign: 'center', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(78,205,196,0.2)', borderTopColor: '#4ecdc4', animation: 'spin 0.9s linear infinite' }} />
            <div style={{ fontSize: '0.88rem', color: textMuted }}>Requesting camera access…</div>
            <div style={{ fontSize: '0.75rem', color: textMuted, opacity: 0.7 }}>Allow the browser permission prompt</div>
          </div>
        )}

        {/* Analyzing overlay */}
        {phase === 'analyzing' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '0.75rem', borderRadius: '14px',
          }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(108,99,255,0.3)', borderTopColor: '#6c63ff', animation: 'spin 0.9s linear infinite' }} />
            <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>Detecting expression…</div>
          </div>
        )}

        {/* Error state in preview area */}
        {phase === 'error' && (
          <div style={{ textAlign: 'center', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '2.5rem' }}>📷</div>
            <div style={{ fontSize: '0.85rem', color: isDark ? '#ff9494' : '#c0392b', maxWidth: 340, lineHeight: 1.55 }}>{error}</div>
          </div>
        )}
      </div>

      {/* Multi-face warning */}
      {multiFaceWarn && (
        <div style={{
          padding: '0.6rem 0.9rem', borderRadius: '10px', marginBottom: '0.75rem',
          background: 'rgba(247,197,159,0.1)', border: '1px solid rgba(247,197,159,0.35)',
          fontSize: '0.78rem', color: isDark ? '#f7c59f' : '#c4854a',
          display: 'flex', gap: '0.5rem', alignItems: 'center',
        }}>
          <span>⚠️</span>
          Multiple faces detected. Using the primary face for estimation.
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {/* Start / Retry */}
        {['idle', 'error'].includes(phase) && (
          <button
            id="facial-start-btn"
            onClick={handleStart}
            style={{
              flex: 1, padding: '0.75rem', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg,#6c63ff,#4ecdc4)',
              color: '#fff', fontSize: '0.9rem', fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 4px 18px rgba(108,99,255,0.35)',
              transition: 'all 0.2s',
            }}
          >
            {phase === 'error' ? '🔄 Try Again' : '📷 Start Camera'}
          </button>
        )}

        {/* Capture */}
        {phase === 'streaming' && (
          <button
            id="facial-capture-btn"
            onClick={handleCapture}
            style={{
              flex: 1, padding: '0.75rem', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg,#6c63ff,#5a4fd9)',
              color: '#fff', fontSize: '0.9rem', fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 4px 18px rgba(108,99,255,0.35)',
              transition: 'all 0.2s',
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}
          >
            📸 Capture & Analyse
          </button>
        )}

        {/* Stop camera */}
        {phase === 'streaming' && (
          <button
            id="facial-stop-btn"
            onClick={handleReset}
            style={{
              padding: '0.75rem 1rem', borderRadius: '12px',
              border: `1px solid ${border}`,
              background: 'transparent', color: textMuted,
              fontSize: '0.85rem', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            ✕ Stop
          </button>
        )}

        {/* Reset after result */}
        {phase === 'result' && (
          <button
            id="facial-retake-btn"
            onClick={handleReset}
            style={{
              padding: '0.75rem 1rem', borderRadius: '12px',
              border: `1px solid ${border}`,
              background: 'transparent', color: textMuted,
              fontSize: '0.85rem', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            🔄 Retake
          </button>
        )}
      </div>

      {/* ── Result card ──────────────────────────────────────── */}
      {phase === 'result' && result && emotionCfg && (
        <div style={{
          borderRadius: '16px', overflow: 'hidden',
          border: `1.5px solid ${emotionCfg.color}30`,
          background: isDark ? 'rgba(26,24,48,0.9)' : '#fff',
          boxShadow: `0 6px 28px ${emotionCfg.color}18`,
          animation: 'scaleIn 0.4s ease forwards',
        }}>
          {/* Emotion header */}
          <div style={{
            padding: '1rem 1.25rem',
            background: `linear-gradient(135deg, ${emotionCfg.color}18, ${emotionCfg.color}06)`,
            borderBottom: `1px solid ${emotionCfg.color}20`,
            display: 'flex', alignItems: 'center', gap: '0.85rem',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '14px', flexShrink: 0,
              background: `linear-gradient(135deg, ${emotionCfg.color}30, ${emotionCfg.color}12)`,
              border: `1.5px solid ${emotionCfg.color}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.9rem',
            }}>
              {emotionCfg.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.15rem', color: textMain }}>
                  {emotionCfg.label}
                </span>
                <Badge color={emotionCfg.badge}>Detected</Badge>
                <Badge color="default" style={{ fontSize: '0.63rem' }}>Facial estimation</Badge>
              </div>
              <IntensityDots
                intensity={result.confidence >= 0.85 ? 5 : result.confidence >= 0.70 ? 4 : result.confidence >= 0.40 ? 3 : 2}
                color={emotionCfg.color}
              />
            </div>
          </div>

          <div style={{ padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {/* Confidence bar */}
            <ConfidenceBar confidence={result.confidence} color={emotionCfg.color} isDark={isDark} />

            {/* All expression scores */}
            {result.allScores && Object.keys(result.allScores).length > 1 && (
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Expression breakdown
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {Object.entries(result.allScores)
                    .sort(([,a],[,b]) => b - a)
                    .slice(0, 5)
                    .map(([emotion, score]) => {
                      const cfg = EMOTION_CONFIG[emotion] ?? EMOTION_CONFIG.neutral;
                      return (
                        <div key={emotion} style={{
                          display: 'flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.25rem 0.6rem', borderRadius: '20px',
                          background: `${cfg.color}12`,
                          border: `1px solid ${cfg.color}28`,
                          fontSize: '0.72rem', color: textMain,
                        }}>
                          <span>{cfg.icon}</span>
                          <span style={{ fontWeight: 600 }}>{cfg.label}</span>
                          <span style={{ opacity: 0.55 }}>{Math.round(score * 100)}%</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Wellness recommendation */}
            {wellnessCfg && (
              <div style={{
                padding: '0.85rem 1rem', borderRadius: '12px',
                background: `${emotionCfg.color}10`,
                border: `1px solid ${emotionCfg.color}25`,
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: textMuted, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  💡 Recommended Activity
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{wellnessCfg.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: textMain, marginBottom: '0.25rem' }}>
                      {wellnessCfg.activity}
                    </div>
                    <p style={{ fontSize: '0.82rem', color: textMuted, margin: '0 0 0.55rem', lineHeight: 1.55 }}>
                      {wellnessCfg.description}
                    </p>
                    <Link to={wellnessCfg.path} style={{ fontSize: '0.78rem', fontWeight: 600, color: emotionCfg.color, textDecoration: 'none' }}>
                      Try it now →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Save button */}
            <button
              id="save-facial-mood-btn"
              onClick={handleSave}
              disabled={saving || saved}
              style={{
                padding: '0.7rem 1rem', borderRadius: '10px', border: 'none',
                background: saved ? 'rgba(78,205,196,0.12)' : `${emotionCfg.color}18`,
                color: saved ? '#4ecdc4' : emotionCfg.color,
                fontWeight: 600, fontSize: '0.85rem', cursor: saving || saved ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                border: `1px solid ${saved ? '#4ecdc430' : `${emotionCfg.color}30`}`,
              }}
            >
              {saving ? '⏳ Saving…' : saved ? '✅ Saved to Mood Log' : '💾 Save to Mood Log'}
            </button>
          </div>
        </div>
      )}

      {/* General error banner (outside video preview) */}
      {error && phase !== 'error' && (
        <div style={{
          padding: '0.75rem 1rem', borderRadius: '12px', marginTop: '0.75rem',
          background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.22)',
          color: isDark ? '#ff9494' : '#c0392b', fontSize: '0.85rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <span>⚠️</span>
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6 }}>✕</button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
      `}</style>
    </div>
  );
};

export default FacialEmotionAnalyzer;
