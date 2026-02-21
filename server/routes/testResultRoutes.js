import express from "express";
import TestResult from "../models/TestResult.js";

const router = express.Router();

// Save test result
router.post("/save", async (req, res) => {
  try {
    const { userId, confidence, pace, engagement } = req.body;

    const newResult = new TestResult({
      user: userId,
      confidence,
      pace,
      engagement,
    });

    await newResult.save();

    res.status(201).json({ message: "Test result saved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save test result" });
  }
});

// Get all results of a user
router.get("/:userId", async (req, res) => {
  try {
    const results = await TestResult.find({ user: req.params.userId })
      .sort({ createdAt: 1 });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

export default router;