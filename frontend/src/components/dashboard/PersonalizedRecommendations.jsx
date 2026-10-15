/**
 * components/dashboard/PersonalizedRecommendations.jsx
 * Rule-based personalized recommendation cards — Part 8.
 *
 * Replaces the static RecommendedActivities section on the User Dashboard.
 * Each card shows:
 *   - Activity icon, title, category badge, duration badge
 *   - Activity description
 *   - "Why this?" reason callout — directly traceable to the data that triggered it
 *   - "Rule Engine" info pill — explicit transparency that this is NOT AI
 *
 * Props:
 *   recommendations  — array from GET /api/recommendations
 *   context          — { hasCheckInToday, checkInScore, lastMood, rulesMatched, engineType }
 *   isLoading        — bool
 */

import { Link } from 'react-router-dom';
import { SectionHeader, Badge, SkeletonBlock, EmptyState } from './ui.jsx';
import { useTheme } from '../../context/ThemeContext';

// ── Colour maps ────────────────────────────────────────────────
const CATEGORY_COLOR_MAP = {
  purple:  { bg: 'rgba(108,99,255,0.12)', border: 'rgba(108,99,255,0.25)', text: '#6c63ff' },
  teal:    { bg: 'rgba(78,205,196,0.12)',  border: 'rgba(78,205,196,0.25)',  text: '#4ecdc4' },
  red:     { bg: 'rgba(255,107,107,0.12)', border: 'rgba(255,107,107,0.25)', text: '#ff6b6b' },
  amber:   { bg: 'rgba(247,197,159,0.2)',  border: 'rgba(247,197,159,0.4)',  text: '#c4854a' },
  green:   { bg: 'rgba(168,230,207,0.2)',  border: 'rgba(168,230,207,0.4)',  text: '#3d9970' },
  default: { bg: 'rgba(128,128,128,0.1)',  border: 'rgba(128,128,128,0.2)',  text: 'inherit' },
};

// ── "Why this?" reason callout ─────────────────────────────────
const ReasonCallout = ({ reason, isDark }) => (
  <div style={{
    padding: '0.6rem 0.875rem',
    borderRadius: '10px',
    background: isDark ? 'rgba(108,99,255,0.08)' : 'rgba(108,99,255,0.05)',
    border: `1px solid ${isDark ? 'rgba(108,99,255,0.2)' : 'rgba(108,99,255,0.15)'}`,
    display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
  }}>
    <span style={{ fontSize: '0.8rem', flexShrink: 0, marginTop: '0.05rem' }}>💡</span>
    <div>
      <span style={{
        fontSize: '0.7rem', fontWeight: 700, color: '#6c63ff',
        textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.15rem',
      }}>
        Why this?
      </span>
      <p style={{ fontSize: '0.78rem', opacity: 0.75, margin: 0, lineHeight: 1.5 }}>
        {reason}
      </p>
    </div>
  </div>
);

// ── Individual recommendation card ────────────────────────────
const RecommendationCard = ({ rec, isDark, rank }) => {
  const {
    id, icon, title, category, duration, description,
    reason, color, categoryColor, path,
  } = rec;

  const catColors = CATEGORY_COLOR_MAP[categoryColor] ?? CATEGORY_COLOR_MAP.default;
  const isSoonLink = !path || path.includes('/chat') || path.includes('/journal') || path.includes('/meditate') || path.includes('/challenges');

  return (
    <div
      id={id}
      style={{
        background: isDark ? 'rgba(26,24,48,0.85)' : '#fff',
        borderRadius: '1.25rem',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.09)'}`,
        boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.28)' : '0 4px 20px rgba(108,99,255,0.07)',
        padding: '1.35rem',
        display: 'flex', flexDirection: 'column', gap: '0.875rem',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = isDark ? '0 12px 36px rgba(0,0,0,0.38)' : '0 12px 36px rgba(108,99,255,0.13)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isDark ? '0 4px 24px rgba(0,0,0,0.28)' : '0 4px 20px rgba(108,99,255,0.07)';
      }}
    >
      {/* Rank glow accent */}
      {rank === 0 && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${color}, transparent)`,
          borderRadius: '1.25rem 1.25rem 0 0',
        }} />
      )}

      {/* Top row: icon + badges */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '14px', flexShrink: 0,
          background: `${color}18`, border: `1.5px solid ${color}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
        }}>
          {icon}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span style={{
            padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 600,
            background: catColors.bg, border: `1px solid ${catColors.border}`, color: catColors.text,
            whiteSpace: 'nowrap',
          }}>
            {category}
          </span>
          <span style={{
            padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 600,
            background: 'rgba(128,128,128,0.1)', border: '1px solid rgba(128,128,128,0.2)',
            whiteSpace: 'nowrap',
          }}>
            ⏱ {duration}
          </span>
        </div>
      </div>

      {/* Title + description */}
      <div>
        <h3 style={{
          fontFamily: "'Outfit',sans-serif", fontSize: '0.98rem', fontWeight: 700,
          color: isDark ? '#e8e6ff' : '#1a1a2e', margin: '0 0 0.35rem',
        }}>
          {title}
        </h3>
        <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: 0, lineHeight: 1.55 }}>
          {description}
        </p>
      </div>

      {/* Why this? callout */}
      <ReasonCallout reason={reason} isDark={isDark} />

      {/* CTA */}
      {path === '/dashboard/user/checkin' ? (
        <Link
          to={path}
          id={`${id}-cta`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            fontSize: '0.82rem', fontWeight: 700, color,
            textDecoration: 'none', marginTop: '0.1rem',
            transition: 'gap 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.gap = '0.6rem'}
          onMouseLeave={e => e.currentTarget.style.gap = '0.35rem'}
        >
          Start now <span style={{ fontSize: '1rem' }}>→</span>
        </Link>
      ) : (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
          fontSize: '0.8rem', fontWeight: 600, color, opacity: 0.75,
        }}>
          Activity guide
          <span style={{ fontSize: '0.9rem' }}>→</span>
          <span style={{ fontSize: '0.7rem', opacity: 0.55, fontWeight: 400, marginLeft: '0.15rem' }}>
            (feature coming soon)
          </span>
        </div>
      )}
    </div>
  );
};

