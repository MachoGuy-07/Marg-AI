import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import MockInterview from "./pages/MockInterview";
import Practice from "./pages/Practice";
import Report from "./pages/Report";
import TopicPractice from "./pages/TopicPractice";
import "./styles/home.css";

export default function App() {
  const siteBgUrl = `${process.env.PUBLIC_URL || ""}/image.png`;

  const handleShellMove = (event) => {
    const shell = event.currentTarget;
    const rect = shell.getBoundingClientRect();
    const px = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const py = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));

    shell.style.setProperty("--page-liquid-x", `${(px * 100).toFixed(2)}%`);
    shell.style.setProperty("--page-liquid-y", `${(py * 100).toFixed(2)}%`);
    shell.style.setProperty("--page-liquid-shift", `${((px - 0.5) * 10).toFixed(2)}%`);
    shell.style.setProperty("--page-liquid-drift-x", `${((px - 0.5) * 5).toFixed(2)}px`);
    shell.style.setProperty("--page-liquid-drift-y", `${((py - 0.5) * 5).toFixed(2)}px`);
  };

  const handleShellLeave = (event) => {
    const shell = event.currentTarget;
    shell.style.setProperty("--page-liquid-x", "50%");
    shell.style.setProperty("--page-liquid-y", "50%");
    shell.style.setProperty("--page-liquid-shift", "0%");
    shell.style.setProperty("--page-liquid-drift-x", "0px");
    shell.style.setProperty("--page-liquid-drift-y", "0px");
  };

  return (
    <div
      className="site-shell"
      onMouseMove={handleShellMove}
      onMouseLeave={handleShellLeave}
      style={{
        "--site-bg-image": `url(${siteBgUrl})`,
        "--page-liquid-x": "50%",
        "--page-liquid-y": "50%",
        "--page-liquid-shift": "0%",
        "--page-liquid-drift-x": "0px",
        "--page-liquid-drift-y": "0px",
      }}
    >
      <div className="site-bg-layer" aria-hidden="true" />
      <div className="site-page">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/practice/:topic" element={<TopicPractice />} />
            <Route path="/mock-interview" element={<MockInterview />} />
            <Route path="/report" element={<Report />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}
