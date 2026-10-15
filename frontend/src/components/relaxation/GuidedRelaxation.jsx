/**
 * components/relaxation/GuidedRelaxation.jsx
 * Step-through guided relaxation scripts — Part 12.
 *
 * Three programmes:
 *   1. Body Scan        — progressive awareness of each body part
 *   2. Visualisation    — peaceful nature scene imagery
 *   3. PMR              — Progressive Muscle Relaxation
 *
 * Each step has a text prompt + recommended duration.
 * User can auto-advance (timer) or manually tap "Next".
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';

const PROGRAMMES = [
  {
    id:    'body-scan',
    label: 'Body Scan',
    emoji: '🧘',
    color: '#6c63ff',
    desc:  'Systematically bring awareness to each part of your body from toes to head.',
    steps: [
      { text: 'Find a comfortable position — sit or lie down. Close your eyes gently. Take three slow, deep breaths.', dur: 20 },
      { text: 'Bring your attention to your feet. Notice any sensations — warmth, tingling, or simply the weight of them. Breathe into this area.', dur: 25 },
      { text: 'Move your awareness slowly up to your calves and shins. Let any tension soften as you exhale.', dur: 20 },
      { text: 'Notice your knees and thighs. Feel the support beneath you. Relax the muscles here on each out-breath.', dur: 20 },
      { text: 'Bring awareness to your hips and lower back. Breathe slowly, letting this area expand and soften.', dur: 20 },
      { text: 'Focus on your belly. Feel it rise and fall with each breath. Let it be completely soft.', dur: 20 },
      { text: 'Move to your chest and heart area. Notice your heartbeat. Send it gratitude for every beat.', dur: 20 },
      { text: 'Relax your shoulders — let them drop away from your ears. Feel the weight leave your neck.', dur: 20 },
      { text: 'Soften your hands and arms. Let your fingers uncurl naturally.', dur: 15 },
      { text: 'Bring awareness to your jaw, tongue, and the muscles around your eyes. Let them go completely soft.', dur: 20 },
      { text: 'Now feel your whole body as one unified field of awareness. Rest here for a few breaths.', dur: 30 },
      { text: 'When you are ready, gently wiggle your fingers and toes. Take a deeper breath and slowly open your eyes.', dur: 20 },
    ],
  },
  {
    id:    'visualisation',
    label: 'Visualisation',
    emoji: '🌊',
    color: '#4ecdc4',
    desc:  'A calming mental journey to a peaceful natural setting.',
    steps: [
      { text: 'Close your eyes and take three deep breaths. With each exhale, let your body grow heavier and more relaxed.', dur: 20 },
      { text: 'Imagine you are walking along a quiet beach at sunset. Feel the warm sand between your toes.', dur: 25 },
      { text: 'Hear the gentle rhythm of the waves — each one washing in and retreating, steady and calm.', dur: 25 },
      { text: 'Feel a warm, soft breeze on your skin. It carries a faint scent of sea salt and flowers.', dur: 20 },
      { text: 'Look out at the horizon. The sky glows in warm amber and rose. There is nothing to do, nowhere to be.', dur: 25 },
      { text: 'Find a comfortable spot to sit. The sand is warm and soft. The sound of the waves continues, unhurried.', dur: 25 },
      { text: 'With each wave, imagine it carrying away any tension or worry. Watch it dissolve into the ocean.', dur: 30 },
      { text: 'A sense of peace fills your chest. You are safe, calm, and completely at ease.', dur: 25 },
      { text: 'Spend a few moments just being here, in this peaceful place. There is nothing you need to solve right now.', dur: 35 },
      { text: 'Slowly bring your awareness back. Feel the surface beneath you. Wiggle your fingers. Take a deep breath and open your eyes.', dur: 20 },
    ],
  },
  {
    id:    'pmr',
    label: 'PMR',
    emoji: '💪',
    color: '#a8e6cf',
    desc:  'Progressive Muscle Relaxation — tense and release muscle groups to release deep tension.',
    steps: [
      { text: 'Sit or lie comfortably. Take three slow breaths. We will tense each muscle group for 5–7 seconds, then release.', dur: 20 },
      { text: 'Hands: Make tight fists. Squeeze for 5 seconds… and release. Feel the difference between tension and relaxation.', dur: 18 },
      { text: 'Forearms: Flex your wrists upward. Hold… and release. Let the muscles go completely.', dur: 18 },
      { text: 'Upper arms: Tighten your biceps. Hold… and release. Feel the warmth spread.', dur: 18 },
      { text: 'Shoulders: Shrug them toward your ears. Hold… and release. Feel them drop and soften.', dur: 18 },
      { text: 'Face: Scrunch your face — eyes, nose, forehead — tightly. Hold… and release. Let every tiny muscle go.', dur: 18 },
      { text: 'Chest: Take a deep breath in and hold it, tensing your chest. Then exhale slowly and let go.', dur: 20 },
      { text: 'Stomach: Tighten your abdominal muscles. Hold… and release. Breathe normally.', dur: 18 },
      { text: 'Legs: Squeeze your thighs and clench your buttocks. Hold… and release.', dur: 18 },
      { text: 'Feet: Curl your toes tightly downward. Hold… and release. Feel your feet become heavy and warm.', dur: 18 },
      { text: 'Now scan your whole body. Notice how much more relaxed you feel. Breathe slowly and enjoy this stillness.', dur: 30 },
    ],
  },
];

const chime = (freq = 440, vol = 0.07) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
    osc.start(); osc.stop(ctx.currentTime + 1.5);
    setTimeout(() => ctx.close(), 2000);
  } catch {}
};

// ─────────────────────────────────────────────────────────────
const GuidedRelaxation = ({ onComplete }) => {
  const { isDark } = useTheme();
  const textMain  = isDark ? '#e8e6ff' : '#1a1a2e';
  const textMuted = isDark ? 'rgba(232,230,255,0.45)' : 'rgba(26,26,46,0.45)';
  const border    = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.1)';

  const [prog,     setProg]     = useState(PROGRAMMES[0]);
  const [stepIdx,  setStepIdx]  = useState(-1);          // -1 = not started
  const [timeLeft, setTimeLeft] = useState(0);
  const [autoAdv,  setAutoAdv]  = useState(true);
  const [done,     setDone]     = useState(false);

  const timerRef   = useRef(null);
  const timeRef    = useRef(0);

  const totalSteps = prog.steps.length;
  const started    = stepIdx >= 0;
  const currentStep = stepIdx >= 0 && stepIdx < totalSteps ? prog.steps[stepIdx] : null;

  const stopTimer = () => clearInterval(timerRef.current);

  const goToStep = useCallback((idx) => {
    stopTimer();
    if (idx >= totalSteps) {
      setDone(true);
      setStepIdx(totalSteps);
      chime(528, 0.12);
      const totalSec = prog.steps.reduce((a, s) => a + s.dur, 0);
      onComplete?.({ durationSec: totalSec });
      return;
    }
    const dur = prog.steps[idx].dur;
    timeRef.current = dur;
    setStepIdx(idx);
    setTimeLeft(dur);
    chime(440, 0.07);
  }, [totalSteps, prog, onComplete]);

  useEffect(() => {
    if (!autoAdv || stepIdx < 0 || done) return;
    timerRef.current = setInterval(() => {
      timeRef.current -= 1;
      setTimeLeft(timeRef.current);
      if (timeRef.current <= 0) goToStep(stepIdx + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [autoAdv, stepIdx, goToStep, done]);

  const handleStart = () => { setDone(false); goToStep(0); };
  const handleNext  = () => goToStep(stepIdx + 1);
  const handlePrev  = () => { if (stepIdx > 0) goToStep(stepIdx - 1); };
  const handleReset = () => { stopTimer(); setStepIdx(-1); setDone(false); };
  const handleSelectProg = (p) => { stopTimer(); setProg(p); setStepIdx(-1); setDone(false); };

  const progressPct = started && !done ? ((stepIdx + 1) / totalSteps) * 100 : done ? 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Programme selector */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {PROGRAMMES.map(p => (
          <button key={p.id} onClick={() => handleSelectProg(p)}
            style={{
              padding: '0.4rem 0.9rem', borderRadius: '20px', border: 'none',
              background: prog.id === p.id ? p.color : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.07)'),
              color: prog.id === p.id ? '#fff' : textMuted,
              fontWeight: prog.id === p.id ? 700 : 500,
              fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s',
            }}>
            {p.emoji} {p.label}
          </button>
        ))}
      </div>

      {/* Programme description */}
      {!started && !done && (
        <div style={{ padding: '1rem 1.1rem', borderRadius: '14px', background: `${prog.color}10`, border: `1px solid ${prog.color}25` }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: textMain, marginBottom: '0.3rem' }}>{prog.emoji} {prog.label}</div>
          <p style={{ fontSize: '0.83rem', color: textMuted, margin: 0, lineHeight: 1.6 }}>{prog.desc}</p>
          <p style={{ fontSize: '0.75rem', color: textMuted, margin: '0.5rem 0 0', opacity: 0.7 }}>
            {totalSteps} steps · ~{Math.round(prog.steps.reduce((a, s) => a + s.dur, 0) / 60)} minutes
          </p>
        </div>
      )}

      {/* Step display */}
      {started && !done && currentStep && (
        <div style={{ animation: 'fadeInUp 0.4s ease' }}>
          {/* Progress bar */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: textMuted, marginBottom: '0.3rem' }}>
              <span>Step {stepIdx + 1} of {totalSteps}</span>
              {autoAdv && <span>{timeLeft}s</span>}
            </div>
            <div style={{ height: 5, borderRadius: 999, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.1)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: `linear-gradient(90deg,${prog.color}88,${prog.color})`, borderRadius: 999, transition: 'width 0.5s ease' }} />
            </div>
          </div>

          {/* Text card */}
          <div style={{
            padding: '1.5rem', borderRadius: '16px',
            background: isDark ? 'rgba(26,24,48,0.9)' : '#fff',
            border: `1.5px solid ${prog.color}25`,
            boxShadow: `0 6px 24px ${prog.color}12`,
            minHeight: 140, display: 'flex', alignItems: 'center',
          }}>
            <p style={{ fontSize: '1rem', color: textMain, lineHeight: 1.75, margin: 0, fontStyle: 'italic', textAlign: 'center', width: '100%' }}>
              "{currentStep.text}"
            </p>
          </div>

          {/* Time countdown (visual ring) */}
          {autoAdv && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '3px' }}>
                {Array.from({ length: currentStep.dur }, (_, i) => (
                  <div key={i} style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: i < (currentStep.dur - timeLeft) ? prog.color : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.12)'),
                    transition: 'background 0.3s',
                    flexShrink: 0,
                    display: currentStep.dur > 40 && i % 2 !== 0 ? 'none' : 'block',
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Done state */}
      {done && (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', animation: 'scaleIn 0.4s ease' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🌟</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.1rem', color: prog.color, marginBottom: '0.3rem' }}>
            Session Complete
          </div>
          <p style={{ fontSize: '0.85rem', color: textMuted, lineHeight: 1.6 }}>
            Well done. Take a moment to notice how you feel now compared to when you started.
          </p>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {!started && !done && (
          <button id="guided-start-btn" onClick={handleStart}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: 'none', background: `linear-gradient(135deg,${prog.color},${prog.color}cc)`, color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: `0 4px 18px ${prog.color}40` }}>
            ▶ Begin {prog.label}
          </button>
        )}
        {started && !done && (
          <>
            <button onClick={handlePrev} disabled={stepIdx === 0}
              style={{ padding: '0.7rem 1rem', borderRadius: '12px', border: `1px solid ${border}`, background: 'transparent', color: textMuted, fontSize: '0.85rem', cursor: stepIdx === 0 ? 'not-allowed' : 'pointer', opacity: stepIdx === 0 ? 0.4 : 1 }}>
              ← Prev
            </button>
            <button onClick={handleNext}
              style={{ flex: 1, padding: '0.7rem', borderRadius: '12px', border: 'none', background: `${prog.color}18`, color: prog.color, fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', border: `1px solid ${prog.color}30` }}>
              {stepIdx === totalSteps - 1 ? 'Finish ✓' : 'Next →'}
            </button>
            <label style={{ fontSize: '0.75rem', color: textMuted, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={autoAdv} onChange={e => setAutoAdv(e.target.checked)}
                style={{ accentColor: prog.color }} />
              Auto
            </label>
          </>
        )}
        {(started || done) && (
          <button onClick={handleReset}
            style={{ padding: '0.7rem 1rem', borderRadius: '12px', border: `1px solid ${border}`, background: 'transparent', color: textMuted, fontSize: '0.82rem', cursor: 'pointer' }}>
            ↺ Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default GuidedRelaxation;
