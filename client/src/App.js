import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import MockInterview from "./pages/MockInterview";
import Practice from "./pages/Practice";
import Report from "./pages/Report";
import TopicPractice from "./pages/TopicPractice";
import "./styles/home.css";

export default function App() {
  const siteBgUrl = `${process.env.PUBLIC_URL || ""}/space-bg.png`;

  return (
    <div
      className="site-shell"
      style={{ "--site-bg-image": `url(${siteBgUrl})` }}
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
