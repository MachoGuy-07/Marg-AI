import express from "express";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import codingQuestions, {
  getLanguageReference,
  getLanguageStarter,
  normalizeLanguage,
  questionSupportsLanguage
} from "../data/codingQuestions.js";
import {
  getCatalogQuestionsByDifficulty,
  getCatalogQuestionsByTopic,
  getLanguageTopicCatalog,
  isCatalogQuestionId
} from "../data/topicCatalog.js";

const router = express.Router();

const SUPPORTED_LANGUAGES = new Set(["python", "java", "cpp", "c"]);

const DEFAULT_TIMEOUT_MS = 4000;
const MAX_CUSTOM_INPUT_SIZE = 15000;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hashText(text) {
  const source = String(text || "");
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seedText) {
  let state = hashText(seedText);
  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function buildLanguageProfile(language) {
  const normalized = normalizeLanguage(language);
  const executableName = process.platform === "win32" ? "main.exe" : "main";

  if (normalized === "python") {
    return {
      fileName: "Main.py",
      compile: null,
      run: (workspace) => ({
        command: "python",
        args: [path.join(workspace, "Main.py")]
      })
    };
  }

  if (normalized === "c") {
    return {
      fileName: "Main.c",
      compile: (workspace) => ({
        command: "gcc",
        args: ["Main.c", "-std=c11", "-O2", "-o", executableName],
        cwd: workspace
      }),
      run: (workspace) => ({
        command: path.join(workspace, executableName),
        args: []
      })
    };
  }

  if (normalized === "cpp") {
    return {
      fileName: "Main.cpp",
      compile: (workspace) => ({
        command: "g++",
        args: ["Main.cpp", "-std=c++17", "-O2", "-o", executableName],
        cwd: workspace
      }),
      run: (workspace) => ({
        command: path.join(workspace, executableName),
        args: []
      })
    };
  }

  if (normalized === "java") {
    return {
      fileName: "Main.java",
      compile: (workspace) => ({
        command: "javac",
        args: ["Main.java"],
        cwd: workspace
      }),
      run: (workspace) => ({
        command: "java",
        args: ["Main"],
        cwd: workspace
      })
    };
  }

  return null;
}

function spawnCommand(command, args, options = {}) {
  const { cwd, input = "", timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        ok: false,
        stdout,
        stderr,
        exitCode: null,
        timedOut,
        errorCode: error?.code || "",
        errorMessage: error?.message || "Command failed"
      });
    });

    child.on("close", (exitCode) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        ok: exitCode === 0 && !timedOut,
        stdout,
        stderr,
        exitCode,
        timedOut,
        errorCode: "",
        errorMessage: ""
      });
    });

    if (input) {
      child.stdin.write(input);
    }
    child.stdin.end();
  });
}

function normalizeTextOutput(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .trim();
}

function parseIntegersFromText(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
}

function validateTwoSumOutput(testCase, actualOutput) {
  const allNumbers = parseIntegersFromText(testCase?.input || "");
  if (allNumbers.length < 2) return false;

  const n = allNumbers[0];
  const nums = allNumbers.slice(1, 1 + n);
  const target = allNumbers[1 + n];

  const outputNumbers = parseIntegersFromText(actualOutput);
  if (outputNumbers.length < 2) return false;

  const i = outputNumbers[0];
  const j = outputNumbers[1];

  const hasValidPair = (() => {
    for (let left = 0; left < nums.length; left += 1) {
      for (let right = left + 1; right < nums.length; right += 1) {
        if (nums[left] + nums[right] === target) return true;
      }
    }
    return false;
  })();

  if (!hasValidPair) {
    return i === -1 && j === -1;
  }

  if (i < 0 || j < 0 || i >= nums.length || j >= nums.length || i === j) {
    return false;
  }

  return nums[i] + nums[j] === target;
}

