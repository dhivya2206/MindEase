/**
 * components/relaxation/MeditationTimer.jsx
 * Countdown meditation timer — Part 12.
 *
 * Features:
 *   - Preset durations: 3 / 5 / 10 / 15 / 20 / 30 min
 *   - Custom duration input
 *   - Animated radial progress ring (SVG)
 *   - Gentle Web Audio API bell at start, midpoint, and end
 *   - Optional interval bells every N minutes
 *   - onComplete({ durationSec }) callback
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';

const PRESETS = [3, 5, 10, 15, 20, 30]; // minutes
const COLOR   = '#4ecdc4';

// ── Bell tone (Web Audio API) ─────────────────────────────────
const bell = (freq = 432, decay = 2.5, vol = 0.12) => {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + decay);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + decay);
    setTimeout(() => ctx.close(), (decay + 0.5) * 1000);
  } catch { /* ignore */ }
};

// ── SVG ring ─────────────────────────────────────────────────
const ProgressRing = ({ progress, size = 220, strokeW = 8, color }) => {
  const r   = (size - strokeW) / 2;
  const c   = 2 * Math.PI * r;
  const off = c * (1 - progress);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeOpacity={0.1} strokeWidth={strokeW} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={strokeW}
        strokeDasharray={c} strokeDashoffset={off}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s linear' }} />
    </svg>
  );
};

// ── Format mm:ss ─────────────────────────────────────────────
const fmt = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

// ─────────────────────────────────────────────────────────────
const MeditationTimer = ({ onComplete }) => {
  const { isDark } = useTheme();
  const textMain  = isDark ? '#e8e6ff' : '#1a1a2e';
  const textMuted = isDark ? 'rgba(232,230,255,0.45)' : 'rgba(26,26,46,0.45)';
  const border    = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.1)';

  const [preset,      setPreset]      = useState(5);     // minutes
  const [custom,      setCustom]      = useState('');
  const [totalSec,    setTotalSec]    = useState(5 * 60);
  const [remaining,   setRemaining]   = useState(5 * 60);
  const [running,     setRunning]     = useState(false);
  const [done,        setDone]        = useState(false);
  const [intervalBell,setIntervalBell]= useState(5);     // every N minutes, 0 = off

  const intervalRef   = useRef(null);
  const remainingRef  = useRef(5 * 60);
  const totalRef      = useRef(5 * 60);
  const midBellFired  = useRef(false);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
  }, []);

  const reset = useCallback((min) => {
    stop();
    const sec = min * 60;
    totalRef.current    = sec;
    remainingRef.current = sec;
    setTotalSec(sec);
    setRemaining(sec);
    setDone(false);
    midBellFired.current = false;
  }, [stop]);

  const start = useCallback(() => {
    if (done) {
      reset(preset);
      return;
    }
    setRunning(true);
    midBellFired.current = false;
    bell(432, 2.5, 0.12); // start bell
  }, [done, reset, preset]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      remainingRef.current -= 1;
      setRemaining(remainingRef.current);

      // Mid-point bell
      const half = Math.floor(totalRef.current / 2);
      if (remainingRef.current === half && !midBellFired.current) {
        midBellFired.current = true;
        bell(396, 2, 0.08);
      }

      // Interval bells
      if (intervalBell > 0 && remainingRef.current > 0) {
        if (remainingRef.current % (intervalBell * 60) === 0) {
          bell(528, 1.8, 0.09);
        }
      }

      // Done
      if (remainingRef.current <= 0) {
        clearInterval(intervalRef.current);
        setRunning(false);
        setDone(true);
        bell(528, 3, 0.14);
        setTimeout(() => bell(432, 3, 0.12), 1200);
        onComplete?.({ durationSec: totalRef.current });
      }
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, intervalBell, onComplete]);

  const progress   = totalSec > 0 ? (totalSec - remaining) / totalSec : 0;
  const activeMins = custom ? Number(custom) : preset;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Preset pills */}
      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
        {PRESETS.map(m => (
          <button key={m} onClick={() => { setPreset(m); setCustom(''); reset(m); }}
            disabled={running}
            style={{
              padding: '0.35rem 0.85rem', borderRadius: '20px', border: 'none',
              background: preset === m && !custom ? COLOR : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(78,205,196,0.1)'),
              color: preset === m && !custom ? '#fff' : textMuted,
              fontWeight: preset === m && !custom ? 700 : 500,
              fontSize: '0.82rem', cursor: running ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', opacity: running ? 0.6 : 1,
            }}>{m} min</button>
        ))}
        {/* Custom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <input
            type="number" min={1} max={120} value={custom}
            placeholder="Custom"
            onChange={e => { setCustom(e.target.value); if (e.target.value) { reset(Number(e.target.value)); } }}
            disabled={running}
            style={{
              width: 72, padding: '0.35rem 0.6rem', borderRadius: '20px',
              border: `1.5px solid ${custom ? COLOR : border}`,
              background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
              color: textMain, fontSize: '0.82rem', outline: 'none',
            }}
          />
          <span style={{ fontSize: '0.75rem', color: textMuted }}>min</span>
        </div>
      </div>

      {/* Timer ring */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ProgressRing progress={progress} size={220} strokeW={8} color={done ? '#a8e6cf' : COLOR} />
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            {done ? (
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>🔔</div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1rem', color: '#a8e6cf' }}>Session Complete</div>
              </div>
            ) : (
              <>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '2.2rem', color: running ? COLOR : textMain, transition: 'color 0.3s', letterSpacing: '0.02em' }}>
                  {fmt(remaining)}
                </div>
                <div style={{ fontSize: '0.75rem', color: textMuted, marginTop: '0.1rem' }}>
                  {running ? 'Meditating…' : 'Ready'}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Interval bell selector */}
        <label style={{ fontSize: '0.8rem', color: textMuted, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Interval bell:
          <select value={intervalBell} onChange={e => setIntervalBell(+e.target.value)} disabled={running}
            style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(78,205,196,0.07)', border: 'none', borderRadius: '6px', padding: '0.2rem 0.5rem', color: textMain, fontSize: '0.8rem' }}>
            <option value={0}>Off</option>
            {[1, 2, 5, 10].map(n => <option key={n} value={n}>Every {n} min</option>)}
          </select>
        </label>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button id="meditation-start-btn" onClick={running ? stop : start}
            style={{
              padding: '0.75rem 2.5rem', borderRadius: '12px', border: 'none',
              background: running ? 'rgba(255,107,107,0.15)' : `linear-gradient(135deg,${COLOR},${COLOR}cc)`,
              color: running ? '#ff6b6b' : '#fff',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
              boxShadow: running ? 'none' : `0 4px 18px ${COLOR}40`,
              transition: 'all 0.2s',
            }}>
            {running ? '⏸ Pause' : done ? '↺ Again' : '▶ Start'}
          </button>
          {(running || remaining < totalSec) && !done && (
            <button onClick={() => reset(activeMins)}
              style={{ padding: '0.75rem 1.2rem', borderRadius: '12px', border: `1px solid ${border}`, background: 'transparent', color: textMuted, fontSize: '0.85rem', cursor: 'pointer' }}>
              ↺ Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeditationTimer;
