/**
 * components/relaxation/FocusTimer.jsx
 * Pomodoro-style focus timer — Part 12.
 *
 * Modes:
 *   Focus   (default 25 min) → Short break (5 min) → Long break (15 min after 4 rounds)
 *
 * Features:
 *   - Configurable focus / short break / long break durations
 *   - Round counter (1-4 before long break)
 *   - Animated ring + colour change per mode
 *   - Web Audio API chime on transitions
 *   - onComplete({ type, durationSec }) callback
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';

const MODES = {
  focus:       { label: 'Focus',        color: '#f7c59f', defaultMin: 25, emoji: '🎯' },
  shortBreak:  { label: 'Short Break',  color: '#4ecdc4', defaultMin: 5,  emoji: '☕' },
  longBreak:   { label: 'Long Break',   color: '#7c6f9f', defaultMin: 15, emoji: '🌿' },
};

const ROUNDS_BEFORE_LONG = 4;

const chime = (freq = 528, decay = 1.5, vol = 0.1) => {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + decay);
    osc.start(); osc.stop(ctx.currentTime + decay);
    setTimeout(() => ctx.close(), (decay + 0.5) * 1000);
  } catch {}
};

const fmt = (sec) =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

// SVG ring
const Ring = ({ progress, size = 200, stroke = 8, color }) => {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeOpacity={0.12} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={c * (1 - progress)}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────
const FocusTimer = ({ onComplete }) => {
  const { isDark } = useTheme();
  const textMain  = isDark ? '#e8e6ff' : '#1a1a2e';
  const textMuted = isDark ? 'rgba(232,230,255,0.45)' : 'rgba(26,26,46,0.45)';
  const border    = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.1)';

  const [config] = useState({
    focus:      MODES.focus.defaultMin,
    shortBreak: MODES.shortBreak.defaultMin,
    longBreak:  MODES.longBreak.defaultMin,
  });

  const [modeKey,    setModeKey]    = useState('focus');
  const [remaining,  setRemaining]  = useState(MODES.focus.defaultMin * 60);
  const [totalSec,   setTotalSec]   = useState(MODES.focus.defaultMin * 60);
  const [running,    setRunning]    = useState(false);
  const [done,       setDone]       = useState(false);
  const [rounds,     setRounds]     = useState(0);         // completed focus rounds

  const intervalRef   = useRef(null);
  const remainingRef  = useRef(remaining);
  const modeRef       = useRef('focus');
  const roundsRef     = useRef(0);

  const currentMode = MODES[modeKey];

  const switchMode = useCallback((key) => {
    clearInterval(intervalRef.current);
    const sec = config[key] * 60;
    modeRef.current    = key;
    remainingRef.current = sec;
    setModeKey(key);
    setRemaining(sec);
    setTotalSec(sec);
    setRunning(false);
    setDone(false);
  }, [config]);

  const handleDone = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setDone(true);
    chime(528, 2.5, 0.13);
    setTimeout(() => chime(432, 2, 0.1), 1200);

    const wasKey = modeRef.current;
    onComplete?.({ type: wasKey, durationSec: config[wasKey] * 60 });

    // Auto-suggest next mode
    if (wasKey === 'focus') {
      roundsRef.current += 1;
      setRounds(roundsRef.current);
    }
  }, [config, onComplete]);

  const start = useCallback(() => {
    if (done) {
      // Suggest next
      if (modeRef.current === 'focus') {
        const nextKey = roundsRef.current % ROUNDS_BEFORE_LONG === 0 && roundsRef.current > 0
          ? 'longBreak' : 'shortBreak';
        switchMode(nextKey);
      } else {
        switchMode('focus');
      }
      return;
    }
    setRunning(true);
    chime(440, 1.2, 0.08);
  }, [done, switchMode]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
  }, []);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      remainingRef.current -= 1;
      setRemaining(remainingRef.current);
      if (remainingRef.current <= 0) handleDone();
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, handleDone]);

  const progress = totalSec > 0 ? (totalSec - remaining) / totalSec : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(108,99,255,0.05)', borderRadius: '12px', padding: '0.3rem' }}>
        {Object.entries(MODES).map(([key, m]) => (
          <button key={key} onClick={() => switchMode(key)}
            style={{
              flex: 1, padding: '0.5rem 0.5rem', borderRadius: '9px', border: 'none',
              background: modeKey === key ? m.color : 'transparent',
              color: modeKey === key ? '#fff' : textMuted,
              fontWeight: modeKey === key ? 700 : 500,
              fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
            }}>
            {m.emoji} {m.label}
          </button>
        ))}
      </div>

      {/* Round indicator */}
      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center' }}>
        {Array.from({ length: ROUNDS_BEFORE_LONG }, (_, i) => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%',
            background: i < (rounds % ROUNDS_BEFORE_LONG || (rounds > 0 && rounds % ROUNDS_BEFORE_LONG === 0 ? ROUNDS_BEFORE_LONG : 0))
              ? currentMode.color : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.12)'),
            transition: 'background 0.3s',
          }} />
        ))}
        <span style={{ fontSize: '0.72rem', color: textMuted, marginLeft: '0.4rem' }}>
          Round {(rounds % ROUNDS_BEFORE_LONG) + 1} of {ROUNDS_BEFORE_LONG}
        </span>
      </div>

      {/* Timer ring */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ring progress={progress} size={200} stroke={8} color={currentMode.color} />
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            {done ? (
              <div>
                <div style={{ fontSize: '1.8rem' }}>✅</div>
                <div style={{ fontSize: '0.8rem', color: textMuted, marginTop: '0.25rem' }}>Done!</div>
              </div>
            ) : (
              <>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '2rem', color: running ? currentMode.color : textMain, transition: 'color 0.3s' }}>
                  {fmt(remaining)}
                </div>
                <div style={{ fontSize: '0.72rem', color: textMuted }}>{currentMode.emoji} {currentMode.label}</div>
              </>
            )}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button id="focus-start-btn" onClick={running ? stop : start}
            style={{
              padding: '0.7rem 2.2rem', borderRadius: '12px', border: 'none',
              background: running ? 'rgba(255,107,107,0.15)' : `linear-gradient(135deg,${currentMode.color},${currentMode.color}cc)`,
              color: running ? '#ff6b6b' : '#fff',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
              boxShadow: running ? 'none' : `0 4px 18px ${currentMode.color}40`,
              transition: 'all 0.2s',
            }}>
            {running ? '⏸ Pause' : done ? '→ Next' : '▶ Start'}
          </button>
          {!done && (running || remaining < totalSec) && (
            <button onClick={() => switchMode(modeKey)}
              style={{ padding: '0.7rem 1rem', borderRadius: '12px', border: `1px solid ${border}`, background: 'transparent', color: textMuted, fontSize: '0.85rem', cursor: 'pointer' }}>
              ↺
            </button>
          )}
        </div>
      </div>

      {/* Tip */}
      {!running && !done && (
        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: textMuted, padding: '0 1rem' }}>
          {modeKey === 'focus'
            ? '💡 Close distractions. Focus on a single task until the timer rings.'
            : modeKey === 'shortBreak'
            ? '☕ Step away from the screen. Stretch, breathe, hydrate.'
            : '🌿 Take a longer rest. Walk, meditate, or close your eyes.'}
        </div>
      )}
    </div>
  );
};

export default FocusTimer;
