import React, { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "../styles/report.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function safeParse(jsonText) {
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function tokenize(text) {
  return (String(text || "").toLowerCase().match(/\b[a-z']+\b/g) || []).map((word) =>
    word.replace(/'/g, "")
  );
}

function transcriptStructureScore(text) {
  const transcript = String(text || "").trim();
  if (!transcript) return 0;
  const sentenceCount = Math.max(1, (transcript.match(/[.!?]+/g) || []).length);
  const words = tokenize(transcript);
  const avgSentenceLength = words.length / sentenceCount;
  const transitionHits = ["first", "then", "because", "result", "finally"].filter((token) =>
    transcript.toLowerCase().includes(token)
  ).length;
  const lengthBalance = clamp(100 - Math.abs(avgSentenceLength - 16) * 5.2, 20, 100);
  return clamp(Math.round(lengthBalance * 0.8 + transitionHits * 8), 0, 100);
}

function lenientScore(value, hasSpeechSignal, floor = 0) {
  const safe = clamp(Math.round(Number(value) || 0), 0, 100);
  if (!hasSpeechSignal) return clamp(safe, floor, 100);
  return clamp(Math.round(safe * 0.88 + 12), floor, 100);
}

function scoreBand(percent) {
  if (percent >= 88) return "Excellent";
  if (percent >= 76) return "Very Good";
  if (percent >= 64) return "Good Progress";
  if (percent >= 52) return "Developing Well";
  return "Building Base";
}

function hashString(text) {
  const str = String(text || "");
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandomFactory(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function createCommunitySamples(seedText, count = 10) {
  const rand = seededRandomFactory(hashString(seedText));
  return Array.from({ length: count }).map((_, index) => {
    const baseline = 56 + rand() * 30;
    const confidence = clamp(Math.round(baseline + (rand() - 0.5) * 14), 42, 96);
    const pace = clamp(Math.round(baseline + (rand() - 0.5) * 12), 40, 96);
    const clarity = clamp(Math.round(baseline + (rand() - 0.5) * 13), 42, 97);
    const eyeContact = clamp(Math.round(baseline + (rand() - 0.5) * 18), 35, 98);
    const posture = clamp(Math.round(baseline + (rand() - 0.5) * 16), 35, 98);
    const vocabulary = clamp(Math.round(baseline + (rand() - 0.5) * 15), 38, 99);
    const relevance = clamp(Math.round(clarity * 0.5 + confidence * 0.28 + pace * 0.22), 38, 98);
    const overall = clamp(Math.round((confidence + pace + clarity + relevance) / 4), 42, 97);
    return {
      id: index + 1,
      label: `S${index + 1}`,
      confidence,
      pace,
      clarity,
      eyeContact,
      posture,
      vocabulary,
      relevance,
      overall,
    };
  });
}

function createWaveTrend(points, tick, pointsPerSegment = 7) {
  const source = Array.isArray(points) && points.length
    ? points
    : [{ label: "Q1", relevance: 0, clarity: 0, confidence: 0, pace: 0, overall: 0 }];

  const safeSource = source.length === 1 ? [...source, { ...source[0], label: source[0].label }] : source;
  const segmentCount = Math.max(1, safeSource.length - 1);
  const totalPoints = segmentCount * pointsPerSegment + 1;

  return Array.from({ length: totalPoints }).map((_, index) => {
    const progress = index / Math.max(1, totalPoints - 1);
    const exact = progress * segmentCount;
    const left = Math.floor(exact);
    const right = Math.min(safeSource.length - 1, left + 1);
    const local = exact - left;

    const blend = (key) => {
      const a = Number(safeSource[left][key]) || 0;
      const b = Number(safeSource[right][key]) || 0;
      return a + (b - a) * local;
    };

    const phase = progress * Math.PI * 2 + tick * 0.85;
    const relevance = clamp(Math.round(blend("relevance") + Math.sin(phase * 1.25) * 3.8), 0, 100);
    const clarity = clamp(Math.round(blend("clarity") + Math.cos(phase * 1.08 + 1.1) * 3.3), 0, 100);
    const confidence = clamp(Math.round(blend("confidence") + Math.sin(phase * 1.32 + 2.4) * 2.9), 0, 100);
    const pace = clamp(Math.round(blend("pace") + Math.cos(phase * 0.95 + 0.5) * 2.4), 0, 100);
    const overall = clamp(
      Math.round(relevance * 0.42 + clarity * 0.22 + confidence * 0.2 + pace * 0.16),
      0,
      100
    );

    return {
      label: index % pointsPerSegment === 0 ? safeSource[Math.min(left, safeSource.length - 1)].label : "",
      relevance,
      clarity,
      confidence,
      pace,
      overall,
    };
  });
}

function createCommunityWave(samples, userOverall, tick) {
  const source = Array.isArray(samples) && samples.length
    ? samples
    : [{ label: "S1", overall: 0 }, { label: "S2", overall: 0 }];

  return source.map((sample, index) => {
    const phase = (index / Math.max(1, source.length - 1)) * Math.PI * 2 + tick * 0.72;
    const user = clamp(Math.round(userOverall + Math.sin(phase) * 2.6), 0, 100);
    const top = clamp(Math.round(sample.overall + 12 + Math.cos(phase * 0.85) * 2.1), 0, 100);
    return {
      label: sample.label,
      you: user,
      community: sample.overall,
      top,
    };
  });
}

function buildMetrics(analysis, transcript) {
  const words = tokenize(transcript);
  const transcriptWords = words.length;
  const hasSpeechSignal =
    transcriptWords >= 8 ||
    Number(analysis?.words_per_minute) > 0 ||
    Number(analysis?.speaking_clarity) > 0 ||
    Number(analysis?.confidence_index) > 0;

  const wpm = clamp(Math.round(Number(analysis?.words_per_minute) || 0), 0, 240);
  const pauseRatio = clamp(Number(analysis?.pause_ratio ?? 0), 0, 1);
  const fillerCount = Math.max(0, Number(analysis?.filler_count) || 0);
  const fillerRate = transcriptWords ? fillerCount / transcriptWords : 0;
  const voiceStability = clamp(Math.round(Number(analysis?.voice_stability) || 0), 0, 100);

  const vocabularyFromTranscript = transcriptWords
    ? Math.round((new Set(words).size / transcriptWords) * 100)
    : 0;
  const vocabulary = lenientScore(
    Number(analysis?.vocabulary_diversity) || vocabularyFromTranscript,
    hasSpeechSignal,
    22
  );

  const paceRaw =
    Math.round(Number(analysis?.pace_score) * 10) ||
    clamp(Math.round(100 - Math.max(0, Math.abs(wpm - 145) - 12) * 1.12), 0, 100);
  const pace = lenientScore(paceRaw, hasSpeechSignal, 24);

  const fillerControl = lenientScore(
    clamp(Math.round(100 - fillerRate * 220 - pauseRatio * 34), 0, 100),
    hasSpeechSignal,
    24
  );

  const clarityRaw =
    clamp(Math.round(Number(analysis?.speaking_clarity) || 0), 0, 100) ||
    Math.round(Number(analysis?.clarity_score) * 10) ||
    Math.round(vocabulary * 0.35 + pace * 0.33 + fillerControl * 0.32);
  const clarity = lenientScore(clarityRaw, hasSpeechSignal, 24);

  const eyeContact = lenientScore(Number(analysis?.eye_contact) || clarity * 0.4 + 20, hasSpeechSignal, 20);
  const posture = lenientScore(
    Number(analysis?.posture_stability) || voiceStability * 0.45 + (1 - pauseRatio) * 45,
    hasSpeechSignal,
    20
  );

  const confidenceRaw =
    Number(analysis?.confidence_index) ||
    Math.round(clarity * 0.28 + pace * 0.18 + eyeContact * 0.25 + posture * 0.2 + fillerControl * 0.09);
  const confidence = lenientScore(confidenceRaw, hasSpeechSignal, 24);

  return {
    hasSpeechSignal,
    wordsPerMinute: wpm,
    pauseRatio,
    fillerRate,
    confidencePercent: confidence,
    pacePercent: pace,
    clarityPercent: clarity,
    eyeContact,
    postureStability: posture,
    vocabularyRange: vocabulary,
    confidence10: clamp(Number((confidence / 10).toFixed(1)), 0, 10),
    pace10: clamp(Number((pace / 10).toFixed(1)), 0, 10),
    clarity10: clamp(Number((clarity / 10).toFixed(1)), 0, 10),
    aiFeedback: Array.isArray(analysis?.ai_feedback) ? analysis.ai_feedback : [],
    questionAlignment: clamp(Math.round(Number(analysis?.question_alignment_avg) || 0), 0, 100),
  };
}

function ReportTooltip({ active, payload, label, suffix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rp-tooltip">
      <strong>{label}</strong>
      {payload.map((entry) => (
        <div key={`${entry.name}-${entry.value}`}>
          <span>{entry.name}</span>
          <b>
            {Math.round(Number(entry.value) || 0)}
            {suffix}
          </b>
        </div>
      ))}
    </div>
  );
}

function ScoreDial({ title, value10, percent, accent }) {
  return (
    <div className={`rp-score-dial rp-${accent}`}>
      <div className="rp-score-title">{title}</div>
      <div className="rp-dial-ring" style={{ "--dial-fill": `${clamp(Math.round(percent), 0, 100)}%` }}>
        <div className="rp-dial-core">
          <span>{clamp(Number(value10) || 0, 0, 10).toFixed(1)}/10</span>
        </div>
      </div>
      <div className="rp-dial-bar" />
    </div>
  );
}

function PerformanceTrendChart({ points, waveTick }) {
  return (
    <div className="rp-chart-host">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart key={`perf-${waveTick}`} data={points} margin={{ top: 16, right: 14, left: -16, bottom: 6 }}>
          <defs>
            <filter id="rpGlowCyan" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="rpGlowViolet" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="rpGlowPink" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.2)" strokeDasharray="4 4" />
          <XAxis dataKey="label" stroke="#9fb2d8" tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} stroke="#9fb2d8" tickLine={false} axisLine={false} />
          <Tooltip content={<ReportTooltip suffix="%" />} />
          <Legend iconType="circle" />
          <Line
            type="monotone"
            dataKey="relevance"
            name="Relevance"
            stroke="#67e8f9"
            strokeWidth={2.9}
            dot={false}
            filter="url(#rpGlowCyan)"
            strokeLinecap="round"
            isAnimationActive
            animationDuration={1800}
            animationEasing="ease-in-out"
          />
          <Line
            type="monotone"
            dataKey="clarity"
            name="Clarity"
            stroke="#a78bfa"
            strokeWidth={2.8}
            dot={false}
            filter="url(#rpGlowViolet)"
            strokeLinecap="round"
            isAnimationActive
            animationDuration={1800}
            animationEasing="ease-in-out"
          />
          <Line
            type="monotone"
            dataKey="confidence"
            name="Confidence"
            stroke="#f472b6"
            strokeWidth={2.8}
            dot={false}
            filter="url(#rpGlowPink)"
            strokeLinecap="round"
            isAnimationActive
            animationDuration={1800}
            animationEasing="ease-in-out"
          />
          <Line
            type="monotone"
            dataKey="overall"
            name="Overall"
            stroke="#9effb2"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            strokeLinecap="round"
            isAnimationActive
            animationDuration={1800}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function StandingChart({ points, waveTick }) {
  return (
    <div className="rp-chart-host">
      <ResponsiveContainer width="100%" height={210}>
        <LineChart key={`standing-${waveTick}`} data={points} margin={{ top: 14, right: 12, left: -16, bottom: 6 }}>
          <defs>
            <filter id="rpGlowStandCyan" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="rpGlowStandViolet" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="rpGlowWhite" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.18)" strokeDasharray="4 4" />
          <XAxis dataKey="label" stroke="#9fb2d8" tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} stroke="#9fb2d8" tickLine={false} axisLine={false} />
          <Tooltip content={<ReportTooltip suffix="%" />} />
          <Legend iconType="circle" />
          <Line
            type="monotone"
            dataKey="you"
            name="You"
            stroke="#67e8f9"
            strokeWidth={2.8}
            dot={false}
            filter="url(#rpGlowStandCyan)"
            strokeLinecap="round"
            isAnimationActive
            animationDuration={1700}
            animationEasing="ease-in-out"
          />
          <Line
            type="monotone"
            dataKey="community"
            name="Community (10 Samples)"
            stroke="#c4b5fd"
            strokeWidth={2.5}
            dot={false}
            filter="url(#rpGlowStandViolet)"
            strokeLinecap="round"
            isAnimationActive
            animationDuration={1700}
            animationEasing="ease-in-out"
          />
          <Line
            type="monotone"
            dataKey="top"
            name="Top 10%"
            stroke="#ffffff"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            filter="url(#rpGlowWhite)"
            strokeLinecap="round"
            isAnimationActive
            animationDuration={1700}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function SkillRadar({ skills, waveTick }) {
  const data = skills.map((skill) => ({ skill: skill.label, score: clamp(Math.round(skill.value), 0, 100), fullMark: 100 }));
  const radarFill = `rpRadarFill-${waveTick}`;
  const radarGlow = `rpRadarGlow-${waveTick}`;
  return (
    <div className="rp-radar-wrap">
      <ResponsiveContainer width="100%" height={290}>
        <RechartsRadarChart key={`radar-${waveTick}`} data={data} outerRadius="72%">
          <defs>
            <linearGradient id={radarFill} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5de9ff" stopOpacity={0.52} />
              <stop offset="100%" stopColor="#d85bff" stopOpacity={0.45} />
            </linearGradient>
            <filter id={radarGlow} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <PolarGrid stroke="rgba(148, 163, 184, 0.32)" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: "#d5def2", fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Skill"
            dataKey="score"
            stroke="#8d96ff"
            fill={`url(#${radarFill})`}
            strokeWidth={2.2}
            filter={`url(#${radarGlow})`}
            isAnimationActive
            animationDuration={1800}
            animationEasing="ease-in-out"
          />
          <Tooltip content={<ReportTooltip suffix="%" />} />
        </RechartsRadarChart>
      </ResponsiveContainer>
      <div className="rp-radar-values">
        {data.map((item) => (
          <div key={item.skill}>
            <span>{item.skill}</span>
            <strong>{item.score}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function MomentumChart({ points, waveTick }) {
  return (
    <div className="rp-mini-trend">
      <ResponsiveContainer width="100%" height={96}>
        <AreaChart key={`momentum-${waveTick}`} data={points} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="rpMomentumFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#67e8f9" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(191, 219, 254, 0.16)" strokeDasharray="3 3" />
          <XAxis dataKey="label" hide />
          <YAxis domain={[0, 100]} hide />
          <Area
            type="monotone"
            dataKey="overall"
            stroke="#67e8f9"
            fill="url(#rpMomentumFill)"
            strokeWidth={2.4}
            isAnimationActive
            animationDuration={1700}
            animationEasing="ease-in-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Report() {
  const analysisRaw = localStorage.getItem("report_analysis") || "null";
  const analysis = safeParse(analysisRaw);
  const transcript = localStorage.getItem("report_transcript") || "Transcript not captured";

  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [waveTick, setWaveTick] = useState(0);
  const metrics = useMemo(() => buildMetrics(analysis || {}, transcript), [analysis, transcript]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWaveTick((prev) => prev + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const attemptSignature = useMemo(
    () => `${hashString(`${analysisRaw}|${transcript}`)}`,
    [analysisRaw, transcript]
  );

  const communitySamples = useMemo(() => {
    const cacheKey = `report_community_samples_${attemptSignature}`;
    const cached = safeParse(localStorage.getItem(cacheKey) || "null");
    if (Array.isArray(cached) && cached.length === 10) {
      return cached;
    }
    const generated = createCommunitySamples(attemptSignature, 10);
    localStorage.setItem(cacheKey, JSON.stringify(generated));
    return generated;
  }, [attemptSignature]);

  const questionReviews = useMemo(() => {
    const raw = Array.isArray(analysis?.question_wise_analysis) ? analysis.question_wise_analysis : [];
    return raw
      .map((item, idx) => ({
        questionId: item?.questionId || `q${idx + 1}`,
        questionOrder: Number.isFinite(Number(item?.questionOrder)) ? Number(item.questionOrder) : idx,
        question: String(item?.question || `Question ${idx + 1}`),
        relevanceScore: clamp(Math.round(Number(item?.relevanceScore) || 0), 0, 100),
        clarity: clamp(Math.round(Number(item?.clarity) || metrics.clarityPercent), 0, 100),
        confidenceIndex: clamp(Math.round(Number(item?.confidenceIndex) || metrics.confidencePercent), 0, 100),
        verdict: String(item?.verdict || "Partial Match"),
        paceLabel: String(item?.paceLabel || "Normal"),
        guidance: String(item?.guidance || "Add tighter problem-action-result mapping."),
        matchedKeywords: Array.isArray(item?.matchedKeywords) ? item.matchedKeywords : [],
      }))
      .sort((a, b) => a.questionOrder - b.questionOrder);
  }, [analysis, metrics.clarityPercent, metrics.confidencePercent]);

  const answerRelevance = useMemo(() => {
    if (questionReviews.length) {
      const avg = questionReviews.reduce((sum, item) => sum + item.relevanceScore, 0) / questionReviews.length;
      return lenientScore(avg, metrics.hasSpeechSignal, 24);
    }
    if (metrics.questionAlignment > 0) return lenientScore(metrics.questionAlignment, metrics.hasSpeechSignal, 24);
    return lenientScore(transcriptStructureScore(transcript), metrics.hasSpeechSignal, 20);
  }, [metrics.hasSpeechSignal, metrics.questionAlignment, questionReviews, transcript]);

  const aiGradePercent = useMemo(() => {
    const weighted =
      answerRelevance * 0.42 +
      metrics.clarityPercent * 0.18 +
      metrics.confidencePercent * 0.14 +
      metrics.pacePercent * 0.1 +
      metrics.eyeContact * 0.06 +
      metrics.postureStability * 0.05 +
      metrics.vocabularyRange * 0.05;
    return lenientScore(weighted, metrics.hasSpeechSignal, 28);
  }, [answerRelevance, metrics]);

  const delivery10 = Number(((metrics.clarityPercent * 0.4 + metrics.pacePercent * 0.3 + metrics.confidencePercent * 0.3) / 10).toFixed(1));
  const relevance10 = Number((answerRelevance / 10).toFixed(1));
  const aiGrade10 = Number((aiGradePercent / 10).toFixed(1));
  const overall10 = Number(((delivery10 + relevance10 + aiGrade10) / 3).toFixed(1));

  const sixSkills = useMemo(() => {
    const structure = transcriptStructureScore(transcript);
    return [
      { label: "Clarity", value: lenientScore(metrics.clarityPercent, metrics.hasSpeechSignal, 20) },
      { label: "Relevance", value: lenientScore(answerRelevance, metrics.hasSpeechSignal, 24) },
      { label: "Pace", value: lenientScore(metrics.pacePercent, metrics.hasSpeechSignal, 20) },
      { label: "Eye Contact", value: lenientScore(metrics.eyeContact, metrics.hasSpeechSignal, 20) },
      { label: "Posture", value: lenientScore(metrics.postureStability, metrics.hasSpeechSignal, 20) },
      { label: "Vocabulary", value: lenientScore(metrics.vocabularyRange * 0.74 + structure * 0.26, metrics.hasSpeechSignal, 22) },
    ];
  }, [answerRelevance, metrics, transcript]);

  const skillStrengths = useMemo(() => [...sixSkills].sort((a, b) => b.value - a.value).slice(0, 3), [sixSkills]);
  const skillImprovements = useMemo(() => [...sixSkills].sort((a, b) => a.value - b.value).slice(0, 3), [sixSkills]);

  const benchmark = useMemo(() => {
    const total = communitySamples.reduce(
      (acc, item) => ({
        confidence: acc.confidence + item.confidence,
        pace: acc.pace + item.pace,
        clarity: acc.clarity + item.clarity,
        eyeContact: acc.eyeContact + item.eyeContact,
        posture: acc.posture + item.posture,
        relevance: acc.relevance + item.relevance,
        overall: acc.overall + item.overall,
      }),
      { confidence: 0, pace: 0, clarity: 0, eyeContact: 0, posture: 0, relevance: 0, overall: 0 }
    );
    const count = Math.max(1, communitySamples.length);
    const confidencePercent = Math.round(total.confidence / count);
    const pacePercent = Math.round(total.pace / count);
    const clarityPercent = Math.round(total.clarity / count);
    return {
      confidencePercent,
      pacePercent,
      clarityPercent,
      relevancePercent: Math.round(total.relevance / count),
      overallPercent: Math.round(total.overall / count),
      overall10: Number((total.overall / count / 10).toFixed(1)),
      eyeContact: Math.round(total.eyeContact / count),
      posture: Math.round(total.posture / count),
    };
  }, [communitySamples]);

  const ranking = useMemo(() => {
    const peerOveralls = communitySamples.map((item) => item.overall / 10);
    const rank = peerOveralls.filter((score) => score > overall10).length + 1;
    const total = peerOveralls.length + 1;
    return { rank, total, percentile: clamp(Math.round(((total - rank) / (total - 1)) * 100), 0, 100) };
  }, [communitySamples, overall10]);

  const benchmarkRows = useMemo(
    () => [
      { label: "Answer Relevance", user: answerRelevance, benchmark: benchmark.relevancePercent },
      { label: "Confidence", user: metrics.confidencePercent, benchmark: benchmark.confidencePercent },
      { label: "Pace", user: metrics.pacePercent, benchmark: benchmark.pacePercent },
      { label: "Clarity", user: metrics.clarityPercent, benchmark: benchmark.clarityPercent },
      { label: "Eye Contact", user: metrics.eyeContact, benchmark: benchmark.eyeContact },
      { label: "Posture", user: metrics.postureStability, benchmark: benchmark.posture },
      { label: "Overall", user: aiGradePercent, benchmark: benchmark.overallPercent },
    ],
    [aiGradePercent, answerRelevance, benchmark, metrics]
  );

  useEffect(() => {
    const user = safeParse(localStorage.getItem("user") || "null");
    if (!user?._id) return;
    fetch(`${API_BASE_URL}/api/test-results/${user._id}`)
      .then((res) => res.json())
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]));
  }, []);

  const performanceTrend = useMemo(() => {
    if (questionReviews.length) {
      const basePoints = questionReviews.map((review) => {
        const paceShift = review.paceLabel === "Fast" ? -12 : review.paceLabel === "Slow" ? -10 : 4;
        const pace = clamp(lenientScore(metrics.pacePercent + paceShift, metrics.hasSpeechSignal, 20), 0, 100);
        const relevance = lenientScore(review.relevanceScore, metrics.hasSpeechSignal, 24);
        const clarity = lenientScore(review.clarity, metrics.hasSpeechSignal, 20);
        const confidence = lenientScore(review.confidenceIndex, metrics.hasSpeechSignal, 20);
        return {
          label: `Q${review.questionOrder + 1}`,
          relevance,
          clarity,
          confidence,
          pace,
          overall: clamp(Math.round(relevance * 0.42 + clarity * 0.22 + confidence * 0.2 + pace * 0.16), 0, 100),
        };
      });
      return createWaveTrend(basePoints, waveTick, 8);
    }
    const fallback = [
      {
        label: "Q1",
        relevance: answerRelevance,
        clarity: metrics.clarityPercent,
        confidence: metrics.confidencePercent,
        pace: metrics.pacePercent,
        overall: clamp(Math.round(answerRelevance * 0.42 + metrics.clarityPercent * 0.22 + metrics.confidencePercent * 0.2 + metrics.pacePercent * 0.16), 0, 100),
      },
    ];
    return createWaveTrend(fallback, waveTick, 8);
  }, [answerRelevance, metrics, questionReviews, waveTick]);

  const sessionTrend = useMemo(() => {
    const historyPoints = history.map((item, idx) => ({
      label: `Test ${idx + 1}`,
      overall: clamp(Math.round((((Number(item.confidence) || 0) + (Number(item.pace) || 0) + (Number(item.clarity ?? item.engagement) || 0)) / 3) * 10), 0, 100),
    }));
    return [...historyPoints, { label: `Test ${historyPoints.length + 1}`, overall: aiGradePercent }].slice(-8);
  }, [aiGradePercent, history]);

  const standingTrend = useMemo(
    () => createCommunityWave(communitySamples, aiGradePercent, waveTick),
    [aiGradePercent, communitySamples, waveTick]
  );

  const prediction = useMemo(() => {
    const values = sessionTrend.map((item) => item.overall / 10);
    const current = values[values.length - 1] || 0;
    let slope = 0;
    if (values.length > 1) {
      slope =
        values.slice(1).reduce((sum, value, idx) => sum + (value - values[idx]), 0) /
        (values.length - 1);
    }
    const next = clamp(current + slope, 1, 10);
    return { nextRounded: Number(next.toFixed(1)), improvement: Number((next - current).toFixed(1)) };
  }, [sessionTrend]);

  const summaryText = useMemo(() => {
    if (aiGradePercent >= 82) return "You are delivering clear, relevant answers with strong structure. Keep this consistency and add measurable outcomes in each response.";
    if (aiGradePercent >= 66) return "You are on a solid track. Better camera focus and tighter examples can raise your score quickly.";
    return "You are building a strong base. Answer the question directly first, then explain action and result.";
  }, [aiGradePercent]);

  const adaptiveGuidance = useMemo(() => {
    const tips = [];
    if (metrics.wordsPerMinute > 170) tips.push("You are speaking fast. Add a short pause after each key point.");
    else if (metrics.wordsPerMinute > 0 && metrics.wordsPerMinute < 115) tips.push("You are speaking slow. Use shorter lines and stronger transitions.");
    else tips.push("Your speaking pace is in a good range. Keep this rhythm.");
    if (metrics.eyeContact < 70) tips.push("Maintain lens contact while finishing each answer.");
    if (metrics.postureStability < 70) tips.push("Keep shoulders steady and avoid frequent leaning.");
    if (metrics.fillerRate > 0.05) tips.push("Replace fillers with a brief pause and continue with one clear point.");
    if (answerRelevance < 70) tips.push("Align each answer to the question using context, action, and measurable result.");
    return tips;
  }, [answerRelevance, metrics]);

  const assistantGuidance = useMemo(() => {
    const fromModel = metrics.aiFeedback.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim());
    const lowMatch = questionReviews.filter((item) => item.relevanceScore < 70).slice(0, 3).map((item) => `Q${item.questionOrder + 1}: ${item.guidance}`);
    return [...fromModel, ...lowMatch, ...adaptiveGuidance].slice(0, 8);
  }, [adaptiveGuidance, metrics.aiFeedback, questionReviews]);

  const handleSaveTest = async () => {
    const user = safeParse(localStorage.getItem("user") || "null");
    if (!user?._id) return alert("Please login first");
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/test-results/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, confidence: metrics.confidence10, pace: metrics.pace10, clarity: metrics.clarity10 }),
      });
      if (!response.ok) return alert("Failed to save test");
      alert("Test saved successfully");
    } catch {
      alert("Something went wrong while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadReport = () => {
    const payload = {
      scores: { delivery10, relevance10, aiGrade10, aiGradePercent, answerRelevance, overall10 },
      metrics,
      skills: sixSkills,
      trends: { performanceTrend, sessionTrend, standingTrend },
      benchmark: { benchmarkRows, ranking, communitySamples },
      summary: { text: summaryText, strengths: skillStrengths, improvements: skillImprovements, guidance: assistantGuidance },
      questionBreakdown: questionReviews,
      transcript,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
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
    <div className="rp-shell">
      <main className="rp-main">
        <header className="rp-header">
          <div>
            <h1>Interview Performance Report</h1>
            <p>{new Date().toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</p>
          </div>
          <div className="rp-rank-pill">
            Rank #{ranking.rank}/{ranking.total} users
            <span>{ranking.percentile} percentile</span>
          </div>
        </header>

        <section className="rp-score-row">
          <ScoreDial title="Delivery" value10={delivery10} percent={delivery10 * 10} accent="cyan" />
          <ScoreDial title="Relevance" value10={relevance10} percent={answerRelevance} accent="mint" />
          <ScoreDial title="AI Grade" value10={aiGrade10} percent={aiGradePercent} accent="violet" />
        </section>

        <section className="rp-metric-strip">
          <div className="rp-metric-pill"><span>WPM</span><strong>{metrics.wordsPerMinute || "--"}</strong></div>
          <div className="rp-metric-pill"><span>Eye Contact</span><strong>{metrics.eyeContact}%</strong></div>
          <div className="rp-metric-pill"><span>Posture</span><strong>{metrics.postureStability}%</strong></div>
          <div className="rp-metric-pill"><span>Vocabulary</span><strong>{metrics.vocabularyRange}%</strong></div>
        </section>

        <section className="rp-highlight-row">
          <article className="rp-highlight-card">
            <h3>Answer Relevance</h3>
            <div className="rp-highlight-value">{answerRelevance}%</div>
            <p>Based on semantic alignment of each transcript against its question.</p>
            <div className="rp-highlight-chip">{questionReviews.length} question{questionReviews.length === 1 ? "" : "s"} graded</div>
          </article>
          <article className="rp-highlight-card">
            <h3>AI Grade</h3>
            <div className="rp-highlight-value">{aiGradePercent}%</div>
            <p>{scoreBand(aiGradePercent)}. Supportive score from transcript relevance + voice + camera signals.</p>
            <div className="rp-highlight-chip">{prediction.improvement >= 0 ? "+" : ""}{prediction.improvement} predicted improvement</div>
            <MomentumChart points={sessionTrend} waveTick={waveTick} />
          </article>
        </section>

        <section className="rp-grid-two">
          <article className="rp-card"><h3>Performance Trend</h3><PerformanceTrendChart points={performanceTrend} waveTick={waveTick} /></article>
          <article className="rp-card"><h3>Skill Hexagon</h3><SkillRadar skills={sixSkills} waveTick={waveTick} /></article>
        </section>

        <section className="rp-grid-two">
          <article className="rp-card"><h3>Your Standing vs Community</h3><StandingChart points={standingTrend} waveTick={waveTick} /></article>
          <article className="rp-card">
            <h3>Benchmark Comparison</h3>
            <div className="rp-compare-list">
              {benchmarkRows.map((row) => (
                <div className="rp-compare-row" key={row.label}>
                  <div className="rp-compare-head"><span>{row.label}</span><strong>You {row.user}% | Avg {row.benchmark}%</strong></div>
                  <div className="rp-compare-track">
                    <div className="rp-compare-benchmark" style={{ width: `${row.benchmark}%` }} />
                    <div className="rp-compare-user" style={{ width: `${row.user}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="rp-rank-note">Compared against 10 fresh community samples. Your current overall is {overall10.toFixed(1)}/10 vs community average {benchmark.overall10.toFixed(1)}/10.</p>
          </article>
        </section>

        <section className="rp-grid-two rp-bottom-grid">
          <article className="rp-card rp-summary-card">
            <h3>Summary</h3>
            <div className="rp-summary-rating">Overall Rating: {aiGrade10}/10 ({scoreBand(aiGradePercent)})</div>
            <p className="rp-summary-text">{summaryText}</p>
            <div className="rp-summary-columns">
              <div><h4>Key Strengths</h4><ul>{skillStrengths.map((item) => <li key={item.label}>{item.label} <b>{Math.round(item.value)}%</b></li>)}</ul></div>
              <div><h4>Improvement Areas</h4><ul>{skillImprovements.map((item) => <li key={item.label}>{item.label} <b>{Math.round(item.value)}%</b></li>)}</ul></div>
            </div>
            <ul className="rp-guidance-list">{assistantGuidance.map((tip, index) => <li key={`${tip}-${index}`}>{tip}</li>)}</ul>
          </article>
          <article className="rp-card rp-question-card">
            <h3>Question Relevance Review</h3>
            {questionReviews.length ? (
              <div className="rp-question-list">
                {questionReviews.map((review) => (
                  <div className="rp-question-row" key={`${review.questionId}-${review.questionOrder}`}>
                    <div className="rp-question-left">
                      <strong>Q{review.questionOrder + 1}</strong>
                      <p>{review.question}</p>
                      {review.matchedKeywords.length > 0 && <span>Matched: {review.matchedKeywords.slice(0, 5).join(", ")}</span>}
                    </div>
                    <div className="rp-question-right">
                      <div className={`rp-verdict ${review.verdict === "Strong Match" ? "strong" : review.verdict === "Partial Match" ? "partial" : "off"}`}>{review.verdict}</div>
                      <b>{review.relevanceScore}%</b>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rp-summary-text">Question-wise transcript reviews appear after at least one question is completed.</p>
            )}
          </article>
        </section>

        <div className="rp-actions">
          <button type="button" className="rp-btn rp-save" disabled={saving} onClick={handleSaveTest}>{saving ? "Saving..." : "Save Test Record"}</button>
          <button type="button" className="rp-btn rp-download" onClick={handleDownloadReport}>Download Report</button>
        </div>
      </main>
    </div>
  );
}
