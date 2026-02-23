import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { questions } from "../data/questions";
import "../styles/topicPractice.css";

export default function TopicPractice() {
  const { topic } = useParams();

  const filteredQuestions = questions.filter(
    (q) => q.slug === topic || q.difficulty === topic
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [language, setLanguage] = useState("python");
  const [activeTab, setActiveTab] = useState("testcases");
  const [code, setCode] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [time, setTime] = useState(0);
  const [showLang, setShowLang] = useState(false);

  const question = filteredQuestions[currentIndex];

  /* Load question */
  useEffect(() => {
    if (question) {
      setCode(question.starterCode);
      setTime(0);
    }
  }, [question]);

  /* Timer */
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!question) {
    return (
      <div style={{ color: "white", padding: "40px" }}>
        No question found
      </div>
    );
  }

  const formatTime = () => {
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleSave = () => {
    localStorage.setItem(`code-${question.id}`, code);
    alert("Code saved!");
  };

const languageLabel = (lang) => {
  switch (lang) {
    case "python":
      return "Python";
    case "javascript":
      return "JavaScript";
    case "cpp":
      return "C++";
    case "java":
      return "Java";
    default:
      return lang;
  }
};
  return (
    <div className="question-page">

      {/* ===== TOP BAR (FULL WIDTH CENTERED) ===== */}
      <div className="question-topbar">
        <div className="topbar-center">

          <div className="nav-section">
            {filteredQuestions.map((_, index) => (
              <div
                key={index}
                className={`nav-pill ${index === currentIndex ? "active" : ""}`}
                onClick={() => setCurrentIndex(index)}
              >
                {index + 1}
              </div>
            ))}
          </div>

          <div className="timer-pill">
            ⏱ {formatTime()}
          </div>

        </div>
      </div>

      {/* ===== MAIN CONTENT ROW ===== */}
      <div className="question-main">

        {/* LEFT PANEL */}
        <div className="question-left">
          <h2>{question.title}</h2>
          <p>{question.description}</p>
        </div>

        {/* RIGHT PANEL */}
        <div className="question-right">

          <div className="editor-top">
            <div className="custom-dropdown">
  <div
    className="dropdown-selected"
    onClick={() => setShowLang((prev) => !prev)}
  >
    {languageLabel(language)} ▾
  </div>

  {showLang && (
    <div className="dropdown-menu">
      {["python", "javascript", "cpp", "java"].map((lang) => (
        <div
          key={lang}
          className="dropdown-item"
          onClick={() => {
            setLanguage(lang);
            setShowLang(false);
          }}
        >
          {languageLabel(lang)}
        </div>
      ))}
    </div>
  )}
</div>
          </div>

          <div className="editor-wrapper">
            <Editor
              height="350px"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value)}
            />
          </div>

          <div className="button-row">
            <button className="btn primary">Run Code</button>
            <button className="btn success" onClick={handleSave}>Submit</button>
            <button className="btn neutral" onClick={handleSkip}>Skip</button>
            <button className="btn secondary" onClick={handleNext}>Next</button>
          </div>

          {/* ===== TABS ===== */}
          <div className="tabs">
            <div
              className={activeTab === "testcases" ? "tab active" : "tab"}
              onClick={() => setActiveTab("testcases")}
            >
              Testcases
            </div>
            <div
              className={activeTab === "custom" ? "tab active" : "tab"}
              onClick={() => setActiveTab("custom")}
            >
              Custom Input
            </div>
            <div
              className={activeTab === "ai" ? "tab active" : "tab"}
              onClick={() => setActiveTab("ai")}
            >
              AI Suggestions
            </div>
          </div>

          <div className="tab-content">
            {activeTab === "testcases" && (
  <table className="result-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Input</th>
        <th>Expected Output</th>
        <th>Your Output</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>TC1</td>
        <td>[1,2]</td>
        <td>[[],[1],[2],[1,2]]</td>
        <td>-</td>
        <td className="status pending">Pending</td>
      </tr>
    </tbody>
  </table>
)}

            {activeTab === "custom" && (
              <textarea
                className="custom-input"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Enter custom input here..."
              />
            )}

            {activeTab === "ai" && (
              <div className="ai-box">
                AI suggestions will appear here.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}