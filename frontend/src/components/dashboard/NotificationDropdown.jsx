/**
 * components/dashboard/NotificationDropdown.jsx
 * Interactive notification popup panel in the dashboard navbar — Part 18.
 *
 * Supports:
 * - Real-time unread count indicator
 * - "All" and "Unread" filtering
 * - Mark as read (on click or per item)
 * - Mark all as read button
 * - Delete notification (trash button)
 * - Direct navigation for actionable notifications (check-in, appointments, relaxation, journey)
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

export const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const diffDays = Math.floor(diffSec / 86400);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

const NotificationDropdown = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = filter === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const handleNotificationClick = (n) => {
    if (!n.isRead) {
      markAsRead(n.id);
    }
    if (n.link) {
      navigate(n.link);
      onClose();
    }
  };

  return (
    <div
      ref={dropdownRef}
      id="notification-dropdown-menu"
      style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        right: 0,
        width: 380,
        maxWidth: '92vw',
        background: isDark ? 'rgba(20,18,34,0.96)' : '#ffffff',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.15)'}`,
        borderRadius: '1.25rem',
        boxShadow: isDark
          ? '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(108,99,255,0.2)'
          : '0 16px 48px rgba(108,99,255,0.14), 0 0 0 1px rgba(108,99,255,0.08)',
        backdropFilter: 'blur(16px)',
        zIndex: 1000,
        overflow: 'hidden',
        animation: 'fadeInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* ── Header ────────────────────────────────────────── */}
      <div
        style={{
          padding: '1rem 1.25rem 0.75rem',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.08)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '1rem', color: isDark ? '#e8e6ff' : '#1a1a2e' }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span
              id="dropdown-unread-badge"
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.15rem 0.55rem',
                borderRadius: '20px',
                background: 'linear-gradient(135deg,#6c63ff,#5a4fd9)',
                color: '#fff',
              }}
            >
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            id="dropdown-mark-all-btn"
            onClick={markAllAsRead}
            style={{
              background: 'none',
              border: 'none',
              color: '#6c63ff',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '0.2rem 0.4rem',
              borderRadius: '6px',
              transition: 'all 0.18s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* ── Filter Tabs ───────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          padding: '0.5rem 1rem 0.25rem',
          gap: '0.4rem',
        }}
      >
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '0.3rem 0.75rem',
            borderRadius: '20px',
            border: 'none',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: filter === 'all'
              ? (isDark ? 'rgba(108,99,255,0.2)' : 'rgba(108,99,255,0.12)')
              : 'transparent',
            color: filter === 'all'
              ? '#6c63ff'
              : (isDark ? 'rgba(232,230,255,0.55)' : 'rgba(26,26,46,0.55)'),
          }}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          style={{
            padding: '0.3rem 0.75rem',
            borderRadius: '20px',
            border: 'none',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: filter === 'unread'
              ? (isDark ? 'rgba(108,99,255,0.2)' : 'rgba(108,99,255,0.12)')
              : 'transparent',
            color: filter === 'unread'
              ? '#6c63ff'
              : (isDark ? 'rgba(232,230,255,0.55)' : 'rgba(26,26,46,0.55)'),
          }}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* ── Scrollable list ───────────────────────────────── */}
      <div
        style={{
          maxHeight: 380,
          overflowY: 'auto',
          padding: '0.4rem 0.65rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              padding: '2.5rem 1rem',
              textAlign: 'center',
              color: isDark ? 'rgba(232,230,255,0.45)' : 'rgba(26,26,46,0.45)',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
            <div style={{ fontWeight: 600, color: isDark ? '#e8e6ff' : '#1a1a2e' }}>
              You're all caught up!
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
              {filter === 'unread' ? 'No unread notifications right now.' : 'No notifications yet.'}
            </div>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(item)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.75rem 0.85rem',
                borderRadius: '0.875rem',
                cursor: item.link ? 'pointer' : 'default',
                background: !item.isRead
                  ? (isDark ? 'rgba(108,99,255,0.12)' : 'rgba(108,99,255,0.06)')
                  : 'transparent',
                border: `1px solid ${!item.isRead ? (isDark ? 'rgba(108,99,255,0.22)' : 'rgba(108,99,255,0.12)') : 'transparent'}`,
                transition: 'all 0.18s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(108,99,255,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = !item.isRead
                  ? (isDark ? 'rgba(108,99,255,0.12)' : 'rgba(108,99,255,0.06)')
                  : 'transparent';
              }}
            >
              {/* Category Icon */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  background: isDark ? 'rgba(108,99,255,0.18)' : 'rgba(108,99,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  flexShrink: 0,
                  marginTop: '0.1rem',
                }}
              >
                {item.icon || '🔔'}
              </div>

              {/* Text content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <span
                    style={{
                      fontWeight: !item.isRead ? 700 : 600,
                      fontSize: '0.84rem',
                      color: isDark ? '#e8e6ff' : '#1a1a2e',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.title}
                  </span>
                  {!item.isRead && (
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#6c63ff',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>

                <p
                  style={{
                    fontSize: '0.78rem',
                    color: isDark ? 'rgba(232,230,255,0.7)' : 'rgba(26,26,46,0.7)',
                    margin: 0,
                    lineHeight: 1.45,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.message}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '0.35rem',
                  }}
                >
                  <span style={{ fontSize: '0.68rem', opacity: 0.5, color: isDark ? '#e8e6ff' : '#1a1a2e' }}>
                    {formatRelativeTime(item.createdAt)}
                  </span>
                  {item.link && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: '#6c63ff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                      }}
                    >
                      View →
                    </span>
                  )}
                </div>
              </div>

              {/* Delete button */}
              <button
                title="Delete notification"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(item.id);
                }}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: isDark ? 'rgba(255,107,107,0.7)' : '#ff6b6b',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.6,
                  transition: 'opacity 0.2s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
