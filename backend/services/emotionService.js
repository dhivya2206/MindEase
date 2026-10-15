/**
 * services/emotionService.js
 * Reusable AI-powered text emotion analysis service — Part 10.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * This is a standalone, reusable service. It is NOT coupled to the chatbot.
 * It can be imported by any controller that needs emotion analysis.
 *
 * What it does:
 *   analyzeEmotion(text) → { emotion, confidence, intensity, reasoning, wellness }
 *
 * Emotion categories (aligned with Mood model enum):
 *   happy | sad | stressed | anxious | angry | calm | neutral
 *   (also maps "tired" and "excited" from Mood model to nearest category)
 *
 * Important:
 *   - This is EMOTION ESTIMATION only — explicitly NOT medical diagnosis
 *   - API key lives only here on the backend — never exposed to clients
 *   - Graceful fallback if AI service is unavailable
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

// ── Valid emotion categories ─────────────────────────────────
export const EMOTION_CATEGORIES = Object.freeze([
  'happy', 'sad', 'stressed', 'anxious', 'angry', 'calm', 'neutral',
]);

// ── Emotion → recommended wellness activity mapping ──────────
const WELLNESS_MAP = {
  happy: {
    icon: '🌟',
    activity: 'Gratitude Journal',
    description: 'Channel this positive energy into a gratitude journal. Write 3 specific things you are thankful for today.',
    path: '/dashboard/user/journal',
    color: '#f7c59f',
  },
  sad: {
    icon: '🕊️',
    activity: 'Calming Mindfulness Session',
    description: 'A 10-minute guided mindfulness session can help you gently process and settle difficult emotions without judgment.',
    path: '/dashboard/user/chat',
    color: '#7c6f9f',
  },
  stressed: {
    icon: '🫁',
    activity: '4-7-8 Breathing Exercise',
    description: 'Inhale for 4 s, hold for 7 s, exhale for 8 s. Repeat 4 cycles. This activates your parasympathetic nervous system within minutes.',
    path: '/dashboard/user/chat',
    color: '#4ecdc4',
  },
  anxious: {
    icon: '🌿',
    activity: 'Grounding Exercise (5-4-3-2-1)',
    description: 'Name 5 things you see, 4 you hear, 3 you can touch, 2 you smell, 1 you taste. This technique anchors you to the present moment.',
    path: '/dashboard/user/chat',
    color: '#6c63ff',
  },
  angry: {
    icon: '🏃',
    activity: 'Physical Movement Break',
    description: 'Go for a brisk walk or do 10 jumping jacks. Physical movement is one of the fastest ways to metabolise the adrenaline that drives anger.',
    path: '/dashboard/user/challenges',
    color: '#ff6b6b',
  },
  calm: {
    icon: '🧘',
    activity: 'Progressive Body Scan',
    description: 'You are in a great headspace. Deepen this calm with an 8-minute body scan meditation to release any residual tension.',
    path: '/dashboard/user/chat',
    color: '#4ecdc4',
  },
  neutral: {
    icon: '💨',
    activity: 'Mindful Breathing',
    description: 'Slow your breath to 6 cycles per minute (5 s in, 5 s out). This simple habit maintains your baseline wellbeing.',
    path: '/dashboard/user/chat',
    color: '#a8e6cf',
  },
};

// ── System prompt for emotion analysis ──────────────────────
const SYSTEM_PROMPT = `You are an emotion estimation assistant integrated into a mental wellness platform.

Your ONLY job is to analyse the emotional content of a short piece of text and return a structured JSON response.

RULES:
1. This is EMOTION ESTIMATION only. Never use the words "diagnosis", "diagnose", or "medical".
2. Classify the emotion into exactly ONE of these categories: happy, sad, stressed, anxious, angry, calm, neutral
3. Provide a confidence score from 0.0 to 1.0 (e.g. 0.87)
4. Estimate an intensity from 1 (very mild) to 5 (very strong)
5. Write a brief, empathetic 1-sentence reasoning that explains the detected emotion
6. Be sensitive and compassionate — users may be describing difficult feelings
7. If the text is too vague or unrelated to emotions, return "neutral" with low confidence

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "emotion": "stressed",
  "confidence": 0.91,
  "intensity": 4,
  "reasoning": "The phrase 'very stressed about placement preparation' directly expresses high-level performance anxiety and pressure."
}`;

// ── Gemini client ────────────────────────────────────────────
let _genAI = null;
const getGenAI = () => {
  if (!_genAI) {
    if (!env.GEMINI_API_KEY) {
      throw new AppError('AI service is currently unavailable. Please try again later.', 503);
    }
    _genAI = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return _genAI;
};

// ── JSON parser with fallback ────────────────────────────────
const parseEmotionJSON = (raw) => {
  try {
    // Strip possible markdown code fences
    const cleaned = raw.replace(/```json|```/gi, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
};

// ── Main export: analyzeEmotion ───────────────────────────────
/**
 * Analyse the emotional content of a text string using Gemini.
 *
 * @param {string} text - User-provided text describing their feelings
 * @returns {Promise<{
 *   emotion: string,
 *   confidence: number,
 *   intensity: number,
 *   reasoning: string,
 *   wellness: object,
 *   rawText: string,
 * }>}
 */
