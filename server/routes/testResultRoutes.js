import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import TestResult from "../models/TestResult.js";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_RESULTS_FILE = path.resolve(__dirname, "../test-results.json");
const LOCAL_USERS_FILE = path.resolve(__dirname, "../users.json");

const VISWA_DEFAULT = {
  name: "Viswa",
  email: "viswa2006@margai.app",
  password: "Viswa@2006",
  headline: "Cybersecurity Learner",
  targetRole: "Security Analyst",
  timezone: "Asia/Kolkata",
  bio: "Auto-seeded dashboard profile with historical mock interview progression.",
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function normalizeUserId(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeText(value, maxLength = 140) {
  return String(value || "").trim().slice(0, maxLength);
}

function isMongoUnavailableError(error) {
  if (!error) return false;
  const text = String(error.message || "").toLowerCase();
  return (
    error.name === "MongooseServerSelectionError" ||
    text.includes("querysrv") ||
    text.includes("server selection") ||
    text.includes("failed to connect") ||
    text.includes("before initial connection is complete") ||
    text.includes("connection")
  );
}

function isViswaIdentity({ name, email } = {}) {
  const normalizedName = String(name || "").trim().toLowerCase();
  const normalizedEmail = normalizeEmail(email);
  if (normalizedName === "viswa") return true;
  return normalizedEmail.startsWith("viswa@") || normalizedEmail.startsWith("viswa2006@");
}

function buildUserQuery(userId) {
  const safeUserId = normalizeUserId(userId);
  const clauses = [{ user: safeUserId }];

  if (mongoose.Types.ObjectId.isValid(safeUserId)) {
    clauses.push({ user: new mongoose.Types.ObjectId(safeUserId) });
  }

  return clauses.length === 1 ? clauses[0] : { $or: clauses };
}

function buildUserAttemptQuery(userId, attemptId) {
  const userQuery = buildUserQuery(userId);
  if (Object.prototype.hasOwnProperty.call(userQuery, "$or")) {
    return { $and: [userQuery, { attemptId }] };
  }
  return { ...userQuery, attemptId };
}

function buildSeedFilter(userId) {
  const seedRegex = /^viswa2006-seed-\d+$/i;
  const userQuery = buildUserQuery(userId);
  if (Object.prototype.hasOwnProperty.call(userQuery, "$or")) {
    return { $and: [userQuery, { attemptId: { $regex: seedRegex } }] };
  }
  return { ...userQuery, attemptId: { $regex: seedRegex } };
}

function normalizeNumber(value, fallback = 0, min = 0, max = 100) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(Number(numeric.toFixed(2)), min, max);
}

function scoreBand(percent) {
  const safe = normalizeNumber(percent, 0, 0, 100);
  if (safe >= 88) return "Excellent";
  if (safe >= 76) return "Very Good";
  if (safe >= 64) return "Good Progress";
  if (safe >= 52) return "Developing Well";
  return "Building Base";
}

function normalizePayloadFromBody(body, authUserId) {
  const aiFeedback = Array.isArray(body?.aiFeedback)
    ? body.aiFeedback.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 10)
    : [];

  const payload = {
    user: authUserId,
    attemptId: String(body?.attemptId || "").trim(),
    attemptNumber: Math.max(0, Math.round(Number(body?.attemptNumber) || 0)),
    confidence: normalizeNumber(body?.confidence, 0, 0, 10),
    pace: normalizeNumber(body?.pace, 0, 0, 10),
    clarity: normalizeNumber(body?.clarity ?? body?.engagement, 0, 0, 10),
    overallPercent: normalizeNumber(body?.overallPercent, 0, 0, 100),
    answerRelevance: normalizeNumber(body?.answerRelevance, 0, 0, 100),
    aiGrade10: normalizeNumber(body?.aiGrade10, 0, 0, 10),
    confidencePercent: normalizeNumber(body?.confidencePercent, 0, 0, 100),
    pacePercent: normalizeNumber(body?.pacePercent, 0, 0, 100),
    clarityPercent: normalizeNumber(body?.clarityPercent, 0, 0, 100),
    wordsPerMinute: normalizeNumber(body?.wordsPerMinute, 0, 0, 240),
    eyeContact: normalizeNumber(body?.eyeContact, 0, 0, 100),
    postureStability: normalizeNumber(body?.postureStability, 0, 0, 100),
    vocabularyRange: normalizeNumber(body?.vocabularyRange, 0, 0, 100),
    questionCount: Math.max(0, Math.round(Number(body?.questionCount) || 0)),
    interviewDurationSeconds: normalizeNumber(
      body?.interviewDurationSeconds ?? body?.interviewDuration,
      0,
      0,
      7200
    ),
    feedbackSummary: normalizeText(body?.feedbackSummary, 220),
    summaryBand: normalizeText(body?.summaryBand, 80),
    aiFeedback,
    source: normalizeText(body?.source || "manual", 40) || "manual",
  };

  if (!payload.summaryBand) {
    payload.summaryBand = scoreBand(payload.overallPercent);
  }

  if (!payload.feedbackSummary && aiFeedback.length) {
    payload.feedbackSummary = normalizeText(aiFeedback[0], 220);
  }

  return payload;
}

