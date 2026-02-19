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
  "um","uh","like","basically","hmm",
  "you know","so","actually","literally"
];

export default function MockInterview() {
  const navigate = useNavigate();

  const [index, setIndex] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [timeLeft, setTimeLeft] = useState(QUESTIONS[0].timeLimit);

  const [liveConfidence, setLiveConfidence] = useState(0);
  const [liveVoiceScore, setLiveVoiceScore] = useState(1);

  const [transcript, setTranscript] = useState("");
  const [wpm, setWpm] = useState(0);
  const [fillerCount, setFillerCount] = useState(0);

  const recognitionRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  // -------------------------
  // Speech Recognition
  // -------------------------
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) return;

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognitionRef.current = recognition;
  }, []);
  useEffect(()=>{
  return ()=> clearInterval(timerRef.current);
},[]);

  // -------------------------
  // Recording Sync
  // -------------------------
  function handleRecordingStart(){
    setTranscript("");
    setTimeout(()=>{
      recognitionRef.current?.start();
      startTimeRef.current = Date.now();
    }, 200);
  }

  function handleRecordingStop(){
  setTimeout(()=>{
    recognitionRef.current?.stop();
  },300);
}

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
  // Speech Metrics
  // -------------------------
  useEffect(() => {
    if (!transcript || !startTimeRef.current) return;

    const words = transcript.toLowerCase().match(/\w+/g) || [];
    const totalWords = words.length;

    const durationMs = Date.now() - startTimeRef.current;
    const durationMin = Math.max(durationMs / 60000, 0.1);

    const wpmVal = totalWords / durationMin;

    let filler = 0;
    words.forEach(w=>{
      const clean = w.replace(/[.,!?]/g,"").trim();
      if(fillerWords.includes(clean)) filler++;
    });

    setWpm(Math.round(wpmVal));
    setFillerCount(filler);
  }, [transcript]);

  // -------------------------
  // AI Feedback Generator
  // -------------------------
  function generateAIFeedback({ confidence, wpm, filler }) {
    const feedback = [];

    if (confidence >= 8) feedback.push("You appeared confident and composed.");
    else if (confidence >= 6) feedback.push("Your confidence was moderate. Maintain stronger eye contact.");
    else feedback.push("You seemed nervous. Try relaxing your shoulders.");

    if (wpm > 160) feedback.push("You spoke too fast.");
    else if (wpm < 110) feedback.push("You spoke slightly slow.");
    else feedback.push("Your speaking pace was good.");

    if (filler > 3) feedback.push("Too many filler words.");
    else if (filler > 0) feedback.push("Minor filler words detected.");
    else feedback.push("Great! No filler words.");

    return feedback;
  }

  // -------------------------
  // Combine Scores
  // -------------------------
  function handleUploadComplete(data) {
    recognitionRef.current?.stop();

    if (!data.analysis) {
      alert("Analysis failed");
      return;
    }

    const backendScore = data.analysis.confidence_score / 10;

    const paceScore =
      wpm > 110 && wpm < 160 ? 1 : 0.7;

    const fillerScore =
      fillerCount === 0 ? 1 : Math.max(0.5, 1 - fillerCount * 0.05);

    const combined =
      backendScore * 0.4 +
      liveConfidence * 0.25 +
      liveVoiceScore * 0.2 +
      paceScore * 0.1 +
      fillerScore * 0.05;

    data.analysis.confidence_score = Math.round(combined * 10);

    const aiFeedback = generateAIFeedback({
      confidence: data.analysis.confidence_score,
      wpm,
      filler: fillerCount
    });

    data.analysis.ai_feedback = aiFeedback;
    setAnalysis(data.analysis);

    // ⭐ Navigate to report page
    console.log("Transcript before navigation:", transcript);

console.log("Transcript before navigation:", transcript);

// ⭐ Save before navigation
// ⭐ Wait for final speech result before saving
setTimeout(()=>{
  localStorage.setItem("report_analysis", JSON.stringify(data.analysis));
  localStorage.setItem("report_transcript", transcript || "Transcript not captured");

  console.log("Saved transcript:", transcript);

  navigate("/report");
}, 500);
  }

  return (
    <div style={{ display: "flex", height: "100vh", padding: 50, gap: 50 }}>
      <div style={{ flex: 1.3 }}>
        <h2>🤖 AI Mock Interview</h2>

        <h3>{QUESTIONS[index].text}</h3>
        <p>⏳ {timeLeft}s</p>

        <button onClick={askQuestion}>Ask</button>
        <button onClick={nextQuestion}>Next</button>

        <div style={{ marginTop: 20 }}>
          <strong>Transcript:</strong>
          <p>{transcript || "Start speaking..."}</p>
        </div>

        <p>WPM: {wpm}</p>
        <p>Filler words: {fillerCount}</p>

        {analysis && (
          <>
            <p>Final Confidence: {analysis.confidence_score}/10</p>
            <p>Pace: {analysis.pace_score}/10</p>
            <p>Engagement: {analysis.engagement_score}/10</p>

            <h4>AI Feedback</h4>
            {analysis.ai_feedback?.map((f,i)=>(
              <p key={i}>💡 {f}</p>
            ))}
          </>
        )}
      </div>

      <div style={{ flex: 0.9 }}>
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