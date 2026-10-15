/**
 * services/recommendationService.js
 * Transparent, rule-based personalized recommendation engine — Part 8.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW IT WORKS (no AI, no ML):
 *   1. buildContext(userId)  — fetches today's check-in + latest mood log
 *   2. applyRules(context)   — evaluates 12 priority-ordered, deterministic rules
 *   3. Returns up to MAX_RECS recommendations, each with a plain-English reason
 *      that explains exactly which data point triggered it.
 *
 * Every recommendation is 100% traceable: { triggerRule, triggerValue, reason }.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Rule priority order (lower number = higher priority):
 *   1.  no_checkin_today     — no daily check-in submitted
 *   2.  stress_high          — stress ≥ 4
 *   3.  stress_moderate      — stress = 3
 *   4.  energy_low           — energy ≤ 2
 *   5.  sleep_poor           — sleep ≤ 2
 *   6.  positivity_low       — positivity ≤ 2
 *   7.  focus_low            — focus ≤ 2
 *   8.  mood_sad_anxious     — last mood ∈ { sad, anxious }
 *   9.  mood_angry           — last mood = angry
 *   10. mood_tired           — last mood = tired
 *   11. thriving             — wellnessScore ≥ 80
 *   12. default_fallback     — always fires if < MAX_RECS recs collected so far
 */

import { CheckIn, todayUTC } from '../models/CheckIn.js';
import { Mood } from '../models/Mood.js';

// ── Constants ─────────────────────────────────────────────────
const MAX_RECS = 5;

// ── Catalogue of all possible recommendations ─────────────────
// Each entry is a template; 'reason' is filled at rule-evaluation time.
const CATALOGUE = {
  checkin_prompt: {
    id:          'rec-checkin-prompt',
    icon:        '📋',
    title:       'Complete Today\'s Check-in',
    category:    'Check-in',
    duration:    '30 sec',
    description: 'Answer 5 quick questions about your sleep, energy, stress, positivity and focus to get a personalised wellness score.',
    color:       '#6c63ff',
    categoryColor: 'purple',
    path:        '/dashboard/user/checkin',
  },

  breathing_478: {
    id:          'rec-breathing-478',
    icon:        '🫁',
    title:       '4-7-8 Breathing Exercise',
    category:    'Breathwork',
    duration:    '5 min',
    description: 'Inhale for 4 s · hold for 7 s · exhale for 8 s. Repeat 4 cycles. A rapid, evidence-based technique for activating your parasympathetic nervous system.',
    color:       '#4ecdc4',
    categoryColor: 'teal',
    path:        '/dashboard/user/meditate',
  },

  body_scan: {
    id:          'rec-body-scan',
    icon:        '🧘',
    title:       'Progressive Body Scan',
    category:    'Meditation',
    duration:    '8 min',
    description: 'Slowly bring attention to each body part from feet to head, releasing tension as you go. Proven to lower cortisol levels and improve mood.',
    color:       '#7c6f9f',
    categoryColor: 'purple',
    path:        '/dashboard/user/meditate',
  },

  relaxation_walk: {
    id:          'rec-relaxation-walk',
    icon:        '🚶',
    title:       'Mindful Outdoor Walk',
    category:    'Movement',
    duration:    '15 min',
    description: 'Leave your phone behind. Walk slowly and notice 5 things you see, 4 you hear, 3 you feel. Recharges energy without caffeine.',
    color:       '#a8e6cf',
    categoryColor: 'green',
    path:        '/dashboard/user/challenges',
  },

  sleep_hygiene: {
    id:          'rec-sleep-hygiene',
    icon:        '🌙',
    title:       'Wind-Down Sleep Routine',
    category:    'Sleep',
    duration:    '20 min',
    description: 'Dim lights an hour before bed, avoid screens for 30 min, and do 5 min of slow breathing. Consistency matters more than duration.',
    color:       '#7c6f9f',
    categoryColor: 'purple',
    path:        '/dashboard/user/meditate',
  },

  gratitude_journal: {
    id:          'rec-gratitude-journal',
    icon:        '💛',
    title:       'Gratitude Journal',
    category:    'Journalling',
    duration:    '10 min',
    description: 'Write 3 specific things you\'re grateful for today — be precise, not generic. Studies show this measurably shifts your mood within days.',
    color:       '#f7c59f',
    categoryColor: 'amber',
    path:        '/dashboard/user/journal',
  },

  pomodoro_focus: {
    id:          'rec-pomodoro-focus',
    icon:        '🎯',
    title:       '25-min Focus Session',
    category:    'Focus',
    duration:    '25 min',
    description: 'Work on one task for 25 minutes, then take a 5-min break. Remove distractions first. The Pomodoro Technique is one of the most researched productivity methods.',
    color:       '#6c63ff',
    categoryColor: 'purple',
    path:        '/dashboard/user/challenges',
  },

  calming_meditation: {
    id:          'rec-calming-meditation',
    icon:        '🕊️',
    title:       'Calming Mindfulness Session',
    category:    'Meditation',
    duration:    '10 min',
    description: 'Sit comfortably, close your eyes, and focus only on your breath. When thoughts arrive, acknowledge them and return to breathing. Non-judgmental awareness is the goal.',
    color:       '#4ecdc4',
    categoryColor: 'teal',
    path:        '/dashboard/user/meditate',
  },

  movement_release: {
    id:          'rec-movement-release',
    icon:        '🏃',
    title:       'Physical Movement Break',
    category:    'Movement',
    duration:    '10 min',
    description: 'Go for a brisk walk, do 10 jumping jacks, or stretch. Physical movement is one of the fastest ways to shift emotional state and release adrenaline.',
    color:       '#ff6b6b',
    categoryColor: 'red',
    path:        '/dashboard/user/challenges',
  },

  energising_walk: {
    id:          'rec-energising-walk',
    icon:        '🌤️',
    title:       'Energising Morning Walk',
    category:    'Movement',
    duration:    '10 min',
    description: 'A short outdoor walk in natural light boosts serotonin and signals your body to wake up. Especially effective when you feel sluggish or fatigued.',
    color:       '#f7c59f',
    categoryColor: 'amber',
    path:        '/dashboard/user/challenges',
  },

  challenge_yourself: {
    id:          'rec-challenge',
    icon:        '🏆',
    title:       'Try a Wellness Challenge',
    category:    'Challenge',
    duration:    '15 min',
    description: 'You\'re in a great headspace today. Use this energy to try something new — cold water face splash, a yoga pose, or calling someone you care about.',
    color:       '#a8e6cf',
    categoryColor: 'green',
    path:        '/dashboard/user/challenges',
  },

  default_breathing: {
    id:          'rec-default-breathing',
    icon:        '💨',
    title:       'Mindful Breathing',
    category:    'Breathwork',
    duration:    '3 min',
    description: 'Simply slow your breath to 6 cycles per minute (5 s in, 5 s out). This pace synchronises your heart rate variability and is the most accessible wellness habit.',
    color:       '#4ecdc4',
    categoryColor: 'teal',
    path:        '/dashboard/user/meditate',
  },
};

