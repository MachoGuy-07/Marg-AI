import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import VideoRecorder from "../components/VideoRecorder";
import "../styles/mockInterview.css";

const QUESTIONS = [
  { id: "q1", text: "Tell me about yourself and why this role is the right next step for you.", timeLimit: 60 },
  { id: "q2", text: "Describe a technically complex problem you solved under a tight deadline.", timeLimit: 75 },
  { id: "q3", text: "Walk me through a project where you improved system performance significantly.", timeLimit: 75 },
  { id: "q4", text: "How do you prioritize features when business needs conflict with technical debt?", timeLimit: 70 },
  { id: "q5", text: "Tell me about a time you disagreed with a teammate and how you resolved it.", timeLimit: 70 },
  { id: "q6", text: "Explain a production incident you handled and what you changed afterward.", timeLimit: 75 },
  { id: "q7", text: "How would you design a scalable real-time notification system?", timeLimit: 90 },
  { id: "q8", text: "Describe how you ensure code quality in a fast-moving team.", timeLimit: 65 },
  { id: "q9", text: "What trade-offs do you consider when choosing SQL vs NoSQL for a product?", timeLimit: 80 },
  { id: "q10", text: "Tell me about a time you mentored someone and improved their output.", timeLimit: 65 },
  { id: "q11", text: "How do you break down an ambiguous requirement into an executable plan?", timeLimit: 70 },
  { id: "q12", text: "Describe your approach to debugging a bug you cannot reproduce locally.", timeLimit: 75 },
  { id: "q13", text: "How would you design authentication and authorization for a SaaS platform?", timeLimit: 90 },
  { id: "q14", text: "What metrics would you track to measure backend reliability and user impact?", timeLimit: 80 },
  { id: "q15", text: "Tell me about a failure in your career and the concrete lesson you applied later.", timeLimit: 70 },
  { id: "q16", text: "How do you communicate technical decisions to non-technical stakeholders?", timeLimit: 65 },
  { id: "q17", text: "Describe a major refactor you led and how you reduced delivery risk.", timeLimit: 80 },
  { id: "q18", text: "How would you optimize a slow API that serves millions of requests per day?", timeLimit: 90 },
  { id: "q19", text: "What does leadership mean to you even when you do not have the manager title?", timeLimit: 70 },
  { id: "q20", text: "Why should we hire you over other strong candidates for this position?", timeLimit: 60 },
];

const TRANSCRIPT_UI_THROTTLE_MS = 42;
const TRANSCRIPT_FORCE_FLUSH_MS = 110;
const RECOGNITION_RESTART_DELAY_MS = 180;

