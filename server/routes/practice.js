// server/routes/practice.js

import express from "express";
import questions from "../data/questions.js";

const router = express.Router();

// Get questions by language
router.get("/:language", (req, res) => {
  const { language } = req.params;

  const data = questions[language];

  if (!data) {
    return res.status(404).json({ error: "Language not found" });
  }

  res.json(data);
});

export default router;