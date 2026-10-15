/**
 * pages/dashboards/UserDashboard.jsx
 * Main user dashboard — Part 8 update.
 * Fetches real mood stats, today's check-in, and rule-based recommendations.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardShell from '../../components/dashboard/DashboardShell';
import WellnessSnapshot from '../../components/dashboard/WellnessSnapshot';
import QuickActions from '../../components/dashboard/QuickActions';
import RecentActivity from '../../components/dashboard/RecentActivity';
import PersonalizedRecommendations from '../../components/dashboard/PersonalizedRecommendations';
import AppointmentsPanel from '../../components/dashboard/AppointmentsPanel';
import NotificationsPanel from '../../components/dashboard/NotificationsPanel';
import * as moodService from '../../services/moodService';
import * as checkInService from '../../services/checkInService';
import * as recommendationService from '../../services/recommendationService';

const UserDashboard = () => {
  const [moodStats,     setMoodStats]     = useState(null);
  const [statsLoading,  setStatsLoading]  = useState(true);
  const [checkInData,   setCheckInData]   = useState(null);
  const [recs,          setRecs]          = useState([]);
  const [recsContext,   setRecsContext]   = useState(null);
  const [recsLoading,   setRecsLoading]   = useState(true);

  const [data,      setData]      = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch mood stats, today's check-in, and recommendations in parallel
      const [stats, todayCheckIn, recResult] = await Promise.all([
        moodService.getMoodStats().catch(() => null),
        checkInService.getTodayCheckIn().catch(() => null),
        recommendationService.getRecommendations().catch(() => null),
      ]);
      setMoodStats(stats);
      setCheckInData(todayCheckIn);
      if (recResult) {
        setRecs(recResult.recommendations ?? []);
        setRecsContext(recResult.context ?? null);
      }
      setData({ activities: [], appointments: [], notifications: [] });
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
      setStatsLoading(false);
      setRecsLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  return (
    <DashboardShell>
      {/* ── Global error banner ─────────────────────────────── */}
      {error && (
        <div id="dashboard-error-banner" style={{
          padding: '0.875rem 1.1rem', borderRadius: '0.875rem', marginBottom: '1.25rem',
          background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)',
          display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem',
        }}>
          <span>⚠️</span>
          <span>
            Couldn't load some dashboard data —{' '}
            <button onClick={loadDashboard} style={{ background: 'none', border: 'none', color: '#ff6b6b', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', fontSize: 'inherit', padding: 0 }}>
              retry
            </button>
          </span>
        </div>
      )}

      {/* ── Journey Banner ─────────────────────────────────── */}
      <div style={{
        marginBottom: '1.5rem',
        padding: '1rem 1.25rem',
        borderRadius: '1rem',
        background: 'linear-gradient(135deg, rgba(108,99,255,0.12), rgba(78,205,196,0.12))',
        border: '1px solid rgba(108,99,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.75rem' }}>🌿</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Explore Your Wellness Journey</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Track streaks, average stress, wellness score curves & holistic mindful minutes.</div>
          </div>
        </div>
        <Link
          to="/dashboard/user/journey"
          id="btn-goto-journey"
          style={{
            padding: '0.5rem 1.1rem',
            borderRadius: '0.75rem',
            background: '#6c63ff',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.825rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          View Full Analytics →
        </Link>
      </div>

      {/* ── Section 1: Wellness Snapshot ─────────────────── */}
      <section style={{ marginBottom: '1.75rem' }} aria-label="Wellness snapshot">
        <WellnessSnapshot isLoading={statsLoading} moodStats={moodStats} checkInData={checkInData} />
      </section>

      {/* ── Section 2: Quick Actions ─────────────────────────── */}
      <section style={{ marginBottom: '1.75rem' }}>
        <QuickActions />
      </section>

      {/* ── Section 3: Two-column layout ─────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
        gap: '1.25rem',
        marginBottom: '1.75rem',
        alignItems: 'start',
      }} className="dashboard-two-col">
        <RecentActivity isLoading={isLoading} activities={data?.activities ?? []} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <AppointmentsPanel isLoading={isLoading} appointments={data?.appointments ?? []} />
          <NotificationsPanel />
        </div>
      </div>

      {/* ── Section 4: Personalized Recommendations ────────── */}
      <section style={{ marginBottom: '1.75rem' }}>
        <PersonalizedRecommendations
          recommendations={recs}
          context={recsContext}
          isLoading={recsLoading}
        />
      </section>

      <style>{`
        @media (max-width: 900px) { .dashboard-two-col { grid-template-columns: 1fr !important; } }
        @media (max-width: 768px) { main { padding: 1rem !important; } }
      `}</style>
    </DashboardShell>
  );
};

export default UserDashboard;
