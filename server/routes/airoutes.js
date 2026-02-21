import express from "express";
import { spawn } from "child_process";

const router = express.Router();

router.post("/emotion", (req, res) => {
  console.log("Emotion API called");   // ⭐ debug

  const python = spawn("python", ["ai/emotion.py"]);   // Windows python

  // send image to python
  python.stdin.write(req.body.image);
  python.stdin.end();

  let resultData = "";

  // capture python output
  python.stdout.on("data", (data) => {
    resultData += data.toString();
  });

  python.stdout.on("end", () => {
    console.log("Python output:", resultData);   // ⭐ debug
    try {
      const result = JSON.parse(resultData);
      res.json(result);
    } catch (err) {
      console.error("JSON parse error:", err);
      res.json({ emotion: "neutral" });
    }
  });

  // capture python error
  python.stderr.on("data", (err) => {
    console.error("Python error:", err.toString());
  });

  python.on("close", (code) => {
    console.log("Python process exited with code", code);
  });
});

export default router;