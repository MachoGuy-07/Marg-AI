import mongoose from "mongoose";

const testResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    attemptId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    attemptNumber: {
      type: Number,
      default: 0,
    },
    confidence: {
      type: Number,
      required: true,
    },
    pace: {
      type: Number,
      required: true,
    },
    clarity: {
      type: Number,
      required: true,
    },
    overallPercent: {
      type: Number,
      default: 0,
    },
    answerRelevance: {
      type: Number,
      default: 0,
    },
    aiGrade10: {
      type: Number,
      default: 0,
    },
    confidencePercent: {
      type: Number,
      default: 0,
    },
    pacePercent: {
      type: Number,
      default: 0,
    },
    clarityPercent: {
      type: Number,
      default: 0,
    },
    wordsPerMinute: {
      type: Number,
      default: 0,
    },
    eyeContact: {
      type: Number,
      default: 0,
    },
    postureStability: {
      type: Number,
      default: 0,
    },
    vocabularyRange: {
      type: Number,
      default: 0,
    },
    questionCount: {
      type: Number,
      default: 0,
    },
    interviewDurationSeconds: {
      type: Number,
      default: 0,
    },
    feedbackSummary: {
      type: String,
      default: "",
      trim: true,
    },
    summaryBand: {
      type: String,
      default: "",
      trim: true,
    },
    aiFeedback: {
      type: [String],
      default: [],
    },
    source: {
      type: String,
      default: "manual",
      trim: true,
    },
  },
  { timestamps: true }
);

const TestResult = mongoose.model("TestResult", testResultSchema);

export default TestResult;
