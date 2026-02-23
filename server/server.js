// -----------------------------
// IMPORTS
// -----------------------------
import authRoutes from "./routes/auth.js";
import cors from "cors";
import codeRoutes from "./routes/code.js";
import testResultRoutes from "./routes/testResultRoutes.js";
import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { exec } from "child_process";
import fs from "fs";
import mongoose from "mongoose";
import OpenAI from "openai";

dotenv.config();
mongoose.set("bufferCommands", false);

const fallbackMongoUri = "mongodb://127.0.0.1:27017/ai-interview";

function buildMongoUriFromParts() {
  const directUri = String(process.env.MONGO_URI || "").trim();
  if (directUri) return directUri;

  const user = String(process.env.MONGO_USER || "").trim();
  const password = String(process.env.MONGO_PASSWORD || "").trim();
  const cluster = String(process.env.MONGO_CLUSTER || "").trim();
  const dbName = String(process.env.MONGO_DB_NAME || "ai-interview").trim();

  if (user && password && cluster) {
    const encodedUser = encodeURIComponent(user);
    const encodedPassword = encodeURIComponent(password);
    const normalizedCluster = cluster.replace(/^mongodb\+srv:\/\//, "").replace(/^https?:\/\//, "");
    return `mongodb+srv://${encodedUser}:${encodedPassword}@${normalizedCluster}/${dbName}?retryWrites=true&w=majority`;
  }

  return fallbackMongoUri;
}

function buildMongoCandidates() {
  const candidates = [];
  const primary = String(process.env.MONGO_URI || "").trim();
  const direct = String(process.env.MONGO_URI_DIRECT || "").trim();
  const fromParts = buildMongoUriFromParts();

  if (primary) candidates.push(primary);
  if (direct) candidates.push(direct);
  if (!primary && fromParts) candidates.push(fromParts);

  if (candidates.length === 0) {
    candidates.push(fallbackMongoUri);
  }

  return [...new Set(candidates)];
}

function maskMongoUri(uri) {
  return String(uri).replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
}

async function connectMongo() {
  const mongoCandidates = buildMongoCandidates();
  let lastError = null;

  for (const mongoUri of mongoCandidates) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
      console.log(`MongoDB connected: ${maskMongoUri(mongoUri)}`);
      return;
    } catch (error) {
      lastError = error;
      console.error(`Mongo connection failed: ${maskMongoUri(mongoUri)}`);
      if (String(error?.message || "").includes("querySrv")) {
        console.error(
          "SRV DNS lookup failed. Add a standard Atlas URI to MONGO_URI_DIRECT to bypass SRV DNS."
        );
      }
    }
  }

  console.error(
    "Check Mongo credentials, Atlas network access allowlist, and encode special characters in password."
  );
  throw lastError || new Error("Mongo connection failed");
}

/// -----------------------------
// CONFIG
// -----------------------------
const app = express();
const configuredOrigins = String(process.env.CLIENT_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

function isLocalDevOrigin(origin) {
  if (!origin) return false;
  return (
    /^http:\/\/localhost:\d+$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
  );
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (configuredOrigins.includes(origin) || isLocalDevOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/test-results", testResultRoutes);
app.use("/api/code", codeRoutes);
app.get("/api/health", (req, res) => {
  const stateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return res.json({
    ok: true,
    dbState: stateMap[mongoose.connection.readyState] || "unknown",
  });
});





// -----------------------------
// OPENAI SETUP
// -----------------------------
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function safeDeleteFile(filePath) {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore cleanup failures.
  }
}

function buildFallbackAnalysis(reason = "") {
  const feedback = [
    "Server-side transcript analysis is temporarily unavailable.",
    "Live camera and voice metrics were used to complete your report.",
  ];

  if (reason) {
    feedback.push(`Technical note: ${reason}`);
  }

  return {
    transcript: "",
    words_per_minute: 0,
    filler_count: 0,
    confidence_score: 7,
    pace_score: 7,
    clarity_score: 7,
    final_score: 7,
    ai_feedback: feedback,
  };
}

// -----------------------------
// MULTER SETUP
// -----------------------------
const upload = multer({
  dest: "uploads/",
});

// -----------------------------
// ROUTE
// -----------------------------
app.post(
  "/api/analyze-interview",
  upload.single("recording"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const videoPath = req.file.path;
      console.log("Mock AI analysis running");
      const audioPath = videoPath + ".wav";

      if (!openai) {
        safeDeleteFile(videoPath);
        return res.json({
          success: true,
          analysis: buildFallbackAnalysis(
            "OPENAI_API_KEY is missing, so only live client metrics were used."
          ),
        });
      }

      // ----------------------------------
      // 1️⃣ Extract audio using FFMPEG
      // ----------------------------------
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -i "${videoPath}" -ar 16000 -ac 1 -vn "${audioPath}"`,
          (error) => {
            if (error) reject(error);
            else resolve();
          }
        );
      });

      // ----------------------------------
      // 2️⃣ Transcribe with Whisper
      // ----------------------------------
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: "whisper-1",
      });

      const transcript = transcription.text;

     // ----------------------------------
// 3️⃣ Extract REAL duration using ffprobe
// ----------------------------------
const durationSeconds = await new Promise((resolve, reject) => {
  exec(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`,
    (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(parseFloat(stdout));
      }
    }
  );
});

