import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import "../styles/codingReport.css";

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function formatDuration(totalSeconds) {
  const safe = Math.max(0, Number(totalSeconds) || 0);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}m ${secs}s`;
}

function percentileBand(percentile) {
  if (percentile >= 90) return "Top Tier";
  if (percentile >= 75) return "Strong";
  if (percentile >= 55) return "Good";
  if (percentile >= 35) return "Developing";
  return "Starter";
}

export default function CodingReport() {
  const location = useLocation();
  const navigate = useNavigate();
  const fallback = safeParse(localStorage.getItem("coding_report_payload") || "null");
  const report = location.state?.report || fallback;

  const rankingChartData = useMemo(() => {
    const source = Array.isArray(report?.comparison?.rankingSeries)
      ? report.comparison.rankingSeries
      : [];

    if (!source.length) return [];

    const userIndex = source.findIndex((item) => item.isCurrentUser);
    if (userIndex < 0) return source.slice(0, 18);

    const start = Math.max(0, userIndex - 9);
    const end = Math.min(source.length, start + 18);
    return source.slice(start, end);
  }, [report]);

  const distribution = Array.isArray(report?.comparison?.percentileGraph)
    ? report.comparison.percentileGraph
    : [];
  const testcaseRows = Array.isArray(report?.testcaseResults) ? report.testcaseResults : [];
  const showAiPanel = Boolean(report?.aiFeedback);

  if (!report) {
    return (
      <div className="coding-report-shell">
        <div className="coding-report-empty">
          <h2>No coding report found</h2>
          <button type="button" onClick={() => navigate("/practice")}>
            Back to Practice
          </button>
        </div>
      </div>
    );
  }

  const { question, language, submission, comparison, aiFeedback, attemptedCode } = report;

  return (
    <div className="coding-report-shell">
      <main className="coding-report-main">
        <header className="coding-report-header">
          <div>
            <span className="report-kicker">Coding Performance Report</span>
            <h1>{question?.title || "Practice Submission"}</h1>
            <p>
              {question?.topic} | {question?.difficulty} | {String(language || "").toUpperCase()}
            </p>
          </div>

          <div className="percentile-pill">
            <strong>{comparison?.overallPercentile ?? 0}th percentile</strong>
            <span>{percentileBand(comparison?.overallPercentile ?? 0)}</span>
          </div>
        </header>

        <section className="coding-report-metrics">
          <article>
            <span>Time Taken</span>
            <h3>{formatDuration(submission?.timeTakenSeconds)}</h3>
            <p>Community avg: {formatDuration(comparison?.averageTimeSeconds)}</p>
          </article>
          <article>
            <span>Logic Score</span>
            <h3>{submission?.logicScore ?? 0}%</h3>
            <p>Community avg: {comparison?.averageLogicScore ?? 0}%</p>
          </article>
          <article>
            <span>Accuracy</span>
            <h3>{submission?.accuracyScore ?? 0}%</h3>
            <p>
              {submission?.passedCases ?? 0}/{submission?.totalCases ?? 0} testcases passed
            </p>
          </article>
          <article>
            <span>Speed Percentile</span>
            <h3>{comparison?.speedPercentile ?? 0}%</h3>
            <p>Logic percentile: {comparison?.logicPercentile ?? 0}%</p>
          </article>
        </section>

        <section className="coding-report-charts">
          <article className="report-card">
            <h3>Logic Distribution Percentile</h3>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={distribution} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(127, 179, 224, 0.26)" />
                <XAxis dataKey="range" stroke="#a5cbef" />
                <YAxis stroke="#a5cbef" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="users" radius={[8, 8, 0, 0]}>
                  {distribution.map((row) => (
                    <Cell
                      key={row.range}
                      fill={row.you ? "#ff8f5a" : "#39b9ff"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="report-card">
            <h3>Your Logic vs Sample Users</h3>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={rankingChartData} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(127, 179, 224, 0.2)" />
                <XAxis dataKey="id" stroke="#a5cbef" tick={{ fontSize: 11 }} />
                <YAxis stroke="#a5cbef" />
                <Tooltip />
                <Bar dataKey="logicScore" radius={[8, 8, 0, 0]}>
                  {rankingChartData.map((row) => (
                    <Cell
                      key={`${row.id}-${row.logicScore}`}
                      fill={row.isCurrentUser ? "#ff8f5a" : "#1dd0a6"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </article>
        </section>

        <section className="report-card testcase-card">
          <h3>Submission Breakdown</h3>
          <table>
            <thead>
              <tr>
                <th>Case</th>
                <th>Expected</th>
                <th>Your Output</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {testcaseRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.expectedOutput}</td>
                  <td>{row.output || "-"}</td>
                  <td className={row.passed ? "pass" : "fail"}>{row.passed ? "Pass" : "Fail"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {showAiPanel && (
          <section className="report-card ai-report-card">
            <h3>AI Error Analysis</h3>
            <p className="ai-summary">{aiFeedback.summary}</p>
            <p className="ai-cause">{aiFeedback.probableCause}</p>

            <div className="ai-list-grid">
              <div>
                <h4>Detected Errors</h4>
                <ul>
                  {(aiFeedback.highlightedErrors || []).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4>Fix Plan</h4>
                <ul>
                  {(aiFeedback.fixSteps || []).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="code-compare-grid">
              <article>
                <h4>Your Code</h4>
                <pre>{attemptedCode || "(No code captured)"}</pre>
              </article>
              <article>
                <h4>Correct Code</h4>
                <pre>{aiFeedback.correctedCode || "(Reference not available)"}</pre>
              </article>
            </div>

            <div className="line-logic-table">
              <h4>Line-by-Line Logic</h4>
              {(aiFeedback.lineByLineLogic || []).slice(0, 44).map((entry) => (
                <div className="line-logic-row" key={`${entry.lineNumber}-${entry.code}`}>
                  <span>L{entry.lineNumber}</span>
                  <code>{entry.code}</code>
                  <p>{entry.explanation}</p>
                </div>
              ))}
            </div>

            <div className="shortcut-wrap">
              <h4>Language Shortcuts</h4>
              <div className="shortcut-list">
                {(aiFeedback.shortcuts || []).map((tip) => (
                  <span key={tip}>{tip}</span>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="report-actions">
          <button type="button" onClick={() => navigate("/practice")}>
            Back to Topics
          </button>
          <button
            type="button"
            onClick={() =>
              navigate(`/practice/${String(language || "python").toLowerCase()}/${question?.slug || "arrays"}`)
            }
          >
            Retry Question
          </button>
        </div>
      </main>
    </div>
  );
}
