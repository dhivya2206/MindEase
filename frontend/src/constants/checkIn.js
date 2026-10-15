/**
 * constants/checkIn.js
 * Metadata for check-in questions and score ranges — Part 7.
 * Single source of truth for labels, icons, and score colours.
 */

export const QUESTIONS = Object.freeze([
  {
    key:          'sleep',
    label:        'Sleep Quality',
    icon:         '🌙',
    question:     'How well did you sleep last night?',
    lowLabel:     'Very poorly',
    highLabel:    'Very well',
    color:        '#7c6f9f',
    inverted:     false, // higher is better
    description:  'Rate the quality and duration of your sleep.',
  },
  {
    key:          'energy',
    label:        'Energy Level',
    icon:         '⚡',
    question:     'How energetic do you feel today?',
    lowLabel:     'Exhausted',
    highLabel:    'Very energetic',
    color:        '#f7c59f',
    inverted:     false,
    description:  'Rate your overall energy and vitality right now.',
  },
  {
    key:          'stress',
    label:        'Stress Level',
    icon:         '🌊',
    question:     'How stressed do you feel today?',
    lowLabel:     'Not at all',
    highLabel:    'Extremely stressed',
    color:        '#ff6b6b',
    inverted:     true, // higher stress = lower wellness
    description:  'Rate your current stress level (lower is better for your score).',
  },
  {
    key:          'positivity',
    label:        'Positivity',
    icon:         '☀️',
    question:     'How positive do you feel about your day?',
    lowLabel:     'Very negative',
    highLabel:    'Very positive',
    color:        '#4ecdc4',
    inverted:     false,
    description:  'Rate your overall mood and outlook for the day.',
  },
  {
    key:          'focus',
    label:        'Focus',
    icon:         '🎯',
    question:     'How focused and clear-headed do you feel?',
    lowLabel:     'Very scattered',
    highLabel:    'Laser focused',
    color:        '#6c63ff',
    inverted:     false,
    description:  'Rate your ability to concentrate and stay on task.',
  },
]);

// ── Score metadata ────────────────────────────────────────────
export const SCORE_RANGES = Object.freeze([
  { min: 80, max: 100, label: 'Thriving',   color: '#4ecdc4', icon: '🌟', description: 'You\'re in great shape today! Keep it up.' },
  { min: 60, max: 79,  label: 'Good',       color: '#a8e6cf', icon: '😊', description: 'You\'re doing well. A few things to keep an eye on.' },
  { min: 40, max: 59,  label: 'Fair',       color: '#f7c59f', icon: '😐', description: 'Room for improvement. Try a short wellness activity.' },
  { min: 20, max: 39,  label: 'Struggling', color: '#ff6b6b', icon: '😔', description: 'Take it easy today. Small steps can help.' },
]);

export const getScoreRange = (score) =>
  SCORE_RANGES.find(r => score >= r.min && score <= r.max) ?? SCORE_RANGES[SCORE_RANGES.length - 1];

// ── Score formula labels ──────────────────────────────────────
export const SCORE_FORMULA_STEPS = Object.freeze([
  { label: 'Sleep',          op: '+' },
  { label: 'Energy',         op: '+' },
  { label: '(6 − Stress)',   op: '+', note: 'inverted' },
  { label: 'Positivity',     op: '+' },
  { label: 'Focus',          op: '=' },
]);
