/**
 * components/ProtectedRoute.jsx
 * Wraps any route that requires authentication.
 *
 * Behaviour:
 *   - While auth is loading (initial /me check) → shows a spinner
 *   - If not authenticated → redirects to /auth/login with return path saved
 *   - If authenticated → renders children via <Outlet />
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show spinner while we're determining auth state from the server
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          background: 'linear-gradient(135deg, #0f0e1a, #1a1830)',
        }}
      >
        {/* Spinner */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '3px solid rgba(108,99,255,0.2)',
            borderTopColor: '#6c63ff',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: 'rgba(232,230,255,0.5)', fontSize: '0.9rem' }}>
          Verifying your session…
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Pass the attempted URL so we can redirect back after login
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
