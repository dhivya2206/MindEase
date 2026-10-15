/**
 * components/dashboard/ui.jsx
 * Lightweight reusable UI primitives for the dashboard.
 *
 * Exports:
 *   Card           — surface container
 *   SkeletonBlock  — animated loading placeholder
 *   EmptyState     — zero-data prompt
 *   Badge          — coloured label chip
 *   SectionHeader  — title + optional action link
 *   Divider        — horizontal rule
 */

import { useTheme } from '../../context/ThemeContext';

// ── Card ──────────────────────────────────────────────────────
export const Card = ({ children, style, noPad, className, id }) => {
  const { isDark } = useTheme();
  return (
    <div
      id={id}
      className={className}
      style={{
        background: isDark ? 'rgba(26,24,48,0.85)' : '#fff',
        borderRadius: '1.25rem',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.09)'}`,
        boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 20px rgba(108,99,255,0.07)',
        padding: noPad ? 0 : '1.5rem',
        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ── SkeletonBlock ─────────────────────────────────────────────
export const SkeletonBlock = ({ width = '100%', height = 18, radius = 8, style }) => {
  const { isDark } = useTheme();
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: isDark
        ? 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 100%)'
        : 'linear-gradient(90deg, #f0eeff 0%, #e2dcff 50%, #f0eeff 100%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s ease-in-out infinite',
      flexShrink: 0,
      ...style,
    }} />
  );
};

// ── EmptyState ────────────────────────────────────────────────
export const EmptyState = ({ icon = '✨', title, message, action }) => {
  const { isDark } = useTheme();
  return (
    <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', animation: 'float 3s ease-in-out infinite' }}>{icon}</div>
      <p style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '1rem', color: isDark ? '#e8e6ff' : '#1a1a2e', marginBottom: '0.4rem' }}>{title}</p>
      <p style={{ fontSize: '0.85rem', opacity: 0.55, lineHeight: 1.5, marginBottom: action ? '1.25rem' : 0 }}>{message}</p>
      {action}
    </div>
  );
};

// ── Badge ─────────────────────────────────────────────────────
const BADGE_COLORS = {
  purple:  { bg: 'rgba(108,99,255,0.12)', border: 'rgba(108,99,255,0.25)', text: '#6c63ff' },
  teal:    { bg: 'rgba(78,205,196,0.12)',  border: 'rgba(78,205,196,0.25)',  text: '#4ecdc4' },
  red:     { bg: 'rgba(255,107,107,0.12)', border: 'rgba(255,107,107,0.25)', text: '#ff6b6b' },
  amber:   { bg: 'rgba(247,197,159,0.2)',  border: 'rgba(247,197,159,0.4)',  text: '#c4854a' },
  green:   { bg: 'rgba(168,230,207,0.2)',  border: 'rgba(168,230,207,0.4)',  text: '#3d9970' },
  default: { bg: 'rgba(128,128,128,0.1)',  border: 'rgba(128,128,128,0.2)',  text: 'inherit' },
};

export const Badge = ({ children, color = 'purple', style }) => {
  const c = BADGE_COLORS[color] ?? BADGE_COLORS.default;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.2rem 0.65rem', borderRadius: '9999px',
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.text, fontSize: '0.75rem', fontWeight: 600,
      whiteSpace: 'nowrap', ...style,
    }}>{children}</span>
  );
};

// ── SectionHeader ─────────────────────────────────────────────
export const SectionHeader = ({ title, subtitle, action, style }) => {
  const { isDark } = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', ...style }}>
      <div>
        <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.05rem', fontWeight: 700, color: isDark ? '#e8e6ff' : '#1a1a2e', margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: '0.8rem', opacity: 0.55, margin: '0.2rem 0 0' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
};

// ── Divider ───────────────────────────────────────────────────
export const Divider = ({ style }) => {
  const { isDark } = useTheme();
  return <hr style={{ border: 'none', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.09)'}`, margin: '1rem 0', ...style }} />;
};

// ── Pill button ───────────────────────────────────────────────
export const PillButton = ({ children, onClick, id, variant = 'ghost', disabled, style }) => {
  const { isDark } = useTheme();
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.45rem 1.1rem', borderRadius: '9999px',
    fontSize: '0.825rem', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', transition: 'all 0.2s ease', opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    ghost: { background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.07)', color: isDark ? 'rgba(232,230,255,0.8)' : '#6c63ff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.18)'}` },
    primary: { background: 'linear-gradient(135deg,#6c63ff,#5a4fd9)', color: '#fff', boxShadow: '0 3px 14px rgba(108,99,255,0.35)' },
  };
  return (
    <button id={id} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
};
