import { normalizeLanguage } from "./codingQuestions.js";

const MIN_TOPICS_PER_LANGUAGE = 15;
const MIN_QUESTIONS_PER_TOPIC = 7;
const MAX_QUESTIONS_PER_TOPIC = 10;

const questionTitleVariants = [
  ({ topicName, core }) => `${topicName}: ${core} Fundamentals`,
  ({ topicName, edge }) => `${topicName}: ${edge} Edge Cases`,
  ({ topicName, optimize }) => `${topicName}: ${optimize} Optimization`,
  ({ topicName }) => `${topicName}: Constraint Variant`,
  ({ topicName }) => `${topicName}: Debugging Challenge`,
  ({ topicName }) => `${topicName}: Mixed Pattern Problem`,
  ({ topicName }) => `${topicName}: Timed Interview Drill`,
  ({ topicName }) => `${topicName}: Systematic Dry-Run Case`,
  ({ topicName }) => `${topicName}: Complexity Tradeoff Scenario`,
  ({ topicName }) => `${topicName}: Production-Scale Variant`
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function questionCountForTopic(slug = "") {
  const seed = String(slug)
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return MIN_QUESTIONS_PER_TOPIC + (seed % (MAX_QUESTIONS_PER_TOPIC - MIN_QUESTIONS_PER_TOPIC + 1));
}

function buildQuestionTitles(topicName, verbs, questionCount = MIN_QUESTIONS_PER_TOPIC) {
  const [core, edge, optimize] = verbs;
  const total = clamp(Number(questionCount) || MIN_QUESTIONS_PER_TOPIC, MIN_QUESTIONS_PER_TOPIC, MAX_QUESTIONS_PER_TOPIC);
  const context = { topicName, core, edge, optimize };
  return questionTitleVariants.slice(0, total).map((variant) => variant(context));
}

function topic(slug, name, cue, verbs, questionCount = questionCountForTopic(slug)) {
  return {
    slug,
    name,
    cue,
    questionTitles: buildQuestionTitles(name, verbs, questionCount)
  };
}

const catalog = validateCatalog({
  python: [
    topic("pythonic-patterns", "Pythonic Patterns", "List/dict patterns and clean idiomatic logic", ["Comprehension", "Iteration", "Hash lookup"]),
    topic("decorators-and-closures", "Decorators and Closures", "Functional wrappers and state capture techniques", ["Decorator", "Closure", "Wrapper"]),
    topic("generators-and-iterators", "Generators and Iterators", "Lazy execution and iterator protocol workflows", ["Generator", "Yield", "Iterator"]),
    topic("string-parsing-and-regex", "String Parsing and Regex", "Tokenization, matching, and text transformation", ["Parser", "Regex", "Tokenizer"]),
    topic("dictionary-and-set-mastery", "Dictionary and Set Mastery", "Frequency maps, dedupe, and membership optimization", ["Dictionary", "Collision", "Set"]),
    topic("recursion-and-backtracking", "Recursion and Backtracking", "State tree traversal and decision rollback", ["Recursion", "Backtrack", "Branching"]),
    topic("dynamic-programming-patterns", "Dynamic Programming Patterns", "Memoization and tabulation by state transitions", ["State", "Transition", "Memoization"]),
    topic("heapq-and-priority-queues", "Heapq and Priority Queues", "Top-k and scheduling patterns with heaps", ["Heap", "Priority", "Scheduling"]),
    topic("graph-traversals", "Graph Traversals", "BFS/DFS patterns and connectivity analysis", ["Traversal", "Component", "Pathfinding"]),
    topic("tree-recursion", "Tree Recursion", "Recursive DFS on binary and n-ary trees", ["Traversal", "Depth", "Subtree"]),
    topic("sliding-window-two-pointers", "Sliding Window and Two Pointers", "Linear scans with adaptive boundaries", ["Window", "Pointer", "Invariant"]),
    topic("greedy-techniques", "Greedy Techniques", "Local choice strategies and proof intuition", ["Selection", "Ordering", "Interval"]),
    topic("bit-manipulation-tricks", "Bit Manipulation Tricks", "Masking, parity, and binary transformations", ["Bitwise", "Mask", "Toggle"]),
    topic("sorting-and-binary-search", "Sorting and Binary Search", "Order-based processing and search-space reduction", ["Sorting", "Boundary", "Binary search"]),
    topic("matrix-and-grid-problems", "Matrix and Grid Problems", "2D traversal, flood fill, and simulation logic", ["Grid", "Boundary", "Traversal"]),
    topic("linked-lists-and-pointers", "Linked Lists and Pointers", "Pointer updates and fast/slow runner techniques", ["Pointer", "Runner", "Merge"]),
    topic("tries-and-prefix-search", "Tries and Prefix Search", "Prefix tree operations and autocomplete-style lookup", ["Trie node", "Prefix", "Search"]),
    topic("monotonic-stack-patterns", "Monotonic Stack Patterns", "Nearest greater/smaller and range contribution tricks", ["Monotonic", "Boundary", "Span"])
  ],
  java: [
    topic("java-collections-studio", "Java Collections Studio", "HashMap/HashSet/PriorityQueue workflows", ["Collection", "Map", "PriorityQueue"]),
    topic("oop-and-design-principles", "OOP and Design Principles", "Encapsulation, inheritance, and modular design", ["Class design", "Abstraction", "Polymorphism"]),
    topic("streams-and-lambdas", "Streams and Lambdas", "Declarative processing with Java functional APIs", ["Stream", "Lambda", "Collector"]),
    topic("concurrency-and-threads", "Concurrency and Threads", "Thread-safe logic and coordination primitives", ["Thread", "Synchronization", "Executor"]),
    topic("exception-handling-strategies", "Exception Handling Strategies", "Robust try/catch flows and failure recovery", ["Exception", "Propagation", "Recovery"]),
    topic("string-and-stringbuilder", "String and StringBuilder", "Immutable/mutable string processing patterns", ["String", "Builder", "Parsing"]),
    topic("hashmap-and-hashset-patterns", "HashMap and HashSet Patterns", "Fast lookup and counting problems", ["Hashing", "Frequency", "Lookup"]),
    topic("priorityqueue-and-heaps", "PriorityQueue and Heaps", "Heap-backed ordering and scheduling tasks", ["Heap", "Priority", "TopK"]),
    topic("recursion-and-backtracking", "Recursion and Backtracking", "Combination/permutation style recursion", ["Recursion", "Backtrack", "Pruning"]),
    topic("dynamic-programming-java", "Dynamic Programming in Java", "State-oriented optimization problems", ["DP state", "Transition", "Tabulation"]),
    topic("trees-and-bst-operations", "Trees and BST Operations", "Tree traversal and ordered tree logic", ["BST", "Traversal", "Rebalance"]),
    topic("graph-algorithms-java", "Graph Algorithms in Java", "BFS/DFS, shortest path, and components", ["Graph", "Traversal", "Shortest path"]),
    topic("two-pointers-and-window", "Two Pointers and Window", "Linear optimization with index motion", ["Pointer", "Window", "Constraint"]),
    topic("greedy-and-interval-scheduling", "Greedy and Interval Scheduling", "Interval merge/selection strategies", ["Interval", "Greedy", "Schedule"]),
    topic("java-io-and-parsing", "Java I/O and Parsing", "Buffered input parsing for competitive constraints", ["Input", "Parser", "Formatter"]),
    topic("linkedlist-and-deque-patterns", "LinkedList and Deque Patterns", "Queue/deque-based traversal and scheduling patterns", ["Deque", "Queue", "Window"]),
    topic("binary-search-and-ordering", "Binary Search and Ordering", "Search-space narrowing and order-statistics patterns", ["Binary search", "Boundary", "Ordering"]),
    topic("monotonic-stack-and-queue", "Monotonic Stack and Queue", "Range optimization patterns using monotonic containers", ["Monotonic", "Stack", "Queue"])
  ],
  cpp: [
    topic("stl-graph-lab", "STL Graph Lab", "Graph modeling and traversal with STL", ["Graph build", "Traversal", "Connectivity"]),
    topic("stl-containers-and-iterators", "STL Containers and Iterators", "vector/map/set/iterator mastery", ["Container", "Iterator", "Traversal"]),
    topic("templates-and-generic-programming", "Templates and Generic Programming", "Type-safe generic logic and reusable components", ["Template", "Instantiation", "Generic design"]),
    topic("memory-and-smart-pointers", "Memory and Smart Pointers", "Ownership-safe resource management", ["Pointer", "Ownership", "Lifetime"]),
    topic("recursion-and-backtracking", "Recursion and Backtracking", "State tree exploration patterns", ["Recursion", "Pruning", "Backtrack"]),
    topic("dp-optimizations", "Dynamic Programming Optimizations", "Space/time optimized DP transitions", ["State", "Optimization", "Transition"]),
    topic("trees-and-binary-search-trees", "Trees and Binary Search Trees", "Tree recursion and ordered operations", ["Tree", "BST", "Traversal"]),
    topic("segment-tree-and-fenwick", "Segment Tree and Fenwick", "Range query and update data structures", ["Range query", "Fenwick", "Segment tree"]),
    topic("string-algorithms", "String Algorithms", "Pattern matching and transformation logic", ["Substring", "Pattern", "Matching"]),
    topic("two-pointers-and-window", "Two Pointers and Sliding Window", "Index-controlled linear scans", ["Window", "Pointer", "Invariant"]),
    topic("greedy-and-sorting", "Greedy and Sorting", "Ordering-based optimization patterns", ["Sorting", "Selection", "Greedy"]),
    topic("bitmask-and-bitwise", "Bitmask and Bitwise", "Mask DP and binary-state techniques", ["Bitmask", "Bitwise", "Toggle"]),
    topic("union-find-and-connectivity", "Union Find and Connectivity", "DSU-based component management", ["Disjoint set", "Union", "Connectivity"]),
    topic("shortest-path-algorithms", "Shortest Path Algorithms", "Dijkstra/BFS based shortest path models", ["Shortest path", "Relaxation", "Priority queue"]),
    topic("matrix-and-grid-search", "Matrix and Grid Search", "2D traversal with BFS/DFS constraints", ["Grid", "Flood fill", "Boundary"]),
    topic("linked-lists-and-pointers", "Linked Lists and Pointers", "Pointer-safe list operations and cycle handling", ["Pointer", "Node", "Cycle"]),
    topic("monotonic-structures", "Monotonic Structures", "Nearest-boundary and contribution techniques", ["Monotonic", "Boundary", "Contribution"]),
    topic("binary-search-answer-space", "Binary Search on Answer Space", "Feasibility checks with binary decision boundaries", ["Binary search", "Feasibility", "Boundary"])
  ],
  c: [
    topic("pointers-and-arrays", "Pointers and Arrays", "Index discipline and pointer-safe array work", ["Pointer", "Swap", "Traversal"]),
    topic("strings-and-char-arrays", "Strings and Character Arrays", "Manual string parsing and manipulation", ["String scan", "Buffer", "Tokenizer"]),
    topic("dynamic-memory-management", "Dynamic Memory Management", "malloc/free workflows and leak-safe coding", ["Allocation", "Lifetime", "Cleanup"]),
    topic("linked-list-engineering", "Linked List Engineering", "Node manipulation and list operations", ["List node", "Pointer relink", "Traversal"]),
    topic("stack-and-queue-in-c", "Stack and Queue in C", "Array/linked implementations of linear ADTs", ["Stack push/pop", "Queue", "Circular buffer"]),
    topic("recursion-and-function-pointers", "Recursion and Function Pointers", "Recursive decomposition and callback patterns", ["Recursion", "Function pointer", "Control flow"]),
    topic("structures-unions-enums", "Structures, Unions, and Enums", "Data modeling in low-level C", ["Struct", "Union", "Enum"]),
    topic("bitwise-programming", "Bitwise Programming", "Bit operations and mask transforms", ["Bit mask", "Shift", "Toggle"]),
    topic("sorting-and-searching-c", "Sorting and Searching in C", "Manual algorithm implementation patterns", ["Sort", "Search", "Partition"]),
    topic("matrix-and-2d-arrays", "Matrix and 2D Arrays", "Row/column operations and traversal safety", ["Matrix", "Row scan", "Boundary"]),
    topic("pointer-arithmetic-drills", "Pointer Arithmetic Drills", "Address arithmetic and contiguous memory logic", ["Pointer math", "Offset", "Stride"]),
    topic("file-handling-and-parsing", "File Handling and Parsing", "fopen/fgets/fscanf based parsing drills", ["File read", "Parse", "Output"]),
    topic("hash-table-basics-c", "Hash Table Basics in C", "Array-bucket hashing fundamentals", ["Hash function", "Bucket", "Collision"]),
    topic("graph-representation-c", "Graph Representation in C", "Adjacency matrix/list from raw memory", ["Graph build", "Adjacency", "Traversal"]),
    topic("tree-traversal-c", "Tree Traversal in C", "Manual tree node operations and traversals", ["Tree node", "DFS", "Insertion"]),
    topic("dynamic-programming-c", "Dynamic Programming in C", "State table transitions with memory-conscious implementation", ["State", "Transition", "Optimization"]),
    topic("sliding-window-and-two-pointers", "Sliding Window and Two Pointers", "Linear scans with boundary updates in raw arrays", ["Window", "Pointer", "Boundary"]),
    topic("greedy-interval-patterns-c", "Greedy Interval Patterns in C", "Ordering and interval selection under low-level constraints", ["Greedy", "Interval", "Sort"])
  ]
});

function validateCatalog(rawCatalog) {
  for (const [language, topics] of Object.entries(rawCatalog)) {
    if (!Array.isArray(topics) || topics.length < MIN_TOPICS_PER_LANGUAGE) {
      throw new Error(
        `Topic catalog for "${language}" must include at least ${MIN_TOPICS_PER_LANGUAGE} topics.`
      );
    }

    for (const entry of topics) {
      const count = Array.isArray(entry?.questionTitles) ? entry.questionTitles.length : 0;
      if (count < MIN_QUESTIONS_PER_TOPIC || count > MAX_QUESTIONS_PER_TOPIC) {
        throw new Error(
          `Topic "${entry?.name || "unknown"}" in "${language}" must have ${MIN_QUESTIONS_PER_TOPIC}-${MAX_QUESTIONS_PER_TOPIC} questions.`
        );
      }
    }
  }

  return rawCatalog;
}

function buildDifficulty(index) {
  const cycle = ["Easy", "Medium", "Hard"];
  return cycle[index % cycle.length];
}

function buildStarter(language, title, topicName) {
  if (language === "python") {
    return `def solve():
    # CORE_START
    # TODO: implement ${title} in ${topicName}
    # CORE_END
    pass


def main():
    solve()


if __name__ == "__main__":
    main()
`;
  }

  if (language === "java") {
    return `import java.util.*;

public class Main {
    static void solve() {
        // CORE_START
        // TODO: implement ${title} in ${topicName}
        // CORE_END
    }

    public static void main(String[] args) {
        solve();
    }
}
`;
  }

  if (language === "cpp") {
    return `#include <iostream>
using namespace std;

void solve() {
    // CORE_START
    // TODO: implement ${title} in ${topicName}
    // CORE_END
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    solve();
    return 0;
}
`;
  }

  return `#include <stdio.h>

void solve(void) {
    // CORE_START
    // TODO: implement ${title} in ${topicName}
    // CORE_END
}

int main(void) {
    solve();
    return 0;
}
`;
}

function buildDifficultyStarter(starterCode, language) {
  const text = String(starterCode || "");
  const lines = text.split("\n");
  const startIndex = lines.findIndex((line) => line.includes("CORE_START"));
  const endIndex = lines.findIndex((line, idx) => idx > startIndex && line.includes("CORE_END"));

  if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex + 1) {
    return text;
  }

  const placeholder =
    language === "python"
      ? "    # TODO: complete core logic for difficulty mode"
      : "    // TODO: complete core logic for difficulty mode";

  return [
    ...lines.slice(0, startIndex + 1),
    placeholder,
    ...lines.slice(endIndex)
  ].join("\n");
}

