/**
 * components/mood/MoodCharts.jsx
 * Three Recharts-powered dashboard charts:
 *   1. Weekly Bar Chart    — last 7 days, entry count per day, mood colour stacks
 *   2. Mood Frequency Pie  — last 30 days distribution of each mood type
 *   3. Intensity Trend     — 14-day average intensity line chart
 *
 * All charts handle: isLoading (skeleton), no-data (empty state), error state.
 */

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
  LineChart, Line, CartesianGrid, ReferenceLine,
} from 'recharts';
import { Card, SectionHeader, SkeletonBlock, EmptyState } from '../dashboard/ui.jsx';
import { getMoodMeta, MOOD_ORDER, MOOD_META } from '../../constants/moods.js';
import { useTheme } from '../../context/ThemeContext.jsx';

// ── Shared skeleton ───────────────────────────────────────────
const ChartSkeleton = ({ height = 220 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <SkeletonBlock height={height} radius={12} />
  </div>
);

// ── Shared tooltip style ──────────────────────────────────────
const customTooltipStyle = (isDark) => ({
  backgroundColor: isDark ? '#1a1830' : '#fff',
  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.15)'}`,
  borderRadius: 10,
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  padding: '0.6rem 0.875rem',
  fontSize: '0.8rem',
});

// ── Day label formatter ───────────────────────────────────────
const shortDay = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short' });
};

// ── 1. Weekly Bar Chart ───────────────────────────────────────
const WeeklyBarChart = ({ data, isDark, isLoading }) => {
  const textColor = isDark ? 'rgba(232,230,255,0.5)' : 'rgba(26,26,46,0.45)';

  // Transform: each day → { date, count, label, topMood }
  const chartData = data.map(d => ({
    date: d.date,
    label: shortDay(d.date),
    count: d.count,
    topMood: d.moods.length ? d.moods.sort((a, b) => d.moods.filter(m => m === b).length - d.moods.filter(m => m === a).length)[0] : null,
  }));

  const CustomBar = (props) => {
    const { x, y, width, height, payload } = props;
    if (!payload.topMood) return null;
    const color = getMoodMeta(payload.topMood).color;
    return <rect x={x} y={y} width={width} height={height} rx={6} fill={`${color}cc`} />;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={customTooltipStyle(isDark)}>
        <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{d.label}</div>
        <div>{d.count} {d.count === 1 ? 'entry' : 'entries'}</div>
        {d.topMood && <div style={{ color: getMoodMeta(d.topMood).color, marginTop: '0.2rem' }}>
          {getMoodMeta(d.topMood).emoji} Mostly {getMoodMeta(d.topMood).label}
        </div>}
      </div>
    );
  };

  if (isLoading) return <ChartSkeleton height={200} />;
  if (chartData.every(d => d.count === 0)) {
    return <EmptyState icon="📊" title="No data this week" message="Log moods daily to see your weekly pattern here." />;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(108,99,255,0.05)', radius: 6 }} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} shape={<CustomBar />}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.topMood ? `${getMoodMeta(entry.topMood).color}cc` : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.1)')} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

// ── 2. Frequency Pie Chart ────────────────────────────────────
const FrequencyPie = ({ data, isDark, isLoading }) => {
  const pieData = data.map(d => ({
    name: getMoodMeta(d.mood).label,
    emoji: getMoodMeta(d.mood).emoji,
    value: d.count,
    color: getMoodMeta(d.mood).color,
  }));

  const renderCustomLabel = ({ emoji, percent }) =>
    percent > 0.05 ? `${emoji} ${(percent * 100).toFixed(0)}%` : '';

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={customTooltipStyle(isDark)}>
        <span style={{ color: d.color, fontWeight: 700 }}>{d.emoji} {d.name}</span>
        <div>{d.value} {d.value === 1 ? 'entry' : 'entries'}</div>
      </div>
    );
  };

  if (isLoading) return <ChartSkeleton height={220} />;
  if (!pieData.length) {
    return <EmptyState icon="🥧" title="No frequency data" message="Log at least one mood to see your 30-day distribution." />;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%" cy="50%"
          outerRadius={80}
          innerRadius={40}
          paddingAngle={3}
          label={renderCustomLabel}
          labelLine={false}
        >
          {pieData.map((entry, i) => (
            <Cell key={i} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value, entry) => (
            <span style={{ fontSize: '0.75rem', color: entry.color }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// ── 3. Intensity Trend Line ───────────────────────────────────
const TrendLine = ({ data, isDark, isLoading }) => {
  const textColor = isDark ? 'rgba(232,230,255,0.5)' : 'rgba(26,26,46,0.45)';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.08)';

  const chartData = data.map(d => ({
    label: shortDay(d.date),
    intensity: d.avgIntensity,
    count: d.count,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div style={customTooltipStyle(isDark)}>
        <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{label}</div>
        {d.intensity !== null
          ? <div>Avg intensity: <strong>{d.intensity}</strong>/5 ({d.count} logs)</div>
          : <div style={{ opacity: 0.6 }}>No data</div>}
      </div>
    );
  };

  if (isLoading) return <ChartSkeleton height={200} />;
  if (chartData.every(d => d.intensity === null)) {
    return <EmptyState icon="📈" title="No trend yet" message="Log moods over a few days to see your intensity trend here." />;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
        <YAxis domain={[1, 5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={3} stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.15)'} strokeDasharray="4 4" label={{ value: 'Moderate', fill: textColor, fontSize: 10, position: 'insideTopRight' }} />
        <Line
          type="monotone" dataKey="intensity"
          stroke="#6c63ff" strokeWidth={2.5}
          dot={{ r: 4, fill: '#6c63ff', strokeWidth: 0 }}
          activeDot={{ r: 6 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// ── Export: combined charts panel ─────────────────────────────
const MoodCharts = ({ stats, isLoading }) => {
  const { isDark } = useTheme();
  const weekly    = stats?.weekly    ?? [];
  const frequency = stats?.frequency ?? [];
  const trend     = stats?.trend     ?? [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }} id="mood-charts-section">
      {/* Weekly */}
      <Card id="mood-weekly-chart-card">
        <SectionHeader title="This Week" subtitle="Mood entries by day" style={{ marginBottom: '0.75rem' }} />
        <WeeklyBarChart data={weekly} isDark={isDark} isLoading={isLoading} />
      </Card>

      {/* Frequency */}
      <Card id="mood-frequency-chart-card">
        <SectionHeader title="Mood Distribution" subtitle="Last 30 days" style={{ marginBottom: '0.75rem' }} />
        <FrequencyPie data={frequency} isDark={isDark} isLoading={isLoading} />
      </Card>

      {/* Trend */}
      <Card id="mood-trend-chart-card">
        <SectionHeader title="Intensity Trend" subtitle="14-day average intensity" style={{ marginBottom: '0.75rem' }} />
        <TrendLine data={trend} isDark={isDark} isLoading={isLoading} />
      </Card>
    </div>
  );
};

export default MoodCharts;
