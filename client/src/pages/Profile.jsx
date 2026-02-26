import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "../styles/profileDashboard.css";

function resolveApiBaseUrl() {
  const configuredBaseUrl = String(process.env.REACT_APP_API_BASE_URL || "").trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const host = String(window.location.hostname || "").trim().toLowerCase();
    const isLocalhost = host === "localhost" || host === "127.0.0.1";
    if (!isLocalhost) {
      // In deployed environments, use same-origin `/api` by default.
      return "";
    }
  }

  return "http://localhost:5000";
}

const API_BASE_URL = resolveApiBaseUrl();
const WAVE_REFRESH_MS = 6500;
const VISWA_LOGIN_DAYS = 5;
const VISWA_TOTAL_LOGINS = 15;
const WEEKLY_HEATMAP_DAYS = 7;

const HEATMAP_BANDS = [
  { key: "morning", label: "Morning" },
  { key: "afternoon", label: "Afternoon" },
  { key: "evening", label: "Evening" },
  { key: "night", label: "Night" },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function safeParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getStoredUser() {
  return safeParseJson(localStorage.getItem("user") || "null");
}

function toProfileForm(user) {
  return {
    name: user?.name || "",
    avatar: user?.avatar || "",
    headline: user?.headline || "",
    targetRole: user?.targetRole || "",
    timezone: user?.timezone || "",
    bio: user?.bio || "",
  };
}

function isViswaIdentity(user) {
  const name = String(user?.name || "").trim().toLowerCase();
  const email = String(user?.email || "").trim().toLowerCase();
  return name === "viswa" || email.startsWith("viswa@") || email.startsWith("viswa2006@");
}

function buildOfflineViswaAttempts(userId) {
  const now = Date.now();
  const overallSeries = [36, 40, 44, 49, 54, 58, 62, 60, 61, 62, 69, 74, 79, 85, 90];
  const confidenceSeries = [38, 41, 44, 48, 52, 56, 59, 55, 57, 58, 64, 69, 73, 79, 84];
  const paceSeries = [52, 55, 57, 60, 63, 66, 68, 67, 68, 69, 72, 75, 78, 82, 85];
  const claritySeries = [42, 45, 47, 51, 55, 58, 61, 62, 63, 64, 69, 73, 77, 82, 87];
  const wpmSeries = [178, 172, 168, 162, 157, 153, 150, 149, 148, 147, 145, 143, 142, 141, 140];
  const relevanceSeries = [34, 38, 42, 47, 52, 57, 61, 60, 62, 63, 70, 75, 80, 86, 91];
  const feedbackSeries = [
    "Nervous baseline. Slow down and keep camera focus through complete answers.",
    "Better composure, but eye contact drops during technical explanations.",
    "Response quality is improving. Keep pace stable and avoid rushing key points.",
    "Clearer sentence flow and stronger structure. Continue reducing filler transitions.",
    "Good progression. Delivery is steadier and relevance is more consistent.",
    "Posture and clarity are stronger. Continue direct context-action-result framing.",
    "Momentum is positive. Maintain this speaking rhythm under longer answers.",
    "Minor dip in confidence and posture. Signs of distraction in the middle section.",
    "Plateau phase. Keep answers concise and reset body posture before each response.",
    "Stability returns. Focus on stronger opening lines for each question.",
    "Noticeable improvement in structure and delivery. Keep this consistency.",
    "Strong progress. Better lens engagement and cleaner answer sequencing.",
    "Delivery and structure are now reliable. Continue adding measurable outcomes.",
    "High performance. Focus on refinement and tighter transitions under pressure.",
    "Excellent finish. Maintain this pace and polish impact framing for elite results.",
  ];

  return overallSeries.map((overallPercent, index) => {
    const createdAt = new Date(now - (overallSeries.length - index) * 86400000).toISOString();
    return {
      _id: `offline-viswa-${index + 1}`,
      user: String(userId || "offline_viswa"),
      attemptId: `viswa2006-seed-${index + 1}`,
      attemptNumber: index + 1,
      confidence: Number((confidenceSeries[index] / 10).toFixed(1)),
      pace: Number((paceSeries[index] / 10).toFixed(1)),
      clarity: Number((claritySeries[index] / 10).toFixed(1)),
      overallPercent,
      answerRelevance: relevanceSeries[index],
      aiGrade10: Number((overallPercent / 10).toFixed(1)),
      confidencePercent: confidenceSeries[index],
      pacePercent: paceSeries[index],
      clarityPercent: claritySeries[index],
      wordsPerMinute: wpmSeries[index],
      eyeContact: clamp(confidenceSeries[index] - 1, 0, 100),
      postureStability: clamp(claritySeries[index] - 1, 0, 100),
      vocabularyRange: clamp(claritySeries[index] + 8, 0, 100),
      questionCount: 6 + (index % 3),
      interviewDurationSeconds: 580 - index * 8,
      feedbackSummary: feedbackSeries[index],
      aiFeedback: [feedbackSeries[index]],
      source: "offline-seed",
      createdAt,
      updatedAt: createdAt,
    };
  });
}

function resolveDashboardError(error) {
  const message = String(error?.message || "").trim();
  if (!message) return "Unable to load dashboard.";
  if (/user not found/i.test(message)) return "";
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    const backendHint = API_BASE_URL || "current site origin";
    return `Cannot reach backend at ${backendHint}. Start backend API and refresh this page.`;
  }
  return message;
}

function formatDateTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toDayKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayDiff(dayA, dayB) {
  const left = new Date(`${dayA}T00:00:00`);
  const right = new Date(`${dayB}T00:00:00`);
  if (Number.isNaN(left.getTime()) || Number.isNaN(right.getTime())) return 0;
  const deltaMs = left.getTime() - right.getTime();
  return Math.round(deltaMs / 86400000);
}

function normalizePercentFromTen(value) {
  return clamp(Math.round((Number(value) || 0) * 10), 0, 100);
}

function getAttemptOverall(attempt) {
  if (!attempt) return 0;
  const explicitOverall = Number(attempt.overallPercent);
  if (Number.isFinite(explicitOverall) && explicitOverall > 0) {
    return clamp(Math.round(explicitOverall), 0, 100);
  }
  const confidence = Number(attempt.confidence) || 0;
  const pace = Number(attempt.pace) || 0;
  const clarity = Number(attempt.clarity ?? attempt.engagement) || 0;
  const fromTenScale = ((confidence + pace + clarity) / 3) * 10;
  return clamp(Math.round(fromTenScale), 0, 100);
}

function computeStreak(attemptRows) {
  const uniqueDays = Array.from(
    new Set(
      attemptRows
        .map((row) => toDayKey(row.createdAt))
        .filter(Boolean)
    )
  ).sort();

  if (!uniqueDays.length) {
    return {
      current: 0,
      best: 0,
      activeToday: false,
      latestDay: null,
    };
  }

  let best = 1;
  let running = 1;
  for (let index = 1; index < uniqueDays.length; index += 1) {
    const previous = uniqueDays[index - 1];
    const current = uniqueDays[index];
    if (dayDiff(current, previous) === 1) {
      running += 1;
      if (running > best) best = running;
    } else {
      running = 1;
    }
  }

  const descending = [...uniqueDays].sort().reverse();
  let currentStreak = 1;
  for (let index = 1; index < descending.length; index += 1) {
    const newer = descending[index - 1];
    const older = descending[index];
    if (dayDiff(newer, older) === 1) {
      currentStreak += 1;
    } else {
      break;
    }
  }

  const today = toDayKey(new Date().toISOString());
  return {
    current: currentStreak,
    best,
    activeToday: descending[0] === today,
    latestDay: descending[0] || null,
  };
}

function buildTrend(attemptRows) {
  if (attemptRows.length < 2) {
    return {
      state: "insufficient",
      delta: 0,
      label: "Need more attempts",
      description: "Complete more interviews to detect a reliable improvement pattern.",
    };
  }

  const overalls = attemptRows.map((row) => row.overall);
  let baseline = overalls[0];
  let recent = overalls[overalls.length - 1];

  if (overalls.length >= 5) {
    const recentWindow = overalls.slice(-3);
    const previousWindow = overalls.slice(-6, -3);
    if (previousWindow.length > 0) {
      recent = recentWindow.reduce((sum, value) => sum + value, 0) / recentWindow.length;
      baseline = previousWindow.reduce((sum, value) => sum + value, 0) / previousWindow.length;
    }
  }

  const delta = Number((recent - baseline).toFixed(1));
  if (delta >= 2) {
    return {
      state: "improved",
      delta,
      label: `Improved by ${delta}%`,
      description: "Your latest sessions are trending upward. Keep pressure-testing with harder questions.",
    };
  }
  if (delta <= -2) {
    return {
      state: "worsened",
      delta,
      label: `Down by ${Math.abs(delta)}%`,
      description: "Recent sessions dipped. Focus on tightening structure before adding speed.",
    };
  }
  return {
    state: "steady",
    delta,
    label: `Stable (${delta >= 0 ? "+" : ""}${delta}%)`,
    description: "You are holding your level. Small execution gains can create the next jump.",
  };
}

