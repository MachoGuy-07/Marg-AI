import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LanguageSelector from "../components/practice/LanguageSelector";
import TopicsGrid from "../components/practice/TopicsGrid";
import {
  LANGUAGE_OPTIONS,
  getTopicsForLanguage,
  normalizeLanguage
} from "../data/dsaTopics";
import "../styles/practice.css";

const difficulties = [
  { name: "Easy", cue: "Starter loops, maps, and basic correctness checks" },
  { name: "Medium", cue: "Interview-level constraints with tighter logic" },
  { name: "Hard", cue: "Optimization-heavy and edge-case intensive sets" }
];

function buildTopicStats(topics) {
  if (!topics.length) {
    return { totalTopics: 0, minQuestions: 0, maxQuestions: 0 };
  }
  const counts = topics.map((topic) => Number(topic.questionCount) || 0);
  return {
    totalTopics: topics.length,
    minQuestions: Math.min(...counts),
    maxQuestions: Math.max(...counts)
  };
}

export default function Practice() {
  const [mode, setMode] = useState("topic");
  const [language, setLanguage] = useState(() =>
    normalizeLanguage(localStorage.getItem("practice-language"))
  );
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("practice-language", language);
  }, [language]);

  const selectedLanguageLabel = useMemo(
    () => LANGUAGE_OPTIONS.find((item) => item.value === language)?.label || "Python",
    [language]
  );

  const languageTopics = useMemo(() => getTopicsForLanguage(language), [language]);
  const topicStats = useMemo(() => buildTopicStats(languageTopics), [languageTopics]);

  const openPracticeSet = (selection, isDifficulty = false) => {
    const routeKey = isDifficulty ? `difficulty-${selection.toLowerCase()}` : selection;
    navigate(`/practice/${language}/${routeKey}`, {
      state: {
        language,
        mode,
        selection
      }
    });
  };

  return (
    <div className="practice-page">
      <div className="practice-container-box">
        <div className="practice-glow" aria-hidden="true" />

        <div className="practice-header">
          <div className="practice-header-copy">
            <span className="practice-kicker">Practice Arena</span>
            <h2>Sharpen Logic Across Languages</h2>
            <p className="practice-subtitle">
              Each language has 15 core DSA topic tracks with interview-focused drills.
            </p>
            <div className="practice-stats-row">
              <span>{selectedLanguageLabel}</span>
              <span>{topicStats.totalTopics} Topics</span>
              <span>{topicStats.minQuestions}-{topicStats.maxQuestions} Questions/Topic</span>
            </div>
          </div>

          <div className="header-right">
            <LanguageSelector
              options={LANGUAGE_OPTIONS}
              value={language}
              onChange={setLanguage}
            />

            <div className="toggle-wrapper" role="group" aria-label="Practice mode toggle">
              <button
                type="button"
                className={mode === "topic" ? "toggle-label active" : "toggle-label"}
                onClick={() => setMode("topic")}
              >
                Topic Wise
              </button>
              <button
                type="button"
                className={mode === "difficulty" ? "toggle-switch right" : "toggle-switch"}
                onClick={() => setMode((prev) => (prev === "topic" ? "difficulty" : "topic"))}
                aria-label={mode === "topic" ? "Switch to Difficulty mode" : "Switch to Topic Wise mode"}
              >
                <span className="toggle-switch-knob" />
              </button>
              <button
                type="button"
                className={mode === "difficulty" ? "toggle-label active" : "toggle-label"}
                onClick={() => setMode("difficulty")}
              >
                Difficulty
              </button>
            </div>
          </div>
        </div>

        <TopicsGrid
          mode={mode}
          topics={languageTopics}
          difficulties={difficulties}
          onTopicSelect={(topic) => openPracticeSet(topic.id)}
          onDifficultySelect={(difficulty) => openPracticeSet(difficulty.name, true)}
        />
      </div>
    </div>
  );
}
