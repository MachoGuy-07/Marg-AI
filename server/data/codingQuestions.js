const languageShortcuts = {
  python: [
    "Use enumerate() and dict lookups to avoid nested loops.",
    "Keep output formatting deterministic for easier testcase matching.",
    "Handle edge cases first (empty inputs, single-element arrays)."
  ],
  java: [
    "Prefer HashMap/HashSet for O(1) average lookups.",
    "Use StringBuilder for repeated concatenation work.",
    "Keep helper methods static and focused on one responsibility."
  ],
  cpp: [
    "Use vector and queue/priority_queue instead of manual memory handling.",
    "Pre-size adjacency lists and visited arrays for performance.",
    "Guard graph bounds and convert between 1-indexed and 0-indexed carefully."
  ],
  c: [
    "Validate all array indices before reads and writes.",
    "Initialize counters/accumulators explicitly before loops.",
    "Keep helper functions small and pure where possible."
  ]
};

function makeQuestion({
  id,
  language,
  slug,
  topic,
  topicCue,
  difficulty,
  title,
  description,
  inputFormat,
  outputFormat,
  constraints,
  starter,
  reference,
  testCases,
  hiddenTestCases = []
}) {
  return {
    id,
    slug,
    topic,
    topicCue,
    difficulty,
    title,
    description,
    inputFormat,
    outputFormat,
    constraints,
    starterCode: {
      [language]: starter
    },
    referenceCode: {
      [language]: reference
    },
    testCases,
    hiddenTestCases,
    shortcuts: {
      [language]: languageShortcuts[language] || []
    }
  };
}

