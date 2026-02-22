// -----------------------------
// IMPORTS
// -----------------------------
import authRoutes from "./routes/auth.js";
import cors from "cors";
import testResultRoutes from "./routes/testResultRoutes.js";
import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { exec } from "child_process";
import fs from "fs";
import mongoose from "mongoose";
import OpenAI from "openai";

mongoose.connect("mongodb://127.0.0.1:27017/ai-interview")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ Mongo Error:", err));

/// -----------------------------
// CONFIG
// -----------------------------
dotenv.config();

const app = express();

// ✅ Proper CORS (THIS FIXES EVERYTHING)
app.use(cors({
  origin: "http://localhost:3000", // your React port
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));


app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/test-results", testResultRoutes);





// -----------------------------
// OPENAI SETUP
// -----------------------------
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

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
        fs.unlinkSync(videoPath);
        return res.json({
          success: true,
          analysis: {
            transcript: "",
            words_per_minute: 0,
            filler_count: 0,
            confidence_score: 6,
            pace_score: 6,
            clarity_score: 6,
            final_score: 6,
            ai_feedback: [
              "Server-side transcript analysis is disabled because OPENAI_API_KEY is not set.",
              "Live client metrics are still available in real time during the interview."
            ]
          }
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
      fs.unlinkSync(videoPath);
      fs.unlinkSync(audioPath);

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
      return res.status(500).json({ error: "Analysis failed" });
    }
  }
);

// -----------------------------
// START SERVER
// -----------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
