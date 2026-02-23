import React from "react";
import TopicCard from "./TopicCard";

export default function TopicsGrid({
  mode,
  topics,
  difficulties,
  onTopicSelect,
  onDifficultySelect
}) {
  if (mode === "topic") {
    return (
      <div className="practice-grid">
        {topics.map((topic) => (
          <TopicCard key={`${topic.id}-${topic.slug}`} topic={topic} onSelect={onTopicSelect} />
        ))}
      </div>
    );
  }

  return (
    <div className="practice-grid">
      {difficulties.map((difficulty) => (
        <button
          type="button"
          key={difficulty.name}
          className="practice-card difficulty"
          onClick={() => onDifficultySelect(difficulty)}
        >
          <div className="card-title">{difficulty.name}</div>
          <div className="card-cue">{difficulty.cue}</div>
          <div className="card-meta">Mixed topics | 7-10 questions</div>
        </button>
      ))}
    </div>
  );
}