const pythonQuestions = [
  makeQuestion({
    id: "py-two-sum-indices",
    language: "python",
    slug: "pythonic-patterns",
    topic: "Pythonic Patterns",
    topicCue: "Hash maps, iterable patterns, clean output formatting",
    difficulty: "Easy",
    title: "Two Sum Indices",
    description:
      "Given an array and target, return indices of two values that sum to target, otherwise -1 -1.",
    inputFormat: "Line 1: n | Line 2: n integers | Line 3: target",
    outputFormat: "Two integers i j",
    constraints: ["2 <= n <= 100000", "-1e9 <= nums[i], target <= 1e9"],
    starter: `def solve(nums, target):
    # CORE_START
    seen = {}
    for i, value in enumerate(nums):
        need = target - value
        # TODO: complete hashmap lookup/update
    # CORE_END
    return (-1, -1)


def main():
    import sys
    data = sys.stdin.read().strip().split()
    if not data:
        return
    n = int(data[0])
    nums = list(map(int, data[1:1 + n]))
    target = int(data[1 + n])
    i, j = solve(nums, target)
    print(i, j)


if __name__ == "__main__":
    main()
`,
    reference: `def solve(nums, target):
    seen = {}
    for i, value in enumerate(nums):
        need = target - value
        if need in seen:
            return (seen[need], i)
        seen[value] = i
    return (-1, -1)


def main():
    import sys
    data = sys.stdin.read().strip().split()
    if not data:
        return
    n = int(data[0])
    nums = list(map(int, data[1:1 + n]))
    target = int(data[1 + n])
    i, j = solve(nums, target)
    print(i, j)


if __name__ == "__main__":
    main()
`,
    testCases: [
      { id: "TC1", input: "4\n2 7 11 15\n9\n", expectedOutput: "0 1" },
      { id: "TC2", input: "5\n3 2 4 8 1\n6\n", expectedOutput: "1 2" },
      { id: "TC3", input: "3\n1 2 3\n7\n", expectedOutput: "-1 -1" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "4\n3 3 5 1\n6\n", expectedOutput: "0 1" },
      { id: "H2", input: "6\n10 -2 8 4 1 6\n9\n", expectedOutput: "4 5" }
    ]
  }),
  makeQuestion({
    id: "py-longest-unique-substring",
    language: "python",
    slug: "pythonic-patterns",
    topic: "Pythonic Patterns",
    topicCue: "Hash maps, iterable patterns, clean output formatting",
    difficulty: "Medium",
    title: "Longest Unique Substring Length",
    description:
      "Return the length of the longest substring with all distinct characters.",
    inputFormat: "Line 1: string s",
    outputFormat: "Single integer",
    constraints: ["1 <= len(s) <= 100000"],
    starter: `def solve(s):
    # CORE_START
    left = 0
    best = 0
    last = {}
    for right, ch in enumerate(s):
        # TODO: update sliding window using last seen index
        pass
    # CORE_END
    return best


def main():
    import sys
    parts = sys.stdin.read().strip().split()
    if not parts:
        return
    print(solve(parts[0]))


if __name__ == "__main__":
    main()
`,
    reference: `def solve(s):
    left = 0
    best = 0
    last = {}
    for right, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            left = last[ch] + 1
        last[ch] = right
        best = max(best, right - left + 1)
    return best


def main():
    import sys
    parts = sys.stdin.read().strip().split()
    if not parts:
        return
    print(solve(parts[0]))


if __name__ == "__main__":
    main()
`,
    testCases: [
      { id: "TC1", input: "abcabcbb\n", expectedOutput: "3" },
      { id: "TC2", input: "bbbbb\n", expectedOutput: "1" },
      { id: "TC3", input: "pwwkew\n", expectedOutput: "3" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "abba\n", expectedOutput: "2" },
      { id: "H2", input: "dvdf\n", expectedOutput: "3" }
    ]
  }),
  makeQuestion({
    id: "py-top-k-frequent",
    language: "python",
    slug: "pythonic-patterns",
    topic: "Pythonic Patterns",
    topicCue: "Hash maps, iterable patterns, clean output formatting",
    difficulty: "Medium",
    title: "Top K Frequent Numbers",
    description:
      "Return the top K frequent numbers sorted by frequency descending, then value ascending.",
    inputFormat: "Line 1: n | Line 2: n integers | Line 3: k",
    outputFormat: "k integers separated by space",
    constraints: ["1 <= n <= 100000", "1 <= k <= number of unique values"],
    starter: `from collections import Counter


def solve(nums, k):
    # CORE_START
    freq = Counter(nums)
    items = list(freq.items())
    # TODO: sort items by (-count, value) and return first k values
    # CORE_END
    return []


def main():
    import sys
    data = sys.stdin.read().strip().split()
    if not data:
        return
    n = int(data[0])
    nums = list(map(int, data[1:1 + n]))
    k = int(data[1 + n])
    ans = solve(nums, k)
    print(" ".join(map(str, ans)))


if __name__ == "__main__":
    main()
`,
    reference: `from collections import Counter


def solve(nums, k):
    freq = Counter(nums)
    items = sorted(freq.items(), key=lambda pair: (-pair[1], pair[0]))
    return [value for value, _ in items[:k]]


def main():
    import sys
    data = sys.stdin.read().strip().split()
    if not data:
        return
    n = int(data[0])
    nums = list(map(int, data[1:1 + n]))
    k = int(data[1 + n])
    ans = solve(nums, k)
    print(" ".join(map(str, ans)))


if __name__ == "__main__":
    main()
`,
    testCases: [
      { id: "TC1", input: "6\n1 1 1 2 2 3\n2\n", expectedOutput: "1 2" },
      { id: "TC2", input: "8\n4 4 5 5 5 6 6 6\n2\n", expectedOutput: "5 6" },
      { id: "TC3", input: "5\n9 8 7 6 5\n3\n", expectedOutput: "5 6 7" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "7\n2 2 2 1 1 3 4\n2\n", expectedOutput: "2 1" },
      { id: "H2", input: "4\n10 10 10 10\n1\n", expectedOutput: "10" }
    ]
  }),
  makeQuestion({
    id: "py-product-except-self",
    language: "python",
    slug: "pythonic-patterns",
    topic: "Pythonic Patterns",
    topicCue: "Hash maps, iterable patterns, clean output formatting",
    difficulty: "Medium",
    title: "Product Of Array Except Self",
    description:
      "For each position i, return product of all numbers except nums[i] without using division.",
    inputFormat: "Line 1: n | Line 2: n integers",
    outputFormat: "n integers separated by space",
    constraints: ["2 <= n <= 100000"],
    starter: `def solve(nums):
    n = len(nums)
    answer = [1] * n

    # CORE_START
    prefix = 1
    for i in range(n):
        # TODO: store prefix product and update prefix
        pass

    suffix = 1
    for i in range(n - 1, -1, -1):
        # TODO: multiply suffix contribution and update suffix
        pass
    # CORE_END

    return answer


def main():
    import sys
    data = sys.stdin.read().strip().split()
    if not data:
        return
    n = int(data[0])
    nums = list(map(int, data[1:1 + n]))
    ans = solve(nums)
    print(" ".join(map(str, ans)))


if __name__ == "__main__":
    main()
`,
    reference: `def solve(nums):
    n = len(nums)
    answer = [1] * n

    prefix = 1
    for i in range(n):
        answer[i] = prefix
        prefix *= nums[i]

    suffix = 1
    for i in range(n - 1, -1, -1):
        answer[i] *= suffix
        suffix *= nums[i]

    return answer


def main():
    import sys
    data = sys.stdin.read().strip().split()
    if not data:
        return
    n = int(data[0])
    nums = list(map(int, data[1:1 + n]))
    ans = solve(nums)
    print(" ".join(map(str, ans)))


if __name__ == "__main__":
    main()
`,
    testCases: [
      { id: "TC1", input: "4\n1 2 3 4\n", expectedOutput: "24 12 8 6" },
      { id: "TC2", input: "5\n-1 1 0 -3 3\n", expectedOutput: "0 0 9 0 0" },
      { id: "TC3", input: "3\n2 3 4\n", expectedOutput: "12 8 6" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "2\n5 6\n", expectedOutput: "6 5" },
      { id: "H2", input: "4\n0 0 2 3\n", expectedOutput: "0 0 0 0" }
    ]
  }),
  makeQuestion({
    id: "py-merge-intervals-count",
    language: "python",
    slug: "pythonic-patterns",
    topic: "Pythonic Patterns",
    topicCue: "Hash maps, iterable patterns, clean output formatting",
    difficulty: "Medium",
    title: "Merge Intervals Count",
    description:
      "Merge overlapping intervals and output the number of merged intervals.",
    inputFormat: "Line 1: n | Next n lines: start end",
    outputFormat: "Single integer",
    constraints: ["1 <= n <= 200000"],
    starter: `def solve(intervals):
    if not intervals:
        return 0

    intervals.sort()
    merged = [intervals[0][:]]

    # CORE_START
    for start, end in intervals[1:]:
        last = merged[-1]
        # TODO: merge overlap or append new interval
    # CORE_END

    return len(merged)


def main():
    import sys
    data = sys.stdin.read().strip().split()
    if not data:
        return
    n = int(data[0])
    intervals = []
    idx = 1
    for _ in range(n):
        left = int(data[idx])
        right = int(data[idx + 1])
        idx += 2
        intervals.append([left, right])
    print(solve(intervals))


if __name__ == "__main__":
    main()
`,
    reference: `def solve(intervals):
    if not intervals:
        return 0

    intervals.sort()
    merged = [intervals[0][:]]

    for start, end in intervals[1:]:
        last = merged[-1]
        if start <= last[1]:
            last[1] = max(last[1], end)
        else:
            merged.append([start, end])

    return len(merged)


def main():
    import sys
    data = sys.stdin.read().strip().split()
    if not data:
        return
    n = int(data[0])
    intervals = []
    idx = 1
    for _ in range(n):
        left = int(data[idx])
        right = int(data[idx + 1])
        idx += 2
        intervals.append([left, right])
    print(solve(intervals))


if __name__ == "__main__":
    main()
`,
    testCases: [
      { id: "TC1", input: "4\n1 3\n2 4\n6 8\n7 9\n", expectedOutput: "2" },
      { id: "TC2", input: "3\n1 2\n3 4\n5 6\n", expectedOutput: "3" },
      { id: "TC3", input: "5\n1 10\n2 3\n4 8\n11 12\n12 15\n", expectedOutput: "2" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "1\n5 7\n", expectedOutput: "1" },
      { id: "H2", input: "4\n1 5\n5 6\n6 7\n9 10\n", expectedOutput: "2" }
    ]
  }),
  makeQuestion({
    id: "py-group-anagrams-count",
    language: "python",
    slug: "pythonic-patterns",
    topic: "Pythonic Patterns",
    topicCue: "Hash maps, iterable patterns, clean output formatting",
    difficulty: "Medium",
    title: "Group Anagrams Count",
    description:
      "Given words, group anagrams together and output only the number of groups.",
    inputFormat: "Line 1: n | Line 2: n lowercase words",
    outputFormat: "Single integer",
    constraints: ["1 <= n <= 50000"],
    starter: `def solve(words):
    groups = {}

    # CORE_START
    for word in words:
        key = "".join(sorted(word))
        # TODO: place word into groups[key]
        pass
    # CORE_END

    return len(groups)


def main():
    import sys
    data = sys.stdin.read().strip().split()
    if not data:
        return
    n = int(data[0])
    words = data[1:1 + n]
    print(solve(words))


if __name__ == "__main__":
    main()
`,
    reference: `def solve(words):
    groups = {}
    for word in words:
        key = "".join(sorted(word))
        if key not in groups:
            groups[key] = []
        groups[key].append(word)
    return len(groups)


def main():
    import sys
    data = sys.stdin.read().strip().split()
    if not data:
        return
    n = int(data[0])
    words = data[1:1 + n]
    print(solve(words))


if __name__ == "__main__":
    main()
`,
    testCases: [
      { id: "TC1", input: "6\neat tea tan ate nat bat\n", expectedOutput: "3" },
      { id: "TC2", input: "4\nabc bca cab xyz\n", expectedOutput: "2" },
      { id: "TC3", input: "3\na b c\n", expectedOutput: "3" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "5\naa aa aa aa aa\n", expectedOutput: "1" },
      { id: "H2", input: "5\nab ba abc cba bca\n", expectedOutput: "2" }
    ]
  }),
  makeQuestion({
    id: "py-balanced-brackets",
    language: "python",
    slug: "pythonic-patterns",
    topic: "Pythonic Patterns",
    topicCue: "Hash maps, iterable patterns, clean output formatting",
    difficulty: "Easy",
    title: "Balanced Brackets",
    description:
      "Check if a bracket string is balanced. Return YES or NO.",
    inputFormat: "Line 1: bracket string",
    outputFormat: "YES or NO",
    constraints: ["1 <= len(s) <= 200000"],
    starter: `def solve(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []

    # CORE_START
    for ch in s:
        # TODO: update stack for opening/closing brackets
        pass
    # CORE_END

    return "YES" if not stack else "NO"


def main():
    import sys
    tokens = sys.stdin.read().strip().split()
    if not tokens:
        return
    print(solve(tokens[0]))


if __name__ == "__main__":
    main()
`,
    reference: `def solve(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []

    for ch in s:
        if ch in "([{":
            stack.append(ch)
        else:
            if not stack or stack[-1] != pairs.get(ch):
                return "NO"
            stack.pop()

    return "YES" if not stack else "NO"


def main():
    import sys
    tokens = sys.stdin.read().strip().split()
    if not tokens:
        return
    print(solve(tokens[0]))


if __name__ == "__main__":
    main()
`,
    testCases: [
      { id: "TC1", input: "{[()]}\n", expectedOutput: "YES" },
      { id: "TC2", input: "([)]\n", expectedOutput: "NO" },
      { id: "TC3", input: "(((()\n", expectedOutput: "NO" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "()[]{}\n", expectedOutput: "YES" },
      { id: "H2", input: "{[(])}\n", expectedOutput: "NO" }
    ]
  })
];

