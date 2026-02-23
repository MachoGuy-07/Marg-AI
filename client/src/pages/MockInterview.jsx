import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import VideoRecorder from "../components/VideoRecorder";
import "../styles/mockInterview.css";

const QUESTIONS = [
  { id: "q1", text: "Tell me about yourself.", timeLimit: 40 },
  {
    id: "q2",
    text: "Tell me about a difficult problem you solved.",
    timeLimit: 60,
  },
  {
    id: "q3",
    text: "What are your strengths and weaknesses?",
    timeLimit: 50,
  },
  {
    id: "q4",
    text: "Describe a time you failed and what you learned.",
    timeLimit: 50,
  },
  { id: "q5", text: "How do you handle feedback?", timeLimit: 40 },
];

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

function postureLabel(percent) {
  if (percent >= 80) return "Excellent";
  if (percent >= 65) return "Steady";
  if (percent >= 50) return "Needs Focus";
  return "Unstable";
}

function emotionLabel(emotion) {
  if (emotion === "Smile") return "Calm & Attentive";
  if (emotion === "Neutral") return "Calm & Attentive";
  return emotion;
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
      `Eye contact is ${eyeContact}%. Look at the lens while finishing each point.`
    );
  } else {
    tips.push(
      `Eye contact is ${eyeContact}%. Keep this level while answering harder questions.`
    );
  }

  if (posture < 65) {
    tips.push(
      `Posture stability is ${posture}%. Keep shoulders still and avoid frequent leaning.`
    );
  } else {
    tips.push(
      `Posture stability is ${posture}%. Your body language supports confidence.`
    );
  }

  if (paceLabel === "Fast") {
    tips.push(`You are rushing at ${wpm} WPM. Pause after each key achievement.`);
  } else if (paceLabel === "Slow") {
    tips.push(`Pace is ${wpm} WPM. Shorter, direct sentences will sound more decisive.`);
  } else {
    tips.push(`Pace is controlled at ${wpm || 0} WPM. Maintain this in follow-up answers.`);
  }

  if (fillerRate > 0.05) {
    tips.push(
      `High filler usage (${fillerCount}). Replace fillers with silence and tighter transitions.`
    );
  } else if (fillerCount > 0) {
    tips.push(`Minor filler usage (${fillerCount}). Clean this up for sharper delivery.`);
  } else {
    tips.push("No filler words detected. Delivery was crisp.");
  }

  if (pauseCount > 8) {
    tips.push(
      `Pause frequency is high (${pauseCount}). Finish each sentence with one clear conclusion.`
    );
  } else {
    tips.push(`Pause control is acceptable (${pauseCount}). Keep pauses intentional.`);
  }

  if (vocabularyDiversity < 34) {
    tips.push(
      `Vocabulary diversity is ${vocabularyDiversity}%. Use stronger action verbs and quantifiable outcomes.`
    );
  } else {
    tips.push(
      `Vocabulary diversity is ${vocabularyDiversity}%. Good lexical range for interview context.`
    );
  }

  if (clarity < 70) {
    tips.push(
      `Clarity is ${clarity}%. Reduce speed swings and simplify sentence structure.`
    );
  } else {
    tips.push(`Clarity is ${clarity}%. Keep this structure under pressure.`);
  }

  if (tone === "Flat") {
    tips.push("Tone sounds flat. Add emphasis on impact words and outcomes.");
  } else if (tone === "Energetic") {
    tips.push("Tone is energetic. Keep enthusiasm but control intensity on long answers.");
  } else {
    tips.push("Tone is balanced. Keep subtle variation between setup and impact.");
  }

  return tips;
}

function SegmentedBar({ value, max = 100, count = 28, variant = "blue" }) {
  const safe = clamp(value || 0, 0, max);
  const active = Math.round((safe / max) * count);
  return (
    <div className={`mi-segments mi-${variant}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <span key={index} className={index < active ? "on" : ""} />
      ))}
    </div>
  );
}

function ConfidenceRing({ value }) {
  const safe = clamp(value || 0, 0, 100);
  const ringStyle = {
    background: `conic-gradient(#88fff0 0% ${Math.round(
      safe * 0.42
    )}%, #f6c86f ${Math.round(safe * 0.42)}% ${Math.round(
      safe * 0.68
    )}%, #6ea8ff ${Math.round(safe * 0.68)}% ${safe}%, rgba(148, 163, 184, 0.25) ${safe}% 100%)`,
  };

  return (
    <div className="mi-ring-shell">
      <div className="mi-ring" style={ringStyle}>
        <div className="mi-ring-core">
          <div className="mi-ring-value">{safe}%</div>
          <div className="mi-ring-label">Confidence Index</div>
        </div>
      </div>
    </div>
  );
}

