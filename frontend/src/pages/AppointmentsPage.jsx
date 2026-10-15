/**
 * pages/AppointmentsPage.jsx
 * Full user appointment booking and management hub — Part 16.
 *
 * Capabilities:
 * - Browse licensed counsellors by specialization & name
 * - View full counsellor profiles & schedules
 * - Select date, time slot, duration, and notes
 * - Book appointment with backend double-booking validation
 * - View active appointments and historical completed/cancelled appointments
 * - Cancel pending/confirmed appointments
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardShell from '../components/dashboard/DashboardShell';
import { Card, SectionHeader } from '../components/dashboard/ui.jsx';
import { useTheme } from '../context/ThemeContext';
import * as appointmentService from '../services/appointmentService';

const STATUS_CONFIG = {
  pending: {
    bg: 'rgba(247, 197, 159, 0.15)',
    color: '#f7c59f',
    border: 'rgba(247, 197, 159, 0.3)',
    label: 'PENDING',
    icon: '⏳',
    desc: 'Waiting for counsellor acceptance',
  },
  confirmed: {
    bg: 'rgba(78, 205, 196, 0.15)',
    color: '#4ecdc4',
    border: 'rgba(78, 205, 196, 0.3)',
    label: 'CONFIRMED',
    icon: '✅',
    desc: 'Session scheduled & confirmed',
  },
  accepted: {
    bg: 'rgba(78, 205, 196, 0.15)',
    color: '#4ecdc4',
    border: 'rgba(78, 205, 196, 0.3)',
    label: 'CONFIRMED',
    icon: '✅',
    desc: 'Session scheduled & confirmed',
  },
  completed: {
    bg: 'rgba(108, 99, 255, 0.15)',
    color: '#6c63ff',
    border: 'rgba(108, 99, 255, 0.3)',
    label: 'COMPLETED',
    icon: '🎉',
    desc: 'Session concluded',
  },
  cancelled: {
    bg: 'rgba(255, 107, 107, 0.15)',
    color: '#ff6b6b',
    border: 'rgba(255, 107, 107, 0.3)',
    label: 'CANCELLED',
    icon: '🚫',
    desc: 'Appointment cancelled',
  },
  rejected: {
    bg: 'rgba(255, 107, 107, 0.15)',
    color: '#ff6b6b',
    border: 'rgba(255, 107, 107, 0.3)',
    label: 'DECLINED',
    icon: '✖️',
    desc: 'Counsellor declined request',
  },
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AppointmentsPage = () => {
  const { isDark } = useTheme();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'my-appointments');
  // 'my-appointments' | 'browse'

  // Data states
  const [counsellors, setCounsellors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Status & loading
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Booking Modal State
  const [bookingCounsellor, setBookingCounsellor] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    date: '',
    time: '10:00',
    duration: 60,
    notes: '',
  });
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  // Cancellation Modal State
  const [cancellingAppt, setCancellingAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Sub-filter for My Appointments
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'upcoming' | 'history'

  const textPrimary = isDark ? '#e8e6ff' : '#1a1a2e';
  const textSecondary = isDark ? 'rgba(232,230,255,0.6)' : 'rgba(26,26,46,0.6)';
  const cardBg = isDark ? 'rgba(26,24,48,0.85)' : '#fff';
  const cardBorder = isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(108,99,255,0.1)';

  // ── Load Data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [cList, aList] = await Promise.all([
        appointmentService.browseCounsellors(),
        appointmentService.getMyAppointments(),
      ]);
      setCounsellors(cList);
      setAppointments(aList);
    } catch (err) {
      setError(err.message || 'Failed to load appointment records');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  // ── Booking Flow ───────────────────────────────────────────────────────────
  const openBookingModal = (counsellor) => {
    // Default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    // Default time based on counsellor availability if exists
    let defaultTime = '10:00';
    if (counsellor.availability && counsellor.availability.length > 0) {
      defaultTime = counsellor.availability[0].startTime || '10:00';
    }

    setBookingCounsellor(counsellor);
    setBookingForm({
      date: dateStr,
      time: defaultTime,
      duration: 60,
      notes: '',
    });
    setBookingError(null);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingCounsellor || !bookingForm.date || !bookingForm.time) {
      setBookingError('Please choose both date and time slot.');
      return;
    }

    setIsSubmittingBooking(true);
    setBookingError(null);
    try {
      // Combine date and time
      const scheduledDateTime = new Date(`${bookingForm.date}T${bookingForm.time}:00`);

      if (isNaN(scheduledDateTime.getTime()) || scheduledDateTime <= new Date()) {
        throw new Error('Please select a future date and time slot.');
      }

      await appointmentService.bookAppointment({
        counsellorId: bookingCounsellor.id,
        scheduledAt: scheduledDateTime.toISOString(),
        duration: Number(bookingForm.duration) || 60,
        notes: bookingForm.notes,
      });

      setBookingCounsellor(null);
      showSuccess(`🎉 Session booked with ${bookingCounsellor.user?.name || 'Counsellor'}! Status: PENDING.`);
      setActiveTab('my-appointments');
      await loadData();
    } catch (err) {
      setBookingError(err.message || 'Failed to book appointment.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // ── Cancellation Flow ──────────────────────────────────────────────────────
  const handleCancelSubmit = async () => {
    if (!cancellingAppt) return;
    setIsSubmittingCancel(true);
    try {
      await appointmentService.cancelAppointment(cancellingAppt.id, cancelReason);
      setCancellingAppt(null);
      setCancelReason('');
      showSuccess('Appointment cancelled successfully.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to cancel appointment');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // Filter counsellors by search / specialization
  const filteredCounsellors = counsellors.filter((c) => {
    const matchesSpec = !selectedSpecialization || c.specialization === selectedSpecialization;
    const nameStr = (c.user?.name || '').toLowerCase();
    const matchesSearch = !searchQuery || nameStr.includes(searchQuery.toLowerCase()) || (c.specialization || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpec && matchesSearch;
  });

  const specializations = [...new Set(counsellors.map((c) => c.specialization).filter(Boolean))];

  // Filter appointments for user view
  const filteredAppointments = appointments.filter((appt) => {
    if (historyFilter === 'upcoming') {
      return ['pending', 'confirmed', 'accepted'].includes(appt.status);
    }
    if (historyFilter === 'history') {
      return ['completed', 'cancelled', 'rejected'].includes(appt.status);
    }
    return true;
  });

  // Tomorrow's date string for min date picker attribute
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return (
    <DashboardShell>
      <div style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: '2.5rem' }}>

        {/* Header Bar */}
        <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '1.8rem' }}>📅</span>
              <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.4rem, 3vw, 1.85rem)', fontWeight: 800, color: textPrimary, margin: 0 }}>
                Counselling & Appointments
              </h1>
            </div>
            <p style={{ color: textSecondary, fontSize: '0.88rem', margin: 0 }}>
              Connect with certified psychologists & therapists. Schedule 1-on-1 confidential wellness sessions.
            </p>
          </div>

          {/* Quick Tab Switcher */}
          <div style={{ display: 'flex', gap: '0.4rem', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.08)', padding: '0.3rem', borderRadius: '9999px', border: cardBorder }}>
            <button
              id="tab-my-appointments"
              onClick={() => setActiveTab('my-appointments')}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '9999px',
                border: 'none',
                background: activeTab === 'my-appointments' ? 'linear-gradient(135deg, #4ecdc4, #6c63ff)' : 'transparent',
                color: activeTab === 'my-appointments' ? '#fff' : textSecondary,
                fontWeight: activeTab === 'my-appointments' ? 700 : 500,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              📋 My Appointments ({appointments.length})
            </button>
            <button
              id="tab-browse-counsellors"
              onClick={() => setActiveTab('browse')}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '9999px',
                border: 'none',
                background: activeTab === 'browse' ? 'linear-gradient(135deg, #4ecdc4, #6c63ff)' : 'transparent',
                color: activeTab === 'browse' ? '#fff' : textSecondary,
                fontWeight: activeTab === 'browse' ? 700 : 500,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              🔍 Browse Counsellors ({counsellors.length})
            </button>
          </div>
        </div>

        {/* Global Feedback Banners */}
        {error && (
          <div style={{ padding: '0.9rem 1.25rem', borderRadius: '0.85rem', background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            ⚠️ {error}
          </div>
        )}
        {successMsg && (
          <div style={{ padding: '0.9rem 1.25rem', borderRadius: '0.85rem', background: 'rgba(78,205,196,0.15)', border: '1px solid rgba(78,205,196,0.35)', color: '#4ecdc4', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {successMsg}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB 1: MY APPOINTMENTS & HISTORY
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'my-appointments' && (
          <div>
            {/* Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[
                  { key: 'all', label: 'All Records' },
                  { key: 'upcoming', label: 'Upcoming / Active' },
                  { key: 'history', label: 'History & Concluded' },
                ].map((f) => (
                  <button
                    key={f.key}
                    id={`filter-${f.key}`}
                    onClick={() => setHistoryFilter(f.key)}
                    style={{
                      padding: '0.45rem 1rem',
                      borderRadius: '9999px',
                      border: historyFilter === f.key ? '1px solid #4ecdc4' : cardBorder,
                      background: historyFilter === f.key ? 'rgba(78,205,196,0.15)' : (isDark ? 'rgba(255,255,255,0.03)' : '#fff'),
                      color: historyFilter === f.key ? '#4ecdc4' : textSecondary,
                      fontSize: '0.82rem',
                      fontWeight: historyFilter === f.key ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                id="book-new-session-cta"
                onClick={() => setActiveTab('browse')}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '9999px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4ecdc4, #6c63ff)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(78,205,196,0.3)',
                }}
              >
                + Book New Session
              </button>
            </div>

            {/* List View */}
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', animation: 'spin 1s linear infinite' }}>⚙️</div>
                <p style={{ color: textSecondary }}>Loading your appointments…</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div style={{ padding: '3.5rem 2rem', borderRadius: '1.25rem', background: cardBg, border: cardBorder, textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📭</div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: textPrimary, margin: '0 0 0.4rem 0' }}>
                  No appointments found
                </h3>
                <p style={{ color: textSecondary, fontSize: '0.875rem', maxWidth: 440, margin: '0 auto 1.5rem auto' }}>
                  {historyFilter === 'upcoming'
                    ? 'You do not have any pending or confirmed sessions scheduled.'
                    : 'You haven\'t scheduled sessions yet. Browse our certified wellness counsellors to book.'}
                </p>
                <button
                  onClick={() => setActiveTab('browse')}
                  style={{ padding: '0.6rem 1.6rem', borderRadius: '9999px', border: 'none', background: 'linear-gradient(135deg, #4ecdc4, #6c63ff)', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}
                >
                  Explore Certified Counsellors
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {filteredAppointments.map((appt) => {
                  const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
                  const cName = appt.counsellor?.name || 'Licensed Counsellor';
                  const cPhoto = appt.counsellorProfile?.profileImage;
                  const cSpec = appt.counsellorProfile?.specialization || 'Clinical Counsellor';
                  const canCancel = ['pending', 'confirmed', 'accepted'].includes(appt.status);

                  return (
                    <div
                      key={appt.id}
                      id={`user-appt-card-${appt.id}`}
                      style={{
                        padding: '1.35rem 1.5rem',
                        borderRadius: '1.15rem',
                        background: cardBg,
                        border: cardBorder,
                        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(108,99,255,0.04)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {/* Counsellor Profile Preview */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                          {cPhoto ? (
                            <img src={cPhoto} alt={cName} style={{ width: 48, height: 48, borderRadius: '12px', objectFit: 'cover', border: '1px solid #4ecdc4' }} />
                          ) : (
                            <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'linear-gradient(135deg, #4ecdc4, #6c63ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.2rem', flexShrink: 0 }}>
                              {cName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.05rem', fontWeight: 700, color: textPrimary }}>
                              {cName}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#4ecdc4', fontWeight: 600 }}>
                              {cSpec}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem', borderRadius: '9999px', background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontSize: '0.78rem', fontWeight: 800 }}>
                          <span>{cfg.icon}</span>
                          <span>{cfg.label}</span>
                        </div>
                      </div>

                      {/* Time & Session Details */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', padding: '0.9rem 1rem', borderRadius: '0.85rem', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(108,99,255,0.03)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ color: textSecondary, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.15rem' }}>Date</span>
                          <span style={{ fontWeight: 600, color: textPrimary }}>🗓️ {formatDate(appt.scheduledAt)}</span>
                        </div>
                        <div>
                          <span style={{ color: textSecondary, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.15rem' }}>Time & Duration</span>
                          <span style={{ fontWeight: 600, color: textPrimary }}>⏰ {formatTime(appt.scheduledAt)} ({appt.duration || 60} mins)</span>
                        </div>
                        {appt.notes && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <span style={{ color: textSecondary, display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.15rem' }}>Your Notes</span>
                            <span style={{ color: textPrimary, fontStyle: 'italic' }}>"{appt.notes}"</span>
                          </div>
                        )}
                        {appt.reason && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <span style={{ color: '#ff6b6b', display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.15rem' }}>Cancellation Reason</span>
                            <span style={{ color: textPrimary }}>{appt.reason}</span>
                          </div>
                        )}
                      </div>

                      {/* Cancel Action */}
                      {canCancel && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            id={`user-cancel-btn-${appt.id}`}
                            onClick={() => setCancellingAppt(appt)}
                            style={{
                              padding: '0.45rem 1.1rem',
                              borderRadius: '9999px',
                              border: '1px solid rgba(255,107,107,0.4)',
                              background: 'transparent',
                              color: '#ff6b6b',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            🚫 Cancel Appointment
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB 2: BROWSE & BOOK COUNSELLOR
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'browse' && (
          <div>
            {/* Search and Specialization Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <input
                id="counsellor-search-input"
                type="text"
                placeholder="Search by counsellor name or domain…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 240,
                  padding: '0.7rem 1rem',
                  borderRadius: '0.85rem',
                  border: cardBorder,
                  background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                  color: textPrimary,
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />

              <select
                id="counsellor-spec-select"
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                style={{
                  padding: '0.7rem 1rem',
                  borderRadius: '0.85rem',
                  border: cardBorder,
                  background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                  color: textPrimary,
                  fontSize: '0.88rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">All Specializations</option>
                {specializations.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Counsellor Cards Grid */}
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', animation: 'spin 1s linear infinite' }}>⚙️</div>
                <p style={{ color: textSecondary }}>Loading available counsellors…</p>
              </div>
            ) : filteredCounsellors.length === 0 ? (
              <div style={{ padding: '3.5rem 2rem', borderRadius: '1.25rem', background: cardBg, border: cardBorder, textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🧑‍⚕️</div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: textPrimary, margin: '0 0 0.4rem 0' }}>
                  No counsellors match your filter
                </h3>
                <p style={{ color: textSecondary, fontSize: '0.875rem' }}>
                  Try clearing the specialization filter or search query.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1.25rem' }}>
                {filteredCounsellors.map((c) => {
                  const cName = c.user?.name || 'Licensed Counsellor';
                  const cPhoto = c.profileImage;

                  return (
                    <div
                      key={c.id}
                      id={`counsellor-card-${c.id}`}
                      style={{
                        padding: '1.5rem',
                        borderRadius: '1.25rem',
                        background: cardBg,
                        border: cardBorder,
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(108,99,255,0.05)',
                        transition: 'transform 0.2s ease, border-color 0.2s ease',
                      }}
                    >
                      {/* Top identity */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1rem' }}>
                        {cPhoto ? (
                          <img src={cPhoto} alt={cName} style={{ width: 56, height: 56, borderRadius: '14px', objectFit: 'cover', border: '2px solid #4ecdc4' }} />
                        ) : (
                          <div style={{ width: 56, height: 56, borderRadius: '14px', background: 'linear-gradient(135deg, #4ecdc4, #6c63ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.35rem', flexShrink: 0 }}>
                            {cName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: textPrimary }}>
                            {cName}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#4ecdc4', fontWeight: 600 }}>
                            {c.specialization}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: textSecondary, marginTop: '0.1rem' }}>
                            💼 {c.experience || 0} years experience
                          </div>
                        </div>
                      </div>

                      {/* Bio description */}
                      <p style={{ color: textSecondary, fontSize: '0.86rem', lineHeight: 1.5, margin: '0 0 1rem 0', flex: 1 }}>
                        {c.description || 'Experienced mental wellness specialist providing supportive clinical consultations.'}
                      </p>

                      {/* Location & Availability snippet */}
                      <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(108,99,255,0.03)', marginBottom: '1.25rem', fontSize: '0.78rem' }}>
                        <div style={{ color: textPrimary, marginBottom: '0.25rem' }}>
                          📍 <strong>Location:</strong> {c.location || 'Online sessions available'}
                        </div>
                        <div style={{ color: textSecondary }}>
                          🗓️ <strong>Days:</strong> {c.availability && c.availability.length > 0 ? c.availability.map((a) => a.day.slice(0, 3)).join(', ') : 'Flexible Schedule'}
                        </div>
                      </div>

                      {/* Book CTA button */}
                      <button
                        id={`book-counsellor-btn-${c.id}`}
                        onClick={() => openBookingModal(c)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '9999px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #4ecdc4, #6c63ff)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          boxShadow: '0 4px 14px rgba(78,205,196,0.3)',
                          transition: 'opacity 0.2s',
                        }}
                      >
                        Book Appointment →
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          BOOKING MODAL (Select Date, Time, Duration & Notes)
      ═══════════════════════════════════════════════════════════════════════ */}
      {bookingCounsellor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: 520, borderRadius: '1.35rem', background: isDark ? '#1a1830' : '#fff', border: cardBorder, padding: '2rem', boxShadow: '0 20px 50px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.75rem' }}>🗓️</span>
                <div>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', fontWeight: 800, color: textPrimary, margin: 0 }}>
                    Book Appointment
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#4ecdc4', fontWeight: 600 }}>
                    {bookingCounsellor.user?.name} · {bookingCounsellor.specialization}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setBookingCounsellor(null)}
                style={{ background: 'transparent', border: 'none', color: textSecondary, fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {bookingError && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                ⚠️ {bookingError}
              </div>
            )}

            <form onSubmit={handleBookingSubmit} style={{ display: 'grid', gap: '1.1rem' }}>
              {/* Date Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: textSecondary, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Select Date *
                </label>
                <input
                  id="booking-date-input"
                  type="date"
                  min={tomorrowStr}
                  required
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm((f) => ({ ...f, date: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: cardBorder, background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', color: textPrimary, fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              {/* Time Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: textSecondary, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Select Time Slot *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map((slot) => {
                    const isSelected = bookingForm.time === slot;
                    return (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setBookingForm((f) => ({ ...f, time: slot }))}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '0.6rem',
                          border: isSelected ? '1px solid #4ecdc4' : cardBorder,
                          background: isSelected ? 'rgba(78,205,196,0.2)' : (isDark ? 'rgba(255,255,255,0.03)' : '#f8f7ff'),
                          color: isSelected ? '#4ecdc4' : textPrimary,
                          fontWeight: isSelected ? 800 : 500,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                        }}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="time"
                  value={bookingForm.time}
                  onChange={(e) => setBookingForm((f) => ({ ...f, time: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.85rem', borderRadius: '0.65rem', border: cardBorder, background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', color: textPrimary, fontSize: '0.85rem', outline: 'none' }}
                />
              </div>

              {/* Duration Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: textSecondary, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Session Duration
                </label>
                <select
                  id="booking-duration-select"
                  value={bookingForm.duration}
                  onChange={(e) => setBookingForm((f) => ({ ...f, duration: Number(e.target.value) }))}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: cardBorder, background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', color: textPrimary, fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}
                >
                  <option value={30}>30 Minutes (Check-in Consultation)</option>
                  <option value={60}>60 Minutes (Standard Therapy Session)</option>
                  <option value={90}>90 Minutes (Deep Dive Assessment)</option>
                </select>
              </div>

              {/* Reason / Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: textSecondary, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Notes / What would you like to discuss? (optional)
                </label>
                <textarea
                  id="booking-notes-input"
                  rows={3}
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Experiencing stress with work-life balance and sleep disruptions…"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: cardBorder, background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', color: textPrimary, fontSize: '0.85rem', outline: 'none', resize: 'vertical' }}
                />
              </div>

              {/* Booking Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setBookingCounsellor(null)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '9999px', border: cardBorder, background: 'transparent', color: textPrimary, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="booking-submit-btn"
                  disabled={isSubmittingBooking}
                  style={{
                    padding: '0.65rem 1.6rem',
                    borderRadius: '9999px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #4ecdc4, #6c63ff)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: isSubmittingBooking ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 16px rgba(78,205,196,0.35)',
                    opacity: isSubmittingBooking ? 0.7 : 1,
                  }}
                >
                  {isSubmittingBooking ? 'Confirming…' : 'Confirm & Request Session'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          CANCELLATION REASON MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {cancellingAppt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: 440, borderRadius: '1.25rem', background: isDark ? '#1a1830' : '#fff', border: cardBorder, padding: '1.75rem', boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: textPrimary, margin: '0 0 0.5rem 0' }}>
              Cancel Appointment
            </h3>
            <p style={{ color: textSecondary, fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Are you sure you want to cancel your session with <strong>{cancellingAppt.counsellor?.name}</strong> on {formatDate(cancellingAppt.scheduledAt)}?
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: textSecondary, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Reason for cancellation (optional)
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Schedule conflict, feeling better, rescheduling…"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: cardBorder, background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', color: textPrimary, fontSize: '0.85rem', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setCancellingAppt(null)}
                style={{ padding: '0.55rem 1.1rem', borderRadius: '9999px', border: cardBorder, background: 'transparent', color: textPrimary, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Keep Appointment
              </button>
              <button
                onClick={handleCancelSubmit}
                disabled={isSubmittingCancel}
                style={{ padding: '0.55rem 1.35rem', borderRadius: '9999px', border: 'none', background: '#ff6b6b', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                {isSubmittingCancel ? 'Cancelling…' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

export default AppointmentsPage;
