import React from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import MockInterview from "./pages/MockInterview";
import CodingReport from "./pages/CodingReport";
import Practice from "./pages/Practice";
import QuestionDetail from "./pages/QuestionDetail";
import QuestionList from "./pages/QuestionList";
import Report from "./pages/Report";
import TopicPractice from "./pages/TopicPractice";
import Login from "./pages/Login";
import "./styles/home.css";

function AppLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";
  const token = localStorage.getItem("token");
  const siteBgUrl = `${process.env.PUBLIC_URL || ""}/space-bg.png`;

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

  const appRoutes = (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/practice" element={<Practice />} />
      <Route path="/practice/report" element={<CodingReport />} />
      <Route path="/practice/:language/:topic/:questionId" element={<QuestionDetail />} />
      <Route path="/practice/:language/:topic" element={<QuestionList />} />
      <Route path="/practice/:topic" element={<TopicPractice />} />
      <Route path="/mock-interview" element={<MockInterview />} />
      <Route path="/report" element={<Report />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login defaultMode="signup" />} />
    </Routes>
  );

  if (!isAuthPage && !token) {
    return <Navigate to="/login" replace />;
  }

  if (isAuthPage && token) {
    return <Navigate to="/" replace />;
  }

  if (isAuthPage) {
    return appRoutes;
  }

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
        {appRoutes}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
