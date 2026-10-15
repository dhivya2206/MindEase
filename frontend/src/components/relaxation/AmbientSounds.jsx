/**
 * components/relaxation/AmbientSounds.jsx
 * Ambient sound generator — Part 12.
 *
 * All sounds are synthesized entirely with the Web Audio API.
 * NO external audio files, NO copyrighted music.
 *
 * Sound engines:
 *   🌧 Rain      — filtered white noise
 *   🌊 Ocean     — low-frequency white noise with slow LFO
 *   🔥 Campfire  — brown noise (1/f²) with crackle
 *   🍃 Forest    — mid-frequency noise with chirp LFO
 *   🎵 Om Drone  — pure sine harmonic stack (432 Hz)
 *   🌌 Space     — very slow sine sweeps
 *
 * Features:
 *   - Per-sound volume slider
 *   - Mix multiple sounds simultaneously
 *   - Session timer with auto-stop
 *   - onComplete callback
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

// ── Sound definitions ─────────────────────────────────────────
const SOUNDS = [
  { id: 'rain',     label: 'Rain',     emoji: '🌧',  color: '#6c63ff', desc: 'Filtered white noise simulating rainfall' },
  { id: 'ocean',    label: 'Ocean',    emoji: '🌊',  color: '#4ecdc4', desc: 'Low rumble with slow wave-like oscillation' },
  { id: 'campfire', label: 'Campfire', emoji: '🔥',  color: '#f7c59f', desc: 'Brown noise with irregular crackle' },
  { id: 'forest',   label: 'Forest',   emoji: '🍃',  color: '#a8e6cf', desc: 'Mid-range breeze with gentle bird tones' },
  { id: 'om',       label: 'Om Drone', emoji: '🎵',  color: '#dda0dd', desc: '432 Hz harmonic stack — deeply calming' },
  { id: 'space',    label: 'Space',    emoji: '🌌',  color: '#7c6f9f', desc: 'Slow sine sweeps for deep meditation' },
];

const TIMER_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60]; // minutes, 0 = off

// ── Web Audio engine factory ──────────────────────────────────
class SoundEngine {
  constructor() {
    this.ctx  = null;
    this.nodes = {};   // soundId → { gainNode, sources }
  }

  _ensureCtx() {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  // White noise buffer
  _makeNoise(ctx, seconds = 4, type = 'white') {
    const rate   = ctx.sampleRate;
    const frames = Math.ceil(rate * seconds);
    const buf    = ctx.createBuffer(1, frames, rate);
    const data   = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < frames; i++) {
      const white = (Math.random() * 2 - 1);
      if (type === 'brown') {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      } else {
        data[i] = white;
      }
    }
    return buf;
  }

  // ── RAIN ───────────────────────────────────────────────────
  _startRain(vol) {
    const ctx    = this.ctx;
    const master = ctx.createGain();
    master.gain.value = vol;
    master.connect(ctx.destination);

    const buf = this._makeNoise(ctx, 4, 'white');
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 1200; filter.Q.value = 0.5;
    src.connect(filter); filter.connect(master);
    src.start();
    return { gainNode: master, sources: [src] };
  }

  // ── OCEAN ──────────────────────────────────────────────────
  _startOcean(vol) {
    const ctx    = this.ctx;
    const master = ctx.createGain();
    master.gain.value = vol;
    master.connect(ctx.destination);

    const buf = this._makeNoise(ctx, 8, 'brown');
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;

    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 80;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';  lp.frequency.value = 600;

    // LFO for wave motion
    const lfo  = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lGain = ctx.createGain(); lGain.gain.value = 0.5;
    lfo.connect(lGain); lGain.connect(master.gain);
    lfo.start();

    src.connect(hp); hp.connect(lp); lp.connect(master);
    src.start();
    return { gainNode: master, sources: [src, lfo] };
  }

  // ── CAMPFIRE ───────────────────────────────────────────────
  _startCampfire(vol) {
    const ctx    = this.ctx;
    const master = ctx.createGain();
    master.gain.value = vol;
    master.connect(ctx.destination);

    const buf = this._makeNoise(ctx, 6, 'brown');
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;

    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;

    // Irregular crackle via fast LFO with random
    const lfo = ctx.createOscillator(); lfo.frequency.value = 4;
    const lGain = ctx.createGain(); lGain.gain.value = 0.25;
    lfo.connect(lGain); lGain.connect(master.gain);
    lfo.start();

    src.connect(lp); lp.connect(master);
    src.start();
    return { gainNode: master, sources: [src, lfo] };
  }

  // ── FOREST ────────────────────────────────────────────────
  _startForest(vol) {
    const ctx    = this.ctx;
    const master = ctx.createGain();
    master.gain.value = vol;
    master.connect(ctx.destination);

    const buf = this._makeNoise(ctx, 5, 'white');
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;

    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3000; bp.Q.value = 2;

    // Gentle birdsong: two oscillators with slow frequency drift
    const bird1 = ctx.createOscillator(); bird1.frequency.value = 1800;
    const bird2 = ctx.createOscillator(); bird2.frequency.value = 2200;
    const bGain = ctx.createGain(); bGain.gain.value = 0.015;
    const bLfo  = ctx.createOscillator(); bLfo.frequency.value = 0.3;
    const bLGain = ctx.createGain(); bLGain.gain.value = 0.01;
    bLfo.connect(bLGain); bLGain.connect(bGain.gain);
    bird1.connect(bGain); bird2.connect(bGain); bGain.connect(master);
    bird1.start(); bird2.start(); bLfo.start();

    src.connect(bp); bp.connect(master);
    src.start();
    return { gainNode: master, sources: [src, bird1, bird2, bLfo] };
  }

  // ── OM DRONE ──────────────────────────────────────────────
  _startOm(vol) {
    const ctx    = this.ctx;
    const master = ctx.createGain();
    master.gain.value = vol;
    master.connect(ctx.destination);

    const freqs = [108, 216, 432, 648, 864]; // harmonic series from 108 Hz
    const oscs  = freqs.map((f, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 0 ? 'sine' : 'sine';
      osc.frequency.value = f;
      gain.gain.value = 0.08 / (i + 1);     // fade harmonics
      osc.connect(gain); gain.connect(master);
      osc.start();
      return osc;
    });
    return { gainNode: master, sources: oscs };
  }

  // ── SPACE ─────────────────────────────────────────────────
  _startSpace(vol) {
    const ctx    = this.ctx;
    const master = ctx.createGain();
    master.gain.value = vol;
    master.connect(ctx.destination);

    const layers = [
      { base: 60, speed: 0.03 },
      { base: 80, speed: 0.05 },
      { base: 50, speed: 0.02 },
    ];

    const oscs = layers.map(({ base, speed }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      const lfo  = ctx.createOscillator();
      const lGain = ctx.createGain();

      osc.type = 'sine'; osc.frequency.value = base;
      lfo.frequency.value = speed;
      lGain.gain.value = 0.03;
      gain.gain.value  = 0.06;

      lfo.connect(lGain); lGain.connect(gain.gain);
      osc.connect(gain); gain.connect(master);
      osc.start(); lfo.start();
      return [osc, lfo];
    });

    return { gainNode: master, sources: oscs.flat() };
  }

  start(id, vol = 0.4) {
    if (this.nodes[id]) return; // already running
    this._ensureCtx();
    try {
      const node = this[`_start${id.charAt(0).toUpperCase() + id.slice(1)}`]?.(vol);
      if (node) this.nodes[id] = node;
    } catch {}
  }

  stop(id) {
    const node = this.nodes[id];
    if (!node) return;
    try {
      node.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
      setTimeout(() => {
        node.sources.forEach(s => { try { s.stop?.(); } catch {} });
        try { node.gainNode.disconnect(); } catch {}
        delete this.nodes[id];
      }, 800);
    } catch {
      delete this.nodes[id];
    }
  }

  setVolume(id, vol) {
    const node = this.nodes[id];
    if (!node) return;
    try { node.gainNode.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1); } catch {}
  }

  stopAll() {
    Object.keys(this.nodes).forEach(id => this.stop(id));
  }

  isPlaying(id) {
    return Boolean(this.nodes[id]);
  }
}

// ── singleton engine ──────────────────────────────────────────
const engine = new SoundEngine();

// ─────────────────────────────────────────────────────────────
const AmbientSounds = ({ onComplete }) => {
  const { isDark } = useTheme();
  const textMain  = isDark ? '#e8e6ff' : '#1a1a2e';
  const textMuted = isDark ? 'rgba(232,230,255,0.45)' : 'rgba(26,26,46,0.45)';
  const border    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.09)';

  const [playing,  setPlaying]  = useState({});   // { soundId: true }
  const [volumes,  setVolumes]  = useState(
    Object.fromEntries(SOUNDS.map(s => [s.id, 0.4]))
  );
  const [timerMin,  setTimerMin]  = useState(0);
  const [timerLeft, setTimerLeft] = useState(null); // null = off
  const [startedAt, setStartedAt] = useState(null);

  const timerRef = useRef(null);

  const isAnyPlaying = Object.values(playing).some(Boolean);

  const toggleSound = useCallback((id) => {
    if (playing[id]) {
      engine.stop(id);
      setPlaying(p => ({ ...p, [id]: false }));
    } else {
      engine.start(id, volumes[id]);
      setPlaying(p => ({ ...p, [id]: true }));
    }
  }, [playing, volumes]);

  const setVol = useCallback((id, vol) => {
    setVolumes(v => ({ ...v, [id]: vol }));
    if (playing[id]) engine.setVolume(id, vol);
  }, [playing]);

  const handleStop = useCallback(() => {
    engine.stopAll();
    setPlaying({});
    clearInterval(timerRef.current);
    setTimerLeft(null);
    if (startedAt) {
      const elapsed = Math.round((Date.now() - startedAt) / 1000);
      onComplete?.({ durationSec: elapsed });
      setStartedAt(null);
    }
  }, [startedAt, onComplete]);

  // Auto-stop timer
  useEffect(() => {
    if (!timerMin || !isAnyPlaying) return;
    const totalSec = timerMin * 60;
    setTimerLeft(totalSec);
    let remaining = totalSec;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setTimerLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        handleStop();
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timerMin, isAnyPlaying]); // eslint-disable-line

  // Track session start
  useEffect(() => {
    if (isAnyPlaying && !startedAt) setStartedAt(Date.now());
    if (!isAnyPlaying && startedAt) setStartedAt(null);
  }, [isAnyPlaying]); // eslint-disable-line

  // Cleanup on unmount
  useEffect(() => () => { engine.stopAll(); clearInterval(timerRef.current); }, []);

  const fmtTimer = (sec) =>
    `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Disclaimer */}
      <div style={{ padding: '0.6rem 0.9rem', borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(108,99,255,0.04)', border: `1px solid ${border}`, fontSize: '0.75rem', color: textMuted }}>
        🎵 All sounds are <strong style={{ color: textMain }}>synthesized in your browser</strong> using the Web Audio API. No audio files are downloaded. No copyrighted content.
      </div>

      {/* Sound cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
        {SOUNDS.map(s => {
          const active = Boolean(playing[s.id]);
          return (
            <div key={s.id}
              style={{
                borderRadius: '14px', padding: '1rem',
                background: active ? `${s.color}12` : (isDark ? 'rgba(255,255,255,0.03)' : '#fafafa'),
                border: `1.5px solid ${active ? s.color + '35' : border}`,
                transition: 'all 0.25s ease',
                boxShadow: active ? `0 4px 20px ${s.color}18` : 'none',
              }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                <button
                  id={`ambient-${s.id}-btn`}
                  onClick={() => toggleSound(s.id)}
                  style={{
                    width: 42, height: 42, borderRadius: '12px', border: 'none',
                    background: active ? s.color : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.07)'),
                    fontSize: '1.4rem', cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: active ? `0 3px 14px ${s.color}40` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: active ? 'pulse-glow 3s ease-in-out infinite' : 'none',
                  }}>
                  {s.emoji}
                </button>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: active ? s.color : textMain, transition: 'color 0.2s' }}>{s.label}</div>
                  <div style={{ fontSize: '0.68rem', color: textMuted, lineHeight: 1.4 }}>{s.desc}</div>
                </div>
              </div>

              {/* Volume slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.65rem', color: textMuted, flexShrink: 0 }}>🔇</span>
                <input
                  type="range" min={0} max={1} step={0.05}
                  value={volumes[s.id]}
                  onChange={e => setVol(s.id, +e.target.value)}
                  style={{ flex: 1, accentColor: s.color, cursor: 'pointer', height: 4 }}
                />
                <span style={{ fontSize: '0.65rem', color: textMuted, flexShrink: 0 }}>🔊</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls bar */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', padding: '0.85rem 1rem', borderRadius: '14px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(108,99,255,0.04)', border: `1px solid ${border}` }}>
        {/* Timer */}
        <label style={{ fontSize: '0.8rem', color: textMuted, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          Auto-stop:
          <select value={timerMin} onChange={e => setTimerMin(+e.target.value)}
            style={{ background: isDark ? 'rgba(255,255,255,0.07)' : '#fff', border: `1px solid ${border}`, borderRadius: '6px', padding: '0.2rem 0.5rem', color: textMain, fontSize: '0.8rem' }}>
            {TIMER_OPTIONS.map(m => <option key={m} value={m}>{m === 0 ? 'Off' : `${m} min`}</option>)}
          </select>
        </label>

        {/* Timer countdown */}
        {timerLeft !== null && (
          <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.9rem', color: '#6c63ff' }}>
            ⏱ {fmtTimer(timerLeft)}
          </div>
        )}

        {/* Stop all */}
        {isAnyPlaying && (
          <button onClick={handleStop}
            style={{ marginLeft: 'auto', padding: '0.5rem 1.2rem', borderRadius: '10px', border: 'none', background: 'rgba(255,107,107,0.12)', color: '#ff6b6b', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
            ⏹ Stop All
          </button>
        )}

        {!isAnyPlaying && (
          <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: textMuted }}>
            Tap a sound above to begin
          </span>
        )}
      </div>
    </div>
  );
};

export default AmbientSounds;
