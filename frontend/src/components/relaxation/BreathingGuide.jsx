/**
 * components/relaxation/BreathingGuide.jsx
 * Animated breathing exercise guide — Part 12.
 *
 * Patterns supported:
 *   4-7-8     (anxiety relief)
 *   Box       (stress relief — 4-4-4-4)
 *   2-1-4-1   (calming)
 *   Coherent  (HRV — 5-5)
 *
 * No audio files needed — pure CSS animation + Web Audio API for optional tones.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';

const PATTERNS = [
  { id: '478',      label: '4-7-8',         desc: 'Anxiety relief',   inhale: 4, hold: 7, exhale: 8, hold2: 0, color: '#6c63ff' },
  { id: 'box',      label: 'Box Breathing', desc: 'Stress relief',    inhale: 4, hold: 4, exhale: 4, hold2: 4, color: '#4ecdc4' },
  { id: '241',      label: '2-1-4-1',       desc: 'Gentle calm',      inhale: 2, hold: 1, exhale: 4, hold2: 1, color: '#a8e6cf' },
  { id: 'coherent', label: 'Coherent',      desc: 'Heart rate harmony',inhale: 5, hold: 0, exhale: 5, hold2: 0, color: '#f7c59f' },
];

const PHASES = ['inhale', 'hold', 'exhale', 'hold2'];
const PHASE_LABELS = { inhale: 'INHALE', hold: 'HOLD', exhale: 'EXHALE', hold2: 'HOLD' };
const PHASE_INSTRUCTIONS = {
  inhale: 'Breathe in slowly through your nose',
  hold:   'Hold your breath gently',
  exhale: 'Breathe out slowly through your mouth',
  hold2:  'Hold empty — rest',
};

// ── Web Audio tone generator ──────────────────────────────────
const playTone = (freq = 440, duration = 0.15, vol = 0.08) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
    setTimeout(() => ctx.close(), 500);
  } catch { /* silently ignore if audio context unavailable */ }
};

