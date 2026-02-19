import React, { useState } from "react";
import PracticeConsole from "../components/PracticeConsole";

const BACKTRACKING_QUESTIONS = [
  {
    title: "Letter Combinations of a Phone Number",
    difficulty: "Medium",
    description: `
Given a string containing digits from 2-9 inclusive, return all possible letter combinations.

Example:
Input: digits = "23"
Output: ["ad","ae","af","bd","be","bf","cd","ce","cf"]

Constraints:
1 <= digits.length <= 4
digits[i] is in ['2','9']
    `,
  },
  {
    title: "Generate Parentheses",
    difficulty: "Medium",
    description: `
Given n pairs of parentheses, generate all combinations of well-formed parentheses.

Example:
Input: n = 3
Output: ["((()))","(()())","(())()","()(())","()()()"]

Constraints:
1 <= n <= 8
    `,
  },
  {
    title: "Combination Sum",
    difficulty: "Medium",
    description: `
Given an array of distinct integers and a target, return all unique combinations that sum to target.

Example:
Input: candidates = [2,3,6,7], target = 7
Output: [[2,2,3],[7]]
    `,
  },
  {
    title: "Permutations",
    difficulty: "Medium",
    description: `
Given an array of distinct integers, return all possible permutations.

Example:
Input: nums = [1,2,3]
Output:
[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
    `,
  },
  {
    title: "N-Queens",
    difficulty: "Hard",
    description: `
Place n queens on an n x n board such that no two queens attack each other.

Return all distinct solutions.

'Q' = queen
'.' = empty space

Example:
Input: n = 4
Output:
[
 [".Q..","...Q","Q...","..Q."],
 ["..Q.","Q...","...Q",".Q.."]
]
    `,
    image: "/nqueens.png",
  },
  {
    title: "Subsets",
    difficulty: "Medium",
    description: `
Given an integer array of unique elements, return all possible subsets (power set).

Example:
Input: nums = [1,2,3]
Output:
[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]
    `,
  },
  {
    title: "Palindrome Partitioning",
    difficulty: "Medium",
    description: `
Given a string s, partition s such that every substring is a palindrome.

Example:
Input: s = "aab"
Output: [["a","a","b"],["aa","b"]]
    `,
  },
];

export default function TopicPractice() {
  const questions = BACKTRACKING_QUESTIONS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState(
    Array(questions.length).fill("unattempted")
  );
  const [showTick, setShowTick] = useState(false);

  // ---------------- PROGRESS ----------------
  const completedCount = status.filter(
    (s) => s === "correct" || s === "wrong"
  ).length;

  const percent = Math.round(
    (completedCount / questions.length) * 100
  );

  // ---------------- SUBMIT ----------------
  function handleSubmit() {
    const updated = [...status];

    // Simulated correctness (replace later with real check)
    const isCorrect = Math.random() > 0.5;

    updated[currentIndex] = isCorrect ? "correct" : "wrong";
    setStatus(updated);

    if (isCorrect) {
      setShowTick(true);
      setTimeout(() => setShowTick(false), 1200);
    }
  }

  function handleNext() {
    const updated = [...status];

    if (updated[currentIndex] === "unattempted") {
      updated[currentIndex] = "skipped";
      setStatus(updated);
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function goToQuestion(index) {
    setCurrentIndex(index);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#f8fafc",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* ---------------- PROGRESS HEADER ---------------- */}
      <div
        style={{
          padding: "30px 40px",
          background: "linear-gradient(135deg,#4f46e5,#6366f1)",
          color: "#ffffff",
        }}
      >
        <h2 style={{ marginBottom: 10 }}>
          Programming for Problem Solving
        </h2>

        <p style={{ fontSize: 14 }}>
          Your Progress: <strong>{percent}% Completed</strong>
        </p>

        <div
          style={{
            marginTop: 10,
            height: 8,
            background: "rgba(255,255,255,0.3)",
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${percent}%`,
              height: "100%",
              background: "#22c55e",
              transition: "0.5s ease",
            }}
          />
        </div>

        {percent === 100 && (
          <div
            style={{
              marginTop: 15,
              background: "#22c55e",
              padding: "6px 15px",
              borderRadius: 20,
              display: "inline-block",
              fontWeight: 600,
            }}
          >
            ✅ Completed Topic
          </div>
        )}
      </div>

      {/* ---------------- QUESTION NUMBER BAR ---------------- */}
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: "20px 40px",
          borderBottom: "1px solid #e2e8f0",
          background: "#ffffff",
        }}
      >
        {questions.map((_, i) => {
          const bg =
            status[i] === "correct"
              ? "#22c55e"
              : status[i] === "wrong"
              ? "#ef4444"
              : status[i] === "skipped"
              ? "#8b5cf6"
                : "#cbd5e1";

          return (
            <div
              key={i}
              onClick={() => goToQuestion(i)}
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                background: bg,
                color:
                  status[i] === "unattempted"
                    ? "#1e293b"
                    : "#ffffff",
                cursor: "pointer",
                boxShadow:
                  currentIndex === i
                    ? "0 0 0 3px rgba(99,102,241,0.3)"
                    : "none",
                transition: "0.3s ease",
              }}
            >
              {i + 1}
            </div>
          );
        })}
      </div>

      {/* ---------------- MAIN SPLIT VIEW ---------------- */}
      <div style={{ display: "flex", flex: 1 }}>

        {/* LEFT SIDE — PROBLEM */}
        <div
          style={{
            flex: 1,
            padding: "40px",
            overflowY: "auto",
            background: "#ffffff",
            borderRight: "1px solid #e2e8f0",
          }}
        >
          <h2 style={{ fontWeight: 700 }}>
            {questions[currentIndex].title}
          </h2>

          <span
            style={{
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 12,
              marginTop: 10,
              display: "inline-block",
              background:
                questions[currentIndex].difficulty === "Hard"
                  ? "#fee2e2"
                  : "#e0f2fe",
              color:
                questions[currentIndex].difficulty === "Hard"
                  ? "#dc2626"
                  : "#0369a1",
            }}
          >
            {questions[currentIndex].difficulty}
          </span>

          <pre
            style={{
              marginTop: 25,
              whiteSpace: "pre-wrap",
              lineHeight: 1.6,
              color: "#334155",
              fontSize: 14,
            }}
          >
            {questions[currentIndex].description}
          </pre>

          {questions[currentIndex].image && (
            <img
              src={questions[currentIndex].image}
              alt="visual"
              style={{
                marginTop: 25,
                width: "100%",
                borderRadius: 10,
              }}
            />
          )}
        </div>

        {/* RIGHT SIDE — CODE */}
        <div
          style={{
            flex: 1.2,
            display: "flex",
            flexDirection: "column",
            padding: "30px",
            background: "#f1f5f9",
            position: "relative",
          }}
        >
          <PracticeConsole />

          {showTick && (
            <div
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                fontSize: 50,
                color: "#22c55e",
              }}
            >
              ✔
            </div>
          )}

          <div style={{ marginTop: 20, display: "flex", gap: 15 }}>
            <button
              onClick={handleSubmit}
              style={{
                padding: "10px 20px",
                background: "#6366f1",
                color: "#fff",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
              }}
            >
              Submit
            </button>

            <button
              onClick={handleNext}
              style={{
                padding: "10px 20px",
                background: "#94a3b8",
                color: "#fff",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}