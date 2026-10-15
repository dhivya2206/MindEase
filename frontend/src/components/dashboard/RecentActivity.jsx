/**
 * components/dashboard/RecentActivity.jsx
 * Shows a chronological list of the user's recent wellness actions.
 *
 * Data source: none yet (Part 6+). Shows an honest empty state.
 * Includes a skeleton loading state for future async data fetching.
 */

import { Card, SectionHeader, EmptyState, SkeletonBlock, PillButton } from './ui.jsx';
import { useTheme } from '../../context/ThemeContext';

// ── Activity item ─────────────────────────────────────────────
export const ActivityItem = ({ icon, iconBg, title, subtitle, timestamp, badge, isDark }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '0.9rem',
    padding: '0.75rem 0',
    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.06)'}`,
  }}>
    {/* Icon bubble */}
    <div style={{
      width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
      background: iconBg || 'rgba(108,99,255,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.1rem',
    }}>{icon}</div>

    {/* Text */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: isDark ? '#e8e6ff' : '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
      {subtitle && <div style={{ fontSize: '0.78rem', opacity: 0.55, marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>}
    </div>

    {/* Right side */}
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
      {badge}
      {timestamp && <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>{timestamp}</span>}
    </div>
  </div>
);

// ── Skeleton list ─────────────────────────────────────────────
const ActivitySkeleton = () => (
  <>
    {[1, 2, 3].map(i => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '0.75rem 0' }}>
        <SkeletonBlock width={38} height={38} radius={10} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <SkeletonBlock width="65%" height={14} />
          <SkeletonBlock width="45%" height={11} />
        </div>
        <SkeletonBlock width={50} height={22} radius={12} />
      </div>
    ))}
  </>
);

// ── Main component ────────────────────────────────────────────
const RecentActivity = ({ isLoading, activities = [] }) => {
  const { isDark } = useTheme();

  return (
    <Card id="recent-activity-card">
      <SectionHeader
        title="Recent Activity"
        subtitle="Your latest wellness actions"
        action={
          activities.length > 0 && (
            <PillButton id="view-all-activity-btn" variant="ghost" style={{ fontSize: '0.78rem', padding: '0.3rem 0.8rem' }}>
              View all
            </PillButton>
          )
        }
      />

      {isLoading ? (
        <ActivitySkeleton />
      ) : activities.length === 0 ? (
        <EmptyState
          icon="🌱"
          title="No activity yet"
          message="Your wellness journey starts with one step. Log your first mood check-in or try a meditation session."
        />
      ) : (
        activities.map((a, i) => <ActivityItem key={i} {...a} isDark={isDark} />)
      )}
    </Card>
  );
};

export default RecentActivity;
