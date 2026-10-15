/**
 * components/checkin/WellnessTrend.jsx
 * 14-day wellness score area chart + breakdown cards for latest check-in.
 * Uses Recharts for the trend line / area chart.
 *
 * Props:
 *   trendData    — { trend, latest, averageScore, totalCheckIns }
 *   isLoading    — bool
 */

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Card, SkeletonBlock, SectionHeader, EmptyState, Badge } from '../dashboard/ui.jsx';
import { QUESTIONS, getScoreRange } from '../../constants/checkIn.js';
import { useTheme } from '../../context/ThemeContext.jsx';

// ── Day formatter ─────────────────────────────────────────────
const shortDay = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
};

// ── Custom tooltip ────────────────────────────────────────────
const CustomTooltip = ({ active, payload, isDark }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d?.wellnessScore) return (
    <div style={{ background: isDark ? '#1a1830' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.15)'}`, borderRadius: 10, padding: '0.6rem 0.875rem', fontSize: '0.8rem', opacity: 0.8 }}>
      No check-in on {shortDay(d.dateKey)}
    </div>
  );
  const range = getScoreRange(d.wellnessScore);
  return (
    <div style={{ background: isDark ? '#1a1830' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.15)'}`, borderRadius: 10, padding: '0.6rem 0.875rem', fontSize: '0.8rem', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
      <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>{shortDay(d.dateKey)}</div>
      <div style={{ color: range.color, fontWeight: 700 }}>{range.icon} {d.wellnessScore} — {range.label}</div>
      {d.sleep && (
        <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          {QUESTIONS.map(q => (
            <div key={q.key} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', opacity: 0.8 }}>
              <span>{q.icon} {q.label}</span>
              <span style={{ fontWeight: 600 }}>{d[q.key]}/5</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Breakdown card for latest check-in ───────────────────────
const LatestBreakdown = ({ latest, isDark }) => {
  if (!latest) return null;
  const range = getScoreRange(latest.wellnessScore);

  return (
    <div style={{ marginTop: '1.25rem' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
        Latest Check-in · {latest.dateKey}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.6rem' }}>
        {QUESTIONS.map(q => {
          const v = latest[q.key];
          const pct = (v / 5) * 100;
          return (
            <div key={q.key} style={{
              padding: '0.75rem', borderRadius: '10px',
              background: isDark ? 'rgba(255,255,255,0.04)' : `${q.color}08`,
              border: `1px solid ${q.color}25`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                <span style={{ fontSize: '0.85rem' }}>{q.icon}</span>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1rem', color: q.color }}>{v}</span>
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.75, marginBottom: '0.35rem' }}>{q.label}</div>
              <div style={{ height: 5, borderRadius: 9999, background: 'rgba(128,128,128,0.15)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 9999, background: q.color, transition: 'width 0.6s ease' }} />
              </div>
              {q.inverted && <div style={{ fontSize: '0.65rem', opacity: 0.45, marginTop: '0.25rem' }}>↓ lower = better</div>}
            </div>
          );
        })}
      </div>
      {latest.note && (
        <div style={{ marginTop: '0.875rem', padding: '0.75rem 1rem', borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(108,99,255,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.1)'}`, fontSize: '0.825rem', opacity: 0.8, fontStyle: 'italic' }}>
          "{latest.note}"
        </div>
      )}
    </div>
  );
};

// ── Main export ───────────────────────────────────────────────
const WellnessTrend = ({ trendData, isLoading }) => {
  const { isDark } = useTheme();
  const textColor = isDark ? 'rgba(232,230,255,0.45)' : 'rgba(26,26,46,0.4)';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.07)';

  const trend    = trendData?.trend    ?? [];
  const latest   = trendData?.latest;
  const avgScore = trendData?.averageScore;
  const total    = trendData?.totalCheckIns ?? 0;

  const chartData = trend.map(d => ({
    ...d,
    label: shortDay(d.dateKey),
  }));

  if (isLoading) {
    return (
      <Card>
        <SkeletonBlock height={14} width="40%" style={{ marginBottom: '1rem' }} />
        <SkeletonBlock height={200} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginTop: '1rem' }}>
          {[1, 2, 3].map(i => <SkeletonBlock key={i} height={80} />)}
        </div>
      </Card>
    );
  }

  if (total === 0) {
    return (
      <Card id="wellness-trend-card">
        <SectionHeader title="Wellness Trend" subtitle="Your 14-day score history" />
        <EmptyState
          icon="📈"
          title="No check-ins yet"
          message="Complete your first daily check-in to start tracking your wellness trend."
        />
      </Card>
    );
  }

  const avgRange = avgScore ? getScoreRange(avgScore) : null;

  return (
    <Card id="wellness-trend-card">
      <SectionHeader
        title="Wellness Trend"
        subtitle="14-day score history"
        action={avgScore && (
          <Badge color="teal" style={{ fontSize: '0.78rem' }}>
            {avgRange?.icon} Avg {avgScore}
          </Badge>
        )}
      />

      {/* Area chart */}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6c63ff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: textColor }} axisLine={false} tickLine={false} interval={1} />
          <YAxis domain={[20, 100]} ticks={[20, 40, 60, 80, 100]} tick={{ fontSize: 10, fill: textColor }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip isDark={isDark} />} />
          {avgScore && (
            <ReferenceLine y={avgScore} stroke="#6c63ff" strokeDasharray="4 4" strokeOpacity={0.5}
              label={{ value: `avg ${avgScore}`, fill: textColor, fontSize: 10, position: 'insideTopRight' }}
            />
          )}
          <Area
            type="monotone"
            dataKey="wellnessScore"
            stroke="#6c63ff"
            strokeWidth={2.5}
            fill="url(#scoreGradient)"
            dot={{ r: 4, fill: '#6c63ff', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Latest breakdown */}
      <LatestBreakdown latest={latest} isDark={isDark} />
    </Card>
  );
};

export default WellnessTrend;