export const analyzeEmotion = async (text) => {
  const trimmed = text?.trim();
  if (!trimmed) throw new AppError('Text is required for emotion analysis', 400);
  if (trimmed.length > 1000) throw new AppError('Text too long (max 1000 characters)', 400);

  let parsed = null;

  try {
    const ai = getGenAI();

    const candidateModels = ['gemini-3-flash-preview', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let raw = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.2,
            maxOutputTokens: 200,
          },
          contents: [{ role: 'user', parts: [{ text: trimmed }] }],
        });
        raw = response.text?.trim();
        if (raw) break;
      } catch (mErr) {
        logger.warn(`Emotion analysis model ${modelName} error: ${mErr.message}`);
      }
    }

    if (!raw) throw new Error('Empty response from AI models');

    parsed = parseEmotionJSON(raw);

    if (!parsed || !EMOTION_CATEGORIES.includes(parsed.emotion)) {
      logger.warn('Emotion analysis: invalid AI response, falling back to neutral', { raw });
      parsed = null;
    }
  } catch (err) {
    logger.error('Emotion analysis AI error:', err.message);

    const msg = err.message?.toLowerCase() ?? '';
    if (
      msg.includes('quota') || msg.includes('rate') ||
      msg.includes('unavailable') || msg.includes('503') ||
      err.statusCode === 503
    ) {
      throw new AppError('AI service is temporarily unavailable. Please try again in a few minutes.', 503);
    }

    // For other errors, throw a clean 503 rather than leaking internal details
    if (err.isOperational) throw err;
    throw new AppError('Emotion analysis is temporarily unavailable. Please try again later.', 503);
  }

  // ── Fallback: if AI returned garbage, return neutral ─────────
  if (!parsed) {
    parsed = {
      emotion: 'neutral',
      confidence: 0.5,
      intensity: 2,
      reasoning: 'Could not determine a clear emotion from the text provided.',
    };
  }

  // ── Clamp / sanitise values ──────────────────────────────────
  const emotion    = EMOTION_CATEGORIES.includes(parsed.emotion) ? parsed.emotion : 'neutral';
  const confidence = Math.min(1, Math.max(0, parseFloat(parsed.confidence) || 0.5));
  const intensity  = Math.min(5, Math.max(1, Math.round(parsed.intensity) || 3));
  const reasoning  = typeof parsed.reasoning === 'string' ? parsed.reasoning.slice(0, 300) : '';

  return {
    emotion,
    confidence,
    intensity,
    reasoning,
    wellness: WELLNESS_MAP[emotion],
    rawText: trimmed,
  };
};
