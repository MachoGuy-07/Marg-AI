import mongoose from "mongoose";

const testResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
  },
  { timestamps: true }
);

const TestResult = mongoose.model("TestResult", testResultSchema);

export default TestResult;
