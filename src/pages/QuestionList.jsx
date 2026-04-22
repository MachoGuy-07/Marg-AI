import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LanguageSelector from "../components/practice/LanguageSelector";
import { LANGUAGE_OPTIONS, getTopicsForLanguage, normalizeLanguage } from "../data/dsaTopics";
import {
  buildStableQuestionId,
  getTopicQuestions,
  resolveRuntimeTopicSlug
} from "../data/questions";
import "../styles/questionPages.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

function hasExecutableTestPack(question) {
  return (
    question?.evaluationAvailable !== false &&
    Array.isArray(question?.testCases) &&
    question.testCases.length >= 3
  );
}

function titleForTopic(topicKey, language) {
  if (String(topicKey).startsWith("difficulty-")) {
    const difficulty = String(topicKey).replace("difficulty-", "");
    const capitalized = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    return `${capitalized} Questions`;
  }

  const list = getTopicsForLanguage(language);
  return list.find((topic) => topic.id === topicKey)?.name || topicKey.replace(/-/g, " ");
}

function mapBackendQuestion(topicKey, question, index, staticQuestion) {
  return {
    id: buildStableQuestionId(topicKey, index),
    backendQuestionId: question.id,
    title: staticQuestion?.title || question.title,
    difficulty: String(staticQuestion?.difficulty || question.difficulty || "").toLowerCase(),
    description: staticQuestion?.description || question.description || "Interview-focused question",
    tags:
      (Array.isArray(staticQuestion?.tags) && staticQuestion.tags.length)
        ? staticQuestion.tags
        : [topicKey.replace(/-/g, " "), String(question.difficulty || "").toLowerCase()].filter(Boolean)
  };
}

function mapStaticQuestion(topicKey, question, index) {
  return {
    id: buildStableQuestionId(topicKey, index),
    backendQuestionId: "",
    title: question.title,
    difficulty: String(question.difficulty || "").toLowerCase(),
    description: question.description || "Interview-focused question",
    tags: Array.isArray(question.tags) ? question.tags : []
  };
}

export default function QuestionList() {
  const { language, topic } = useParams();
  const navigate = useNavigate();
  const normalizedLanguage = normalizeLanguage(language);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const topicTitle = useMemo(
    () => titleForTopic(topic, normalizedLanguage),
    [topic, normalizedLanguage]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadQuestions() {
      setLoading(true);
      setLoadError("");
      const staticQuestions = getTopicQuestions(normalizedLanguage, topic);

      try {
        const normalizedTopic = String(topic || "").toLowerCase();
        const params = new URLSearchParams({ language: normalizedLanguage });

        if (normalizedTopic.startsWith("difficulty-")) {
          params.set("difficulty", normalizedTopic.replace("difficulty-", ""));
          params.set("starterMode", "difficulty");
        } else {
          params.set("topic", resolveRuntimeTopicSlug(normalizedLanguage, normalizedTopic));
          params.set("starterMode", "topic");
        }

        const response = await fetch(`${API_BASE_URL}/api/code/questions?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load questions");
        }

        const backendQuestions = Array.isArray(data?.questions) ? data.questions : [];
        const executableQuestions = backendQuestions.filter(hasExecutableTestPack);
        const runtimeQuestions = executableQuestions.length ? executableQuestions : backendQuestions;

        const source = runtimeQuestions.length
          ? runtimeQuestions.map((question, index) =>
            mapBackendQuestion(normalizedTopic, question, index, staticQuestions[index])
          )
          : staticQuestions.map((question, index) => mapStaticQuestion(normalizedTopic, question, index));

        if (!cancelled) {
          setQuestions(source);
          if (!runtimeQuestions.length && !staticQuestions.length) {
            setLoadError("No questions available for this topic yet.");
          } else if (backendQuestions.length && !executableQuestions.length) {
            setLoadError("Runtime testcases are not available for this set. Switch topic or difficulty.");
          }
        }
      } catch (error) {
        if (!cancelled) {
          const fallback = staticQuestions.map((question, index) =>
            mapStaticQuestion(topic, question, index)
          );
          setQuestions(fallback);
          setLoadError(error?.message || "Unable to load questions from runtime service");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadQuestions();
    return () => {
      cancelled = true;
    };
  }, [normalizedLanguage, topic]);

  return (
    <div className="question-shell">
      <div className="question-surface">
        <header className="question-header">
          <div>
            <span className="question-kicker">Practice Arena</span>
            <h1>{topicTitle}</h1>
            <p>{questions.length} interview-style questions ready for {normalizedLanguage.toUpperCase()}.</p>
          </div>

          <div className="question-header-right">
            <LanguageSelector
              options={LANGUAGE_OPTIONS}
              value={normalizedLanguage}
              onChange={(nextLanguage) => navigate(`/practice/${nextLanguage}/${topic}`)}
            />
            <button
              type="button"
              className="back-btn"
              onClick={() => navigate("/practice")}
            >
              Back to Topics
            </button>
          </div>
        </header>

        {loading ? (
          <div className="question-empty-card">Loading questions...</div>
        ) : (
          <>
            {loadError && <div className="question-warning">{loadError}</div>}
            {!questions.length ? (
              <div className="question-empty-card">No questions available for this topic yet.</div>
            ) : (
              <div className="question-grid">
                {questions.map((question) => (
                  <button
                    type="button"
                    key={question.id}
                    className="question-card"
                    onClick={() =>
                      navigate(`/practice/${normalizedLanguage}/${topic}/${question.id}`)
                    }
                  >
                    <div className="question-row">
                      <h3>{question.title}</h3>
                      <span className={`difficulty-chip ${question.difficulty}`}>
                        {question.difficulty}
                      </span>
                    </div>
                    <p>{question.description}</p>
                    <div className="tag-row">
                      {(question.tags || []).slice(0, 3).map((tag) => (
                        <span key={`${question.id}-${tag}`}>{tag}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
