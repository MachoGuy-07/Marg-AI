import React, { useState } from "react";
import PracticeConsole from "../components/PracticeConsole";
import QuestionBank from "../components/QuestionBank";
import "../styles/home.css";

const TOPICS = [
  "Backtracking",
  "Binary Tree",
  "Dynamic Programming",
  "Graph",
  "Greedy",
  "Hashing",
  "Heap",
  "Linked Lists",
  "Matrix",
  "Sliding Window",
  "Stack",
  "Two Pointers",
  "Trie",
  "Misc",
];

export default function Practice() {
  const [language, setLanguage] = useState("javascript");
  const [selectedCode, setSelectedCode] = useState("");
  const [mode, setMode] = useState("topic"); // topic | difficulty
  const [selectedTopic, setSelectedTopic] = useState(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px",
        background: "linear-gradient(135deg,#f8fafc,#eef2ff)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* TOP BAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "35px",
        }}
      >
        <h1 style={{ margin: 0 }}>💻 Practice Coding</h1>

        <div style={{ display: "flex", gap: "15px" }}>
          <button
            onClick={() => setMode("topic")}
            style={{
              padding: "10px 20px",
              borderRadius: "25px",
              border: "none",
              cursor: "pointer",
              background: mode === "topic" ? "#3b82f6" : "#e2e8f0",
              color: mode === "topic" ? "#fff" : "#1e293b",
              fontWeight: 600,
            }}
          >
            Topic Wise
          </button>

          <button
            onClick={() => setMode("difficulty")}
            style={{
              padding: "10px 20px",
              borderRadius: "25px",
              border: "none",
              cursor: "pointer",
              background: mode === "difficulty" ? "#3b82f6" : "#e2e8f0",
              color: mode === "difficulty" ? "#fff" : "#1e293b",
              fontWeight: 600,
            }}
          >
            Difficulty Wise
          </button>
        </div>
      </div>

      {/* LANGUAGE SELECT */}
      <div style={{ marginBottom: "30px" }}>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{
            padding: "10px 18px",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            background: "#fff",
            fontWeight: 500,
            cursor: "pointer",
            boxShadow: "0 5px 20px rgba(0,0,0,0.04)",
          }}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
        </select>
      </div>

      {/* MAIN SECTION */}
      {mode === "topic" ? (
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ marginBottom: "20px" }}>📚 Topics</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "20px",
            }}
          >
            {TOPICS.map((topic) => (
              <div
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                style={{
                  padding: "20px",
                  borderRadius: "20px",
                  background:
                    selectedTopic === topic
                      ? "linear-gradient(135deg,#3b82f6,#6366f1)"
                      : "#ffffff",
                  color:
                    selectedTopic === topic ? "#fff" : "#1e293b",
                  cursor: "pointer",
                  fontWeight: 600,
                  textAlign: "center",
                  boxShadow:
                    "0 15px 40px rgba(59,130,246,0.08)",
                  transition: "all 0.2s ease",
                }}
              >
                {topic}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: "40px" }}>
          <h2>📊 Difficulty Levels</h2>
          {/* We will implement this next */}
        </div>
      )}

      {/* QUESTION + CONSOLE */}
      <div
        style={{
          display: "flex",
          gap: "40px",
        }}
      >
        <div
          style={{
            flex: 0.9,
            background: "#ffffff",
            padding: 30,
            borderRadius: 25,
            boxShadow: "0 20px 60px rgba(59,130,246,0.08)",
          }}
        >
          <h3>🧠 Questions</h3>
          <QuestionBank
            topic={selectedTopic}
            onSelect={setSelectedCode}
          />
        </div>

        <div
          style={{
            flex: 1.3,
            background: "#ffffff",
            padding: 30,
            borderRadius: 25,
            boxShadow: "0 20px 60px rgba(59,130,246,0.08)",
          }}
        >
          <h3>💻 Code Workspace</h3>
          <PracticeConsole
            language={language}
            externalCode={selectedCode}
          />
        </div>
      </div>
    </div>
  );
}