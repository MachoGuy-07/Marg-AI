import React, { useEffect, useState } from "react";
import "../styles/report.css";
import {
  Chart as ChartJS,
  ArcElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Line, Radar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export default function Report() {
  const [analysis, setAnalysis] = useState(null);
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    const storedAnalysis = localStorage.getItem("report_analysis");
    const storedTranscript = localStorage.getItem("report_transcript");

    if (storedAnalysis) {
      setAnalysis(JSON.parse(storedAnalysis));
    }

    if (storedTranscript) {
      setTranscript(storedTranscript);
    }
  }, []);

  if (!analysis) {
    return <div style={{ color: "white", padding: "40px" }}>No report found.</div>;
  }

  const confidence = analysis.confidence_score || 6;
  const pace = 7;
  const engagement = 7;

  const createDonut = (value, color) => ({
    datasets: [
      {
        data: [value, 10 - value],
        backgroundColor: [color, "#1e293b"],
        borderWidth: 0,
      },
    ],
  });

  const donutOptions = {
    cutout: "75%",
    plugins: { legend: { display: false } },
  };

  const radarData = {
    labels: ["Confidence", "Pace", "Energy", "Content", "Clarity"],
    datasets: [
      {
        data: [confidence, pace, engagement, confidence - 1, engagement],
        backgroundColor: "rgba(139,92,246,0.3)",
        borderColor: "#8E54E9",
      },
    ],
  };

  const trendData = {
    labels: ["Interview 1", "Interview 2", "Current"],
    datasets: [
      {
        label: "Confidence",
        data: [5, 6, confidence],
        borderColor: "#5B8CFF",
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="report-page">
      <h2>Interview Performance Report</h2>
      <p className="report-date">{new Date().toDateString()}</p>

      <div className="report-top">

        <div className="report-metrics">
          <div className="metric-card">
            <Doughnut data={createDonut(confidence, "#5B8CFF")} options={donutOptions} />
            <p>Confidence</p>
          </div>

          <div className="metric-card">
            <Doughnut data={createDonut(pace, "#00F5A0")} options={donutOptions} />
            <p>Pace</p>
          </div>

          <div className="metric-card">
            <Doughnut data={createDonut(engagement, "#8E54E9")} options={donutOptions} />
            <p>Engagement</p>
          </div>
        </div>

        <div className="prediction-card">
          <h4>Predicted Next Score</h4>
          <h1>{confidence}</h1>
          <p>AI Generated</p>
          <span>Based on your latest performance.</span>
        </div>
      </div>

      <div className="report-bottom">
        <div className="trend-card">
          <h4>Performance Trend</h4>
          <Line data={trendData} />
        </div>

        <div className="radar-card">
          <h4>Your Skill Radar</h4>
          <Radar data={radarData} />
        </div>
      </div>

      <div className="transcript-section">
        <h4>Interview Transcript</h4>
        <p>{transcript}</p>
      </div>

      <div className="feedback-section">
        <h4>AI Feedback</h4>
        <ul>
          {analysis.ai_feedback?.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}