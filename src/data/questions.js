const LANGUAGE_KEYS = ["python", "java", "cpp", "c"];
const runtimeTopicSlugMap = {
  python: {
    arrays: "pythonic-patterns",
    strings: "pythonic-patterns",
    "linked-list": "pythonic-patterns",
    "stack-queue": "pythonic-patterns",
    hashing: "pythonic-patterns",
    "two-pointers": "pythonic-patterns",
    "sliding-window": "pythonic-patterns",
    "binary-tree-bst": "pythonic-patterns",
    "heap-priority-queue": "pythonic-patterns",
    graph: "pythonic-patterns",
    "dynamic-programming": "pythonic-patterns",
    greedy: "pythonic-patterns",
    "recursion-backtracking": "pythonic-patterns",
    trie: "pythonic-patterns",
    "matrix-bit-misc": "pythonic-patterns"
  },
  java: {
    arrays: "java-collections-studio",
    strings: "java-collections-studio",
    "linked-list": "java-collections-studio",
    "stack-queue": "java-collections-studio",
    hashing: "java-collections-studio",
    "two-pointers": "java-collections-studio",
    "sliding-window": "java-collections-studio",
    "binary-tree-bst": "java-collections-studio",
    "heap-priority-queue": "java-collections-studio",
    graph: "java-collections-studio",
    "dynamic-programming": "java-collections-studio",
    greedy: "java-collections-studio",
    "recursion-backtracking": "java-collections-studio",
    trie: "java-collections-studio",
    "matrix-bit-misc": "java-collections-studio"
  },
  cpp: {
    arrays: "stl-graph-lab",
    strings: "stl-graph-lab",
    "linked-list": "stl-graph-lab",
    "stack-queue": "stl-graph-lab",
    hashing: "stl-graph-lab",
    "two-pointers": "stl-graph-lab",
    "sliding-window": "stl-graph-lab",
    "binary-tree-bst": "stl-graph-lab",
    "heap-priority-queue": "stl-graph-lab",
    graph: "stl-graph-lab",
    "dynamic-programming": "stl-graph-lab",
    greedy: "stl-graph-lab",
    "recursion-backtracking": "stl-graph-lab",
    trie: "stl-graph-lab",
    "matrix-bit-misc": "stl-graph-lab"
  },
  c: {
    arrays: "pointers-and-arrays",
    strings: "pointers-and-arrays",
    "linked-list": "pointers-and-arrays",
    "stack-queue": "pointers-and-arrays",
    hashing: "pointers-and-arrays",
    "two-pointers": "pointers-and-arrays",
    "sliding-window": "pointers-and-arrays",
    "binary-tree-bst": "pointers-and-arrays",
    "heap-priority-queue": "pointers-and-arrays",
    graph: "pointers-and-arrays",
    "dynamic-programming": "pointers-and-arrays",
    greedy: "pointers-and-arrays",
    "recursion-backtracking": "pointers-and-arrays",
    trie: "pointers-and-arrays",
    "matrix-bit-misc": "pointers-and-arrays"
  }
};