function buildSeedAttempts(userId) {
  const blueprint = [
    {
      confidencePercent: 38,
      clarityPercent: 42,
      pacePercent: 52,
      postureStability: 40,
      eyeContact: 34,
      wordsPerMinute: 178,
      answerRelevance: 34,
      overallPercent: 36,
      interviewDurationSeconds: 575,
      feedbackSummary: "Nervous baseline. Slow down and keep camera focus through complete answers.",
    },
    {
      confidencePercent: 41,
      clarityPercent: 45,
      pacePercent: 55,
      postureStability: 43,
      eyeContact: 37,
      wordsPerMinute: 172,
      answerRelevance: 38,
      overallPercent: 40,
      interviewDurationSeconds: 560,
      feedbackSummary: "Better composure, but eye contact drops during technical explanations.",
    },
    {
      confidencePercent: 44,
      clarityPercent: 47,
      pacePercent: 57,
      postureStability: 45,
      eyeContact: 40,
      wordsPerMinute: 168,
      answerRelevance: 42,
      overallPercent: 44,
      interviewDurationSeconds: 548,
      feedbackSummary: "Response quality is improving. Keep pace stable and avoid rushing key points.",
    },
    {
      confidencePercent: 48,
      clarityPercent: 51,
      pacePercent: 60,
      postureStability: 49,
      eyeContact: 45,
      wordsPerMinute: 162,
      answerRelevance: 47,
      overallPercent: 49,
      interviewDurationSeconds: 540,
      feedbackSummary: "Clearer sentence flow and stronger structure. Continue reducing filler transitions.",
    },
    {
      confidencePercent: 52,
      clarityPercent: 55,
      pacePercent: 63,
      postureStability: 53,
      eyeContact: 49,
      wordsPerMinute: 157,
      answerRelevance: 52,
      overallPercent: 54,
      interviewDurationSeconds: 528,
      feedbackSummary: "Good progression. Delivery is steadier and relevance is more consistent.",
    },
    {
      confidencePercent: 56,
      clarityPercent: 58,
      pacePercent: 66,
      postureStability: 57,
      eyeContact: 53,
      wordsPerMinute: 153,
      answerRelevance: 57,
      overallPercent: 58,
      interviewDurationSeconds: 516,
      feedbackSummary: "Posture and clarity are stronger. Continue direct context-action-result framing.",
    },
    {
      confidencePercent: 59,
      clarityPercent: 61,
      pacePercent: 68,
      postureStability: 60,
      eyeContact: 56,
      wordsPerMinute: 150,
      answerRelevance: 61,
      overallPercent: 62,
      interviewDurationSeconds: 508,
      feedbackSummary: "Momentum is positive. Maintain this speaking rhythm under longer answers.",
    },
    {
      confidencePercent: 55,
      clarityPercent: 62,
      pacePercent: 67,
      postureStability: 56,
      eyeContact: 54,
      wordsPerMinute: 149,
      answerRelevance: 60,
      overallPercent: 60,
      interviewDurationSeconds: 512,
      feedbackSummary: "Minor dip in confidence and posture. Signs of distraction in the middle section.",
    },
    {
      confidencePercent: 57,
      clarityPercent: 63,
      pacePercent: 68,
      postureStability: 55,
      eyeContact: 55,
      wordsPerMinute: 148,
      answerRelevance: 62,
      overallPercent: 61,
      interviewDurationSeconds: 510,
      feedbackSummary: "Plateau phase. Keep answers concise and reset body posture before each response.",
    },
    {
      confidencePercent: 58,
      clarityPercent: 64,
      pacePercent: 69,
      postureStability: 57,
      eyeContact: 56,
      wordsPerMinute: 147,
      answerRelevance: 63,
      overallPercent: 62,
      interviewDurationSeconds: 506,
      feedbackSummary: "Stability returns. Focus on stronger opening lines for each question.",
    },
    {
      confidencePercent: 64,
      clarityPercent: 69,
      pacePercent: 72,
      postureStability: 64,
      eyeContact: 63,
      wordsPerMinute: 145,
      answerRelevance: 70,
      overallPercent: 69,
      interviewDurationSeconds: 498,
      feedbackSummary: "Noticeable improvement in structure and delivery. Keep this consistency.",
    },
    {
      confidencePercent: 69,
      clarityPercent: 73,
      pacePercent: 75,
      postureStability: 69,
      eyeContact: 68,
      wordsPerMinute: 143,
      answerRelevance: 75,
      overallPercent: 74,
      interviewDurationSeconds: 490,
      feedbackSummary: "Strong progress. Better lens engagement and cleaner answer sequencing.",
    },
    {
      confidencePercent: 73,
      clarityPercent: 77,
      pacePercent: 78,
      postureStability: 73,
      eyeContact: 72,
      wordsPerMinute: 142,
      answerRelevance: 80,
      overallPercent: 79,
      interviewDurationSeconds: 482,
      feedbackSummary: "Delivery and structure are now reliable. Continue adding measurable outcomes.",
    },
    {
      confidencePercent: 79,
      clarityPercent: 82,
      pacePercent: 82,
      postureStability: 79,
      eyeContact: 78,
      wordsPerMinute: 141,
      answerRelevance: 86,
      overallPercent: 85,
      interviewDurationSeconds: 474,
      feedbackSummary: "High performance. Focus on refinement and tighter transitions under pressure.",
    },
    {
      confidencePercent: 84,
      clarityPercent: 87,
      pacePercent: 85,
      postureStability: 84,
      eyeContact: 83,
      wordsPerMinute: 140,
      answerRelevance: 91,
      overallPercent: 90,
      interviewDurationSeconds: 466,
      feedbackSummary: "Excellent finish. Maintain this pace and polish impact framing for elite results.",
    },
  ];

  const totalAttempts = blueprint.length;
  const now = Date.now();

  return blueprint.map((entry, index) => {
    const attemptNumber = index + 1;
    const createdAt = new Date(now - (totalAttempts - index) * 86400000).toISOString();
    const aiGrade10 = Number((entry.overallPercent / 10).toFixed(1));

    return {
      user: normalizeUserId(userId),
      attemptId: `viswa2006-seed-${attemptNumber}`,
      attemptNumber,
      confidence: Number((entry.confidencePercent / 10).toFixed(1)),
      pace: Number((entry.pacePercent / 10).toFixed(1)),
      clarity: Number((entry.clarityPercent / 10).toFixed(1)),
      overallPercent: entry.overallPercent,
      answerRelevance: entry.answerRelevance,
      aiGrade10,
      confidencePercent: entry.confidencePercent,
      pacePercent: entry.pacePercent,
      clarityPercent: entry.clarityPercent,
      wordsPerMinute: entry.wordsPerMinute,
      eyeContact: entry.eyeContact,
      postureStability: entry.postureStability,
      vocabularyRange: clamp(Math.round(entry.clarityPercent + 8 + (index % 3)), 0, 100),
      questionCount: 6 + (index % 3),
      interviewDurationSeconds: entry.interviewDurationSeconds,
      feedbackSummary: entry.feedbackSummary,
      summaryBand: scoreBand(entry.overallPercent),
      aiFeedback: [entry.feedbackSummary],
      source: "seed",
      createdAt,
      updatedAt: createdAt,
    };
  });
}