function RightStat({ title, value, percent, variant = "blue" }) {
  return (
    <div className="mi-rstat">
      <div className="mi-rstat-head">
        <span>{title}</span>
        <span>{value}</span>
      </div>
      <SegmentedBar value={percent} count={16} variant={variant} />
    </div>
  );
}

export default function MockInterview() {
  const navigate = useNavigate();
  const recorderRef = useRef(null);

  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");
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
  const [emotion, setEmotion] = useState("Neutral");
  const [tone, setTone] = useState("Neutral");
  const [liveConfidence, setLiveConfidence] = useState(0);
  const [liveVoiceScore, setLiveVoiceScore] = useState(0);
  const [eyeContactPct, setEyeContactPct] = useState(0);
  const [posturePct, setPosturePct] = useState(0);

  const pace = paceBand(wpm);
  const fillerRate = useMemo(() => {
    const words = tokenize(transcriptRef.current || transcript);
    if (!words.length) return 0;
    return fillerCount / words.length;
  }, [fillerCount, transcript]);

  const speakingClarity = useMemo(() => {
    const raw =
      liveVoiceScore * 0.34 +
      liveConfidence * 0.2 +
      (pace.percent / 100) * 0.19 +
      (1 - clamp(fillerRate * 6, 0, 1)) * 0.15 +
      (vocabularyDiversity / 100) * 0.12;
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
      (eyeContactPct / 100) * 0.28 +
      (posturePct / 100) * 0.24 +
      (speakingClarity / 100) * 0.26 +
      liveVoiceScore * 0.22;
    return clamp(Math.round(raw * 100), 0, 100);
  }, [eyeContactPct, posturePct, speakingClarity, liveVoiceScore]);

  const pauseFrequencyLabel = useMemo(() => {
    if (pauseCount >= 9) return "High";
    if (pauseCount >= 4) return "Moderate";
    return "Low";
  }, [pauseCount]);

  const postureState = postureLabel(posturePct);

  const interviewTip = useMemo(() => {
    if (eyeContactPct < 65) {
      return "Tip: Look directly at the camera to improve perceived confidence.";
    }
    if (posturePct < 65) {
      return "Tip: Keep your shoulders stable and avoid leaning between phrases.";
    }
    if (fillerRate > 0.05) {
      return "Tip: Replace filler words with a 0.5 second pause before your next point.";
    }
    if (pace.label === "Fast") {
      return "Tip: Slow down slightly and add a pause after each impact statement.";
    }
    return "Tip: Keep answers concise: context, action, measurable outcome.";
  }, [eyeContactPct, fillerRate, pace.label, posturePct]);

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

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += `${chunk} `;
        else interim += chunk;
      }

      transcriptRef.current = finalText;
      setTranscript(`${finalText}${interim}`.trim());
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

  const handleRecordingStart = () => {
    transcriptRef.current = "";
    setTranscript("");
    setWpm(0);
    setFillerCount(0);
    setVocabularyDiversity(0);
    setPauseCount(0);
    setTone("Neutral");
    setEmotion("Neutral");
    setEyeContactPct(0);
    setPosturePct(0);
    setLiveVoiceScore(0);
    setLiveConfidence(0);

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

  const askQuestion = () => startTimer();

  const nextQuestion = () => {
    clearInterval(timerRef.current);
    if (index + 1 >= QUESTIONS.length) return;
    setIndex(index + 1);
    setTimeLeft(QUESTIONS[index + 1].timeLimit);
    transcriptRef.current = "";
    setTranscript("");
    setWpm(0);
    setFillerCount(0);
    setVocabularyDiversity(0);
    setPauseCount(0);
  };

  const toggleInterviewSession = () => {
    if (isRecording) {
      recorderRef.current?.stopRecording?.();
    } else {
      recorderRef.current?.startRecording?.();
    }
  };

  const handleUploadComplete = (data) => {
    handleRecordingStop();

    const confidenceScore = clamp(Math.round(confidenceIndex / 10), 1, 10);
    const clarityScore = clamp(Math.round(speakingClarity / 10), 1, 10);

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

    const finalTranscript =
      transcriptRef.current && transcriptRef.current.trim() !== ""
        ? transcriptRef.current.trim()
        : transcript.trim();

    const mergedAnalysis = {
      ...(data?.analysis || {}),
      confidence_score: confidenceScore,
      pace_score: pace.score,
      clarity_score: clarityScore,
      words_per_minute: wpm,
      filler_count: fillerCount,
      pause_count: pauseCount,
      vocabulary_diversity: vocabularyDiversity,
      speaking_clarity: speakingClarity,
      eye_contact: eyeContactPct,
      posture_stability: posturePct,
      tone,
      confidence_index: confidenceIndex,
      ai_feedback: aiFeedback,
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
        <section className="mi-panel mi-left">
          <div className="mi-noise" aria-hidden="true" />
          <h1 className="mi-heading">AI Mock Interview</h1>
          <div className="mi-line" />

          <h2 className="mi-question">{QUESTIONS[index].text}</h2>
          <p className="mi-time">{timeLeft}s</p>

          <div className="mi-buttons">
            <button type="button" className="mi-btn ask" onClick={askQuestion}>
              Ask
            </button>
            <button type="button" className="mi-btn next" onClick={nextQuestion}>
              Next
            </button>
          </div>

          <div className="mi-line" />

          <h3 className="mi-block-title">Transcript:</h3>
          <div className="mi-transcript-box">{transcript || "Start speaking..."}</div>

          {!speechSupported && (
            <p className="mi-browser-note">
              Live transcript requires Chrome Speech Recognition support.
            </p>
          )}

          <div className="mi-metric-grid">
            <div className="mi-metric-card">
              <h4>Pause Frequency</h4>
              <p className="mi-metric-main">
                {pauseFrequencyLabel} <span>Speech Flow: {pace.label}</span>
              </p>
              <SegmentedBar
                value={clamp(100 - pauseCount * 12, 10, 100)}
                variant="blue"
              />
            </div>

            <div className="mi-metric-card">
              <h4>Speaking Clarity</h4>
              <p className="mi-metric-sub">confidence: {speakingClarity}%</p>
              <SegmentedBar value={speakingClarity} variant="blue" />
            </div>

            <div className="mi-metric-card mi-wide">
              <h4>Vocabulary Diversity</h4>
              <p className="mi-metric-main">{vocabularyDiversity}%</p>
              <SegmentedBar value={vocabularyDiversity} variant="green" />
            </div>

            <div className="mi-metric-card mi-wide">
              <h4>Posture Stability</h4>
              <p className="mi-metric-main">
                {postureState} <span>{posturePct}%</span>
              </p>
              <SegmentedBar value={posturePct} variant="green" />
            </div>
          </div>

          <p className="mi-tip">{interviewTip}</p>
        </section>

        <section className="mi-panel mi-right">
          <div className="mi-noise" aria-hidden="true" />

          <div className="mi-mood-chip">{emotionLabel(emotion)}</div>

          <VideoRecorder
            ref={recorderRef}
            title=""
            showControls={false}
            showEmotion={false}
            showHeader={false}
            showPlayback={false}
            onUploadComplete={handleUploadComplete}
            onPostureScore={setLiveConfidence}
            onVoiceScore={setLiveVoiceScore}
            onRecordingStart={handleRecordingStart}
            onRecordingStop={handleRecordingStop}
            onEmotionChange={setEmotion}
            onVoiceMetrics={(metrics) => {
              setPauseCount(metrics.pauseCount || 0);
              setTone(metrics.tone || "Neutral");
            }}
            onPostureMetrics={(metrics) => {
              const eye = clamp(Math.round((metrics.eyeContact || 0) * 100), 0, 100);
              const posture = clamp(Math.round((metrics.stability || 0) * 100), 0, 100);
              setEyeContactPct(eye);
              setPosturePct(posture);
            }}
            onRecordingStateChange={setIsRecording}
          />

          <div className="mi-right-bottom">
            <ConfidenceRing value={confidenceIndex} />

            <div className="mi-right-stats">
              <RightStat
                title="Confidence Index"
                value={`${confidenceIndex}%`}
                percent={confidenceIndex}
                variant="blue"
              />
              <RightStat
                title="Eye Contact"
                value={`${eyeContactPct}%`}
                percent={eyeContactPct}
                variant="blue"
              />
              <RightStat
                title="Posture Stability"
                value={`${posturePct}%`}
                percent={posturePct}
                variant="green"
              />
            </div>
          </div>

          <button type="button" className="mi-session-btn" onClick={toggleInterviewSession}>
            {isRecording ? "Stop Interview Session" : "Begin Interview Session"}
          </button>
          <p className="mi-awaiting">
            {isRecording ? "Analyzing speech input..." : "Awaiting speech input..."}
          </p>
        </section>
      </div>
    </div>
  );
}
