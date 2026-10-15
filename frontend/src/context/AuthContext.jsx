/**
 * context/AuthContext.jsx
 * Global authentication state — Part 4 update: role + hasRole() added.
 *
 * Provides:
 *   user            — authenticated user object (includes role) or null
 *   token           — JWT string or null
 *   isLoading       — true while the initial /me check runs
 *   isAuthenticated — boolean derived from user !== null
 *   role            — shorthand for user?.role (string | null)
 *   hasRole()       — returns true if user.role matches any given role
 *   dashboardPath   — the correct /dashboard/* path for this user's role
 *   register()      — creates account + logs in
 *   login()         — logs in existing user
 *   logout()        — clears state + localStorage
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService.js';
import { getDashboardPath } from '../constants/roles.js';

const TOKEN_KEY = 'mindease-token';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]           = useState(null);
  const [token, setToken]         = useState(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  // ── Persist token ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  // ── On mount: hydrate user from server ────────────────────────────────────
  useEffect(() => {
    const hydrateUser = async () => {
      if (!token) { setIsLoading(false); return; }
      try {
        const me = await authService.getMe();
        setUser(me);
      } catch {
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    hydrateUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ───────────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    const { user: newUser, token: newToken } = await authService.register(formData);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  const login = useCallback(async (credentials) => {
    const { user: loggedUser, token: newToken } = await authService.login(credentials);
    setToken(newToken);
    setUser(loggedUser);
    return loggedUser;
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { /* non-critical */ }
    finally { setToken(null); setUser(null); }
  }, []);

  // ── Role helpers ──────────────────────────────────────────────────────────
  /**
   * Returns true if the authenticated user has ANY of the provided roles.
   * @param {...string} roles
   * @returns {boolean}
   */
  const hasRole = useCallback((...roles) => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  }, [user]);

  const updateUser = useCallback((updates) => {
    setUser(prev => prev ? ({ ...prev, ...updates }) : null);
  }, []);

  // ── Memoised value ────────────────────────────────────────────────────────
  const value = useMemo(() => ({
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(user),
    role: user?.role ?? null,
    hasRole,
    dashboardPath: getDashboardPath(user?.role),
    register,
    login,
    logout,
    updateUser,
  }), [user, token, isLoading, hasRole, register, login, logout, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
