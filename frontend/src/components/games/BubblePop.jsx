/**
 * components/games/BubblePop.jsx
 * Bubble Pop relaxation game — Part 13.
 *
 * Bubbles drift upward; click to pop them before they escape.
 * Pure CSS divs — no canvas, no external assets.
 *
 * Difficulty levels: Easy / Medium / Hard
 * Score: +10 per pop, -5 per escaped bubble
 * Session ends after 60 seconds.
 *
 * onGameEnd({ score, popped, escaped, duration }) callback
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';

const LEVELS = {
  easy:   { spawnMs: 1400, speed: 5,  maxBubbles: 10, emoji: '😌' },
  medium: { spawnMs: 900,  speed: 7,  maxBubbles: 15, emoji: '😤' },
  hard:   { spawnMs: 550,  speed: 9,  maxBubbles: 22, emoji: '😰' },
};
const GAME_DURATION = 60; // seconds
const BUBBLE_COLORS = ['#6c63ff', '#4ecdc4', '#ff9f7f', '#a8e6cf', '#dda0dd', '#f7c59f', '#ff6b6b'];

let bubbleIdCounter = 0;

const makeId = () => ++bubbleIdCounter;

// ─────────────────────────────────────────────────────────────
const BubblePop = ({ onGameEnd }) => {
  const { isDark } = useTheme();
  const textMain  = isDark ? '#e8e6ff' : '#1a1a2e';
  const textMuted = isDark ? 'rgba(232,230,255,0.45)' : 'rgba(26,26,46,0.45)';

  const [level,     setLevel]     = useState('medium');
  const [phase,     setPhase]     = useState('idle');    // idle | playing | done
  const [bubbles,   setBubbles]   = useState([]);
  const [score,     setScore]     = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(GAME_DURATION);
  const [popped,    setPopped]    = useState(0);
  const [escaped,   setEscaped]   = useState(0);
  const [pops,      setPops]      = useState([]);        // visual pop sparks

  const scoreRef    = useRef(0);
  const poppedRef   = useRef(0);
  const escapedRef  = useRef(0);
  const bubblesRef  = useRef([]);
  const spawnRef    = useRef(null);
  const timerRef    = useRef(null);
  const animRef     = useRef(null);
  const timeRef     = useRef(GAME_DURATION);
  const areaRef     = useRef(null);

  const cfg = LEVELS[level];

  const endGame = useCallback(() => {
    clearInterval(spawnRef.current);
    clearInterval(timerRef.current);
    cancelAnimationFrame(animRef.current);
    setBubbles([]);
    setPhase('done');
    onGameEnd?.({
      score:    scoreRef.current,
      popped:   poppedRef.current,
      escaped:  escapedRef.current,
      duration: GAME_DURATION,
    });
  }, [onGameEnd]);

  // Animation loop — move bubbles up smoothly
  const animate = useCallback(() => {
    bubblesRef.current = bubblesRef.current
      .map(b => ({ ...b, y: b.y - cfg.speed * 0.05 }))
      .filter(b => {
        if (b.y < -10) {
          // escaped
          escapedRef.current += 1;
          scoreRef.current = Math.max(0, scoreRef.current - 2);
          setEscaped(escapedRef.current);
          setScore(scoreRef.current);
          return false;
        }
        return true;
      });
    setBubbles([...bubblesRef.current]);
    animRef.current = requestAnimationFrame(animate);
  }, [cfg.speed]);

  const start = useCallback(() => {
    scoreRef.current   = 0;
    poppedRef.current  = 0;
    escapedRef.current = 0;
    bubblesRef.current = [];
    timeRef.current    = GAME_DURATION;
    setScore(0); setPopped(0); setEscaped(0); setTimeLeft(GAME_DURATION); setBubbles([]); setPops([]);
    setPhase('playing');
  }, []);

  // Spawn loop
  useEffect(() => {
    if (phase !== 'playing') return;
    spawnRef.current = setInterval(() => {
      if (bubblesRef.current.length >= cfg.maxBubbles) return;
      const size  = 36 + Math.random() * 32;
      const color = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
      const x     = 5 + Math.random() * 85;  // %
      const newBubble = { id: makeId(), x, y: 108, size, color, opacity: 0.85 + Math.random() * 0.15 };
      bubblesRef.current = [...bubblesRef.current, newBubble];
    }, cfg.spawnMs);
    return () => clearInterval(spawnRef.current);
  }, [phase, cfg]);

  // Animation
  useEffect(() => {
    if (phase !== 'playing') return;
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, animate]);

  // Countdown
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      timeRef.current -= 1;
      setTimeLeft(timeRef.current);
      if (timeRef.current <= 0) endGame();
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, endGame]);

  const popBubble = useCallback((id, x, y, color) => {
    bubblesRef.current = bubblesRef.current.filter(b => b.id !== id);
    setBubbles([...bubblesRef.current]);
    poppedRef.current  += 1;
    scoreRef.current   += 10;
    setPopped(poppedRef.current);
    setScore(scoreRef.current);
    // visual pop
    const spark = { id: makeId(), x, y, color };
    setPops(p => [...p, spark]);
    setTimeout(() => setPops(p => p.filter(s => s.id !== spark.id)), 500);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Level selector */}
      {phase === 'idle' && (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          {Object.entries(LEVELS).map(([key, l]) => (
            <button key={key} onClick={() => setLevel(key)}
              style={{
                padding: '0.45rem 1.1rem', borderRadius: '20px', border: 'none',
                background: level === key ? '#6c63ff' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.08)'),
                color: level === key ? '#fff' : textMuted,
                fontWeight: level === key ? 700 : 500, fontSize: '0.82rem', cursor: 'pointer',
              }}>
              {l.emoji} {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Stats bar */}
      {phase !== 'idle' && (
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { label: '⏱', value: `${timeLeft}s` },
            { label: '🎯', value: score },
            { label: '💥', value: popped },
            { label: '💨', value: escaped },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center', minWidth: 54, padding: '0.4rem 0.7rem', borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.06)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.1)'}` }}>
              <div style={{ fontSize: '0.68rem', color: textMuted }}>{label}</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1rem', color: textMain }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Game arena */}
      <div
        ref={areaRef}
        id="bubble-arena"
        style={{
          position: 'relative', width: '100%', height: 340, borderRadius: '18px', overflow: 'hidden',
          background: isDark
            ? 'linear-gradient(180deg, rgba(15,14,26,0.95) 0%, rgba(26,24,48,0.9) 100%)'
            : 'linear-gradient(180deg, #f0eeff 0%, #e8f8f7 100%)',
          border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.12)'}`,
          userSelect: 'none',
        }}>

        {/* Bubbles */}
        {bubbles.map(b => (
          <div key={b.id}
            id={`bubble-${b.id}`}
            onClick={() => phase === 'playing' && popBubble(b.id, b.x, b.y, b.color)}
            style={{
              position: 'absolute',
              left: `${b.x}%`, top: `${b.y}%`,
              width: b.size, height: b.size,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, ${b.color}cc, ${b.color}55)`,
              border: `2px solid ${b.color}`,
              boxShadow: `0 0 12px ${b.color}40, inset 0 0 8px rgba(255,255,255,0.25)`,
              cursor: 'pointer',
              transform: 'translate(-50%, -50%)',
              transition: 'transform 0.06s',
              opacity: b.opacity,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-50%,-50%) scale(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translate(-50%,-50%) scale(1)'; }}
          />
        ))}

        {/* Pop sparks */}
        {pops.map(s => (
          <div key={s.id} style={{
            position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
            transform: 'translate(-50%,-50%)',
            fontSize: '1.3rem', pointerEvents: 'none',
            animation: 'popSpark 0.5s ease forwards',
          }}>💥</div>
        ))}

        {/* Overlay messages */}
        {phase === 'idle' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <div style={{ fontSize: '3rem' }}>🫧</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '1rem', color: textMain }}>Click bubbles before they escape!</div>
            <div style={{ fontSize: '0.8rem', color: textMuted }}>+10 per pop · -5 per escape · 60 seconds</div>
          </div>
        )}
        {phase === 'done' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: isDark ? 'rgba(15,14,26,0.9)' : 'rgba(240,238,255,0.92)' }}>
            <div style={{ fontSize: '2.5rem' }}>🏆</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.3rem', color: '#6c63ff' }}>Score: {score}</div>
            <div style={{ fontSize: '0.8rem', color: textMuted }}>Popped: {popped} · Escaped: {escaped}</div>
          </div>
        )}
      </div>

      {/* Action button */}
      <div style={{ textAlign: 'center' }}>
        {phase === 'playing' ? (
          <button id="bubble-finish-btn" onClick={endGame}
            style={{ padding: '0.65rem 1.8rem', borderRadius: '12px', border: '1px solid #4ecdc4', background: 'rgba(78,205,196,0.15)', color: '#4ecdc4', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
            ✓ Finish & Save Score
          </button>
        ) : (
          <button id="bubble-start-btn" onClick={start}
            style={{ padding: '0.75rem 2.5rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#6c63ff,#4ecdc4)', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 18px rgba(108,99,255,0.4)' }}>
            {phase === 'done' ? '↺ Play Again' : '▶ Start Game'}
          </button>
        )}
      </div>

      <style>{`
        @keyframes popSpark {
          0%   { opacity: 1; transform: translate(-50%,-50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%,-50%) scale(2.5); }
        }
      `}</style>
    </div>
  );
};

export default BubblePop;
