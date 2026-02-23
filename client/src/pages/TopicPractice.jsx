import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import "../styles/topicPractice.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const languageOptions = [
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" }
];

function normalizeLanguage(value) {
  const lowered = String(value || "").trim().toLowerCase();
  if (lowered === "c++") return "cpp";
  if (languageOptions.some((item) => item.value === lowered)) return lowered;
  return "python";
}

function formatTime(totalSeconds) {
  const safe = Math.max(0, Number(totalSeconds) || 0);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function TopicPractice() {
  const { topic } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [language, setLanguage] = useState(
    normalizeLanguage(location.state?.language || localStorage.getItem("practice-language"))
  );
  const [showLang, setShowLang] = useState(false);

  const [code, setCode] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [activeTab, setActiveTab] = useState("testcases");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [runResults, setRunResults] = useState([]);
  const [customRun, setCustomRun] = useState(null);
  const [runError, setRunError] = useState("");
  const [aiFeedback, setAiFeedback] = useState(null);

  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const question = questions[currentIndex] || null;

  const selectedLanguageLabel = useMemo(
    () => languageOptions.find((item) => item.value === language)?.label || "Python",
    [language]
  );

  useEffect(() => {
    localStorage.setItem("practice-language", language);
  }, [language]);

  useEffect(() => {
    let cancelled = false;

    async function fetchQuestions() {
      setLoading(true);
      setLoadError("");

      try {
        const slug = String(topic || "").toLowerCase();
        const difficultyValues = new Set(["easy", "medium", "hard"]);
        const params = new URLSearchParams({ language });

        if (difficultyValues.has(slug)) {
          params.set("difficulty", slug);
          params.set("starterMode", "difficulty");
        } else {
          params.set("topic", slug);
          params.set("starterMode", "topic");
        }

        const response = await fetch(`${API_BASE_URL}/api/code/questions?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load questions");
        }

        if (!cancelled) {
          const incoming = Array.isArray(data?.questions) ? data.questions : [];
          setQuestions(incoming);
          setCurrentIndex(0);
        }
      } catch (error) {
        if (!cancelled) {
          setQuestions([]);
          setLoadError(error?.message || "Unable to load coding questions");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchQuestions();

    return () => {
      cancelled = true;
    };
  }, [topic, language]);

  useEffect(() => {
    if (!question) return;
    setCode(question.starterCode || "");
    setCustomInput("");
    setActiveTab("testcases");
    setElapsedSeconds(0);
    setRunResults([]);
    setCustomRun(null);
    setRunError("");
    setAiFeedback(null);
  }, [question, language]);

  useEffect(() => {
    if (!question) return undefined;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [question, language]);

  const handleNext = () => {
    if (!questions.length) return;
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleRun = async () => {
    if (!question) return;
    setIsRunning(true);
    setRunError("");
    setAiFeedback(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/code/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          language,
          code,
          customInput
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Execution failed");
      }

      setRunResults(Array.isArray(data?.results) ? data.results : []);
      setCustomRun(data?.customRun || null);
      setAiFeedback(data?.aiFeedback || null);

      if (!data?.success) {
        setRunError(data?.errorMessage || "Some testcases failed.");
        setActiveTab("ai");
      } else {
        setRunError("");
      }
    } catch (error) {
      setRunError(error?.message || "Execution failed");
      setActiveTab("ai");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!question) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/code/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          language,
          code,
          timeTakenSeconds: elapsedSeconds
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Submission failed");
      }

      const reportPayload = {
        ...data.report,
        success: Boolean(data?.success),
        errorType: data?.errorType || "",
        errorMessage: data?.errorMessage || "",
        aiFeedback: data?.aiFeedback || null,
        attemptedCode: code,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem("coding_report_payload", JSON.stringify(reportPayload));

      navigate("/practice/report", {
        state: {
          report: reportPayload
        }
      });
    } catch (error) {
      setRunError(error?.message || "Submission failed");
      setActiveTab("ai");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="question-page">
        <div className="topic-status-card">Loading coding challenges...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="question-page">
        <div className="topic-status-card error">{loadError}</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="question-page">
        <div className="topic-status-card">No questions found for this track yet.</div>
      </div>
    );
  }

  const testRows = runResults.length ? runResults : (question.testCases || []).map((item) => ({
    id: item.id,
    input: item.input,
    expectedOutput: item.expectedOutput,
    output: "-",
    passed: null
  }));

  return (
    <div className="question-page">
      <div className="question-topbar">
        <div className="nav-section">
          {questions.map((item, index) => (
            <button
              type="button"
              key={item.id}
              className={index === currentIndex ? "nav-pill active" : "nav-pill"}
              onClick={() => setCurrentIndex(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <div className="topbar-right">
          <div className="timer-pill">Time {formatTime(elapsedSeconds)}</div>
          <div className="difficulty-pill">{question.difficulty}</div>
        </div>
      </div>

      <div className="question-main">
        <aside className="question-left">
          <span className="topic-chip">{question.topic}</span>
          <h2>{question.title}</h2>
          <p>{question.description}</p>

          <div className="spec-grid">
            <div>
              <h4>Input</h4>
              <p>{question.inputFormat}</p>
            </div>
            <div>
              <h4>Output</h4>
              <p>{question.outputFormat}</p>
            </div>
          </div>

          <div className="constraint-list">
            <h4>Constraints</h4>
            <ul>
              {(question.constraints || []).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="question-right">
          <div className="editor-top">
            <div className="custom-dropdown">
              <button
                type="button"
                className="dropdown-selected"
                onClick={() => setShowLang((prev) => !prev)}
              >
                {selectedLanguageLabel} <span>v</span>
              </button>
              {showLang && (
                <div className="dropdown-menu">
                  {languageOptions.map((item) => (
                    <button
                      type="button"
                      key={item.value}
                      className={`dropdown-item ${item.value === language ? "active" : ""}`}
                      onClick={() => {
                        setLanguage(item.value);
                        setShowLang(false);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="editor-wrapper">
            <Editor
              height="390px"
              language={language === "cpp" ? "cpp" : language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                scrollBeyondLastLine: false
              }}
            />
          </div>

          <div className="button-row">
            <button type="button" className="btn primary" onClick={handleRun} disabled={isRunning}>
              {isRunning ? "Running..." : "Run Code"}
            </button>
            <button type="button" className="btn success" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
            <button type="button" className="btn neutral" onClick={handleSkip}>
              Skip
            </button>
            <button type="button" className="btn secondary" onClick={handleNext}>
              Next
            </button>
          </div>

          <div className="tabs">
            <button
              type="button"
              className={activeTab === "testcases" ? "tab active" : "tab"}
              onClick={() => setActiveTab("testcases")}
            >
              Testcases
            </button>
            <button
              type="button"
              className={activeTab === "custom" ? "tab active" : "tab"}
              onClick={() => setActiveTab("custom")}
            >
              Custom Input
            </button>
            <button
              type="button"
              className={activeTab === "ai" ? "tab active" : "tab"}
              onClick={() => setActiveTab("ai")}
            >
              AI Feedback
            </button>
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
                  {testRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.input}</td>
                      <td>{row.expectedOutput}</td>
                      <td>{row.output || "-"}</td>
                      <td className={row.passed === null ? "status pending" : row.passed ? "status pass" : "status fail"}>
                        {row.passed === null ? "Pending" : row.passed ? "Pass" : "Fail"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "custom" && (
              <div className="custom-panel">
                <textarea
                  className="custom-input"
                  value={customInput}
                  onChange={(event) => setCustomInput(event.target.value)}
                  placeholder="Provide custom stdin input here..."
                />
                {customRun && (
                  <div className={customRun.success ? "custom-output success" : "custom-output error"}>
                    <h4>{customRun.success ? "Custom Output" : "Custom Run Error"}</h4>
                    <pre>{customRun.success ? customRun.output || "(empty output)" : customRun.error}</pre>
                  </div>
                )}
              </div>
            )}

            {activeTab === "ai" && (
              <div className="ai-box">
                {runError && <p className="run-error">{runError}</p>}

                {aiFeedback ? (
                  <>
                    <h4>{aiFeedback.summary}</h4>
                    <p>{aiFeedback.probableCause}</p>

                    <div className="ai-columns">
                      <div>
                        <h5>Fix Steps</h5>
                        <ul>
                          {(aiFeedback.fixSteps || []).map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5>Error Highlights</h5>
                        <ul>
                          {(aiFeedback.highlightedErrors || []).map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                ) : (
                  <p>AI guidance appears here when your code throws an error or fails testcases.</p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
