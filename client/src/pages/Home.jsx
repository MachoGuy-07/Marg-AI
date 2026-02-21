import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";

export default function Home() {
  const navigate = useNavigate();
  const [slideDirection, setSlideDirection] = useState(null);
  const videoRef = useRef(null);

  const triggerTransition = (route) => {
    setSlideDirection("slide-left");

    setTimeout(() => {
      navigate(route, { state: { from: "home" } });
    }, 600);
  };

  /* 🎥 Webcam auto start */
  useEffect(() => {
    if (navigator.mediaDevices && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          videoRef.current.srcObject = stream;
        })
        .catch(err => console.log(err));
    }
  }, []);

  return (
    <div className={`home-root ${slideDirection || ""}`}>
      <div className="home-inner container">

        {/* TOPBAR */}
        <header className="topbar">
          <div className="brand">
            <img src="/logo192.png" alt="Marg AI" className="brand-logo" />
            <div className="brand-text">
              <div className="brand-name">Marg AI</div>
              <div className="brand-sub">AI Interview Coach</div>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="hero">

          {/* LEFT */}
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

          {/* RIGHT AI PANEL */}
          <div className="hero-right">
            <div className="ai-panel">

              {/* window header dots */}
              <div className="ai-header">
                <span></span><span></span><span></span>
              </div>

              {/* webcam */}
              <div className="ai-video-box">
                <video
                  ref={videoRef}
                  className="webcam"
                  autoPlay
                  muted
                  playsInline
                />
                <div className="face-box"></div>
              </div>

              {/* stats */}
              <div className="ai-stats">

                <div className="stat-row">
                  <span>💬 Communication</span>
                  <span>92%</span>
                </div>
                <div className="slider"><div style={{width:"92%"}}></div></div>

                <div className="stat-row">
                  <span>⚙️ Code Accuracy</span>
                  <span>87%</span>
                </div>
                <div className="slider"><div style={{width:"87%"}}></div></div>

                <div className="stat-row">
                  <span>💜 Confidence</span>
                  <span>High</span>
                </div>
                <div className="slider"><div style={{width:"80%"}}></div></div>

              </div>

              {/* waveform */}
              <div className="wave-bars">
  <span></span><span></span><span></span><span></span>
  <span></span><span></span><span></span><span></span>
</div>

              {/* bottom metrics */}
              <div className="ai-footer">
                <span>👁 Eye Contact</span>
                <span>💻 Code Quality</span>
                <span>🎧 Speaking Pace</span>
              </div>

              <div className="analyzing">Analyzing...</div>

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