/**
 * pages/counsellor/CounsellorAppointmentsPage.jsx
 * Counsellor appointment management — Part 15.
 *
 * Capabilities:
 * - View all appointments booked with this counsellor
 * - Filter by status (all, pending, accepted, completed, cancelled, rejected)
 * - Accept pending appointment requests
 * - Reject pending requests (with reason dialog)
 * - Cancel pending/accepted appointments (with reason dialog)
 * - Mark accepted appointments as completed
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import * as counsellorService from '../../services/counsellorService';

const STATUS_TABS = [
  { key: 'all', label: 'All', icon: '📋' },
  { key: 'pending', label: 'Pending Requests', icon: '⏳' },
  { key: 'accepted', label: 'Upcoming / Accepted', icon: '✅' },
  { key: 'completed', label: 'Completed', icon: '🎉' },
  { key: 'cancelled', label: 'Cancelled', icon: '🚫' },
  { key: 'rejected', label: 'Rejected', icon: '✖️' },
];

const STATUS_CONFIG = {
  pending: {
    bg: 'rgba(247, 197, 159, 0.15)',
    color: '#f7c59f',
    border: 'rgba(247, 197, 159, 0.3)',
    label: 'Pending Request',
    icon: '⏳',
  },
  accepted: {
    bg: 'rgba(78, 205, 196, 0.15)',
    color: '#4ecdc4',
    border: 'rgba(78, 205, 196, 0.3)',
    label: 'Accepted / Scheduled',
    icon: '✅',
  },
  confirmed: {
    bg: 'rgba(78, 205, 196, 0.15)',
    color: '#4ecdc4',
    border: 'rgba(78, 205, 196, 0.3)',
    label: 'Confirmed / Scheduled',
    icon: '✅',
  },
  completed: {
    bg: 'rgba(108, 99, 255, 0.15)',
    color: '#6c63ff',
    border: 'rgba(108, 99, 255, 0.3)',
    label: 'Completed',
    icon: '🎉',
  },
  cancelled: {
    bg: 'rgba(255, 107, 107, 0.15)',
    color: '#ff6b6b',
    border: 'rgba(255, 107, 107, 0.3)',
    label: 'Cancelled',
    icon: '🚫',
  },
  rejected: {
    bg: 'rgba(255, 107, 107, 0.15)',
    color: '#ff6b6b',
    border: 'rgba(255, 107, 107, 0.3)',
    label: 'Rejected',
    icon: '✖️',
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

const CounsellorAppointmentsPage = () => {
  const { isDark } = useTheme();

  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Modal states for reject / cancel
  const [activeModal, setActiveModal] = useState(null); // { type: 'reject' | 'cancel', appointment: appt }
  const [modalReason, setModalReason] = useState('');

  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statusParam = activeTab === 'all' ? undefined : activeTab;
      const data = await counsellorService.getMyAppointments(statusParam);
      setAppointments(data);
    } catch (err) {
      setError(err.message || 'Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleAccept = async (id) => {
    setActionLoadingId(id);
    setError(null);
    try {
      await counsellorService.acceptAppointment(id);
      showSuccess('Appointment accepted successfully! Client has been notified.');
      await loadAppointments();
    } catch (err) {
      setError(err.message || 'Failed to accept appointment');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleComplete = async (id) => {
    setActionLoadingId(id);
    setError(null);
    try {
      await counsellorService.completeAppointment(id);
      showSuccess('Appointment marked as completed! ✓');
      await loadAppointments();
    } catch (err) {
      setError(err.message || 'Failed to complete appointment');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openActionModal = (type, appointment) => {
    setModalReason('');
    setActiveModal({ type, appointment });
  };

  const handleModalSubmit = async () => {
    if (!activeModal) return;
    const { type, appointment } = activeModal;
    setActionLoadingId(appointment.id);
    setError(null);
    try {
      if (type === 'reject') {
        await counsellorService.rejectAppointment(appointment.id, modalReason);
        showSuccess('Appointment request rejected.');
      } else if (type === 'cancel') {
        await counsellorService.cancelAppointment(appointment.id, modalReason);
        showSuccess('Appointment cancelled.');
      }
      setActiveModal(null);
      await loadAppointments();
    } catch (err) {
      setError(err.message || `Failed to ${type} appointment`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const bg = isDark ? 'linear-gradient(135deg, #0f0e1a, #1a1830)' : 'linear-gradient(135deg, #f8f7ff, #edf8f5)';
  const cardBg = isDark ? 'rgba(26,24,48,0.85)' : '#fff';
  const cardBorder = isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(108,99,255,0.1)';
  const textPrimary = isDark ? '#e8e6ff' : '#1a1a2e';
  const textSecondary = isDark ? 'rgba(232,230,255,0.6)' : 'rgba(26,26,46,0.6)';

  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const acceptedCount = appointments.filter(a => a.status === 'accepted').length;

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* Top bar navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link to="/dashboard/counsellor" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#4ecdc4', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
            ← Back to Dashboard
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/dashboard/counsellor/profile" style={{ padding: '0.45rem 1rem', borderRadius: '9999px', background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)', color: '#6c63ff', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
              👤 My Profile
            </Link>
          </div>
        </div>

        {/* Page Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '2rem' }}>📅</span>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: textPrimary, margin: 0 }}>
              Appointment Management
            </h1>
          </div>
          <p style={{ color: textSecondary, fontSize: '0.92rem', marginLeft: '2.75rem' }}>
            Review incoming requests, manage upcoming sessions, and record completions.
          </p>
        </div>

        {/* Summary Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          <div style={{ padding: '1.1rem', borderRadius: '1rem', background: cardBg, border: cardBorder, textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>⏳</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#f7c59f' }}>
              {pendingCount}
            </div>
            <div style={{ fontSize: '0.78rem', color: textSecondary }}>Pending Requests</div>
          </div>
          <div style={{ padding: '1.1rem', borderRadius: '1rem', background: cardBg, border: cardBorder, textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>✅</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#4ecdc4' }}>
              {acceptedCount}
            </div>
            <div style={{ fontSize: '0.78rem', color: textSecondary }}>Scheduled Sessions</div>
          </div>
          <div style={{ padding: '1.1rem', borderRadius: '1rem', background: cardBg, border: cardBorder, textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>📋</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#6c63ff' }}>
              {appointments.length}
            </div>
            <div style={{ fontSize: '0.78rem', color: textSecondary }}>Total Records</div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ padding: '0.9rem 1.25rem', borderRadius: '0.75rem', background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            ⚠️ {error}
          </div>
        )}
        {successMsg && (
          <div style={{ padding: '0.9rem 1.25rem', borderRadius: '0.75rem', background: 'rgba(78,205,196,0.15)', border: '1px solid rgba(78,205,196,0.3)', color: '#4ecdc4', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            {successMsg}
          </div>
        )}

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          {STATUS_TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                id={`appointments-tab-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 1rem',
                  borderRadius: '9999px',
                  border: isActive ? '1px solid #4ecdc4' : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  background: isActive ? 'rgba(78,205,196,0.18)' : (isDark ? 'rgba(255,255,255,0.03)' : '#fff'),
                  color: isActive ? '#4ecdc4' : textSecondary,
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Appointments List */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⚙️</div>
            <p style={{ color: textSecondary }}>Loading appointments…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : appointments.length === 0 ? (
          <div style={{ padding: '3.5rem 2rem', borderRadius: '1.5rem', background: cardBg, border: cardBorder, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', fontWeight: 700, color: textPrimary, marginBottom: '0.5rem' }}>
              No {activeTab !== 'all' ? activeTab : ''} appointments found
            </h3>
            <p style={{ color: textSecondary, fontSize: '0.875rem', maxWidth: 420, margin: '0 auto' }}>
              {activeTab === 'pending'
                ? 'You do not have any pending requests to accept or reject at this moment.'
                : 'Appointments booked with you will appear here with full control to accept, reject, complete, or cancel.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {appointments.map((appt) => {
              const statusCfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
              const isActionLoading = actionLoadingId === appt.id;
              const clientName = appt.user?.name || 'Anonymous User';
              const clientEmail = appt.user?.email || 'No email provided';

              return (
                <div
                  key={appt.id}
                  id={`appointment-card-${appt.id}`}
                  style={{
                    padding: '1.5rem',
                    borderRadius: '1.25rem',
                    background: cardBg,
                    border: cardBorder,
                    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(108,99,255,0.04)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  {/* Top row: Client & Status Badge */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #4ecdc4, #6c63ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>
                        {clientName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.05rem', fontWeight: 700, color: textPrimary }}>
                          {clientName}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: textSecondary }}>
                          {clientEmail}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem', borderRadius: '9999px', background: statusCfg.bg, border: `1px solid ${statusCfg.border}`, color: statusCfg.color, fontSize: '0.8rem', fontWeight: 700 }}>
                      <span>{statusCfg.icon}</span>
                      <span>{statusCfg.label}</span>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', padding: '1rem', borderRadius: '0.9rem', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(108,99,255,0.03)', marginBottom: '1.1rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: textSecondary, display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Date</span>
                      <span style={{ fontWeight: 600, color: textPrimary }}>🗓️ {formatDate(appt.scheduledAt)}</span>
                    </div>
                    <div>
                      <span style={{ color: textSecondary, display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Time</span>
                      <span style={{ fontWeight: 600, color: textPrimary }}>⏰ {formatTime(appt.scheduledAt)} ({appt.duration || 60} mins)</span>
                    </div>
                    {appt.notes && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ color: textSecondary, display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Client Notes</span>
                        <span style={{ color: textPrimary, fontStyle: 'italic' }}>"{appt.notes}"</span>
                      </div>
                    )}
                    {appt.reason && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ color: '#ff6b6b', display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Reason / Notes</span>
                        <span style={{ color: textPrimary }}>{appt.reason}</span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons based on status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.65rem', flexWrap: 'wrap' }}>
                    {/* Status: PENDING → Accept or Reject */}
                    {appt.status === 'pending' && (
                      <>
                        <button
                          id={`reject-btn-${appt.id}`}
                          onClick={() => openActionModal('reject', appt)}
                          disabled={isActionLoading}
                          style={{ padding: '0.5rem 1.1rem', borderRadius: '9999px', border: '1px solid rgba(255,107,107,0.4)', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', fontWeight: 600, fontSize: '0.82rem', cursor: isActionLoading ? 'not-allowed' : 'pointer' }}
                        >
                          ✖️ Reject Request
                        </button>
                        <button
                          id={`accept-btn-${appt.id}`}
                          onClick={() => handleAccept(appt.id)}
                          disabled={isActionLoading}
                          style={{ padding: '0.5rem 1.25rem', borderRadius: '9999px', border: 'none', background: 'linear-gradient(135deg, #4ecdc4, #6c63ff)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: isActionLoading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(78,205,196,0.3)' }}
                        >
                          {isActionLoading ? 'Processing…' : '✅ Accept Request'}
                        </button>
                      </>
                    )}

                    {/* Status: ACCEPTED → Complete or Cancel */}
                    {appt.status === 'accepted' && (
                      <>
                        <button
                          id={`cancel-btn-${appt.id}`}
                          onClick={() => openActionModal('cancel', appt)}
                          disabled={isActionLoading}
                          style={{ padding: '0.5rem 1.1rem', borderRadius: '9999px', border: '1px solid rgba(255,107,107,0.4)', background: 'transparent', color: '#ff6b6b', fontWeight: 600, fontSize: '0.82rem', cursor: isActionLoading ? 'not-allowed' : 'pointer' }}
                        >
                          🚫 Cancel Appointment
                        </button>
                        <button
                          id={`complete-btn-${appt.id}`}
                          onClick={() => handleComplete(appt.id)}
                          disabled={isActionLoading}
                          style={{ padding: '0.5rem 1.25rem', borderRadius: '9999px', border: 'none', background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: isActionLoading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(108,99,255,0.3)' }}
                        >
                          {isActionLoading ? 'Saving…' : '🎉 Mark Completed'}
                        </button>
                      </>
                    )}

                    {/* Status: COMPLETED, CANCELLED, REJECTED */}
                    {['completed', 'cancelled', 'rejected'].includes(appt.status) && (
                      <span style={{ fontSize: '0.8rem', color: textSecondary, fontStyle: 'italic' }}>
                        Archived record ({appt.status})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Reject / Cancel Reason Modal */}
      {activeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: 460, borderRadius: '1.25rem', background: isDark ? '#1a1830' : '#fff', border: cardBorder, padding: '1.75rem', boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: textPrimary, marginTop: 0, marginBottom: '0.5rem' }}>
              {activeModal.type === 'reject' ? 'Reject Appointment Request' : 'Cancel Appointment'}
            </h3>
            <p style={{ color: textSecondary, fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              {activeModal.type === 'reject'
                ? 'Are you sure you want to decline this booking request? You can provide a reason for the client.'
                : 'Please confirm cancellation of this scheduled appointment.'}
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: textSecondary, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Reason (optional)
              </label>
              <textarea
                id="modal-reason-input"
                rows={3}
                value={modalReason}
                onChange={e => setModalReason(e.target.value)}
                placeholder="e.g. Schedule conflict, out of office, etc."
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.2)'}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', color: textPrimary, fontSize: '0.875rem', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                id="modal-cancel-btn"
                onClick={() => setActiveModal(null)}
                style={{ padding: '0.55rem 1.1rem', borderRadius: '9999px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`, background: 'transparent', color: textPrimary, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Go Back
              </button>
              <button
                id="modal-confirm-btn"
                onClick={handleModalSubmit}
                disabled={actionLoadingId !== null}
                style={{ padding: '0.55rem 1.35rem', borderRadius: '9999px', border: 'none', background: '#ff6b6b', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                {actionLoadingId ? 'Processing…' : `Confirm ${activeModal.type === 'reject' ? 'Rejection' : 'Cancellation'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CounsellorAppointmentsPage;