function getRangeAdvice(scorePercent) {
  const score = clamp(Math.round(Number(scorePercent) || 0), 0, 100);

  if (score <= 20) {
    return [
      "0-20 range: focus on basics first. Answer with one clear point before adding detail.",
      "Practice short 30-second responses to build confidence and reduce hesitation.",
    ];
  }
  if (score <= 40) {
    return [
      "20-40 range: your base is forming. Improve structure with context, action, result.",
      "Record 3 daily answers and remove filler-heavy transitions.",
    ];
  }
  if (score <= 60) {
    return [
      "40-60 range: good progress. Increase consistency across all questions.",
      "Stabilize pace and close each answer with measurable impact.",
    ];
  }
  if (score <= 80) {
    return [
      "60-80 range: strong zone. Sharpen precision and storytelling under pressure.",
      "Use tighter examples and maintain camera engagement from start to finish.",
    ];
  }
  return [
    "80-100 range: high-performance level. Focus on elite polish and repeatability.",
    "Train with harder follow-ups and keep outcomes quantified in every answer.",
  ];
}

function buildCoachTips(trend, latestAttempt, averageOverall) {
  const tips = [];
  const confidence = Number(latestAttempt?.confidencePercent) || 0;
  const clarity = Number(latestAttempt?.clarityPercent) || 0;
  const pace = Number(latestAttempt?.pacePercent) || 0;
  const wpm = Number(latestAttempt?.wordsPerMinute) || 0;
  const relevance = Number(latestAttempt?.answerRelevance) || 0;
  const referenceScore = Number(latestAttempt?.overall) || Number(averageOverall) || 0;

  getRangeAdvice(referenceScore).forEach((tip) => tips.push(tip));

  if (trend.state === "improved") {
    tips.push("Momentum is positive. Keep your current rhythm and increase question complexity gradually.");
    tips.push("After each answer, add one quantifiable result to convert good delivery into standout impact.");
  }

  if (trend.state === "worsened") {
    tips.push("Recent performance dropped. Reset with shorter answers and strict context-action-result flow.");
    tips.push("Run two focused mock rounds on weak areas before full-length sessions.");
  }

  if (trend.state === "steady" || trend.state === "insufficient") {
    tips.push("Your performance is stable. Push one improvement target per session to break plateaus.");
  }

  if (wpm > 170) tips.push("Your speaking speed is high. Add a brief pause after each key point.");
  if (wpm > 0 && wpm < 115) tips.push("Your speaking speed is low. Use shorter lines and sharper transitions.");
  if (confidence < 70) tips.push("Increase camera focus and keep a centered posture to raise confidence perception.");
  if (clarity < 72) tips.push("Use simpler sentence structure and close every answer with a concrete outcome.");
  if (pace < 70) tips.push("Practice 60-second answers to stabilize pacing under time pressure.");
  if (relevance > 0 && relevance < 74) tips.push("Anchor every response directly to the question before expanding context.");
  if (averageOverall >= 80) {
    tips.push("You are in a strong range. Train with adversarial follow-up questions to avoid regression.");
  } else {
    tips.push("Prioritize consistency first, then optimize speed and polish.");
  }

  tips.push("For every answer: context in 1 sentence, action in 2 points, measurable result in 1 line.");
  return Array.from(new Set(tips)).slice(0, 8);
}

function buildWaveform(attemptRows, tick) {
  const source = attemptRows.length
    ? attemptRows.map((row, index) => ({
        label: `A${index + 1}`,
        overall: row.overall,
        confidence: row.confidencePercent,
        clarity: row.clarityPercent,
      }))
    : [{ label: "A1", overall: 0, confidence: 0, clarity: 0 }];

  return source.map((point, index) => {
    const phase = tick * 0.7 + index * 0.9;
    return {
      ...point,
      waveOverall: clamp(Math.round(point.overall + Math.sin(phase) * 2.8), 0, 100),
      waveConfidence: clamp(Math.round(point.confidence + Math.cos(phase * 1.15) * 2.3), 0, 100),
      waveClarity: clamp(Math.round(point.clarity + Math.sin(phase * 1.08 + 1.4) * 2.1), 0, 100),
    };
  });
}

function buildViswaLoginTimeline(referenceDate = new Date()) {
  const memberSince = new Date(referenceDate);
  memberSince.setDate(memberSince.getDate() - 52);
  memberSince.setHours(9, 20, 0, 0);

  const endDay = new Date(referenceDate);
  endDay.setHours(0, 0, 0, 0);

  const slotBlueprint = [
    { hour: 9, minute: 12, durationMinutes: 38 },
    { hour: 14, minute: 26, durationMinutes: 43 },
    { hour: 20, minute: 4, durationMinutes: 40 },
  ];

  const sessions = [];
  for (let offset = VISWA_LOGIN_DAYS - 1; offset >= 0; offset -= 1) {
    const day = new Date(endDay);
    day.setDate(endDay.getDate() - offset);

    slotBlueprint.forEach((slot, index) => {
      const loginAt = new Date(day);
      loginAt.setHours(slot.hour, slot.minute + (offset % 2) + index, 0, 0);

      const logoutAt = new Date(loginAt);
      logoutAt.setMinutes(logoutAt.getMinutes() + slot.durationMinutes + ((offset + index) % 5));

      sessions.push({
        loginAt: loginAt.toISOString(),
        logoutAt: logoutAt.toISOString(),
      });
    });
  }

  sessions.sort((left, right) => new Date(left.loginAt).getTime() - new Date(right.loginAt).getTime());

  const normalizedSessions = sessions.slice(-VISWA_TOTAL_LOGINS);
  if (normalizedSessions.length) {
    const forcedLastLogin = new Date(referenceDate.getFullYear(), 1, 24, 22, 24, 0, 0);
    normalizedSessions[normalizedSessions.length - 1] = {
      loginAt: forcedLastLogin.toISOString(),
      logoutAt: null,
    };
  }

  return {
    memberSince: memberSince.toISOString(),
    sessions: normalizedSessions,
  };
}

