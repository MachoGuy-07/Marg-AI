import React from "react";
import { useNavigate } from "react-router-dom";

const TOPICS = [
  "Backtracking",
  "Binary Tree",
  "Dynamic Programming",
  "Graph",
  "Greedy",
  "Hashing",
  "Heap",
  "Linked Lists",
  "Matrix",
  "Sliding Window",
  "Stack",
  "Two Pointers",
  "Trie",
  "Misc"
];

export default function QuestionBank() {
  const navigate = useNavigate();

  function openTopic(topic) {
    navigate(`/practice/${topic.toLowerCase().replace(/\s+/g, "-")}`);
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
      {TOPICS.map((topic, index) => (
        <div
          key={index}
          onClick={() => openTopic(topic)}
          style={{
            padding: "18px 30px",
            borderRadius: "20px",
            background: "linear-gradient(135deg,#e0e7ff,#f1f5f9)",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "15px",
            boxShadow: "0 10px 30px rgba(99,102,241,0.08)",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow =
              "0 15px 40px rgba(99,102,241,0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0px)";
            e.currentTarget.style.boxShadow =
              "0 10px 30px rgba(99,102,241,0.08)";
          }}
        >
          {topic}
        </div>
      ))}
    </div>
  );
}