// ── buildContext: gather today's check-in + latest mood ───────
/**
 * @param {string} userId
 * @returns {Promise<{
 *   checkIn: object|null,
 *   lastMood: object|null,
 *   hasCheckInToday: boolean,
 * }>}
 */
export const buildContext = async (userId) => {
  const todayDate = new Date(`${todayUTC()}T00:00:00.000Z`);

  const [checkIn, lastMoodDoc] = await Promise.all([
    CheckIn.findOne({ user: userId, date: todayDate }).lean(),
    Mood.findOne({ user: userId }).sort({ loggedAt: -1 }).lean(),
  ]);

  return {
    checkIn:         checkIn  ?? null,
    lastMood:        lastMoodDoc ? { mood: lastMoodDoc.mood, intensity: lastMoodDoc.intensity } : null,
    hasCheckInToday: Boolean(checkIn),
  };
};

// ── helper: build a rec object from a catalogue entry + reason ─
const makeRec = (key, triggerRule, reason, triggerValue = null) => ({
  ...CATALOGUE[key],
  triggerRule,
  triggerValue,
  reason,
});

// ── applyRules: evaluate all rules, return up to MAX_RECS recs ─
/**
 * Pure function — no DB calls. Receives context from buildContext().
 *
 * @param {{ checkIn, lastMood, hasCheckInToday }} context
 * @returns {Array<RecommendationObject>}
 */
