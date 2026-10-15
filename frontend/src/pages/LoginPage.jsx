/**
 * pages/LoginPage.jsx
 * Login form — Part 3.
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// ── Reusable form field component ─────────────────────────────
const Field = ({ id, label, type = 'text', value, onChange, placeholder, error, isDark }) => (
  <div style={{ marginBottom: '1.25rem' }}>
    <label htmlFor={id} style={{
      display: 'block', fontSize: '0.85rem', fontWeight: 600,
      marginBottom: '0.4rem', color: isDark ? 'rgba(232,230,255,0.8)' : 'rgba(26,26,46,0.8)',
    }}>
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={type === 'password' ? 'current-password' : 'email'}
      style={{
        width: '100%', padding: '0.75rem 1rem', borderRadius: '12px',
        border: `1.5px solid ${error ? '#ff6b6b' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.2)'}`,
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.03)',
        color: isDark ? '#e8e6ff' : '#1a1a2e',
        fontSize: '0.95rem', outline: 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        boxSizing: 'border-box',
      }}
      onFocus={e => e.target.style.borderColor = '#6c63ff'}
      onBlur={e => e.target.style.borderColor = error ? '#ff6b6b' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.2)')}
    />
    {error && <p style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.35rem' }}>{error}</p>}
  </div>
);

const LoginPage = () => {
  const { login, dashboardPath } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || dashboardPath;

  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
    setServerError('');
  };

  const validate = () => {
    const errors = {};
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Enter a valid email';
    if (!form.password) errors.password = 'Password is required';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }

    setIsSubmitting(true);
    setServerError('');
    try {
      await login({ email: form.email, password: form.password });
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👋</div>
        <h1 style={{
          fontFamily: "'Outfit', sans-serif", fontSize: '1.75rem', fontWeight: 800,
          color: isDark ? '#e8e6ff' : '#1a1a2e', marginBottom: '0.5rem',
        }}>Welcome back</h1>
        <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>Sign in to continue your wellness journey</p>
      </div>

      {/* Server error alert */}
      {serverError && (
        <div style={{
          padding: '0.8rem 1rem', borderRadius: '10px', marginBottom: '1.25rem',
          background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)',
          color: '#ff6b6b', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          ⚠️ {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Field id="login-email" label="Email address" type="email"
          value={form.email} onChange={update('email')}
          placeholder="you@example.com" error={fieldErrors.email} isDark={isDark} />

        <Field id="login-password" label="Password" type="password"
          value={form.password} onChange={update('password')}
          placeholder="••••••••" error={fieldErrors.password} isDark={isDark} />

        <div style={{ textAlign: 'right', marginTop: '-0.75rem', marginBottom: '1.5rem' }}>
          <Link to="/auth/forgot-password" style={{ fontSize: '0.825rem', color: '#6c63ff', textDecoration: 'none' }}>
            Forgot password?
          </Link>
        </div>

        <button
          id="login-submit-btn"
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%', padding: '0.85rem', borderRadius: '12px', border: 'none',
            background: isSubmitting
              ? 'rgba(108,99,255,0.5)'
              : 'linear-gradient(135deg, #6c63ff, #5a4fd9)',
            color: '#fff', fontWeight: 700, fontSize: '1rem',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'all 0.25s ease',
            boxShadow: isSubmitting ? 'none' : '0 4px 20px rgba(108,99,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          }}
        >
          {isSubmitting ? (
            <>
              <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              Signing in…
            </>
          ) : 'Sign In →'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem', opacity: 0.7 }}>
        Don&apos;t have an account?{' '}
        <Link to="/auth/signup" style={{ color: '#6c63ff', fontWeight: 600, textDecoration: 'none' }}>
          Create one free
        </Link>
      </p>
    </>
  );
};

export default LoginPage;
