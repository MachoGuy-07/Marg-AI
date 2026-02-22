import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/practice.css";
import {
  FaCode,
  FaProjectDiagram,
  FaBrain,
  FaLink,
  FaLayerGroup,
  FaNetworkWired,
  FaList,
  FaRandom,
  FaCubes,
  FaStream,
  FaDatabase,
  FaSitemap,
  FaThLarge,
  FaBoxOpen
} from "react-icons/fa";

const topics = [
  { name: "Backtracking", icon: <FaProjectDiagram /> },
  { name: "Binary Tree", icon: <FaSitemap /> },
  { name: "Dynamic Programming", icon: <FaBrain /> },
  { name: "Greedy", icon: <FaRandom /> },
  { name: "Graph", icon: <FaNetworkWired /> },
  { name: "Heap", icon: <FaLayerGroup /> },
  { name: "Hashing", icon: <FaDatabase /> },
  { name: "Linked Lists", icon: <FaLink /> },
  { name: "Matrix", icon: <FaThLarge /> },
  { name: "Sliding Window", icon: <FaStream /> },
  { name: "Two Pointers", icon: <FaCode /> },
  { name: "Stack", icon: <FaCubes /> },
  { name: "Trie", icon: <FaBoxOpen /> },
  { name: "Misc", icon: <FaList /> }
];

const difficulties = ["Easy", "Medium", "Hard"];



export default function Practice() {
  const [mode, setMode] = useState("topic");
  const [language, setLanguage] = useState("Python");
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="practice-page">
      <div className="practice-container-box">

        {/* ================= HEADER ================= */}
        <div className="practice-header">
          <h2>Practice Coding</h2>

          <div className="header-right">

            {/* Language Dropdown */}
            <div className="custom-dropdown">
  <div
    className="dropdown-selected"
    onClick={() => setShowDropdown(!showDropdown)}
  >
    {language} ▾
  </div>

  {showDropdown && (
    <div className="dropdown-menu">
      {["Python", "Java", "C++","C"].map((lang) => (
        <div
          key={lang}
          className="dropdown-item"
          onClick={() => {
            setLanguage(lang);
            setShowDropdown(false);
          }}
        >
          {lang}
        </div>
      ))}
    </div>
  )}
</div>

            {/* Toggle Switch */}
            <div className="toggle-wrapper">
              <span className={mode === "topic" ? "active" : ""}>
                Topic Wise
              </span>

              <div
                className={`toggle-switch ${
                  mode === "difficulty" ? "right" : ""
                }`}
                onClick={() =>
                  setMode(mode === "topic" ? "difficulty" : "topic")
                }
              >
                <div className="toggle-circle"></div>
              </div>

              <span className={mode === "difficulty" ? "active" : ""}>
                Difficulty
              </span>
            </div>

          </div>
        </div>

        {/* ================= GRID ================= */}
        <div className="practice-grid">
  {mode === "topic"
    ? topics.map((item, idx) => (
        <div
  key={idx}
  className="practice-card"
  onClick={() =>
  navigate(
    `/practice/${item.name
      .toLowerCase()
      .replace(/\s+/g, "-")}`
  )
}
>
          <div className="card-icon">{item.icon}</div>
          <div>{item.name}</div>
        </div>
      ))
            : difficulties.map((lvl, idx) => (
                <div
  key={idx}
  className="practice-card difficulty"
  onClick={() => navigate(`/practice/${lvl}`)}
>
                  {lvl}
                </div>
              ))}
        </div>

      </div>
    </div>
  );
}