export const LANGUAGE_OPTIONS = [
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" }
];

const topicBlueprint = [
  {
    id: "arrays",
    name: "Arrays",
    subtitle: "Index-driven interview patterns, transforms, and prefix logic.",
    iconKey: "arrays",
    questionCount: 10
  },
  {
    id: "strings",
    name: "Strings",
    subtitle: "Parsing, matching, and efficient text processing drills.",
    iconKey: "strings",
    questionCount: 9
  },
  {
    id: "linked-list",
    name: "Linked List",
    subtitle: "Pointer movement, reversal, and cycle handling practice.",
    iconKey: "linkedList",
    questionCount: 8
  },
  {
    id: "stack-queue",
    name: "Stack and Queue",
    subtitle: "LIFO/FIFO based problem decomposition under constraints.",
    iconKey: "stackQueue",
    questionCount: 8
  },
  {
    id: "hashing",
    name: "Hashing",
    subtitle: "Frequency maps, lookup acceleration, and collision-aware logic.",
    iconKey: "hashing",
    questionCount: 9
  },
  {
    id: "two-pointers",
    name: "Two Pointers",
    subtitle: "Dual-index scanning for sorted and unsorted scenarios.",
    iconKey: "twoPointers",
    questionCount: 8
  },
  {
    id: "sliding-window",
    name: "Sliding Window",
    subtitle: "Fixed and variable window optimization workflows.",
    iconKey: "slidingWindow",
    questionCount: 8
  },
  {
    id: "binary-tree-bst",
    name: "Binary Tree and BST",
    subtitle: "Traversal, recursion, and ordered-tree interview exercises.",
    iconKey: "binaryTree",
    questionCount: 10
  },
  {
    id: "heap-priority-queue",
    name: "Heap / Priority Queue",
    subtitle: "Top-k, scheduling, and median maintenance challenges.",
    iconKey: "heap",
    questionCount: 9
  },
  {
    id: "graph",
    name: "Graph",
    subtitle: "BFS/DFS, components, shortest path, and state modeling.",
    iconKey: "graph",
    questionCount: 10
  },
  {
    id: "dynamic-programming",
    name: "Dynamic Programming",
    subtitle: "State transitions, memoization, and tabulation practice.",
    iconKey: "dynamicProgramming",
    questionCount: 10
  },
  {
    id: "greedy",
    name: "Greedy",
    subtitle: "Local-choice strategy, ordering, and interval optimization.",
    iconKey: "greedy",
    questionCount: 8
  },
  {
    id: "recursion-backtracking",
    name: "Recursion and Backtracking",
    subtitle: "Search-space pruning, call-stack control, and branching.",
    iconKey: "backtracking",
    questionCount: 9
  },
  {
    id: "trie",
    name: "Trie",
    subtitle: "Prefix-search structures and lexical query patterns.",
    iconKey: "trie",
    questionCount: 7
  },
  {
    id: "matrix-bit-misc",
    name: "Matrix, Bit Manipulation, Misc",
    subtitle: "Grid traversal, mask tricks, and mixed interview rounds.",
    iconKey: "matrix",
    questionCount: 8
  }
];

function buildTopicsForLanguage() {
  return topicBlueprint.map((topic) => ({
    ...topic,
    slug: topic.id
  }));
}

export const topics = {
  c: buildTopicsForLanguage(),
  cpp: buildTopicsForLanguage(),
  java: buildTopicsForLanguage(),
  python: buildTopicsForLanguage()
};

export function normalizeLanguage(value) {
  const lowered = String(value || "").trim().toLowerCase();
  if (lowered === "c++") return "cpp";
  if (LANGUAGE_OPTIONS.some((item) => item.value === lowered)) return lowered;
  return "python";
}

export function getTopicsForLanguage(language) {
  const normalized = normalizeLanguage(language);
  return topics[normalized] || topics.python;
}