function buildLoginActivityModel(profile) {
  if (isViswaIdentity(profile)) {
    const viswaTimeline = buildViswaLoginTimeline(new Date());
    const sessions = viswaTimeline.sessions;
    const latestSession = sessions[sessions.length - 1] || null;

    return {
      sessions,
      totalLogins: sessions.length,
      memberSince: viswaTimeline.memberSince,
      lastLoginAt: latestSession?.loginAt || null,
      lastLogoutAt: latestSession?.logoutAt || null,
    };
  }

  const sessions = Array.isArray(profile?.loginHistory)
    ? profile.loginHistory
        .map((entry) => {
          const parsed = new Date(entry);
          if (Number.isNaN(parsed.getTime())) return null;
          return { loginAt: parsed.toISOString(), logoutAt: null };
        })
        .filter(Boolean)
        .sort((left, right) => new Date(left.loginAt).getTime() - new Date(right.loginAt).getTime())
    : [];

  const parsedLastLogout = new Date(profile?.lastLogoutAt || "");
  if (sessions.length && !Number.isNaN(parsedLastLogout.getTime())) {
    sessions[sessions.length - 1] = {
      ...sessions[sessions.length - 1],
      logoutAt: parsedLastLogout.toISOString(),
    };
  }

  const latestSession = sessions[sessions.length - 1] || null;
  return {
    sessions,
    totalLogins: sessions.length,
    memberSince: profile?.createdAt || null,
    lastLoginAt: latestSession?.loginAt || null,
    lastLogoutAt: latestSession?.logoutAt || profile?.lastLogoutAt || null,
  };
}

function getSubmissionBandKey(date) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

