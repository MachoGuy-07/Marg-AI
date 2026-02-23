import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import LanguageSelector from "../components/practice/LanguageSelector";
import { LANGUAGE_OPTIONS, normalizeLanguage } from "../data/dsaTopics";
import {
  getQuestionById,
  getTopicQuestions,
  parseStableQuestionIndex,
  resolveRuntimeTopicSlug
} from "../data/questions";
import "../styles/questionPages.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

function hasExecutableTestPack(question) {
  return (
    question?.evaluationAvailable !== false &&
    Array.isArray(question?.testCases) &&
    question.testCases.length >= 3
  );
}

function formatTime(totalSeconds) {
  const safe = Math.max(0, Number(totalSeconds) || 0);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function getStaticQuestion(language, topic, questionId) {
  const direct = getQuestionById(language, topic, questionId);
  if (direct) return direct;
  const list = getTopicQuestions(language, topic);
  const index = parseStableQuestionIndex(questionId);
  return list[index] || null;
}

function mapBackendQuestion(topicKey, fallbackQuestion, backendQuestion, stableId, language) {
  const fallbackTags = Array.isArray(fallbackQuestion?.tags) ? fallbackQuestion.tags : [];
  const fallbackStarter =
    typeof fallbackQuestion?.starterCode === "string"
      ? fallbackQuestion.starterCode
      : (fallbackQuestion?.starterCode?.[language] || "");
  const generatedTags = [
    String(topicKey || "").replace(/-/g, " "),
    String(backendQuestion?.difficulty || "").toLowerCase()
  ].filter(Boolean);

  return {
    id: stableId,
    backendQuestionId: backendQuestion.id,
    title: fallbackQuestion?.title || backendQuestion.title || "Untitled Question",
    difficulty: String(fallbackQuestion?.difficulty || backendQuestion.difficulty || "medium").toLowerCase(),
    description:
      fallbackQuestion?.description ||
      backendQuestion.description ||
      "Interview-focused coding challenge.",
    examples: Array.isArray(fallbackQuestion?.examples) ? fallbackQuestion.examples : [],
    constraints: Array.isArray(fallbackQuestion?.constraints)
      ? fallbackQuestion.constraints
      : (Array.isArray(backendQuestion.constraints) ? backendQuestion.constraints : []),
    tags: fallbackTags.length ? fallbackTags : generatedTags,
    starterCode:
      backendQuestion.starterCode ||
      fallbackStarter ||
      "",
    inputFormat: backendQuestion.inputFormat || "",
    outputFormat: backendQuestion.outputFormat || "",
    testCases: Array.isArray(backendQuestion.testCases) ? backendQuestion.testCases : [],
    evaluationAvailable: backendQuestion.evaluationAvailable !== false
  };
}

function mapStaticQuestion(staticQuestion) {
  if (!staticQuestion) return null;
  return {
    id: staticQuestion.id,
    backendQuestionId: "",
    title: staticQuestion.title,
    difficulty: String(staticQuestion.difficulty || "medium").toLowerCase(),
    description: staticQuestion.description || "Interview-focused coding challenge.",
    examples: Array.isArray(staticQuestion.examples) ? staticQuestion.examples : [],
    constraints: Array.isArray(staticQuestion.constraints) ? staticQuestion.constraints : [],
    tags: Array.isArray(staticQuestion.tags) ? staticQuestion.tags : [],
    starterCode: staticQuestion.starterCode || {},
    inputFormat: "",
    outputFormat: "",
    testCases: [],
    evaluationAvailable: false
  };
}

export default function QuestionDetail() {
  const { language, topic, questionId } = useParams();
  const navigate = useNavigate();
  const normalizedLanguage = normalizeLanguage(language);
  const requestedIndex = useMemo(
    () => parseStableQuestionIndex(questionId),
    [questionId]
  );

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [code, setCode] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [activeTab, setActiveTab] = useState("testcases");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [runResults, setRunResults] = useState([]);
  const [customRun, setCustomRun] = useState(null);
  const [runError, setRunError] = useState("");
  const [runSummary, setRunSummary] = useState("");
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadQuestion() {
      setLoading(true);
      setLoadError("");

      const fallbackStatic = getStaticQuestion(normalizedLanguage, topic, questionId);

      try {
        const normalizedTopic = String(topic || "").toLowerCase();
        const params = new URLSearchParams({ language: normalizedLanguage });

        if (normalizedTopic.startsWith("difficulty-")) {
          params.set("difficulty", normalizedTopic.replace("difficulty-", ""));
          params.set("starterMode", "difficulty");
        } else {
          params.set("topic", resolveRuntimeTopicSlug(normalizedLanguage, normalizedTopic));
          params.set("starterMode", "topic");
        }

        const response = await fetch(`${API_BASE_URL}/api/code/questions?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load question");
        }

        const backendQuestions = Array.isArray(data?.questions) ? data.questions : [];
        const executableQuestions = backendQuestions.filter(hasExecutableTestPack);
        const runtimeQuestions = executableQuestions.length ? executableQuestions : backendQuestions;

        if (!runtimeQuestions.length) {
          if (!cancelled) {
            setQuestion(mapStaticQuestion(fallbackStatic));
            setLoadError("Runtime question set is empty. Showing static fallback.");
          }
          return;
        }

        const clampedIndex = Math.max(0, Math.min(requestedIndex, runtimeQuestions.length - 1));
        const backendQuestion = runtimeQuestions[clampedIndex];
        const fallbackForIndex = fallbackStatic || getTopicQuestions(normalizedLanguage, topic)[clampedIndex] || null;

        if (!cancelled) {
          if (backendQuestions.length && !executableQuestions.length) {
            setLoadError("This runtime set does not include testcase packs. Run/submit may be limited.");
          }
          setQuestion(
            mapBackendQuestion(
              normalizedTopic,
              fallbackForIndex,
              backendQuestion,
              questionId,
              normalizedLanguage
            )
          );
        }
      } catch (error) {
        if (!cancelled) {
          setQuestion(mapStaticQuestion(fallbackStatic));
          setLoadError(error?.message || "Unable to reach runtime service");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadQuestion();
    return () => {
      cancelled = true;
    };
  }, [normalizedLanguage, topic, questionId, requestedIndex]);

  useEffect(() => {
    if (!question) return;
    const starter =
      typeof question?.starterCode === "string"
        ? question.starterCode
        : (question?.starterCode?.[normalizedLanguage] || "");
    setCode(starter);
    setCustomInput("");
    setActiveTab("testcases");
    setElapsedSeconds(0);
    setRunResults([]);
    setCustomRun(null);
    setRunError("");
    setRunSummary("");
    setAiFeedback(null);
  }, [question, normalizedLanguage]);

  useEffect(() => {
    if (!question) return undefined;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [question]);

  const pendingTestRows = useMemo(
    () =>
      Array.isArray(question?.testCases)
        ? question.testCases.map((testCase) => ({
            id: testCase.id,
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            output: "-",
            passed: null
          }))
        : [],
    [question]
  );

  const testRows = runResults.length ? runResults : pendingTestRows;

  const handleRun = async () => {
    if (!question) return;
    if (!question.backendQuestionId) {
      setRunError("Execution service is unavailable for this static-only question.");
      setActiveTab("ai");
      return;
    }
    if (!String(code).trim()) {
      setRunError("Write some code before running.");
      setActiveTab("ai");
      return;
    }

    setIsRunning(true);
    setRunError("");
    setRunSummary("");
    setAiFeedback(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/code/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.backendQuestionId,
          language: normalizedLanguage,
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

      const resultRows = Array.isArray(data?.results) ? data.results : [];
      const passedCases = resultRows.filter((row) => row.passed).length;
      const totalCases = resultRows.length;

      if (!data?.success) {
        if (data?.errorMessage) {
          setRunError(data.errorMessage);
        } else {
          setRunError(`Testcases failed: ${passedCases}/${totalCases} passed.`);
        }
        if (totalCases > 0) {
          setRunSummary(`Testcases passed: ${passedCases}/${totalCases}`);
        }
        setActiveTab("testcases");
      } else {
        setRunError("");
        if (totalCases > 0) {
          setRunSummary(`Testcases passed: ${passedCases}/${totalCases}`);
        } else {
          setRunSummary("Code executed successfully.");
        }
        setActiveTab("testcases");
      }
    } catch (error) {
      setRunError(error?.message || "Execution failed");
      setActiveTab("testcases");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!question) return;
    if (!question.backendQuestionId) {
      setRunError("Submission report is unavailable for this static-only question.");
      setActiveTab("ai");
      return;
    }
    if (!String(code).trim()) {
      setRunError("Write some code before submitting.");
      setActiveTab("ai");
      return;
    }

    setIsSubmitting(true);
    setRunError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/code/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.backendQuestionId,
          language: normalizedLanguage,
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
      setActiveTab("testcases");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="question-shell">
        <div className="question-surface">
          <div className="question-empty-card">Loading question...</div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="question-shell">
        <div className="question-surface">
          <div className="question-empty-card">
            <h2>Question not found</h2>
            <button
              type="button"
              className="back-btn"
              onClick={() => navigate(`/practice/${normalizedLanguage}/${topic}`)}
            >
              Back to Question List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="question-shell">
      <div className="question-surface">
        <header className="question-header detail">
          <div>
            <span className="question-kicker">Question Detail</span>
            <h1>{question.title}</h1>
            <div className="detail-meta-row">
              <span className={`difficulty-chip ${question.difficulty}`}>
                {question.difficulty}
              </span>
              <span className="mini-tag">Time {formatTime(elapsedSeconds)}</span>
              {!question.evaluationAvailable && (
                <span className="mini-tag muted">Generated set | custom run preferred</span>
              )}
              {question.tags.map((tag) => (
                <span key={tag} className="mini-tag">{tag}</span>
              ))}
            </div>
          </div>

          <div className="question-header-right">
            <LanguageSelector
              options={LANGUAGE_OPTIONS}
              value={normalizedLanguage}
              onChange={(nextLanguage) =>
                navigate(`/practice/${nextLanguage}/${topic}/${questionId}`)
              }
            />
            <button
              type="button"
              className="back-btn"
              onClick={() => navigate(`/practice/${normalizedLanguage}/${topic}`)}
            >
              Back to Question List
            </button>
          </div>
        </header>

        {loadError && <div className="question-warning">{loadError}</div>}

        <section className="detail-layout">
          <article className="detail-card">
            <h3>Problem Statement</h3>
            <p>{question.description}</p>

            {question.inputFormat && (
              <div className="spec-row">
                <div>
                  <h4>Input Format</h4>
                  <p>{question.inputFormat}</p>
                </div>
                <div>
                  <h4>Output Format</h4>
                  <p>{question.outputFormat || "Return required answer format."}</p>
                </div>
              </div>
            )}

            {question.examples.length > 0 && (
              <>
                <h3>Examples</h3>
                <div className="example-list">
                  {question.examples.map((example, index) => (
                    <div key={`${question.id}-example-${index}`} className="example-item">
                      <strong>Example {index + 1}</strong>
                      <p><b>Input:</b> {example.input}</p>
                      <p><b>Output:</b> {example.output}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <h3>Constraints</h3>
            <ul className="constraint-list">
              {question.constraints.map((item) => (
                <li key={`${question.id}-${item}`}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="detail-card editor-card">
            <h3>Code Editor</h3>
            <div className="code-shell">
              <Editor
                height="390px"
                language={normalizedLanguage === "cpp" ? "cpp" : normalizedLanguage}
                theme="hc-black"
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "JetBrains Mono, Consolas, monospace",
                  scrollBeyondLastLine: false,
                  lineNumbersMinChars: 3,
                  smoothScrolling: true
                }}
              />
            </div>

            <div className="button-row">
              <button
                type="button"
                className="action-btn run"
                onClick={handleRun}
                disabled={isRunning}
              >
                {isRunning ? "Running..." : "Run Code"}
              </button>
              <button
                type="button"
                className="action-btn submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
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
              {(runError || runSummary) && (
                <div className={runError ? "run-error-panel" : "run-success-panel"}>
                  {runError ? (
                    <>
                      <h5>Actual Runtime Error</h5>
                      <pre>{runError}</pre>
                    </>
                  ) : (
                    <p>{runSummary}</p>
                  )}
                </div>
              )}

              {activeTab === "testcases" && (
                <>
                  {!testRows.length ? (
                    <p className="tab-empty">
                      No official testcase pack available for this generated question. Use custom input to run code.
                    </p>
                  ) : (
                    <table className="result-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Input</th>
                          <th>Expected</th>
                          <th>Output</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testRows.map((row) => (
                          <tr key={`${question.id}-${row.id}`}>
                            <td>{row.id}</td>
                            <td>{row.input}</td>
                            <td>{row.expectedOutput}</td>
                            <td>{row.output || "-"}</td>
                            <td className={row.passed === null ? "pending" : row.passed ? "pass" : "fail"}>
                              {row.passed === null ? "Pending" : row.passed ? "Pass" : "Fail"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
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

                      <div className="code-compare-grid">
                        <article>
                          <h5>Your Code</h5>
                          <pre>{code || "(No code)"}</pre>
                        </article>
                        <article>
                          <h5>Correct Code</h5>
                          <pre>{aiFeedback.correctedCode || "(Reference not available)"}</pre>
                        </article>
                      </div>

                      {(aiFeedback.lineByLineLogic || []).length > 0 && (
                        <div className="line-logic-table">
                          <h5>Line-by-Line Logic</h5>
                          {(aiFeedback.lineByLineLogic || []).slice(0, 28).map((entry) => (
                            <div className="line-logic-row" key={`${entry.lineNumber}-${entry.code}`}>
                              <span>L{entry.lineNumber}</span>
                              <code>{entry.code}</code>
                              <p>{entry.explanation}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {(aiFeedback.shortcuts || []).length > 0 && (
                        <div className="shortcut-wrap">
                          <h5>Language Shortcuts</h5>
                          <div className="shortcut-list">
                            {(aiFeedback.shortcuts || []).map((tip) => (
                              <span key={tip}>{tip}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p>Run your code or ask AI to get fix suggestions, error mapping, and reference code.</p>
                  )}
                </div>
              )}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
