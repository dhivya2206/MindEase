/**
 * constants/moods.js
 * Single source of truth for mood metadata — Part 6.
 * Import from here everywhere; never hard-code mood strings.
 */

export const MOOD_META = Object.freeze({
  happy:    { emoji: '😊', label: 'Happy',    color: '#f7c59f', gradient: 'linear-gradient(135deg,#f7c59f,#fde68a)', category: 'positive' },
  excited:  { emoji: '🤩', label: 'Excited',  color: '#6c63ff', gradient: 'linear-gradient(135deg,#6c63ff,#a78bfa)', category: 'positive' },
  calm:     { emoji: '😌', label: 'Calm',     color: '#4ecdc4', gradient: 'linear-gradient(135deg,#4ecdc4,#6ee7b7)', category: 'positive' },
  neutral:  { emoji: '😐', label: 'Neutral',  color: '#94a3b8', gradient: 'linear-gradient(135deg,#94a3b8,#cbd5e1)', category: 'neutral'  },
  tired:    { emoji: '😴', label: 'Tired',    color: '#7c6f9f', gradient: 'linear-gradient(135deg,#7c6f9f,#a78bfa)', category: 'neutral'  },
  sad:      { emoji: '😔', label: 'Sad',      color: '#60a5fa', gradient: 'linear-gradient(135deg,#60a5fa,#93c5fd)', category: 'negative' },
  anxious:  { emoji: '😰', label: 'Anxious',  color: '#fb923c', gradient: 'linear-gradient(135deg,#fb923c,#fbbf24)', category: 'negative' },
  stressed: { emoji: '😤', label: 'Stressed', color: '#ff6b6b', gradient: 'linear-gradient(135deg,#ff6b6b,#f87171)', category: 'negative' },
  angry:    { emoji: '😡', label: 'Angry',    color: '#ef4444', gradient: 'linear-gradient(135deg,#ef4444,#dc2626)', category: 'negative' },
});

export const MOOD_KEYS  = Object.keys(MOOD_META);
export const MOOD_ORDER = ['happy', 'excited', 'calm', 'neutral', 'tired', 'sad', 'anxious', 'stressed', 'angry'];

/** Chart-friendly colour array in MOOD_ORDER */
export const MOOD_CHART_COLORS = MOOD_ORDER.map(k => MOOD_META[k].color);

/** Returns metadata for a mood key, or a fallback if unknown */
export const getMoodMeta = (mood) =>
  MOOD_META[mood] ?? { emoji: '❓', label: mood, color: '#94a3b8', gradient: 'linear-gradient(135deg,#94a3b8,#cbd5e1)', category: 'neutral' };

/** Intensity label map */
export const INTENSITY_LABELS = {
  1: 'Very mild',
  2: 'Mild',
  3: 'Moderate',
  4: 'Strong',
  5: 'Very strong',
};
