import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/report.css";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const PEER_USER_CASES = [
  { confidence: 7.1, pace: 6.8, clarity: 7.3, eyeContact: 74, posture: 72, vocabulary: 70 },
  { confidence: 6.4, pace: 7.2, clarity: 6.9, eyeContact: 70, posture: 67, vocabulary: 66 },
  { confidence: 8.0, pace: 7.6, clarity: 7.7, eyeContact: 82, posture: 79, vocabulary: 75 },
  { confidence: 6.9, pace: 6.6, clarity: 7.0, eyeContact: 69, posture: 71, vocabulary: 68 },
  { confidence: 7.5, pace: 7.1, clarity: 7.4, eyeContact: 76, posture: 73, vocabulary: 72 },
  { confidence: 5.9, pace: 6.1, clarity: 6.0, eyeContact: 63, posture: 61, vocabulary: 60 },
  { confidence: 7.8, pace: 7.4, clarity: 7.6, eyeContact: 80, posture: 77, vocabulary: 74 },
  { confidence: 6.6, pace: 6.8, clarity: 6.5, eyeContact: 68, posture: 66, vocabulary: 65 },
];

function safeParse(jsonText) {
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function countWords(text) {
  return (text.toLowerCase().match(/\b[a-z']+\b/g) || []).length;
}

function vocabularyFromTranscript(text) {
  const words = text.toLowerCase().match(/\b[a-z']+\b/g) || [];
  if (!words.length) return 0;
  return clamp(Math.round((new Set(words).size / words.length) * 100), 0, 100);
}

function paceControlPercent(wpm) {
  if (!wpm) return 0;
  const deviation = Math.abs(wpm - 145);
  const effectiveDeviation = Math.max(0, deviation - 15);
  return clamp(Math.round(100 - effectiveDeviation * 1.1), 0, 100);
}

function toPercentFrom10(score) {
  return clamp(Math.round((score || 0) * 10), 0, 100);
}

function easeTen(score, options = {}) {
  const { boost = 0.6, power = 0.9, minIfPositive = 0.8 } = options;
  const safe = clamp(Number(score) || 0, 0, 10);
  if (safe <= 0) return 0;
  const eased = Math.pow(safe / 10, power) * 10 + boost;
  return clamp(Number(Math.max(minIfPositive, eased).toFixed(1)), 0, 10);
}

function easePercent(value, options = {}) {
  const { boost = 7, power = 0.9, minIfPositive = 6 } = options;
  const safe = clamp(Math.round(Number(value) || 0), 0, 100);
  if (safe <= 0) return 0;
  const eased = Math.pow(safe / 100, power) * 100 + boost;
  return clamp(Math.round(Math.max(minIfPositive, eased)), 0, 100);
}

function normalizeMetrics(analysis, transcript) {
  const rawConfidence10 = clamp(Number(analysis?.confidence_score) || 0, 0, 10);
  const rawPace10 = clamp(Number(analysis?.pace_score) || 0, 0, 10);
  const rawClarity10 = clamp(
    Number(analysis?.clarity_score) ||
      Math.round((Number(analysis?.speaking_clarity) || 0) / 10) ||
      Number(analysis?.engagement_score) ||
      0,
    0,
    10
  );

  const confidence10 = easeTen(rawConfidence10);
  const pace10 = easeTen(rawPace10);
  const clarity10 = easeTen(rawClarity10, { boost: 0.7, power: 0.88, minIfPositive: 1 });

  const wordsPerMinute = Math.max(0, Number(analysis?.words_per_minute) || 0);
  const fillerCount = Math.max(0, Number(analysis?.filler_count) || 0);
  const transcriptWordCount = countWords(transcript);
  const fillerRate = transcriptWordCount
    ? fillerCount / transcriptWordCount
    : wordsPerMinute
    ? clamp(fillerCount / (wordsPerMinute * 0.8), 0, 1)
    : 0;

  const confidencePercent = easePercent(toPercentFrom10(confidence10), {
    boost: 3,
    power: 0.95,
    minIfPositive: 10,
  });
  const pacePercent = easePercent(toPercentFrom10(pace10), {
    boost: 3,
    power: 0.95,
    minIfPositive: 10,
  });
  const clarityPercentRaw =
    clamp(Math.round(Number(analysis?.speaking_clarity) || 0), 0, 100) ||
    toPercentFrom10(clarity10);
  const clarityPercent = easePercent(clarityPercentRaw, {
    boost: 4,
    power: 0.93,
    minIfPositive: 12,
  });

  const eyeContact = easePercent(Math.round(Number(analysis?.eye_contact) || 0), {
    boost: 6,
    power: 0.9,
    minIfPositive: 8,
  });
  const postureStability = easePercent(
    Math.round(Number(analysis?.posture_stability) || 0),
    {
      boost: 6,
      power: 0.9,
      minIfPositive: 8,
    }
  );
  const paceControl = paceControlPercent(wordsPerMinute);
  const vocabularyRange =
    easePercent(Math.round(Number(analysis?.vocabulary_diversity) || 0), {
      boost: 6,
      power: 0.9,
      minIfPositive: 8,
    }) || easePercent(vocabularyFromTranscript(transcript), { boost: 4, power: 0.92, minIfPositive: 8 });
  const fillerControl = easePercent(Math.round((1 - fillerRate) * 100), {
    boost: 2,
    power: 0.96,
    minIfPositive: 12,
  });

  const radarSkills = [
    { label: "Clarity", value: clarityPercent },
    { label: "Pace", value: paceControl },
    { label: "Eye Contact", value: eyeContact },
    { label: "Posture", value: postureStability },
    { label: "Vocabulary", value: vocabularyRange },
  ];

  return {
    confidence10,
    pace10,
    clarity10,
    confidencePercent,
    pacePercent,
    clarityPercent,
    wordsPerMinute,
    eyeContact,
    postureStability,
    paceControl,
    vocabularyRange,
    fillerControl,
    radarSkills,
    aiFeedback: Array.isArray(analysis?.ai_feedback) ? analysis.ai_feedback : [],
  };
}

function createAssistantFocus(metrics) {
  const dimensions = [
    {
      key: "clarity",
      label: "Clarity",
      value: metrics.clarityPercent,
      suggestion: "Slow down sentence starts and emphasize one core message per answer.",
    },
    {
      key: "pace",
      label: "Pace Control",
      value: metrics.paceControl,
      suggestion: "Keep pace between 125-155 WPM and pause briefly after key points.",
    },
    {
      key: "eyeContact",
      label: "Eye Contact",
      value: metrics.eyeContact,
      suggestion: "Look at the camera lens while delivering final conclusions.",
    },
    {
      key: "posture",
      label: "Posture Stability",
      value: metrics.postureStability,
      suggestion: "Square shoulders and keep your head aligned with the lens.",
    },
    {
      key: "vocabulary",
      label: "Vocabulary Range",
      value: metrics.vocabularyRange,
      suggestion: "Use stronger action verbs and fewer repeated filler phrases.",
    },
    {
      key: "fillerControl",
      label: "Filler Control",
      value: metrics.fillerControl,
      suggestion: "Replace filler words with intentional micro-pauses.",
    },
  ];

  const weakest = [...dimensions].sort((a, b) => a.value - b.value).slice(0, 3);
  const strongest = [...dimensions].sort((a, b) => b.value - a.value).slice(0, 2);

  const coachScore = Math.round(
    (metrics.clarityPercent +
      metrics.paceControl +
      metrics.eyeContact +
      metrics.postureStability +
      metrics.vocabularyRange) /
      5
  );

  return { weakest, strongest, coachScore };
}

function ScoreDial({ title, value10, percent, accent = "cyan" }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const target = clamp(value10 || 0, 0, 10);
    let current = 0;
    const interval = setInterval(() => {
      current = Math.min(target, current + 0.2);
      setAnimated(Number(current.toFixed(1)));
      if (current >= target) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [value10]);

  return (
    <div className={`rp-score-dial rp-${accent}`}>
      <div className="rp-score-title">{title}</div>
      <div
        className="rp-dial-ring"
        style={{ "--dial-fill": `${clamp(Math.round(percent), 0, 100)}%` }}
      >
        <div className="rp-dial-core">
          <span>{Math.round(animated)}/10</span>
        </div>
      </div>
      <div className="rp-dial-bar" />
    </div>
  );
}

function TrendChart({ points }) {
  const width = 640;
  const height = 260;
  const margin = { top: 18, right: 20, bottom: 34, left: 40 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const p = points.length ? points : [{ label: "Test 1", confidence: 0, pace: 0, clarity: 0 }];
  const stepX = p.length > 1 ? chartW / (p.length - 1) : 0;

  const y = (value) => margin.top + ((10 - clamp(value, 0, 10)) / 10) * chartH;
  const x = (index) => margin.left + index * stepX;

  const makePath = (key) =>
    p
      .map((point, index) => `${x(index)},${y(point[key])}`)
      .join(" ");

  const confidencePath = makePath("confidence");
  const clarityPath = makePath("clarity");
  const pacePath = makePath("pace");

  return (
    <div className="rp-trend-wrap">
      <svg
        className="rp-trend-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Performance trend chart"
      >
        {[2, 4, 6, 8, 10].map((mark) => (
          <g key={mark}>
            <line
              x1={margin.left}
              x2={width - margin.right}
              y1={y(mark)}
              y2={y(mark)}
              className="rp-grid-line"
            />
            <text x={8} y={y(mark) + 4} className="rp-axis-text">
              {mark}
            </text>
          </g>
        ))}

        {p.map((_, index) => (
          <line
            key={`v-${index}`}
            x1={x(index)}
            x2={x(index)}
            y1={margin.top}
            y2={height - margin.bottom}
            className="rp-grid-line rp-grid-line-v"
          />
        ))}

        <polyline points={confidencePath} className="rp-line rp-line-confidence" />
        <polyline points={clarityPath} className="rp-line rp-line-clarity" />
        <polyline points={pacePath} className="rp-line rp-line-pace" />

        {p.map((point, index) => (
          <g key={`pt-${index}`}>
            <circle cx={x(index)} cy={y(point.confidence)} r="4" className="rp-dot rp-dot-confidence" />
            <circle cx={x(index)} cy={y(point.clarity)} r="4" className="rp-dot rp-dot-clarity" />
            <circle cx={x(index)} cy={y(point.pace)} r="4" className="rp-dot rp-dot-pace" />
            <text x={x(index) - 16} y={height - 10} className="rp-axis-text">
              {point.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="rp-legend">
        <span className="lg-confidence">confidence</span>
        <span className="lg-clarity">clarity</span>
        <span className="lg-pace">pace</span>
      </div>
    </div>
  );
}

function RadarChart({ skills }) {
  const size = 270;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 95;
  const levels = [20, 40, 60, 80, 100];
  const count = skills.length;

  const polar = (index, value) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    const r = (clamp(value, 0, 100) / 100) * radius;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  };

  const polygonFor = (value) =>
    skills
      .map((_, index) => {
        const [x, y] = polar(index, value);
        return `${x},${y}`;
      })
      .join(" ");

  const dataPath = skills
    .map((skill, index) => {
      const [x, y] = polar(index, skill.value);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rp-radar-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} className="rp-radar-svg" role="img" aria-label="Skill radar chart">
        {levels.map((level) => (
          <polygon key={level} points={polygonFor(level)} className="rp-radar-grid" />
        ))}

        {skills.map((skill, index) => {
          const [x, y] = polar(index, 100);
          return <line key={skill.label} x1={cx} y1={cy} x2={x} y2={y} className="rp-radar-axis" />;
        })}

        <polygon points={dataPath} className="rp-radar-data" />

        {skills.map((skill, index) => {
          const [x, y] = polar(index, 112);
          return (
            <text key={`${skill.label}-label`} x={x} y={y} className="rp-radar-label">
              {skill.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function Report() {
  const storedAnalysis = localStorage.getItem("report_analysis");
  const storedTranscript = localStorage.getItem("report_transcript");
  const analysis = storedAnalysis ? safeParse(storedAnalysis) : null;
  const transcript = storedTranscript || "Transcript not captured";

  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const shellRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(null);

  const metrics = useMemo(
    () => normalizeMetrics(analysis || {}, transcript),
    [analysis, transcript]
  );

  const currentDate = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    []
  );

  useEffect(() => {
    const user = safeParse(localStorage.getItem("user") || "null");
    if (!user?._id) return;

    fetch(`http://localhost:5000/api/test-results/${user._id}`)
      .then((res) => res.json())
      .then((data) => {
        setHistory(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setHistory([]);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const trendPoints = useMemo(() => {
    const fromHistory = history.map((item, index) => ({
      label: `Test ${index + 1}`,
      confidence: Number(item.confidence) || 0,
      pace: Number(item.pace) || 0,
      clarity: Number(item.clarity ?? item.engagement) || 0,
    }));

    const currentPoint = {
      label: `Test ${fromHistory.length + 1}`,
      confidence: metrics.confidence10,
      pace: metrics.pace10,
      clarity: metrics.clarity10,
    };

    return [...fromHistory, currentPoint].slice(-6);
  }, [history, metrics.clarity10, metrics.confidence10, metrics.pace10]);

  const prediction = useMemo(() => {
    const overalls = trendPoints.map(
      (point) => (point.confidence + point.pace + point.clarity) / 3
    );
    const currentOverall = overalls[overalls.length - 1] || 0;

    let slope = 0;
    if (overalls.length > 1) {
      let diffSum = 0;
      for (let i = 1; i < overalls.length; i += 1) {
        diffSum += overalls[i] - overalls[i - 1];
      }
      slope = diffSum / (overalls.length - 1);
    }

    const next = clamp(currentOverall + slope, 1, 10);
    const improvement = Number((next - currentOverall).toFixed(1));
    return {
      next,
      nextRounded: Math.round(next),
      improvement,
    };
  }, [trendPoints]);

  const assistant = useMemo(() => createAssistantFocus(metrics), [metrics]);

  const benchmark = useMemo(() => {
    const peerTotals = PEER_USER_CASES.reduce(
      (acc, item) => ({
        confidence: acc.confidence + item.confidence,
        pace: acc.pace + item.pace,
        clarity: acc.clarity + item.clarity,
        eyeContact: acc.eyeContact + item.eyeContact,
        posture: acc.posture + item.posture,
        vocabulary: acc.vocabulary + item.vocabulary,
      }),
      { confidence: 0, pace: 0, clarity: 0, eyeContact: 0, posture: 0, vocabulary: 0 }
    );

    const count = PEER_USER_CASES.length || 1;
    const confidence10 = peerTotals.confidence / count;
    const pace10 = peerTotals.pace / count;
    const clarity10 = peerTotals.clarity / count;

    return {
      confidence10,
      pace10,
      clarity10,
      confidencePercent: Math.round(confidence10 * 10),
      pacePercent: Math.round(pace10 * 10),
      clarityPercent: Math.round(clarity10 * 10),
      overall10: (confidence10 + pace10 + clarity10) / 3,
      overallPercent: Math.round(((confidence10 + pace10 + clarity10) / 3) * 10),
      eyeContact: Math.round(peerTotals.eyeContact / count),
      posture: Math.round(peerTotals.posture / count),
      vocabulary: Math.round(peerTotals.vocabulary / count),
    };
  }, []);

  const ranking = useMemo(() => {
    const userOverall10 = (metrics.confidence10 + metrics.pace10 + metrics.clarity10) / 3;
    const peerOveralls = PEER_USER_CASES.map(
      (item) => (item.confidence + item.pace + item.clarity) / 3
    );

    const total = peerOveralls.length + 1;
    const betterCount = peerOveralls.filter((score) => score > userOverall10).length;
    const rank = betterCount + 1;
    const percentile = clamp(Math.round(((total - rank) / (total - 1)) * 100), 0, 100);

    const sorted = [...peerOveralls, userOverall10].sort((a, b) => b - a);
    const rankRows = sorted.map((score, index) => {
      const isUser = Math.abs(score - userOverall10) < 0.0001 && index === betterCount;
      return {
        label: isUser ? "You" : `User ${index + 1}`,
        score,
        scorePercent: Math.round(score * 10),
        isUser,
      };
    });

    return {
      rank,
      total,
      percentile,
      userOverall10,
      userOverallPercent: Math.round(userOverall10 * 10),
      rankRows,
    };
  }, [metrics.clarity10, metrics.confidence10, metrics.pace10]);

  const comparisonRows = useMemo(
    () => [
      {
        label: "Confidence",
        user: metrics.confidencePercent,
        benchmark: benchmark.confidencePercent,
      },
      {
        label: "Pace",
        user: metrics.pacePercent,
        benchmark: benchmark.pacePercent,
      },
      {
        label: "Clarity",
        user: metrics.clarityPercent,
        benchmark: benchmark.clarityPercent,
      },
      {
        label: "Overall",
        user: ranking.userOverallPercent,
        benchmark: benchmark.overallPercent,
      },
    ],
    [
      benchmark.clarityPercent,
      benchmark.confidencePercent,
      benchmark.overallPercent,
      benchmark.pacePercent,
      metrics.clarityPercent,
      metrics.confidencePercent,
      metrics.pacePercent,
      ranking.userOverallPercent,
    ]
  );

  const assistantRecommendations = useMemo(() => {
    const fromModel = metrics.aiFeedback
      .filter((item) => typeof item === "string" && item.trim())
      .map((item) => item.trim());

    const generated = assistant.weakest.map(
      (item) => `${item.label} (${item.value}%): ${item.suggestion}`
    );

    return [...fromModel, ...generated].slice(0, 5);
  }, [assistant.weakest, metrics.aiFeedback]);

  const handlePointerMove = (event) => {
    if (!shellRef.current) return;
    const bounds = shellRef.current.getBoundingClientRect();
    pointerRef.current = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };

    if (!frameRef.current) {
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        if (!shellRef.current) return;
        shellRef.current.style.setProperty("--rp-liquid-x", `${pointerRef.current.x}px`);
        shellRef.current.style.setProperty("--rp-liquid-y", `${pointerRef.current.y}px`);
        shellRef.current.style.setProperty("--rp-liquid-active", "1");
      });
    }
  };

  const handlePointerLeave = () => {
    if (!shellRef.current) return;
    shellRef.current.style.setProperty("--rp-liquid-active", "0");
  };

  const handleSaveTest = async () => {
    const user = safeParse(localStorage.getItem("user") || "null");
    if (!user?._id) {
      alert("Please login first");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("http://localhost:5000/api/test-results/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          confidence: metrics.confidence10,
          pace: metrics.pace10,
          clarity: metrics.clarity10,
        }),
      });

      if (!response.ok) {
        alert("Failed to save test");
        return;
      }

      alert("Test saved successfully");
    } catch (error) {
      console.error("Save error:", error);
      alert("Something went wrong while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadReport = () => {
    const payload = {
      date: currentDate,
      scores: {
        confidence: metrics.confidence10,
        pace: metrics.pace10,
        clarity: metrics.clarity10,
      },
      radar: metrics.radarSkills,
      transcript,
      feedback: assistantRecommendations,
      benchmark,
      ranking,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "interview-report.json";
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  if (!analysis) {
    return (
      <div className="rp-empty">
        <h2>No report found</h2>
      </div>
    );
  }

  return (
    <div
      className="rp-shell"
      ref={shellRef}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
    >
      <main className="rp-main">
        <header className="rp-header">
          <div>
            <h1>Interview Performance Report</h1>
            <p>{currentDate}</p>
          </div>
          <div className="rp-header-pill">
            Rank #{ranking.rank}/{ranking.total} users
            <span>{ranking.percentile} percentile</span>
          </div>
        </header>

        <section className="rp-top-grid">
          <div className="rp-scores-panel">
            <ScoreDial
              title="Confidence"
              value10={metrics.confidence10}
              percent={metrics.confidencePercent}
              accent="cyan"
            />
            <ScoreDial
              title="Pace"
              value10={metrics.pace10}
              percent={metrics.pacePercent}
              accent="mint"
            />
            <ScoreDial
              title="Clarity"
              value10={metrics.clarity10}
              percent={metrics.clarityPercent}
              accent="violet"
            />
          </div>

          <div className="rp-predict-card">
            <h3>Predicted Next Score</h3>
            <div className="rp-predict-value">{prediction.nextRounded}</div>
            <div className="rp-predict-chip">
              {prediction.improvement >= 0 ? "+" : ""}
              {prediction.improvement} improvement
            </div>
            <p>Based on your latest trend velocity.</p>
          </div>
        </section>

        <section className="rp-mid-grid">
          <div className="rp-trend-card">
            <h3>Performance Trend</h3>
            <TrendChart points={trendPoints} />
          </div>

          <div className="rp-radar-card">
            <h3>Your Skill Radar</h3>
            <RadarChart skills={metrics.radarSkills} />
          </div>
        </section>

        <section className="rp-lower-grid">
          <div className="rp-compare-card">
            <h3>User Benchmark Comparison</h3>
            <p className="rp-card-subtitle">
              Average from {PEER_USER_CASES.length} users vs your latest session.
            </p>

            <div className="rp-compare-list">
              {comparisonRows.map((row) => (
                <div className="rp-compare-row" key={row.label}>
                  <div className="rp-compare-head">
                    <span>{row.label}</span>
                    <strong>
                      You {row.user}% | Avg {row.benchmark}%
                    </strong>
                  </div>
                  <div className="rp-compare-track">
                    <div className="rp-compare-benchmark" style={{ width: `${row.benchmark}%` }} />
                    <div className="rp-compare-user" style={{ width: `${row.user}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="rp-rank-progress-wrap">
              <div className="rp-rank-progress-head">
                <span>Ranking Position</span>
                <strong>{ranking.percentile} percentile</strong>
              </div>
              <div className="rp-rank-progress-track">
                <div className="rp-rank-progress-fill" style={{ width: `${ranking.percentile}%` }} />
                <div
                  className="rp-rank-progress-pin"
                  style={{ left: `clamp(10px, ${ranking.percentile}%, calc(100% - 10px))` }}
                />
              </div>
              <p className="rp-rank-summary">
                Current overall: {ranking.userOverall10.toFixed(1)}/10 vs user average{" "}
                {benchmark.overall10.toFixed(1)}/10.
              </p>
            </div>

            <div className="rp-rank-chart">
              {ranking.rankRows.slice(0, 8).map((entry) => (
                <div className={`rp-rank-row ${entry.isUser ? "is-user" : ""}`} key={`${entry.label}-${entry.score}`}>
                  <span>{entry.label}</span>
                  <div className="rp-rank-row-track">
                    <div style={{ width: `${entry.scorePercent}%` }} />
                  </div>
                  <strong>{entry.score.toFixed(1)}</strong>
                </div>
              ))}
            </div>
          </div>

          <aside className="rp-assistant-card">
            <h3>AI Assistant</h3>
            <p className="rp-card-subtitle">
              Coach score: {assistant.coachScore}% | Prioritized feedback on weak points.
            </p>

            <div className="rp-focus-chips">
              {assistant.weakest.map((item) => (
                <span key={item.key}>
                  {item.label} {item.value}%
                </span>
              ))}
            </div>

            <ul className="rp-assistant-list">
              {assistantRecommendations.map((tip, index) => (
                <li key={`${tip}-${index}`}>{tip}</li>
              ))}
            </ul>

            <div className="rp-assistant-strengths">
              {assistant.strongest.map((item) => (
                <div key={`strength-${item.key}`}>
                  <span>{item.label}</span>
                  <strong>{item.value}%</strong>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <div className="rp-actions">
          <button
            type="button"
            className="rp-btn rp-save"
            disabled={saving}
            onClick={handleSaveTest}
          >
            {saving ? "Saving..." : "Save Test Record"}
          </button>
          <button type="button" className="rp-btn rp-download" onClick={handleDownloadReport}>
            Download Report
          </button>
        </div>
      </main>
    </div>
  );
}
