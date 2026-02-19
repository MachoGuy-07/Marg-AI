import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";

export default function Home() {
  const navigate = useNavigate();
  const [slideDirection, setSlideDirection] = useState(null);

  const triggerTransition = (route) => {
    setSlideDirection("slide-left");

    setTimeout(() => {
      navigate(route, { state: { from: "home" } });
    }, 600); // match CSS duration
  };

  return (
    <div className={`home-root ${slideDirection || ""}`}>
      <div className="home-inner container">
        <header className="topbar">
          <div className="brand">
            <img src="/logo192.png" alt="Marg AI" className="brand-logo" />
            <div className="brand-text">
              <div className="brand-name">Marg AI</div>
              <div className="brand-sub">AI Interview Coach</div>
            </div>
          </div>
        </header>

        <section className="hero">
          <div className="hero-left">
            <h1 className="hero-title">
              Practice interviews. <br />
              Get feedback. <br />
              Land the job.
            </h1>

            <p className="hero-sub">
              Instant AI feedback on code and communication —
              video, audio and code analysis combined into one clean report.
            </p>

            <div className="hero-ctas">
              <button
                className="btn primary"
                onClick={() => triggerTransition("/mock-interview")}
              >
                Start Mock Interview
              </button>

              <button
                className="btn secondary"
                onClick={() => triggerTransition("/practice")}
              >
                Practice Coding
              </button>
            </div>
          </div>

          <div className="hero-right">
            <div className="tv-frame">
              <video
                className="demo-video"
                autoPlay
                loop
                muted
                playsInline
              >
                <source src="/demo-video.mp4" type="video/mp4" />
              </video>
              <div className="scanlines"></div>
            </div>
          </div>
        </section>

        <footer className="home-footer">
          © {new Date().getFullYear()} Marg AI
        </footer>
      </div>
    </div>
  );
}