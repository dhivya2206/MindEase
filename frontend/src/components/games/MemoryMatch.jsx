/**
 * components/games/MemoryMatch.jsx
 * Relaxation Memory Match game — Part 13.
 *
 * Deterministic, robust pair-matching logic with pure React state.
 * No mutated refs inside state updaters.
 * No duplicate emojis in the pool.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';

// 20 completely unique, calming emojis
const EMOJI_POOL = [
  '🌸', '🌊', '🦋', '🌙', '⭐', '🌿', '🐠', '🌺',
  '🦚', '🌈', '🍃', '🐋', '🌻', '🦜', '🍀', '🌴',
  '🦊', '🐬', '🍄', '🍁',
];

const GRIDS = {
  '4×3': { cols: 4, pairs: 6,  label: 'Easy' },
  '4×4': { cols: 4, pairs: 8,  label: 'Medium' },
  '5×4': { cols: 5, pairs: 10, label: 'Hard' },
};

const buildDeck = (pairs) => {
  const chosen = EMOJI_POOL.slice(0, pairs);
  const rawCards = [];
  chosen.forEach((emoji, idx) => {
    rawCards.push({ id: `card-${idx}-a`, pairId: idx, emoji });
    rawCards.push({ id: `card-${idx}-b`, pairId: idx, emoji });
  });

  // Fisher-Yates shuffle
  for (let i = rawCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rawCards[i], rawCards[j]] = [rawCards[j], rawCards[i]];
  }
  return rawCards;
};

const MemoryMatch = ({ onGameEnd }) => {
  const { isDark } = useTheme();
  const textMain  = isDark ? '#e8e6ff' : '#1a1a2e';
  const textMuted = isDark ? 'rgba(232,230,255,0.5)' : 'rgba(26,26,46,0.5)';

  const [gridKey, setGridKey] = useState('4×4');
  const [cards, setCards] = useState([]);
  const [phase, setPhase] = useState('idle'); // idle | playing | done
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [score, setScore] = useState(0);

  // Active flips
  const [firstCard, setFirstCard] = useState(null);
  const [secondCard, setSecondCard] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const timerRef = useRef(null);
  const elapsedRef = useRef(0);
  const movesRef = useRef(0);
  const grid = GRIDS[gridKey];

  // ── Start Game ─────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    clearInterval(timerRef.current);
    const newDeck = buildDeck(grid.pairs);
    setCards(newDeck);
    setFirstCard(null);
    setSecondCard(null);
    setMatchedIds([]);
    setIsProcessing(false);
    setMoves(0);
    setElapsed(0);
    setScore(0);
    elapsedRef.current = 0;
    movesRef.current = 0;
    setPhase('playing');

    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
  }, [grid]);

  // Clean timer on unmount
  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  // ── Handle Flip ────────────────────────────────────────────────────────────
  const handleCardClick = (card) => {
    if (phase !== 'playing' || isProcessing) return;
    if (matchedIds.includes(card.id)) return;
    if (firstCard && firstCard.id === card.id) return; // ignore clicking same card

    if (!firstCard) {
      // First card chosen
      setFirstCard(card);
    } else if (!secondCard) {
      // Second card chosen
      setSecondCard(card);
      const newMoves = moves + 1;
      setMoves(newMoves);
      movesRef.current = newMoves;

      if (firstCard.pairId === card.pairId) {
        // MATCH!
        const nextMatched = [...matchedIds, firstCard.id, card.id];
        setMatchedIds(nextMatched);
        setFirstCard(null);
        setSecondCard(null);

        // Check if all pairs are solved
        if (nextMatched.length === grid.pairs * 2) {
          clearInterval(timerRef.current);
          const timeSec = elapsedRef.current;
          const finalScore = Math.max(100, 1000 - newMoves * 15 - timeSec * 5);
          setScore(finalScore);
          setPhase('done');
          onGameEnd?.({
            score: finalScore,
            moves: newMoves,
            timeSec,
            grid: gridKey,
          });
        }
      } else {
        // NO MATCH -> flip back after brief pause
        setIsProcessing(true);
        setTimeout(() => {
          setFirstCard(null);
          setSecondCard(null);
          setIsProcessing(false);
        }, 800);
      }
    }
  };

  // ── Early Finish / Save ────────────────────────────────────────────────────
  const handleFinishEarly = () => {
    clearInterval(timerRef.current);
    const pairsSolved = matchedIds.length / 2;
    const finalScore = Math.max(50, Math.round(pairsSolved * 80 - moves * 5));
    setScore(finalScore);
    setPhase('done');
    onGameEnd?.({
      score: finalScore,
      moves,
      timeSec: elapsed,
      grid: gridKey,
    });
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const pairsFound = matchedIds.length / 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Grid size / difficulty selector */}
      {phase === 'idle' && (
        <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center' }}>
          {Object.entries(GRIDS).map(([key, g]) => (
            <button
              key={key}
              id={`memory-grid-btn-${key.replace('×', 'x')}`}
              onClick={() => setGridKey(key)}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '20px',
                border: 'none',
                background: gridKey === key ? '#4ecdc4' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(78,205,196,0.12)'),
                color: gridKey === key ? '#fff' : textMuted,
                fontWeight: gridKey === key ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {key} <span style={{ opacity: 0.75, fontSize: '0.75rem' }}>({g.label})</span>
            </button>
          ))}
        </div>
      )}

      {/* Real-time stats bar */}
      {phase !== 'idle' && (
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { label: '⏱ Time', value: fmt(elapsed) },
            { label: '🔄 Moves', value: moves },
            { label: '✅ Pairs', value: `${pairsFound} / ${grid.pairs}` },
            ...(phase === 'done' ? [{ label: '🏆 Score', value: score }] : []),
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                textAlign: 'center',
                minWidth: 70,
                padding: '0.45rem 0.85rem',
                borderRadius: '12px',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(78,205,196,0.08)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(78,205,196,0.2)'}`,
              }}
            >
              <div style={{ fontSize: '0.7rem', color: textMuted }}>{label}</div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: textMain }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Card Arena Grid */}
      <div
        id="memory-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
          gap: '0.65rem',
          maxWidth: 480,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {phase === 'idle' ? (
          // Idle preview
          Array.from({ length: grid.pairs * 2 }, (_, i) => (
            <div
              key={i}
              style={{
                aspectRatio: '1',
                borderRadius: '14px',
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(78,205,196,0.06)',
                border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(78,205,196,0.18)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: textMuted,
                boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(78,205,196,0.05)',
              }}
            >
              ✨
            </div>
          ))
        ) : (
          cards.map((card) => {
            const isFlipped = matchedIds.includes(card.id) || firstCard?.id === card.id || secondCard?.id === card.id;
            const isMatched = matchedIds.includes(card.id);

            return (
              <button
                key={card.id}
                id={`card-${card.id}`}
                onClick={() => handleCardClick(card)}
                disabled={isMatched || isProcessing || isFlipped}
                style={{
                  aspectRatio: '1',
                  borderRadius: '14px',
                  cursor: isMatched ? 'default' : (isProcessing ? 'not-allowed' : 'pointer'),
                  background: isMatched
                    ? 'rgba(78,205,196,0.2)'
                    : isFlipped
                    ? (isDark ? 'rgba(108,99,255,0.3)' : 'rgba(108,99,255,0.18)')
                    : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(78,205,196,0.1)'),
                  border: `2px solid ${isMatched ? '#4ecdc4' : isFlipped ? '#6c63ff' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(78,205,196,0.25)')}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(1.4rem, 4vw, 2.1rem)',
                  transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isFlipped ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isMatched
                    ? '0 0 16px rgba(78,205,196,0.35)'
                    : isFlipped
                    ? '0 0 16px rgba(108,99,255,0.35)'
                    : (isDark ? '0 3px 12px rgba(0,0,0,0.25)' : '0 3px 12px rgba(78,205,196,0.08)'),
                  outline: 'none',
                }}
              >
                {isFlipped ? card.emoji : '❓'}
              </button>
            );
          })
        )}
      </div>

      {/* Completion Banner */}
      {phase === 'done' && (
        <div style={{ textAlign: 'center', padding: '0.8rem', animation: 'fadeInUp 0.4s ease' }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#4ecdc4', marginBottom: '0.2rem' }}>
            🎉 Great Job! All pairs found!
          </div>
          <div style={{ fontSize: '0.85rem', color: textMuted }}>
            Completed in {fmt(elapsed)} with {moves} moves · Score: <strong style={{ color: '#4ecdc4' }}>{score}</strong>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {phase === 'playing' ? (
          <>
            <button
              id="memory-reset-btn"
              onClick={startGame}
              style={{
                padding: '0.65rem 1.6rem',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: textMuted,
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              ↻ Reshuffle
            </button>
            <button
              id="memory-finish-btn"
              onClick={handleFinishEarly}
              style={{
                padding: '0.65rem 1.8rem',
                borderRadius: '12px',
                border: '1px solid #4ecdc4',
                background: 'rgba(78,205,196,0.15)',
                color: '#4ecdc4',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              ✓ Finish & Save ({pairsFound}/{grid.pairs})
            </button>
          </>
        ) : (
          <button
            id="memory-start-btn"
            onClick={startGame}
            style={{
              padding: '0.75rem 2.5rem',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #4ecdc4, #6c63ff)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(78,205,196,0.4)',
            }}
          >
            {phase === 'done' ? '↺ Play Again' : '▶ Start Game'}
          </button>
        )}
      </div>

    </div>
  );
};

export default MemoryMatch;