const durationMinutes = durationSeconds / 60;

      const wordCount = transcript.split(/\s+/).length;
      const wordsPerMinute = Math.round(wordCount / durationMinutes);

      // ----------------------------------
      // 4️⃣ Pace Scoring
      // ----------------------------------
      let paceScore = 0;

      if (wordsPerMinute >= 130 && wordsPerMinute <= 160) paceScore = 10;
      else if (wordsPerMinute >= 115 && wordsPerMinute <= 175) paceScore = 8;
      else if (wordsPerMinute >= 100 && wordsPerMinute <= 190) paceScore = 6;
      else paceScore = 4;

      // ----------------------------------
      // 5️⃣ Confidence Scoring
      // ----------------------------------
      const fillerWords =
        (
          transcript.match(
            /\b(um|uh|like|basically|actually|you know)\b/gi
          ) || []
        ).length;

      const fillerPenalty = Math.min(4, fillerWords * 0.5);

      const strongWords = [
        "led",
        "managed",
        "built",
        "developed",
        "achieved",
        "improved",
        "solved",
        "created",
      ];

      let strengthMatches = 0;
      strongWords.forEach((word) => {
        if (transcript.toLowerCase().includes(word)) {
          strengthMatches++;
        }
      });

      const verbalStrengthBonus = Math.min(2, strengthMatches * 0.5);

      let confidenceScore =
        6 + paceScore / 4 + verbalStrengthBonus - fillerPenalty;

      confidenceScore = Math.max(
        1,
        Math.min(10, Math.round(confidenceScore))
      );

      // ----------------------------------
      // 6️⃣ Clarity Scoring
      // ----------------------------------
      const sentenceCount = Math.max(
        1,
        (transcript.match(/[.!?]+/g) || []).length
      );
      const avgWordsPerSentence = wordCount / sentenceCount;
      const uniqueWords = new Set(
        transcript.toLowerCase().match(/\b[a-z']+\b/g) || []
      ).size;
      const lexicalDiversity = uniqueWords / Math.max(1, wordCount);

      const sentenceStructurePenalty = Math.min(
        3.2,
        Math.abs(avgWordsPerSentence - 14) * 0.28
      );

      let clarityScore =
        8.2 +
        (paceScore >= 8 ? 0.7 : 0.2) +
        (lexicalDiversity - 0.45) * 5.2 -
        fillerWords * 0.22 -
        sentenceStructurePenalty;

      clarityScore = Math.max(1, Math.min(10, Math.round(clarityScore)));

      // ----------------------------------
      // 7️⃣ Final Score
      // ----------------------------------
      const finalScore = Math.round(
        confidenceScore * 0.4 +
        paceScore * 0.3 +
        clarityScore * 0.3
      );

      // ----------------------------------
      // 8️⃣ Cleanup
      // ----------------------------------
      safeDeleteFile(videoPath);
      safeDeleteFile(audioPath);

      return res.json({
        success: true,
        analysis: {
          transcript,
          words_per_minute: wordsPerMinute,
          filler_count: fillerWords,
          confidence_score: confidenceScore,
          pace_score: paceScore,
          clarity_score: clarityScore,
          final_score: finalScore,
        },
      });

    } catch (err) {
      console.error(err);
      const videoPath = req.file?.path;
      const audioPath = videoPath ? `${videoPath}.wav` : "";
      safeDeleteFile(audioPath);
      safeDeleteFile(videoPath);

      return res.json({
        success: true,
        analysis: buildFallbackAnalysis("Media conversion or transcription failed."),
      });
    }
  }
);

// -----------------------------
// START SERVER
// -----------------------------
const PORT = process.env.PORT || 5000;

function startHttpServer(port) {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  server.on("error", (error) => {
    if (error?.code === "EADDRINUSE") {
      console.error(
        `Port ${port} is already in use. Stop the old server process or change PORT in server/.env.`
      );
      process.exit(1);
      return;
    }

    console.error("HTTP server error:", error);
    process.exit(1);
  });
}

async function startServer() {
  try {
    if (!String(process.env.JWT_SECRET || "").trim()) {
      console.error("Server startup aborted: JWT_SECRET is missing in server/.env");
      process.exit(1);
      return;
    }
    try {
      await connectMongo();
    } catch (error) {
      console.error("Mongo unavailable. Server is starting with local auth fallback.");
    }
    startHttpServer(PORT);
  } catch (error) {
    console.error("Server startup failed.");
    process.exit(1);
  }
}

void startServer();
