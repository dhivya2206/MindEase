/**
 * pages/MoodPage.jsx
 * Full mood tracking page — Part 11 update: FacialEmotionAnalyzer added.
 *
 * Layout:
 *   ┌──────────────────────────────────────────┐
 *   │  MoodCharts (3 charts — full width)      │
 *   ├─────────────────────┬────────────────────┤
 *   │  MoodLogger (left)  │  MoodHistory (right)│
 *   └─────────────────────┴────────────────────┘
 */

import { useState, useEffect, useCallback } from 'react';
import DashboardShell from '../components/dashboard/DashboardShell.jsx';
import MoodLogger from '../components/mood/MoodLogger.jsx';
import MoodHistory from '../components/mood/MoodHistory.jsx';
import MoodCharts from '../components/mood/MoodCharts.jsx';
import TextEmotionAnalyzer from '../components/mood/TextEmotionAnalyzer.jsx';
import FacialEmotionAnalyzer from '../components/mood/FacialEmotionAnalyzer.jsx';
import { Card, SectionHeader } from '../components/dashboard/ui.jsx';
import * as moodService from '../services/moodService.js';

const MoodPage = () => {
  // ── History state ─────────────────────────────────────────
  const [entries,    setEntries]    = useState([]);
  const [meta,       setMeta]       = useState(null);
  const [page,       setPage]       = useState(1);
  const [filterMood, setFilterMood] = useState(null);
  const [histLoading, setHistLoading] = useState(true);
  const [histError,   setHistError]   = useState('');

  // ── Stats state ───────────────────────────────────────────
  const [stats,       setStats]       = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Edit state ────────────────────────────────────────────
  const [editEntry, setEditEntry] = useState(null);

  // ── Fetch history ─────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setHistLoading(true);
    setHistError('');
    try {
      const result = await moodService.getMoods({ page, mood: filterMood || undefined, limit: 10 });
      setEntries(result.entries);
      setMeta(result.meta);
    } catch (err) {
      setHistError(err.message || 'Failed to load mood history');
    } finally {
      setHistLoading(false);
    }
  }, [page, filterMood]);

  // ── Fetch stats ───────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await moodService.getMoodStats();
      setStats(s);
    } catch {
      // Charts degrade gracefully — no blocking error
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);
  useEffect(() => { fetchStats();   }, [fetchStats]);

  // Reset to page 1 when filter changes
  useEffect(() => { setPage(1); }, [filterMood]);

  // ── CRUD callbacks ────────────────────────────────────────
  const handleSave = (savedEntry) => {
    setEditEntry(null);
    fetchHistory();
    fetchStats();
  };

  const handleDelete = async (id) => {
    await moodService.deleteMood(id);
    fetchHistory();
    fetchStats();
  };

  return (
    <DashboardShell>
      {/* ── Charts row ─────────────────────────────────────── */}
      <section style={{ marginBottom: '1.75rem' }}>
        <MoodCharts stats={stats} isLoading={statsLoading} />
      </section>

      {/* ── Summary bar ────────────────────────────────────── */}
      {stats?.summary?.lastMood && (
        <div style={{ padding: '0.875rem 1.25rem', borderRadius: '1rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(108,99,255,0.1), rgba(78,205,196,0.08))', border: '1px solid rgba(108,99,255,0.15)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.4rem' }}>💡</span>
          <span style={{ fontSize: '0.875rem', opacity: 0.85 }}>
            Your last logged mood: <strong style={{ color: '#6c63ff' }}>{stats.summary.lastMood.mood}</strong> with intensity {stats.summary.lastMood.intensity}/5.
            You have <strong>{stats.summary.totalEntries}</strong> total {stats.summary.totalEntries === 1 ? 'entry' : 'entries'}.
          </span>
        </div>
      )}

      {/* ── Text Emotion Analyzer ───────────────────────────── */}
      <section style={{ marginBottom: '1.75rem' }}>
        <Card id="text-emotion-analyzer-card">
          <TextEmotionAnalyzer
            onMoodSaved={() => { fetchHistory(); fetchStats(); }}
          />
        </Card>
      </section>

      {/* ── Facial Emotion Analyzer ──────────────────────────── */}
      <section style={{ marginBottom: '1.75rem' }}>
        <Card id="facial-emotion-analyzer-card">
          <FacialEmotionAnalyzer
            onMoodSaved={() => { fetchHistory(); fetchStats(); }}
          />
        </Card>
      </section>

      {/* ── Log + History ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.25rem', alignItems: 'start' }}
        className="mood-main-grid"
      >
        {/* Logger / Editor panel */}
        <Card id="mood-logger-panel">
          <SectionHeader
            title={editEntry ? 'Edit Mood Entry' : 'Log Mood'}
            subtitle={editEntry ? 'Update your logged mood' : 'How are you feeling right now?'}
          />
          <MoodLogger
            onSave={handleSave}
            editEntry={editEntry}
            onCancel={() => setEditEntry(null)}
          />
        </Card>

        {/* History */}
        <div>
          {histError && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.875rem', marginBottom: '1rem', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)', fontSize: '0.875rem', color: '#ff6b6b' }}>
              ⚠️ {histError} — <button onClick={fetchHistory} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 'inherit' }}>retry</button>
            </div>
          )}
          <MoodHistory
            entries={entries}
            isLoading={histLoading}
            meta={meta}
            onPageChange={setPage}
            onEdit={(entry) => { setEditEntry(entry); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onDelete={handleDelete}
            filterMood={filterMood}
            onFilterChange={setFilterMood}
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .mood-main-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </DashboardShell>
  );
};

export default MoodPage;