function outputsMatch(question, testCase, actual, expected) {
  const cleanActual = normalizeTextOutput(actual);
  const cleanExpected = normalizeTextOutput(expected);

  if (String(question?.id || "").includes("two-sum-indices")) {
    return validateTwoSumOutput(testCase, cleanActual);
  }

  if (cleanActual === cleanExpected) return true;

  const actualTokens = cleanActual.split(/\s+/).filter(Boolean);
  const expectedTokens = cleanExpected.split(/\s+/).filter(Boolean);

  if (actualTokens.length !== expectedTokens.length) return false;
  return actualTokens.every((token, index) => token === expectedTokens[index]);
}

function findQuestionById(questionId, language = "") {
  const normalizedLanguage = normalizeLanguage(language);
  const standardQuestion =
    codingQuestions.find(
      (question) =>
        question.id === questionId &&
        (!normalizedLanguage || questionSupportsLanguage(question, normalizedLanguage))
    ) || null;

  if (standardQuestion) return standardQuestion;
  if (!isCatalogQuestionId(questionId) || !normalizedLanguage) return null;

  const prefix = `catalog-${normalizedLanguage}-`;
  if (!String(questionId).startsWith(prefix)) return null;

  const suffix = String(questionId).slice(prefix.length);
  const lastDashIndex = suffix.lastIndexOf("-");
  if (lastDashIndex <= 0) return null;

  const slug = suffix.slice(0, lastDashIndex);
  const generatedQuestions = getCatalogQuestionsByTopic(normalizedLanguage, slug, "topic");
  return generatedQuestions.find((question) => question.id === questionId) || null;
}

function filterQuestions({ topic, difficulty, language }) {
  const normalizedTopic = String(topic || "").trim().toLowerCase();
  const normalizedDifficulty = String(difficulty || "").trim().toLowerCase();
  const normalizedLanguage = normalizeLanguage(language);

  return codingQuestions.filter((question) => {
    if (!questionSupportsLanguage(question, normalizedLanguage)) {
      return false;
    }

    const slug = String(question.slug || "").toLowerCase();
    const readableTopic = String(question.topic || "").toLowerCase();
    const questionDifficulty = String(question.difficulty || "").toLowerCase();

    const topicMatch =
      !normalizedTopic ||
      slug === normalizedTopic ||
      readableTopic === normalizedTopic.replace(/-/g, " ");

    const difficultyMatch =
      !normalizedDifficulty || questionDifficulty === normalizedDifficulty;

    return topicMatch && difficultyMatch;
  });
}

function toQuestionPayload(question, language, starterMode = "topic") {
  const starterCode =
    typeof question?.starterCode === "string"
      ? question.starterCode
      : getLanguageStarter(question, language, starterMode);

  return {
    id: question.id,
    slug: question.slug,
    topic: question.topic,
    topicCue: question.topicCue || "",
    difficulty: question.difficulty,
    title: question.title,
    description: question.description,
    inputFormat: question.inputFormat,
    outputFormat: question.outputFormat,
    constraints: question.constraints,
    starterCode,
    testCases: Array.isArray(question.testCases) ? question.testCases : [],
    evaluationAvailable: question.evaluationAvailable !== false
  };
}

