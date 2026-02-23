import React, { useEffect, useMemo, useRef, useState } from "react";
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

const TRANSCRIPT_UI_THROTTLE_MS = 120;

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
}) {
  const tips = [];

  if (eyeContact < 65) {
    tips.push(
      `Eye contact is ${eyeContact}%. Good start. Keep your eyes on the lens while finishing each point.`
    );
  } else {
    tips.push(
      `Eye contact is ${eyeContact}%. Strong presence. Keep this level while answering harder questions.`
    );
  }

  if (posture < 65) {
    tips.push(
      `Posture stability is ${posture}%. You're improving. Keep shoulders still and avoid frequent leaning.`
    );
  } else {
    tips.push(
      `Posture stability is ${posture}%. Your body language already supports confidence.`
    );
  }

  if (paceLabel === "Fast") {
    tips.push(`You are speaking fast at ${wpm} WPM. Add a short pause after each key achievement.`);
  } else if (paceLabel === "Slow") {
    tips.push(`Pace is ${wpm} WPM. Shorter, direct sentences will make your answer sound more decisive.`);
  } else {
    tips.push(`Pace is controlled at ${wpm || 0} WPM. Great flow, maintain this in follow-up answers.`);
  }

  if (fillerRate > 0.05) {
    tips.push(
      `Filler usage is ${fillerCount}. Replace fillers with short silence and tighter transitions.`
    );
  } else if (fillerCount > 0) {
    tips.push(`Minor filler usage (${fillerCount}). Easy win: clean this up for sharper delivery.`);
  } else {
    tips.push("No filler words detected. Crisp and confident delivery.");
  }

  if (pauseCount > 8) {
    tips.push(
      `Pause frequency is ${pauseCount}. Try ending each sentence with one clear conclusion.`
    );
  } else {
    tips.push(`Pause control is good (${pauseCount}). Keep pauses intentional.`);
  }

  if (vocabularyDiversity < 34) {
    tips.push(
      `Vocabulary diversity is ${vocabularyDiversity}%. Add strong action verbs and quantifiable outcomes.`
    );
  } else {
    tips.push(
      `Vocabulary diversity is ${vocabularyDiversity}%. Good lexical range for interview answers.`
    );
  }

  if (clarity < 70) {
    tips.push(
      `Clarity is ${clarity}%. You're close. Reduce speed swings and simplify sentence structure.`
    );
  } else {
    tips.push(`Clarity is ${clarity}%. Excellent structure, keep this under pressure.`);
  }

  if (tone === "Flat") {
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
  const transcriptRef = useRef("");
  const transcriptPreviewRef = useRef("");
  const lastTranscriptPaintAtRef = useRef(0);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const isRecordingRef = useRef(false);

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

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = transcriptRef.current;
      let hasFinalChunk = false;

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          hasFinalChunk = true;
          finalText += `${chunk} `;
        }
        else interim += chunk;
      }

      transcriptRef.current = finalText;
      const combinedTranscript = `${finalText}${interim}`.trim();
      const now = Date.now();
      const shouldPaint =
        hasFinalChunk ||
        now - lastTranscriptPaintAtRef.current >= TRANSCRIPT_UI_THROTTLE_MS;

      if (shouldPaint && combinedTranscript !== transcriptPreviewRef.current) {
        lastTranscriptPaintAtRef.current = now;
        transcriptPreviewRef.current = combinedTranscript;
        setTranscript(combinedTranscript);
      }
    };

    recognition.onend = () => {
      if (!isRecordingRef.current) return;
      try {
        recognition.start();
      } catch (err) {
        // no-op
      }
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch (err) {
        // no-op
      }
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

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

  const upsertQuestionReview = (review) => {
    const next = [
      ...questionAnalysesRef.current.filter((item) => item.questionId !== review.questionId),
      review,
    ].sort((a, b) => a.questionOrder - b.questionOrder);
    questionAnalysesRef.current = next;
    setQuestionAnalyses(next);
    setLastQuestionReview(review);
  };

  const finalizeCurrentQuestionReview = () => {
    const question = QUESTIONS[index];
    if (!question) return null;

    const answerFromRef = String(transcriptRef.current || "").trim();
    const answerFromUi = String(transcript || "").trim();
    const answer = answerFromUi.length > answerFromRef.length ? answerFromUi : answerFromRef || answerFromUi;

    const review = evaluateQuestionResponse({
      question: question.text,
      answer,
      questionOrder: index,
      wpm,
      paceLabel: pace.label,
      clarity: speakingClarity,
      confidenceIndex,
      fillerRate,
    });

    upsertQuestionReview(review);
    return review;
  };

  const handleRecordingStart = () => {
    transcriptRef.current = "";
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
    questionAnalysesRef.current = [];
    setQuestionAnalyses([]);
    setLastQuestionReview(null);

    startTimeRef.current = Date.now();
    setIsRecording(true);
    isRecordingRef.current = true;

    try {
      recognitionRef.current?.start();
    } catch (err) {
      // no-op
    }
  };

  const handleRecordingStop = () => {
    setIsRecording(false);
    isRecordingRef.current = false;
    const finalTranscript = String(transcriptRef.current || "").trim();
    if (finalTranscript && finalTranscript !== transcriptPreviewRef.current) {
      transcriptPreviewRef.current = finalTranscript;
      setTranscript(finalTranscript);
    }
    try {
      recognitionRef.current?.stop();
    } catch (err) {
      // no-op
    }
  };

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
    transcriptRef.current = "";
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

  const handleUploadComplete = (data) => {
    handleRecordingStop();
    finalizeCurrentQuestionReview();

    const confidenceScore = clamp(Math.round((confidenceIndex + 12) / 10), 3, 10);
    const clarityScore = clamp(Math.round((speakingClarity + 10) / 10), 3, 10);

    const aiFeedback = buildAIFeedback({
      wpm,
      paceLabel: pace.label,
      fillerCount,
      fillerRate,
      pauseCount,
      clarity: speakingClarity,
      vocabularyDiversity,
      eyeContact: eyeContactPct,
      posture: posturePct,
      tone,
    });

    const transcriptFromRef = String(transcriptRef.current || "").trim();
    const transcriptFromUi = String(transcript || "").trim();
    const finalTranscript =
      transcriptFromUi.length > transcriptFromRef.length
        ? transcriptFromUi
        : transcriptFromRef || transcriptFromUi;

    const mergedAnalysis = {
      ...(data?.analysis || {}),
      attempt_id: Date.now(),
      confidence_score: confidenceScore,
      pace_score: pace.score,
      clarity_score: clarityScore,
      words_per_minute: wpm,
      filler_count: fillerCount,
      pause_count: pauseCount,
      pause_ratio: Number(pauseRatio.toFixed(3)),
      vocabulary_diversity: vocabularyDiversity,
      speaking_clarity: speakingClarity,
      voice_stability: Math.round(voiceStability * 100),
      eye_contact: eyeContactPct,
      posture_stability: posturePct,
      tone,
      confidence_index: confidenceIndex,
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
  };

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
            <div className="mi-transcript-box">{transcriptPreview || "Start speaking..."}</div>
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
                onPostureScore={(score) => {
                  const safe = clamp(Number(score) || 0, 0, 1);
                  setLiveConfidence((prev) => {
                    const next = Number((prev + (safe - prev) * 0.32).toFixed(4));
                    return Math.abs(next - prev) >= 0.01 ? next : prev;
                  });
                }}
                onVoiceScore={(score) => {
                  const safe = clamp(Number(score) || 0, 0, 1);
                  setLiveVoiceScore((prev) => {
                    const next = Number((prev + (safe - prev) * 0.34).toFixed(4));
                    return Math.abs(next - prev) >= 0.01 ? next : prev;
                  });
                }}
                onRecordingStart={handleRecordingStart}
                onRecordingStop={handleRecordingStop}
                onVoiceMetrics={(metrics) => {
                  setPauseCount(Number(metrics.pauseCount) || 0);
                  setPauseRatio(clamp(Number(metrics.pauseRatio ?? 1), 0, 1));
                  setVoiceStability(clamp(Number(metrics.stability ?? 0), 0, 1));
                  setTone(metrics.tone || "Neutral");
                }}
                onPostureMetrics={(metrics) => {
                  const eye = clamp(Math.round((metrics.eyeContact || 0) * 100), 0, 100);
                  const stability = clamp(Number(metrics.stability ?? 0), 0, 1);
                  const alignment = clamp(
                    Number(metrics.postureAlignment ?? metrics.stability ?? 0),
                    0,
                    1
                  );
                  const stillness = clamp(
                    Number(metrics.headStillness ?? metrics.stability ?? 0),
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
                }}
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
