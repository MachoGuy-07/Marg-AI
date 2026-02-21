// server/data/questions.js

const questions = {
  JavaScript: {
    Backtracking: [
      {
        id: 1,
        title: "Generate Subsets",
        difficulty: "Medium",
        description: "Return all possible subsets of an array."
      },
      {
        id: 2,
        title: "Permutations",
        difficulty: "Medium",
        description: "Return all permutations of a given array."
      },
      {
        id: 3,
        title: "Combination Sum",
        difficulty: "Medium",
        description: "Find all combinations that sum to target."
      },
      {
        id: 4,
        title: "Letter Combinations of Phone Number",
        difficulty: "Medium",
        description: "Return all possible letter combinations.",
        testCases: [
          {
            input: ["23"],
            expected: [
              "ad","ae","af",
              "bd","be","bf",
              "cd","ce","cf"
            ]
          },
          {
            input: [""],
            expected: []
          }
        ]
      },
      {
        id: 5,
        title: "Palindrome Partitioning",
        difficulty: "Hard",
        description: "Partition string into palindrome substrings."
      },
      {
        id: 6,
        title: "N-Queens",
        difficulty: "Hard",
        description: "Place N queens on board without conflicts."
      },
      {
        id: 7,
        title: "Sudoku Solver",
        difficulty: "Hard",
        description: "Solve a partially filled Sudoku board."
      },
      {
        id: 8,
        title: "Word Search",
        difficulty: "Medium",
        description: "Check if word exists in grid."
      }
    ],

    Graph: [
      {
        id: 9,
        title: "Number of Islands",
        difficulty: "Medium",
        description: "Count number of islands in grid."
      },
      {
        id: 10,
        title: "Clone Graph",
        difficulty: "Medium",
        description: "Deep copy a graph."
      }
    ],

    BinaryTree: [
      {
        id: 17,
        title: "Max Depth of Binary Tree",
        difficulty: "Easy",
        description: "Return maximum depth."
      }
    ]
  }
};

export default questions;