function getTopicsForLanguage(language) {
  const normalized = normalizeLanguage(language);
  const map = new Map();

  for (const question of codingQuestions) {
    if (!questionSupportsLanguage(question, normalized)) continue;
    const key = `${question.slug}`;
    if (!map.has(key)) {
      map.set(key, {
        slug: question.slug,
        name: question.topic,
        cue: question.topicCue || "Focused interview practice set",
        questionCount: 0
      });
    }
    map.get(key).questionCount += 1;
  }

  return [...map.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function classifyError(errorMessage = "") {
  const message = String(errorMessage).toLowerCase();

  if (!message) return "unknown";
  if (message.includes("timed out")) return "timeout";
  if (message.includes("syntaxerror") || message.includes("expected") || message.includes("parse error")) return "syntax";
  if (message.includes("nameerror") || message.includes("undefined")) return "undefined";
  if (message.includes("index out of range") || message.includes("segmentation fault") || message.includes("outofbounds")) return "bounds";
  if (
    message.includes("no such file or directory") ||
    message.includes("not recognized as an internal") ||
    message.includes("compiler not found") ||
    message.includes("runtime command not found")
  ) return "tooling";
  if (message.includes("exception")) return "runtime";
  if (message.includes("compilation") || message.includes("error:")) return "compile";
  return "runtime";
}

function extractImportantErrorLines(errorMessage = "") {
  const lines = String(errorMessage)
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const important = lines.filter((line) =>
    /error|exception|traceback|line|undefined|syntax|failed|warning/i.test(line)
  );

  return (important.length ? important : lines).slice(0, 8);
}

function explainCodeLine(line) {
  const clean = line.trim();
  if (!clean) return "Spacing line used to separate logic blocks.";
  if (/^#include/.test(clean) || /^import /.test(clean)) return "Imports dependencies required for this solution.";
  if (/main\s*\(/i.test(clean)) return "Defines the program entry point that reads input and prints output.";
  if (/^\s*(def|static|int|void|pair<|public static)/.test(clean) && clean.includes("(") && clean.includes(")")) {
    return "Defines a function used in the solution flow.";
  }
  if (/for\s*\(|^for\s/.test(clean) || /while\s*\(/.test(clean)) return "Iterates through elements while maintaining state.";
  if (/if\s*\(|^if\s/.test(clean) || /^else\b/.test(clean)) return "Applies a decision branch for the current condition.";
  if (/return\b/.test(clean)) return "Returns the computed result to the caller.";
  if (/print|cout|printf|System\.out/.test(clean)) return "Outputs the final answer in the required format.";
  if (/map|dict|unordered_map|HashMap|seen/.test(clean)) return "Stores quick lookups to reduce repeated work.";
  if (/max|min/.test(clean)) return "Updates best-so-far state for optimization.";
  return "Executes a core step of the algorithm.";
}

function buildLineByLine(referenceCode) {
  return String(referenceCode || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line, index) => ({
      lineNumber: index + 1,
      code: line,
      explanation: explainCodeLine(line)
    }))
    .filter((entry) => entry.code.trim().length > 0)
    .slice(0, 120);
}

function scoreCodeQuality(code = "") {
  const text = String(code);
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim());

  const nonEmptyLines = lines.filter(Boolean);
  const hasLoop = /\bfor\b|\bwhile\b/.test(text);
  const hasCondition = /\bif\b|\belse\b/.test(text);
  const hasReturn = /\breturn\b/.test(text);
  const hasTodo = /\bTODO\b|\bpass\b/.test(text);
  const hasFunction = /\bdef\b|\bint\b|\bvoid\b|\bstatic\b/.test(text);

  let score = 35;
  if (nonEmptyLines.length >= 8) score += 14;
  if (nonEmptyLines.length >= 14) score += 8;
  if (hasLoop) score += 12;
  if (hasCondition) score += 10;
  if (hasReturn) score += 12;
  if (hasFunction) score += 8;
  if (!hasTodo) score += 14;
  return clamp(Math.round(score), 0, 100);
}

function percentileHigherBetter(values, userValue) {
  if (!values.length) return 0;
  const belowOrEqual = values.filter((value) => value <= userValue).length;
  return clamp(Math.round((belowOrEqual / values.length) * 100), 0, 100);
}

function percentileLowerBetter(values, userValue) {
  if (!values.length) return 0;
  const slowerOrEqual = values.filter((value) => value >= userValue).length;
  return clamp(Math.round((slowerOrEqual / values.length) * 100), 0, 100);
}

function buildSampleUsers(seedText, count = 30) {
  const rand = seededRandom(seedText);
  return Array.from({ length: count }).map((_, index) => {
    const logicScore = clamp(Math.round(45 + rand() * 52), 18, 99);
    const timeTakenSeconds = clamp(Math.round(75 + rand() * 900), 35, 1800);
    return {
      id: `S${index + 1}`,
      logicScore,
      timeTakenSeconds
    };
  });
}

function buildDistribution(samples, userLogicScore) {
  const buckets = [
    { min: 0, max: 20 },
    { min: 21, max: 40 },
    { min: 41, max: 60 },
    { min: 61, max: 80 },
    { min: 81, max: 100 }
  ];

  return buckets.map((bucket) => {
    const count = samples.filter(
      (sample) => sample.logicScore >= bucket.min && sample.logicScore <= bucket.max
    ).length;
    const inBucket = userLogicScore >= bucket.min && userLogicScore <= bucket.max;
    return {
      range: `${bucket.min}-${bucket.max}`,
      users: count,
      you: inBucket ? 1 : 0
    };
  });
}

function buildStaticFeedback({ language, question, code, errorMessage, runResults = [] }) {
  const referenceCode = getLanguageReference(question, language);
  const shortcuts = question?.shortcuts?.[normalizeLanguage(language)] || [];
  const errorType = classifyError(errorMessage);
  const focusResult = runResults.find((result) => !result.passed);

  let summary = "Your code failed due to a runtime issue.";
  let probableCause = "The implementation does not fully match the expected control flow.";
  let fixSteps = [
    "Confirm function flow for all edge cases.",
    "Print intermediate values for the failing testcase.",
    "Compare your result with expected output and adjust transitions."
  ];

  if (errorType === "syntax") {
    summary = "Compilation/parsing failed because of syntax issues.";
    probableCause = "A bracket, colon, semicolon, or declaration is malformed.";
    fixSteps = [
      "Fix the first syntax error reported by the compiler/interpreter.",
      "Re-run after each fix to reveal the next blocking issue.",
      "Avoid editing multiple unrelated lines at once."
    ];
  } else if (errorType === "undefined") {
    summary = "Execution failed because a symbol is missing or undefined.";
    probableCause = "A variable/function name is referenced before declaration or with wrong spelling.";
    fixSteps = [
      "Check spelling and scope for all variables and helper functions.",
      "Initialize all variables before reading them.",
      "Verify method names and return values."
    ];
  } else if (errorType === "bounds") {
    summary = "Execution failed due to invalid index or memory access.";
    probableCause = "Loop bounds or pointer/index checks are incomplete.";
    fixSteps = [
      "Add index bounds checks before array/string access.",
      "Verify loop start/end conditions for empty and single-item inputs.",
      "Test with minimum-size inputs."
    ];
  } else if (errorType === "timeout") {
    summary = "Execution timed out.";
    probableCause = "The current algorithm is too slow for larger testcases.";
    fixSteps = [
      "Reduce nested loops where possible.",
      "Use hash maps / DP / sliding window based on the question pattern.",
      "Re-check termination conditions to avoid infinite loops."
    ];
  } else if (errorType === "tooling") {
    summary = "Execution environment is missing a required compiler/runtime.";
    probableCause = "The language toolchain is not installed or not available in PATH.";
    fixSteps = [
      "Install the required compiler/runtime for the selected language.",
      "Verify command access from terminal (python, gcc, g++, javac, java).",
      "Restart the server after environment updates."
    ];
  } else if (focusResult && !focusResult.passed) {
    summary = `Logic mismatch on testcase ${focusResult.id}.`;
    probableCause = "The algorithm returns incorrect output for at least one scenario.";
    fixSteps = [
      `Reproduce testcase ${focusResult.id} locally and trace variable transitions.`,
      "Validate base case handling and update rules.",
      "Cross-check with a brute-force result on small inputs."
    ];
  }

  return {
    summary,
    probableCause,
    fixSteps,
    highlightedErrors: extractImportantErrorLines(errorMessage),
    correctedCode: referenceCode,
    lineByLineLogic: buildLineByLine(referenceCode),
    shortcuts
  };
}

async function prepareWorkspace(language, code) {
  const profile = buildLanguageProfile(language);
  if (!profile) {
    return {
      ok: false,
      errorType: "config",
      errorMessage: "Unsupported language selected"
    };
  }

  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "marg-code-"));
  const filePath = path.join(workspace, profile.fileName);

  await fs.writeFile(filePath, code, "utf8");

  if (typeof profile.compile === "function") {
    const compileConfig = profile.compile(workspace);
    const compileResult = await spawnCommand(compileConfig.command, compileConfig.args, {
      cwd: compileConfig.cwd || workspace,
      timeoutMs: DEFAULT_TIMEOUT_MS
    });

    if (!compileResult.ok) {
      return {
        ok: false,
        workspace,
        errorType: "compile",
        errorMessage:
          compileResult.errorCode === "ENOENT"
            ? `Compiler not found: ${compileConfig.command}`
            : (compileResult.stderr || compileResult.errorMessage || "Compilation failed").trim()
      };
    }
  }

  return {
    ok: true,
    workspace,
    runConfig: profile.run(workspace)
  };
}

async function runProgram(runConfig, input, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const result = await spawnCommand(runConfig.command, runConfig.args, {
    cwd: runConfig.cwd,
    input,
    timeoutMs
  });

  if (!result.ok) {
    const missingRuntime = result.errorCode === "ENOENT";
    if (missingRuntime) {
      return {
        ok: false,
        errorMessage: `Runtime command not found: ${runConfig.command}`
      };
    }

    if (result.timedOut) {
      return {
        ok: false,
        errorMessage: "Execution timed out after 4 seconds"
      };
    }

    return {
      ok: false,
      errorMessage: (result.stderr || result.errorMessage || "Runtime error").trim()
    };
  }

  return {
    ok: true,
    output: result.stdout
  };
}

async function cleanupWorkspace(workspace) {
  if (!workspace) return;
  try {
    await fs.rm(workspace, { recursive: true, force: true });
  } catch {
    // Ignore cleanup failures.
  }
}

async function evaluateQuestion({ question, language, code, includeHidden = false, customInput = "" }) {
  const testCases = includeHidden
    ? [...(question.testCases || []), ...(question.hiddenTestCases || [])]
    : [...(question.testCases || [])];

  const prepared = await prepareWorkspace(language, code);
  if (!prepared.ok) {
    return {
      success: false,
      results: [],
      customRun: null,
      errorType: prepared.errorType,
      errorMessage: prepared.errorMessage
    };
  }

  const { workspace, runConfig } = prepared;

  try {
    const results = [];

    for (const testCase of testCases) {
      const run = await runProgram(runConfig, testCase.input);
      if (!run.ok) {
        return {
          success: false,
          results,
          customRun: null,
          errorType: "runtime",
          errorMessage: run.errorMessage
        };
      }

      const actualOutput = normalizeTextOutput(run.output);
      const expectedOutput = normalizeTextOutput(testCase.expectedOutput);
      const passed = outputsMatch(question, testCase, actualOutput, expectedOutput);

      results.push({
        id: testCase.id,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        output: run.output.trim(),
        passed
      });
    }

    let customRun = null;

    if (String(customInput || "").trim()) {
      const sanitizedCustomInput = String(customInput).slice(0, MAX_CUSTOM_INPUT_SIZE);
      const run = await runProgram(runConfig, sanitizedCustomInput, 2500);
      if (!run.ok) {
        customRun = {
          success: false,
          error: run.errorMessage,
          output: ""
        };
      } else {
        customRun = {
          success: true,
          error: "",
          output: run.output.trim()
        };
      }
    }

    return {
      success: true,
      results,
      customRun,
      errorType: "",
      errorMessage: ""
    };
  } finally {
    await cleanupWorkspace(workspace);
  }
}

function buildSubmissionReport({
  question,
  language,
  code,
  evaluation,
  timeTakenSeconds
}) {
  const totalCases = evaluation.results.length;
  const passedCases = evaluation.results.filter((result) => result.passed).length;
  const accuracyScore = totalCases ? Math.round((passedCases / totalCases) * 100) : 0;
  const qualityScore = scoreCodeQuality(code);
  const logicScore = clamp(Math.round(accuracyScore * 0.75 + qualityScore * 0.25), 0, 100);
  const safeTime = clamp(Math.round(Number(timeTakenSeconds) || 0), 1, 7200);

  const sampleUsers = buildSampleUsers(`${question.id}:${language}`, 34);
  const avgLogic = Math.round(sampleUsers.reduce((sum, user) => sum + user.logicScore, 0) / sampleUsers.length);
  const avgTime = Math.round(sampleUsers.reduce((sum, user) => sum + user.timeTakenSeconds, 0) / sampleUsers.length);

  const logicPercentile = percentileHigherBetter(
    sampleUsers.map((user) => user.logicScore),
    logicScore
  );
  const speedPercentile = percentileLowerBetter(
    sampleUsers.map((user) => user.timeTakenSeconds),
    safeTime
  );
  const overallPercentile = clamp(
    Math.round(logicPercentile * 0.7 + speedPercentile * 0.3),
    0,
    100
  );

  const rankingSeries = [...sampleUsers, {
    id: "You",
    logicScore,
    timeTakenSeconds: safeTime,
    isCurrentUser: true
  }].sort((left, right) => right.logicScore - left.logicScore);

  const percentileGraph = buildDistribution(sampleUsers, logicScore);

  return {
    question: {
      id: question.id,
      title: question.title,
      slug: question.slug,
      topic: question.topic,
      difficulty: question.difficulty
    },
    language,
    submission: {
      timeTakenSeconds: safeTime,
      accuracyScore,
      qualityScore,
      logicScore,
      passedCases,
      totalCases
    },
    comparison: {
      averageLogicScore: avgLogic,
      averageTimeSeconds: avgTime,
      logicPercentile,
      speedPercentile,
      overallPercentile,
      rankingSeries,
      percentileGraph
    },
    testcaseResults: evaluation.results
  };
}

router.get("/topics", (req, res) => {
  const language = normalizeLanguage(req.query.language || "python");

  if (!SUPPORTED_LANGUAGES.has(language)) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  const catalogTopics = getLanguageTopicCatalog(language);
  const topics = catalogTopics.length ? catalogTopics : getTopicsForLanguage(language);
  return res.json({
    language,
    totalTopics: topics.length,
    topics
  });
});

router.get("/questions", (req, res) => {
  const language = normalizeLanguage(req.query.language || "python");
  const topic = req.query.topic || "";
  const difficulty = req.query.difficulty || "";
  const starterMode = String(req.query.starterMode || "topic").toLowerCase();

  if (!SUPPORTED_LANGUAGES.has(language)) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  const normalizedStarterMode = starterMode === "difficulty" ? "difficulty" : "topic";
  const normalizedTopic = String(topic || "").trim().toLowerCase();
  const normalizedDifficulty = String(difficulty || "").trim().toLowerCase();

  let selectedQuestions = [];
  if (normalizedTopic) {
    const standardTopicQuestions = filterQuestions({ topic: normalizedTopic, language });
    selectedQuestions = standardTopicQuestions.length
      ? standardTopicQuestions
      : getCatalogQuestionsByTopic(language, normalizedTopic, normalizedStarterMode);
  } else if (normalizedDifficulty) {
    const standardDifficultyQuestions = filterQuestions({
      difficulty: normalizedDifficulty,
      language
    });
    const catalogDifficultyQuestions = getCatalogQuestionsByDifficulty(
      language,
      normalizedDifficulty,
      normalizedStarterMode
    );
    selectedQuestions = [...standardDifficultyQuestions, ...catalogDifficultyQuestions];
  } else {
    selectedQuestions = filterQuestions({ language });
  }

  return res.json({
    language,
    total: selectedQuestions.length,
    questions: selectedQuestions.map((question) =>
      toQuestionPayload(
        question,
        language,
        normalizedStarterMode
      )
    )
  });
});

router.post("/run", async (req, res) => {
  const language = normalizeLanguage(req.body?.language || "python");
  const questionId = String(req.body?.questionId || "");
  const code = String(req.body?.code || "");
  const customInput = String(req.body?.customInput || "");

  if (!questionId || !code.trim()) {
    return res.status(400).json({ error: "questionId and code are required" });
  }

  if (!SUPPORTED_LANGUAGES.has(language)) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  const question = findQuestionById(questionId, language);
  if (!question) {
    return res.status(404).json({ error: "Question not found" });
  }

  const evaluation = await evaluateQuestion({
    question,
    language,
    code,
    customInput,
    includeHidden: false
  });

  if (!evaluation.success) {
    const aiFeedback = buildStaticFeedback({
      language,
      question,
      code,
      errorMessage: evaluation.errorMessage,
      runResults: evaluation.results
    });

    return res.json({
      success: false,
      results: evaluation.results,
      customRun: evaluation.customRun,
      errorType: evaluation.errorType,
      errorMessage: evaluation.errorMessage,
      aiFeedback
    });
  }

  const passedCases = evaluation.results.filter((result) => result.passed).length;
  const totalCases = evaluation.results.length;
  const score = totalCases ? Math.round((passedCases / totalCases) * 100) : 0;

  const aiFeedback = passedCases === totalCases
    ? null
    : buildStaticFeedback({
      language,
      question,
      code,
      errorMessage: `Logic mismatch on ${totalCases - passedCases} testcase(s).`,
      runResults: evaluation.results
    });

  return res.json({
    success: passedCases === totalCases,
    results: evaluation.results,
    customRun: evaluation.customRun,
    score,
    aiFeedback
  });
});

router.post("/submit", async (req, res) => {
  const language = normalizeLanguage(req.body?.language || "python");
  const questionId = String(req.body?.questionId || "");
  const code = String(req.body?.code || "");
  const timeTakenSeconds = Number(req.body?.timeTakenSeconds) || 0;

  if (!questionId || !code.trim()) {
    return res.status(400).json({ error: "questionId and code are required" });
  }

  if (!SUPPORTED_LANGUAGES.has(language)) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  const question = findQuestionById(questionId, language);
  if (!question) {
    return res.status(404).json({ error: "Question not found" });
  }

  const evaluation = await evaluateQuestion({
    question,
    language,
    code,
    includeHidden: true
  });

  const submissionReport = buildSubmissionReport({
    question,
    language,
    code,
    evaluation: evaluation.success ? evaluation : { results: evaluation.results || [] },
    timeTakenSeconds
  });

  const aiFeedback = !evaluation.success || submissionReport.submission.passedCases !== submissionReport.submission.totalCases
    ? buildStaticFeedback({
      language,
      question,
      code,
      errorMessage: evaluation.errorMessage || "One or more testcases failed.",
      runResults: submissionReport.testcaseResults
    })
    : null;

  return res.json({
    success:
      evaluation.success &&
      submissionReport.submission.passedCases === submissionReport.submission.totalCases,
    report: submissionReport,
    errorType: evaluation.errorType || "",
    errorMessage: evaluation.errorMessage || "",
    aiFeedback
  });
});

router.post("/feedback", (req, res) => {
  const language = normalizeLanguage(req.body?.language || "python");
  const questionId = String(req.body?.questionId || "");
  const code = String(req.body?.code || "");
  const errorMessage = String(req.body?.errorMessage || "");
  const runResults = Array.isArray(req.body?.runResults) ? req.body.runResults : [];

  if (!SUPPORTED_LANGUAGES.has(language)) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  const question = findQuestionById(questionId, language);
  if (!question) {
    return res.status(404).json({ error: "Question not found" });
  }

  const aiFeedback = buildStaticFeedback({
    language,
    question,
    code,
    errorMessage,
    runResults
  });

  return res.json({ success: true, aiFeedback });
});

export default router;
