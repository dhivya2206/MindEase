/**
 * pages/counsellor/CounsellorProfilePage.jsx
 * Counsellor profile view + edit — Part 15.
 *
 * Features:
 * - View current profile (all fields)
 * - Edit profile with inline form
 * - Manage availability slots
 * - Upload profile image (base64 preview + save)
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import * as counsellorService from '../../services/counsellorService';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SPECIALIZATIONS = [
  'Anxiety & Stress Management',
  'Depression & Mood Disorders',
  'Trauma & PTSD',
  'Relationship Counselling',
  'Grief & Loss',
  'Addiction & Substance Abuse',
  'Career & Life Coaching',
  'Child & Adolescent Therapy',
  'Family Therapy',
  'Cognitive Behavioural Therapy (CBT)',
  'Mindfulness & Meditation',
  'Sleep Disorders',
  'Other',
];

const inputStyle = (isDark) => ({
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '0.75rem',
  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.2)'}`,
  background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
  color: isDark ? '#e8e6ff' : '#1a1a2e',
  fontSize: '0.9rem',
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: "'Inter', sans-serif",
});

const labelStyle = (isDark) => ({
  fontSize: '0.8rem',
  fontWeight: 600,
  color: isDark ? 'rgba(232,230,255,0.6)' : 'rgba(26,26,46,0.5)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  marginBottom: '0.4rem',
  display: 'block',
});

const StatusBadge = ({ status }) => {
  const colors = {
    active:   { bg: 'rgba(78,205,196,0.15)', color: '#4ecdc4', dot: '#4ecdc4' },
    inactive: { bg: 'rgba(255,107,107,0.15)', color: '#ff6b6b', dot: '#ff6b6b' },
  };
  const s = colors[status] || colors.inactive;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', background: s.bg, color: s.color, fontSize: '0.78rem', fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
      {status === 'active' ? 'Active' : 'Inactive'}
    </span>
  );
};

const CounsellorProfilePage = () => {
  const { isDark } = useTheme();
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef(null);

  // Form state
  const [form, setForm] = useState({
    name: user?.name || '',
    specialization: '',
    experience: '',
    description: '',
    location: '',
    availability: [],
    profileImage: null,
  });

  // ── Load profile ────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const p = await counsellorService.getMyProfile();
        setProfile(p);
        if (p) {
          setForm({
            name: p.user?.name || user?.name || '',
            specialization: p.specialization || '',
            experience: p.experience ?? '',
            description: p.description || '',
            location: p.location || '',
            availability: p.availability || [],
            profileImage: p.profileImage || null,
          });
        } else {
          // No profile yet — show edit form immediately
          setForm(prev => ({ ...prev, name: user?.name || '' }));
          setIsEditing(true);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── Form handlers ───────────────────────────────────────────────────────────
  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => handleChange('profileImage', ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    handleChange('profileImage', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Availability ────────────────────────────────────────────────────────────
  const addAvailabilitySlot = () => {
    setForm(prev => ({
      ...prev,
      availability: [...prev.availability, { day: 'Monday', startTime: '09:00', endTime: '17:00' }],
    }));
  };

  const updateSlot = (idx, field, value) => {
    setForm(prev => {
      const slots = [...prev.availability];
      slots[idx] = { ...slots[idx], [field]: value };
      return { ...prev, availability: slots };
    });
  };

  const removeSlot = (idx) => {
    setForm(prev => ({
      ...prev,
      availability: prev.availability.filter((_, i) => i !== idx),
    }));
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setError(null);
    setSuccessMsg('');
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        experience: Number(form.experience),
      };
      const saved = await counsellorService.upsertProfile(payload);
      setProfile(saved);
      if (saved?.user?.name) {
        updateUser({ name: saved.user.name });
      }
      setIsEditing(false);
      setSuccessMsg('Profile saved successfully! ✓');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        name: profile.user?.name || user?.name || '',
        specialization: profile.specialization || '',
        experience: profile.experience ?? '',
        description: profile.description || '',
        location: profile.location || '',
        availability: profile.availability || [],
        profileImage: profile.profileImage || null,
      });
    }
    setIsEditing(false);
    setError(null);
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const bg = isDark ? 'linear-gradient(135deg, #0f0e1a, #1a1830)' : 'linear-gradient(135deg, #f8f7ff, #edf8f5)';
  const cardBg = isDark ? 'rgba(26,24,48,0.9)' : '#fff';
  const cardBorder = isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(108,99,255,0.1)';
  const textPrimary = isDark ? '#e8e6ff' : '#1a1a2e';
  const textSecondary = isDark ? 'rgba(232,230,255,0.55)' : 'rgba(26,26,46,0.5)';

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⚙️</div>
          <p style={{ color: textSecondary }}>Loading profile…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const displayImage = isEditing ? form.profileImage : profile?.profileImage;
  const displayName = (isEditing ? form.name : (profile?.user?.name || user?.name)) || 'Counsellor';

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Top bar navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link to="/dashboard/counsellor" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#4ecdc4', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
            ← Back to Dashboard
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/dashboard/counsellor/appointments" style={{ padding: '0.45rem 1rem', borderRadius: '9999px', background: 'rgba(78,205,196,0.12)', border: '1px solid rgba(78,205,196,0.3)', color: '#4ecdc4', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
              📅 View Appointments
            </Link>
          </div>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '1.75rem', animation: 'fadeInUp 0.4s ease' }}>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: textPrimary, margin: 0 }}>
            My Profile
          </h1>
          <p style={{ color: textSecondary, fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Manage your professional information visible to clients
          </p>
        </div>

        {/* Error & Success */}
        {error && (
          <div style={{ padding: '0.9rem 1.2rem', borderRadius: '0.75rem', background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b', fontSize: '0.875rem', marginBottom: '1.25rem', animation: 'fadeInUp 0.3s ease' }}>
            ⚠️ {error}
          </div>
        )}
        {successMsg && (
          <div style={{ padding: '0.9rem 1.2rem', borderRadius: '0.75rem', background: 'rgba(78,205,196,0.12)', border: '1px solid rgba(78,205,196,0.3)', color: '#4ecdc4', fontSize: '0.875rem', marginBottom: '1.25rem', animation: 'fadeInUp 0.3s ease' }}>
            {successMsg}
          </div>
        )}

        {/* Profile card */}
        <div style={{ background: cardBg, borderRadius: '1.5rem', border: cardBorder, boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.35)' : '0 8px 40px rgba(108,99,255,0.08)', overflow: 'hidden', animation: 'fadeInUp 0.5s ease' }}>

          {/* Profile image + identity bar */}
          <div style={{ background: 'linear-gradient(135deg, #4ecdc4, #6c63ff)', padding: '2rem', display: 'flex', alignItems: 'flex-end', gap: '1.5rem', flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -30, left: '40%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {displayImage ? (
                <img
                  src={displayImage}
                  alt="Profile"
                  style={{ width: 96, height: 96, borderRadius: '1.25rem', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.4)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
                />
              ) : (
                <div style={{ width: 96, height: 96, borderRadius: '1.25rem', background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                  👤
                </div>
              )}
              {isEditing && (
                <button
                  id="counsellor-profile-upload-image"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ position: 'absolute', bottom: -8, right: -8, width: 30, height: 30, borderRadius: '50%', background: '#6c63ff', border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}
                  title="Upload photo"
                >
                  📷
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            </div>

            {/* Name & role */}
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', fontWeight: 800, color: '#fff' }}>
                {displayName}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {profile?.specialization || (isEditing ? 'Complete your profile below' : 'No specialization set')}
              </div>
              {profile && <div style={{ marginTop: '0.5rem' }}><StatusBadge status={profile.isActive ? 'active' : 'inactive'} /></div>}
            </div>

            {/* Edit / Save buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
              {isEditing ? (
                <>
                  {profile && (
                    <button id="counsellor-profile-cancel" onClick={handleCancel} style={{ padding: '0.55rem 1.2rem', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.4)', background: 'transparent', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  )}
                  <button
                    id="counsellor-profile-save"
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{ padding: '0.55rem 1.5rem', borderRadius: '9999px', border: 'none', background: '#fff', color: '#6c63ff', fontWeight: 700, fontSize: '0.85rem', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1 }}
                  >
                    {isSaving ? 'Saving…' : '✓ Save'}
                  </button>
                </>
              ) : (
                <button
                  id="counsellor-profile-edit"
                  onClick={() => setIsEditing(true)}
                  style={{ padding: '0.55rem 1.5rem', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  ✏️ Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Profile fields */}
          <div style={{ padding: '2rem' }}>
            {isEditing ? (
              // ── Edit Form ─────────────────────────────────────────────────
              <div style={{ display: 'grid', gap: '1.25rem' }}>

                {/* Image remove button (only if image exists) */}
                {form.profileImage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src={form.profileImage} alt="Preview" style={{ width: 48, height: 48, borderRadius: '0.5rem', objectFit: 'cover' }} />
                    <span style={{ fontSize: '0.85rem', color: textSecondary }}>Profile photo selected</span>
                    <button onClick={removeImage} id="counsellor-profile-remove-image" style={{ marginLeft: 'auto', padding: '0.3rem 0.8rem', borderRadius: '9999px', border: '1px solid rgba(255,107,107,0.4)', background: 'transparent', color: '#ff6b6b', fontSize: '0.8rem', cursor: 'pointer' }}>
                      Remove
                    </button>
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label style={labelStyle(isDark)}>Full Name *</label>
                  <input
                    id="counsellor-profile-name"
                    type="text"
                    value={form.name}
                    onChange={e => handleChange('name', e.target.value)}
                    placeholder="e.g. Dr. Jane Smith"
                    style={inputStyle(isDark)}
                    required
                  />
                </div>

                {/* Specialization */}
                <div>
                  <label style={labelStyle(isDark)}>Specialization *</label>
                  <select
                    id="counsellor-profile-specialization"
                    value={form.specialization}
                    onChange={e => handleChange('specialization', e.target.value)}
                    style={{ ...inputStyle(isDark), cursor: 'pointer' }}
                  >
                    <option value="">Select specialization…</option>
                    {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Experience */}
                <div>
                  <label style={labelStyle(isDark)}>Years of Experience *</label>
                  <input
                    id="counsellor-profile-experience"
                    type="number"
                    min={0}
                    max={60}
                    value={form.experience}
                    onChange={e => handleChange('experience', e.target.value)}
                    placeholder="e.g. 5"
                    style={inputStyle(isDark)}
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={labelStyle(isDark)}>About / Description *</label>
                  <textarea
                    id="counsellor-profile-description"
                    value={form.description}
                    onChange={e => handleChange('description', e.target.value)}
                    rows={4}
                    placeholder="Describe your approach, qualifications, and what clients can expect…"
                    style={{ ...inputStyle(isDark), resize: 'vertical', lineHeight: 1.6 }}
                  />
                  <div style={{ fontSize: '0.75rem', color: textSecondary, marginTop: '0.25rem', textAlign: 'right' }}>
                    {form.description.length} / 1000
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label style={labelStyle(isDark)}>Location (optional)</label>
                  <input
                    id="counsellor-profile-location"
                    type="text"
                    value={form.location}
                    onChange={e => handleChange('location', e.target.value)}
                    placeholder="e.g. Mumbai, India or Online Only"
                    style={inputStyle(isDark)}
                  />
                </div>

                {/* Availability */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <label style={{ ...labelStyle(isDark), margin: 0 }}>Availability Slots</label>
                    <button
                      id="counsellor-profile-add-slot"
                      onClick={addAvailabilitySlot}
                      style={{ padding: '0.35rem 0.9rem', borderRadius: '9999px', border: '1px solid rgba(78,205,196,0.4)', background: 'rgba(78,205,196,0.1)', color: '#4ecdc4', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      + Add Slot
                    </button>
                  </div>

                  {form.availability.length === 0 && (
                    <p style={{ color: textSecondary, fontSize: '0.85rem', fontStyle: 'italic' }}>No availability slots added yet.</p>
                  )}

                  <div style={{ display: 'grid', gap: '0.6rem' }}>
                    {form.availability.map((slot, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center', padding: '0.75rem', borderRadius: '0.75rem', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(108,99,255,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(108,99,255,0.08)' }}>
                        <select
                          value={slot.day}
                          onChange={e => updateSlot(idx, 'day', e.target.value)}
                          style={{ ...inputStyle(isDark), padding: '0.5rem 0.6rem', fontSize: '0.82rem', cursor: 'pointer' }}
                        >
                          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <input type="time" value={slot.startTime} onChange={e => updateSlot(idx, 'startTime', e.target.value)} style={{ ...inputStyle(isDark), padding: '0.5rem 0.6rem', fontSize: '0.82rem' }} />
                        <input type="time" value={slot.endTime} onChange={e => updateSlot(idx, 'endTime', e.target.value)} style={{ ...inputStyle(isDark), padding: '0.5rem 0.6rem', fontSize: '0.82rem' }} />
                        <button onClick={() => removeSlot(idx)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,107,107,0.35)', background: 'transparent', color: '#ff6b6b', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // ── View Mode ─────────────────────────────────────────────────
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {!profile ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                    <h2 style={{ fontFamily: "'Outfit', sans-serif", color: textPrimary, marginBottom: '0.5rem' }}>No Profile Yet</h2>
                    <p style={{ color: textSecondary, fontSize: '0.9rem' }}>Create your professional profile to get started.</p>
                  </div>
                ) : (
                  <>
                    {/* Info grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                      {[
                        { icon: '🎯', label: 'Specialization', value: profile.specialization },
                        { icon: '⏱️', label: 'Experience', value: `${profile.experience} year${profile.experience !== 1 ? 's' : ''}` },
                        { icon: '📍', label: 'Location', value: profile.location || 'Not specified' },
                        { icon: '📅', label: 'Member Since', value: new Date(profile.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) },
                      ].map(({ icon, label, value }) => (
                        <div key={label} style={{ padding: '1rem 1.25rem', borderRadius: '1rem', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(108,99,255,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(108,99,255,0.08)' }}>
                          <div style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>{icon}</div>
                          <div style={{ fontSize: '0.75rem', color: textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>{label}</div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: textPrimary }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Description */}
                    <div>
                      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1rem', fontWeight: 700, color: textPrimary, marginBottom: '0.6rem' }}>About</h3>
                      <p style={{ color: textSecondary, lineHeight: 1.7, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{profile.description}</p>
                    </div>

                    {/* Availability */}
                    <div>
                      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1rem', fontWeight: 700, color: textPrimary, marginBottom: '0.75rem' }}>
                        Availability
                      </h3>
                      {profile.availability?.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {profile.availability.map((slot, i) => (
                            <div key={i} style={{ padding: '0.45rem 1rem', borderRadius: '9999px', background: isDark ? 'rgba(78,205,196,0.1)' : 'rgba(78,205,196,0.08)', border: '1px solid rgba(78,205,196,0.25)', fontSize: '0.82rem', color: '#4ecdc4', fontWeight: 500 }}>
                              {slot.day} · {slot.startTime}–{slot.endTime}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: textSecondary, fontSize: '0.85rem', fontStyle: 'italic' }}>No availability slots set.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default CounsellorProfilePage;
