/**
 * components/RoleRoute.jsx
 * Role-based route guard — Part 4.
 *
 * Must nest INSIDE a ProtectedRoute (authentication is already guaranteed).
 *
 * Behaviour:
 *   - isLoading  → spinner (inherited from ProtectedRoute, but guarded here too)
 *   - role not in allowedRoles → renders <UnauthorizedPage /> (403)
 *   - role matches → renders <Outlet />
 *
 * Usage in App.jsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route element={<RoleRoute roles={[ROLES.ADMIN]} />}>
 *       <Route path="dashboard/admin" element={<AdminDashboard />} />
 *     </Route>
 *   </Route>
 */

import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../constants/roles';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';

// ── 403 inline view ────────────────────────────────────────────
const AccessDenied = ({ requiredRoles, userRole, dashboardPath }) => {
  const { isDark } = useTheme();
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: '2rem',
      background: isDark
        ? 'linear-gradient(135deg, #0f0e1a, #1a1830)'
        : 'linear-gradient(135deg, #f8f7ff, #f0eeff)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Orb */}
      <div style={{ position: 'absolute', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,107,0.15) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, animation: 'fadeInUp 0.4s ease' }}>
        <div style={{
          fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(5rem, 14vw, 9rem)',
          fontWeight: 900, lineHeight: 1, marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, #ff6b6b, #f7c59f)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>403</div>

        <div style={{ fontSize: '2.5rem', marginBottom: '1.25rem', animation: 'float 3s ease-in-out infinite' }}>🚫</div>

        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.4rem, 3.5vw, 1.9rem)', fontWeight: 800, color: isDark ? '#e8e6ff' : '#1a1a2e', marginBottom: '0.75rem' }}>
          Access Denied
        </h1>

        <p style={{ fontSize: '0.95rem', opacity: 0.65, maxWidth: 420, margin: '0 auto 0.75rem', lineHeight: 1.6 }}>
          This page requires the{' '}
          <strong style={{ color: '#ff6b6b' }}>
            {requiredRoles.map(r => ROLE_LABELS[r] ?? r).join(' or ')}
          </strong>{' '}
          role.
        </p>
        <p style={{ fontSize: '0.875rem', opacity: 0.5, marginBottom: '2rem' }}>
          You are logged in as: <strong>{ROLE_LABELS[userRole] ?? userRole}</strong>
        </p>

        <Link
          to={dashboardPath}
          id="access-denied-dashboard-btn"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.8rem 2rem', borderRadius: '9999px',
            background: 'linear-gradient(135deg, #6c63ff, #5a4fd9)',
            color: '#fff', fontWeight: 600, fontSize: '0.95rem',
            textDecoration: 'none', boxShadow: '0 6px 20px rgba(108,99,255,0.35)',
          }}
        >
          Go to My Dashboard →
        </Link>
      </div>
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }`}</style>
    </div>
  );
};

// ── RoleRoute ──────────────────────────────────────────────────
/**
 * @param {{ roles: string[] }} props  Allowed role strings (from ROLES constants).
 */
const RoleRoute = ({ roles }) => {
  const { isLoading, isAuthenticated, role, dashboardPath } = useAuth();

  // Should not happen if nested inside ProtectedRoute, but guard anyway
  if (isLoading || !isAuthenticated) return null;

  if (!roles.includes(role)) {
    return (
      <AccessDenied
        requiredRoles={roles}
        userRole={role}
        dashboardPath={dashboardPath}
      />
    );
  }

  return <Outlet />;
};

export default RoleRoute;
