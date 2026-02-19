// client/src/pages/MockInterview.jsx

import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import VideoRecorder from "../components/VideoRecorder";
import "../styles/home.css";

const QUESTIONS = [
  { id: "q1", text: "Tell me about yourself.", timeLimit: 40 },
  { id: "q2", text: "Tell me about a difficult problem you solved.", timeLimit: 60 },
  { id: "q3", text: "What are your strengths and weaknesses?", timeLimit: 50 },
  { id: "q4", text: "Describe a time you failed and what you learned.", timeLimit: 50 },
  { id: "q5", text: "How do you handle feedback?", timeLimit: 40 },
];

export default function MockInterview() {
  const location = useLocation();
  const [enterClass, setEnterClass] = useState("");

  const [index, setIndex] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [timeLeft, setTimeLeft] = useState(QUESTIONS[0].timeLimit);

  const [liveConfidence, setLiveConfidence] = useState(0);
  const [liveVoiceScore, setLiveVoiceScore] = useState(1);

  const timerRef = useRef(null);

  // -------------------------
  // Direction Animation
  // -------------------------
  useEffect(() => {
    if (location.state?.direction === "left") {
      setEnterClass("enter-from-left");
    } else if (location.state?.direction === "right") {
      setEnterClass("enter-from-right");
    }
  }, [location.state]);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  // -------------------------
  // Timer
  // -------------------------
  function startTimer() {
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
  }

  function askQuestion() {
    setAnalysis(null);
    startTimer();
  }

  function nextQuestion() {
    clearInterval(timerRef.current);
    if (index + 1 < QUESTIONS.length) {
      setIndex(index + 1);
      setTimeLeft(QUESTIONS[index + 1].timeLimit);
      setAnalysis(null);
    }
  }

  // -------------------------
  // Combine Backend + Live AI
  // -------------------------
  function handleUploadComplete(data) {
    if (!data.analysis) return;

    const backendScore = data.analysis.confidence_score / 10;

    const combined =
      backendScore * 0.5 +
      liveConfidence * 0.3 +
      liveVoiceScore * 0.2;

    data.analysis.confidence_score = Math.round(combined * 10);

    setAnalysis(data.analysis);
  }

  return (
    <div
      className={`mock-page ${enterClass}`}
      style={{
        display: "flex",
        height: "100vh",
        background: "linear-gradient(135deg,#f8fafc,#eef2ff)",
        padding: "50px",
        gap: "50px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* LEFT SIDE */}
      <div style={{ flex: 1.3 }}>
        <h2 style={{ marginBottom: 20 }}>🤖 AI Mock Interview</h2>

        <div style={{ background: "#fff", padding: 30, borderRadius: 20 }}>
          <p>
            Question {index + 1} of {QUESTIONS.length}
          </p>

          <h3 style={{ marginTop: 10 }}>
            {QUESTIONS[index].text}
          </h3>

          <p
            style={{
              marginTop: 10,
              fontWeight: 600,
              color: timeLeft <= 5 ? "#ef4444" : "#10b981",
            }}
          >
            ⏳ {timeLeft}s
          </p>

          <div style={{ marginTop: 15 }}>
            <button onClick={askQuestion}>Ask</button>
            <button onClick={nextQuestion} style={{ marginLeft: 10 }}>
              Next
            </button>
          </div>
        </div>

        {/* FEEDBACK */}
        <div
          style={{
            marginTop: 30,
            background: "#fff",
            padding: 25,
            borderRadius: 20,
          }}
        >
          <h4>📊 AI Feedback</h4>

          <div style={{ marginBottom: 10 }}>
            <strong>Live Confidence:</strong>{" "}
            {(liveConfidence * 100).toFixed(0)}%

            <div
              style={{
                height: 8,
                background: "#e2e8f0",
                borderRadius: 20,
                marginTop: 5,
              }}
            >
              <div
                style={{
                  width: `${liveConfidence * 100}%`,
                  height: "100%",
                  background:
                    liveConfidence > 0.7
                      ? "#22c55e"
                      : liveConfidence > 0.4
                      ? "#f59e0b"
                      : "#ef4444",
                }}
              />
            </div>
          </div>

          {analysis ? (
            <>
              <p>
                <strong>Final Confidence:</strong>{" "}
                {analysis.confidence_score}/10
              </p>
              <p><strong>Pace:</strong> {analysis.pace_score}/10</p>
              <p><strong>Engagement:</strong> {analysis.engagement_score}/10</p>
              <p><strong>WPM:</strong> {analysis.words_per_minute}</p>
            </>
          ) : (
            <p style={{ color: "#94a3b8" }}>
              Record your answer to see evaluation.
            </p>
          )}
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div style={{ flex: 0.9 }}>
        <div style={{ background: "#fff", padding: 20, borderRadius: 20 }}>
          <VideoRecorder
            onUploadComplete={handleUploadComplete}
            onPostureScore={setLiveConfidence}
            onVoiceScore={setLiveVoiceScore}
          />
        </div>
      </div>
    </div>
  );
}