const TOPIC_TEMPLATES = {
  arrays: [
    createTemplate({
      id: "two-sum-variant",
      title: "Two Sum Variant",
      difficulty: "easy",
      description:
        "Given an integer array and a target, return any two indices whose values add up to target.",
      examples: [
        { input: "nums = [2,7,11,15], target = 9", output: "[0,1]" },
        { input: "nums = [3,2,4], target = 6", output: "[1,2]" }
      ],
      constraints: ["2 <= nums.length <= 10^5", "-10^9 <= nums[i], target <= 10^9"],
      tags: ["array", "hashing"],
      starterName: "two_sum"
    }),
    createTemplate({
      id: "maximum-subarray-sum",
      title: "Maximum Subarray Sum",
      difficulty: "medium",
      description:
        "Return the maximum possible sum of a contiguous subarray.",
      examples: [
        { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6" },
        { input: "nums = [1]", output: "1" }
      ],
      constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
      tags: ["array", "kadane"],
      starterName: "max_subarray"
    }),
    createTemplate({
      id: "product-except-self",
      title: "Product Except Self",
      difficulty: "medium",
      description:
        "For each position i, return product of all array values except nums[i] without division.",
      examples: [
        { input: "nums = [1,2,3,4]", output: "[24,12,8,6]" },
        { input: "nums = [-1,1,0,-3,3]", output: "[0,0,9,0,0]" }
      ],
      constraints: ["2 <= nums.length <= 10^5"],
      tags: ["array", "prefix-suffix"],
      starterName: "product_except_self"
    })
  ],
  strings: [
    createTemplate({
      id: "longest-unique-substring",
      title: "Longest Unique Substring",
      difficulty: "medium",
      description:
        "Return length of the longest substring containing all distinct characters.",
      examples: [
        { input: "s = \"abcabcbb\"", output: "3" },
        { input: "s = \"bbbbb\"", output: "1" }
      ],
      constraints: ["1 <= s.length <= 10^5"],
      tags: ["string", "sliding-window"],
      starterName: "longest_unique_substring"
    }),
    createTemplate({
      id: "anagram-groups",
      title: "Group Anagrams",
      difficulty: "medium",
      description:
        "Group strings that are anagrams of each other.",
      examples: [
        { input: "strs = [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]", output: "[[eat,tea,ate],[tan,nat],[bat]]" }
      ],
      constraints: ["1 <= strs.length <= 10^4", "0 <= strs[i].length <= 100"],
      tags: ["string", "hashing"],
      starterName: "group_anagrams"
    }),
    createTemplate({
      id: "minimum-window-substring",
      title: "Minimum Window Substring",
      difficulty: "hard",
      description:
        "Find the smallest substring of s containing all chars of t.",
      examples: [
        { input: "s = \"ADOBECODEBANC\", t = \"ABC\"", output: "\"BANC\"" },
        { input: "s = \"a\", t = \"a\"", output: "\"a\"" }
      ],
      constraints: ["1 <= s.length, t.length <= 10^5"],
      tags: ["string", "sliding-window"],
      starterName: "min_window_substring"
    })
  ],
  "linked-list": [
    createTemplate({
      id: "reverse-linked-list",
      title: "Reverse Linked List",
      difficulty: "easy",
      description:
        "Reverse a singly linked list and return new head.",
      examples: [
        { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" }
      ],
      constraints: ["0 <= number of nodes <= 5000"],
      tags: ["linked-list", "pointer"],
      starterName: "reverse_list"
    }),
    createTemplate({
      id: "linked-list-cycle",
      title: "Detect Cycle in Linked List",
      difficulty: "easy",
      description:
        "Return true if linked list contains a cycle.",
      examples: [
        { input: "head = [3,2,0,-4], pos = 1", output: "true" },
        { input: "head = [1], pos = -1", output: "false" }
      ],
      constraints: ["Nodes up to 10^4"],
      tags: ["linked-list", "two-pointers"],
      starterName: "has_cycle"
    }),
    createTemplate({
      id: "merge-k-sorted-lists",
      title: "Merge K Sorted Lists",
      difficulty: "hard",
      description:
        "Merge k sorted linked lists into one sorted list.",
      examples: [
        { input: "lists = [[1,4,5],[1,3,4],[2,6]]", output: "[1,1,2,3,4,4,5,6]" }
      ],
      constraints: ["k <= 10^4", "Total nodes <= 10^5"],
      tags: ["linked-list", "heap"],
      starterName: "merge_k_lists"
    })
  ],
  "stack-queue": [
    createTemplate({
      id: "valid-parentheses",
      title: "Valid Parentheses",
      difficulty: "easy",
      description:
        "Check if a bracket sequence is balanced.",
      examples: [
        { input: "s = \"()[]{}\"", output: "true" },
        { input: "s = \"(]\"", output: "false" }
      ],
      constraints: ["1 <= s.length <= 10^4"],
      tags: ["stack"],
      starterName: "is_valid_parentheses"
    }),
    createTemplate({
      id: "queue-using-stacks",
      title: "Implement Queue Using Stacks",
      difficulty: "medium",
      description:
        "Design queue operations using only stack primitives.",
      examples: [
        { input: "push(1), push(2), peek(), pop()", output: "1,1" }
      ],
      constraints: ["At most 10^5 operations"],
      tags: ["stack", "queue", "design"],
      starterName: "queue_using_stacks"
    }),
    createTemplate({
      id: "sliding-window-maximum",
      title: "Sliding Window Maximum",
      difficulty: "hard",
      description:
        "Return max in each fixed-size sliding window.",
      examples: [
        { input: "nums = [1,3,-1,-3,5,3,6,7], k = 3", output: "[3,3,5,5,6,7]" }
      ],
      constraints: ["1 <= nums.length <= 10^5"],
      tags: ["queue", "deque"],
      starterName: "window_maximum"
    })
  ],
  hashing: [
    createTemplate({
      id: "contains-duplicate",
      title: "Contains Duplicate",
      difficulty: "easy",
      description:
        "Return true if array has any repeated value.",
      examples: [
        { input: "nums = [1,2,3,1]", output: "true" },
        { input: "nums = [1,2,3,4]", output: "false" }
      ],
      constraints: ["1 <= nums.length <= 10^5"],
      tags: ["hashing", "array"],
      starterName: "contains_duplicate"
    }),
    createTemplate({
      id: "top-k-frequent-elements",
      title: "Top K Frequent Elements",
      difficulty: "medium",
      description:
        "Return k values with highest frequency.",
      examples: [
        { input: "nums = [1,1,1,2,2,3], k = 2", output: "[1,2]" }
      ],
      constraints: ["1 <= nums.length <= 10^5"],
      tags: ["hashing", "heap"],
      starterName: "top_k_frequent"
    }),
    createTemplate({
      id: "longest-consecutive-sequence",
      title: "Longest Consecutive Sequence",
      difficulty: "medium",
      description:
        "Find longest run of consecutive integers in O(n).",
      examples: [
        { input: "nums = [100,4,200,1,3,2]", output: "4" }
      ],
      constraints: ["0 <= nums.length <= 10^5"],
      tags: ["hashing", "set"],
      starterName: "longest_consecutive"
    })
  ],
  "two-pointers": [
    createTemplate({
      id: "container-most-water",
      title: "Container With Most Water",
      difficulty: "medium",
      description:
        "Find max area formed by two lines and x-axis.",
      examples: [
        { input: "height = [1,8,6,2,5,4,8,3,7]", output: "49" }
      ],
      constraints: ["2 <= height.length <= 10^5"],
      tags: ["two-pointers", "greedy"],
      starterName: "max_container_area"
    }),
    createTemplate({
      id: "three-sum",
      title: "Three Sum",
      difficulty: "medium",
      description:
        "Return unique triplets that sum to zero.",
      examples: [
        { input: "nums = [-1,0,1,2,-1,-4]", output: "[[-1,-1,2],[-1,0,1]]" }
      ],
      constraints: ["3 <= nums.length <= 3000"],
      tags: ["two-pointers", "sorting"],
      starterName: "three_sum"
    }),
    createTemplate({
      id: "trapping-rain-water",
      title: "Trapping Rain Water",
      difficulty: "hard",
      description:
        "Compute total trapped rain water between bars.",
      examples: [
        { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6" }
      ],
      constraints: ["1 <= height.length <= 2*10^4"],
      tags: ["two-pointers", "prefix"],
      starterName: "trap_rain_water"
    })
  ],
  "sliding-window": [
    createTemplate({
      id: "max-sum-subarray-k",
      title: "Maximum Sum Subarray of Size K",
      difficulty: "easy",
      description:
        "Return max sum among all contiguous subarrays of size k.",
      examples: [
        { input: "nums = [2,1,5,1,3,2], k = 3", output: "9" }
      ],
      constraints: ["1 <= nums.length <= 10^5"],
      tags: ["sliding-window", "array"],
      starterName: "max_sum_k"
    }),
    createTemplate({
      id: "permutation-in-string",
      title: "Permutation in String",
      difficulty: "medium",
      description:
        "Check if s2 contains any permutation of s1.",
      examples: [
        { input: "s1 = \"ab\", s2 = \"eidbaooo\"", output: "true" }
      ],
      constraints: ["1 <= s1.length, s2.length <= 10^4"],
      tags: ["sliding-window", "string", "hashing"],
      starterName: "check_inclusion"
    }),
    createTemplate({
      id: "longest-repeating-char-replacement",
      title: "Longest Repeating Character Replacement",
      difficulty: "medium",
      description:
        "Find longest substring that can be made of one char with <= k replacements.",
      examples: [
        { input: "s = \"AABABBA\", k = 1", output: "4" }
      ],
      constraints: ["1 <= s.length <= 10^5"],
      tags: ["sliding-window", "string"],
      starterName: "character_replacement"
    })
  ],
  "binary-tree-bst": [
    createTemplate({
      id: "max-depth-binary-tree",
      title: "Maximum Depth of Binary Tree",
      difficulty: "easy",
      description:
        "Return max depth from root to any leaf.",
      examples: [
        { input: "root = [3,9,20,null,null,15,7]", output: "3" }
      ],
      constraints: ["Nodes <= 10^5"],
      tags: ["tree", "dfs"],
      starterName: "max_depth"
    }),
    createTemplate({
      id: "validate-bst",
      title: "Validate BST",
      difficulty: "medium",
      description:
        "Verify whether a binary tree satisfies BST ordering rules.",
      examples: [
        { input: "root = [2,1,3]", output: "true" },
        { input: "root = [5,1,4,null,null,3,6]", output: "false" }
      ],
      constraints: ["Nodes <= 10^4"],
      tags: ["tree", "bst"],
      starterName: "is_valid_bst"
    }),
    createTemplate({
      id: "lowest-common-ancestor",
      title: "Lowest Common Ancestor in BST",
      difficulty: "medium",
      description:
        "Find lowest common ancestor of two nodes in BST.",
      examples: [
        { input: "root = [6,2,8,0,4,7,9], p = 2, q = 8", output: "6" }
      ],
      constraints: ["Nodes <= 10^5"],
      tags: ["tree", "bst"],
      starterName: "lowest_common_ancestor"
    })
  ],
  "heap-priority-queue": [
    createTemplate({
      id: "kth-largest-element",
      title: "Kth Largest Element",
      difficulty: "medium",
      description:
        "Return kth largest value from unsorted array.",
      examples: [
        { input: "nums = [3,2,1,5,6,4], k = 2", output: "5" }
      ],
      constraints: ["1 <= nums.length <= 10^5"],
      tags: ["heap", "quickselect"],
      starterName: "kth_largest"
    }),
    createTemplate({
      id: "merge-intervals",
      title: "Meeting Rooms II",
      difficulty: "medium",
      description:
        "Find minimum rooms required to schedule all intervals.",
      examples: [
        { input: "intervals = [[0,30],[5,10],[15,20]]", output: "2" }
      ],
      constraints: ["1 <= intervals.length <= 10^5"],
      tags: ["heap", "intervals"],
      starterName: "min_meeting_rooms"
    }),
    createTemplate({
      id: "median-data-stream",
      title: "Find Median from Data Stream",
      difficulty: "hard",
      description:
        "Design structure supporting addNum and findMedian efficiently.",
      examples: [
        { input: "addNum(1), addNum(2), findMedian()", output: "1.5" }
      ],
      constraints: ["At most 5 * 10^4 operations"],
      tags: ["heap", "design"],
      starterName: "median_finder"
    })
  ],
  graph: [
    createTemplate({
      id: "number-of-islands",
      title: "Number of Islands",
      difficulty: "medium",
      description:
        "Count connected components of 1s in a 2D grid.",
      examples: [
        { input: "grid = [[1,1,1],[0,1,0],[1,1,1]]", output: "1" }
      ],
      constraints: ["m, n <= 300"],
      tags: ["graph", "dfs", "bfs"],
      starterName: "num_islands"
    }),
    createTemplate({
      id: "clone-graph",
      title: "Clone Graph",
      difficulty: "medium",
      description:
        "Return a deep copy of a connected undirected graph.",
      examples: [
        { input: "adj = [[2,4],[1,3],[2,4],[1,3]]", output: "cloned graph" }
      ],
      constraints: ["Nodes <= 100"],
      tags: ["graph", "bfs", "hashing"],
      starterName: "clone_graph"
    }),
    createTemplate({
      id: "network-delay-time",
      title: "Network Delay Time",
      difficulty: "hard",
      description:
        "Given weighted directed graph, return time for signal from source to all nodes.",
      examples: [
        { input: "times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2", output: "2" }
      ],
      constraints: ["1 <= n <= 100", "Edge count <= 6000"],
      tags: ["graph", "dijkstra", "heap"],
      starterName: "network_delay"
    })
  ],
  "dynamic-programming": [
    createTemplate({
      id: "climbing-stairs",
      title: "Climbing Stairs",
      difficulty: "easy",
      description:
        "Count distinct ways to climb n steps with 1 or 2 moves.",
      examples: [
        { input: "n = 2", output: "2" },
        { input: "n = 3", output: "3" }
      ],
      constraints: ["1 <= n <= 45"],
      tags: ["dp", "fibonacci"],
      starterName: "climb_stairs"
    }),
    createTemplate({
      id: "coin-change",
      title: "Coin Change",
      difficulty: "medium",
      description:
        "Return minimum number of coins needed to make amount.",
      examples: [
        { input: "coins = [1,2,5], amount = 11", output: "3" },
        { input: "coins = [2], amount = 3", output: "-1" }
      ],
      constraints: ["1 <= amount <= 10^4"],
      tags: ["dp", "unbounded-knapsack"],
      starterName: "coin_change"
    }),
    createTemplate({
      id: "longest-increasing-subsequence",
      title: "Longest Increasing Subsequence",
      difficulty: "medium",
      description:
        "Return LIS length in an integer array.",
      examples: [
        { input: "nums = [10,9,2,5,3,7,101,18]", output: "4" }
      ],
      constraints: ["1 <= nums.length <= 2500"],
      tags: ["dp", "binary-search"],
      starterName: "length_of_lis"
    })
  ],
  greedy: [
    createTemplate({
      id: "assign-cookies",
      title: "Assign Cookies",
      difficulty: "easy",
      description:
        "Assign cookies to maximize satisfied children count.",
      examples: [
        { input: "g = [1,2,3], s = [1,1]", output: "1" }
      ],
      constraints: ["1 <= g.length, s.length <= 3*10^4"],
      tags: ["greedy", "sorting"],
      starterName: "find_content_children"
    }),
    createTemplate({
      id: "jump-game",
      title: "Jump Game",
      difficulty: "medium",
      description:
        "Determine if you can reach last index with jump lengths.",
      examples: [
        { input: "nums = [2,3,1,1,4]", output: "true" },
        { input: "nums = [3,2,1,0,4]", output: "false" }
      ],
      constraints: ["1 <= nums.length <= 10^4"],
      tags: ["greedy", "array"],
      starterName: "can_jump"
    }),
    createTemplate({
      id: "partition-labels",
      title: "Partition Labels",
      difficulty: "medium",
      description:
        "Partition string so each letter appears in at most one part.",
      examples: [
        { input: "s = \"ababcbacadefegdehijhklij\"", output: "[9,7,8]" }
      ],
      constraints: ["1 <= s.length <= 500"],
      tags: ["greedy", "string"],
      starterName: "partition_labels"
    })
  ],
  "recursion-backtracking": [
    createTemplate({
      id: "subsets",
      title: "Subsets",
      difficulty: "medium",
      description:
        "Return all subsets of distinct integers.",
      examples: [
        { input: "nums = [1,2,3]", output: "[[],[1],[2],[3],[1,2],[1,3],[2,3],[1,2,3]]" }
      ],
      constraints: ["1 <= nums.length <= 10"],
      tags: ["backtracking", "recursion"],
      starterName: "subsets"
    }),
    createTemplate({
      id: "combination-sum",
      title: "Combination Sum",
      difficulty: "medium",
      description:
        "Return all combinations where chosen numbers sum to target.",
      examples: [
        { input: "candidates = [2,3,6,7], target = 7", output: "[[2,2,3],[7]]" }
      ],
      constraints: ["Candidates length <= 30"],
      tags: ["backtracking", "dfs"],
      starterName: "combination_sum"
    }),
    createTemplate({
      id: "n-queens",
      title: "N-Queens",
      difficulty: "hard",
      description:
        "Place n queens on n x n board such that no two attack each other.",
      examples: [
        { input: "n = 4", output: "2 solutions" }
      ],
      constraints: ["1 <= n <= 9"],
      tags: ["backtracking", "recursion"],
      starterName: "solve_n_queens"
    })
  ],
  trie: [
    createTemplate({
      id: "implement-trie",
      title: "Implement Trie",
      difficulty: "medium",
      description:
        "Design insert, search, and startsWith for trie.",
      examples: [
        { input: "insert(\"apple\"), search(\"apple\"), startsWith(\"app\")", output: "true, true" }
      ],
      constraints: ["Operations <= 3*10^4"],
      tags: ["trie", "design"],
      starterName: "trie_operations"
    }),
    createTemplate({
      id: "replace-words",
      title: "Replace Words",
      difficulty: "medium",
      description:
        "Replace words in sentence with shortest dictionary root using trie.",
      examples: [
        { input: "dictionary = [\"cat\",\"bat\",\"rat\"], sentence = \"the cattle was rattled by the battery\"", output: "\"the cat was rat by the bat\"" }
      ],
      constraints: ["Dictionary size <= 1000"],
      tags: ["trie", "string"],
      starterName: "replace_words"
    }),
    createTemplate({
      id: "word-search-ii",
      title: "Word Search II",
      difficulty: "hard",
      description:
        "Find all dictionary words present in board using trie + dfs.",
      examples: [
        { input: "board = [[o,a,a,n],[e,t,a,e],[i,h,k,r],[i,f,l,v]], words = [\"oath\",\"pea\",\"eat\",\"rain\"]", output: "[\"oath\",\"eat\"]" }
      ],
      constraints: ["Board max 12x12"],
      tags: ["trie", "backtracking", "matrix"],
      starterName: "find_words_board"
    })
  ],
  "matrix-bit-misc": [
    createTemplate({
      id: "set-matrix-zeroes",
      title: "Set Matrix Zeroes",
      difficulty: "medium",
      description:
        "If an element is 0, set entire row and column to 0 in place.",
      examples: [
        { input: "matrix = [[1,1,1],[1,0,1],[1,1,1]]", output: "[[1,0,1],[0,0,0],[1,0,1]]" }
      ],
      constraints: ["1 <= m,n <= 200"],
      tags: ["matrix", "in-place"],
      starterName: "set_zeroes"
    }),
    createTemplate({
      id: "single-number",
      title: "Single Number",
      difficulty: "easy",
      description:
        "Every element appears twice except one. Return that single one.",
      examples: [
        { input: "nums = [4,1,2,1,2]", output: "4" }
      ],
      constraints: ["1 <= nums.length <= 3*10^4"],
      tags: ["bit-manipulation", "array"],
      starterName: "single_number"
    }),
    createTemplate({
      id: "rotate-image",
      title: "Rotate Image",
      difficulty: "medium",
      description:
        "Rotate n x n matrix by 90 degrees clockwise in place.",
      examples: [
        { input: "matrix = [[1,2,3],[4,5,6],[7,8,9]]", output: "[[7,4,1],[8,5,2],[9,6,3]]" }
      ],
      constraints: ["1 <= n <= 20"],
      tags: ["matrix", "misc"],
      starterName: "rotate_image"
    })
  ]
};

function createTemplate(template) {
  return template;
}

function normalizeTopicKey(topic = "") {
  return String(topic || "").trim().toLowerCase();
}

function normalizeLanguageKey(language = "") {
  const value = String(language || "").trim().toLowerCase();
  if (value === "c++") return "cpp";
  if (LANGUAGE_KEYS.includes(value)) return value;
  return "python";
}

function starterCodeFor(title, starterName) {
  return {
    python: `def ${starterName}(inputs):\n    # TODO: ${title}\n    return None\n\n\ndef main():\n    # Parse input and print result\n    pass\n\n\nif __name__ == "__main__":\n    main()\n`,
    java: `import java.util.*;\n\npublic class Main {\n    static Object ${starterName}(Object inputs) {\n        // TODO: ${title}\n        return null;\n    }\n\n    public static void main(String[] args) {\n        // Parse input and print result\n    }\n}\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nvoid ${starterName}() {\n    // TODO: ${title}\n}\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    ${starterName}();\n    return 0;\n}\n`,
    c: `#include <stdio.h>\n\nvoid ${starterName}(void) {\n    // TODO: ${title}\n}\n\nint main(void) {\n    ${starterName}();\n    return 0;\n}\n`
  };
}

function buildTopicQuestions(language) {
  const bank = {};

  for (const [topicKey, templates] of Object.entries(TOPIC_TEMPLATES)) {
    bank[topicKey] = templates.map((template, index) => ({
      id: `${topicKey}-${index + 1}`,
      title: template.title,
      difficulty: template.difficulty,
      description: template.description,
      examples: Array.isArray(template.examples) ? template.examples : [],
      constraints: Array.isArray(template.constraints) ? template.constraints : [],
      tags: Array.isArray(template.tags) ? template.tags : [],
      starterCode: starterCodeFor(template.title, template.starterName),
      languageNote: `Practice with ${language.toUpperCase()} runtime constraints.`
    }));
  }

  return bank;
}

export const questionBank = {
  python: buildTopicQuestions("python"),
  java: buildTopicQuestions("java"),
  cpp: buildTopicQuestions("cpp"),
  c: buildTopicQuestions("c")
};

export function getTopicQuestions(language, topic) {
  const normalizedLanguage = normalizeLanguageKey(language);
  const normalizedTopic = normalizeTopicKey(topic);
  const topicMap = questionBank[normalizedLanguage] || {};

  if (normalizedTopic.startsWith("difficulty-")) {
    const difficulty = normalizedTopic.replace("difficulty-", "");
    return Object.values(topicMap)
      .flat()
      .filter((question) => String(question.difficulty).toLowerCase() === difficulty);
  }

  return topicMap[normalizedTopic] || [];
}

export function getQuestionById(language, topic, questionId) {
  const questions = getTopicQuestions(language, topic);
  return questions.find((question) => String(question.id) === String(questionId)) || null;
}

export function getSupportedLanguages() {
  return [...LANGUAGE_KEYS];
}

export function normalizeLanguage(value) {
  return normalizeLanguageKey(value);
}

export function resolveRuntimeTopicSlug(language, topic) {
  const normalizedLanguage = normalizeLanguageKey(language);
  const normalizedTopic = normalizeTopicKey(topic);
  return runtimeTopicSlugMap[normalizedLanguage]?.[normalizedTopic] || normalizedTopic;
}

export function buildStableQuestionId(topic, index) {
  return `${normalizeTopicKey(topic)}__q${Number(index) + 1}`;
}

export function parseStableQuestionIndex(questionId) {
  const match = String(questionId || "").match(/__q(\d+)$/i);
  if (!match) return 0;
  const index = Number(match[1]) - 1;
  return Number.isFinite(index) && index >= 0 ? index : 0;
}
