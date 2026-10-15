/**
 * utils/faceEmotionProvider.js
 * Modular face emotion detection adapter — Part 11.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DESIGN: This file is the ONLY place that imports face-api.js.
 * To swap to a different library (e.g. MediaPipe, Azure Face API),
 * replace this file — nothing else in the codebase needs to change.
 *
 * Public API (exported functions):
 *   loadModels()                     → loads TF models (call once on mount)
 *   detectEmotion(videoElement)      → returns DetectionResult | null
 *   isReady()                        → boolean — true after loadModels()
 *
 * DetectionResult shape:
 *   {
 *     emotion:      string,   // 'happy' | 'sad' | 'angry' | 'fearful' | 'disgusted' | 'surprised' | 'neutral'
 *     confidence:   number,   // 0.0 – 1.0
 *     allScores:    object,   // raw expression scores map
 *     faceCount:    number,   // how many faces were detected
 *   }
 *
 * Emotion mapping (face-api → MindEase Mood enum):
 *   happy     → happy
 *   sad       → sad
 *   angry     → angry
 *   fearful   → anxious
 *   disgusted → angry
 *   surprised → neutral
 *   neutral   → neutral
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as faceapi from '@vladmandic/face-api';

// ── Module state ──────────────────────────────────────────────
let _modelsLoaded = false;
let _loadPromise  = null;

// Path to the model weights served from /public/models/
const MODEL_URL = '/models';

// ── face-api → MindEase emotion mapping ──────────────────────
const FACEAPI_TO_MINDEASE = {
  happy:     'happy',
  sad:       'sad',
  angry:     'angry',
  fearful:   'anxious',
  disgusted: 'angry',
  surprised: 'neutral',
  neutral:   'neutral',
};

/**
 * Returns true if models are loaded and the detector is ready.
 */
export const isReady = () => _modelsLoaded;

/**
 * Load the three required models (idempotent — safe to call multiple times).
 * Uses a shared promise so concurrent calls don't duplicate network requests.
 *
 * Models loaded:
 *   1. TinyFaceDetector      — lightweight face bounding-box detector (~189 KB)
 *   2. FaceLandmark68TinyNet — 68-point landmarks, tiny version (~75 KB)
 *   3. FaceExpressionNet     — expression classification (~322 KB)
 *
 * Total download: ~586 KB (served from /public/models — no external network)
 *
 * @returns {Promise<void>}
 */
export const loadModels = () => {
  if (_modelsLoaded) return Promise.resolve();
  if (_loadPromise)  return _loadPromise;

  _loadPromise = Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
  ]).then(() => {
    _modelsLoaded = true;
  });

  return _loadPromise;
};

/**
 * Run face detection + expression analysis on a video element.
 *
 * @param {HTMLVideoElement} videoEl
 * @returns {Promise<DetectionResult | null>}
 *   Returns null if no face is detected.
 *   Caller is responsible for handling multi-face and no-face cases.
 */
export const detectEmotion = async (videoEl) => {
  if (!_modelsLoaded) {
    throw new Error('Face detection models are not loaded. Call loadModels() first.');
  }

  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,      // 160 | 224 | 320 | 416 — tradeoff speed vs accuracy
    scoreThreshold: 0.5, // ignore very low-confidence detections
  });

  // Detect ALL faces (so we can warn about multiple faces)
  const detections = await faceapi
    .detectAllFaces(videoEl, options)
    .withFaceLandmarks(true)        // true = use tiny landmarks net
    .withFaceExpressions();

  if (!detections || detections.length === 0) {
    return null; // no face detected
  }

  const faceCount = detections.length;

  // Use only the first (largest) detected face
  const primary = detections[0];
  const expressions = primary.expressions; // { happy: 0.9, sad: 0.02, ... }

  // Find the dominant expression
  const sorted = Object.entries(expressions).sort(([, a], [, b]) => b - a);
  const [rawEmotion, confidence] = sorted[0];

  const emotion = FACEAPI_TO_MINDEASE[rawEmotion] ?? 'neutral';

  return {
    emotion,
    confidence: parseFloat(confidence.toFixed(4)),
    allScores: Object.fromEntries(
      sorted.map(([k, v]) => [FACEAPI_TO_MINDEASE[k] ?? k, parseFloat(v.toFixed(4))])
    ),
    faceCount,
  };
};
