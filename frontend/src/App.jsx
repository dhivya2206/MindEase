/**
 * App.jsx
 * Root component.
 * Part 9 update: AI chat route added.
 * Part 12 update: Relaxation Center route added.
 * Part 13 update: Relaxation Games route added.
 *
 * Route structure:
 *   /                           → MainLayout → HomePage          (public)
 *   /auth/login                 → AuthLayout → LoginPage         (guest only)
 *   /auth/signup                → AuthLayout → SignupPage        (guest only)
 *
 *   /dashboard                  → redirects to /dashboard/<role> (auth required)
 *   /dashboard/user             → ProtectedRoute → RoleRoute(user)       → UserDashboard
 *   /dashboard/user/mood        → ProtectedRoute → RoleRoute(user)       → MoodPage
 *   /dashboard/user/checkin     → ProtectedRoute → RoleRoute(user)       → CheckInPage
 *   /dashboard/user/chat        → ProtectedRoute → RoleRoute(user)       → ChatPage
 *   /dashboard/user/relax       → ProtectedRoute → RoleRoute(user)       → RelaxationPage
 *   /dashboard/user/games       → ProtectedRoute → RoleRoute(user)       → GamesPage
 *   /dashboard/counsellor       → ProtectedRoute → RoleRoute(counsellor) → CounsellorDashboard
 *   /dashboard/admin            → ProtectedRoute → RoleRoute(admin)      → AdminDashboard
 *
 *   *                           → NotFoundPage
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider }        from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider }  from './context/NotificationContext';
import { ROLES }                from './constants/roles';

import MainLayout               from './layouts/MainLayout';
import AuthLayout               from './layouts/AuthLayout';
import ProtectedRoute           from './components/ProtectedRoute';
import RoleRoute                from './components/RoleRoute';

import HomePage                 from './pages/HomePage';
import AboutPage                from './pages/AboutPage';
import FeaturesPage             from './pages/FeaturesPage';
import LoginPage                from './pages/LoginPage';
import SignupPage               from './pages/SignupPage';
import NotFoundPage             from './pages/NotFoundPage';

import UserDashboard            from './pages/dashboards/UserDashboard';
import CounsellorDashboard      from './pages/dashboards/CounsellorDashboard';
import AdminDashboard           from './pages/dashboards/AdminDashboard';
import MoodPage                 from './pages/MoodPage';
import CheckInPage              from './pages/CheckInPage';
import ChatPage                 from './pages/ChatPage';
import RelaxationPage           from './pages/RelaxationPage';
import GamesPage                from './pages/GamesPage';
import CounsellorProfilePage    from './pages/counsellor/CounsellorProfilePage';
import CounsellorAppointmentsPage from './pages/counsellor/CounsellorAppointmentsPage';
import AppointmentsPage         from './pages/AppointmentsPage';
import MyWellnessJourneyPage    from './pages/MyWellnessJourneyPage';
import JournalPage              from './pages/JournalPage';
import ChallengesPage           from './pages/ChallengesPage';

// ── GuestRoute — redirect already-authed users to their dashboard ──────────────
const GuestRoute = ({ children }) => {
  const { isAuthenticated, isLoading, dashboardPath } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to={dashboardPath} replace /> : children;
};

// ── DashboardRedirect — /dashboard → /dashboard/<role> ───────────────────────
const DashboardRedirect = () => {
  const { isLoading, dashboardPath } = useAuth();
  if (isLoading) return null;
  return <Navigate to={dashboardPath} replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* ── Public (MainLayout) ──────────────────────────────── */}
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about"    element={<AboutPage />} />
        <Route path="features" element={<FeaturesPage />} />
      </Route>

      {/* ── Auth pages (AuthLayout, guest-only) ──────────────── */}
      <Route path="auth" element={<AuthLayout />}>
        <Route path="login"  element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
      </Route>

      {/* ── Protected: require login ─────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        {/* /dashboard → role-appropriate dashboard */}
        <Route path="dashboard" element={<DashboardRedirect />} />

        {/* user dashboard */}
        <Route element={<RoleRoute roles={[ROLES.USER]} />}>
          <Route path="dashboard/user"              element={<UserDashboard />} />
          <Route path="dashboard/user/mood"         element={<MoodPage />} />
          <Route path="dashboard/user/checkin"      element={<CheckInPage />} />
          <Route path="dashboard/user/chat"         element={<ChatPage />} />
          <Route path="dashboard/user/appointments" element={<AppointmentsPage />} />
        </Route>

        {/* Wellness & Games & Journey & Journal — accessible to all authenticated users */}
        <Route element={<RoleRoute roles={[ROLES.USER, ROLES.COUNSELLOR, ROLES.ADMIN]} />}>
          <Route path="dashboard/user/journey"  element={<MyWellnessJourneyPage />} />
          <Route path="dashboard/user/relax"    element={<RelaxationPage />} />
          <Route path="dashboard/user/games"    element={<GamesPage />} />
          <Route path="dashboard/user/journal"     element={<JournalPage />} />
          <Route path="dashboard/user/challenges"  element={<ChallengesPage />} />
        </Route>

        {/* counsellor dashboard — only 'counsellor' role */}
        <Route element={<RoleRoute roles={[ROLES.COUNSELLOR]} />}>
          <Route path="dashboard/counsellor"              element={<CounsellorDashboard />} />
          <Route path="dashboard/counsellor/profile"      element={<CounsellorProfilePage />} />
          <Route path="dashboard/counsellor/appointments" element={<CounsellorAppointmentsPage />} />
        </Route>

        {/* admin dashboard — only 'admin' role */}
        <Route element={<RoleRoute roles={[ROLES.ADMIN]} />}>
          <Route path="dashboard/admin" element={<AdminDashboard />} />
          {/* Part 5+: user management, analytics nested here */}
        </Route>
      </Route>

      {/* ── 404 ─────────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
