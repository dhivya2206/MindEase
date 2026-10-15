/**
 * components/dashboard/AppointmentsPanel.jsx
 * Upcoming appointment placeholder.
 *
 * No real appointment data exists yet (Part 7+).
 * Shows an honest empty state with a "Book a session" CTA.
 */

import { Card, SectionHeader, EmptyState, SkeletonBlock, Badge, PillButton } from './ui.jsx';
import { useTheme } from '../../context/ThemeContext';

// ── Appointment item (for future use) ─────────────────────────
export const AppointmentItem = ({ counsellorName, counsellorInitials, dateStr, timeStr, type, status, isDark }) => {
  const statusColor = { scheduled: 'teal', pending: 'amber', completed: 'green', cancelled: 'red' };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.9rem',
      padding: '1rem', borderRadius: '0.875rem',
      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(108,99,255,0.03)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.08)'}`,
    }}>
      {/* Avatar */}
      <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'linear-gradient(135deg,#4ecdc4,#6c63ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
        {counsellorInitials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: isDark ? '#e8e6ff' : '#1a1a2e' }}>{counsellorName}</div>
        <div style={{ fontSize: '0.78rem', opacity: 0.55, marginTop: '0.1rem' }}>{dateStr} · {timeStr} · {type}</div>
      </div>
      <Badge color={statusColor[status] ?? 'default'}>{status}</Badge>
    </div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────
const ApptSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
    {[1, 2].map(i => (
      <div key={i} style={{ display: 'flex', gap: '0.9rem', alignItems: 'center' }}>
        <SkeletonBlock width={42} height={42} radius={12} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <SkeletonBlock width="60%" height={14} />
          <SkeletonBlock width="80%" height={11} />
        </div>
        <SkeletonBlock width={70} height={22} radius={12} />
      </div>
    ))}
  </div>
);

// ── Main ──────────────────────────────────────────────────────
const AppointmentsPanel = ({ isLoading, appointments = [] }) => {
  const { isDark } = useTheme();

  return (
    <Card id="appointments-panel-card">
      <SectionHeader
        title="Upcoming Appointments"
        subtitle="Your scheduled sessions with counsellors"
        action={
          <PillButton id="book-session-btn" variant="primary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.9rem' }}>
            + Book
          </PillButton>
        }
      />

      {isLoading ? (
        <ApptSkeleton />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No upcoming sessions"
          message="Connect with a licensed counsellor for personalised guidance and support."
          action={
            <PillButton id="book-session-empty-btn" variant="primary">
              Book a Free Intro Session
            </PillButton>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {appointments.map((a, i) => <AppointmentItem key={i} {...a} isDark={isDark} />)}
        </div>
      )}
    </Card>
  );
};

export default AppointmentsPanel;