// ── Context summary bar ────────────────────────────────────────
const ContextBar = ({ context, isDark }) => {
  if (!context) return null;
  const { hasCheckInToday, checkInScore, lastMood, rulesMatched } = context;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap',
      padding: '0.6rem 0.875rem', borderRadius: '10px', marginBottom: '1.1rem',
      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(108,99,255,0.03)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.08)'}`,
      fontSize: '0.78rem',
    }}>
      {/* Engine badge — explicit "not AI" transparency */}
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        padding: '0.18rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700,
        background: 'rgba(78,205,196,0.12)', border: '1px solid rgba(78,205,196,0.25)', color: '#4ecdc4',
        whiteSpace: 'nowrap',
      }}>
        ⚙️ Rule-based · not AI
      </span>

      <span style={{ opacity: 0.45 }}>Based on:</span>

      <span style={{ opacity: 0.7, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {hasCheckInToday
          ? <><span style={{ color: '#4ecdc4' }}>✓</span> Today's check-in (score: {checkInScore})</>
          : <><span style={{ color: '#f7c59f' }}>○</span> No check-in today</>
        }
      </span>

      {lastMood && (
        <span style={{ opacity: 0.7 }}>
          · Mood: <strong>{lastMood.mood}</strong>
        </span>
      )}

      <span style={{ opacity: 0.45, marginLeft: 'auto' }}>
        {rulesMatched} of 12 rules matched
      </span>
    </div>
  );
};

// ── Skeleton ────────────────────────────────────────────────────
const RecommendationSkeleton = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
    {[1, 2, 3].map(i => (
      <div key={i} style={{ padding: '1.35rem', borderRadius: '1.25rem', border: '1px solid rgba(108,99,255,0.08)', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <SkeletonBlock width={48} height={48} radius={14} />
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <SkeletonBlock width={70} height={22} radius={9999} />
            <SkeletonBlock width={54} height={22} radius={9999} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <SkeletonBlock height={16} width="70%" />
          <SkeletonBlock height={12} />
          <SkeletonBlock height={12} width="80%" />
        </div>
        <div style={{ padding: '0.6rem 0.875rem', borderRadius: 10, border: '1px solid rgba(108,99,255,0.1)' }}>
          <SkeletonBlock height={10} width="30%" style={{ marginBottom: '0.3rem' }} />
          <SkeletonBlock height={12} />
          <SkeletonBlock height={12} width="85%" style={{ marginTop: '0.25rem' }} />
        </div>
      </div>
    ))}
  </div>
);

// ── Main export ─────────────────────────────────────────────────
const PersonalizedRecommendations = ({ recommendations = [], context = null, isLoading = false }) => {
  const { isDark } = useTheme();

  return (
    <section id="personalized-recommendations-section" aria-labelledby="rec-engine-title">
      <SectionHeader
        id="rec-engine-title"
        title="Recommended for You"
        subtitle="Personalised suggestions based on your check-in and mood data"
        action={
          !isLoading && recommendations.length > 0 && (
            <Badge color="teal" style={{ fontSize: '0.7rem' }}>
              ⚙️ {recommendations.length} suggestion{recommendations.length !== 1 ? 's' : ''}
            </Badge>
          )
        }
      />

      {isLoading ? (
        <>
          <SkeletonBlock height={36} radius={10} style={{ marginBottom: '1.1rem', width: '100%' }} />
          <RecommendationSkeleton />
        </>
      ) : recommendations.length === 0 ? (
        <EmptyState
          icon="🌟"
          title="No recommendations right now"
          message="Complete your daily check-in and log your mood to get personalised suggestions."
        />
      ) : (
        <>
          <ContextBar context={context} isDark={isDark} />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}>
            {recommendations.map((rec, i) => (
              <RecommendationCard key={rec.id} rec={rec} isDark={isDark} rank={i} />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default PersonalizedRecommendations;