const FILLER_WORDS = [
  "um",
  "uh",
  "like",
  "basically",
  "actually",
  "literally",
  "hmm",
  "sorta",
  "kinda",
];

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "if",
  "to",
  "for",
  "of",
  "in",
  "on",
  "at",
  "with",
  "from",
  "by",
  "about",
  "as",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "you",
  "your",
  "i",
  "me",
  "my",
  "we",
  "our",
  "they",
  "their",
  "he",
  "she",
  "him",
  "her",
  "them",
  "do",
  "does",
  "did",
  "can",
  "could",
  "would",
  "should",
  "have",
  "has",
  "had",
  "what",
  "how",
  "why",
  "when",
  "where",
  "which",
  "who",
  "whom",
  "tell",
  "describe",
  "explain",
  "through",
  "walk",
]);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function tokenize(text) {
  return (text.toLowerCase().match(/\b[a-z']+\b/g) || []).map((word) =>
    word.replace(/'/g, "")
  );
}

function normalizeTranscriptText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function paceBand(wpm) {
  if (!wpm) return { label: "Waiting", percent: 0, score: 1 };
  if (wpm < 110) return { label: "Slow", percent: 52, score: 5 };
  if (wpm > 170) return { label: "Fast", percent: 58, score: 5 };
  const target = 140;
  const distance = Math.abs(wpm - target);
  const percent = clamp(Math.round(100 - distance * 1.65), 12, 100);
  const score = wpm >= 125 && wpm <= 160 ? 9 : 7;
  return { label: "Normal", percent, score };
}

function buildAIFeedback({
  wpm,
  paceLabel,
  fillerCount,
  fillerRate,
  pauseCount,
  clarity,
  vocabularyDiversity,
  eyeContact,
  posture,
  tone,
  transcriptWordCount,
}) {
  const safeWpm = Math.max(0, Math.round(Number(wpm) || 0));
  const safeFillerCount = Math.max(0, Math.round(Number(fillerCount) || 0));
  const safeFillerRate = Math.max(0, Number(fillerRate) || 0);
  const safePauseCount = Math.max(0, Math.round(Number(pauseCount) || 0));
  const safeClarity = clamp(Math.round(Number(clarity) || 0), 0, 100);
  const safeVocabulary = clamp(Math.round(Number(vocabularyDiversity) || 0), 0, 100);
  const safeEyeContact = clamp(Math.round(Number(eyeContact) || 0), 0, 100);
  const safePosture = clamp(Math.round(Number(posture) || 0), 0, 100);
  const safeTranscriptWords = Math.max(0, Math.round(Number(transcriptWordCount) || 0));
  const hasSpeechSignal = safeTranscriptWords >= 8 || safeWpm > 0;

  const tips = [];

  if (!hasSpeechSignal && safeEyeContact === 0) {
    tips.push("Eye contact signal is unavailable (0%). Keep your face centered and camera on during the answer.");
  } else if (safeEyeContact < 35) {
    tips.push(`Eye contact is ${safeEyeContact}%. Too low for interview confidence. Keep your gaze on the lens while finishing each point.`);
  } else if (safeEyeContact < 65) {
    tips.push(
      `Eye contact is ${safeEyeContact}%. Decent baseline. Maintain lens focus to improve perceived confidence.`
    );
  } else {
    tips.push(
      `Eye contact is ${safeEyeContact}%. Strong presence. Keep this level while answering harder questions.`
    );
  }

  if (!hasSpeechSignal && safePosture === 0) {
    tips.push("Posture signal is unavailable (0%). Sit upright and stay fully in frame for accurate tracking.");
  } else if (safePosture < 35) {
    tips.push(`Posture stability is ${safePosture}%. Too much movement detected. Keep shoulders stable and reduce leaning.`);
  } else if (safePosture < 65) {
    tips.push(
      `Posture stability is ${safePosture}%. Improving. Keep shoulders still and avoid frequent leaning.`
    );
  } else {
    tips.push(
      `Posture stability is ${safePosture}%. Your body language already supports confidence.`
    );
  }

  if (!hasSpeechSignal || safeWpm === 0) {
    tips.push("Pace signal is unavailable (0 WPM). Speak a full answer so speed can be measured.");
  } else if (paceLabel === "Fast") {
    tips.push(`You are speaking fast at ${safeWpm} WPM. Add a short pause after each key achievement.`);
  } else if (paceLabel === "Slow") {
    tips.push(`Pace is ${safeWpm} WPM (slow). Use shorter, direct sentences to sound more decisive.`);
  } else {
    tips.push(`Pace is controlled at ${safeWpm} WPM. Great flow, maintain this in follow-up answers.`);
  }

  if (!hasSpeechSignal || safeTranscriptWords < 10) {
    tips.push("Filler-word signal is low-confidence due short speech sample. Give a longer response for accurate detection.");
  } else if (safeFillerRate > 0.05) {
    tips.push(
      `Filler usage is ${safeFillerCount}. Replace fillers with short silence and tighter transitions.`
    );
  } else if (safeFillerCount > 0) {
    tips.push(`Minor filler usage (${safeFillerCount}). Easy win: clean this up for sharper delivery.`);
  } else {
    tips.push("No filler words detected. Crisp and confident delivery.");
  }

  if (!hasSpeechSignal) {
    tips.push("Pause control is not measurable yet. Speak one complete, structured answer for a reliable signal.");
  } else if (safePauseCount > 10) {
    tips.push(
      `Pause frequency is ${safePauseCount}. Too many breaks. End each sentence with one clear conclusion.`
    );
  } else if (safePauseCount > 6) {
    tips.push(`Pause frequency is ${safePauseCount}. Keep pauses shorter and more intentional.`);
  } else {
    tips.push(`Pause control is good (${safePauseCount}). Keep pauses intentional.`);
  }

  if (!hasSpeechSignal || safeTranscriptWords < 12) {
    tips.push("Vocabulary score is low-confidence on short responses. Use a longer answer with concrete actions and outcomes.");
  } else if (safeVocabulary < 34) {
    tips.push(
      `Vocabulary diversity is ${safeVocabulary}%. Add strong action verbs and quantifiable outcomes.`
    );
  } else {
    tips.push(
      `Vocabulary diversity is ${safeVocabulary}%. Good lexical range for interview answers.`
    );
  }

  if (!hasSpeechSignal || safeClarity === 0) {
    tips.push("Clarity score is unavailable due limited speech signal. Answer at least 2-3 full sentences.");
  } else if (safeClarity < 70) {
    tips.push(
      `Clarity is ${safeClarity}%. Reduce speed swings and simplify sentence structure.`
    );
  } else {
    tips.push(`Clarity is ${safeClarity}%. Excellent structure, keep this under pressure.`);
  }

  if (!hasSpeechSignal) {
    tips.push("Tone analysis is pending. Provide a longer spoken answer to capture vocal variation.");
  } else if (tone === "Flat") {
    tips.push("Tone sounds flat at times. Add emphasis on impact words and outcomes.");
  } else if (tone === "Energetic") {
    tips.push("Tone is energetic. Great energy, just control intensity on long answers.");
  } else {
    tips.push("Tone is balanced. Keep subtle variation between setup and impact.");
  }

  return tips;
}

function formatClock(seconds) {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const secs = (safe % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function evaluateQuestionResponse({
  question,
  answer,
  questionOrder,
  wpm,
  paceLabel,
  clarity,
  confidenceIndex,
  fillerRate,
}) {
  const answerText = String(answer || "").trim();
  const answerTokens = tokenize(answerText).filter((token) => !STOP_WORDS.has(token));
  const questionTokens = tokenize(question).filter((token) => !STOP_WORDS.has(token));
  const answerSet = new Set(answerTokens);
  const uniqueQuestionTokens = [...new Set(questionTokens)];
  const matchedKeywords = uniqueQuestionTokens.filter((token) => answerSet.has(token));

  const keywordCoverage =
    matchedKeywords.length / Math.max(1, Math.min(uniqueQuestionTokens.length, 14));

  const wordCount = answerTokens.length;
  const lengthScore = clamp((wordCount / 80) * 100, 0, 100);

  const structureSignals = [
    "because",
    "result",
    "impact",
    "improved",
    "led",
    "built",
    "solved",
    "optimized",
    "delivered",
    "measured",
  ];
  const structureHits = structureSignals.filter((term) =>
    answerText.toLowerCase().includes(term)
  ).length;
  const structureScore = clamp((structureHits / 4) * 100, 0, 100);

  const relevanceScore = clamp(
    Math.round(keywordCoverage * 62 + lengthScore * 0.18 + structureScore * 0.1 + clarity * 0.1),
    0,
    100
  );

  let verdict = "Off Topic";
  if (relevanceScore >= 72) verdict = "Strong Match";
  else if (relevanceScore >= 48) verdict = "Partial Match";

  const paceNote =
    paceLabel === "Fast"
      ? "You were slightly fast. Slow down for key impact lines."
      : paceLabel === "Slow"
      ? "You were slightly slow. Increase pace to sound more decisive."
      : "Your pace stayed in a good interview range.";

  const guidance =
    verdict === "Strong Match"
      ? "Your response aligned well with the asked question. Keep using specific impact examples."
      : verdict === "Partial Match"
      ? "Your response covered part of the question. Add clearer problem-action-result mapping."
      : "Your response drifted from the asked question. Start with direct context, then action and result.";

  return {
    questionId: QUESTIONS[questionOrder]?.id || `q${questionOrder + 1}`,
    questionOrder,
    question,
    transcript: answerText,
    transcriptWordCount: wordCount,
    relevanceScore,
    verdict,
    matchedKeywords: matchedKeywords.slice(0, 8),
    wpm,
    paceLabel,
    paceNote,
    clarity,
    confidenceIndex,
    fillerRate: Number(fillerRate.toFixed(3)),
    guidance,
  };
}

export default function MockInterview() {
  const navigate = useNavigate();
  const recorderRef = useRef(null);
  const questionAnalysesRef = useRef([]);

  const recognitionRef = useRef(null);
  const recognitionActiveRef = useRef(false);
  const recognitionRestartTimerRef = useRef(null);
  const transcriptRef = useRef("");
  const interimTranscriptRef = useRef("");
  const transcriptPreviewRef = useRef("");
  const transcriptFlushRafRef = useRef(null);
  const transcriptFlushTimerRef = useRef(null);
  const lastTranscriptPaintAtRef = useRef(0);
  const transcriptBoxRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const isRecordingRef = useRef(false);
  const currentQuestionIndexRef = useRef(0);
  const liveMetricsRef = useRef({
    transcript: "",
    wpm: 0,
    fillerCount: 0,
    vocabularyDiversity: 0,
    pauseCount: 0,
    pauseRatio: 1,
    voiceStability: 0,
    tone: "Neutral",
    liveConfidence: 0,
    liveVoiceScore: 0,
    eyeContactPct: 0,
    posturePct: 0,
    speakingClarity: 0,
    confidenceIndex: 0,
    fillerRate: 0,
  });
  const lastVoiceMetricsPaintRef = useRef(0);
  const lastPostureMetricsPaintRef = useRef(0);

  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTIONS[0].timeLimit);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const [transcript, setTranscript] = useState("");
  const [wpm, setWpm] = useState(0);
  const [fillerCount, setFillerCount] = useState(0);
  const [vocabularyDiversity, setVocabularyDiversity] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);
  const [pauseRatio, setPauseRatio] = useState(1);
  const [voiceStability, setVoiceStability] = useState(0);
  const [tone, setTone] = useState("Neutral");
  const [liveConfidence, setLiveConfidence] = useState(0);
  const [liveVoiceScore, setLiveVoiceScore] = useState(0);
  const [eyeContactPct, setEyeContactPct] = useState(0);
  const [posturePct, setPosturePct] = useState(0);
  const [questionAnalyses, setQuestionAnalyses] = useState([]);
  const [lastQuestionReview, setLastQuestionReview] = useState(null);

  const transcriptPreview = useMemo(() => {
    const text = transcript || "";
    if (text.length <= 520) return text;
    return `...${text.slice(-520)}`;
  }, [transcript]);

  const spokenWordCount = useMemo(
    () => tokenize(transcriptRef.current || transcript).length,
    [transcript]
  );

  const pace = paceBand(wpm);
  const fillerRate = useMemo(() => {
    const words = tokenize(transcriptRef.current || transcript);
    if (!words.length) return 0;
    return fillerCount / words.length;
  }, [fillerCount, transcript]);

  const speakingClarity = useMemo(() => {
    const raw =
      liveVoiceScore * 0.4 +
      (pace.percent / 100) * 0.2 +
      (1 - clamp(fillerRate * 6, 0, 1)) * 0.16 +
      (vocabularyDiversity / 100) * 0.14 +
      liveConfidence * 0.1;
    return clamp(Math.round(raw * 100), 0, 100);
  }, [
    fillerRate,
    liveConfidence,
    liveVoiceScore,
    pace.percent,
    vocabularyDiversity,
  ]);

  const confidenceIndex = useMemo(() => {
    const raw =
      (eyeContactPct / 100) * 0.34 +
      (posturePct / 100) * 0.26 +
      (speakingClarity / 100) * 0.2 +
      liveVoiceScore * 0.1 +
      liveConfidence * 0.1;
    const computed = clamp(Math.round(raw * 100), 0, 100);
    const smoothContinuousSpeech =
      spokenWordCount >= 28 &&
      pauseRatio <= 0.2 &&
      voiceStability >= 0.62 &&
      liveVoiceScore >= 0.6 &&
      wpm >= 120 &&
      wpm <= 170;

    if (smoothContinuousSpeech) {
      return Math.max(55, computed);
    }

    return computed;
  }, [
    eyeContactPct,
    liveConfidence,
    liveVoiceScore,
    pauseRatio,
    posturePct,
    speakingClarity,
    spokenWordCount,
    voiceStability,
    wpm,
  ]);

  const interviewTip = useMemo(() => {
    if (
      spokenWordCount >= 28 &&
      pauseRatio <= 0.2 &&
      voiceStability >= 0.62 &&
      liveVoiceScore >= 0.6 &&
      wpm >= 120 &&
      wpm <= 170
    ) {
      return "Tip: Smooth and continuous delivery detected. Keep this rhythm and close each answer with measurable impact.";
    }
    if (eyeContactPct < 72) {
      return "Tip: Look directly at the camera to improve perceived confidence.";
    }
    if (posturePct < 70) {
      return "Tip: Keep your shoulders stable and avoid leaning between phrases.";
    }
    if (fillerRate > 0.05) {
      return "Tip: Replace filler words with a 0.5 second pause before your next point.";
    }
    if (pace.label === "Fast") {
      return "Tip: Slow down slightly and add a pause after each impact statement.";
    }
    return "Tip: Keep answers concise: context, action, measurable outcome.";
  }, [
    eyeContactPct,
    fillerRate,
    liveVoiceScore,
    pace.label,
    pauseRatio,
    posturePct,
    spokenWordCount,
    voiceStability,
    wpm,
  ]);

  const paceSummary = useMemo(() => {
    if (pace.label === "Fast") return "Reduce speed";
    if (pace.label === "Slow") return "Speed up";
    if (pace.label === "Normal") return "Perfect";
    return "Waiting";
  }, [pace.label]);

  const paceAdviceLines = useMemo(() => {
    if (!wpm) {
      return [
        "Start speaking so I can calibrate your pace.",
        "Ideal interview range: 125-160 WPM.",
        "Use short pauses after key points.",
      ];
    }
    if (wpm < 115) {
      return [
        `You are at ${wpm} WPM, which is slow.`,
        "Target 125-160 WPM for stronger momentum.",
        "Shorten long pauses between sentences.",
      ];
    }
    if (wpm > 170) {
      return [
        `You are at ${wpm} WPM, which is fast.`,
        "Target 125-160 WPM for better clarity.",
        "Pause for half a second after impact lines.",
      ];
    }
    return [
      `${wpm} WPM is in the ideal interview range.`,
      "Perfect pacing for clear and confident delivery.",
      "Maintain this rhythm and close with outcomes.",
    ];
  }, [wpm]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    currentQuestionIndexRef.current = index;
  }, [index]);

  useEffect(() => {
    liveMetricsRef.current = {
      transcript,
      wpm,
      fillerCount,
      vocabularyDiversity,
      pauseCount,
      pauseRatio,
      voiceStability,
      tone,
      liveConfidence,
      liveVoiceScore,
      eyeContactPct,
      posturePct,
      speakingClarity,
      confidenceIndex,
      fillerRate,
    };
  }, [
    confidenceIndex,
    eyeContactPct,
    fillerCount,
    fillerRate,
    liveConfidence,
    liveVoiceScore,
    pauseCount,
    pauseRatio,
    posturePct,
    speakingClarity,
    tone,
    transcript,
    vocabularyDiversity,
    voiceStability,
    wpm,
  ]);

  const clearTranscriptFlushers = useCallback(() => {
    if (transcriptFlushRafRef.current) {
      cancelAnimationFrame(transcriptFlushRafRef.current);
      transcriptFlushRafRef.current = null;
    }
    if (transcriptFlushTimerRef.current) {
      clearTimeout(transcriptFlushTimerRef.current);
      transcriptFlushTimerRef.current = null;
    }
  }, []);

  const flushTranscriptToUi = useCallback(
    (force = false) => {
      const combinedTranscript = normalizeTranscriptText(
        `${transcriptRef.current} ${interimTranscriptRef.current}`
      );

      if (!combinedTranscript && !force) return false;
      if (!force && combinedTranscript === transcriptPreviewRef.current) return false;

      const now = performance.now();
      if (!force && now - lastTranscriptPaintAtRef.current < TRANSCRIPT_UI_THROTTLE_MS) {
        return false;
      }

      lastTranscriptPaintAtRef.current = now;
      transcriptPreviewRef.current = combinedTranscript;
      setTranscript(combinedTranscript);
      return true;
    },
    []
  );

  const scheduleTranscriptPaint = useCallback(
    (force = false) => {
      if (force) {
        clearTranscriptFlushers();
        flushTranscriptToUi(true);
        return;
      }

      const paintedNow = flushTranscriptToUi(false);
      if (paintedNow) return;

      if (!transcriptFlushRafRef.current) {
        transcriptFlushRafRef.current = requestAnimationFrame(() => {
          transcriptFlushRafRef.current = null;
          flushTranscriptToUi(true);
        });
      }

      if (!transcriptFlushTimerRef.current) {
        transcriptFlushTimerRef.current = setTimeout(() => {
          transcriptFlushTimerRef.current = null;
          flushTranscriptToUi(true);
        }, TRANSCRIPT_FORCE_FLUSH_MS);
      }
    },
    [clearTranscriptFlushers, flushTranscriptToUi]
  );

  const scheduleRecognitionRestart = useCallback((delayMs = RECOGNITION_RESTART_DELAY_MS) => {
    if (!isRecordingRef.current) return;
    if (recognitionRestartTimerRef.current) {
      clearTimeout(recognitionRestartTimerRef.current);
    }

    recognitionRestartTimerRef.current = setTimeout(() => {
      recognitionRestartTimerRef.current = null;
      if (!isRecordingRef.current || recognitionActiveRef.current) return;
      try {
        recognitionRef.current?.start();
      } catch {
        // Retry on next onend cycle.
      }
    }, delayMs);
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      recognitionActiveRef.current = true;
    };

    recognition.onresult = (event) => {
      let interimText = "";
      let finalText = transcriptRef.current;
      let hasFinalChunk = false;

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = normalizeTranscriptText(event.results[i][0]?.transcript);
        if (!chunk) continue;

        if (event.results[i].isFinal) {
          hasFinalChunk = true;
          finalText = `${finalText} ${chunk}`;
        }
        else {
          interimText = `${interimText} ${chunk}`;
        }
      }

      transcriptRef.current = normalizeTranscriptText(finalText);
      interimTranscriptRef.current = normalizeTranscriptText(interimText);
      scheduleTranscriptPaint(hasFinalChunk);
    };

    recognition.onerror = (event) => {
      const code = String(event?.error || "").toLowerCase();
      recognitionActiveRef.current = false;

      if (code === "not-allowed" || code === "service-not-allowed") {
        setSpeechSupported(false);
        return;
      }

      if (!isRecordingRef.current) return;
      if (code === "network") {
        scheduleRecognitionRestart(420);
        return;
      }
      scheduleRecognitionRestart();
    };

    recognition.onend = () => {
      recognitionActiveRef.current = false;
      if (!isRecordingRef.current) return;
      scheduleRecognitionRestart();
    };

    recognitionRef.current = recognition;
    return () => {
      recognitionActiveRef.current = false;
      clearTranscriptFlushers();
      if (recognitionRestartTimerRef.current) {
        clearTimeout(recognitionRestartTimerRef.current);
        recognitionRestartTimerRef.current = null;
      }
      try {
        recognition.stop();
      } catch {
        // no-op
      }
      recognitionRef.current = null;
    };
  }, [clearTranscriptFlushers, scheduleRecognitionRestart, scheduleTranscriptPaint]);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    const box = transcriptBoxRef.current;
    if (!box) return;

    const remaining = box.scrollHeight - box.scrollTop - box.clientHeight;
    const isNearBottom = remaining <= 56;
    if (!isNearBottom) return;

    box.scrollTo({
      top: box.scrollHeight,
      behavior: "smooth",
    });
  }, [transcriptPreview]);

  useEffect(() => {
    const words = tokenize(transcript);
    const total = words.length;
    if (!total || !startTimeRef.current) {
      setWpm(0);
      setFillerCount(0);
      setVocabularyDiversity(0);
      return;
    }

    const elapsedMin = Math.max((Date.now() - startTimeRef.current) / 60000, 0.08);
    const filler = words.filter((w) => FILLER_WORDS.includes(w)).length;
    const unique = new Set(words).size;

    setWpm(Math.round(total / elapsedMin));
    setFillerCount(filler);
    setVocabularyDiversity(Math.round((unique / total) * 100));
  }, [transcript]);

  const upsertQuestionReview = useCallback((review) => {
    const next = [
      ...questionAnalysesRef.current.filter((item) => item.questionId !== review.questionId),
      review,
    ].sort((a, b) => a.questionOrder - b.questionOrder);
    questionAnalysesRef.current = next;
    setQuestionAnalyses(next);
    setLastQuestionReview(review);
  }, []);

  const finalizeCurrentQuestionReview = useCallback(() => {
    const questionOrder = currentQuestionIndexRef.current;
    const question = QUESTIONS[questionOrder];
    if (!question) return null;

    const snapshot = liveMetricsRef.current;
    const answerFromRef = String(transcriptRef.current || "").trim();
    const answerFromUi = String(snapshot.transcript || "").trim();
    const answer = answerFromUi.length > answerFromRef.length ? answerFromUi : answerFromRef || answerFromUi;
    const paceSnapshot = paceBand(snapshot.wpm);

    const review = evaluateQuestionResponse({
      question: question.text,
      answer,
      questionOrder,
      wpm: snapshot.wpm,
      paceLabel: paceSnapshot.label,
      clarity: snapshot.speakingClarity,
      confidenceIndex: snapshot.confidenceIndex,
      fillerRate: snapshot.fillerRate,
    });

    upsertQuestionReview(review);
    return review;
  }, [upsertQuestionReview]);

  const handleRecordingStart = useCallback(() => {
    clearTranscriptFlushers();
    if (recognitionRestartTimerRef.current) {
      clearTimeout(recognitionRestartTimerRef.current);
      recognitionRestartTimerRef.current = null;
    }

    transcriptRef.current = "";
    interimTranscriptRef.current = "";
    transcriptPreviewRef.current = "";
    lastTranscriptPaintAtRef.current = 0;
    setTranscript("");
    setWpm(0);
    setFillerCount(0);
    setVocabularyDiversity(0);
    setPauseCount(0);
    setPauseRatio(1);
    setVoiceStability(0);
    setTone("Neutral");
    setEyeContactPct(0);
    setPosturePct(0);
    setLiveVoiceScore(0);
    setLiveConfidence(0);
    lastVoiceMetricsPaintRef.current = 0;
    lastPostureMetricsPaintRef.current = 0;
    questionAnalysesRef.current = [];
    setQuestionAnalyses([]);
    setLastQuestionReview(null);

    startTimeRef.current = Date.now();
    setIsRecording(true);
    isRecordingRef.current = true;

    try {
      if (!recognitionActiveRef.current) {
        recognitionRef.current?.start();
      }
    } catch {
      // no-op
    }
  }, [clearTranscriptFlushers]);

  const handleRecordingStop = useCallback(() => {
    clearTranscriptFlushers();
    if (recognitionRestartTimerRef.current) {
      clearTimeout(recognitionRestartTimerRef.current);
      recognitionRestartTimerRef.current = null;
    }

    setIsRecording(false);
    isRecordingRef.current = false;
    const finalTranscript = normalizeTranscriptText(
      `${transcriptRef.current} ${interimTranscriptRef.current}`
    );
    transcriptRef.current = finalTranscript;
    interimTranscriptRef.current = "";
    if (finalTranscript !== transcriptPreviewRef.current) {
      transcriptPreviewRef.current = finalTranscript;
      setTranscript(finalTranscript);
    }
    try {
      recognitionRef.current?.stop();
    } catch {
      // no-op
    }
    recognitionActiveRef.current = false;
  }, [clearTranscriptFlushers]);

  const startTimer = () => {
    clearInterval(timerRef.current);
    setTimeLeft(QUESTIONS[index].timeLimit);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const askQuestion = () => {
    startTimer();
    if (!isRecordingRef.current) {
      recorderRef.current?.startRecording?.();
    }
  };

  const nextQuestion = () => {
    clearInterval(timerRef.current);
    finalizeCurrentQuestionReview();
    if (index + 1 >= QUESTIONS.length) {
      if (isRecordingRef.current) {
        recorderRef.current?.stopRecording?.();
      }
      return;
    }
    setIndex(index + 1);
    setTimeLeft(QUESTIONS[index + 1].timeLimit);
    clearTranscriptFlushers();
    transcriptRef.current = "";
    interimTranscriptRef.current = "";
    transcriptPreviewRef.current = "";
    lastTranscriptPaintAtRef.current = 0;
    setTranscript("");
    setWpm(0);
    setFillerCount(0);
    setVocabularyDiversity(0);
    setPauseCount(0);
    setPauseRatio(1);
    setVoiceStability(0);
  };

  const handleUploadComplete = useCallback((data) => {
    handleRecordingStop();
    finalizeCurrentQuestionReview();

    const snapshot = liveMetricsRef.current;
    const transcriptFromRef = String(transcriptRef.current || "").trim();
    const transcriptFromUi = String(snapshot.transcript || "").trim();
    const finalTranscript =
      transcriptFromUi.length > transcriptFromRef.length
        ? transcriptFromUi
        : transcriptFromRef || transcriptFromUi;

    const transcriptWords = tokenize(finalTranscript);
    const transcriptWordCount = transcriptWords.length;
    const elapsedMinutes = startTimeRef.current
      ? Math.max((Date.now() - startTimeRef.current) / 60000, 0.08)
      : 1;
    const computedWpm = snapshot.wpm > 0
      ? snapshot.wpm
      : (transcriptWordCount ? Math.round(transcriptWordCount / elapsedMinutes) : 0);
    const computedFillerCount = snapshot.fillerCount > 0
      ? snapshot.fillerCount
      : transcriptWords.filter((word) => FILLER_WORDS.includes(word)).length;
    const computedFillerRate = transcriptWordCount
      ? computedFillerCount / transcriptWordCount
      : 0;
    const computedVocabularyDiversity = snapshot.vocabularyDiversity > 0
      ? snapshot.vocabularyDiversity
      : (transcriptWordCount ? Math.round((new Set(transcriptWords).size / transcriptWordCount) * 100) : 0);
    const computedPace = paceBand(computedWpm);
    const sentenceCount = Math.max(1, (finalTranscript.match(/[.!?]+/g) || []).length);
    const computedPauseCount = snapshot.pauseCount > 0
      ? snapshot.pauseCount
      : Math.max(0, sentenceCount - 1);
    const computedClarity =
      snapshot.speakingClarity > 0
        ? snapshot.speakingClarity
        : clamp(
            Math.round(
              snapshot.liveVoiceScore * 40 +
              (computedPace.percent / 100) * 20 +
              (1 - clamp(computedFillerRate * 6, 0, 1)) * 16 +
              (computedVocabularyDiversity / 100) * 14 +
              snapshot.liveConfidence * 10
            ),
            0,
            100
          );
    const computedPauseRatio = Number(
      clamp(
        snapshot.pauseRatio > 0
          ? snapshot.pauseRatio
          : (transcriptWordCount ? computedPauseCount / Math.max(1, transcriptWordCount / 8) : 1),
        0,
        1
      ).toFixed(3)
    );

    const confidenceScore = clamp(Math.round((snapshot.confidenceIndex + 12) / 10), 3, 10);
    const clarityScore = clamp(Math.round((computedClarity + 10) / 10), 3, 10);

    const aiFeedback = buildAIFeedback({
      wpm: computedWpm,
      paceLabel: computedPace.label,
      fillerCount: computedFillerCount,
      fillerRate: computedFillerRate,
      pauseCount: computedPauseCount,
      clarity: computedClarity,
      vocabularyDiversity: computedVocabularyDiversity,
      eyeContact: snapshot.eyeContactPct,
      posture: snapshot.posturePct,
      tone: snapshot.tone,
      transcriptWordCount,
    });

    const mergedAnalysis = {
      ...(data?.analysis || {}),
      attempt_id: Date.now(),
      confidence_score: confidenceScore,
      pace_score: computedPace.score,
      clarity_score: clarityScore,
      words_per_minute: computedWpm,
      filler_count: computedFillerCount,
      pause_count: computedPauseCount,
      pause_ratio: computedPauseRatio,
      vocabulary_diversity: computedVocabularyDiversity,
      speaking_clarity: computedClarity,
      voice_stability: Math.round(snapshot.voiceStability * 100),
      eye_contact: snapshot.eyeContactPct,
      posture_stability: snapshot.posturePct,
      tone: snapshot.tone,
      confidence_index: snapshot.confidenceIndex,
      ai_feedback: aiFeedback,
      question_wise_analysis: questionAnalysesRef.current,
      question_alignment_avg: questionAnalysesRef.current.length
        ? Math.round(
            questionAnalysesRef.current.reduce(
              (sum, item) => sum + (Number(item.relevanceScore) || 0),
              0
            ) / questionAnalysesRef.current.length
          )
        : 0,
    };

    localStorage.setItem("report_analysis", JSON.stringify(mergedAnalysis));
    localStorage.setItem(
      "report_transcript",
      finalTranscript || "Transcript not captured"
    );

    navigate("/report");
  }, [finalizeCurrentQuestionReview, handleRecordingStop, navigate]);

  const handlePostureScore = useCallback((score) => {
    const safe = clamp(Number(score) || 0, 0, 1);
    setLiveConfidence((prev) => {
      const next = Number((prev + (safe - prev) * 0.32).toFixed(4));
      return Math.abs(next - prev) >= 0.01 ? next : prev;
    });
  }, []);

  const handleVoiceScore = useCallback((score) => {
    const safe = clamp(Number(score) || 0, 0, 1);
    setLiveVoiceScore((prev) => {
      const next = Number((prev + (safe - prev) * 0.34).toFixed(4));
      return Math.abs(next - prev) >= 0.01 ? next : prev;
    });
  }, []);

  const handleVoiceMetrics = useCallback((metrics) => {
    const now = performance.now();
    if (now - lastVoiceMetricsPaintRef.current < 120) return;
    lastVoiceMetricsPaintRef.current = now;

    const incomingPauseCount = Math.max(0, Number(metrics?.pauseCount) || 0);
    const incomingPauseRatio = clamp(Number(metrics?.pauseRatio ?? 1), 0, 1);
    const incomingStability = clamp(Number(metrics?.stability ?? 0), 0, 1);
    const incomingTone = metrics?.tone || "Neutral";

    setPauseCount((prev) =>
      Math.abs(incomingPauseCount - prev) >= 1 ? incomingPauseCount : prev
    );
    setPauseRatio((prev) =>
      Math.abs(incomingPauseRatio - prev) >= 0.01 ? incomingPauseRatio : prev
    );
    setVoiceStability((prev) =>
      Math.abs(incomingStability - prev) >= 0.01 ? incomingStability : prev
    );
    setTone((prev) => (prev !== incomingTone ? incomingTone : prev));
  }, []);

  const handlePostureMetrics = useCallback((metrics) => {
    const now = performance.now();
    if (now - lastPostureMetricsPaintRef.current < 120) return;
    lastPostureMetricsPaintRef.current = now;

    const eye = clamp(Math.round((metrics?.eyeContact || 0) * 100), 0, 100);
    const stability = clamp(Number(metrics?.stability ?? 0), 0, 1);
    const alignment = clamp(
      Number(metrics?.postureAlignment ?? metrics?.stability ?? 0),
      0,
      1
    );
    const stillness = clamp(
      Number(metrics?.headStillness ?? metrics?.stability ?? 0),
      0,
      1
    );
    const postureBlend = clamp(
      stability * 0.3 + alignment * 0.36 + stillness * 0.34,
      0,
      1
    );
    const posture = clamp(Math.round(postureBlend * 100), 0, 100);

    setEyeContactPct((prev) => {
      const next = Math.round(prev + (eye - prev) * 0.36);
      return Math.abs(next - prev) >= 1 ? next : prev;
    });
    setPosturePct((prev) => {
      const next = Math.round(prev + (posture - prev) * 0.36);
      return Math.abs(next - prev) >= 1 ? next : prev;
    });
  }, []);

  return (
    <div className="mi-page">
      <div className="mi-layout">
        <section className="mi-column mi-left-shell">
          <article className="mi-panel mi-question-card">
            <div className="mi-kicker">Current Question</div>
            <h2 className="mi-question-text">{QUESTIONS[index].text}</h2>
            <div className="mi-buttons">
              <button type="button" className="mi-btn ask" onClick={askQuestion}>
                Ask Question
              </button>
              <button type="button" className="mi-btn next" onClick={nextQuestion}>
                {index + 1 >= QUESTIONS.length ? "Finish Interview" : "Next Question"}
              </button>
            </div>
          </article>

          <article className="mi-panel mi-transcript-card">
            <h3 className="mi-block-title">Transcript</h3>
            <div
              ref={transcriptBoxRef}
              className="mi-transcript-box"
              role="log"
              aria-live="polite"
              aria-atomic="false"
            >
              <span className="mi-transcript-live">{transcriptPreview || "Start speaking..."}</span>
            </div>
            <div className="mi-wave" aria-hidden="true">
              {Array.from({ length: 40 }).map((_, indexWave) => (
                <span key={indexWave} style={{ animationDelay: `${indexWave * 65}ms` }} />
              ))}
            </div>

            {!speechSupported && (
              <p className="mi-browser-note">Live transcript requires Chrome Speech Recognition support.</p>
            )}
          </article>
        </section>

        <section className="mi-column">
          <article className="mi-panel mi-right-shell">
            <div className="mi-live-pill">LIVE INTERVIEW</div>

            <div className="mi-camera-card">
              <VideoRecorder
                ref={recorderRef}
                title=""
                showControls={false}
                showEmotion={false}
                showHeader={false}
                showPlayback={false}
                showInactiveOverlay={false}
                onUploadComplete={handleUploadComplete}
                onPostureScore={handlePostureScore}
                onVoiceScore={handleVoiceScore}
                onRecordingStart={handleRecordingStart}
                onRecordingStop={handleRecordingStop}
                onVoiceMetrics={handleVoiceMetrics}
                onPostureMetrics={handlePostureMetrics}
                onRecordingStateChange={setIsRecording}
              />
              <span className="mi-camera-dot" aria-hidden="true" />
            </div>

            <div className="mi-bottom-stats">
              <div className="mi-stat-card detail">
                <div className="mi-time-card">
                  <div className="mi-time-primary">
                    <span>Time Remaining</span>
                    <strong>{formatClock(timeLeft)}</strong>
                  </div>
                  <div className="mi-time-divider" />
                  <div className="mi-time-secondary">Per Question</div>
                </div>

                <div className="mi-review-card">
                  <div className="mi-review-head">
                    <span>Question Match Review</span>
                    <strong
                      className={`mi-review-badge ${
                        !lastQuestionReview
                          ? "pending"
                          : lastQuestionReview.verdict === "Strong Match"
                          ? "strong"
                          : lastQuestionReview.verdict === "Partial Match"
                          ? "partial"
                          : "off"
                      }`}
                    >
                      {!lastQuestionReview
                        ? "Pending"
                        : `${lastQuestionReview.verdict} ${lastQuestionReview.relevanceScore}%`}
                    </strong>
                  </div>
                  <p>
                    {lastQuestionReview
                      ? lastQuestionReview.guidance
                      : "After each Next Question click, your answer is graded for alignment with the asked question."}
                  </p>
                </div>

                {questionAnalyses.length > 0 && (
                  <div className="mi-review-list">
                    {questionAnalyses.slice(-3).map((item) => (
                      <div key={`${item.questionId}-${item.questionOrder}`}>
                        <span>Q{item.questionOrder + 1}</span>
                        <strong>{item.relevanceScore}%</strong>
                      </div>
                    ))}
                  </div>
                )}

                <p className="mi-tip">{interviewTip}</p>
              </div>

              <div className="mi-stat-card">
                <div className="mi-stat-title">Speech Pace</div>
                <div className="mi-stat-value">
                  {wpm || 0} <span>WPM</span>
                </div>
                <div className={`mi-stat-sub ${pace.label === "Normal" ? "good" : ""}`}>{paceSummary}</div>
                <div className="mi-pace-advice">
                  {paceAdviceLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            </div>

            <p className="mi-awaiting">
              {isRecording ? "Interview in progress..." : "Click Ask Question to begin"}
            </p>
          </article>
        </section>
      </div>
    </div>
  );
}