const BreathingGuide = ({ onComplete }) => {
  const { isDark } = useTheme();

  const [selectedPattern, setSelectedPattern] = useState(PATTERNS[0]);
  const [running, setRunning]     = useState(false);
  const [phase, setPhase]         = useState('inhale');
  const [timeLeft, setTimeLeft]   = useState(PATTERNS[0].inhale);
  const [cycles, setCycles]       = useState(0);
  const [targetCycles, setTargetCycles] = useState(5);
  const [scale, setScale]         = useState(1);

  const intervalRef = useRef(null);
  const phaseRef    = useRef('inhale');
  const timeRef     = useRef(PATTERNS[0].inhale);
  const cycleRef    = useRef(0);
  const patternRef  = useRef(PATTERNS[0]);

  const textMain  = isDark ? '#e8e6ff' : '#1a1a2e';
  const textMuted = isDark ? 'rgba(232,230,255,0.45)' : 'rgba(26,26,46,0.45)';

  const getPhaseColor = (p) => {
    if (p === 'inhale') return patternRef.current.color;
    if (p === 'exhale') return '#ff9f7f';
    return '#a8e6cf';
  };

  const getNextPhase = useCallback((current, pattern) => {
    const idx = PHASES.indexOf(current);
    // Skip hold phases that have 0 duration
    let next = PHASES[(idx + 1) % 4];
    while (pattern[next] === 0) {
      const nextIdx = PHASES.indexOf(next);
      next = PHASES[(nextIdx + 1) % 4];
    }
    return next;
  }, []);

  const advancePhase = useCallback(() => {
    const currentPhase = phaseRef.current;
    const pattern = patternRef.current;
    const nextPhase = getNextPhase(currentPhase, pattern);

    // Count a full cycle when we complete exhale → back to inhale
    if (nextPhase === 'inhale') {
      cycleRef.current += 1;
      setCycles(cycleRef.current);
      playTone(330, 0.2, 0.06); // soft bell on cycle complete
      if (cycleRef.current >= targetCycles) {
        stop();
        onComplete?.({ pattern: pattern.label, cycles: cycleRef.current });
        return;
      }
    }

    phaseRef.current = nextPhase;
    timeRef.current = pattern[nextPhase];
    setPhase(nextPhase);
    setTimeLeft(pattern[nextPhase]);
    setScale(nextPhase === 'inhale' ? 1.45 : nextPhase === 'exhale' ? 1 : 1.45);
    playTone(nextPhase === 'inhale' ? 528 : nextPhase === 'exhale' ? 396 : 440, 0.12, 0.05);
  }, [getNextPhase, targetCycles, onComplete]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setPhase('inhale');
    setTimeLeft(patternRef.current.inhale);
    setScale(1);
    timeRef.current = patternRef.current.inhale;
    phaseRef.current = 'inhale';
    cycleRef.current = 0;
    setCycles(0);
  }, []);

  const start = useCallback(() => {
    patternRef.current = selectedPattern;
    phaseRef.current = 'inhale';
    timeRef.current = selectedPattern.inhale;
    cycleRef.current = 0;
    setCycles(0);
    setPhase('inhale');
    setTimeLeft(selectedPattern.inhale);
    setScale(1.45);
    setRunning(true);
    playTone(528, 0.15, 0.06);
  }, [selectedPattern]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      timeRef.current -= 1;
      setTimeLeft(timeRef.current);
      if (timeRef.current <= 0) advancePhase();
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, advancePhase]);

  const selectPattern = (p) => {
    if (running) stop();
    setSelectedPattern(p);
    patternRef.current = p;
    setTimeLeft(p.inhale);
  };

  const progress = cycles / targetCycles;
  const phaseColor = getPhaseColor(phase);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Pattern selector */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {PATTERNS.map(p => (
          <button key={p.id} onClick={() => selectPattern(p)} style={{
            padding: '0.45rem 0.9rem', borderRadius: '20px', border: 'none',
            background: selectedPattern.id === p.id ? p.color : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.07)'),
            color: selectedPattern.id === p.id ? '#fff' : textMuted,
            fontSize: '0.8rem', fontWeight: selectedPattern.id === p.id ? 700 : 500,
            cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {p.label} <span style={{ opacity: 0.7, fontSize: '0.72rem' }}>({p.desc})</span>
          </button>
        ))}
      </div>

      {/* Animated circle */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '1.5rem 0' }}>
        <div style={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Outer glow ring */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: `2px solid ${phaseColor}22`,
            transform: `scale(${running ? scale * 1.08 : 1})`,
            transition: `transform ${phase === 'inhale' ? selectedPattern.inhale : phase === 'exhale' ? selectedPattern.exhale : selectedPattern[phase]}s ease-in-out`,
            boxShadow: running ? `0 0 40px ${phaseColor}30` : 'none',
          }} />
          {/* Main circle */}
          <div style={{
            width: 160, height: 160, borderRadius: '50%',
            background: running
              ? `radial-gradient(circle, ${phaseColor}30 0%, ${phaseColor}10 70%)`
              : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(108,99,255,0.06)'),
            border: `3px solid ${running ? phaseColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.15)')}`,
            transform: `scale(${running ? scale : 1})`,
            transition: `transform ${phase === 'inhale' ? selectedPattern.inhale : phase === 'exhale' ? selectedPattern.exhale : selectedPattern[phase]}s ease-in-out, background 0.5s, border-color 0.5s`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: running ? `0 0 60px ${phaseColor}25` : 'none',
          }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.1rem', color: running ? phaseColor : textMuted, letterSpacing: '0.06em', transition: 'color 0.5s' }}>
              {running ? PHASE_LABELS[phase] : 'READY'}
            </div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '2.2rem', color: running ? phaseColor : textMain, lineHeight: 1, marginTop: '0.1rem' }}>
              {running ? timeLeft : ''}
            </div>
          </div>
        </div>

        {/* Phase instruction */}
        <div style={{ textAlign: 'center', minHeight: 36 }}>
          <div style={{ fontSize: '0.875rem', color: running ? phaseColor : textMuted, fontStyle: 'italic', transition: 'color 0.5s' }}>
            {running ? PHASE_INSTRUCTIONS[phase] : 'Choose a pattern and press Start'}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.8rem', color: textMuted, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            Cycles:
            <select value={targetCycles} onChange={e => setTargetCycles(+e.target.value)} disabled={running}
              style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.07)', border: 'none', borderRadius: '6px', padding: '0.2rem 0.4rem', color: textMain, fontSize: '0.8rem' }}>
              {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button id="breathing-start-btn" onClick={running ? stop : start} style={{
            padding: '0.7rem 2rem', borderRadius: '12px', border: 'none',
            background: running ? 'rgba(255,107,107,0.15)' : `linear-gradient(135deg, ${selectedPattern.color}, ${selectedPattern.color}cc)`,
            color: running ? '#ff6b6b' : '#fff',
            fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            boxShadow: running ? 'none' : `0 4px 18px ${selectedPattern.color}40`,
            transition: 'all 0.2s',
          }}>
            {running ? '⏹ Stop' : '▶ Start'}
          </button>
        </div>

        {/* Progress bar */}
        {(running || cycles > 0) && (
          <div style={{ width: '100%', maxWidth: 300 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: textMuted, marginBottom: '0.3rem' }}>
              <span>Cycle {cycles} of {targetCycles}</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.1)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress * 100}%`, background: `linear-gradient(90deg, ${selectedPattern.color}88, ${selectedPattern.color})`, borderRadius: 999, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BreathingGuide;
