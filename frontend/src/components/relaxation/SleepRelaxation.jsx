/**
 * components/relaxation/SleepRelaxation.jsx
 * Sleep wind-down guide — Part 12.
 *
 * Three programmes:
 *   1. 4-7-8 Sleep Breathing  — specifically tuned for sleep onset
 *   2. Sleep Body Scan        — very slow, gentle, sleep-focused
 *   3. Sleep Visualisation    — dark, warm, heavy imagery
 *
 * Dimmed UI after start to simulate low-light environment.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';

const SLEEP_COLOR = '#7c6f9f';

const PROGRAMMES = [
  {
    id:    'sleep-breathing',
    label: '4-7-8 Sleep Breathing',
    emoji: '😴',
    desc:  'A specific breathing technique that calms the nervous system for sleep onset.',
    cycles: 8,
    phases: [
      { phase: 'INHALE', dur: 4,  text: 'Breathe in quietly through your nose' },
      { phase: 'HOLD',   dur: 7,  text: 'Hold your breath' },
      { phase: 'EXHALE', dur: 8,  text: 'Exhale completely through your mouth, making a soft sound' },
    ],
  },
  {
    id:    'sleep-scan',
    label: 'Sleep Body Scan',
    emoji: '🌙',
    desc:  'A slow, gentle body scan designed to guide you from wakefulness into sleep.',
    steps: [
      { text: 'Lie down in a comfortable position. Let your eyes close naturally. There is nowhere else to be.', dur: 30 },
      { text: 'Feel the weight of your body sink heavily into the bed. Let it be held completely.', dur: 30 },
      { text: 'Your feet and toes are becoming warm and heavy… heavier with each breath.', dur: 35 },
      { text: 'Your legs feel like warm, heavy sand. They are too heavy to move now.', dur: 35 },
      { text: 'Your hips and lower back melt into the mattress. You are completely supported.', dur: 35 },
      { text: 'Your belly rises and falls with slow, effortless breath. Each exhale is deeper.', dur: 35 },
      { text: 'Your chest softens. Your heart beats slowly and steadily, like a quiet drum.', dur: 30 },
      { text: 'Your hands are heavy and warm. Your arms rest limply at your sides.', dur: 30 },
      { text: 'Your shoulders drop completely. The muscles in your face go soft. Your jaw unclenches.', dur: 30 },
      { text: 'Your entire body is heavy, warm, and completely at rest. Your thoughts are like clouds — drifting by, fading away.', dur: 45 },
      { text: 'You are safe. You are warm. There is nothing to do. Allow yourself to drift…', dur: 60 },
    ],
  },
  {
    id:    'sleep-visual',
    label: 'Sleep Visualisation',
    emoji: '⭐',
    desc:  'A warm, dark imagery journey to carry you gently toward sleep.',
    steps: [
      { text: 'Close your eyes. Imagine a dark, starlit sky above you. Peaceful. Endless.', dur: 30 },
      { text: 'You are in a warm, cozy place — wrapped in soft blankets, perfectly comfortable.', dur: 30 },
      { text: 'The room is dark and quiet. A faint, soft light glows amber near you — like firelight.', dur: 30 },
      { text: 'Your body is perfectly still. Heavy. Sinking deeper into warmth with each breath.', dur: 35 },
      { text: 'The stars above begin to move, slowly, like a gentle river of light…', dur: 40 },
      { text: 'You hear a distant, soft sound — perhaps rain on leaves, or a quiet breeze. Nothing to disturb you.', dur: 40 },
      { text: 'Your thoughts grow quieter and quieter, like voices fading at the end of the day.', dur: 40 },
      { text: 'Let yourself drift. There is only this warmth, this darkness, this stillness…', dur: 60 },
    ],
  },
];

const softTone = (freq = 220, dur = 3, vol = 0.04) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
    setTimeout(() => ctx.close(), (dur + 1) * 1000);
  } catch {}
};

// ── Breathing sub-component ───────────────────────────────────
const SleepBreathing = ({ prog, onComplete }) => {
  const { isDark } = useTheme();
  const textMuted = isDark ? 'rgba(232,230,255,0.4)' : 'rgba(26,26,46,0.4)';

  const [running,  setRunning]  = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(prog.phases[0].dur);
  const [cycle,    setCycle]    = useState(0);
  const [scale,    setScale]    = useState(1);

  const intervalRef = useRef(null);
  const phaseRef    = useRef(0);
  const timeRef     = useRef(prog.phases[0].dur);
  const cycleRef    = useRef(0);

  const advance = useCallback(() => {
    const nextPhase = (phaseRef.current + 1) % prog.phases.length;
    if (nextPhase === 0) {
      cycleRef.current += 1;
      setCycle(cycleRef.current);
      if (cycleRef.current >= prog.cycles) {
        clearInterval(intervalRef.current);
        setRunning(false);
        softTone(220, 3, 0.05);
        const totalSec = prog.phases.reduce((a, p) => a + p.dur, 0) * prog.cycles;
        onComplete?.({ durationSec: totalSec });
        return;
      }
    }
    phaseRef.current = nextPhase;
    timeRef.current  = prog.phases[nextPhase].dur;
    setPhaseIdx(nextPhase);
    setTimeLeft(prog.phases[nextPhase].dur);
    setScale(prog.phases[nextPhase].phase === 'INHALE' ? 1.5 : prog.phases[nextPhase].phase === 'HOLD' ? 1.5 : 1);
    softTone(prog.phases[nextPhase].phase === 'INHALE' ? 264 : prog.phases[nextPhase].phase === 'EXHALE' ? 220 : 242, 0.5, 0.04);
  }, [prog, onComplete]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      timeRef.current -= 1;
      setTimeLeft(timeRef.current);
      if (timeRef.current <= 0) advance();
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, advance]);

  const currentPhase = prog.phases[phaseIdx];

  const start = () => {
    phaseRef.current  = 0; timeRef.current = prog.phases[0].dur; cycleRef.current = 0;
    setPhaseIdx(0); setTimeLeft(prog.phases[0].dur); setCycle(0); setScale(1.5);
    setRunning(true);
    softTone(264, 1, 0.05);
  };
  const stop = () => { clearInterval(intervalRef.current); setRunning(false); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
      {/* Breathing orb */}
      <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: running
            ? `radial-gradient(circle, ${SLEEP_COLOR}40 0%, ${SLEEP_COLOR}15 70%)`
            : 'rgba(124,111,159,0.1)',
          border: `2px solid ${running ? SLEEP_COLOR : 'rgba(124,111,159,0.2)'}`,
          transform: `scale(${running ? scale : 1})`,
          transition: `transform ${currentPhase.dur}s ease-in-out, background 0.5s, border-color 0.5s`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: running ? `0 0 50px ${SLEEP_COLOR}20` : 'none',
        }}>
          {running && (
            <>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.85rem', color: SLEEP_COLOR, letterSpacing: '0.06em' }}>
                {currentPhase.phase}
              </div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.8rem', color: SLEEP_COLOR }}>
                {timeLeft}
              </div>
            </>
          )}
          {!running && <span style={{ fontSize: '2rem' }}>😴</span>}
        </div>
      </div>

      {running && (
        <p style={{ fontSize: '0.85rem', color: textMuted, textAlign: 'center', fontStyle: 'italic', animation: 'fadeInUp 0.3s ease' }}>
          {currentPhase.text}
        </p>
      )}

      {running && (
        <div style={{ fontSize: '0.75rem', color: textMuted }}>
          Cycle {cycle + 1} of {prog.cycles}
        </div>
      )}

      <button onClick={running ? stop : start}
        style={{
          padding: '0.7rem 2rem', borderRadius: '12px', border: 'none',
          background: running ? 'rgba(124,111,159,0.15)' : `linear-gradient(135deg,${SLEEP_COLOR},${SLEEP_COLOR}cc)`,
          color: running ? SLEEP_COLOR : '#fff',
          fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
          boxShadow: running ? 'none' : `0 4px 18px ${SLEEP_COLOR}40`,
        }}>
        {running ? '⏸ Stop' : '▶ Begin'}
      </button>
    </div>
  );
};

