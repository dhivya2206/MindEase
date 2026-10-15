/**
 * components/dashboard/WellnessSnapshot.jsx
 * Three metric cards: current mood, wellness score, stress level.
 * Part 6 update: MoodCard shows real last-logged mood from moodStats prop.
 * Part 7 update: ScoreCard and StressCard show real data from today's check-in.
 */

import { Link } from 'react-router-dom';
import { Card, Badge, SkeletonBlock } from './ui.jsx';
import { getMoodMeta } from '../../constants/moods.js';
import { getScoreRange } from '../../constants/checkIn.js';
import { useTheme } from '../../context/ThemeContext';

// ── Radial arc indicator (SVG) ────────────────────────────────
const ArcMeter = ({ value, max = 100, color, size = 80 }) => {
  const r = 30;
  const circumference = Math.PI * r;
  const fraction = Math.min(value / max, 1);
  const dash = circumference * fraction;

  return (
    <svg width={size} height={size / 1.3} viewBox="0 0 80 52" aria-hidden="true">
      <path d="M 10 40 A 30 30 0 0 1 70 40" fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth="6" strokeLinecap="round" />
      <path d="M 10 40 A 30 30 0 0 1 70 40" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}
      />
      <text x="40" y="38" textAnchor="middle" fontSize="13" fontWeight="700" fill={color} fontFamily="Outfit,sans-serif">
        {value}
      </text>
    </svg>
  );
};

// ── Mood emoji button row ─────────────────────────────────────
const MOOD_OPTIONS = [
  { emoji: '😔', label: 'Low' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😊', label: 'Great' },
  { emoji: '🤩', label: 'Amazing' },
];

// ── Mood Card ─────────────────────────────────────────────────
const MoodCard = ({ isDark, lastMood }) => {
  const meta = lastMood ? getMoodMeta(lastMood.mood) : null;

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} id="wellness-mood-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Today's Mood</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.1rem', fontWeight: 700, color: isDark ? '#e8e6ff' : '#1a1a2e' }}>
            {meta ? `${meta.emoji} ${meta.label}` : 'Not logged yet'}
          </div>
        </div>
        {meta
          ? <Badge color="teal">Intensity {lastMood.intensity}/5</Badge>
          : <Badge color="default">Not logged</Badge>
        }
      </div>

      {/* Mood picker — preview only, links to mood page */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
        {MOOD_OPTIONS.map(({ emoji, label }) => (
          <button key={label} title={label} disabled style={{
            flex: 1, padding: '0.6rem 0.25rem', borderRadius: '10px',
            border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.1)'}`,
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(108,99,255,0.03)',
            cursor: 'not-allowed', opacity: 0.6,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
          }}>
            <span style={{ fontSize: '1.4rem' }}>{emoji}</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{label}</span>
          </button>
        ))}
      </div>
      <p style={{ fontSize: '0.78rem', opacity: 0.45, margin: 0, textAlign: 'center' }}>
        {meta ? 'Update your mood on the Mood page →' : 'Log your first mood to start tracking'}
      </p>
    </Card>
  );
};

// ── Score Card ────────────────────────────────────────────────
const ScoreCard = ({ isDark, checkIn }) => {
  const hasScore = checkIn && typeof checkIn.wellnessScore === 'number';
  const score    = hasScore ? checkIn.wellnessScore : 0;
  const range    = hasScore ? getScoreRange(score) : null;

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }} id="wellness-score-card">
      <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Wellness Score</div>
      <ArcMeter value={hasScore ? score : 0} color={hasScore ? range.color : '#6c63ff'} size={96} />
      <div>
        {hasScore ? (
          <>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.95rem', fontWeight: 800, color: range.color }}>
              {range.icon} {range.label}
            </div>
            <p style={{ fontSize: '0.78rem', opacity: 0.5, margin: '0.25rem 0 0' }}>Today's score: <strong>{score}</strong>/100</p>
          </>
        ) : (
          <>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.95rem', fontWeight: 700, color: isDark ? '#e8e6ff' : '#1a1a2e' }}>No data yet</div>
            <p style={{ fontSize: '0.78rem', opacity: 0.45, margin: '0.25rem 0 0' }}>Start tracking to build your score</p>
          </>
        )}
      </div>
      {hasScore
        ? <Badge color="teal">Check-in done ✅</Badge>
        : (
          <Link to="/dashboard/user/checkin" style={{ textDecoration: 'none' }}>
            <Badge color="purple">Do today's check-in →</Badge>
          </Link>
        )
      }
    </Card>
  );
};

// ── Stress bar colour ─────────────────────────────────────────
const stressLabel  = (v) => v <= 1 ? 'Very Low' : v <= 2 ? 'Low' : v <= 3 ? 'Moderate' : v <= 4 ? 'High' : 'Very High';
const stressColor  = (v) => v <= 2 ? '#4ecdc4' : v === 3 ? '#f7c59f' : '#ff6b6b';
const stressBadge  = (v) => v <= 2 ? 'teal'    : v === 3 ? 'amber'   : 'red';

// ── Stress Card ───────────────────────────────────────────────
const StressCard = ({ isDark, checkIn }) => {
  const hasStress = checkIn && typeof checkIn.stress === 'number';
  const stress    = hasStress ? checkIn.stress : 0;
  const pct       = hasStress ? (stress / 5) * 100 : 0;
  const label     = hasStress ? stressLabel(stress) : null;
  const color     = hasStress ? stressColor(stress) : 'linear-gradient(90deg,#4ecdc4,#6c63ff)';
  const badge     = hasStress ? stressBadge(stress) : 'default';

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }} id="wellness-stress-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stress Level</div>
        <Badge color={badge}>{hasStress ? label : 'Unknown'}</Badge>
      </div>
      <div>
        <div style={{ height: 8, borderRadius: '9999px', background: 'rgba(128,128,128,0.12)', overflow: 'hidden', marginBottom: '0.5rem' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: '9999px', background: hasStress ? color : 'linear-gradient(90deg,#4ecdc4,#6c63ff)', transition: 'width 1s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', opacity: 0.45 }}>
          <span>Low</span><span>Medium</span><span>High</span>
        </div>
      </div>
      {hasStress ? (
        <p style={{ fontSize: '0.78rem', opacity: 0.6, margin: 0 }}>
          Today's stress: <strong>{stress}</strong>/5 — {label}
        </p>
      ) : (
        <p style={{ fontSize: '0.78rem', opacity: 0.45, margin: 0 }}>Stress level appears after your first check-in</p>
      )}
    </Card>
  );
};

// ── Export ────────────────────────────────────────────────────
const WellnessSnapshot = ({ isLoading, moodStats, checkInData }) => {
  const { isDark } = useTheme();
  const lastMood = moodStats?.summary?.lastMood ?? null;

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }}>
        {[0, 1, 2].map(i => (
          <Card key={i} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <SkeletonBlock height={14} width="55%" />
            <SkeletonBlock height={22} width="80%" />
            <SkeletonBlock height={60} />
            <SkeletonBlock height={14} width="45%" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }}>
      <MoodCard isDark={isDark} lastMood={lastMood} />
      <ScoreCard isDark={isDark} checkIn={checkInData} />
      <StressCard isDark={isDark} checkIn={checkInData} />
    </div>
  );
};

export default WellnessSnapshot;