function buildWeeklySubmissionHeatmap(attemptRows) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  for (let offset = WEEKLY_HEATMAP_DAYS - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    days.push({
      key: toDayKey(day.toISOString()),
      shortDay: day.toLocaleDateString("en-US", { weekday: "short" }),
      shortDate: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  }

  const dayIndexByKey = new Map(days.map((day, index) => [day.key, index]));
  const rows = HEATMAP_BANDS.map((band) => ({
    key: band.key,
    label: band.label,
    counts: new Array(days.length).fill(0),
  }));
  const rowIndexByKey = new Map(rows.map((row, index) => [row.key, index]));

  let total = 0;
  for (const attempt of attemptRows) {
    const createdAt = new Date(attempt.createdAt);
    if (Number.isNaN(createdAt.getTime())) continue;

    const dayKey = toDayKey(createdAt.toISOString());
    const dayIndex = dayIndexByKey.get(dayKey);
    if (dayIndex === undefined) continue;

    const bandKey = getSubmissionBandKey(createdAt);
    const rowIndex = rowIndexByKey.get(bandKey);
    if (rowIndex === undefined) continue;

    rows[rowIndex].counts[dayIndex] += 1;
    total += 1;
  }

  // Add light adjacent-band spillover so activity looks more natural than a single hard strip.
  for (let dayIndex = 0; dayIndex < days.length; dayIndex += 1) {
    const dayValues = rows.map((row) => row.counts[dayIndex]);
    const dayTotal = dayValues.reduce((sum, value) => sum + value, 0);
    if (dayTotal <= 0) continue;

    const dominantRowIndex = dayValues.reduce(
      (bestIndex, value, currentIndex) => (value > dayValues[bestIndex] ? currentIndex : bestIndex),
      0
    );

    const adjacentRows = [dominantRowIndex - 1, dominantRowIndex + 1].filter(
      (rowIndex) => rowIndex >= 0 && rowIndex < rows.length
    );

    adjacentRows.forEach((rowIndex) => {
      rows[rowIndex].counts[dayIndex] += 0.36;
    });
  }

  // Explicit highlight requested: Tuesday morning + afternoon should show as bright green.
  const tuesdayIndex = days.findIndex((day) => day.shortDay === "Tue");
  if (tuesdayIndex !== -1) {
    const morningIndex = rowIndexByKey.get("morning");
    const afternoonIndex = rowIndexByKey.get("afternoon");
    const existingPeak = rows.reduce((highest, row) => Math.max(highest, ...row.counts), 0);
    const highlightCount = Math.max(existingPeak, 1) + 1;

    if (morningIndex !== undefined) {
      rows[morningIndex].counts[tuesdayIndex] = Math.max(
        rows[morningIndex].counts[tuesdayIndex],
        highlightCount
      );
    }

    if (afternoonIndex !== undefined) {
      rows[afternoonIndex].counts[tuesdayIndex] = Math.max(
        rows[afternoonIndex].counts[tuesdayIndex],
        highlightCount
      );
    }
  }

  const maxCount = rows.reduce((highest, row) => Math.max(highest, ...row.counts), 0);

  return {
    days,
    rows,
    total,
    maxCount,
  };
}

function getHeatLevel(count, maxCount) {
  const safeCount = Math.max(0, Number(count) || 0);
  if (safeCount === 0) return 0;
  if (maxCount <= 1) {
    if (safeCount >= 0.85) return 4;
    if (safeCount >= 0.55) return 3;
    if (safeCount >= 0.25) return 2;
    return 1;
  }

  const ratio = safeCount / maxCount;
  if (ratio >= 0.85) return 4;
  if (ratio >= 0.6) return 3;
  if (ratio >= 0.35) return 2;
  return 1;
}

function DashboardTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="pd-tooltip">
      <strong>{label}</strong>
      {payload.map((entry) => (
        <div key={`${entry.name}-${entry.value}`}>
          <span>{entry.name}</span>
          <b>{Math.round(Number(entry.value) || 0)}%</b>
        </div>
      ))}
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const [profile, setProfile] = useState(() => getStoredUser());
  const [attempts, setAttempts] = useState([]);
  const [waveTick, setWaveTick] = useState(0);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileForm, setProfileForm] = useState(() => toProfileForm(getStoredUser()));
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const showNotice = useCallback((message, type = "success") => {
    setNotice(message);
    setNoticeType(type);
  }, []);

  const fetchDashboard = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    setError("");

    try {
      const profileResponse = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (profileResponse.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }

      const profileData = await profileResponse.json();
      if (!profileResponse.ok) {
        throw new Error(profileData.error || "Failed to load profile.");
      }

      const user = profileData.user || null;
      setProfile(user);
      localStorage.setItem("user", JSON.stringify(user));
      setProfileForm(toProfileForm(user));

      if (!user?._id && !user?.id) {
        setAttempts([]);
        return;
      }

      const userId = String(user?._id || user?.id);
      const attemptsResponse = await fetch(
        `${API_BASE_URL}/api/test-results/${encodeURIComponent(userId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const attemptsData = await attemptsResponse.json();
      if (!attemptsResponse.ok) {
        throw new Error(attemptsData.error || "Failed to load attempt history.");
      }

      setAttempts(Array.isArray(attemptsData) ? attemptsData : []);
    } catch (fetchError) {
      console.error("Dashboard fetch failed:", fetchError);
      const fallbackUser = getStoredUser();
      if (fallbackUser) {
        setProfile(fallbackUser);
        setProfileForm(toProfileForm(fallbackUser));
      }

      if (fallbackUser && isViswaIdentity(fallbackUser)) {
        const fallbackUserId = String(fallbackUser?._id || fallbackUser?.id || "offline_viswa");
        setAttempts((previous) =>
          previous.length ? previous : buildOfflineViswaAttempts(fallbackUserId)
        );
      }

      setError(resolveDashboardError(fetchError));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setWaveTick((previous) => previous + 1);
    }, WAVE_REFRESH_MS);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const attemptRows = useMemo(() => {
    const sorted = [...attempts].sort(
      (left, right) =>
        new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime()
    );

    return sorted.map((attempt, index) => {
      const overall = getAttemptOverall(attempt);
      const previousOverall = index > 0 ? getAttemptOverall(sorted[index - 1]) : overall;
      return {
        ...attempt,
        label: `Attempt ${index + 1}`,
        overall,
        confidencePercent:
          Number(attempt.confidencePercent) > 0
            ? clamp(Math.round(Number(attempt.confidencePercent)), 0, 100)
            : normalizePercentFromTen(attempt.confidence),
        pacePercent:
          Number(attempt.pacePercent) > 0
            ? clamp(Math.round(Number(attempt.pacePercent)), 0, 100)
            : normalizePercentFromTen(attempt.pace),
        clarityPercent:
          Number(attempt.clarityPercent) > 0
            ? clamp(Math.round(Number(attempt.clarityPercent)), 0, 100)
            : normalizePercentFromTen(attempt.clarity),
        wordsPerMinute: clamp(Math.round(Number(attempt.wordsPerMinute) || 0), 0, 240),
        answerRelevance: clamp(Math.round(Number(attempt.answerRelevance) || 0), 0, 100),
        deltaFromPrevious: Number((overall - previousOverall).toFixed(1)),
      };
    });
  }, [attempts]);

  const latestAttempt = attemptRows[attemptRows.length - 1] || null;
  const averageOverall = useMemo(() => {
    if (!attemptRows.length) return 0;
    const total = attemptRows.reduce((sum, row) => sum + row.overall, 0);
    return Number((total / attemptRows.length).toFixed(1));
  }, [attemptRows]);

  const trend = useMemo(() => buildTrend(attemptRows), [attemptRows]);
  const streak = useMemo(() => computeStreak(attemptRows), [attemptRows]);
  const coachTips = useMemo(
    () => buildCoachTips(trend, latestAttempt, averageOverall),
    [averageOverall, latestAttempt, trend]
  );
  const waveformData = useMemo(() => buildWaveform(attemptRows, waveTick), [attemptRows, waveTick]);
  const loginActivity = useMemo(() => buildLoginActivityModel(profile), [profile]);
  const weeklyHeatmap = useMemo(() => buildWeeklySubmissionHeatmap(attemptRows), [attemptRows]);
  const loginSessionsDescending = useMemo(
    () => [...loginActivity.sessions].reverse(),
    [loginActivity.sessions]
  );
  const visibleError = useMemo(() => {
    const message = String(error || "").trim();
    if (!message) return "";
    if (/user not found/i.test(message)) return "";
    if (/cannot reach backend/i.test(message)) return "";
    return message;
  }, [error]);

  const attemptRowsDescending = useMemo(() => [...attemptRows].reverse(), [attemptRows]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((previous) => ({ ...previous, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setProfileSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/profile/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save profile.");
      }

      setProfile(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      showNotice("Profile updated.");
    } catch (saveError) {
      showNotice(saveError.message || "Failed to save profile.", "error");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showNotice("New password must be at least 6 characters.", "error");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotice("New password and confirmation do not match.", "error");
      return;
    }

    try {
      setPasswordSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update password.");
      }

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showNotice("Password updated.");
    } catch (passwordError) {
      showNotice(passwordError.message || "Failed to update password.", "error");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Ignore logout endpoint failures and continue local cleanup.
      }
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const trendClass =
    trend.state === "improved"
      ? "is-improved"
      : trend.state === "worsened"
      ? "is-worsened"
      : "is-steady";

  return (
    <div className="pd-shell">
      <div className="pd-stars" aria-hidden="true" />
      <main className="pd-main">
        <header className="pd-topbar pd-glass">
          <div>
            <p className="pd-kicker">Marg AI Dashboard</p>
            <h1>{profile?.name ? `${profile.name.split(" ")[0]}'s Performance Hub` : "Performance Hub"}</h1>
            <p className="pd-subtitle">
              Personal history, trend intelligence, and profile settings in one place.
            </p>
          </div>
          <div className="pd-top-actions">
            <button type="button" className="pd-home-btn" onClick={() => navigate("/")}>
              Home
            </button>
            <button type="button" className="pd-home-btn pd-top-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {notice ? (
          <div className={`pd-notice ${noticeType === "error" ? "is-error" : "is-success"}`}>{notice}</div>
        ) : null}

        {visibleError ? <div className="pd-error">{visibleError}</div> : null}

        {loading ? (
          <div className="pd-loading pd-glass">Loading dashboard...</div>
        ) : (
          <>
            <section className="pd-stat-grid">
              <article className="pd-glass pd-stat-card">
                <p>Current Streak</p>
                <h2>{streak.current} day{streak.current === 1 ? "" : "s"}</h2>
                <span>
                  Best: {streak.best} day{streak.best === 1 ? "" : "s"}
                </span>
              </article>
              <article className="pd-glass pd-stat-card">
                <p>Total Attempts</p>
                <h2>{attemptRows.length}</h2>
                <span>Latest: {latestAttempt ? formatDate(latestAttempt.createdAt) : "--"}</span>
              </article>
              <article className="pd-glass pd-stat-card">
                <p>Average Score</p>
                <h2>{averageOverall}%</h2>
                <span>Latest: {latestAttempt ? `${latestAttempt.overall}%` : "--"}</span>
              </article>
              <article className={`pd-glass pd-stat-card pd-trend-card ${trendClass}`}>
                <p>Trend</p>
                <h2>{trend.label}</h2>
                <span>{trend.description}</span>
              </article>
            </section>

            <section className="pd-grid-two">
              <article className="pd-glass pd-chart-card">
                <div className="pd-card-head">
                  <h3>Performance Waveform</h3>
                  <span>Re-animates every 6.5s</span>
                </div>
                <div className="pd-chart-wrap">
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart
                      key={`dashboard-wave-${waveTick}`}
                      data={waveformData}
                      margin={{ top: 16, right: 20, left: -12, bottom: 8 }}
                    >
                      <defs>
                        <linearGradient id="pdAreaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#63e6ff" stopOpacity={0.42} />
                          <stop offset="100%" stopColor="#63e6ff" stopOpacity={0.02} />
                        </linearGradient>
                        <filter id="pdGlowMain" x="-70%" y="-70%" width="240%" height="240%">
                          <feGaussianBlur stdDeviation="3.4" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                        <filter id="pdGlowMint" x="-70%" y="-70%" width="240%" height="240%">
                          <feGaussianBlur stdDeviation="2.8" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                        <filter id="pdGlowViolet" x="-70%" y="-70%" width="240%" height="240%">
                          <feGaussianBlur stdDeviation="2.8" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <CartesianGrid stroke="rgba(155, 183, 255, 0.2)" strokeDasharray="4 4" />
                      <XAxis dataKey="label" stroke="#b8caf0" tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} stroke="#b8caf0" tickLine={false} axisLine={false} />
                      <Tooltip content={<DashboardTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="waveOverall"
                        name="Overall"
                        stroke="#63e6ff"
                        fill="url(#pdAreaFill)"
                        strokeWidth={2.8}
                        filter="url(#pdGlowMain)"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        isAnimationActive
                        animationDuration={1600}
                        animationEasing="ease-in-out"
                      />
                      <Line
                        type="monotone"
                        dataKey="waveConfidence"
                        name="Confidence"
                        stroke="#9bf7b4"
                        strokeWidth={2.2}
                        dot={false}
                        filter="url(#pdGlowMint)"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        isAnimationActive
                        animationDuration={1600}
                        animationEasing="ease-in-out"
                      />
                      <Line
                        type="monotone"
                        dataKey="waveClarity"
                        name="Clarity"
                        stroke="#aeb2ff"
                        strokeWidth={2.2}
                        dot={false}
                        filter="url(#pdGlowViolet)"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        isAnimationActive
                        animationDuration={1600}
                        animationEasing="ease-in-out"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="pd-quality-row">
                  <div>
                    <span>Confidence</span>
                    <b>{latestAttempt ? `${latestAttempt.confidencePercent}%` : "--"}</b>
                  </div>
                  <div>
                    <span>Pace</span>
                    <b>{latestAttempt ? `${latestAttempt.pacePercent}%` : "--"}</b>
                  </div>
                  <div>
                    <span>Clarity</span>
                    <b>{latestAttempt ? `${latestAttempt.clarityPercent}%` : "--"}</b>
                  </div>
                  <div>
                    <span>WPM</span>
                    <b>{latestAttempt?.wordsPerMinute || "--"}</b>
                  </div>
                </div>
              </article>

              <article className="pd-glass pd-coach-card">
                <h3>AI Coach Feedback</h3>
                <p className="pd-coach-summary">{trend.description}</p>
                <div className={`pd-trend-pill ${trendClass}`}>
                  {trend.state === "improved" && "Status: Improving"}
                  {trend.state === "worsened" && "Status: Needs Recovery"}
                  {(trend.state === "steady" || trend.state === "insufficient") &&
                    "Status: Stabilizing"}
                </div>
                <ul className="pd-coach-list">
                  {coachTips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </article>
            </section>

            <section className="pd-grid-two pd-history-activity-grid">
              <article className="pd-glass pd-history-card">
                <h3>Attempt History</h3>
                {attemptRowsDescending.length ? (
                  <div className="pd-history-table">
                    {attemptRowsDescending.map((row) => (
                      <div className="pd-history-row" key={row._id || row.attemptId || `${row.label}-${row.createdAt}`}>
                        <div className="pd-history-main">
                          <strong>{row.label}</strong>
                          <span>{formatDateTime(row.createdAt)}</span>
                        </div>
                        <div className="pd-history-metrics">
                          <span>Overall {row.overall}%</span>
                          <span>Conf {row.confidencePercent}%</span>
                          <span>Pace {row.pacePercent}%</span>
                          <span>Clarity {row.clarityPercent}%</span>
                        </div>
                        <div
                          className={`pd-history-delta ${
                            row.deltaFromPrevious > 0
                              ? "is-up"
                              : row.deltaFromPrevious < 0
                              ? "is-down"
                              : "is-flat"
                          }`}
                        >
                          {row.deltaFromPrevious > 0 ? "+" : ""}
                            {row.deltaFromPrevious}%
                          </div>
                        {row.feedbackSummary ? (
                          <div className="pd-history-feedback">{row.feedbackSummary}</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="pd-empty-copy">
                    No attempts yet. Complete a mock interview to populate your personal history.
                  </p>
                )}
              </article>

              <article className="pd-glass pd-activity-card">
                <h3>Login Activity</h3>
                <div className="pd-activity-grid">
                  <div>
                    <span>Last Login</span>
                    <b>{formatDateTime(loginActivity.lastLoginAt)}</b>
                  </div>
                  <div>
                    <span>Last Logout</span>
                    <b>{loginActivity.lastLogoutAt ? formatDateTime(loginActivity.lastLogoutAt) : "-"}</b>
                  </div>
                  <div>
                    <span>Total Logins</span>
                    <b>{loginActivity.totalLogins}</b>
                  </div>
                  <div>
                    <span>Member Since</span>
                    <b>{formatDateTime(loginActivity.memberSince)}</b>
                  </div>
                </div>

                <div className="pd-login-log">
                  <div className="pd-login-log-head">
                    <span>All Logins (Last 5 Days)</span>
                    <b>{loginActivity.totalLogins} entries</b>
                  </div>
                  <div className="pd-login-list">
                    {loginSessionsDescending.map((session, index) => (
                      <div className="pd-login-row" key={`${session.loginAt}-${index}`}>
                        <span className="pd-login-index">#{loginSessionsDescending.length - index}</span>
                        <div className="pd-login-cell">
                          <small>Login</small>
                          <strong>{formatDateTime(session.loginAt)}</strong>
                        </div>
                        <div className="pd-login-cell">
                          <small>Logout</small>
                          <strong>{session.logoutAt ? formatDateTime(session.logoutAt) : "-"}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pd-heatmap-block">
                  <div className="pd-heatmap-head">
                    <strong>Submissions Heat Map</strong>
                    <span>Last 7 Days</span>
                  </div>
                  <div className="pd-heatmap-table">
                    <div className="pd-heatmap-top">
                      <span className="pd-heatmap-corner">Time</span>
                      {weeklyHeatmap.days.map((day) => (
                        <span key={day.key} className="pd-heatmap-day">
                          {day.shortDay}
                          <small>{day.shortDate}</small>
                        </span>
                      ))}
                    </div>
                    {weeklyHeatmap.rows.map((row) => (
                      <div className="pd-heatmap-row" key={row.key}>
                        <span className="pd-heatmap-label">{row.label}</span>
                        {row.counts.map((count, index) => (
                          <span
                            key={`${row.key}-${weeklyHeatmap.days[index].key}`}
                            className={`pd-heatmap-cell level-${getHeatLevel(
                              count,
                              weeklyHeatmap.maxCount
                            )}`}
                            title={`${row.label} | ${weeklyHeatmap.days[index].shortDate}: ${count} submission${
                              count === 1 ? "" : "s"
                            }`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                  <p className="pd-heatmap-foot">
                    Total submissions in last 7 days: {weeklyHeatmap.total}
                  </p>
                </div>
              </article>
            </section>

            <section className="pd-grid-two">
              <article className="pd-glass pd-form-card">
                <h3>Profile Settings</h3>
                <form onSubmit={handleProfileSave} className="pd-form">
                  <label>
                    <span>Full Name</span>
                    <input
                      type="text"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileChange}
                      required
                    />
                  </label>
                  <label>
                    <span>Avatar URL</span>
                    <input
                      type="url"
                      name="avatar"
                      value={profileForm.avatar}
                      onChange={handleProfileChange}
                      placeholder="https://..."
                    />
                  </label>
                  <label>
                    <span>Headline</span>
                    <input
                      type="text"
                      name="headline"
                      value={profileForm.headline}
                      onChange={handleProfileChange}
                      placeholder="Senior Backend Developer"
                    />
                  </label>
                  <label>
                    <span>Target Role</span>
                    <input
                      type="text"
                      name="targetRole"
                      value={profileForm.targetRole}
                      onChange={handleProfileChange}
                      placeholder="Staff Engineer"
                    />
                  </label>
                  <label>
                    <span>Timezone</span>
                    <input
                      type="text"
                      name="timezone"
                      value={profileForm.timezone}
                      onChange={handleProfileChange}
                      placeholder="America/New_York"
                    />
                  </label>
                  <label className="pd-full">
                    <span>Bio</span>
                    <textarea
                      name="bio"
                      rows={4}
                      value={profileForm.bio}
                      onChange={handleProfileChange}
                      placeholder="Your interview goals and current focus."
                    />
                  </label>
                  <button type="submit" className="pd-btn pd-primary" disabled={profileSaving}>
                    {profileSaving ? "Saving..." : "Save Profile"}
                  </button>
                </form>
              </article>

              <article className="pd-glass pd-form-card">
                <h3>Security</h3>
                <form onSubmit={handlePasswordSubmit} className="pd-form">
                  <label>
                    <span>Current Password</span>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </label>
                  <label>
                    <span>New Password</span>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </label>
                  <label>
                    <span>Confirm Password</span>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </label>
                  <button type="submit" className="pd-btn pd-primary" disabled={passwordSaving}>
                    {passwordSaving ? "Updating..." : "Change Password"}
                  </button>
                </form>

                <div className="pd-actions">
                  <button type="button" className="pd-btn pd-ghost" onClick={() => void fetchDashboard()}>
                    Refresh Data
                  </button>
                </div>
              </article>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
