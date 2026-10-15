/**
 * pages/SignupPage.jsx
 * Registration form — Part 3.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// ── Password strength meter ────────────────────────────────────
const getStrength = (pw) => {
  if (!pw) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: 'Too short', color: '#ff6b6b' },
    { label: 'Weak',      color: '#ff6b6b' },
    { label: 'Fair',      color: '#f7c59f' },
    { label: 'Good',      color: '#4ecdc4' },
    { label: 'Strong',    color: '#4ecdc4' },
    { label: 'Very strong', color: '#6c63ff' },
  ];
  return { score, ...levels[score] };
};

// ── Reusable field ─────────────────────────────────────────────
const Field = ({ id, label, type = 'text', value, onChange, placeholder, error, isDark, hint }) => (
  <div style={{ marginBottom: '1.1rem' }}>
    <label htmlFor={id} style={{
      display: 'block', fontSize: '0.85rem', fontWeight: 600,
      marginBottom: '0.4rem', color: isDark ? 'rgba(232,230,255,0.8)' : 'rgba(26,26,46,0.8)',
    }}>
      {label}
    </label>
    <input
      id={id} type={type} value={value} onChange={onChange} placeholder={placeholder}
      autoComplete={type === 'password' ? 'new-password' : type === 'email' ? 'email' : 'name'}
      style={{
        width: '100%', padding: '0.7rem 1rem', borderRadius: '12px',
        border: `1.5px solid ${error ? '#ff6b6b' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.2)'}`,
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.03)',
        color: isDark ? '#e8e6ff' : '#1a1a2e',
        fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s ease', boxSizing: 'border-box',
      }}
      onFocus={e => e.target.style.borderColor = '#6c63ff'}
      onBlur={e => e.target.style.borderColor = error ? '#ff6b6b' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.2)')}
    />
    {hint && !error && <p style={{ color: '#4ecdc4', fontSize: '0.78rem', marginTop: '0.3rem' }}>{hint}</p>}
    {error && <p style={{ color: '#ff6b6b', fontSize: '0.78rem', marginTop: '0.3rem' }}>{error}</p>}
  </div>
);

const SignupPage = () => {
  const { register, dashboardPath } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const strength = getStrength(form.password);

  const update = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
    setServerError('');
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    else if (form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Enter a valid email';
    if (!form.password) errors.password = 'Password is required';
    else if (form.password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (!form.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }

    setIsSubmitting(true);
    setServerError('');
    try {
      await register(form);
      navigate(dashboardPath, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{ fontSize: '2.2rem', marginBottom: '0.65rem' }}>🌱</div>
        <h1 style={{
          fontFamily: "'Outfit', sans-serif", fontSize: '1.65rem', fontWeight: 800,
          color: isDark ? '#e8e6ff' : '#1a1a2e', marginBottom: '0.4rem',
        }}>Start your journey</h1>
        <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>Free forever · No credit card needed</p>
      </div>

      {serverError && (
        <div style={{
          padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.1rem',
          background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)',
          color: '#ff6b6b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          ⚠️ {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Field id="signup-name" label="Full name"
          value={form.name} onChange={update('name')}
          placeholder="Divya Sharma" error={fieldErrors.name} isDark={isDark} />

        <Field id="signup-email" label="Email address" type="email"
          value={form.email} onChange={update('email')}
          placeholder="you@example.com" error={fieldErrors.email} isDark={isDark} />

        <Field id="signup-password" label="Password" type="password"
          value={form.password} onChange={update('password')}
          placeholder="Min. 8 characters" error={fieldErrors.password} isDark={isDark} />

        {/* Strength meter */}
        {form.password && (
          <div style={{ marginTop: '-0.6rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{
                  flex: 1, height: 3, borderRadius: '9999px',
                  background: i <= strength.score ? strength.color : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
                  transition: 'background 0.3s ease',
                }} />
              ))}
            </div>
            <span style={{ fontSize: '0.75rem', color: strength.color }}>{strength.label}</span>
          </div>
        )}

        <Field id="signup-confirm" label="Confirm password" type="password"
          value={form.confirmPassword} onChange={update('confirmPassword')}
          placeholder="Repeat password"
          error={fieldErrors.confirmPassword}
          hint={form.confirmPassword && form.password === form.confirmPassword ? '✓ Passwords match' : ''}
          isDark={isDark} />

        <button
          id="signup-submit-btn"
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%', padding: '0.85rem', borderRadius: '12px', border: 'none',
            background: isSubmitting ? 'rgba(108,99,255,0.5)' : 'linear-gradient(135deg, #6c63ff, #5a4fd9)',
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
              Creating account…
            </>
          ) : 'Create Account 🚀'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', opacity: 0.7 }}>
        Already have an account?{' '}
        <Link to="/auth/login" style={{ color: '#6c63ff', fontWeight: 600, textDecoration: 'none' }}>
          Sign in
        </Link>
      </p>

      <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', opacity: 0.4 }}>
        By creating an account you agree to our Terms & Privacy Policy
      </p>
    </>
  );
};

export default SignupPage;
