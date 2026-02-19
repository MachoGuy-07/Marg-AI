// client/src/App.js

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Practice from "./pages/Practice";
import MockInterview from "./pages/MockInterview";
import TopicPractice from "./pages/TopicPractice";

import "./styles/home.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Practice main page (topic selector) */}
        <Route path="/practice" element={<Practice />} />

        {/* Individual topic page (Backtracking etc.) */}
        <Route path="/practice/:topic" element={<TopicPractice />} />

        {/* Mock Interview */}
        <Route path="/mock-interview" element={<MockInterview />} />
      </Routes>
    </BrowserRouter>
  );
}