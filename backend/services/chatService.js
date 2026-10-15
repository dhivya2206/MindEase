/**
 * services/chatService.js
 * MindEase AI wellness chatbot backend service — Part 9.
 *
 * Uses Google Gemini via @google/genai.
 * API key is ONLY accessed here on the server — never exposed to the client.
 *
 * Responsibilities:
 *   - sendMessage(userId, conversationId, userMessage) → saves & returns AI reply
 *   - createConversation(userId)                        → blank new conversation
 *   - listConversations(userId)                         → user's conversation list
 *   - getConversation(userId, conversationId)           → single conversation + messages
 *   - deleteConversation(userId, conversationId)        → hard delete
 *
 * Safety constraints (enforced via system prompt):
 *   - General wellness support only
 *   - Never diagnoses mental illness
 *   - Never claims to replace a doctor or therapist
 *   - Encourages professional help when distress is severe
 */

import { GoogleGenAI } from '@google/genai';
import { Conversation } from '../models/Conversation.js';
import { AppError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// ── Gemini client (lazy — only initialised if API key exists) ──
let genAI = null;

const getGenAI = () => {
  if (!genAI) {
    if (!env.GEMINI_API_KEY) {
      throw new AppError(
        'AI service is currently unavailable. Please try again later.',
        503
      );
    }
    genAI = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return genAI;
};

// ── System prompt (injected on every request as context) ───────
const SYSTEM_PROMPT = `You are MindEase, a compassionate AI wellness companion integrated into a mental wellness platform.

Your role is to provide warm, evidence-informed general wellness support including:
- Emotional support and active listening
- Breathing exercises and relaxation techniques
- Mindfulness and meditation guidance
- Stress management strategies
- Sleep hygiene tips
- General wellness advice

CRITICAL RULES — you must ALWAYS follow these without exception:
1. You do NOT diagnose any mental illness or medical condition.
2. You do NOT claim to replace a licensed doctor, psychiatrist, psychologist, or therapist.
3. If the user expresses thoughts of self-harm, suicide, or a mental health crisis, you MUST:
   a. Respond with empathy and care.
   b. Strongly encourage them to contact a crisis line or seek immediate professional help.
   c. Provide the iCall India helpline: 9152987821, and the international crisis line: 988 (US).
   d. NOT attempt to provide therapy or treatment.
4. Keep responses concise (2-4 short paragraphs max) unless guiding an exercise step-by-step.
5. Use a warm, non-clinical, human tone — like a knowledgeable and caring friend.
6. If the user asks about medical symptoms, medications, or diagnoses, politely explain that you cannot advise on medical matters and suggest they consult a healthcare professional.
7. Do not engage with topics unrelated to mental wellness (politics, sports, coding, etc.).

You may use gentle emojis sparingly to make responses feel warm and approachable. 🌿`;

// ── Auto-generate a conversation title from the first message ──
const generateTitle = (message) => {
  const cleaned = message.trim().replace(/\s+/g, ' ');
  return cleaned.length <= 60 ? cleaned : `${cleaned.slice(0, 57)}…`;
};

// ── Build Gemini history array from stored messages ────────────
// Gemini SDK expects: [{ role: 'user'|'model', parts: [{ text }] }]
const buildHistory = (messages) =>
  messages.map((msg) => ({
    role: msg.role, // 'user' | 'model' (stored as-is)
    parts: [{ text: msg.content }],
  }));

// ── Fallback Wellness Responder (Evidence-Based Rule Engine) ───
export const generateWellnessFallback = (message) => {
  const text = (message || '').toLowerCase().trim();

  // 1. Crisis / Self-harm check
  if (
    text.includes('suicide') ||
    text.includes('kill myself') ||
    text.includes('end my life') ||
    text.includes('self-harm') ||
    text.includes('hurt myself') ||
    text.includes('want to die')
  ) {
    return (
      "I hear how much pain you're experiencing right now, and I care deeply about your safety. You do not have to carry this alone.\n\n" +
      "Please reach out immediately to trained professionals who can support you:\n" +
      "• **India (iCall)**: 9152987821 (Mon–Sat, 8am–10pm)\n" +
      "• **India (Tele-MANAS)**: 14416 (24/7 Toll-Free)\n" +
      "• **India (Vandrevala Foundation)**: 9999 666 555 (24/7)\n" +
      "• **US / Canada**: Call or text 988\n" +
      "• **UK**: 111 or text SHOUT to 85258\n\n" +
      "Please contact a crisis counselor or medical professional right now. As an AI companion, I cannot provide emergency clinical care, but compassionate help is ready for you. 💙"
    );
  }

  // 2. Medical / Diagnosis check
  if (
    text.includes('diagnos') ||
    text.includes('do i have depression') ||
    text.includes('do i have adhd') ||
    text.includes('do i have anxiety disorder') ||
    text.includes('bipolar') ||
    text.includes('prescribe') ||
    text.includes('medication') ||
    text.includes('pill')
  ) {
    return (
      "I want to support you, but as an AI wellness companion, **I cannot provide medical diagnoses, clinical assessments, or medication advice**.\n\n" +
      "MindEase is designed solely for general wellness, mindfulness guidance, and emotional reflection. It does not replace a licensed doctor, psychiatrist, or clinical psychologist.\n\n" +
      "If you're noticing persistent symptoms affecting your mood, sleep, or daily life, please consult a qualified healthcare professional. You can also connect with licensed professionals under our Appointments tab. 🌿"
    );
  }

  // 3. Suggested Prompt: "I feel stressed about my exams."
  if (
    text.includes('exam') ||
    text.includes('test') ||
    text.includes('study') ||
    text.includes('revision') ||
    text.includes('grade') ||
    text.includes('stressed about my exams')
  ) {
    return (
      "Exam pressure can feel heavy, but remember that your worth is never defined by a test score. 📚\n\n" +
      "Here are three practical techniques to regain calm and focus right now:\n\n" +
      "1. **The 25/5 Pomodoro Rule**: Work on just one focused topic for 25 minutes, then take a full 5-minute break away from screens. Studying in short sprints prevents mental overload.\n" +
      "2. **The Physiological Sigh**: Take two quick inhales through your nose, followed by a long, slow exhale through your mouth. Doing this 3 times physically lowers your heart rate.\n" +
      "3. **Focus on the Next Action**: Rather than worrying about the entire syllabus, choose just *one sub-topic* to review for the next 20 minutes.\n\n" +
      "Would you like to try a 2-minute calming breathing exercise together? 🫁"
    );
  }

  // 4. Suggested Prompt: "Help me relax."
  if (
    text.includes('help me relax') ||
    text.includes('relax') ||
    text.includes('unwind') ||
    text.includes('tense') ||
    text.includes('calm down')
  ) {
    return (
      "Let's pause together for a moment. You don't have to carry the weight of everything right now. 🌿\n\n" +
      "Try this quick **3-step relaxation reset** wherever you are:\n\n" +
      "1. **Release Physical Tension**: Gently drop your shoulders away from your ears. Unclench your jaw and let your facial muscles soften.\n" +
      "2. **Sensory Grounding (5-4-3-2-1)**: Look around and name **3 things you can see**, **2 things you can feel** (like the support of your chair), and **1 sound you hear** right now.\n" +
      "3. **One Deep Release**: Inhale deeply, fill your belly, and let out a gentle sigh on the exhale.\n\n" +
      "You can also explore our **Relaxation Center** for ambient sounds (rain, forest, ocean) and guided meditations. How does your body feel right now?"
    );
  }

  // 5. Suggested Prompt: "Give me a breathing exercise."
  if (
    text.includes('breathing exercise') ||
    text.includes('breathe') ||
    text.includes('breath') ||
    text.includes('4-7-8') ||
    text.includes('box breath')
  ) {
    return (
      "Let's practice **Box Breathing (4-4-4-4)** together. It is an evidence-backed technique that balances your nervous system: 🫁\n\n" +
      "• **Inhale** slowly through your nose for **4 seconds** (1... 2... 3... 4)\n" +
      "• **Hold** your breath gently for **4 seconds** (1... 2... 3... 4)\n" +
      "• **Exhale** smoothly through your mouth for **4 seconds** (1... 2... 3... 4)\n" +
      "• **Hold empty** and rest for **4 seconds** (1... 2... 3... 4)\n\n" +
      "Repeat this cycle 3 to 4 times. Notice how your chest softens with each out-breath.\n\n" +
      "Tip: You can also use our interactive animated **Breathing Guide** in the Relaxation tab for a visual rhythm timer!"
    );
  }

  // 6. Suggested Prompt: "I cannot focus today."
  if (
    text.includes('focus') ||
    text.includes('concentrat') ||
    text.includes('distract') ||
    text.includes('procrastinat') ||
    text.includes('cannot focus') ||
    text.includes("can't focus")
  ) {
    return (
      "It is completely normal to have days where your focus feels scattered. Pushing too hard against brain fog often creates more tension. 🎯\n\n" +
      "Here is a gentle strategy to restart your momentum:\n\n" +
      "1. **The 2-Minute Micro-Step**: Lower the bar. Pick the smallest possible part of your task (e.g., opening a document or writing one sentence). Getting started breaks the friction.\n" +
      "2. **Clear Sensory Clutter**: Put your phone face-down in another room or out of arm's reach. Close browser tabs you don't need right now.\n" +
      "3. **Physical Hydration & Light**: Drink a glass of water and stretch for 60 seconds to reset your alertness.\n\n" +
      "What is the single smallest thing you'd like to make progress on today?"
    );
  }

  // 7. Sadness / Grief / Loneliness
  if (
    text.includes('sad') ||
    text.includes('crying') ||
    text.includes('lonely') ||
    text.includes('alone') ||
    text.includes('heartbroken') ||
    text.includes('down')
  ) {
    return (
      "I'm sorry you're feeling down. Whatever you're going through, your feelings are valid, and it's okay not to feel okay today. 🤍\n\n" +
      "When sadness feels heavy:\n" +
      "• Give yourself permission to rest without self-criticism.\n" +
      "• Sip a warm drink or wrap yourself in a comfortable blanket.\n" +
      "• Even writing your thoughts helps — I am right here to listen without judgment.\n\n" +
      "Would you like to share what's on your mind, or would you prefer a soothing distraction?"
    );
  }

  // 8. Sleep / Insomnia
  if (
    text.includes('sleep') ||
    text.includes('insomnia') ||
    text.includes('tired') ||
    text.includes('cannot sleep') ||
    text.includes("can't sleep") ||
    text.includes('awake')
  ) {
    return (
      "Trouble sleeping is exhausting, especially when your thoughts are running fast. 🌙\n\n" +
      "Try these sleep wind-down steps:\n" +
      "• Dim your screen brightness and avoid checking notifications.\n" +
      "• Try the **4-7-8 breathing rhythm**: Inhale for 4s, hold for 7s, exhale slowly for 8s.\n" +
      "• If you've been lying in bed for over 20 minutes awake, get up into soft light and read a book until your eyes feel heavy.\n\n" +
      "You can also turn on our Sleep Relaxation soundscapes in the Relaxation Center. Wishing you a peaceful rest."
    );
  }

  // 9. Anger / Frustration
  if (
    text.includes('angry') ||
    text.includes('mad') ||
    text.includes('frustrated') ||
    text.includes('annoyed') ||
    text.includes('irritat')
  ) {
    return (
      "Frustration is a natural reaction when boundaries are crossed or situations feel overwhelming. It's completely understandable to feel irritated. 🔥\n\n" +
      "To release the adrenaline surge without burning yourself out:\n" +
      "• Clench your fists tightly for 5 seconds, then deliberately release and shake your hands out.\n" +
      "• Take a 5-minute walk or step away from the immediate trigger.\n" +
      "• Jot down unfiltered thoughts on paper, then set it aside.\n\n" +
      "What triggered this feeling today? I'm here to listen."
    );
  }

  // 10. General / Greeting / Mindfulness
  return (
    "Hello! I am MindEase, your AI wellness companion. 🌿\n\n" +
    "I'm here to provide non-judgmental support, breathing exercises, mindfulness guidance, and healthy daily habits.\n\n" +
    "Here are a few things we can do together:\n" +
    "• Explore calming techniques if you're feeling stressed or overwhelmed\n" +
    "• Practice guided breathing rhythms (like 4-7-8 or Box Breathing)\n" +
    "• Work through focus blocks and study habits\n" +
    "• Reflect on your daily wellness check-ins and mood patterns\n\n" +
    "*(MindEase provides general wellness support only and does not diagnose mental illness or replace professional therapy.)*\n\n" +
    "How are you feeling today?"
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Public service functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new, empty conversation for a user.
 * @param {string} userId
 * @returns {Promise<ConversationDocument>}
 */
export const createConversation = async (userId) => {
  const convo = await Conversation.create({ user: userId });
  return convo.toJSON();
};

/**
 * List all conversations for a user, newest first.
 * Returns only id, title, updatedAt, messageCount — NOT full messages.
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export const listConversations = async (userId) => {
  const convos = await Conversation.find({ user: userId })
    .sort({ updatedAt: -1 })
    .select('title updatedAt messages')
    .lean();

  return convos.map((c) => ({
    id: c._id.toString(),
    title: c.title,
    updatedAt: c.updatedAt,
    messageCount: c.messages?.length ?? 0,
    lastMessage: c.messages?.length
      ? c.messages[c.messages.length - 1]?.content?.slice(0, 80)
      : null,
  }));
};

/**
 * Get a single conversation with full messages.
 * Only returns the conversation if it belongs to userId.
 * @param {string} userId
 * @param {string} conversationId
 * @returns {Promise<object>}
 */
export const getConversation = async (userId, conversationId) => {
  const convo = await Conversation.findOne({
    _id: conversationId,
    user: userId,
  });

  if (!convo) {
    throw new AppError('Conversation not found', 404);
  }

  return convo.toJSON();
};

/**
 * Hard-delete a conversation.
 * Only deletes if it belongs to userId.
 * @param {string} userId
 * @param {string} conversationId
 * @returns {Promise<void>}
 */
export const deleteConversation = async (userId, conversationId) => {
  const result = await Conversation.deleteOne({
    _id: conversationId,
    user: userId,
  });

  if (result.deletedCount === 0) {
    throw new AppError('Conversation not found', 404);
  }
};

/**
 * Send a user message to the AI and persist both the user message
 * and the AI reply to the conversation.
 *
 * @param {string} userId
 * @param {string} conversationId
 * @param {string} userText  - raw user message (max 2000 chars enforced)
 * @returns {Promise<{ reply: string, conversationId: string, title: string }>}
 */
export const sendMessage = async (userId, conversationId, userText) => {
  // ── 1. Validate input ─────────────────────────────────────────
  const trimmed = userText?.trim();
  if (!trimmed) throw new AppError('Message cannot be empty', 400);
  if (trimmed.length > 2000) throw new AppError('Message too long (max 2000 characters)', 400);

  // ── 2. Load conversation (ownership check) ────────────────────
  const convo = await Conversation.findOne({ _id: conversationId, user: userId });
  if (!convo) throw new AppError('Conversation not found', 404);

  // ── 3. Auto-title from first user message ────────────────────
  const isFirstMessage = convo.messages.length === 0;
  if (isFirstMessage) {
    convo.title = generateTitle(trimmed);
  }

  // ── 4. Save user message ──────────────────────────────────────
  convo.messages.push({ role: 'user', content: trimmed });

  // ── 5. Build Gemini chat history (everything before this msg) ─
  const historyMessages = convo.messages.slice(0, -1);
  const history = buildHistory(historyMessages);

  // ── 6. Call Gemini or Graceful Fallback ────────────────────────
  let replyText = null;
  const hasValidKey =
    env.GEMINI_API_KEY &&
    typeof env.GEMINI_API_KEY === 'string' &&
    env.GEMINI_API_KEY.trim() !== '' &&
    env.GEMINI_API_KEY !== 'your_gemini_api_key_here';

  if (hasValidKey) {
    const ai = getGenAI();
    const candidateModels = [
      'gemini-3-flash-preview',
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-3.1-pro-preview',
      'gemini-2.0-flash',
    ];

    for (const modelName of candidateModels) {
      try {
        const chat = ai.chats.create({
          model: modelName,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.75,
            maxOutputTokens: 600,
          },
          history,
        });

        const response = await chat.sendMessage({ message: trimmed });
        const text = response.text?.trim();
        if (text) {
          replyText = text;
          break;
        }
      } catch (err) {
        logger.warn(`Gemini model ${modelName} error: ${err.message}. Trying next candidate...`);
      }
    }

    if (!replyText) {
      logger.warn('All Gemini models failed, activating graceful wellness fallback.');
      replyText = generateWellnessFallback(trimmed);
    }
  } else {
    // Key is placeholder or unconfigured — activate graceful fallback response
    replyText = generateWellnessFallback(trimmed);
  }

  if (!replyText) {
    replyText = generateWellnessFallback(trimmed);
  }

  // ── 7. Save AI reply in MongoDB ───────────────────────────────
  convo.messages.push({ role: 'model', content: replyText });
  await convo.save();

  return {
    reply: replyText,
    conversationId: convo._id.toString(),
    title: convo.title,
  };
};
