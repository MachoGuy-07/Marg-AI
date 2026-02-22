import React from "react";
import { useParams } from "react-router-dom";
import { questions } from "../data/questions";
import "../styles/topicPractice.css";

export default function TopicPractice() {
  const { category } = useParams();

  const question = questions.find(
    (q) =>
      q.slug === category ||
      q.difficulty === category?.toLowerCase()
  );

  if (!question) {
    return (
      <div style={{ color: "white", padding: "40px" }}>
        No question available for {category}
      </div>
    );
  }

  return (
    <div className="question-page">
      <div className="question-left">
        <h2>{question.title}</h2>
        <p>{question.description}</p>
      </div>

      <div className="question-right">
        <div className="editor-header">
          <span>Python</span>
        </div>

        <textarea
          className="code-editor"
          defaultValue={question.starterCode}
        />

        <button className="run-btn">Run Code</button>
      </div>
    </div>
  );
}