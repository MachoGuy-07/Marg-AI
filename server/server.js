// -----------------------------
// IMPORTS
// -----------------------------
import cors from "cors";
import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { exec } from "child_process";
import fs from "fs";
import OpenAI from "openai";

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



// -----------------------------
// OPENAI SETUP
// -----------------------------
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      const audioPath = videoPath + ".wav";

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
      // 3️⃣ Duration (temporary estimate)
      // ----------------------------------
      const durationSeconds = 45;
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
      // 6️⃣ Engagement Scoring
      // ----------------------------------
      const engagementKeywords = [
        "excited",
        "learned",
        "improved",
        "team",
        "growth",
        "impact",
        "initiative",
        "challenge",
        "passion",
        "curious",
        "collaborated",
        "mentored",
        "helped",
        "contributed",
      ];

      let engagementMatches = 0;
      engagementKeywords.forEach((word) => {
        if (transcript.toLowerCase().includes(word)) {
          engagementMatches++;
        }
      });

      let engagementScore = 4 + Math.min(6, engagementMatches);
      engagementScore = Math.max(1, Math.min(10, engagementScore));

      // ----------------------------------
      // 7️⃣ Final Score
      // ----------------------------------
      const finalScore = Math.round(
        confidenceScore * 0.4 +
        paceScore * 0.3 +
        engagementScore * 0.3
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
          engagement_score: engagementScore,
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