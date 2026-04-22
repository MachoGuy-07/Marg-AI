import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Practice from "./pages/Practice";
import TopicPractice from "./pages/TopicPractice";
import MockInterview from "./pages/MockInterview";
import Report from "./pages/Report";

export default function App() {
  return (
    <Router>
      <Routes>
  <Route path="/" element={<Home />} />

  {/* Put dynamic route FIRST */}
  <Route path="/practice/:category" element={<TopicPractice />} />
  <Route path="/practice" element={<Practice />} />

  <Route path="/mock-interview" element={<MockInterview />} />
  <Route path="/report" element={<Report />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
</Routes>
    </Router>
  );
}