export const applyRules = (context) => {
  const { checkIn, lastMood, hasCheckInToday } = context;
  const recs    = [];
  const usedIds = new Set(); // prevent duplicates

  const add = (key, rule, reason, value = null) => {
    if (recs.length >= MAX_RECS) return;
    if (usedIds.has(CATALOGUE[key].id)) return;
    recs.push(makeRec(key, rule, reason, value));
    usedIds.add(CATALOGUE[key].id);
  };

  // ── Rule 1: No check-in today ─────────────────────────────
  if (!hasCheckInToday) {
    add(
      'checkin_prompt',
      'no_checkin_today',
      "You haven't submitted your daily check-in yet. It takes just 30 seconds and helps track your wellness over time.",
    );
  }

  // ── Rules 2–7: Based on check-in scores (if exists) ───────
  if (checkIn) {
    const { stress, energy, sleep, positivity, focus, wellnessScore } = checkIn;

    // Rule 2: High stress
    if (stress >= 4) {
      add(
        'breathing_478',
        'stress_high',
        `Your stress score is ${stress}/5 — breathing exercises activate the parasympathetic nervous system and reduce stress within minutes.`,
        stress,
      );
    }

    // Rule 3: Moderate stress (only if Rule 2 didn't fire)
    if (stress === 3 && !usedIds.has(CATALOGUE.breathing_478.id)) {
      add(
        'body_scan',
        'stress_moderate',
        `Your stress score is ${stress}/5 (moderate) — a body scan meditation helps release built-up tension before it compounds.`,
        stress,
      );
    }

    // Rule 4: Low energy
    if (energy <= 2) {
      add(
        'relaxation_walk',
        'energy_low',
        `Your energy level is ${energy}/5 — a short outdoor walk boosts circulation and serotonin without draining your reserves further.`,
        energy,
      );
    }

    // Rule 5: Poor sleep
    if (sleep <= 2) {
      add(
        'sleep_hygiene',
        'sleep_poor',
        `Your sleep quality was rated ${sleep}/5 — a consistent wind-down routine tonight can improve tomorrow's sleep significantly.`,
        sleep,
      );
    }

    // Rule 6: Low positivity
    if (positivity <= 2) {
      add(
        'gratitude_journal',
        'positivity_low',
        `Your positivity is ${positivity}/5 — gratitude journalling is one of the most evidence-backed tools for improving mood quickly.`,
        positivity,
      );
    }

    // Rule 7: Low focus
    if (focus <= 2) {
      add(
        'pomodoro_focus',
        'focus_low',
        `Your focus score is ${focus}/5 — a structured 25-minute session with a clear single task helps rebuild concentration.`,
        focus,
      );
    }

    // Rule 11: Thriving (check-in score high)
    if (typeof wellnessScore === 'number' && wellnessScore >= 80) {
      add(
        'challenge_yourself',
        'thriving',
        `Your wellness score is ${wellnessScore}/100 — you're in a great headspace. This is the perfect day to try something new or challenge yourself.`,
        wellnessScore,
      );
    }
  }

  // ── Rules 8–10: Based on last logged mood ─────────────────
  if (lastMood) {
    const { mood, intensity } = lastMood;

    // Rule 8: Sad or anxious mood
    if (mood === 'sad' || mood === 'anxious') {
      add(
        'calming_meditation',
        'mood_sad_anxious',
        `Your most recent mood is logged as "${mood}" (intensity ${intensity}/5) — a calming mindfulness session can help you process and settle difficult feelings.`,
        mood,
      );
    }

    // Rule 9: Angry mood
    if (mood === 'angry') {
      add(
        'movement_release',
        'mood_angry',
        `Your most recent mood is logged as "angry" (intensity ${intensity}/5) — physical movement is one of the fastest ways to metabolise the adrenaline that drives anger.`,
        mood,
      );
    }

    // Rule 10: Tired mood
    if (mood === 'tired') {
      add(
        'energising_walk',
        'mood_tired',
        `Your most recent mood is logged as "tired" (intensity ${intensity}/5) — a short walk in natural light boosts serotonin and gently re-energises you.`,
        mood,
      );
    }
  }

  // ── Rule 12: Default fallback (always ensure at least 1 rec) ─
  if (recs.length === 0) {
    add(
      'default_breathing',
      'default_fallback',
      'A simple default recommendation to help maintain your daily wellness routine — mindful breathing is beneficial regardless of how you\'re feeling.',
    );
  }

  return recs;
};

// ── Main export: getRecommendations ───────────────────────────
/**
 * Build context from DB and run the rule engine.
 *
 * @param {string} userId
 * @returns {Promise<{ recommendations: Array, context: object }>}
 */
export const getRecommendations = async (userId) => {
  const context = await buildContext(userId);
  const recommendations = applyRules(context);

  // Return context summary too (for transparent frontend display)
  return {
    recommendations,
    context: {
      hasCheckInToday: context.hasCheckInToday,
      checkInScore:    context.checkIn?.wellnessScore ?? null,
      lastMood:        context.lastMood,
      rulesEvaluated:  12,
      rulesMatched:    recommendations.length,
      engineType:      'rule_based', // explicitly NOT "ai"
    },
  };
};
