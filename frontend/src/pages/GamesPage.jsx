/**
 * pages/GamesPage.jsx
 * Relaxation Games — Part 13.
 *
 * Dashboard with four games + live score tracking.
 *
 * Games:
 *   🫧 Bubble Pop    — pop bubbles before they escape
 *   🃏 Memory Match  — emoji card-flip pairs
 *   🫁 Breathing     — breathing rhythm accuracy
 *   🎯 Reaction      — tap the target fast
 *
 * Scores are persisted to the backend via /api/games.
 * Stats panel shows: games played, best score, last played.
 */

import { useState, useEffect, useCallback } from 'react';
import DashboardShell from '../components/dashboard/DashboardShell';
import { Card, SectionHeader, SkeletonBlock } from '../components/dashboard/ui.jsx';
import { useTheme } from '../context/ThemeContext';
import { saveScore, getGameStats } from '../services/gameService.js';

import BubblePop     from '../components/games/BubblePop';
import MemoryMatch   from '../components/games/MemoryMatch';
import BreathingGame from '../components/games/BreathingGame';
import ReactionGame  from '../components/games/ReactionGame';

// ── Game catalogue ────────────────────────────────────────────
const GAMES = [
  {
    id:       'bubble_pop',
    label:    'Bubble Pop',
    emoji:    '🫧',
    color:    '#6c63ff',
    tagline:  'Pop the bubbles before they escape',
    tags:     ['reflex', 'visual', 'calming'],
    component: BubblePop,
  },
  {
    id:       'memory_match',
    label:    'Memory Match',
    emoji:    '🃏',
    color:    '#4ecdc4',
    tagline:  'Flip cards and find the matching pairs',
    tags:     ['memory', 'focus', 'cognitive'],
    component: MemoryMatch,
  },
  {
    id:       'breathing_game',
    label:    'Breathing Game',
    emoji:    '🫁',
    color:    '#a8e6cf',
    tagline:  'Match your breath to the animated circle',
    tags:     ['breathing', 'mindful', 'calming'],
    component: BreathingGame,
  },
  {
    id:       'reaction_game',
    label:    'Reaction',
    emoji:    '🎯',
    color:    '#ff9f7f',
    tagline:  'Tap the target the instant it appears',
    tags:     ['reaction', 'focus', 'speed'],
    component: ReactionGame,
  },
];

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// ─────────────────────────────────────────────────────────────
const GamesPage = () => {
  const { isDark } = useTheme();
  const textMain  = isDark ? '#e8e6ff' : '#1a1a2e';
  const textMuted = isDark ? 'rgba(232,230,255,0.45)' : 'rgba(26,26,46,0.45)';
  const border    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.09)';

  const [activeGame,  setActiveGame]  = useState(null);  // game id or null
  const [stats,       setStats]       = useState(null);   // [{ game, gamesPlayed, bestScore, lastPlayedAt }]
  const [statsLoading, setStatsLoading] = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [lastResult,  setLastResult]  = useState(null);  // { score, label }

  // Load stats on mount
  useEffect(() => {
    setStatsLoading(true);
    getGameStats()
      .then(s => setStats(s))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  const handleGameEnd = useCallback(async (gameId, gameLabel, result) => {
    setLastResult({ score: result.score, label: gameLabel });
    setSaving(true);
    try {
      await saveScore({
        game:  gameId,
        score: result.score,
        meta:  result,
      });
      // Re-fetch stats
      const updated = await getGameStats();
      setStats(updated);
    } catch {
      // Score save failed silently — game still played fine
    } finally {
      setSaving(false);
    }
  }, []);

  const activeMeta = GAMES.find(g => g.id === activeGame);

  const statForGame = (id) => stats?.find(s => s.game === id);

  return (
    <DashboardShell>
      {/* ── Page header ──────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 'clamp(1.2rem,3vw,1.6rem)', fontWeight: 800, margin: '0 0 0.3rem', background: 'linear-gradient(135deg,#6c63ff,#ff9f7f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            🎮 Relaxation Games
          </h2>
          <p style={{ fontSize: '0.85rem', color: textMuted, margin: 0 }}>
            Mindful mini-games to reduce stress, sharpen focus, and lift your mood.
          </p>
        </div>
        {activeGame && (
          <button onClick={() => { setActiveGame(null); setLastResult(null); }}
            style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: `1px solid ${border}`, background: 'transparent', color: textMuted, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
            ← All Games
          </button>
        )}
      </div>

      {/* ── Two-col layout ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.25rem', alignItems: 'start' }} className="games-grid">

        {/* Main column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Dashboard: game selection cards */}
          {!activeGame && (
            <>
              {/* Last result banner */}
              {lastResult && (
                <div style={{
                  padding: '0.8rem 1.1rem', borderRadius: '12px',
                  background: 'linear-gradient(135deg,rgba(108,99,255,0.12),rgba(255,159,127,0.08))',
                  border: `1px solid ${border}`,
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  animation: 'fadeInUp 0.4s ease',
                }}>
                  <span style={{ fontSize: '1.5rem' }}>🏅</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: textMain }}>{lastResult.label}</div>
                    <div style={{ fontSize: '0.8rem', color: textMuted }}>Score saved: <strong style={{ color: '#6c63ff' }}>{lastResult.score}</strong> {saving && '(saving…)'}</div>
                  </div>
                </div>
              )}

              {/* Game cards grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                {GAMES.map(g => {
                  const s = statForGame(g.id);
                  return (
                    <button
                      key={g.id}
                      id={`game-card-${g.id}`}
                      onClick={() => { setActiveGame(g.id); setLastResult(null); }}
                      style={{
                        textAlign: 'left', padding: '1.25rem', borderRadius: '18px', border: `1.5px solid ${border}`,
                        background: isDark ? 'rgba(26,24,48,0.85)' : '#fff',
                        boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 20px rgba(108,99,255,0.07)',
                        cursor: 'pointer', transition: 'all 0.25s ease',
                        position: 'relative', overflow: 'hidden',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 30px ${g.color}25`; e.currentTarget.style.borderColor = `${g.color}40`; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 20px rgba(108,99,255,0.07)'; e.currentTarget.style.borderColor = border; }}>

                      {/* Glow orb */}
                      <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: g.color, opacity: 0.07, filter: 'blur(24px)', pointerEvents: 'none' }} />

                      {/* Icon */}
                      <div style={{ width: 52, height: 52, borderRadius: '14px', background: `${g.color}18`, border: `1.5px solid ${g.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', marginBottom: '0.9rem' }}>
                        {g.emoji}
                      </div>

                      <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1rem', color: textMain, marginBottom: '0.2rem' }}>{g.label}</div>
                      <div style={{ fontSize: '0.78rem', color: textMuted, marginBottom: '0.75rem', lineHeight: 1.5 }}>{g.tagline}</div>

                      {/* Tags */}
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                        {g.tags.map(t => (
                          <span key={t} style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: `${g.color}12`, color: g.color, fontWeight: 600 }}>{t}</span>
                        ))}
                      </div>

                      {/* Mini stats */}
                      {statsLoading ? (
                        <SkeletonBlock height={14} width="70%" />
                      ) : s && s.gamesPlayed > 0 ? (
                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem', color: textMuted }}>
                          <span>🎮 {s.gamesPlayed} played</span>
                          <span>🏆 Best: <strong style={{ color: g.color }}>{s.bestScore}</strong></span>
                          <span>📅 {fmtDate(s.lastPlayedAt)}</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.72rem', color: textMuted }}>Not played yet</div>
                      )}

                      {/* CTA arrow */}
                      <div style={{ position: 'absolute', bottom: '1.1rem', right: '1.1rem', fontSize: '1rem', color: g.color, opacity: 0.6 }}>→</div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Active game view */}
          {activeGame && activeMeta && (
            <Card id={`game-active-${activeGame}`}>
              <SectionHeader
                title={`${activeMeta.emoji} ${activeMeta.label}`}
                subtitle={activeMeta.tagline}
                style={{ marginBottom: '1.25rem' }}
              />
              <activeMeta.component
                onGameEnd={(result) => handleGameEnd(activeMeta.id, activeMeta.label, result)}
              />
            </Card>
          )}
        </div>

        {/* Right: stats panel ──────────────────────────────── */}
        <Card id="games-stats-panel" style={{ position: 'sticky', top: '1rem' }}>
          <SectionHeader title="📊 Your Stats" subtitle="All-time game records" />

          {statsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1, 2, 3, 4].map(i => <SkeletonBlock key={i} height={56} radius={12} />)}
            </div>
          ) : !stats ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: textMuted, fontSize: '0.83rem' }}>
              Could not load stats.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {GAMES.map(g => {
                const s = statForGame(g.id);
                const played = s?.gamesPlayed ?? 0;
                return (
                  <button
                    key={g.id}
                    onClick={() => { setActiveGame(g.id); setLastResult(null); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.75rem',
                      borderRadius: '12px', border: `1px solid ${activeGame === g.id ? g.color + '40' : border}`,
                      background: activeGame === g.id ? `${g.color}10` : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(108,99,255,0.03)'),
                      cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%',
                    }}>
                    <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{g.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: textMain }}>{g.label}</div>
                      {played > 0 ? (
                        <div style={{ fontSize: '0.68rem', color: textMuted }}>
                          Best: <strong style={{ color: g.color }}>{s.bestScore}</strong> · {played} games · {fmtDate(s.lastPlayedAt)}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.68rem', color: textMuted }}>Not played yet</div>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Overall summary */}
              {stats.some(s => s.gamesPlayed > 0) && (
                <div style={{ marginTop: '0.5rem', padding: '0.7rem', borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(108,99,255,0.05)', border: `1px solid ${border}` }}>
                  <div style={{ fontSize: '0.72rem', color: textMuted, marginBottom: '0.4rem', fontWeight: 600 }}>OVERALL</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#6c63ff' }}>
                        {stats.reduce((a, s) => a + s.gamesPlayed, 0)}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: textMuted }}>total games</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#ff9f7f' }}>
                        {Math.max(...stats.map(s => s.bestScore), 0)}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: textMuted }}>top score</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .games-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </DashboardShell>
  );
};

export default GamesPage;
