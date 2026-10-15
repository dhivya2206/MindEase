/**
 * constants/roles.js
 * Single source of truth for role strings — Part 4.
 * Import from here everywhere; never hard-code 'admin' etc. as strings.
 */

export const ROLES = Object.freeze({
  USER:       'user',
  COUNSELLOR: 'counsellor',
  ADMIN:      'admin',
});

/** All role values as an array — useful for iterating */
export const ALL_ROLES = Object.values(ROLES);

/** Human-readable role labels */
export const ROLE_LABELS = Object.freeze({
  [ROLES.USER]:       'User',
  [ROLES.COUNSELLOR]: 'Counsellor',
  [ROLES.ADMIN]:      'Admin',
});

/** Role-specific dashboard paths */
export const ROLE_DASHBOARD = Object.freeze({
  [ROLES.USER]:       '/dashboard/user',
  [ROLES.COUNSELLOR]: '/dashboard/counsellor',
  [ROLES.ADMIN]:      '/dashboard/admin',
});

/**
 * Given a role string, return the correct dashboard path.
 * Falls back to /dashboard/user if the role is unknown.
 * @param {string} role
 * @returns {string}
 */
export const getDashboardPath = (role) =>
  ROLE_DASHBOARD[role] ?? ROLE_DASHBOARD[ROLES.USER];
