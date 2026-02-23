import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";

export default function Home() {
  const navigate = useNavigate();
  const [slideDirection, setSlideDirection] = useState(null);
  const videoRef = useRef(null);
  const starBgUrl = `${process.env.PUBLIC_URL || ""}/space-bg.png`;

  /* =====================================
     ROUTE TRANSITION
  ===================================== */
  const triggerTransition = (route) => {
    setSlideDirection("slide-left");

    setTimeout(() => {
      navigate(route, { state: { from: "home" } });
    }, 600);
  };

  const handleGlassMove = (event) => {
    const panel = event.currentTarget;
    const rect = panel.getBoundingClientRect();
    const px = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const py = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));

    panel.style.setProperty("--glass-x", `${(px * 100).toFixed(2)}%`);
    panel.style.setProperty("--glass-y", `${(py * 100).toFixed(2)}%`);
    panel.style.setProperty("--glass-rx", `${((0.5 - py) * 6).toFixed(2)}deg`);
    panel.style.setProperty("--glass-ry", `${((px - 0.5) * 8).toFixed(2)}deg`);
    panel.style.setProperty("--glass-sheen-shift", `${((px - 0.5) * 18).toFixed(2)}%`);
  };

  const handleGlassLeave = (event) => {
    const panel = event.currentTarget;
    panel.style.setProperty("--glass-x", "50%");
    panel.style.setProperty("--glass-y", "50%");
    panel.style.setProperty("--glass-rx", "0deg");
    panel.style.setProperty("--glass-ry", "0deg");
    panel.style.setProperty("--glass-sheen-shift", "0%");
  };

  /* =====================================
     ÃƒÂ°Ã…Â¸Ã…Â½Ã‚Â¥ WEBCAM AUTO START
  ===================================== */
  useEffect(() => {
    if (navigator.mediaDevices && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          videoRef.current.srcObject = stream;
        })
        .catch((err) => console.log(err));
    }
  }, []);

  /* =====================================
     JSX
  ===================================== */
  return (
    <div className={`home-root ${slideDirection || ""}`}>
      <div className="home-inner container">

        {/* =====================================
           TOPBAR
        ===================================== */}
        <header className="topbar">
          <div className="brand">
            <img src="/logo192.png" alt="Marg AI" className="brand-logo" />
            <div className="brand-text">
              <div className="brand-name">Marg AI</div>
              <div className="brand-sub">AI Interview Coach</div>
            </div>
          </div>
        </header>

        {/* =====================================
           HERO SECTION
        ===================================== */}
        <section
          className="hero"
          style={{ "--hero-image": `url(${starBgUrl})` }}
        >

          {/* ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â® GLASS WRAPPER */}
          <div
            className="hero-glass"
            onMouseMove={handleGlassMove}
            onMouseLeave={handleGlassLeave}
          >

            {/* =====================================
               LEFT TEXT BLOCK
            ===================================== */}
            <div className="hero-left">
              <h1 className="hero-title">
                Practice interviews. <br />
                Get feedback. <br />
                Land the job.
              </h1>

              <p className="hero-sub">
                Instant AI feedback on code and communication -
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

{/* =====================================
   RIGHT AI ANALYSIS PANEL
===================================== */}
<div className="hero-right">
  <div className="ai-panel">

    {/* Header dots */}
    <div className="ai-header">
      <span></span>
      <span></span>
      <span></span>
    </div>

    {/* Webcam */}
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

    {/* Stats */}
    <div className="ai-stats">

      <div className="stat-row">
        <span>Communication</span>
        <span>92%</span>
      </div>
      <div className="slider"><div style={{width:"92%"}}></div></div>

      <div className="stat-row">
        <span>Code Accuracy</span>
        <span>87%</span>
      </div>
      <div className="slider"><div style={{width:"87%"}}></div></div>

      <div className="stat-row">
        <span>Confidence</span>
        <span>High</span>
      </div>
      <div className="slider"><div style={{width:"80%"}}></div></div>

    </div>

    {/* Bar graph */}
    <div className="bar-graph">
      <span></span><span></span><span></span>
      <span></span><span></span><span></span>
      <span></span><span></span>
    </div>

        {/* Footer metrics */}
    <div className="ai-footer">
      <div className="signal-chip">
        <div className="signal-head">
          <span className="signal-name">Eye Contact</span>
          <span className="signal-score">Stable</span>
        </div>
        <div className="signal-dots" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <div className="signal-chip">
        <div className="signal-head">
          <span className="signal-name">Code Quality</span>
          <span className="signal-score">A-</span>
        </div>
        <div className="signal-track" aria-hidden="true">
          <span className="signal-fill code-fill"></span>
        </div>
      </div>

      <div className="signal-chip">
        <div className="signal-head">
          <span className="signal-name">Speaking Pace</span>
          <span className="signal-score">128 WPM</span>
        </div>
        <div className="pace-bars" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>

    <div className="analyzing">Analyzing...</div>

  </div>
</div>

          </div>
        </section>

        {/* =====================================
           FOOTER
        ===================================== */}
        <footer className="home-footer">
          &copy; {new Date().getFullYear()} Marg AI
        </footer>

      </div>
    </div>
  );
}