async function readLocalUsers() {
  try {
    const raw = await fs.readFile(LOCAL_USERS_FILE, "utf8");
    const parsed = JSON.parse(raw || "{}");
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.users)) return parsed.users;
    return [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeLocalUsers(users) {
  await fs.writeFile(LOCAL_USERS_FILE, JSON.stringify({ users }, null, 2), "utf8");
}

async function readLocalResults() {
  try {
    const raw = await fs.readFile(LOCAL_RESULTS_FILE, "utf8");
    const parsed = JSON.parse(raw || "{}");
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.results)) return parsed.results;
    return [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeLocalResults(results) {
  await fs.writeFile(LOCAL_RESULTS_FILE, JSON.stringify({ results }, null, 2), "utf8");
}

function createLocalResultId() {
  return `local_result_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createLocalUserId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function matchLocalResult(result, userId, attemptId) {
  return normalizeUserId(result?.user) === normalizeUserId(userId) && String(result?.attemptId || "") === attemptId;
}

async function ensureViswaUserMongo() {
  const filter = {
    $or: [{ name: /^viswa$/i }, { email: /^viswa(?:2006)?@/i }],
  };

  let user = await User.findOne(filter);
  let passwordHash = "";

  if (!user) {
    passwordHash = await bcrypt.hash(VISWA_DEFAULT.password, 10);
    user = await User.create({
      name: VISWA_DEFAULT.name,
      email: VISWA_DEFAULT.email,
      password: passwordHash,
      authProvider: "local",
      headline: VISWA_DEFAULT.headline,
      targetRole: VISWA_DEFAULT.targetRole,
      timezone: VISWA_DEFAULT.timezone,
      bio: VISWA_DEFAULT.bio,
    });
  } else {
    let dirty = false;
    if (!user.name) {
      user.name = VISWA_DEFAULT.name;
      dirty = true;
    }
    if (!user.headline) {
      user.headline = VISWA_DEFAULT.headline;
      dirty = true;
    }
    if (!user.targetRole) {
      user.targetRole = VISWA_DEFAULT.targetRole;
      dirty = true;
    }
    if (!user.timezone) {
      user.timezone = VISWA_DEFAULT.timezone;
      dirty = true;
    }
    if (!user.bio) {
      user.bio = VISWA_DEFAULT.bio;
      dirty = true;
    }
    if (!user.password && user.authProvider === "local") {
      passwordHash = await bcrypt.hash(VISWA_DEFAULT.password, 10);
      user.password = passwordHash;
      dirty = true;
    }
    if (dirty) {
      await user.save();
    }
  }

  return {
    userId: String(user._id),
    name: user.name,
    email: user.email,
    storage: "mongo",
  };
}

async function ensureViswaUserLocal() {
  const users = await readLocalUsers();
  const nowIso = new Date().toISOString();
  let passwordHash = "";
  const index = users.findIndex((entry) => isViswaIdentity(entry));

  if (index === -1) {
    passwordHash = await bcrypt.hash(VISWA_DEFAULT.password, 10);
    const created = {
      id: createLocalUserId(),
      name: VISWA_DEFAULT.name,
      email: VISWA_DEFAULT.email,
      password: passwordHash,
      authProvider: "local",
      avatar: "",
      headline: VISWA_DEFAULT.headline,
      targetRole: VISWA_DEFAULT.targetRole,
      timezone: VISWA_DEFAULT.timezone,
      bio: VISWA_DEFAULT.bio,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastLoginAt: null,
      lastLogoutAt: null,
      loginHistory: [],
    };
    users.push(created);
    await writeLocalUsers(users);
    return { userId: created.id, name: created.name, email: created.email, storage: "local" };
  }

  const existing = users[index];
  let dirty = false;
  const updated = { ...existing };

  if (!updated.id) {
    updated.id = createLocalUserId();
    dirty = true;
  }
  if (!updated.name) {
    updated.name = VISWA_DEFAULT.name;
    dirty = true;
  }
  if (!updated.email) {
    updated.email = VISWA_DEFAULT.email;
    dirty = true;
  }
  if (!updated.authProvider) {
    updated.authProvider = "local";
    dirty = true;
  }
  if (!updated.headline) {
    updated.headline = VISWA_DEFAULT.headline;
    dirty = true;
  }
  if (!updated.targetRole) {
    updated.targetRole = VISWA_DEFAULT.targetRole;
    dirty = true;
  }
  if (!updated.timezone) {
    updated.timezone = VISWA_DEFAULT.timezone;
    dirty = true;
  }
  if (!updated.bio) {
    updated.bio = VISWA_DEFAULT.bio;
    dirty = true;
  }
  if (!updated.password && updated.authProvider !== "google") {
    passwordHash = await bcrypt.hash(VISWA_DEFAULT.password, 10);
    updated.password = passwordHash;
    updated.authProvider = "local";
    dirty = true;
  }

  if (dirty) {
    updated.updatedAt = nowIso;
    users[index] = updated;
    await writeLocalUsers(users);
  }

  return {
    userId: normalizeUserId(updated.id),
    name: updated.name,
    email: updated.email,
    storage: "local",
  };
}

async function ensureViswaUserContext() {
  try {
    const mongoUser = await ensureViswaUserMongo();
    if (isViswaIdentity(mongoUser)) return mongoUser;
  } catch (error) {
    if (!isMongoUnavailableError(error)) {
      console.error("Ensure Viswa mongo user error:", error);
    }
  }

  return ensureViswaUserLocal();
}

async function saveResultMongo(payload) {
  if (payload.attemptId) {
    const existing = await TestResult.findOne(buildUserAttemptQuery(payload.user, payload.attemptId));
    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      return { result: existing, updated: true };
    }
  }

  const created = await TestResult.create(payload);
  return { result: created, updated: false };
}

async function saveResultLocal(payload) {
  const results = await readLocalResults();
  const nowIso = new Date().toISOString();
  const createdAt = String(payload.createdAt || nowIso);
  const updatedAt = String(payload.updatedAt || nowIso);

  if (payload.attemptId) {
    const existingIndex = results.findIndex((entry) =>
      matchLocalResult(entry, payload.user, payload.attemptId)
    );
    if (existingIndex !== -1) {
      const existing = results[existingIndex];
      results[existingIndex] = {
        ...existing,
        ...payload,
        createdAt: existing.createdAt || createdAt,
        updatedAt,
      };
      await writeLocalResults(results);
      return { result: results[existingIndex], updated: true };
    }
  }

  const record = {
    _id: createLocalResultId(),
    ...payload,
    createdAt,
    updatedAt,
  };
  results.push(record);
  await writeLocalResults(results);
  return { result: record, updated: false };
}

async function fetchResultsMongo(userId) {
  return TestResult.find(buildUserQuery(userId)).sort({ createdAt: 1 });
}

async function fetchResultsLocal(userId) {
  const safeUserId = normalizeUserId(userId);
  const results = await readLocalResults();
  return results
    .filter((entry) => normalizeUserId(entry.user) === safeUserId)
    .sort((left, right) => new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime());
}

async function upsertSeedAttemptsMongo(userId, seedAttempts) {
  const existingSeedCount = await TestResult.countDocuments(buildSeedFilter(userId));
  if (existingSeedCount >= seedAttempts.length) {
    return;
  }

  for (const seed of seedAttempts) {
    const existing = await TestResult.findOne(buildUserAttemptQuery(userId, seed.attemptId));
    if (existing) {
      Object.assign(existing, seed);
      existing.createdAt = new Date(seed.createdAt);
      existing.updatedAt = new Date(seed.updatedAt);
      await existing.save();
    } else {
      const created = new TestResult(seed);
      created.createdAt = new Date(seed.createdAt);
      created.updatedAt = new Date(seed.updatedAt);
      await created.save();
    }
  }
}

async function upsertSeedAttemptsLocal(userId, seedAttempts) {
  const results = await readLocalResults();
  const safeUserId = normalizeUserId(userId);
  const existingSeedCount = results.filter((entry) =>
    normalizeUserId(entry.user) === safeUserId && /^viswa2006-seed-\d+$/i.test(String(entry.attemptId || ""))
  ).length;

  if (existingSeedCount >= seedAttempts.length) {
    return;
  }

  for (const seed of seedAttempts) {
    const index = results.findIndex((entry) => matchLocalResult(entry, safeUserId, seed.attemptId));
    if (index !== -1) {
      const existing = results[index];
      results[index] = {
        ...existing,
        ...seed,
        _id: existing._id || createLocalResultId(),
        user: safeUserId,
      };
    } else {
      results.push({
        _id: createLocalResultId(),
        ...seed,
        user: safeUserId,
      });
    }
  }

  await writeLocalResults(results);
}

async function ensureViswaSeedData() {
  const viswaUser = await ensureViswaUserContext();
  if (!viswaUser || !isViswaIdentity(viswaUser)) return;

  const seeds = buildSeedAttempts(viswaUser.userId);

  if (viswaUser.storage === "mongo") {
    try {
      await upsertSeedAttemptsMongo(viswaUser.userId, seeds);
      return;
    } catch (error) {
      if (!isMongoUnavailableError(error)) {
        throw error;
      }
    }
  }

  await upsertSeedAttemptsLocal(viswaUser.userId, seeds);
}

// Save test result
router.post("/save", protect, async (req, res) => {
  const authUserId = normalizeUserId(req.user?.id);
  if (!authUserId) {
    return res.status(401).json({ error: "Invalid user context." });
  }

  const payload = normalizePayloadFromBody(req.body || {}, authUserId);
  if (payload.confidence <= 0 || payload.pace <= 0 || payload.clarity <= 0) {
    return res.status(400).json({ error: "Confidence, pace, and clarity are required." });
  }

  try {
    const saved = await saveResultMongo(payload);
    return res.status(saved.updated ? 200 : 201).json({
      message: saved.updated ? "Test result updated" : "Test result saved successfully",
      result: saved.result,
      updated: saved.updated,
    });
  } catch (error) {
    if (isMongoUnavailableError(error)) {
      try {
        const savedLocal = await saveResultLocal(payload);
        return res.status(savedLocal.updated ? 200 : 201).json({
          message: savedLocal.updated ? "Test result updated" : "Test result saved successfully",
          result: savedLocal.result,
          updated: savedLocal.updated,
        });
      } catch (localError) {
        console.error("Save local test result error:", localError);
        return res.status(500).json({ error: "Failed to save test result" });
      }
    }

    console.error("Save test result error:", error);
    return res.status(500).json({ error: "Failed to save test result" });
  }
});

// Get all results of a user
router.get("/:userId", protect, async (req, res) => {
  const authUserId = normalizeUserId(req.user?.id);
  const requestedUserId = normalizeUserId(req.params.userId);

  if (!authUserId || !requestedUserId) {
    return res.status(400).json({ error: "Invalid user id." });
  }

  if (authUserId !== requestedUserId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    await ensureViswaSeedData();
  } catch (error) {
    console.error("Viswa seed history error:", error);
  }

  try {
    const results = await fetchResultsMongo(requestedUserId);
    return res.json(results);
  } catch (error) {
    if (isMongoUnavailableError(error)) {
      try {
        const localResults = await fetchResultsLocal(requestedUserId);
        return res.json(localResults);
      } catch (localError) {
        console.error("Fetch local test results error:", localError);
        return res.status(500).json({ error: "Failed to fetch results" });
      }
    }

    console.error("Fetch test results error:", error);
    return res.status(500).json({ error: "Failed to fetch results" });
  }
});

export default router;
