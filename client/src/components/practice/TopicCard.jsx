import React from "react";
import {
  FaBrain,
  FaCode,
  FaCubes,
  FaDatabase,
  FaLayerGroup,
  FaList,
  FaNetworkWired,
  FaProjectDiagram,
  FaRandom,
  FaSitemap,
  FaStream,
  FaThLarge,
  FaBoxOpen
} from "react-icons/fa";

const iconMap = {
  arrays: FaThLarge,
  strings: FaCode,
  linkedList: FaProjectDiagram,
  stackQueue: FaCubes,
  hashing: FaDatabase,
  twoPointers: FaCode,
  slidingWindow: FaStream,
  binaryTree: FaSitemap,
  heap: FaLayerGroup,
  graph: FaNetworkWired,
  dynamicProgramming: FaBrain,
  greedy: FaRandom,
  backtracking: FaProjectDiagram,
  trie: FaBoxOpen,
  matrix: FaList
};

export default function TopicCard({ topic, onSelect }) {
  const Icon = iconMap[topic.iconKey] || FaList;

  return (
    <button
      type="button"
      className="practice-card"
      onClick={() => onSelect(topic)}
      title={topic.name}
    >
      <div className="card-icon">
        <Icon />
      </div>
      <div className="card-title">{topic.name}</div>
      <div className="card-cue">{topic.subtitle}</div>
      <div className="card-meta">{topic.questionCount} questions</div>
    </button>
  );
}