// ── Text-step sub-component ───────────────────────────────────
const SleepSteps = ({ prog, onComplete }) => {
  const { isDark } = useTheme();
  const textMain  = isDark ? '#e8e6ff' : '#1a1a2e';
  const textMuted = isDark ? 'rgba(232,230,255,0.4)' : 'rgba(26,26,46,0.4)';

  const [stepIdx,  setStepIdx]  = useState(-1);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const timeRef  = useRef(0);

  const steps = prog.steps;

  const goTo = useCallback((idx) => {
    clearInterval(timerRef.current);
    if (idx >= steps.length) {
      setStepIdx(steps.length);
      const total = steps.reduce((a, s) => a + s.dur, 0);
      onComplete?.({ durationSec: total });
      softTone(220, 4, 0.04);
      return;
    }
    const dur = steps[idx].dur;
    timeRef.current = dur;
    setStepIdx(idx);
    setTimeLeft(dur);
    softTone(220, 1, 0.04);
    timerRef.current = setInterval(() => {
      timeRef.current -= 1;
      setTimeLeft(timeRef.current);
      if (timeRef.current <= 0) goTo(idx + 1);
    }, 1000);
  }, [steps, onComplete]);

  const handleReset = () => { clearInterval(timerRef.current); setStepIdx(-1); };

  const started = stepIdx >= 0 && stepIdx < steps.length;
  const done    = stepIdx >= steps.length;
  const current = started ? steps[stepIdx] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
      {!started && !done && (
        <button onClick={() => goTo(0)}
          style={{ padding: '0.75rem 2.5rem', borderRadius: '12px', border: 'none', background: `linear-gradient(135deg,${SLEEP_COLOR},${SLEEP_COLOR}cc)`, color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: `0 4px 18px ${SLEEP_COLOR}40` }}>
          ▶ Begin
        </button>
      )}
      {started && (
        <div style={{ width: '100%', animation: 'fadeInUp 0.4s ease' }}>
          <div style={{ fontSize: '0.72rem', color: textMuted, marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Step {stepIdx + 1} of {steps.length}</span>
            <span>{timeLeft}s</span>
          </div>
          <div style={{ height: 4, borderRadius: 999, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(124,111,159,0.12)', marginBottom: '1rem', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((stepIdx) / steps.length) * 100}%`, background: SLEEP_COLOR, borderRadius: 999, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ padding: '1.5rem', borderRadius: '16px', background: isDark ? 'rgba(15,14,26,0.95)' : 'rgba(124,111,159,0.08)', border: `1px solid ${SLEEP_COLOR}25`, minHeight: 100, display: 'flex', alignItems: 'center' }}>
            <p style={{ fontSize: '0.95rem', color: textMain, lineHeight: 1.85, margin: 0, fontStyle: 'italic', textAlign: 'center', width: '100%', letterSpacing: '0.01em' }}>
              "{current.text}"
            </p>
          </div>
        </div>
      )}
      {done && (
        <div style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.4rem' }}>🌙</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, color: SLEEP_COLOR }}>Sweet dreams…</div>
        </div>
      )}
      {(started || done) && (
        <button onClick={handleReset} style={{ padding: '0.5rem 1.2rem', borderRadius: '10px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(124,111,159,0.2)'}`, background: 'transparent', color: textMuted, fontSize: '0.78rem', cursor: 'pointer' }}>
          ↺ Reset
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
const SleepRelaxation = ({ onComplete }) => {
  const { isDark } = useTheme();
  const textMuted = isDark ? 'rgba(232,230,255,0.45)' : 'rgba(26,26,46,0.45)';
  const [prog, setProg] = useState(PROGRAMMES[0]);

  const handleComplete = useCallback((data) => {
    onComplete?.({ ...data, label: prog.label });
  }, [prog, onComplete]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Programme pills */}
      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
        {PROGRAMMES.map(p => (
          <button key={p.id} onClick={() => setProg(p)}
            style={{
              padding: '0.35rem 0.85rem', borderRadius: '20px', border: 'none',
              background: prog.id === p.id ? SLEEP_COLOR : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(124,111,159,0.1)'),
              color: prog.id === p.id ? '#fff' : textMuted,
              fontWeight: prog.id === p.id ? 700 : 500,
              fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
            }}>
            {p.emoji} {p.label}
          </button>
        ))}
      </div>

      {/* Description */}
      <div style={{ padding: '0.8rem 1rem', borderRadius: '12px', background: `${SLEEP_COLOR}10`, border: `1px solid ${SLEEP_COLOR}25` }}>
        <p style={{ fontSize: '0.83rem', color: textMuted, margin: 0, lineHeight: 1.6 }}>{prog.desc}</p>
      </div>

      {/* Sub-component */}
      {prog.phases
        ? <SleepBreathing prog={prog} onComplete={handleComplete} />
        : <SleepSteps prog={prog} onComplete={handleComplete} />
      }
    </div>
  );
};

export default SleepRelaxation;
