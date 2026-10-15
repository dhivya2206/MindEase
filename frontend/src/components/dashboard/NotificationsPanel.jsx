/**
 * components/dashboard/NotificationsPanel.jsx
 * In-app notification feed card on the User Dashboard — Part 18.
 *
 * Fully integrated with real MongoDB backend data and NotificationContext:
 *   - Displays real notifications (daily check-ins, appointments, streaks, recommendations)
 *   - Mark as read
 *   - Mark all as read
 *   - Delete notification
 *   - Unread count badge
 */

import { useNavigate } from 'react-router-dom';
import { Card, SectionHeader, SkeletonBlock, PillButton } from './ui.jsx';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { formatRelativeTime } from './NotificationDropdown';

// ── Notification Item Component ────────────────────────────────
export const NotificationItem = ({
  id,
  icon = '🔔',
  title,
  message,
  createdAt,
  isRead,
  link,
  onMarkRead,
  onDelete,
  isDark,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!isRead && onMarkRead) {
      onMarkRead(id);
    }
    if (link) {
      navigate(link);
    }
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.85rem',
        padding: '0.85rem',
        borderRadius: '0.875rem',
        cursor: link ? 'pointer' : 'default',
        background: !isRead
          ? (isDark ? 'rgba(108,99,255,0.1)' : 'rgba(108,99,255,0.05)')
          : 'transparent',
        border: `1px solid ${!isRead ? (isDark ? 'rgba(108,99,255,0.2)' : 'rgba(108,99,255,0.12)') : 'transparent'}`,
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isDark
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(108,99,255,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = !isRead
          ? (isDark ? 'rgba(108,99,255,0.1)' : 'rgba(108,99,255,0.05)')
          : 'transparent';
      }}
    >
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
        }}
      >
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
          <span
            style={{
              fontWeight: !isRead ? 700 : 600,
              fontSize: '0.875rem',
              color: isDark ? '#e8e6ff' : '#1a1a2e',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </span>
          {!isRead && (
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
            fontSize: '0.8rem',
            opacity: 0.65,
            margin: 0,
            lineHeight: 1.45,
            color: isDark ? '#e8e6ff' : '#1a1a2e',
          }}
        >
          {message}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem' }}>
          <span style={{ fontSize: '0.7rem', opacity: 0.45 }}>
            {formatRelativeTime(createdAt)}
          </span>
          {link && (
            <span style={{ fontSize: '0.72rem', color: '#6c63ff', fontWeight: 600 }}>
              View →
            </span>
          )}
        </div>
      </div>

      {onDelete && (
        <button
          title="Delete notification"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          style={{
            width: 26,
            height: 26,
            borderRadius: '6px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '0.85rem',
            opacity: 0.5,
            transition: 'opacity 0.2s',
            flexShrink: 0,
            color: isDark ? '#ff9494' : '#e74c3c',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
        >
          🗑️
        </button>
      )}
    </div>
  );
};

// ── Skeleton Loader ───────────────────────────────────────────
const NotifSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
    {[1, 2, 3].map((i) => (
      <div key={i} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
        <SkeletonBlock width={36} height={36} radius={10} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <SkeletonBlock width="70%" height={14} />
          <SkeletonBlock width="90%" height={11} />
          <SkeletonBlock width="30%" height={10} />
        </div>
      </div>
    ))}
  </div>
);

// ── Main Notifications Panel Component ────────────────────────
const NotificationsPanel = () => {
  const { isDark } = useTheme();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const hasNotifications = notifications && notifications.length > 0;

  return (
    <Card id="notifications-panel-card">
      <SectionHeader
        title="Notifications"
        subtitle={
          hasNotifications
            ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
            : 'All caught up'
        }
        action={
          unreadCount > 0 && (
            <PillButton
              id="mark-all-read-btn"
              variant="ghost"
              onClick={markAllAsRead}
              style={{ fontSize: '0.78rem', padding: '0.3rem 0.8rem' }}
            >
              Mark all read
            </PillButton>
          )
        }
      />

      {isLoading && !hasNotifications ? (
        <NotifSkeleton />
      ) : hasNotifications ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 380, overflowY: 'auto' }}>
          {notifications.slice(0, 8).map((n) => (
            <NotificationItem
              key={n.id}
              {...n}
              onMarkRead={markAsRead}
              onDelete={deleteNotification}
              isDark={isDark}
            />
          ))}
        </div>
      ) : (
        <div style={{ padding: '1.5rem 1rem', textAlign: 'center', opacity: 0.6, fontSize: '0.85rem' }}>
          <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>🌿</div>
          You have no notifications right now.
        </div>
      )}
    </Card>
  );
};

export default NotificationsPanel;