export function getLanguageTopicCatalog(language) {
  const normalized = normalizeLanguage(language);
  const list = catalog[normalized] || [];
  return list.map((item) => ({
    slug: item.slug,
    name: item.name,
    cue: item.cue,
    questionCount: item.questionTitles.length
  }));
}

export function getCatalogQuestionsByTopic(language, topicSlug, starterMode = "topic") {
  const normalized = normalizeLanguage(language);
  const list = catalog[normalized] || [];
  const topic = list.find((item) => item.slug === topicSlug);
  if (!topic) return [];

  return topic.questionTitles.map((title, index) => {
    const starter = buildStarter(normalized, title, topic.name);
    return {
      id: `catalog-${normalized}-${topic.slug}-${index + 1}`,
      slug: topic.slug,
      topic: topic.name,
      topicCue: topic.cue,
      difficulty: buildDifficulty(index),
      title,
      description: `Solve the ${topic.name} challenge: "${title}". Focus on correctness, edge cases, and clean structure.`,
      inputFormat: "Problem-specific input format will be provided in challenge statement.",
      outputFormat: "Print output exactly as requested in challenge statement.",
      constraints: ["Handle edge cases", "Keep complexity interview-acceptable"],
      starterCode:
        starterMode === "difficulty"
          ? buildDifficultyStarter(starter, normalized)
          : starter,
      testCases: [],
      evaluationAvailable: false
    };
  });
}

export function getCatalogQuestionsByDifficulty(language, difficulty, starterMode = "difficulty") {
  const normalized = normalizeLanguage(language);
  const list = catalog[normalized] || [];
  const normalizedDifficulty = String(difficulty || "").trim().toLowerCase();
  const allowed = new Set(["easy", "medium", "hard"]);
  if (!allowed.has(normalizedDifficulty)) return [];

  const questions = [];
  for (const topic of list) {
    const generated = getCatalogQuestionsByTopic(normalized, topic.slug, starterMode).filter(
      (question) => String(question.difficulty).toLowerCase() === normalizedDifficulty
    );
    questions.push(...generated);
  }
  return questions;
}

export function isCatalogQuestionId(questionId = "") {
  return String(questionId).startsWith("catalog-");
}

export default catalog;
