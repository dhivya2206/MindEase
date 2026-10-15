/**
 * components/games/ReactionGame.jsx
 * Focus & Reaction game — Part 13.
 *
 * A glowing target appears at random positions after a random delay.
 * Tap it as fast as possible. Miss = penalty.
 * 10 rounds. Score based on reaction time.
 *
 * Score per hit: max(0, 1000 - reactionMs)
 * Score per miss: -150
 *
 * onGameEnd({ score, avgMs, hits, misses }) callback
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';

const ROUNDS       = 10;
const MIN_DELAY_MS = 800;
const MAX_DELAY_MS = 3200;
const TARGET_VIS_MS = 1800;  // target disappears if not clicked within this time

const TARGET_SIZE = 64;
const COLORS      = ['#6c63ff', '#4ecdc4', '#ff9f7f', '#a8e6cf', '#f7c59f'];

let gId = 0;

// ─────────────────────────────────────────────────────────────
const ReactionGame = ({ onGameEnd }) => {
  const { isDark } = useTheme();
  const textMain  = isDark ? '#e8e6ff' : '#1a1a2e';
  const textMuted = isDark ? 'rgba(232,230,255,0.45)' : 'rgba(26,26,46,0.45)';

  const [phase,     setPhase]     = useState('idle');   // idle | waiting | target | done
  const [round,     setRound]     = useState(0);
  const [score,     setScore]     = useState(0);
  const [hits,      setHits]      = useState(0);
  const [misses,    setMisses]    = useState(0);
  const [reactionMs, setReactionMs] = useState(null);
  const [target,    setTarget]    = useState(null);     // { id, x, y, color }
  const [feedback,  setFeedback]  = useState(null);     // { text, color }
  const [avgMs,     setAvgMs]     = useState(0);
  const [lastMs,    setLastMs]    = useState(null);

  const scoreRef   = useRef(0);
  const hitsRef    = useRef(0);
  const missesRef  = useRef(0);
  const roundRef   = useRef(0);
  const timingsRef = useRef([]);
  const delayRef   = useRef(null);
  const visRef     = useRef(null);
  const appearedAt = useRef(null);
  const areaRef    = useRef(null);

  const showFeedback = (text, color) => {
    setFeedback({ text, color });
    setTimeout(() => setFeedback(null), 700);
  };

  const endGame = useCallback(() => {
    clearTimeout(delayRef.current);
    clearTimeout(visRef.current);
    setTarget(null);
    setPhase('done');
    const avg = timingsRef.current.length
      ? Math.round(timingsRef.current.reduce((a, b) => a + b, 0) / timingsRef.current.length)
      : 0;
    setAvgMs(avg);
    onGameEnd?.({ score: scoreRef.current, avgMs: avg, hits: hitsRef.current, misses: missesRef.current });
  }, [onGameEnd]);

  const scheduleNext = useCallback(() => {
    roundRef.current += 1;
    if (roundRef.current > ROUNDS) { endGame(); return; }
    setRound(roundRef.current);
    setPhase('waiting');
    setTarget(null);

    const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
    delayRef.current = setTimeout(() => {
      // Spawn target
      const area  = areaRef.current;
      const w     = area ? area.offsetWidth  - TARGET_SIZE - 16 : 260;
      const h     = area ? area.offsetHeight - TARGET_SIZE - 16 : 200;
      const x     = 8 + Math.random() * w;
      const y     = 8 + Math.random() * h;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      appearedAt.current = Date.now();
      setTarget({ id: ++gId, x, y, color });
      setPhase('target');

      // Auto-miss if not clicked
      visRef.current = setTimeout(() => {
        setTarget(null);
        missesRef.current += 1;
        scoreRef.current = Math.max(0, scoreRef.current - 150);
        setMisses(missesRef.current);
        setScore(scoreRef.current);
        showFeedback('Too slow! -150', '#ff6b6b');
        scheduleNext();
      }, TARGET_VIS_MS);
    }, delay);
  }, [endGame]);

  const handleHit = useCallback((id) => {
    if (phase !== 'target') return;
    clearTimeout(visRef.current);
    const ms  = Date.now() - (appearedAt.current ?? Date.now());
    const pts = Math.max(0, 1000 - ms);
    timingsRef.current = [...timingsRef.current, ms];
    hitsRef.current   += 1;
    scoreRef.current  += pts;
    setHits(hitsRef.current);
    setScore(scoreRef.current);
    setLastMs(ms);
    setTarget(null);
    showFeedback(`+${pts} · ${ms}ms`, ms < 400 ? '#a8e6cf' : ms < 700 ? '#f7c59f' : '#ff9f7f');
    scheduleNext();
  }, [phase, scheduleNext]);

  const handleMissClick = useCallback(() => {
    if (phase !== 'target') return; // click on arena bg during target phase = miss
    clearTimeout(visRef.current);
    missesRef.current += 1;
    scoreRef.current = Math.max(0, scoreRef.current - 150);
    setMisses(missesRef.current);
    setScore(scoreRef.current);
    setTarget(null);
    showFeedback('Missed! -150', '#ff6b6b');
    scheduleNext();
  }, [phase, scheduleNext]);

  const startGame = useCallback(() => {
    clearTimeout(delayRef.current); clearTimeout(visRef.current);
    scoreRef.current = 0; hitsRef.current = 0; missesRef.current = 0; roundRef.current = 0;
    timingsRef.current = [];
    setScore(0); setHits(0); setMisses(0); setRound(0); setTarget(null); setLastMs(null); setAvgMs(0);
    setPhase('waiting');
    scheduleNext();
  }, [scheduleNext]);

  useEffect(() => () => { clearTimeout(delayRef.current); clearTimeout(visRef.current); }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Stats bar */}
      {phase !== 'idle' && (
        <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'Round',  value: `${Math.min(round, ROUNDS)}/${ROUNDS}` },
            { label: 'Score',  value: score },
            { label: '✅ Hits',  value: hits },
            { label: '❌ Missed', value: misses },
            ...(lastMs ? [{ label: '⚡ Last',  value: `${lastMs}ms` }] : []),
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center', minWidth: 60, padding: '0.35rem 0.65rem', borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.06)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.1)'}` }}>
              <div style={{ fontSize: '0.65rem', color: textMuted }}>{label}</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '0.9rem', color: textMain }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Game arena */}
      <div
        ref={areaRef}
        id="reaction-arena"
        onClick={phase === 'target' ? handleMissClick : undefined}
        style={{
          position: 'relative', width: '100%', height: 320, borderRadius: '18px', overflow: 'hidden',
          background: isDark
            ? 'linear-gradient(135deg, rgba(15,14,26,0.95) 0%, rgba(26,24,48,0.9) 100%)'
            : 'linear-gradient(135deg, #f8f7ff 0%, #f0eeff 100%)',
          border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.12)'}`,
          cursor: phase === 'target' ? 'crosshair' : 'default',
          userSelect: 'none',
        }}>

        {/* Target */}
        {target && (
          <div
            id={`target-${target.id}`}
            onClick={(e) => { e.stopPropagation(); handleHit(target.id); }}
            style={{
              position: 'absolute',
              left: target.x, top: target.y,
              width: TARGET_SIZE, height: TARGET_SIZE,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, ${target.color}cc, ${target.color}55)`,
              border: `3px solid ${target.color}`,
              boxShadow: `0 0 20px ${target.color}60, 0 0 40px ${target.color}30`,
              cursor: 'pointer',
              animation: 'targetAppear 0.15s ease, targetPulse 0.8s ease-in-out infinite alternate',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem',
            }}>
            🎯
          </div>
        )}

        {/* Feedback label */}
        {feedback && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.2rem',
            color: feedback.color, pointerEvents: 'none',
            animation: 'feedbackPop 0.7s ease forwards',
          }}>
            {feedback.text}
          </div>
        )}

        {/* Idle overlay */}
        {phase === 'idle' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <div style={{ fontSize: '3rem' }}>🎯</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '1rem', color: textMain }}>Tap the target!</div>
            <div style={{ fontSize: '0.8rem', color: textMuted, textAlign: 'center', padding: '0 1rem' }}>
              React as fast as you can. {ROUNDS} targets. Score: 1000 − reaction ms per hit.
            </div>
          </div>
        )}

        {/* Waiting overlay */}
        {phase === 'waiting' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: textMuted, animation: 'blink 1s ease-in-out infinite' }}>
              Wait for it…
            </div>
          </div>
        )}

        {/* Done overlay */}
        {phase === 'done' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: isDark ? 'rgba(15,14,26,0.92)' : 'rgba(240,238,255,0.92)' }}>
            <div style={{ fontSize: '2.5rem' }}>⚡</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#6c63ff' }}>Score: {score}</div>
            <div style={{ fontSize: '0.8rem', color: textMuted }}>Avg reaction: {avgMs}ms · Hits: {hits} · Missed: {misses}</div>
          </div>
        )}
      </div>

      {/* Action button */}
      <div style={{ textAlign: 'center' }}>
        {(phase === 'waiting' || phase === 'target') ? (
          <button id="reaction-finish-btn" onClick={endGame}
            style={{ padding: '0.65rem 1.8rem', borderRadius: '12px', border: '1px solid #ff9f7f', background: 'rgba(255,159,127,0.15)', color: '#ff9f7f', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
            ✓ Finish & Save Score ({round}/{ROUNDS})
          </button>
        ) : (
          <button id="reaction-start-btn" onClick={startGame}
            style={{ padding: '0.75rem 2.5rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#ff9f7f,#6c63ff)', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 18px rgba(108,99,255,0.4)' }}>
            {phase === 'done' ? '↺ Play Again' : '▶ Start Game'}
          </button>
        )}
      </div>

      <style>{`
        @keyframes targetAppear {
          from { transform: scale(0.3); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes targetPulse {
          from { box-shadow: 0 0 20px var(--tc,#6c63ff)60, 0 0 40px var(--tc,#6c63ff)30; }
          to   { box-shadow: 0 0 35px var(--tc,#6c63ff)90, 0 0 60px var(--tc,#6c63ff)50; }
        }
        @keyframes feedbackPop {
          0%   { opacity: 1; transform: translate(-50%,-50%) scale(1); }
          70%  { opacity: 1; transform: translate(-50%,-80%) scale(1.1); }
          100% { opacity: 0; transform: translate(-50%,-100%) scale(0.9); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default ReactionGame;
