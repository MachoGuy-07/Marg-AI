// server/routes/execute.js

import express from "express";
import vm from "vm";
import questions from "../data/questions.js";

const router = express.Router();

// Deep equality check
function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

router.post("/", async (req, res) => {
  const { language, topic, questionId, code } = req.body;

  if (!language || !topic || !questionId || !code) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const question =
      questions[language]?.[topic]?.find(q => q.id === questionId);

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    const testCases = question.testCases;

    if (!testCases) {
      return res.status(400).json({ error: "No test cases defined" });
    }

    let results = [];

    for (let test of testCases) {
      try {
        const sandbox = {};
        const script = new vm.Script(`
          ${code}
          solution(...${JSON.stringify(test.input)});
        `);

        const context = vm.createContext(sandbox);
        const output = script.runInContext(context, { timeout: 2000 });

        const passed = deepEqual(output, test.expected);

        results.push({
          input: test.input,
          expected: test.expected,
          output,
          passed
        });

      } catch (err) {
        return res.json({
          success: false,
          error: err.message
        });
      }
    }

    const allPassed = results.every(r => r.passed);

    return res.json({
      success: allPassed,
      results
    });

  } catch (err) {
    return res.status(500).json({
      error: "Execution failed",
      details: err.message
    });
  }
});

export default router;