const javaQuestions = [
  makeQuestion({
    id: "java-first-unique-index",
    language: "java",
    slug: "java-collections-studio",
    topic: "Java Collections Studio",
    topicCue: "HashMap, HashSet, PriorityQueue and string workflows",
    difficulty: "Easy",
    title: "First Unique Character Index",
    description: "Return index of first non-repeating character, else -1.",
    inputFormat: "Line 1: lowercase string s",
    outputFormat: "Single integer",
    constraints: ["1 <= len(s) <= 200000"],
    starter: `import java.util.*;

public class Main {
    static int solve(String s) {
        Map<Character, Integer> freq = new HashMap<>();

        // CORE_START
        for (char ch : s.toCharArray()) {
            // TODO: build frequency map
        }

        for (int i = 0; i < s.length(); i++) {
            // TODO: return first index where frequency is 1
        }
        // CORE_END

        return -1;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String s = sc.next();
        System.out.println(solve(s));
    }
}
`,
    reference: `import java.util.*;

public class Main {
    static int solve(String s) {
        Map<Character, Integer> freq = new HashMap<>();

        for (char ch : s.toCharArray()) {
            freq.put(ch, freq.getOrDefault(ch, 0) + 1);
        }

        for (int i = 0; i < s.length(); i++) {
            if (freq.get(s.charAt(i)) == 1) {
                return i;
            }
        }

        return -1;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String s = sc.next();
        System.out.println(solve(s));
    }
}
`,
    testCases: [
      { id: "TC1", input: "leetcode\n", expectedOutput: "0" },
      { id: "TC2", input: "loveleetcode\n", expectedOutput: "2" },
      { id: "TC3", input: "aabb\n", expectedOutput: "-1" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "z\n", expectedOutput: "0" },
      { id: "H2", input: "xxyz\n", expectedOutput: "2" }
    ]
  }),
  makeQuestion({
    id: "java-valid-parentheses",
    language: "java",
    slug: "java-collections-studio",
    topic: "Java Collections Studio",
    topicCue: "HashMap, HashSet, PriorityQueue and string workflows",
    difficulty: "Easy",
    title: "Valid Parentheses",
    description: "Check if all brackets are validly opened and closed.",
    inputFormat: "Line 1: bracket string",
    outputFormat: "YES or NO",
    constraints: ["1 <= len(s) <= 200000"],
    starter: `import java.util.*;

public class Main {
    static String solve(String s) {
        Deque<Character> stack = new ArrayDeque<>();

        // CORE_START
        for (char ch : s.toCharArray()) {
            // TODO: push opens and validate closes
        }
        // CORE_END

        return stack.isEmpty() ? "YES" : "NO";
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String s = sc.next();
        System.out.println(solve(s));
    }
}
`,
    reference: `import java.util.*;

public class Main {
    static String solve(String s) {
        Deque<Character> stack = new ArrayDeque<>();

        for (char ch : s.toCharArray()) {
            if (ch == '(' || ch == '[' || ch == '{') {
                stack.push(ch);
            } else {
                if (stack.isEmpty()) return "NO";
                char top = stack.pop();
                if ((ch == ')' && top != '(') ||
                    (ch == ']' && top != '[') ||
                    (ch == '}' && top != '{')) {
                    return "NO";
                }
            }
        }

        return stack.isEmpty() ? "YES" : "NO";
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String s = sc.next();
        System.out.println(solve(s));
    }
}
`,
    testCases: [
      { id: "TC1", input: "{[()]}\n", expectedOutput: "YES" },
      { id: "TC2", input: "([)]\n", expectedOutput: "NO" },
      { id: "TC3", input: "(((()\n", expectedOutput: "NO" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "()[]{}\n", expectedOutput: "YES" },
      { id: "H2", input: "{[(])}\n", expectedOutput: "NO" }
    ]
  }),
  makeQuestion({
    id: "java-kth-largest",
    language: "java",
    slug: "java-collections-studio",
    topic: "Java Collections Studio",
    topicCue: "HashMap, HashSet, PriorityQueue and string workflows",
    difficulty: "Medium",
    title: "Kth Largest Element",
    description: "Find the kth largest element in an unsorted array.",
    inputFormat: "Line 1: n | Line 2: n integers | Line 3: k",
    outputFormat: "Single integer",
    constraints: ["1 <= n <= 100000", "1 <= k <= n"],
    starter: `import java.util.*;

public class Main {
    static int solve(int[] nums, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();

        // CORE_START
        for (int value : nums) {
            // TODO: maintain min-heap of size k
        }
        // CORE_END

        return heap.isEmpty() ? -1 : heap.peek();
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int k = sc.nextInt();
        System.out.println(solve(nums, k));
    }
}
`,
    reference: `import java.util.*;

public class Main {
    static int solve(int[] nums, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();

        for (int value : nums) {
            heap.offer(value);
            if (heap.size() > k) {
                heap.poll();
            }
        }

        return heap.peek();
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int k = sc.nextInt();
        System.out.println(solve(nums, k));
    }
}
`,
    testCases: [
      { id: "TC1", input: "6\n3 2 1 5 6 4\n2\n", expectedOutput: "5" },
      { id: "TC2", input: "9\n3 2 3 1 2 4 5 5 6\n4\n", expectedOutput: "4" },
      { id: "TC3", input: "1\n10\n1\n", expectedOutput: "10" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "5\n-1 -2 -3 -4 -5\n2\n", expectedOutput: "-2" },
      { id: "H2", input: "7\n9 9 9 8 8 7 7\n3\n", expectedOutput: "9" }
    ]
  }),
  makeQuestion({
    id: "java-longest-consecutive",
    language: "java",
    slug: "java-collections-studio",
    topic: "Java Collections Studio",
    topicCue: "HashMap, HashSet, PriorityQueue and string workflows",
    difficulty: "Medium",
    title: "Longest Consecutive Sequence",
    description: "Return length of longest consecutive sequence in an unsorted array.",
    inputFormat: "Line 1: n | Line 2: n integers",
    outputFormat: "Single integer",
    constraints: ["0 <= n <= 200000"],
    starter: `import java.util.*;

public class Main {
    static int solve(int[] nums) {
        Set<Integer> values = new HashSet<>();
        for (int value : nums) values.add(value);

        int best = 0;

        // CORE_START
        for (int value : values) {
            // TODO: start streak when value-1 does not exist
        }
        // CORE_END

        return best;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        System.out.println(solve(nums));
    }
}
`,
    reference: `import java.util.*;

public class Main {
    static int solve(int[] nums) {
        Set<Integer> values = new HashSet<>();
        for (int value : nums) values.add(value);

        int best = 0;

        for (int value : values) {
            if (!values.contains(value - 1)) {
                int current = value;
                int length = 1;
                while (values.contains(current + 1)) {
                    current += 1;
                    length += 1;
                }
                best = Math.max(best, length);
            }
        }

        return best;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        System.out.println(solve(nums));
    }
}
`,
    testCases: [
      { id: "TC1", input: "6\n100 4 200 1 3 2\n", expectedOutput: "4" },
      { id: "TC2", input: "10\n0 3 7 2 5 8 4 6 0 1\n", expectedOutput: "9" },
      { id: "TC3", input: "0\n\n", expectedOutput: "0" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "5\n9 1 -3 2 4\n", expectedOutput: "2" },
      { id: "H2", input: "5\n1 2 2 3 4\n", expectedOutput: "4" }
    ]
  }),
  makeQuestion({
    id: "java-frequency-sort-string",
    language: "java",
    slug: "java-collections-studio",
    topic: "Java Collections Studio",
    topicCue: "HashMap, HashSet, PriorityQueue and string workflows",
    difficulty: "Medium",
    title: "Sort Characters By Frequency",
    description:
      "Sort characters by descending frequency; tie-break by character ascending.",
    inputFormat: "Line 1: string s",
    outputFormat: "String",
    constraints: ["1 <= len(s) <= 200000"],
    starter: `import java.util.*;

public class Main {
    static String solve(String s) {
        Map<Character, Integer> freq = new HashMap<>();
        for (char ch : s.toCharArray()) {
            freq.put(ch, freq.getOrDefault(ch, 0) + 1);
        }

        List<Character> keys = new ArrayList<>(freq.keySet());

        // CORE_START
        // TODO: sort keys by frequency desc then character asc
        StringBuilder builder = new StringBuilder();
        // TODO: append each character freq times
        // CORE_END

        return "";
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String s = sc.next();
        System.out.println(solve(s));
    }
}
`,
    reference: `import java.util.*;

public class Main {
    static String solve(String s) {
        Map<Character, Integer> freq = new HashMap<>();
        for (char ch : s.toCharArray()) {
            freq.put(ch, freq.getOrDefault(ch, 0) + 1);
        }

        List<Character> keys = new ArrayList<>(freq.keySet());
        keys.sort((a, b) -> {
            int cmp = Integer.compare(freq.get(b), freq.get(a));
            if (cmp != 0) return cmp;
            return Character.compare(a, b);
        });

        StringBuilder builder = new StringBuilder();
        for (char ch : keys) {
            int count = freq.get(ch);
            for (int i = 0; i < count; i++) {
                builder.append(ch);
            }
        }

        return builder.toString();
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String s = sc.next();
        System.out.println(solve(s));
    }
}
`,
    testCases: [
      { id: "TC1", input: "tree\n", expectedOutput: "eert" },
      { id: "TC2", input: "cccaaa\n", expectedOutput: "aaaccc" },
      { id: "TC3", input: "Aabb\n", expectedOutput: "bbAa" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "zzzyyyx\n", expectedOutput: "yyyzzzx" },
      { id: "H2", input: "ab\n", expectedOutput: "ab" }
    ]
  }),
  makeQuestion({
    id: "java-pair-sum-count",
    language: "java",
    slug: "java-collections-studio",
    topic: "Java Collections Studio",
    topicCue: "HashMap, HashSet, PriorityQueue and string workflows",
    difficulty: "Medium",
    title: "Pair Sum Count",
    description:
      "Count index pairs (i < j) such that nums[i] + nums[j] == target.",
    inputFormat: "Line 1: n | Line 2: n integers | Line 3: target",
    outputFormat: "Single integer",
    constraints: ["1 <= n <= 200000"],
    starter: `import java.util.*;

public class Main {
    static long solve(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        long pairs = 0;

        // CORE_START
        for (int value : nums) {
            // TODO: count complements from seen and update seen
        }
        // CORE_END

        return pairs;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();
        System.out.println(solve(nums, target));
    }
}
`,
    reference: `import java.util.*;

public class Main {
    static long solve(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        long pairs = 0;

        for (int value : nums) {
            int need = target - value;
            pairs += seen.getOrDefault(need, 0);
            seen.put(value, seen.getOrDefault(value, 0) + 1);
        }

        return pairs;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();
        System.out.println(solve(nums, target));
    }
}
`,
    testCases: [
      { id: "TC1", input: "5\n1 2 3 4 5\n6\n", expectedOutput: "2" },
      { id: "TC2", input: "4\n3 3 3 3\n6\n", expectedOutput: "6" },
      { id: "TC3", input: "5\n1 1 1 1 1\n3\n", expectedOutput: "0" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "6\n-1 1 2 -2 3 -3\n0\n", expectedOutput: "3" },
      { id: "H2", input: "1\n10\n10\n", expectedOutput: "0" }
    ]
  }),
  makeQuestion({
    id: "java-anagram-delete-count",
    language: "java",
    slug: "java-collections-studio",
    topic: "Java Collections Studio",
    topicCue: "HashMap, HashSet, PriorityQueue and string workflows",
    difficulty: "Easy",
    title: "Minimum Deletions For Anagram",
    description:
      "Given two lowercase strings, return minimum deletions needed to make them anagrams.",
    inputFormat: "Line 1: s1 | Line 2: s2",
    outputFormat: "Single integer",
    constraints: ["1 <= len(s1), len(s2) <= 200000"],
    starter: `import java.util.*;

public class Main {
    static int solve(String a, String b) {
        int[] freq = new int[26];

        // CORE_START
        for (char ch : a.toCharArray()) {
            // TODO: increment frequency
        }
        for (char ch : b.toCharArray()) {
            // TODO: decrement frequency
        }
        // CORE_END

        int deletions = 0;
        for (int value : freq) deletions += Math.abs(value);
        return deletions;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String a = sc.next();
        String b = sc.next();
        System.out.println(solve(a, b));
    }
}
`,
    reference: `import java.util.*;

public class Main {
    static int solve(String a, String b) {
        int[] freq = new int[26];

        for (char ch : a.toCharArray()) {
            freq[ch - 'a'] += 1;
        }
        for (char ch : b.toCharArray()) {
            freq[ch - 'a'] -= 1;
        }

        int deletions = 0;
        for (int value : freq) deletions += Math.abs(value);
        return deletions;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String a = sc.next();
        String b = sc.next();
        System.out.println(solve(a, b));
    }
}
`,
    testCases: [
      { id: "TC1", input: "cde\nabc\n", expectedOutput: "4" },
      { id: "TC2", input: "showman\nwoman\n", expectedOutput: "2" },
      { id: "TC3", input: "aabbcc\nabccdd\n", expectedOutput: "4" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "abc\nabc\n", expectedOutput: "0" },
      { id: "H2", input: "aaaa\nbbbb\n", expectedOutput: "8" }
    ]
  })
];
const cppQuestions = [
  makeQuestion({
    id: "cpp-shortest-path-unweighted",
    language: "cpp",
    slug: "stl-graph-lab",
    topic: "STL Graph Lab",
    topicCue: "Graph traversals, shortest paths, cycle and component checks",
    difficulty: "Medium",
    title: "Shortest Path In Unweighted Graph",
    description:
      "Given an undirected graph, return shortest number of edges between source and target.",
    inputFormat: "Line 1: n m | Next m lines: u v | Last line: s t",
    outputFormat: "Single integer distance or -1",
    constraints: ["1 <= n <= 200000"],
    starter: `#include <iostream>
#include <vector>
#include <queue>
using namespace std;

int solve(int n, const vector<vector<int>>& graph, int s, int t) {
    vector<int> dist(n + 1, -1);
    queue<int> q;

    // CORE_START
    q.push(s);
    dist[s] = 0;
    while (!q.empty()) {
        int node = q.front();
        q.pop();
        // TODO: standard BFS relaxation
    }
    // CORE_END

    return dist[t];
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n = 0, m = 0;
    if (!(cin >> n >> m)) return 0;

    vector<vector<int>> graph(n + 1);
    for (int i = 0; i < m; i++) {
        int u = 0, v = 0;
        cin >> u >> v;
        graph[u].push_back(v);
        graph[v].push_back(u);
    }

    int s = 0, t = 0;
    cin >> s >> t;

    cout << solve(n, graph, s, t) << "\\n";
    return 0;
}
`,
    reference: `#include <iostream>
#include <vector>
#include <queue>
using namespace std;

int solve(int n, const vector<vector<int>>& graph, int s, int t) {
    vector<int> dist(n + 1, -1);
    queue<int> q;

    q.push(s);
    dist[s] = 0;

    while (!q.empty()) {
        int node = q.front();
        q.pop();
        for (int next : graph[node]) {
            if (dist[next] == -1) {
                dist[next] = dist[node] + 1;
                q.push(next);
            }
        }
    }

    return dist[t];
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n = 0, m = 0;
    if (!(cin >> n >> m)) return 0;

    vector<vector<int>> graph(n + 1);
    for (int i = 0; i < m; i++) {
        int u = 0, v = 0;
        cin >> u >> v;
        graph[u].push_back(v);
        graph[v].push_back(u);
    }

    int s = 0, t = 0;
    cin >> s >> t;

    cout << solve(n, graph, s, t) << "\\n";
    return 0;
}
`,
    testCases: [
      { id: "TC1", input: "5 4\n1 2\n2 3\n3 4\n4 5\n1 5\n", expectedOutput: "4" },
      { id: "TC2", input: "4 2\n1 2\n3 4\n1 4\n", expectedOutput: "-1" },
      { id: "TC3", input: "6 7\n1 2\n2 3\n3 6\n1 4\n4 5\n5 6\n2 5\n1 6\n", expectedOutput: "3" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "2 1\n1 2\n1 2\n", expectedOutput: "1" },
      { id: "H2", input: "3 0\n1 3\n", expectedOutput: "-1" }
    ]
  }),
  makeQuestion({
    id: "cpp-connected-components",
    language: "cpp",
    slug: "stl-graph-lab",
    topic: "STL Graph Lab",
    topicCue: "Graph traversals, shortest paths, cycle and component checks",
    difficulty: "Easy",
    title: "Connected Components Count",
    description: "Count connected components in an undirected graph.",
    inputFormat: "Line 1: n m | Next m lines: u v",
    outputFormat: "Single integer",
    constraints: ["1 <= n <= 200000"],
    starter: `#include <iostream>
#include <vector>
#include <queue>
using namespace std;

int solve(int n, const vector<vector<int>>& graph) {
    vector<int> visited(n + 1, 0);
    int components = 0;

    // CORE_START
    for (int node = 1; node <= n; node++) {
        // TODO: BFS/DFS from unvisited node and increment components
    }
    // CORE_END

    return components;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n = 0, m = 0;
    if (!(cin >> n >> m)) return 0;
    vector<vector<int>> graph(n + 1);
    for (int i = 0; i < m; i++) {
        int u = 0, v = 0;
        cin >> u >> v;
        graph[u].push_back(v);
        graph[v].push_back(u);
    }
    cout << solve(n, graph) << "\\n";
    return 0;
}
`,
    reference: `#include <iostream>
#include <vector>
#include <queue>
using namespace std;

int solve(int n, const vector<vector<int>>& graph) {
    vector<int> visited(n + 1, 0);
    int components = 0;

    for (int node = 1; node <= n; node++) {
        if (visited[node]) continue;
        components += 1;

        queue<int> q;
        q.push(node);
        visited[node] = 1;

        while (!q.empty()) {
            int current = q.front();
            q.pop();
            for (int next : graph[current]) {
                if (!visited[next]) {
                    visited[next] = 1;
                    q.push(next);
                }
            }
        }
    }

    return components;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n = 0, m = 0;
    if (!(cin >> n >> m)) return 0;
    vector<vector<int>> graph(n + 1);
    for (int i = 0; i < m; i++) {
        int u = 0, v = 0;
        cin >> u >> v;
        graph[u].push_back(v);
        graph[v].push_back(u);
    }
    cout << solve(n, graph) << "\\n";
    return 0;
}
`,
    testCases: [
      { id: "TC1", input: "5 2\n1 2\n4 5\n", expectedOutput: "3" },
      { id: "TC2", input: "4 3\n1 2\n2 3\n3 4\n", expectedOutput: "1" },
      { id: "TC3", input: "3 0\n", expectedOutput: "3" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "1 0\n", expectedOutput: "1" },
      { id: "H2", input: "6 3\n1 2\n2 3\n4 5\n", expectedOutput: "3" }
    ]
  }),
  makeQuestion({
    id: "cpp-bipartite-check",
    language: "cpp",
    slug: "stl-graph-lab",
    topic: "STL Graph Lab",
    topicCue: "Graph traversals, shortest paths, cycle and component checks",
    difficulty: "Medium",
    title: "Bipartite Graph Check",
    description: "Return YES if undirected graph is bipartite, else NO.",
    inputFormat: "Line 1: n m | Next m lines: u v",
    outputFormat: "YES or NO",
    constraints: ["1 <= n <= 200000"],
    starter: `#include <iostream>
#include <vector>
#include <queue>
using namespace std;

string solve(int n, const vector<vector<int>>& graph) {
    vector<int> color(n + 1, -1);

    // CORE_START
    for (int node = 1; node <= n; node++) {
        // TODO: BFS coloring across all components
    }
    // CORE_END

    return "YES";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n = 0, m = 0;
    if (!(cin >> n >> m)) return 0;
    vector<vector<int>> graph(n + 1);
    for (int i = 0; i < m; i++) {
        int u = 0, v = 0;
        cin >> u >> v;
        graph[u].push_back(v);
        graph[v].push_back(u);
    }
    cout << solve(n, graph) << "\\n";
    return 0;
}
`,
    reference: `#include <iostream>
#include <vector>
#include <queue>
using namespace std;

string solve(int n, const vector<vector<int>>& graph) {
    vector<int> color(n + 1, -1);

    for (int node = 1; node <= n; node++) {
        if (color[node] != -1) continue;

        queue<int> q;
        q.push(node);
        color[node] = 0;

        while (!q.empty()) {
            int current = q.front();
            q.pop();

            for (int next : graph[current]) {
                if (color[next] == -1) {
                    color[next] = color[current] ^ 1;
                    q.push(next);
                } else if (color[next] == color[current]) {
                    return "NO";
                }
            }
        }
    }

    return "YES";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n = 0, m = 0;
    if (!(cin >> n >> m)) return 0;
    vector<vector<int>> graph(n + 1);
    for (int i = 0; i < m; i++) {
        int u = 0, v = 0;
        cin >> u >> v;
        graph[u].push_back(v);
        graph[v].push_back(u);
    }
    cout << solve(n, graph) << "\\n";
    return 0;
}
`,
    testCases: [
      { id: "TC1", input: "4 4\n1 2\n2 3\n3 4\n4 1\n", expectedOutput: "YES" },
      { id: "TC2", input: "3 3\n1 2\n2 3\n1 3\n", expectedOutput: "NO" },
      { id: "TC3", input: "5 2\n1 2\n4 5\n", expectedOutput: "YES" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "1 0\n", expectedOutput: "YES" },
      { id: "H2", input: "5 5\n1 2\n2 3\n3 4\n4 5\n5 1\n", expectedOutput: "NO" }
    ]
  }),
  makeQuestion({
    id: "cpp-count-islands",
    language: "cpp",
    slug: "stl-graph-lab",
    topic: "STL Graph Lab",
    topicCue: "Graph traversals, shortest paths, cycle and component checks",
    difficulty: "Medium",
    title: "Count Islands In Grid",
    description: "Given binary grid, count number of islands using 4-direction movement.",
    inputFormat: "Line 1: r c | Next r lines: binary string length c",
    outputFormat: "Single integer",
    constraints: ["1 <= r, c <= 1000"],
    starter: `#include <iostream>
#include <vector>
#include <queue>
#include <string>
using namespace std;

int solve(const vector<string>& grid) {
    int rows = (int)grid.size();
    int cols = rows ? (int)grid[0].size() : 0;
    vector<vector<int>> visited(rows, vector<int>(cols, 0));
    int islands = 0;

    const int dr[4] = {1, -1, 0, 0};
    const int dc[4] = {0, 0, 1, -1};

    // CORE_START
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            // TODO: BFS flood fill for unvisited land cell
        }
    }
    // CORE_END

    return islands;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int r = 0, c = 0;
    if (!(cin >> r >> c)) return 0;
    vector<string> grid(r);
    for (int i = 0; i < r; i++) cin >> grid[i];
    cout << solve(grid) << "\\n";
    return 0;
}
`,
    reference: `#include <iostream>
#include <vector>
#include <queue>
#include <string>
using namespace std;

int solve(const vector<string>& grid) {
    int rows = (int)grid.size();
    int cols = rows ? (int)grid[0].size() : 0;
    vector<vector<int>> visited(rows, vector<int>(cols, 0));
    int islands = 0;

    const int dr[4] = {1, -1, 0, 0};
    const int dc[4] = {0, 0, 1, -1};

    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] != '1' || visited[r][c]) continue;
            islands += 1;

            queue<pair<int, int>> q;
            q.push({r, c});
            visited[r][c] = 1;

            while (!q.empty()) {
                auto [cr, cc] = q.front();
                q.pop();
                for (int k = 0; k < 4; k++) {
                    int nr = cr + dr[k];
                    int nc = cc + dc[k];
                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
                    if (grid[nr][nc] != '1' || visited[nr][nc]) continue;
                    visited[nr][nc] = 1;
                    q.push({nr, nc});
                }
            }
        }
    }

    return islands;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int r = 0, c = 0;
    if (!(cin >> r >> c)) return 0;
    vector<string> grid(r);
    for (int i = 0; i < r; i++) cin >> grid[i];
    cout << solve(grid) << "\\n";
    return 0;
}
`,
    testCases: [
      { id: "TC1", input: "4 5\n11000\n11000\n00100\n00011\n", expectedOutput: "3" },
      { id: "TC2", input: "3 3\n111\n111\n111\n", expectedOutput: "1" },
      { id: "TC3", input: "2 4\n0000\n0000\n", expectedOutput: "0" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "1 1\n1\n", expectedOutput: "1" },
      { id: "H2", input: "3 4\n1010\n0101\n1010\n", expectedOutput: "6" }
    ]
  }),
  makeQuestion({
    id: "cpp-dijkstra-shortest-path",
    language: "cpp",
    slug: "stl-graph-lab",
    topic: "STL Graph Lab",
    topicCue: "Graph traversals, shortest paths, cycle and component checks",
    difficulty: "Hard",
    title: "Dijkstra Shortest Path",
    description:
      "Given weighted undirected graph, return shortest distance from s to t.",
    inputFormat: "Line 1: n m | Next m lines: u v w | Last line: s t",
    outputFormat: "Single integer distance or -1",
    constraints: ["1 <= n <= 200000", "1 <= w <= 1e9"],
    starter: `#include <iostream>
#include <vector>
#include <queue>
#include <limits>
using namespace std;

long long solve(int n, const vector<vector<pair<int, int>>>& graph, int s, int t) {
    const long long INF = numeric_limits<long long>::max() / 4;
    vector<long long> dist(n + 1, INF);

    using State = pair<long long, int>;
    priority_queue<State, vector<State>, greater<State>> pq;

    // CORE_START
    dist[s] = 0;
    pq.push({0, s});

    while (!pq.empty()) {
        auto [d, node] = pq.top();
        pq.pop();
        // TODO: relax outgoing edges
    }
    // CORE_END

    return dist[t] >= INF ? -1 : dist[t];
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n = 0, m = 0;
    if (!(cin >> n >> m)) return 0;

    vector<vector<pair<int, int>>> graph(n + 1);
    for (int i = 0; i < m; i++) {
        int u = 0, v = 0, w = 0;
        cin >> u >> v >> w;
        graph[u].push_back({v, w});
        graph[v].push_back({u, w});
    }

    int s = 0, t = 0;
    cin >> s >> t;

    cout << solve(n, graph, s, t) << "\\n";
    return 0;
}
`,
    reference: `#include <iostream>
#include <vector>
#include <queue>
#include <limits>
using namespace std;

long long solve(int n, const vector<vector<pair<int, int>>>& graph, int s, int t) {
    const long long INF = numeric_limits<long long>::max() / 4;
    vector<long long> dist(n + 1, INF);

    using State = pair<long long, int>;
    priority_queue<State, vector<State>, greater<State>> pq;

    dist[s] = 0;
    pq.push({0, s});

    while (!pq.empty()) {
        auto [d, node] = pq.top();
        pq.pop();
        if (d != dist[node]) continue;

        for (auto [next, weight] : graph[node]) {
            long long candidate = d + weight;
            if (candidate < dist[next]) {
                dist[next] = candidate;
                pq.push({candidate, next});
            }
        }
    }

    return dist[t] >= INF ? -1 : dist[t];
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n = 0, m = 0;
    if (!(cin >> n >> m)) return 0;

    vector<vector<pair<int, int>>> graph(n + 1);
    for (int i = 0; i < m; i++) {
        int u = 0, v = 0, w = 0;
        cin >> u >> v >> w;
        graph[u].push_back({v, w});
        graph[v].push_back({u, w});
    }

    int s = 0, t = 0;
    cin >> s >> t;

    cout << solve(n, graph, s, t) << "\\n";
    return 0;
}
`,
    testCases: [
      { id: "TC1", input: "5 6\n1 2 2\n2 3 3\n3 5 1\n1 4 10\n4 5 2\n2 5 8\n1 5\n", expectedOutput: "6" },
      { id: "TC2", input: "4 2\n1 2 5\n3 4 7\n1 4\n", expectedOutput: "-1" },
      { id: "TC3", input: "3 3\n1 2 1\n2 3 1\n1 3 5\n1 3\n", expectedOutput: "2" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "2 1\n1 2 9\n1 2\n", expectedOutput: "9" },
      { id: "H2", input: "6 7\n1 2 4\n2 3 2\n3 6 1\n1 4 1\n4 5 1\n5 6 1\n2 6 10\n1 6\n", expectedOutput: "3" }
    ]
  }),
  makeQuestion({
    id: "cpp-dag-possible",
    language: "cpp",
    slug: "stl-graph-lab",
    topic: "STL Graph Lab",
    topicCue: "Graph traversals, shortest paths, cycle and component checks",
    difficulty: "Medium",
    title: "Is DAG Possible",
    description: "Given directed graph, return YES if it is acyclic else NO.",
    inputFormat: "Line 1: n m | Next m lines: u v",
    outputFormat: "YES or NO",
    constraints: ["1 <= n <= 200000"],
    starter: `#include <iostream>
#include <vector>
#include <queue>
using namespace std;

string solve(int n, const vector<vector<int>>& graph, vector<int> indegree) {
    queue<int> q;

    // CORE_START
    for (int node = 1; node <= n; node++) {
        if (indegree[node] == 0) q.push(node);
    }

    int seen = 0;
    while (!q.empty()) {
        int node = q.front();
        q.pop();
        // TODO: consume node and relax indegrees
    }
    // CORE_END

    return "NO";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n = 0, m = 0;
    if (!(cin >> n >> m)) return 0;

    vector<vector<int>> graph(n + 1);
    vector<int> indegree(n + 1, 0);

    for (int i = 0; i < m; i++) {
        int u = 0, v = 0;
        cin >> u >> v;
        graph[u].push_back(v);
        indegree[v] += 1;
    }

    cout << solve(n, graph, indegree) << "\\n";
    return 0;
}
`,
    reference: `#include <iostream>
#include <vector>
#include <queue>
using namespace std;

string solve(int n, const vector<vector<int>>& graph, vector<int> indegree) {
    queue<int> q;

    for (int node = 1; node <= n; node++) {
        if (indegree[node] == 0) q.push(node);
    }

    int seen = 0;
    while (!q.empty()) {
        int node = q.front();
        q.pop();
        seen += 1;

        for (int next : graph[node]) {
            indegree[next] -= 1;
            if (indegree[next] == 0) q.push(next);
        }
    }

    return seen == n ? "YES" : "NO";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n = 0, m = 0;
    if (!(cin >> n >> m)) return 0;

    vector<vector<int>> graph(n + 1);
    vector<int> indegree(n + 1, 0);

    for (int i = 0; i < m; i++) {
        int u = 0, v = 0;
        cin >> u >> v;
        graph[u].push_back(v);
        indegree[v] += 1;
    }

    cout << solve(n, graph, indegree) << "\\n";
    return 0;
}
`,
    testCases: [
      { id: "TC1", input: "4 3\n1 2\n2 3\n3 4\n", expectedOutput: "YES" },
      { id: "TC2", input: "3 3\n1 2\n2 3\n3 1\n", expectedOutput: "NO" },
      { id: "TC3", input: "5 4\n1 2\n1 3\n3 4\n2 5\n", expectedOutput: "YES" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "2 2\n1 2\n2 1\n", expectedOutput: "NO" },
      { id: "H2", input: "1 0\n", expectedOutput: "YES" }
    ]
  }),
  makeQuestion({
    id: "cpp-tree-diameter",
    language: "cpp",
    slug: "stl-graph-lab",
    topic: "STL Graph Lab",
    topicCue: "Graph traversals, shortest paths, cycle and component checks",
    difficulty: "Hard",
    title: "Tree Diameter",
    description: "Given an undirected tree, return diameter length in edges.",
    inputFormat: "Line 1: n | Next n-1 lines: u v",
    outputFormat: "Single integer",
    constraints: ["1 <= n <= 200000"],
    starter: `#include <iostream>
#include <vector>
#include <queue>
using namespace std;

pair<int, int> bfsFarthest(int start, const vector<vector<int>>& graph) {
    vector<int> dist(graph.size(), -1);
    queue<int> q;
    q.push(start);
    dist[start] = 0;

    // CORE_START
    while (!q.empty()) {
        int node = q.front();
        q.pop();
        // TODO: BFS traversal and distance fill
    }
    // CORE_END

    int farNode = start;
    for (int node = 1; node < (int)graph.size(); node++) {
        if (dist[node] > dist[farNode]) farNode = node;
    }
    return {farNode, dist[farNode]};
}

int solve(int n, const vector<vector<int>>& graph) {
    if (n == 0) return 0;
    auto first = bfsFarthest(1, graph);
    auto second = bfsFarthest(first.first, graph);
    return second.second;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n = 0;
    if (!(cin >> n)) return 0;

    vector<vector<int>> graph(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int u = 0, v = 0;
        cin >> u >> v;
        graph[u].push_back(v);
        graph[v].push_back(u);
    }

    cout << solve(n, graph) << "\\n";
    return 0;
}
`,
    reference: `#include <iostream>
#include <vector>
#include <queue>
using namespace std;

pair<int, int> bfsFarthest(int start, const vector<vector<int>>& graph) {
    vector<int> dist(graph.size(), -1);
    queue<int> q;
    q.push(start);
    dist[start] = 0;

    while (!q.empty()) {
        int node = q.front();
        q.pop();
        for (int next : graph[node]) {
            if (dist[next] == -1) {
                dist[next] = dist[node] + 1;
                q.push(next);
            }
        }
    }

    int farNode = start;
    for (int node = 1; node < (int)graph.size(); node++) {
        if (dist[node] > dist[farNode]) farNode = node;
    }
    return {farNode, dist[farNode]};
}

int solve(int n, const vector<vector<int>>& graph) {
    if (n == 0) return 0;
    auto first = bfsFarthest(1, graph);
    auto second = bfsFarthest(first.first, graph);
    return second.second;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n = 0;
    if (!(cin >> n)) return 0;

    vector<vector<int>> graph(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int u = 0, v = 0;
        cin >> u >> v;
        graph[u].push_back(v);
        graph[v].push_back(u);
    }

    cout << solve(n, graph) << "\\n";
    return 0;
}
`,
    testCases: [
      { id: "TC1", input: "4\n1 2\n2 3\n3 4\n", expectedOutput: "3" },
      { id: "TC2", input: "5\n1 2\n1 3\n3 4\n3 5\n", expectedOutput: "3" },
      { id: "TC3", input: "1\n", expectedOutput: "0" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "2\n1 2\n", expectedOutput: "1" },
      { id: "H2", input: "6\n1 2\n2 3\n2 4\n4 5\n5 6\n", expectedOutput: "4" }
    ]
  })
];
const cQuestions = [
  makeQuestion({
    id: "c-reverse-array",
    language: "c",
    slug: "pointers-and-arrays",
    topic: "Pointers and Arrays",
    topicCue: "Memory-safe array transforms and index discipline",
    difficulty: "Easy",
    title: "Reverse Array",
    description: "Reverse an integer array in place and print it.",
    inputFormat: "Line 1: n | Line 2: n integers",
    outputFormat: "n integers",
    constraints: ["1 <= n <= 200000"],
    starter: `#include <stdio.h>
#include <stdlib.h>

void solve(int* nums, int n) {
    // CORE_START
    int left = 0;
    int right = n - 1;
    while (left < right) {
        // TODO: swap nums[left] and nums[right]
        left += 1;
        right -= 1;
    }
    // CORE_END
}

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1) return 0;

    int* nums = (int*)malloc(sizeof(int) * n);
    if (!nums) return 0;

    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);

    solve(nums, n);

    for (int i = 0; i < n; i++) {
        if (i) printf(" ");
        printf("%d", nums[i]);
    }
    printf("\\n");

    free(nums);
    return 0;
}
`,
    reference: `#include <stdio.h>
#include <stdlib.h>

void solve(int* nums, int n) {
    int left = 0;
    int right = n - 1;
    while (left < right) {
        int temp = nums[left];
        nums[left] = nums[right];
        nums[right] = temp;
        left += 1;
        right -= 1;
    }
}

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1) return 0;

    int* nums = (int*)malloc(sizeof(int) * n);
    if (!nums) return 0;

    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);

    solve(nums, n);

    for (int i = 0; i < n; i++) {
        if (i) printf(" ");
        printf("%d", nums[i]);
    }
    printf("\\n");

    free(nums);
    return 0;
}
`,
    testCases: [
      { id: "TC1", input: "5\n1 2 3 4 5\n", expectedOutput: "5 4 3 2 1" },
      { id: "TC2", input: "4\n7 8 9 10\n", expectedOutput: "10 9 8 7" },
      { id: "TC3", input: "1\n42\n", expectedOutput: "42" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "2\n-1 6\n", expectedOutput: "6 -1" },
      { id: "H2", input: "3\n0 0 0\n", expectedOutput: "0 0 0" }
    ]
  }),
  makeQuestion({
    id: "c-rotate-right-k",
    language: "c",
    slug: "pointers-and-arrays",
    topic: "Pointers and Arrays",
    topicCue: "Memory-safe array transforms and index discipline",
    difficulty: "Medium",
    title: "Rotate Array Right By K",
    description: "Rotate array right by k positions.",
    inputFormat: "Line 1: n | Line 2: n integers | Line 3: k",
    outputFormat: "n integers",
    constraints: ["1 <= n <= 200000"],
    starter: `#include <stdio.h>
#include <stdlib.h>

void reverseRange(int* nums, int left, int right) {
    while (left < right) {
        int temp = nums[left];
        nums[left] = nums[right];
        nums[right] = temp;
        left += 1;
        right -= 1;
    }
}

void solve(int* nums, int n, int k) {
    if (n == 0) return;
    k %= n;

    // CORE_START
    // TODO: reverse whole array, then first k, then rest
    // CORE_END
}

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1) return 0;

    int* nums = (int*)malloc(sizeof(int) * n);
    if (!nums) return 0;

    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);

    int k = 0;
    scanf("%d", &k);

    solve(nums, n, k);

    for (int i = 0; i < n; i++) {
        if (i) printf(" ");
        printf("%d", nums[i]);
    }
    printf("\\n");

    free(nums);
    return 0;
}
`,
    reference: `#include <stdio.h>
#include <stdlib.h>

void reverseRange(int* nums, int left, int right) {
    while (left < right) {
        int temp = nums[left];
        nums[left] = nums[right];
        nums[right] = temp;
        left += 1;
        right -= 1;
    }
}

void solve(int* nums, int n, int k) {
    if (n == 0) return;
    k %= n;

    reverseRange(nums, 0, n - 1);
    reverseRange(nums, 0, k - 1);
    reverseRange(nums, k, n - 1);
}

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1) return 0;

    int* nums = (int*)malloc(sizeof(int) * n);
    if (!nums) return 0;

    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);

    int k = 0;
    scanf("%d", &k);

    solve(nums, n, k);

    for (int i = 0; i < n; i++) {
        if (i) printf(" ");
        printf("%d", nums[i]);
    }
    printf("\\n");

    free(nums);
    return 0;
}
`,
    testCases: [
      { id: "TC1", input: "7\n1 2 3 4 5 6 7\n3\n", expectedOutput: "5 6 7 1 2 3 4" },
      { id: "TC2", input: "4\n1 2 3 4\n4\n", expectedOutput: "1 2 3 4" },
      { id: "TC3", input: "5\n10 20 30 40 50\n1\n", expectedOutput: "50 10 20 30 40" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "3\n1 2 3\n5\n", expectedOutput: "2 3 1" },
      { id: "H2", input: "1\n9\n100\n", expectedOutput: "9" }
    ]
  }),
  makeQuestion({
    id: "c-second-largest-distinct",
    language: "c",
    slug: "pointers-and-arrays",
    topic: "Pointers and Arrays",
    topicCue: "Memory-safe array transforms and index discipline",
    difficulty: "Easy",
    title: "Second Largest Distinct",
    description: "Find second largest distinct value in array, else -1.",
    inputFormat: "Line 1: n | Line 2: n integers",
    outputFormat: "Single integer",
    constraints: ["1 <= n <= 200000"],
    starter: `#include <stdio.h>
#include <limits.h>

int solve(const int* nums, int n) {
    int first = INT_MIN;
    int second = INT_MIN;

    // CORE_START
    for (int i = 0; i < n; i++) {
        // TODO: maintain largest and second largest distinct values
    }
    // CORE_END

    return second == INT_MIN ? -1 : second;
}

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1) return 0;

    int nums[200000];
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);

    printf("%d\\n", solve(nums, n));
    return 0;
}
`,
    reference: `#include <stdio.h>
#include <limits.h>

int solve(const int* nums, int n) {
    int first = INT_MIN;
    int second = INT_MIN;

    for (int i = 0; i < n; i++) {
        int value = nums[i];
        if (value > first) {
            second = first;
            first = value;
        } else if (value != first && value > second) {
            second = value;
        }
    }

    return second == INT_MIN ? -1 : second;
}

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1) return 0;

    int nums[200000];
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);

    printf("%d\\n", solve(nums, n));
    return 0;
}
`,
    testCases: [
      { id: "TC1", input: "5\n1 5 2 4 3\n", expectedOutput: "4" },
      { id: "TC2", input: "4\n9 9 9 9\n", expectedOutput: "-1" },
      { id: "TC3", input: "6\n-5 -2 -3 -1 -4 -1\n", expectedOutput: "-2" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "2\n1 2\n", expectedOutput: "1" },
      { id: "H2", input: "1\n10\n", expectedOutput: "-1" }
    ]
  }),
  makeQuestion({
    id: "c-move-zeros-end",
    language: "c",
    slug: "pointers-and-arrays",
    topic: "Pointers and Arrays",
    topicCue: "Memory-safe array transforms and index discipline",
    difficulty: "Easy",
    title: "Move Zeros To End",
    description: "Move all zeros to end while preserving order of non-zero elements.",
    inputFormat: "Line 1: n | Line 2: n integers",
    outputFormat: "n integers",
    constraints: ["1 <= n <= 200000"],
    starter: `#include <stdio.h>

void solve(int* nums, int n) {
    int write = 0;

    // CORE_START
    for (int read = 0; read < n; read++) {
        // TODO: compact non-zero values
    }
    while (write < n) {
        nums[write++] = 0;
    }
    // CORE_END
}

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1) return 0;

    int nums[200000];
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);

    solve(nums, n);

    for (int i = 0; i < n; i++) {
        if (i) printf(" ");
        printf("%d", nums[i]);
    }
    printf("\\n");
    return 0;
}
`,
    reference: `#include <stdio.h>

void solve(int* nums, int n) {
    int write = 0;

    for (int read = 0; read < n; read++) {
        if (nums[read] != 0) {
            nums[write++] = nums[read];
        }
    }
    while (write < n) {
        nums[write++] = 0;
    }
}

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1) return 0;

    int nums[200000];
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);

    solve(nums, n);

    for (int i = 0; i < n; i++) {
        if (i) printf(" ");
        printf("%d", nums[i]);
    }
    printf("\\n");
    return 0;
}
`,
    testCases: [
      { id: "TC1", input: "5\n0 1 0 3 12\n", expectedOutput: "1 3 12 0 0" },
      { id: "TC2", input: "3\n0 0 0\n", expectedOutput: "0 0 0" },
      { id: "TC3", input: "4\n4 5 6 7\n", expectedOutput: "4 5 6 7" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "6\n1 0 2 0 3 0\n", expectedOutput: "1 2 3 0 0 0" },
      { id: "H2", input: "1\n0\n", expectedOutput: "0" }
    ]
  }),
  makeQuestion({
    id: "c-dedupe-sorted-length",
    language: "c",
    slug: "pointers-and-arrays",
    topic: "Pointers and Arrays",
    topicCue: "Memory-safe array transforms and index discipline",
    difficulty: "Medium",
    title: "Remove Duplicates Sorted Array Length",
    description: "Given sorted array, return length of unique prefix after in-place dedupe.",
    inputFormat: "Line 1: n | Line 2: n sorted integers",
    outputFormat: "Single integer",
    constraints: ["0 <= n <= 200000"],
    starter: `#include <stdio.h>

int solve(int* nums, int n) {
    if (n == 0) return 0;
    int write = 1;

    // CORE_START
    for (int read = 1; read < n; read++) {
        // TODO: keep new unique values at nums[write]
    }
    // CORE_END

    return write;
}

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1) return 0;

    int nums[200000];
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);

    printf("%d\\n", solve(nums, n));
    return 0;
}
`,
    reference: `#include <stdio.h>

int solve(int* nums, int n) {
    if (n == 0) return 0;
    int write = 1;

    for (int read = 1; read < n; read++) {
        if (nums[read] != nums[write - 1]) {
            nums[write] = nums[read];
            write += 1;
        }
    }

    return write;
}

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1) return 0;

    int nums[200000];
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);

    printf("%d\\n", solve(nums, n));
    return 0;
}
`,
    testCases: [
      { id: "TC1", input: "6\n1 1 2 2 3 3\n", expectedOutput: "3" },
      { id: "TC2", input: "5\n1 2 3 4 5\n", expectedOutput: "5" },
      { id: "TC3", input: "0\n\n", expectedOutput: "0" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "7\n-3 -3 -2 -1 -1 0 0\n", expectedOutput: "4" },
      { id: "H2", input: "1\n9\n", expectedOutput: "1" }
    ]
  }),
  makeQuestion({
    id: "c-binary-search-insert",
    language: "c",
    slug: "pointers-and-arrays",
    topic: "Pointers and Arrays",
    topicCue: "Memory-safe array transforms and index discipline",
    difficulty: "Easy",
    title: "Search Insert Position",
    description: "Given sorted array and target, return index if found else insertion index.",
    inputFormat: "Line 1: n | Line 2: n sorted integers | Line 3: target",
    outputFormat: "Single integer",
    constraints: ["0 <= n <= 200000"],
    starter: `#include <stdio.h>

int solve(const int* nums, int n, int target) {
    int left = 0;
    int right = n - 1;

    // CORE_START
    while (left <= right) {
        int mid = left + (right - left) / 2;
        // TODO: standard binary search branch updates
    }
    // CORE_END

    return left;
}

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1) return 0;

    int nums[200000];
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);

    int target = 0;
    scanf("%d", &target);

    printf("%d\\n", solve(nums, n, target));
    return 0;
}
`,
    reference: `#include <stdio.h>

int solve(const int* nums, int n, int target) {
    int left = 0;
    int right = n - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }

    return left;
}

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1) return 0;

    int nums[200000];
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);

    int target = 0;
    scanf("%d", &target);

    printf("%d\\n", solve(nums, n, target));
    return 0;
}
`,
    testCases: [
      { id: "TC1", input: "4\n1 3 5 6\n5\n", expectedOutput: "2" },
      { id: "TC2", input: "4\n1 3 5 6\n2\n", expectedOutput: "1" },
      { id: "TC3", input: "4\n1 3 5 6\n7\n", expectedOutput: "4" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "0\n\n5\n", expectedOutput: "0" },
      { id: "H2", input: "1\n10\n0\n", expectedOutput: "0" }
    ]
  }),
  makeQuestion({
    id: "c-max-subarray-sum",
    language: "c",
    slug: "pointers-and-arrays",
    topic: "Pointers and Arrays",
    topicCue: "Memory-safe array transforms and index discipline",
    difficulty: "Medium",
    title: "Maximum Subarray Sum",
    description: "Return maximum sum over all non-empty contiguous subarrays.",
    inputFormat: "Line 1: n | Line 2: n integers",
    outputFormat: "Single integer",
    constraints: ["1 <= n <= 200000"],
    starter: `#include <stdio.h>

int solve(const int* nums, int n) {
    int current = nums[0];
    int best = nums[0];

    // CORE_START
    for (int i = 1; i < n; i++) {
        // TODO: Kadane transition and best update
    }
    // CORE_END

    return best;
}

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1) return 0;

    int nums[200000];
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);

    printf("%d\\n", solve(nums, n));
    return 0;
}
`,
    reference: `#include <stdio.h>

int solve(const int* nums, int n) {
    int current = nums[0];
    int best = nums[0];

    for (int i = 1; i < n; i++) {
        if (current + nums[i] > nums[i]) current = current + nums[i];
        else current = nums[i];

        if (current > best) best = current;
    }

    return best;
}

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1) return 0;

    int nums[200000];
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);

    printf("%d\\n", solve(nums, n));
    return 0;
}
`,
    testCases: [
      { id: "TC1", input: "9\n-2 1 -3 4 -1 2 1 -5 4\n", expectedOutput: "6" },
      { id: "TC2", input: "4\n1 2 3 4\n", expectedOutput: "10" },
      { id: "TC3", input: "5\n-7 -4 -1 -8 -2\n", expectedOutput: "-1" }
    ],
    hiddenTestCases: [
      { id: "H1", input: "1\n5\n", expectedOutput: "5" },
      { id: "H2", input: "6\n3 -2 5 -1 6 -3\n", expectedOutput: "11" }
    ]
  })
];

const codingQuestions = [
  ...pythonQuestions,
  ...javaQuestions,
  ...cppQuestions,
  ...cQuestions
];

export function normalizeLanguage(language = "") {
  const value = String(language).trim().toLowerCase();
  if (value === "c++" || value === "cplusplus") return "cpp";
  if (value === "py") return "python";
  return value;
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

  const reduced = [
    ...lines.slice(0, startIndex + 1),
    placeholder,
    ...lines.slice(endIndex)
  ];

  return reduced.join("\n");
}

export function questionSupportsLanguage(question, language) {
  const normalized = normalizeLanguage(language);
  return Boolean(question?.starterCode?.[normalized] && question?.referenceCode?.[normalized]);
}

export function getLanguageStarter(question, language, starterMode = "topic") {
  const normalized = normalizeLanguage(language);
  const starter = question?.starterCode?.[normalized] || "";
  if (starterMode === "difficulty") {
    return buildDifficultyStarter(starter, normalized);
  }
  return starter;
}

export function getLanguageReference(question, language) {
  const normalized = normalizeLanguage(language);
  return question?.referenceCode?.[normalized] || "";
}

export default codingQuestions;
