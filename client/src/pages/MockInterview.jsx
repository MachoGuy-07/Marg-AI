// client/src/pages/MockInterview.jsx

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import VideoRecorder from "../components/VideoRecorder";

const QUESTIONS = [
  { id: "q1", text: "Tell me about yourself.", timeLimit: 40 },
  { id: "q2", text: "Tell me about a difficult problem you solved.", timeLimit: 60 },
  { id: "q3", text: "What are your strengths and weaknesses?", timeLimit: 50 },
  { id: "q4", text: "Describe a time you failed and what you learned.", timeLimit: 50 },
  { id: "q5", text: "How do you handle feedback?", timeLimit: 40 },
];

const fillerWords = [
  "um","uh","like","basically","hmm","so","actually","literally"
];

export default function MockInterview() {

  const navigate = useNavigate();

  const transcriptRef = useRef("");
  const recognitionRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTIONS[0].timeLimit);
  const [liveConfidence, setLiveConfidence] = useState(0);
  const [liveVoiceScore, setLiveVoiceScore] = useState(1);
  const [transcript, setTranscript] = useState("");
  const [wpm, setWpm] = useState(0);
  const [fillerCount, setFillerCount] = useState(0);

  // 🎤 Speech Recognition Setup
  useEffect(() => {

    if (!("webkitSpeechRecognition" in window)) return;

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {

      let interim = "";
      let finalText = transcriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {

        const chunk = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalText += chunk + " ";
        } else {
          interim += chunk;
        }
      }

      transcriptRef.current = finalText;
      setTranscript(finalText + interim);
    };

    recognitionRef.current = recognition;

  }, []);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  // 🎬 Recording Sync
  function handleRecordingStart() {
    transcriptRef.current = "";
    setTranscript("");
    startTimeRef.current = Date.now();
    recognitionRef.current?.start();
  }

  function handleRecordingStop() {
    recognitionRef.current?.stop();
  }

  // ⏱ Timer
  function startTimer() {

    clearInterval(timerRef.current);
    setTimeLeft(QUESTIONS[index].timeLimit);

    timerRef.current = setInterval(() => {

      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });

    }, 1000);
  }

  function askQuestion() {
    startTimer();
  }

  function nextQuestion() {
    clearInterval(timerRef.current);
    if (index + 1 < QUESTIONS.length) {
      setIndex(index + 1);
      setTimeLeft(QUESTIONS[index + 1].timeLimit);
    }
  }

  // 📊 WPM + Filler Count
  useEffect(() => {

    if (!transcript || !startTimeRef.current) return;

    const words = transcript.toLowerCase().match(/\b\w+\b/g) || [];
    const totalWords = words.length;

    const durationMin = Math.max(
      (Date.now() - startTimeRef.current) / 60000,
      0.1
    );

    setWpm(Math.round(totalWords / durationMin));

    let filler = 0;
    words.forEach(w => {
      if (fillerWords.includes(w)) filler++;
    });

    setFillerCount(filler);

  }, [transcript]);

  // 🧠 AI Feedback Generator
  function generateAIFeedback({ confidence, wpm, filler }) {

    const f = [];

    if (confidence >= 8) f.push("You appeared confident and composed.");
    else if (confidence >= 6) f.push("Your confidence was moderate.");
    else f.push("You seemed nervous.");

    if (wpm > 160) f.push("You spoke too fast.");
    else if (wpm < 110) f.push("You spoke slightly slow.");
    else f.push("Your speaking pace was good.");

    if (filler > 3) f.push("Too many filler words.");
    else if (filler > 0) f.push("Minor filler words detected.");
    else f.push("Great! No filler words.");

    return f;
  }

  // 📤 Upload Complete
  function handleUploadComplete(data) {

    recognitionRef.current?.stop();

    if (!data.analysis) {
      alert("Analysis failed");
      return;
    }

    const backendScore = data.analysis.confidence_score / 10;
    const paceScore = wpm > 110 && wpm < 160 ? 1 : 0.7;
    const fillerScore =
      fillerCount === 0 ? 1 : Math.max(0.5, 1 - fillerCount * 0.05);

    const combined =
      backendScore * 0.4 +
      liveConfidence * 0.25 +
      liveVoiceScore * 0.2 +
      paceScore * 0.1 +
      fillerScore * 0.05;

    data.analysis.confidence_score = Math.round(combined * 10);

    data.analysis.ai_feedback = generateAIFeedback({
      confidence: data.analysis.confidence_score,
      wpm,
      filler: fillerCount
    });

    const finalTranscript =
      transcriptRef.current && transcriptRef.current.trim() !== ""
        ? transcriptRef.current
        : transcript;

    localStorage.setItem(
      "report_analysis",
      JSON.stringify(data.analysis)
    );

    localStorage.setItem(
      "report_transcript",
      finalTranscript || "Transcript not captured"
    );

    navigate("/report");
  }

  return (
    <div className="mock-wrapper">

      <div className="mock-panel mock-left">

        <h2 className="mock-title">AI Mock Interview</h2>

        <h3>{QUESTIONS[index].text}</h3>
        <p className="mock-timer">⏳ {timeLeft}s</p>

        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <button onClick={askQuestion} className="mock-btn-primary">
            Ask
          </button>
          <button onClick={nextQuestion} className="mock-btn-secondary">
            Next
          </button>
        </div>

        <div>
          <strong>Transcript:</strong>
          <p className="mock-transcript">
            {transcript || "Start speaking..."}
          </p>
        </div>

        <div style={{ marginTop: "16px" }}>
          <p>WPM: {wpm}</p>
          <p>Filler words: {fillerCount}</p>
        </div>

      </div>

      <div className="mock-panel mock-right">
        <VideoRecorder
          onUploadComplete={handleUploadComplete}
          onPostureScore={setLiveConfidence}
          onVoiceScore={setLiveVoiceScore}
          onRecordingStart={handleRecordingStart}
          onRecordingStop={handleRecordingStop}
        />
      </div>

    </div>
  );
}