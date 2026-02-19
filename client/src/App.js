// client/src/App.js

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import Home from "./pages/Home";
import Practice from "./pages/Practice";
import MockInterview from "./pages/MockInterview";
import TopicPractice from "./pages/TopicPractice";
import Report from "./pages/Report";

// Styles
import "./styles/home.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* 🏠 Landing Page */}
        <Route path="/" element={<Home />} />

        {/* 📘 Practice Section */}
        <Route path="/practice" element={<Practice />} />
        <Route path="/practice/:topic" element={<TopicPractice />} />

        {/* 🎤 Mock Interview */}
        <Route path="/mock-interview" element={<MockInterview />} />

        {/* 📄 AI Report */}
        <Route path="/report" element={<Report />} />

        {/* ⭐ Future: 404 fallback */}
        {/* <Route path="*" element={<h2>Page not found</h2>} /> */}

      </Routes>
    </BrowserRouter>
  );
}