/**
 * pages/ChallengesPage.jsx
 * Wellness Challenges & Habit-Building System — Complete Upgrade.
 *
 * Implements:
 *   1. Challenges Dashboard: Welcome banner, streak, completion rate, points, badges,
 *      Daily Challenge, Featured Challenge, rule-based recommendations.
 *   2. Filter tabs: All, Active, Completed, Available, plus Category pills and search.
 *   3. Join and track multi-day challenges with actual backend verification.
 *   4. Daily tasks checklist, progress percentage, days remaining.
 *   5. Badge achievement unlocks without duplicate rewards.
 *   6. Seamless deep-links to MindEase modules (Mood, Journal, Check-in, Relax, Games).
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '../components/dashboard/DashboardShell';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import * as challengeService from '../services/challengeService';

const CATEGORIES = [
  'All Categories',
  'Mindfulness',
  'Stress Management',
  'Gratitude',
  'Healthy Habits',
  'Focus and Productivity',
  'Relaxation',
  'Self-Reflection',
];

export default function ChallengesPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // ── Dashboard State ────────────────────────────────────────────────
  const [stats, setStats] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [myChallenges, setMyChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState(null); // { message, type: 'success' | 'error' }

  // ── Filters & Tabs ─────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'completed' | 'available'
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [search, setSearch] = useState('');

  // ── Modals & Details State ─────────────────────────────────────────
  const [detailsModal, setDetailsModal] = useState({ open: false, challenge: null, enrollment: null });
  const [leaveConfirm, setLeaveConfirm] = useState({ open: false, enrollmentId: null, title: '' });
  const [badgesModalOpen, setBadgesModalOpen] = useState(false);

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4500);
  };

  // ── Fetchers ───────────────────────────────────────────────────────
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, catalogData, myData] = await Promise.all([
        challengeService.getDashboardStats(),
        challengeService.getCatalog({
          category: selectedCategory === 'All Categories' ? '' : selectedCategory,
          search,
        }),
        challengeService.getMyChallenges(),
      ]);

      setStats(statsData);
      setChallenges(catalogData);
      setMyChallenges(myData);
    } catch (err) {
      showAlert(err.message || 'Failed to load challenges', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ── Challenge Actions ──────────────────────────────────────────────
  const handleJoinChallenge = async (challengeId) => {
    setActionLoading(true);
    try {
      await challengeService.joinChallenge(challengeId);
      showAlert('Challenge joined! Let’s build healthy habits together 🚀');
      await loadDashboardData();
      if (detailsModal.open) {
        setDetailsModal((prev) => ({ ...prev, open: false }));
      }
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTask = async (userChallengeId, dayNumber) => {
    setActionLoading(true);
    try {
      const res = await challengeService.completeTask(userChallengeId, dayNumber);
      if (res.isCompleted) {
        showAlert(`🎉 Challenge Completed! You earned +${res.pointsAwarded} points!`, 'success');
      } else {
        showAlert(`✨ Day ${dayNumber} task completed! (+${res.pointsAwarded} points)`, 'success');
      }

      if (res.newBadges?.length > 0) {
        showAlert(`🎖️ Unlocked Achievement: "${res.newBadges[0].title}"!`, 'success');
      }

      await loadDashboardData();

      // Refresh details modal if open
      if (detailsModal.open && detailsModal.enrollment) {
        const updated = await challengeService.getMyChallenges();
        const found = updated.find((u) => u._id === userChallengeId || u.id === userChallengeId);
        setDetailsModal((prev) => ({ ...prev, enrollment: found || null }));
      }
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveChallenge = async () => {
    if (!leaveConfirm.enrollmentId) return;
    setActionLoading(true);
    try {
      await challengeService.leaveChallenge(leaveConfirm.enrollmentId);
      showAlert('You have left the challenge');
      setLeaveConfirm({ open: false, enrollmentId: null, title: '' });
      setDetailsModal({ open: false, challenge: null, enrollment: null });
      await loadDashboardData();
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Filtered Challenges Presentation ───────────────────────────────
  const displayedChallenges = useMemo(() => {
    return challenges.filter((c) => {
      const enrollment = myChallenges.find(
        (m) => (m.challenge?._id || m.challenge) === c._id
      );

      if (activeTab === 'active') {
        return enrollment && enrollment.status === 'active';
      }
      if (activeTab === 'completed') {
        return enrollment && enrollment.status === 'completed';
      }
      if (activeTab === 'available') {
        return !enrollment || (enrollment.status !== 'active' && enrollment.status !== 'completed');
      }
      return true; // 'all'
    });
  }, [challenges, myChallenges, activeTab]);

  // ── Palette & Styles ───────────────────────────────────────────────
  const surfaceBg = isDark ? 'rgba(26,24,48,0.85)' : '#ffffff';
  const surfaceBorder = isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(108,99,255,0.1)';
  const textPrimary = isDark ? '#e8e6ff' : '#1a1a2e';
  const textSecondary = isDark ? 'rgba(232,230,255,0.6)' : 'rgba(26,26,46,0.6)';
  const brandGradient = 'linear-gradient(135deg, #4ecdc4, #6c63ff)';

  const getDifficultyColor = (diff) => {
    if (diff === 'Easy') return '#10b981';
    if (diff === 'Medium') return '#f59e0b';
    return '#ff6b6b';
  };

  return (
    <DashboardShell>
      <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '3.5rem' }}>

        {/* ── Toast Alert Banner ─────────────────────────────────── */}
        {alert && (
          <div style={{
            padding: '0.8rem 1.25rem', borderRadius: '12px', marginBottom: '1.25rem',
            background: alert.type === 'error' ? 'rgba(255,107,107,0.12)' : 'rgba(16,185,129,0.12)',
            border: `1px solid ${alert.type === 'error' ? 'rgba(255,107,107,0.3)' : 'rgba(16,185,129,0.3)'}`,
            color: alert.type === 'error' ? '#ff6b6b' : '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: '0.88rem', fontWeight: 600, animation: 'fadeIn 0.2s ease',
          }}>
            <span>{alert.type === 'error' ? '⚠️' : '🏆'} {alert.message}</span>
            <button onClick={() => setAlert(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* ── Welcome Header Banner ──────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem',
          padding: '1.75rem', borderRadius: '20px',
          background: isDark
            ? 'linear-gradient(135deg, rgba(108,99,255,0.18), rgba(78,205,196,0.12))'
            : 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(78,205,196,0.1))',
          border: surfaceBorder,
          boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.25)' : '0 8px 32px rgba(108,99,255,0.06)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🏆</span>
              <h1 style={{
                fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.35rem, 3vw, 1.9rem)',
                fontWeight: 800, margin: 0,
                background: brandGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                Wellness Challenges & Habits
              </h1>
            </div>
            <p style={{ color: textSecondary, fontSize: '0.9rem', margin: 0, maxWidth: 650, lineHeight: 1.5 }}>
              Welcome back, {user?.name || 'Friend'}! Transform small mindful moments into lasting wellness habits. Complete daily tasks, track streaks, and earn achievements.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setBadgesModalOpen(true)}
              id="view-badges-btn"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.65rem 1.25rem', borderRadius: '12px', border: surfaceBorder,
                background: surfaceBg, color: textPrimary, fontSize: '0.85rem',
                fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            >
              <span>🎖️</span>
              <span>View Badges ({stats?.badges?.filter((b) => b.isUnlocked).length || 0})</span>
            </button>
          </div>
        </div>

        {/* ── Key Progress & Streak Metrics Strip ────────────────── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '1rem', marginBottom: '1.75rem',
        }}>
          {[
            {
              label: 'Current Streak',
              value: stats ? `${stats.currentStreak} Day${stats.currentStreak === 1 ? '' : 's'}` : '—',
              sub: stats?.currentStreak > 0 ? 'Verified daily activity!' : 'Complete a task today',
              icon: '🔥',
              color: '#ff6b6b',
            },
            {
              label: 'Active Challenges',
              value: stats ? stats.activeChallengesCount : '—',
              sub: 'In progress right now',
              icon: '⚡',
              color: '#4ecdc4',
            },
            {
              label: 'Completed Challenges',
              value: stats ? stats.totalCompletedChallenges : '—',
              sub: 'Full challenges finished',
              icon: '🏆',
              color: '#6c63ff',
            },
            {
              label: 'Completion Rate',
              value: stats ? `${stats.completionRate}%` : '—',
              sub: 'Based on actual history',
              icon: '📈',
              color: '#10b981',
            },
            {
              label: 'Wellness Points',
              value: stats ? stats.userPoints : '—',
              sub: 'Total points earned',
              icon: '🪙',
              color: '#f59e0b',
            },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: surfaceBg, border: surfaceBorder, borderRadius: '16px',
                padding: '1.25rem', boxShadow: isDark ? '0 4px 18px rgba(0,0,0,0.2)' : '0 4px 18px rgba(108,99,255,0.05)',
                display: 'flex', alignItems: 'center', gap: '0.85rem',
              }}
            >
              <span style={{
                width: 44, height: 44, borderRadius: '12px',
                background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem', flexShrink: 0,
              }}>{card.icon}</span>
              <div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.45rem', fontWeight: 800, color: card.color, lineHeight: 1.1 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: textPrimary, marginTop: '0.15rem' }}>
                  {card.label}
                </div>
                <div style={{ fontSize: '0.7rem', color: textSecondary }}>
                  {card.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Daily & Featured Challenges Highlight Strip ────────── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem', marginBottom: '1.75rem',
        }}>
          {/* Daily Challenge Card */}
          {stats?.dailyChallenge && (
            <div style={{
              background: surfaceBg, border: `1px solid rgba(78,205,196,0.3)`, borderRadius: '18px', padding: '1.4rem',
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(78,205,196,0.08)',
              display: 'flex', flexDirection: 'column', gap: '0.65rem', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  padding: '0.2rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800,
                  background: 'rgba(78,205,196,0.15)', color: '#4ecdc4', textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  ⭐ Daily Challenge
                </span>
                <span style={{ fontSize: '0.76rem', color: '#10b981', fontWeight: 700 }}>
                  +{stats.dailyChallenge.pointsReward} Points
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.75rem' }}>{stats.dailyChallenge.icon}</span>
                <div>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
                    {stats.dailyChallenge.title}
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: textSecondary }}>
                    {stats.dailyChallenge.category} · {stats.dailyChallenge.durationDays} Day
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.82rem', color: textSecondary, margin: '0.2rem 0', lineHeight: 1.45 }}>
                {stats.dailyChallenge.description}
              </p>

              <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                {(() => {
                  const enrollment = myChallenges.find(
                    (m) => (m.challenge?._id || m.challenge) === stats.dailyChallenge._id
                  );
                  if (enrollment && enrollment.status === 'active') {
                    return (
                      <button
                        onClick={() => setDetailsModal({ open: true, challenge: stats.dailyChallenge, enrollment })}
                        style={{
                          width: '100%', padding: '0.55rem', borderRadius: '10px', border: 'none',
                          background: brandGradient, color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        Track Today's Progress →
                      </button>
                    );
                  }
                  if (enrollment && enrollment.status === 'completed') {
                    return (
                      <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#10b981', fontWeight: 700, padding: '0.4rem' }}>
                        ✓ Completed Today!
                      </div>
                    );
                  }
                  return (
                    <button
                      onClick={() => handleJoinChallenge(stats.dailyChallenge._id)}
                      disabled={actionLoading}
                      style={{
                        width: '100%', padding: '0.55rem', borderRadius: '10px', border: 'none',
                        background: brandGradient, color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      Join Daily Challenge 🚀
                    </button>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Featured Challenge Card */}
          {stats?.featuredChallenge && (
            <div style={{
              background: surfaceBg, border: `1px solid rgba(108,99,255,0.3)`, borderRadius: '18px', padding: '1.4rem',
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(108,99,255,0.08)',
              display: 'flex', flexDirection: 'column', gap: '0.65rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  padding: '0.2rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800,
                  background: 'rgba(108,99,255,0.15)', color: '#6c63ff', textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  ✨ Featured Habit Challenge
                </span>
                <span style={{ fontSize: '0.76rem', color: '#6c63ff', fontWeight: 700 }}>
                  +{stats.featuredChallenge.pointsReward} Points
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.75rem' }}>{stats.featuredChallenge.icon}</span>
                <div>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
                    {stats.featuredChallenge.title}
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: textSecondary }}>
                    {stats.featuredChallenge.category} · {stats.featuredChallenge.durationDays} Days Habit
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.82rem', color: textSecondary, margin: '0.2rem 0', lineHeight: 1.45 }}>
                {stats.featuredChallenge.description}
              </p>

              <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                {(() => {
                  const enrollment = myChallenges.find(
                    (m) => (m.challenge?._id || m.challenge) === stats.featuredChallenge._id
                  );
                  if (enrollment && enrollment.status === 'active') {
                    return (
                      <button
                        onClick={() => setDetailsModal({ open: true, challenge: stats.featuredChallenge, enrollment })}
                        style={{
                          width: '100%', padding: '0.55rem', borderRadius: '10px', border: 'none',
                          background: '#6c63ff', color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        Track Habit Progress →
                      </button>
                    );
                  }
                  return (
                    <button
                      onClick={() => handleJoinChallenge(stats.featuredChallenge._id)}
                      disabled={actionLoading}
                      style={{
                        width: '100%', padding: '0.55rem', borderRadius: '10px', border: 'none',
                        background: '#6c63ff', color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      Start Featured Challenge 🚀
                    </button>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* ── Transparent Rule-Based Recommendations Strip ─────── */}
        {stats?.recommendations?.length > 0 && (
          <div style={{
            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(108,99,255,0.03)',
            border: surfaceBorder, borderRadius: '16px', padding: '1rem 1.25rem', marginBottom: '1.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '1rem' }}>💡</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Suggested for You (Based on today's activity)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.65rem' }}>
              {stats.recommendations.slice(0, 3).map((rec, i) => (
                <div
                  key={i}
                  style={{
                    padding: '0.65rem 0.85rem', borderRadius: '10px',
                    background: surfaceBg, border: surfaceBorder,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: textPrimary }}>{rec.title}</div>
                    <div style={{ fontSize: '0.72rem', color: textSecondary }}>{rec.reason}</div>
                  </div>
                  <button
                    onClick={() => navigate(rec.actionRoute)}
                    style={{
                      padding: '0.35rem 0.65rem', borderRadius: '8px', border: 'none',
                      background: 'rgba(78,205,196,0.15)', color: '#4ecdc4', fontSize: '0.74rem',
                      fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    Go →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Main Tab Navigation & Category Filter ──────────────── */}
        <div style={{
          background: surfaceBg, border: surfaceBorder, borderRadius: '16px',
          padding: '1.15rem', marginBottom: '1.5rem',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(108,99,255,0.05)',
          display: 'flex', flexDirection: 'column', gap: '0.85rem',
        }}>
          {/* Row 1: Status Tabs & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.35rem', background: isDark ? 'rgba(255,255,255,0.04)' : '#f4f3fa', padding: '0.25rem', borderRadius: '10px' }}>
              {[
                { id: 'all',       label: 'All Challenges', count: challenges.length },
                { id: 'active',    label: 'My Active',      count: myChallenges.filter((m) => m.status === 'active').length },
                { id: 'completed', label: 'Completed',      count: myChallenges.filter((m) => m.status === 'completed').length },
                { id: 'available', label: 'Available',      count: challenges.filter((c) => !myChallenges.some((m) => (m.challenge?._id || m.challenge) === c._id && (m.status === 'active' || m.status === 'completed'))).length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  id={`challenge-tab-${tab.id}`}
                  style={{
                    padding: '0.4rem 0.85rem', borderRadius: '8px', border: 'none',
                    background: activeTab === tab.id ? brandGradient : 'transparent',
                    color: activeTab === tab.id ? '#fff' : textSecondary,
                    fontSize: '0.8rem', fontWeight: activeTab === tab.id ? 700 : 500,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    fontSize: '0.68rem', padding: '0.05rem 0.35rem', borderRadius: '9999px',
                    background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                  }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search challenges by name or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '0.45rem 0.85rem', borderRadius: '10px',
                border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa',
                color: textPrimary, fontSize: '0.82rem', minWidth: 240,
              }}
            />
          </div>

          {/* Row 2: Category Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: textSecondary, marginRight: '0.2rem' }}>Category:</span>
            {CATEGORIES.map((cat) => {
              const isSel = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.25rem 0.65rem', borderRadius: '20px', border: 'none',
                    background: isSel ? '#6c63ff' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.05)'),
                    color: isSel ? '#fff' : textSecondary,
                    fontSize: '0.74rem', fontWeight: isSel ? 700 : 500, cursor: 'pointer',
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Challenges Grid ────────────────────────────────────── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: textSecondary }}>
            <span style={{ fontSize: '2.2rem', display: 'block', marginBottom: '0.5rem' }}>🏆</span>
            Loading wellness challenges...
          </div>
        ) : displayedChallenges.length === 0 ? (
          <div style={{
            background: surfaceBg, border: surfaceBorder, borderRadius: '20px',
            padding: '4rem 2rem', textAlign: 'center',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(108,99,255,0.05)',
          }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🌱</span>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
              No Challenges Found
            </h3>
            <p style={{ color: textSecondary, fontSize: '0.88rem', maxWidth: 440, margin: '0 auto 1.25rem' }}>
              {activeTab === 'active'
                ? 'You have no active challenges. Explore the catalog and pick your first habit!'
                : 'No challenges match your selected filters. Try choosing a different category or clearing search.'}
            </p>
            {activeTab !== 'all' && (
              <button
                onClick={() => { setActiveTab('all'); setSelectedCategory('All Categories'); setSearch(''); }}
                style={{
                  padding: '0.55rem 1.25rem', borderRadius: '10px', border: 'none',
                  background: brandGradient, color: '#fff', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Browse All Challenges
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}>
            {displayedChallenges.map((challenge) => {
              const enrollment = myChallenges.find(
                (m) => (m.challenge?._id || m.challenge) === challenge._id
              );
              const isActive = enrollment && enrollment.status === 'active';
              const isCompleted = enrollment && enrollment.status === 'completed';
              const diffColor = getDifficultyColor(challenge.difficulty);
              const progressPercent = enrollment?.progressPercent || 0;

              return (
                <div
                  key={challenge._id}
                  style={{
                    background: surfaceBg, border: surfaceBorder, borderRadius: '18px',
                    padding: '1.35rem', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(108,99,255,0.05)',
                    display: 'flex', flexDirection: 'column', gap: '0.75rem',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {/* Top Badges: Category, Duration, Difficulty, Points */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.08)',
                        color: isDark ? '#e8e6ff' : '#6c63ff',
                      }}>
                        {challenge.category}
                      </span>
                      <span style={{
                        padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                        background: `${diffColor}18`, color: diffColor, border: `1px solid ${diffColor}30`,
                      }}>
                        {challenge.difficulty}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: textSecondary }}>
                        ⏱️ {challenge.durationDays} Day{challenge.durationDays > 1 ? 's' : ''}
                      </span>
                      <span style={{
                        padding: '0.15rem 0.45rem', borderRadius: '6px',
                        background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '0.72rem', fontWeight: 800,
                      }}>
                        +{challenge.pointsReward} pts
                      </span>
                    </div>
                  </div>

                  {/* Icon & Title */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <span style={{
                      width: 42, height: 42, borderRadius: '12px',
                      background: `${challenge.color || '#6c63ff'}15`, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0,
                    }}>
                      {challenge.icon || '🏆'}
                    </span>
                    <div>
                      <h3
                        onClick={() => setDetailsModal({ open: true, challenge, enrollment })}
                        style={{
                          fontFamily: "'Outfit', sans-serif", fontSize: '1.02rem', fontWeight: 800,
                          margin: 0, color: textPrimary, cursor: 'pointer', lineHeight: 1.3,
                        }}
                      >
                        {challenge.title}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{
                    fontSize: '0.82rem', color: textSecondary, margin: 0, lineHeight: 1.45,
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {challenge.description}
                  </p>

                  {/* Active Progress Bar if enrolled */}
                  {isActive && (
                    <div style={{
                      padding: '0.75rem', borderRadius: '12px',
                      background: isDark ? 'rgba(255,255,255,0.03)' : '#fcfbfe',
                      border: surfaceBorder, display: 'flex', flexDirection: 'column', gap: '0.4rem',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                        <span style={{ fontWeight: 700, color: '#4ecdc4' }}>
                          Progress: {enrollment.completedDays?.length || 0} / {challenge.durationDays} Days
                        </span>
                        <span style={{ fontWeight: 800, color: textPrimary }}>{progressPercent}%</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 9999, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progressPercent}%`, background: brandGradient, transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  )}

                  {/* Completed Badge info */}
                  {isCompleted && (
                    <div style={{
                      padding: '0.5rem 0.75rem', borderRadius: '10px',
                      background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                      color: '#10b981', fontSize: '0.76rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem',
                    }}>
                      <span>✓ Completed!</span>
                      <span>Earned +{enrollment.pointsEarned || challenge.pointsReward} pts</span>
                    </div>
                  )}

                  {/* Action Buttons Footer */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '0.5rem', marginTop: 'auto', paddingTop: '0.65rem', borderTop: surfaceBorder,
                  }}>
                    <button
                      onClick={() => setDetailsModal({ open: true, challenge, enrollment })}
                      style={{
                        padding: '0.4rem 0.75rem', borderRadius: '8px', border: surfaceBorder,
                        background: 'transparent', color: textPrimary, fontSize: '0.76rem',
                        fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      Details & Tasks
                    </button>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {isActive ? (
                        <>
                          <button
                            onClick={() => navigate(challenge.actionRoute)}
                            style={{
                              padding: '0.4rem 0.75rem', borderRadius: '8px', border: 'none',
                              background: 'rgba(78,205,196,0.15)', color: '#4ecdc4', fontSize: '0.76rem',
                              fontWeight: 700, cursor: 'pointer',
                            }}
                          >
                            {challenge.actionLabel || 'Activity'} →
                          </button>
                          <button
                            onClick={() => setDetailsModal({ open: true, challenge, enrollment })}
                            style={{
                              padding: '0.4rem 0.85rem', borderRadius: '8px', border: 'none',
                              background: brandGradient, color: '#fff', fontSize: '0.76rem',
                              fontWeight: 700, cursor: 'pointer',
                            }}
                          >
                            Mark Complete
                          </button>
                        </>
                      ) : isCompleted ? (
                        <button
                          onClick={() => setDetailsModal({ open: true, challenge, enrollment })}
                          style={{
                            padding: '0.4rem 0.85rem', borderRadius: '8px', border: 'none',
                            background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.76rem',
                            fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          View Summary
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinChallenge(challenge._id)}
                          disabled={actionLoading}
                          style={{
                            padding: '0.45rem 1rem', borderRadius: '8px', border: 'none',
                            background: brandGradient, color: '#fff', fontSize: '0.78rem',
                            fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(78,205,196,0.25)',
                          }}
                        >
                          Join Challenge 🚀
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ═══════════════════════════════════════════════════════════
          MODAL 1: CHALLENGE DETAILS & DAILY TASKS CHECKLIST
      ═══════════════════════════════════════════════════════════ */}
      {detailsModal.open && detailsModal.challenge && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
        }}>
          <div style={{
            background: isDark ? '#1a1830' : '#ffffff', border: surfaceBorder,
            borderRadius: '20px', padding: '1.75rem', maxWidth: 640, width: '100%',
            boxShadow: '0 16px 48px rgba(0,0,0,0.45)', maxHeight: '90vh', overflowY: 'auto',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '2rem' }}>{detailsModal.challenge.icon || '🏆'}</span>
                <div>
                  <h2 style={{
                    fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', fontWeight: 800, margin: 0,
                    color: textPrimary, lineHeight: 1.25,
                  }}>
                    {detailsModal.challenge.title}
                  </h2>
                  <div style={{ fontSize: '0.76rem', color: textSecondary, marginTop: '0.15rem' }}>
                    {detailsModal.challenge.category} · {detailsModal.challenge.difficulty} · {detailsModal.challenge.durationDays} Day{detailsModal.challenge.durationDays > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDetailsModal({ open: false, challenge: null, enrollment: null })}
                style={{ background: 'transparent', border: 'none', color: textSecondary, fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Description */}
            <p style={{ fontSize: '0.88rem', color: textSecondary, lineHeight: 1.5, marginBottom: '1rem' }}>
              {detailsModal.challenge.description}
            </p>

            {/* Instructions */}
            {detailsModal.challenge.instructions?.length > 0 && (
              <div style={{
                padding: '0.85rem 1rem', borderRadius: '12px',
                background: isDark ? 'rgba(255,255,255,0.03)' : '#fcfbfe',
                border: surfaceBorder, marginBottom: '1.25rem',
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#4ecdc4', marginBottom: '0.4rem' }}>
                  📋 Step-by-Step Instructions:
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: textPrimary, lineHeight: 1.55 }}>
                  {detailsModal.challenge.instructions.map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Daily Tasks Checklist */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>
                  📅 Challenge Tasks Schedule
                </h4>
                <span style={{ fontSize: '0.74rem', color: '#f59e0b', fontWeight: 700 }}>
                  Reward: +{detailsModal.challenge.pointsReward} Points
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {detailsModal.challenge.tasks?.map((task) => {
                  const enrollment = detailsModal.enrollment;
                  const isTaskDone = enrollment?.completedDays?.includes(task.dayNumber);

                  return (
                    <div
                      key={task.dayNumber}
                      style={{
                        padding: '0.75rem 0.95rem', borderRadius: '12px',
                        background: isTaskDone
                          ? 'rgba(16,185,129,0.08)'
                          : (isDark ? 'rgba(255,255,255,0.03)' : '#fcfbfe'),
                        border: isTaskDone ? '1px solid rgba(16,185,129,0.25)' : surfaceBorder,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: isTaskDone ? '#10b981' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.78rem', fontWeight: 800,
                        }}>
                          {isTaskDone ? '✓' : task.dayNumber}
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: isTaskDone ? '#10b981' : textPrimary }}>
                            {task.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: textSecondary }}>
                            Target: {task.targetType} · +{task.points} pts
                          </div>
                        </div>
                      </div>

                      {/* Task Action */}
                      {enrollment && enrollment.status === 'active' && !isTaskDone && (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => navigate(detailsModal.challenge.actionRoute)}
                            style={{
                              padding: '0.35rem 0.65rem', borderRadius: '8px', border: 'none',
                              background: 'rgba(78,205,196,0.15)', color: '#4ecdc4', fontSize: '0.74rem',
                              fontWeight: 700, cursor: 'pointer',
                            }}
                          >
                            Open Activity
                          </button>
                          <button
                            onClick={() => handleCompleteTask(enrollment._id || enrollment.id, task.dayNumber)}
                            disabled={actionLoading}
                            style={{
                              padding: '0.35rem 0.75rem', borderRadius: '8px', border: 'none',
                              background: brandGradient, color: '#fff', fontSize: '0.74rem',
                              fontWeight: 700, cursor: 'pointer',
                            }}
                          >
                            Complete Task
                          </button>
                        </div>
                      )}

                      {isTaskDone && (
                        <span style={{ fontSize: '0.76rem', color: '#10b981', fontWeight: 700 }}>
                          ✓ Completed (+{task.points} pts)
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingTop: '1rem', borderTop: surfaceBorder,
            }}>
              <div>
                {detailsModal.enrollment?.status === 'active' && (
                  <button
                    onClick={() => setLeaveConfirm({
                      open: true,
                      enrollmentId: detailsModal.enrollment._id || detailsModal.enrollment.id,
                      title: detailsModal.challenge.title,
                    })}
                    style={{
                      padding: '0.45rem 0.85rem', borderRadius: '8px', border: 'none',
                      background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', fontSize: '0.78rem',
                      fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Leave Challenge
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  onClick={() => setDetailsModal({ open: false, challenge: null, enrollment: null })}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '10px', border: surfaceBorder,
                    background: 'transparent', color: textPrimary, fontSize: '0.84rem', cursor: 'pointer',
                  }}
                >
                  Close
                </button>

                {!detailsModal.enrollment && (
                  <button
                    onClick={() => handleJoinChallenge(detailsModal.challenge._id)}
                    disabled={actionLoading}
                    style={{
                      padding: '0.5rem 1.25rem', borderRadius: '10px', border: 'none',
                      background: brandGradient, color: '#fff', fontSize: '0.84rem',
                      fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    Join Challenge 🚀
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL 2: BADGES & ACHIEVEMENTS SHOWCASE
      ═══════════════════════════════════════════════════════════ */}
      {badgesModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
        }}>
          <div style={{
            background: isDark ? '#1a1830' : '#ffffff', border: surfaceBorder,
            borderRadius: '20px', padding: '1.75rem', maxWidth: 540, width: '100%',
            boxShadow: '0 16px 48px rgba(0,0,0,0.45)', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🎖️</span>
                <h3 style={{
                  fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', fontWeight: 800, margin: 0,
                  background: brandGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  Earned Badges & Achievements
                </h3>
              </div>
              <button
                onClick={() => setBadgesModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: textSecondary, fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: textSecondary, marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Unlock badges by maintaining consistency, completing mindfulness tasks, and building daily wellness habits.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats?.badges?.map((badge) => (
                <div
                  key={badge.badgeId}
                  style={{
                    padding: '0.85rem 1rem', borderRadius: '14px',
                    background: badge.isUnlocked
                      ? (isDark ? 'rgba(78,205,196,0.1)' : 'rgba(78,205,196,0.12)')
                      : (isDark ? 'rgba(255,255,255,0.03)' : '#fcfbfe'),
                    border: badge.isUnlocked ? '1px solid rgba(78,205,196,0.3)' : surfaceBorder,
                    opacity: badge.isUnlocked ? 1 : 0.6,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      width: 42, height: 42, borderRadius: '12px',
                      background: badge.isUnlocked ? 'linear-gradient(135deg, #4ecdc4, #6c63ff)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
                      filter: badge.isUnlocked ? 'none' : 'grayscale(1)',
                    }}>
                      {badge.icon}
                    </span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: badge.isUnlocked ? '#4ecdc4' : textPrimary }}>
                        {badge.title} {badge.isUnlocked ? '✓' : '🔒'}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: textSecondary }}>
                        {badge.description}
                      </div>
                      {badge.isUnlocked && badge.earnedAt && (
                        <div style={{ fontSize: '0.68rem', color: '#10b981', marginTop: '0.2rem' }}>
                          Unlocked on {new Date(badge.earnedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <span style={{
                    padding: '0.2rem 0.5rem', borderRadius: '6px',
                    background: badge.isUnlocked ? 'rgba(245,158,11,0.2)' : 'rgba(107,114,128,0.1)',
                    color: badge.isUnlocked ? '#f59e0b' : textSecondary,
                    fontSize: '0.72rem', fontWeight: 800,
                  }}>
                    +{badge.points} pts
                  </span>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'right', marginTop: '1.25rem' }}>
              <button
                onClick={() => setBadgesModalOpen(false)}
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: '10px', border: 'none',
                  background: brandGradient, color: '#fff', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL 3: LEAVE CHALLENGE CONFIRMATION
      ═══════════════════════════════════════════════════════════ */}
      {leaveConfirm.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem',
        }}>
          <div style={{
            background: isDark ? '#1a1830' : '#ffffff', border: surfaceBorder,
            borderRadius: '16px', padding: '1.5rem', maxWidth: 400, width: '100%',
            boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#ff6b6b' }}>
              Leave Active Challenge?
            </h3>
            <p style={{ fontSize: '0.84rem', color: textSecondary, marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Are you sure you want to stop participating in <strong>"{leaveConfirm.title}"</strong>? Your progress will be archived.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setLeaveConfirm({ open: false, enrollmentId: null, title: '' })}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '8px', border: surfaceBorder,
                  background: 'transparent', color: textPrimary, cursor: 'pointer',
                }}
              >
                Keep Challenge
              </button>
              <button
                onClick={handleLeaveChallenge}
                disabled={actionLoading}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '8px', border: 'none',
                  background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardShell>
  );
}
