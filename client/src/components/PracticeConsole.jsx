import React, { useEffect, useState } from "react";

function explainError(error) {
  const msg = error.toLowerCase();

  if (msg.includes("undefined")) {
    return {
      reason:
        "You are trying to use a variable or function that has not been defined.",
      fix:
        "Check spelling or make sure the variable/function is declared before use.",
      example: "let x = 10;\nconsole.log(x);",
    };
  }

  if (msg.includes("not a function")) {
    return {
      reason:
        "You are calling something as a function, but it is not a function.",
      fix: "Make sure the variable actually holds a function.",
      example: "function greet() {\n  console.log('Hello');\n}\ngreet();",
    };
  }

  if (msg.includes("syntax")) {
    return {
      reason: "There is a syntax error in your code.",
      fix: "Check for missing brackets, commas, or incorrect syntax.",
      example:
        "for (let i = 0; i < 5; i++) {\n  console.log(i);\n}",
    };
  }

  return {
    reason: "The code threw an error during execution.",
    fix: "Review the error message carefully and check your logic.",
    example: "console.log('Debug step');",
  };
}

export default function PracticeConsole({ language, externalCode }) {
  const [code, setCode] = useState(
    externalCode || "// Write your code here\nconsole.log('Hello Marg AI')"
  );
  const [output, setOutput] = useState("");
  const [aiFeedback, setAiFeedback] = useState(null);

  useEffect(() => {
    if (externalCode) {
      setCode(externalCode);
    }
  }, [externalCode]);

  const runCode = () => {
    setAiFeedback(null);

    if (language !== "javascript") {
      setOutput("Execution for this language coming soon.");
      return;
    }

    let logs = [];
    const originalLog = console.log;

    try {
      console.log = (...args) => logs.push(args.join(" "));
      // eslint-disable-next-line no-new-func
      const execute = new Function(code);
      execute();
      setOutput(logs.join("\n") || "Code ran successfully");
    } catch (err) {
      const message = err?.toString?.() || "Unknown error";
      setOutput(message);
      setAiFeedback(explainError(message));
    } finally {
      console.log = originalLog;
    }
  };

  return (
    <div className="practice-console">
      <textarea
        className="code-editor"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <div className="console-actions">
        <button className="btn primary" onClick={runCode}>
          Run Code
        </button>
      </div>

      <div className="console-results">
        <pre className="output-console">{output}</pre>

        {aiFeedback && (
          <>
            <div className="ai-panel">
              <h3>AI Explanation</h3>
              <p>
                <strong>Why it failed:</strong> {aiFeedback.reason}
              </p>
              <p>
                <strong>How to fix:</strong> {aiFeedback.fix}
              </p>
            </div>

            {aiFeedback.example && (
              <div className="ai-panel">
                <h3>AI Suggested Solution</h3>
                <pre className="code-block">{aiFeedback.example}</pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
