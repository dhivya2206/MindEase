/**
 * pages/JournalPage.jsx
 * Personal Wellness Journal — Complete Upgrade.
 *
 * Provides:
 *   1. Journal Dashboard with actual date-based streak calculation, weekly count,
 *      total entries, and interactive calendar day activity grid.
 *   2. Comprehensive Journal Editor: Title, rich Content, Mood & 1–10 Intensity,
 *      Tags (College, Placement, Family, Personal Growth, Gratitude, Stress, Other),
 *      Optional Gratitude section, and Optional Highlight of the Day.
 *   3. Search & Filter: Search title/content, filter by mood, tag, date range,
 *      and sort newest/oldest.
 *   4. Full Entry Reader modal, Edit workflow, and Delete confirmation modal.
 *   5. Seamless dark purple & cyan-to-purple gradient MindEase design system.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardShell from '../components/dashboard/DashboardShell';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MOOD_META, MOOD_ORDER, getMoodMeta } from '../constants/moods';
import * as journalService from '../services/journalService';

const AVAILABLE_TAGS = [
  'College',
  'Placement',
  'Family',
  'Personal Growth',
  'Gratitude',
  'Stress',
  'Other',
];

export default function JournalPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  // ── Dashboard & List State ─────────────────────────────────────────
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [alert, setAlert] = useState(null); // { message, type: 'success' | 'error' }

  // ── Filters, Search & Pagination ───────────────────────────────────
  const [search, setSearch] = useState('');
  const [selectedMood, setSelectedMood] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(null);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest'
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, pages: 1 });

  // ── View & Modals State ───────────────────────────────────────────
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [viewingEntry, setViewingEntry] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, title: '' });
  const [saving, setSaving] = useState(false);

  // ── Editor Form State ──────────────────────────────────────────────
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood: 'calm',
    intensity: 5,
    tags: [],
    gratitude: '',
    highlightOfTheDay: '',
  });

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  // ── Fetch Dashboard Stats ──────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await journalService.getJournalStats();
      setStats(data);
    } catch {
      // Fallback gracefully
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // ── Fetch Entries ──────────────────────────────────────────────────
  const fetchEntries = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      let start = '';
      let end = '';

      if (calendarSelectedDate) {
        start = calendarSelectedDate;
        end = calendarSelectedDate;
      } else if (dateFilter === 'today') {
        start = new Date().toISOString().split('T')[0];
        end = start;
      } else if (dateFilter === 'week') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        start = d.toISOString().split('T')[0];
      } else if (dateFilter === 'month') {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        start = d.toISOString().split('T')[0];
      } else if (dateFilter === 'custom') {
        start = customStartDate;
        end = customEndDate;
      }

      const res = await journalService.getEntries({
        page,
        limit: pagination.limit,
        search,
        mood: selectedMood === 'all' ? '' : selectedMood,
        tag: selectedTag === 'all' ? '' : selectedTag,
        startDate: start,
        endDate: end,
        sort: sortBy,
      });

      setEntries(res?.entries || []);
      if (res?.pagination) setPagination(res.pagination);
    } catch (err) {
      showAlert(err.message || 'Failed to fetch journal entries', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, search, selectedMood, selectedTag, dateFilter, customStartDate, customEndDate, calendarSelectedDate, sortBy]);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchEntries(1);
  }, [fetchStats, fetchEntries]);

  // ── Editor Handlers ────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingEntryId(null);
    setFormData({
      title: '',
      content: '',
      mood: 'calm',
      intensity: 5,
      tags: [],
      gratitude: '',
      highlightOfTheDay: '',
    });
    setEditorOpen(true);
  };

  const handleOpenEdit = (entry) => {
    setEditingEntryId(entry._id || entry.id);
    setFormData({
      title: entry.title || '',
      content: entry.content || '',
      mood: entry.mood || 'calm',
      intensity: entry.intensity ?? 5,
      tags: entry.tags || [],
      gratitude: entry.gratitude || '',
      highlightOfTheDay: entry.highlightOfTheDay || '',
    });
    setViewingEntry(null);
    setEditorOpen(true);
  };

  const handleToggleTag = (tag) => {
    setFormData((prev) => {
      const exists = prev.tags.includes(tag);
      return {
        ...prev,
        tags: exists ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
      };
    });
  };

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showAlert('Title is required', 'error');
      return;
    }
    if (!formData.content.trim()) {
      showAlert('Journal content is required', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingEntryId) {
        await journalService.updateEntry(editingEntryId, formData);
        showAlert('Journal reflection updated! ✨');
      } else {
        await journalService.createEntry(formData);
        showAlert('Reflection safely preserved in your journal! 🌿');
      }

      setEditorOpen(false);
      setEditingEntryId(null);
      fetchStats();
      fetchEntries(1);
    } catch (err) {
      showAlert(err.message || 'Could not save journal entry', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!deleteConfirm.id) return;
    try {
      await journalService.deleteEntry(deleteConfirm.id);
      showAlert('Journal entry deleted');
      setDeleteConfirm({ open: false, id: null, title: '' });
      if (viewingEntry && (viewingEntry._id === deleteConfirm.id || viewingEntry.id === deleteConfirm.id)) {
        setViewingEntry(null);
      }
      fetchStats();
      fetchEntries(pagination.page);
    } catch (err) {
      showAlert(err.message || 'Could not delete entry', 'error');
    }
  };

  // ── Interactive Calendar Days (Current Month Grid) ────────────────
  const calendarDays = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding before 1st of month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: '', dateStr: null, hasEntry: false, isCurrentMonth: false });
    }
    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      const hasEntry = stats?.calendarDates?.includes(dateStr);
      const isToday = today.toISOString().split('T')[0] === dateStr;
      days.push({
        dayNumber: d,
        dateStr,
        hasEntry,
        isToday,
        isCurrentMonth: true,
        count: stats?.dateEntriesCount?.[dateStr] || 0,
      });
    }
    return days;
  }, [stats]);

  // ── Style Palettes ────────────────────────────────────────────────
  const bg = isDark ? 'linear-gradient(135deg, #0f0e1a, #1a1830)' : 'linear-gradient(135deg, #f8f7ff, #fff5f2)';
  const surfaceBg = isDark ? 'rgba(26,24,48,0.85)' : '#ffffff';
  const surfaceBorder = isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(108,99,255,0.1)';
  const textPrimary = isDark ? '#e8e6ff' : '#1a1a2e';
  const textSecondary = isDark ? 'rgba(232,230,255,0.6)' : 'rgba(26,26,46,0.6)';
  const brandGradient = 'linear-gradient(135deg, #4ecdc4, #6c63ff)';

  const getIntensityLabel = (val) => {
    if (val <= 2) return 'Very Mild';
    if (val <= 4) return 'Mild';
    if (val <= 6) return 'Moderate';
    if (val <= 8) return 'Strong';
    return 'Deep / Intense';
  };

  return (
    <DashboardShell>
      <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '3rem' }}>

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
            <span>{alert.type === 'error' ? '⚠️' : '🌸'} {alert.message}</span>
            <button onClick={() => setAlert(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* ── Welcome Header & Action Banner ─────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem',
          padding: '1.75rem', borderRadius: '20px',
          background: isDark
            ? 'linear-gradient(135deg, rgba(78,205,196,0.12), rgba(108,99,255,0.18))'
            : 'linear-gradient(135deg, rgba(78,205,196,0.08), rgba(108,99,255,0.12))',
          border: surfaceBorder,
          boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.25)' : '0 8px 32px rgba(108,99,255,0.06)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1.4rem' }}>📝</span>
              <h1 style={{
                fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.3rem, 3vw, 1.85rem)',
                fontWeight: 800, margin: 0,
                background: brandGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                Personal Wellness Journal
              </h1>
            </div>
            <p style={{ color: textSecondary, fontSize: '0.9rem', margin: 0, maxWidth: 620, lineHeight: 1.5 }}>
              Hello, {user?.name || 'Friend'}! Your safe, private space to process feelings, celebrate highlights, and build mindful reflection habits.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            id="journal-new-entry-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.4rem', borderRadius: '14px', border: 'none',
              background: brandGradient, color: '#fff', fontSize: '0.92rem',
              fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease',
              boxShadow: '0 6px 20px rgba(78,205,196,0.3)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span>✨</span>
            <span>New Journal Entry</span>
          </button>
        </div>

        {/* ── Key Metrics & Stats Strip ──────────────────────────── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem', marginBottom: '1.75rem',
        }}>
          {[
            {
              label: 'Total Entries',
              value: stats ? stats.totalEntries : '—',
              sub: 'Reflections written',
              icon: '📖',
              color: '#6c63ff',
            },
            {
              label: 'Written This Week',
              value: stats ? stats.entriesThisWeek : '—',
              sub: 'Recent momentum',
              icon: '📅',
              color: '#4ecdc4',
            },
            {
              label: 'Current Streak',
              value: stats ? `${stats.currentStreak} Day${stats.currentStreak === 1 ? '' : 's'}` : '—',
              sub: stats?.currentStreak > 0 ? 'Consecutive days writing!' : 'Write today to build streak',
              icon: '🔥',
              color: '#ff6b6b',
            },
            {
              label: 'Active Days',
              value: stats?.calendarDates ? stats.calendarDates.length : '—',
              sub: 'Days recorded overall',
              icon: '🗓️',
              color: '#a8e6cf',
            },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: surfaceBg, border: surfaceBorder, borderRadius: '16px',
                padding: '1.25rem', boxShadow: isDark ? '0 4px 18px rgba(0,0,0,0.2)' : '0 4px 18px rgba(108,99,255,0.05)',
                display: 'flex', alignItems: 'center', gap: '1rem',
              }}
            >
              <span style={{
                width: 46, height: 46, borderRadius: '12px',
                background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', flexShrink: 0,
              }}>{card.icon}</span>
              <div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 800, color: card.color, lineHeight: 1.1 }}>
                  {loadingStats ? '—' : card.value}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: textPrimary, marginTop: '0.15rem' }}>
                  {card.label}
                </div>
                <div style={{ fontSize: '0.72rem', color: textSecondary }}>
                  {card.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Two Column: Calendar View & Quick Highlights ──────── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem', marginBottom: '1.75rem',
        }}>
          {/* Interactive Calendar View */}
          <div style={{
            background: surfaceBg, border: surfaceBorder, borderRadius: '18px', padding: '1.35rem',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(108,99,255,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>🗓️</span>
                <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                  {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
              </div>
              {calendarSelectedDate && (
                <button
                  onClick={() => setCalendarSelectedDate(null)}
                  style={{
                    padding: '0.2rem 0.6rem', borderRadius: '6px', border: surfaceBorder,
                    background: 'transparent', color: textSecondary, fontSize: '0.74rem', cursor: 'pointer',
                  }}
                >
                  Clear Date Filter ({calendarSelectedDate}) ✕
                </button>
              )}
            </div>

            <p style={{ fontSize: '0.78rem', color: textSecondary, margin: '0 0 0.85rem' }}>
              Green-glowing dots indicate days you wrote a journal entry. Click any day to view that date.
            </p>

            {/* Weekday headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '0.72rem', color: textSecondary, fontWeight: 700, marginBottom: '0.4rem' }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <div key={idx}>{day}</div>
              ))}
            </div>

            {/* Day grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.3rem' }}>
              {calendarDays.map((d, idx) => {
                const isSelected = calendarSelectedDate === d.dateStr;
                return (
                  <button
                    key={idx}
                    disabled={!d.isCurrentMonth}
                    onClick={() => {
                      if (d.hasEntry) {
                        setCalendarSelectedDate(isSelected ? null : d.dateStr);
                      }
                    }}
                    style={{
                      height: 32, borderRadius: '8px', border: 'none',
                      background: isSelected
                        ? brandGradient
                        : d.hasEntry
                          ? 'rgba(78,205,196,0.18)'
                          : d.isToday
                            ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.08)')
                            : 'transparent',
                      color: isSelected
                        ? '#fff'
                        : d.hasEntry
                          ? '#4ecdc4'
                          : d.isCurrentMonth
                            ? textPrimary
                            : 'transparent',
                      fontWeight: d.hasEntry || d.isToday ? 800 : 500,
                      fontSize: '0.76rem',
                      cursor: d.hasEntry ? 'pointer' : 'default',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      position: 'relative',
                      boxShadow: d.hasEntry && !isSelected ? '0 0 8px rgba(78,205,196,0.25)' : 'none',
                    }}
                    title={d.hasEntry ? `${d.dateStr} (${d.count} entry)` : d.dateStr}
                  >
                    <span>{d.dayNumber}</span>
                    {d.hasEntry && (
                      <span style={{
                        width: 4, height: 4, borderRadius: '50%',
                        background: isSelected ? '#fff' : '#4ecdc4',
                        position: 'absolute', bottom: 2,
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Inspiring Highlights / Recent Entries */}
          <div style={{
            background: surfaceBg, border: surfaceBorder, borderRadius: '18px', padding: '1.35rem',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(108,99,255,0.05)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>✨</span>
                <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Recent Reflections</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#6c63ff', fontWeight: 700 }}>Personal Archive</span>
            </div>

            {stats?.recentEntries?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
                {stats.recentEntries.map((re) => {
                  const meta = getMoodMeta(re.mood);
                  return (
                    <div
                      key={re._id || re.id}
                      onClick={() => setViewingEntry(re)}
                      style={{
                        padding: '0.65rem 0.85rem', borderRadius: '10px',
                        background: isDark ? 'rgba(255,255,255,0.03)' : '#fcfbfe',
                        border: surfaceBorder, cursor: 'pointer', transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(3px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                        <span style={{ fontSize: '1.15rem' }}>{meta.emoji}</span>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: textPrimary, textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {re.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: textSecondary }}>
                            {new Date(re.entryDate || re.createdAt).toLocaleDateString()} · {re.tags?.slice(0, 2).map((t) => `#${t}`).join(' ')}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#4ecdc4', fontWeight: 600 }}>Read →</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '1.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌿</span>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: textPrimary }}>Your page is ready</div>
                <div style={{ fontSize: '0.76rem', color: textSecondary, marginTop: '0.2rem' }}>
                  Write your first reflection to start your wellness journey today.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Search & Filter Controls ───────────────────────────── */}
        <div style={{
          background: surfaceBg, border: surfaceBorder, borderRadius: '16px',
          padding: '1.15rem', marginBottom: '1.5rem',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(108,99,255,0.05)',
          display: 'flex', flexDirection: 'column', gap: '0.85rem',
        }}>
          {/* Row 1: Search, Date Filter, Sort, New Entry */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search reflections, gratitude, or thoughts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchEntries(1)}
                style={{
                  width: '100%', padding: '0.55rem 0.85rem', borderRadius: '10px',
                  border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa',
                  color: textPrimary, fontSize: '0.84rem',
                }}
              />
            </div>

            {/* Date filter dropdown */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem', borderRadius: '10px',
                border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa',
                color: textPrimary, fontSize: '0.84rem',
              }}
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
              <option value="custom">Custom Date Range</option>
            </select>

            {/* Custom Date Range if selected */}
            {dateFilter === 'custom' && (
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  style={{
                    padding: '0.45rem', borderRadius: '8px', border: surfaceBorder,
                    background: isDark ? 'rgba(255,255,255,0.04)' : '#fff', color: textPrimary, fontSize: '0.78rem',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: textSecondary }}>to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  style={{
                    padding: '0.45rem', borderRadius: '8px', border: surfaceBorder,
                    background: isDark ? 'rgba(255,255,255,0.04)' : '#fff', color: textPrimary, fontSize: '0.78rem',
                  }}
                />
              </div>
            )}

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem', borderRadius: '10px',
                border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa',
                color: textPrimary, fontSize: '0.84rem',
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>

            <button
              onClick={() => fetchEntries(1)}
              style={{
                padding: '0.55rem 1rem', borderRadius: '10px', border: 'none',
                background: brandGradient, color: '#fff', fontWeight: 700, fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Filter
            </button>
          </div>

          {/* Row 2: Mood Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: textSecondary, marginRight: '0.2rem' }}>Mood:</span>
            <button
              onClick={() => setSelectedMood('all')}
              style={{
                padding: '0.25rem 0.65rem', borderRadius: '20px', border: 'none',
                background: selectedMood === 'all' ? brandGradient : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.06)'),
                color: selectedMood === 'all' ? '#fff' : textSecondary,
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              All Moods
            </button>
            {MOOD_ORDER.map((mKey) => {
              const meta = MOOD_META[mKey];
              const isSel = selectedMood === mKey;
              return (
                <button
                  key={mKey}
                  onClick={() => setSelectedMood(isSel ? 'all' : mKey)}
                  style={{
                    padding: '0.25rem 0.65rem', borderRadius: '20px',
                    border: isSel ? `1px solid ${meta.color}` : 'none',
                    background: isSel ? `${meta.color}25` : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.05)'),
                    color: isSel ? meta.color : textSecondary,
                    fontSize: '0.75rem', fontWeight: isSel ? 700 : 500, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                  }}
                >
                  <span>{meta.emoji}</span>
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>

          {/* Row 3: Tag Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: textSecondary, marginRight: '0.2rem' }}>Tag:</span>
            <button
              onClick={() => setSelectedTag('all')}
              style={{
                padding: '0.2rem 0.6rem', borderRadius: '6px', border: 'none',
                background: selectedTag === 'all' ? '#6c63ff' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.06)'),
                color: selectedTag === 'all' ? '#fff' : textSecondary,
                fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              #All
            </button>
            {AVAILABLE_TAGS.map((tag) => {
              const isSel = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(isSel ? 'all' : tag)}
                  style={{
                    padding: '0.2rem 0.6rem', borderRadius: '6px',
                    border: isSel ? '1px solid #4ecdc4' : 'none',
                    background: isSel ? 'rgba(78,205,196,0.18)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.05)'),
                    color: isSel ? '#4ecdc4' : textSecondary,
                    fontSize: '0.74rem', fontWeight: isSel ? 700 : 500, cursor: 'pointer',
                  }}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Entries Grid ───────────────────────────────────────── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: textSecondary }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📖</span>
            Loading journal reflections...
          </div>
        ) : entries.length === 0 ? (
          <div style={{
            background: surfaceBg, border: surfaceBorder, borderRadius: '20px',
            padding: '4rem 2rem', textAlign: 'center',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(108,99,255,0.05)',
          }}>
            <span style={{ fontSize: '3.2rem', display: 'block', marginBottom: '1rem' }}>🌿</span>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
              Your Sanctuary is Ready
            </h3>
            <p style={{ color: textSecondary, fontSize: '0.9rem', maxWidth: 460, margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
              No journal reflections match your current filters. Take a deep breath and pen down what's on your mind.
            </p>
            <button
              onClick={handleOpenCreate}
              style={{
                padding: '0.75rem 1.6rem', borderRadius: '12px', border: 'none',
                background: brandGradient, color: '#fff', fontSize: '0.9rem', fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 6px 20px rgba(78,205,196,0.3)',
              }}
            >
              + Write New Reflection
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem', marginBottom: '1.75rem',
          }}>
            {entries.map((entry) => {
              const meta = getMoodMeta(entry.mood);
              const dateFormatted = new Date(entry.entryDate || entry.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              });

              return (
                <div
                  key={entry._id || entry.id}
                  style={{
                    background: surfaceBg, border: surfaceBorder, borderRadius: '18px',
                    padding: '1.35rem', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(108,99,255,0.05)',
                    display: 'flex', flexDirection: 'column', gap: '0.75rem',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {/* Card Header: Mood badge, Intensity & Date */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{
                        padding: '0.25rem 0.65rem', borderRadius: '9999px',
                        background: `${meta.color}20`, border: `1px solid ${meta.color}35`,
                        color: meta.color, fontSize: '0.75rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                      }}>
                        <span>{meta.emoji}</span>
                        <span>{meta.label}</span>
                      </span>

                      <span style={{
                        padding: '0.2rem 0.5rem', borderRadius: '6px',
                        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        fontSize: '0.72rem', color: textSecondary, fontWeight: 600,
                      }}>
                        {entry.intensity ?? 5}/10
                      </span>
                    </div>

                    <span style={{ fontSize: '0.74rem', color: textSecondary }}>
                      {dateFormatted}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => setViewingEntry(entry)}
                    style={{
                      fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', fontWeight: 800,
                      margin: 0, color: textPrimary, cursor: 'pointer', lineHeight: 1.3,
                    }}
                  >
                    {entry.title}
                  </h3>

                  {/* Content snippet */}
                  <p
                    onClick={() => setViewingEntry(entry)}
                    style={{
                      fontSize: '0.84rem', color: textSecondary, margin: 0, lineHeight: 1.5,
                      display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden', cursor: 'pointer',
                    }}
                  >
                    {entry.content}
                  </p>

                  {/* Gratitude & Highlight Snippets if available */}
                  {entry.gratitude && (
                    <div style={{
                      padding: '0.5rem 0.75rem', borderRadius: '10px',
                      background: isDark ? 'rgba(168,230,207,0.08)' : 'rgba(168,230,207,0.15)',
                      border: '1px solid rgba(168,230,207,0.25)', fontSize: '0.78rem',
                      color: isDark ? '#a8e6cf' : '#1e6b52',
                    }}>
                      🌸 <strong>Grateful for:</strong> {entry.gratitude}
                    </div>
                  )}

                  {entry.highlightOfTheDay && (
                    <div style={{
                      padding: '0.5rem 0.75rem', borderRadius: '10px',
                      background: isDark ? 'rgba(247,197,159,0.08)' : 'rgba(247,197,159,0.15)',
                      border: '1px solid rgba(247,197,159,0.25)', fontSize: '0.78rem',
                      color: isDark ? '#f7c59f' : '#8c4b18',
                    }}>
                      ✨ <strong>Highlight:</strong> {entry.highlightOfTheDay}
                    </div>
                  )}

                  {/* Tags */}
                  {entry.tags?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: 'auto' }}>
                      {entry.tags.map((t, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '6px',
                            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.08)',
                            color: isDark ? 'rgba(232,230,255,0.7)' : '#6c63ff', fontWeight: 600,
                          }}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Card Actions Footer */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingTop: '0.65rem', borderTop: surfaceBorder, marginTop: '0.35rem',
                  }}>
                    <button
                      onClick={() => setViewingEntry(entry)}
                      style={{
                        padding: '0.35rem 0.75rem', borderRadius: '8px', border: 'none',
                        background: 'transparent', color: '#4ecdc4', fontSize: '0.78rem',
                        fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      Read Entry →
                    </button>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => handleOpenEdit(entry)}
                        title="Edit reflection"
                        style={{
                          padding: '0.35rem 0.65rem', borderRadius: '8px', border: surfaceBorder,
                          background: 'transparent', color: textPrimary, fontSize: '0.76rem',
                          cursor: 'pointer',
                        }}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        onClick={() => setDeleteConfirm({ open: true, id: entry._id || entry.id, title: entry.title })}
                        title="Delete reflection"
                        style={{
                          padding: '0.35rem 0.65rem', borderRadius: '8px', border: 'none',
                          background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', fontSize: '0.76rem',
                          cursor: 'pointer',
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────────────── */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.6rem', marginTop: '1.5rem' }}>
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchEntries(pagination.page - 1)}
              style={{
                padding: '0.45rem 0.95rem', borderRadius: '10px', border: surfaceBorder,
                background: surfaceBg, color: textPrimary, fontSize: '0.82rem',
                cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                opacity: pagination.page <= 1 ? 0.4 : 1,
              }}
            >
              ← Previous
            </button>
            <span style={{ fontSize: '0.84rem', color: textSecondary }}>
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => fetchEntries(pagination.page + 1)}
              style={{
                padding: '0.45rem 0.95rem', borderRadius: '10px', border: surfaceBorder,
                background: surfaceBg, color: textPrimary, fontSize: '0.82rem',
                cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer',
                opacity: pagination.page >= pagination.pages ? 0.4 : 1,
              }}
            >
              Next →
            </button>
          </div>
        )}

      </div>

      {/* ═══════════════════════════════════════════════════════════
          MODAL 1: CREATE / EDIT JOURNAL ENTRY
      ═══════════════════════════════════════════════════════════ */}
      {editorOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
        }}>
          <div style={{
            background: isDark ? '#1a1830' : '#ffffff', border: surfaceBorder,
            borderRadius: '20px', padding: '1.75rem', maxWidth: 660, width: '100%',
            boxShadow: '0 16px 48px rgba(0,0,0,0.45)', maxHeight: '92vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.3rem' }}>{editingEntryId ? '✏️' : '🌿'}</span>
                <h2 style={{
                  fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', fontWeight: 800, margin: 0,
                  background: brandGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  {editingEntryId ? 'Edit Journal Reflection' : 'New Journal Reflection'}
                </h2>
              </div>
              <button
                onClick={() => setEditorOpen(false)}
                style={{ background: 'transparent', border: 'none', color: textSecondary, fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEntry} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Title input */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Title *</label>
                  <span style={{ fontSize: '0.72rem', color: formData.title.length > 140 ? '#ff6b6b' : textSecondary }}>
                    {formData.title.length}/150
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Give your thoughts a meaningful title..."
                  value={formData.title}
                  maxLength={150}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  style={{
                    width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px',
                    border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa',
                    color: textPrimary, fontSize: '0.9rem', fontWeight: 600,
                  }}
                />
              </div>

              {/* Mood Selection */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.45rem' }}>
                  How are you feeling right now?
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '0.4rem' }}>
                  {MOOD_ORDER.map((mKey) => {
                    const meta = MOOD_META[mKey];
                    const isSelected = formData.mood === mKey;
                    return (
                      <button
                        type="button"
                        key={mKey}
                        onClick={() => setFormData((p) => ({ ...p, mood: mKey }))}
                        style={{
                          padding: '0.5rem 0.25rem', borderRadius: '10px',
                          border: isSelected ? `2px solid ${meta.color}` : surfaceBorder,
                          background: isSelected ? `${meta.color}25` : (isDark ? 'rgba(255,255,255,0.03)' : '#fcfbfe'),
                          cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ fontSize: '1.25rem' }}>{meta.emoji}</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: isSelected ? 800 : 500, color: isSelected ? meta.color : textSecondary }}>
                          {meta.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Intensity Slider (1–10) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    Emotional Intensity: <strong style={{ color: '#4ecdc4' }}>{formData.intensity}/10</strong>
                  </label>
                  <span style={{ fontSize: '0.74rem', color: '#6c63ff', fontWeight: 700 }}>
                    {getIntensityLabel(formData.intensity)}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.intensity}
                  onChange={(e) => setFormData((p) => ({ ...p, intensity: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: '#4ecdc4', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: textSecondary, marginTop: '0.15rem' }}>
                  <span>1 (Gentle)</span>
                  <span>5 (Moderate)</span>
                  <span>10 (Overwhelming / Peak)</span>
                </div>
              </div>

              {/* Tags Selection */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                  Life Categories / Tags
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {AVAILABLE_TAGS.map((tag) => {
                    const isChecked = formData.tags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => handleToggleTag(tag)}
                        style={{
                          padding: '0.3rem 0.65rem', borderRadius: '8px',
                          border: isChecked ? '1px solid #6c63ff' : surfaceBorder,
                          background: isChecked ? 'rgba(108,99,255,0.2)' : (isDark ? 'rgba(255,255,255,0.04)' : '#fafafa'),
                          color: isChecked ? '#6c63ff' : textSecondary,
                          fontSize: '0.76rem', fontWeight: isChecked ? 700 : 500, cursor: 'pointer',
                        }}
                      >
                        {isChecked ? '✓ ' : '+ '}#{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Content */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Your Thoughts & Reflection *</label>
                  <span style={{ fontSize: '0.72rem', color: textSecondary }}>
                    {formData.content.length} chars
                  </span>
                </div>
                <textarea
                  rows={6}
                  required
                  placeholder="What's on your mind? Be honest, compassionate, and unfiltered with yourself..."
                  value={formData.content}
                  onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: '12px',
                    border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa',
                    color: textPrimary, fontSize: '0.88rem', lineHeight: 1.5, resize: 'vertical',
                  }}
                />
              </div>

              {/* Optional Gratitude */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                  🌸 Gratitude Moment (Optional)
                </label>
                <input
                  type="text"
                  maxLength={1000}
                  placeholder="What is one thing, big or small, you are grateful for today?"
                  value={formData.gratitude}
                  onChange={(e) => setFormData((p) => ({ ...p, gratitude: e.target.value }))}
                  style={{
                    width: '100%', padding: '0.55rem 0.85rem', borderRadius: '10px',
                    border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa',
                    color: textPrimary, fontSize: '0.84rem',
                  }}
                />
              </div>

              {/* Optional Highlight of the Day */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                  ✨ Highlight of the Day (Optional)
                </label>
                <input
                  type="text"
                  maxLength={1000}
                  placeholder="The best moment, insight, or achievement from today..."
                  value={formData.highlightOfTheDay}
                  onChange={(e) => setFormData((p) => ({ ...p, highlightOfTheDay: e.target.value }))}
                  style={{
                    width: '100%', padding: '0.55rem 0.85rem', borderRadius: '10px',
                    border: surfaceBorder, background: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa',
                    color: textPrimary, fontSize: '0.84rem',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  style={{
                    padding: '0.6rem 1.2rem', borderRadius: '10px', border: surfaceBorder,
                    background: 'transparent', color: textPrimary, fontSize: '0.85rem', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '0.6rem 1.5rem', borderRadius: '10px', border: 'none',
                    background: brandGradient, color: '#fff', fontSize: '0.85rem', fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                    boxShadow: '0 4px 15px rgba(78,205,196,0.3)',
                  }}
                >
                  {saving ? 'Preserving...' : (editingEntryId ? 'Update Reflection' : 'Save Entry')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL 2: VIEW FULL JOURNAL ENTRY
      ═══════════════════════════════════════════════════════════ */}
      {viewingEntry && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
        }}>
          <div style={{
            background: isDark ? '#1a1830' : '#ffffff', border: surfaceBorder,
            borderRadius: '20px', padding: '1.85rem', maxWidth: 640, width: '100%',
            boxShadow: '0 16px 48px rgba(0,0,0,0.45)', maxHeight: '90vh', overflowY: 'auto',
          }}>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(() => {
                  const meta = getMoodMeta(viewingEntry.mood);
                  return (
                    <span style={{
                      padding: '0.25rem 0.7rem', borderRadius: '9999px',
                      background: `${meta.color}20`, border: `1px solid ${meta.color}40`,
                      color: meta.color, fontSize: '0.8rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                    }}>
                      <span>{meta.emoji}</span>
                      <span>{meta.label} · {viewingEntry.intensity ?? 5}/10</span>
                    </span>
                  );
                })()}

                <span style={{ fontSize: '0.78rem', color: textSecondary }}>
                  {new Date(viewingEntry.entryDate || viewingEntry.createdAt).toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
              </div>

              <button
                onClick={() => setViewingEntry(null)}
                style={{ background: 'transparent', border: 'none', color: textSecondary, fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Title */}
            <h2 style={{
              fontFamily: "'Outfit', sans-serif", fontSize: '1.45rem', fontWeight: 800,
              color: textPrimary, margin: '0 0 1rem', lineHeight: 1.3,
            }}>
              {viewingEntry.title}
            </h2>

            {/* Full Content */}
            <div style={{
              fontSize: '0.92rem', color: textPrimary, lineHeight: 1.7,
              whiteSpace: 'pre-wrap', marginBottom: '1.5rem',
            }}>
              {viewingEntry.content}
            </div>

            {/* Gratitude & Highlight Cards if present */}
            {viewingEntry.gratitude && (
              <div style={{
                padding: '0.75rem 1rem', borderRadius: '12px',
                background: isDark ? 'rgba(168,230,207,0.08)' : 'rgba(168,230,207,0.15)',
                border: '1px solid rgba(168,230,207,0.25)', marginBottom: '0.75rem',
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#4ecdc4', marginBottom: '0.2rem' }}>
                  🌸 Gratitude Moment
                </div>
                <div style={{ fontSize: '0.88rem', color: textPrimary }}>
                  {viewingEntry.gratitude}
                </div>
              </div>
            )}

            {viewingEntry.highlightOfTheDay && (
              <div style={{
                padding: '0.75rem 1rem', borderRadius: '12px',
                background: isDark ? 'rgba(247,197,159,0.08)' : 'rgba(247,197,159,0.15)',
                border: '1px solid rgba(247,197,159,0.25)', marginBottom: '1rem',
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#f7c59f', marginBottom: '0.2rem' }}>
                  ✨ Highlight of the Day
                </div>
                <div style={{ fontSize: '0.88rem', color: textPrimary }}>
                  {viewingEntry.highlightOfTheDay}
                </div>
              </div>
            )}

            {/* Tags */}
            {viewingEntry.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                {viewingEntry.tags.map((t, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.74rem', padding: '0.2rem 0.6rem', borderRadius: '6px',
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.08)',
                      color: isDark ? 'rgba(232,230,255,0.8)' : '#6c63ff', fontWeight: 600,
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Footer Buttons */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingTop: '1rem', borderTop: surfaceBorder,
            }}>
              <button
                onClick={() => setViewingEntry(null)}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '8px', border: surfaceBorder,
                  background: 'transparent', color: textPrimary, fontSize: '0.84rem', cursor: 'pointer',
                }}
              >
                Close
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleOpenEdit(viewingEntry)}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '8px', border: surfaceBorder,
                    background: 'transparent', color: textPrimary, fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm({ open: true, id: viewingEntry._id || viewingEntry.id, title: viewingEntry.title })}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '8px', border: 'none',
                    background: 'rgba(255,107,107,0.12)', color: '#ff6b6b', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL 3: DELETE CONFIRMATION
      ═══════════════════════════════════════════════════════════ */}
      {deleteConfirm.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem',
        }}>
          <div style={{
            background: isDark ? '#1a1830' : '#ffffff', border: surfaceBorder,
            borderRadius: '16px', padding: '1.5rem', maxWidth: 420, width: '100%',
            boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#ff6b6b' }}>
              🗑️ Delete Journal Entry?
            </h3>
            <p style={{ fontSize: '0.84rem', color: textSecondary, marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>? This reflection will be permanently removed.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm({ open: false, id: null, title: '' })}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '8px', border: surfaceBorder,
                  background: 'transparent', color: textPrimary, cursor: 'pointer',
                }}
              >
                Keep Entry
              </button>
              <button
                onClick={handleDeleteEntry}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '8px', border: 'none',
                  background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardShell>
  );
}
