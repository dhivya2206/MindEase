/**
 * components/games/BreathingGame.jsx
 * Breathing rhythm game — Part 13.
 *
 * A target circle expands/contracts on a fixed rhythm.
 * Player must press-and-hold to match their breath to the animation.
 * Score is based on accuracy of timing.
 *
 * Rounds: 8 breath cycles
 * Score: 0-100 per cycle based on sync accuracy
 *
 * onGameEnd({ score, accuracy, rounds }) callback
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';

const PATTERNS = [
  { id: 'box',      label: 'Box',     inhale: 4, hold1: 4, exhale: 4, hold2: 4, color: '#4ecdc4' },
  { id: '4-7-8',    label: '4-7-8',   inhale: 4, hold1: 7, exhale: 8, hold2: 0, color: '#6c63ff' },
  { id: 'relaxed',  label: 'Relaxed', inhale: 4, hold1: 0, exhale: 6, hold2: 2, color: '#a8e6cf' },
];

const TOTAL_ROUNDS = 8;

// Returns current phase and position within cycle (0.0–1.0)
const getCycleState = (t, pat) => {
  const total = pat.inhale + pat.hold1 + pat.exhale + pat.hold2;
  const pos   = t % total;
  let phase, pct;
  if (pos < pat.inhale) {
    phase = 'inhale';  pct = pos / pat.inhale;
  } else if (pos < pat.inhale + pat.hold1) {
    phase = 'hold1';   pct = 1;
  } else if (pos < pat.inhale + pat.hold1 + pat.exhale) {
    phase = 'exhale';  pct = 1 - (pos - pat.inhale - pat.hold1) / pat.exhale;
  } else {
    phase = 'hold2';   pct = 0;
  }
  return { phase, pct, total };
};

// Desired scale: 1.0 (exhale) → 1.5 (inhale)
const scaleFromPct = (pct) => 1 + pct * 0.5;

// ─────────────────────────────────────────────────────────────
const BreathingGame = ({ onGameEnd }) => {
  const { isDark } = useTheme();
  const textMain  = isDark ? '#e8e6ff' : '#1a1a2e';
  const textMuted = isDark ? 'rgba(232,230,255,0.45)' : 'rgba(26,26,46,0.45)';

  const [pat,      setPat]      = useState(PATTERNS[0]);
  const [phase,    setPhase]    = useState('idle');   // idle | countdown | playing | done
  const [held,     setHeld]     = useState(false);    // is user pressing?
  const [round,    setRound]    = useState(0);
  const [scores,   setScores]   = useState([]);
  const [cycleState, setCycleState] = useState({ phase: 'inhale', pct: 0 });
  const [countdown, setCountdown] = useState(3);
  const [totalScore, setTotalScore] = useState(0);

  const animRef    = useRef(null);
  const startRef   = useRef(null);  // animation start time
  const heldRef    = useRef(false);
  const roundRef   = useRef(0);
  const scoresRef  = useRef([]);
  const cycleHeldPcts = useRef([]);  // pct accuracy samples this cycle
  const lastRoundRef  = useRef(-1);

  const patRef = useRef(pat);
  useEffect(() => { patRef.current = pat; }, [pat]);

  const endGame = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    const all = scoresRef.current;
    const avg = all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : (heldRef.current ? 85 : 70);
    setTotalScore(avg);
    setPhase('done');
    onGameEnd?.({ score: avg, accuracy: avg, rounds: Math.max(1, scoresRef.current.length) });
  }, [onGameEnd]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && phase === 'playing') {
        e.preventDefault();
        heldRef.current = true;
        setHeld(true);
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space' && phase === 'playing') {
        e.preventDefault();
        heldRef.current = false;
        setHeld(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [phase]);

  const animate = useCallback((ts) => {
    if (!startRef.current) startRef.current = ts;
    const elapsed = (ts - startRef.current) / 1000; // seconds
    const p = patRef.current;
    const state = getCycleState(elapsed, p);
    setCycleState(state);

    // Track which round we're in
    const cycleLen   = p.inhale + p.hold1 + p.exhale + p.hold2;
    const currentRound = Math.floor(elapsed / cycleLen);
    if (currentRound !== lastRoundRef.current) {
      // New cycle started — score the previous one
      if (lastRoundRef.current >= 0 && cycleHeldPcts.current.length > 0) {
        // Accuracy = how well user matched the expected hold behavior
        const samples     = cycleHeldPcts.current;
        const desiredHeld = samples.filter(([,pct]) => pct > 0.5).length;
        const actualHeld  = samples.filter(([held, pct]) => held && pct > 0.5).length;
        const accuracy    = desiredHeld > 0 ? Math.round((actualHeld / desiredHeld) * 100) : 80;
        const clampedAcc  = Math.min(100, Math.max(0, accuracy));
        scoresRef.current = [...scoresRef.current, clampedAcc];
        setScores([...scoresRef.current]);
      }
      cycleHeldPcts.current = [];
      lastRoundRef.current  = currentRound;
      roundRef.current = Math.min(currentRound, TOTAL_ROUNDS - 1);
      setRound(roundRef.current);

      if (currentRound >= TOTAL_ROUNDS) { endGame(); return; }
    }

    // Sample: user should be "holding" (inhale/hold1 = press-and-hold, exhale/hold2 = release)
    const shouldHold = state.phase === 'inhale' || state.phase === 'hold1';
    cycleHeldPcts.current.push([heldRef.current, state.pct, shouldHold]);

    animRef.current = requestAnimationFrame(animate);
  }, [endGame]);

  const startCountdown = () => {
    scoresRef.current      = [];
    lastRoundRef.current   = -1;
    roundRef.current       = 0;
    cycleHeldPcts.current  = [];
    startRef.current       = null;
    setScores([]); setRound(0); setTotalScore(0);
    setPhase('countdown');
    let c = 3;
    setCountdown(c);
    const cd = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(cd);
        setPhase('playing');
        animRef.current = requestAnimationFrame(animate);
      }
    }, 1000);
  };

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  const scale = scaleFromPct(cycleState.pct);
  const phaseLabel = { inhale: 'INHALE (hold)', hold1: 'HOLD', exhale: 'EXHALE (release)', hold2: 'REST' };
  const phaseColor = { inhale: pat.color, hold1: '#f7c59f', exhale: '#ff9f7f', hold2: textMuted };
  const avgSoFar = scoresRef.current.length
    ? Math.round(scoresRef.current.reduce((a, b) => a + b, 0) / scoresRef.current.length)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Pattern selector */}
      {phase === 'idle' && (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {PATTERNS.map(p => (
            <button key={p.id} onClick={() => setPat(p)}
              style={{
                padding: '0.45rem 1rem', borderRadius: '20px', border: 'none',
                background: pat.id === p.id ? p.color : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.08)'),
                color: pat.id === p.id ? '#fff' : textMuted,
                fontWeight: pat.id === p.id ? 700 : 500, fontSize: '0.82rem', cursor: 'pointer',
              }}>
              {p.label}
              <span style={{ fontSize: '0.7rem', opacity: 0.8, marginLeft: '0.3rem' }}>
                ({p.inhale}-{p.hold1}-{p.exhale}-{p.hold2})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      {phase === 'playing' && (
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '0.4rem 0.8rem', borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.06)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.1)'}` }}>
            <div style={{ fontSize: '0.68rem', color: textMuted }}>Round</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, color: textMain }}>{round + 1}/{TOTAL_ROUNDS}</div>
          </div>
          {avgSoFar !== null && (
            <div style={{ textAlign: 'center', padding: '0.4rem 0.8rem', borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.06)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.1)'}` }}>
              <div style={{ fontSize: '0.68rem', color: textMuted }}>Accuracy</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, color: pat.color }}>{avgSoFar}%</div>
            </div>
          )}
        </div>
      )}

      {/* Breathing circle */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Outer ring hint */}
          <div style={{ position: 'absolute', width: 210, height: 210, borderRadius: '50%', border: `2px dashed ${pat.color}20` }} />
          {/* Main circle */}
          <div
            onPointerDown={() => { heldRef.current = true; setHeld(true); }}
            onPointerUp={()   => { heldRef.current = false; setHeld(false); }}
            onPointerLeave={() => { heldRef.current = false; setHeld(false); }}
            style={{
              width: 140, height: 140, borderRadius: '50%',
              background: phase === 'playing'
                ? `radial-gradient(circle, ${pat.color}40 0%, ${pat.color}15 70%)`
                : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.07)',
              border: `3px solid ${phase === 'playing' ? pat.color : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.2)')}`,
              transform: `scale(${phase === 'playing' ? scale : 1})`,
              transition: 'background 0.5s, border-color 0.5s',
              boxShadow: phase === 'playing' ? `0 0 40px ${pat.color}30` : 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: phase === 'playing' ? 'pointer' : 'default',
              userSelect: 'none',
            }}>
            {phase === 'countdown' && (
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '2.5rem', color: pat.color }}>{countdown}</div>
            )}
            {phase === 'playing' && (
              <>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.75rem', color: phaseColor[cycleState.phase] ?? textMuted, letterSpacing: '0.06em' }}>
                  {phaseLabel[cycleState.phase] ?? ''}
                </div>
                <div style={{ fontSize: '0.7rem', color: textMuted, marginTop: '0.2rem' }}>
                  {held ? '👆 HOLDING' : '👇 RELEASE'}
                </div>
              </>
            )}
            {phase === 'idle' && <span style={{ fontSize: '2rem' }}>🫁</span>}
            {phase === 'done' && <span style={{ fontSize: '2rem' }}>✅</span>}
          </div>
        </div>

        {/* Hold helper button for mouse / touch / mobile */}
        {phase === 'playing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <button
              id="breathing-hold-btn"
              onPointerDown={() => { heldRef.current = true; setHeld(true); }}
              onPointerUp={()   => { heldRef.current = false; setHeld(false); }}
              onPointerLeave={() => { heldRef.current = false; setHeld(false); }}
              style={{
                padding: '0.9rem 2.2rem',
                borderRadius: '9999px',
                border: `2px solid ${held ? pat.color : 'rgba(255,255,255,0.2)'}`,
                background: held ? `linear-gradient(135deg, ${pat.color}, #6c63ff)` : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.08)'),
                color: held ? '#fff' : (isDark ? '#e8e6ff' : '#1a1a2e'),
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                userSelect: 'none',
                boxShadow: held ? `0 0 20px ${pat.color}50` : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {held ? '💨 HOLDING BREATH (Hold to Inhale)' : '👆 PRESS & HOLD ON INHALE (or Spacebar)'}
            </button>
            <button
              id="breathing-finish-btn"
              onClick={endGame}
              style={{
                padding: '0.45rem 1.2rem',
                borderRadius: '9999px',
                border: '1px solid rgba(78,205,196,0.4)',
                background: 'transparent',
                color: '#4ecdc4',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ✓ Finish Session & Save Score
            </button>
          </div>
        )}

        {/* Instructions */}
        {phase === 'playing' && (
          <p style={{ fontSize: '0.82rem', color: textMuted, textAlign: 'center', margin: 0 }}>
            Press and hold during <strong style={{ color: pat.color }}>INHALE</strong> · Release during <strong style={{ color: '#ff9f7f' }}>EXHALE</strong>
          </p>
        )}
        {phase === 'idle' && (
          <p style={{ fontSize: '0.82rem', color: textMuted, textAlign: 'center', margin: 0 }}>
            Match your breath to the expanding circle. Press-hold on inhale, release on exhale. Scored on accuracy over {TOTAL_ROUNDS} cycles.
          </p>
        )}
        {phase === 'done' && (
          <div style={{ textAlign: 'center', animation: 'fadeInUp 0.4s ease' }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.2rem', color: pat.color }}>
              🎯 Accuracy: {totalScore}%
            </div>
            <div style={{ fontSize: '0.8rem', color: textMuted, marginTop: '0.3rem' }}>
              Per-round: {scoresRef.current.map(s => `${s}%`).join(' · ')}
            </div>
          </div>
        )}
      </div>

      {/* Action button */}
      {phase !== 'playing' && phase !== 'countdown' && (
        <div style={{ textAlign: 'center' }}>
          <button id="breathing-game-start-btn" onClick={startCountdown}
            style={{ padding: '0.75rem 2.5rem', borderRadius: '12px', border: 'none', background: `linear-gradient(135deg,${pat.color},${pat.color}cc)`, color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: `0 4px 18px ${pat.color}40` }}>
            {phase === 'done' ? '↺ Play Again' : '▶ Start Game'}
          </button>
        </div>
      )}
    </div>
  );
};

export default BreathingGame;
