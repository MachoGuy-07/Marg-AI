import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import Home from "./pages/Home";
import Practice from "./pages/Practice";
import MockInterview from "./pages/MockInterview";
import "./styles/routeTransition.css";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <TransitionGroup component={null}>
        <CSSTransition
          key={location.pathname}
          classNames="page"
          timeout={700}
          unmountOnExit
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/mock-interview" element={<MockInterview />} />
          </Routes>
        </CSSTransition>
      </TransitionGroup>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}