import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";

export default function Home() {
  const navigate = useNavigate();
  const [slideDirection, setSlideDirection] = useState(null);
  const videoRef = useRef(null);


  /* ─────────────────────────────────────────
     ROUTE TRANSITION
  ───────────────────────────────────────── */
  const triggerTransition = (route) => {
    setSlideDirection("slide-left");
    setTimeout(() => navigate(route, { state: { from: "home" } }), 600);
  };

  /* ─────────────────────────────────────────
     GLASS TILT
  ───────────────────────────────────────── */
  const handleGlassMove = (e) => {
    const p = e.currentTarget;
    const r = p.getBoundingClientRect();
    const px = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const py = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    p.style.setProperty("--glass-x", `${(px * 100).toFixed(1)}%`);
    p.style.setProperty("--glass-y", `${(py * 100).toFixed(1)}%`);
    p.style.setProperty("--glass-rx", `${((0.5 - py) * 5).toFixed(1)}deg`);
    p.style.setProperty("--glass-ry", `${((px - 0.5) * 7).toFixed(1)}deg`);
    p.style.setProperty("--glass-sheen-shift", `${((px - 0.5) * 16).toFixed(1)}%`);
  };

  const handleGlassLeave = (e) => {
    const p = e.currentTarget;
    p.style.setProperty("--glass-x", "50%");
    p.style.setProperty("--glass-y", "50%");
    p.style.setProperty("--glass-rx", "0deg");
    p.style.setProperty("--glass-ry", "0deg");
    p.style.setProperty("--glass-sheen-shift", "0%");
  };

  /* ─────────────────────────────────────────
     WEBCAM
  ───────────────────────────────────────── */
  useEffect(() => {
    if (navigator.mediaDevices && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => { videoRef.current.srcObject = stream; })
        .catch((err) => console.log("Camera:", err));
    }
  }, []);

  /* ─────────────────────────────────────────
     STAR PARTICLES (canvas)
  ───────────────────────────────────────── */
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.3,
      alpha: Math.random() * 0.7 + 0.3,
      speed: Math.random() * 0.004 + 0.002,
      phase: Math.random() * Math.PI * 2,
    }));

    const draw = (t) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s) => {
        const a = s.alpha * (0.7 + 0.3 * Math.sin(t * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  /* ─────────────────────────────────────────
     JSX
  ───────────────────────────────────────── */
  return (
    <div className={`hl-root ${slideDirection || ""}`}>

      {/* ── FIXED STAR CANVAS ── */}
      <canvas ref={canvasRef} className="hl-stars" aria-hidden="true" />

      {/* ── EARTH (faint background) ── */}
      <div
        className="hl-earth"
        aria-hidden="true"
        style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/earth.png)` }}
      />



      {/* ══════════════════════════════════
          TOP BAR
      ══════════════════════════════════ */}
      <header className="hl-topbar">
        <div className="hl-brand">
          <img src="/logo192.png" alt="Marg AI" className="hl-brand-logo" />
          <div className="hl-brand-text">
            <span className="hl-brand-name">Marg AI</span>
            <span className="hl-brand-sub">AI Interview Coach</span>
          </div>
        </div>
        <nav className="hl-nav-links">
          <button className="hl-nav-btn" onClick={() => triggerTransition("/mock-interview")}>Mock Interview</button>
          <button className="hl-nav-btn" onClick={() => triggerTransition("/practice")}>Practice Coding</button>
        </nav>
        <button className="hl-dash-btn" onClick={() => triggerTransition("/mock-interview")}>Dashboard</button>
      </header>

      {/* ══════════════════════════════════
          HERO — GLASSMORPHISM PANEL
      ══════════════════════════════════ */}
      <main className="hl-hero-wrap">
        <section
          className="hl-glass-hero"
          onMouseMove={handleGlassMove}
          onMouseLeave={handleGlassLeave}
        >
          {/* LEFT — copy */}
          <div className="hl-hero-left">
            <p className="hl-hero-eyebrow">✦ AI-Powered Interview Training</p>
            <h1 className="hl-hero-title">
              Practice interviews.<br />
              Get feedback.<br />
              <span className="hl-gradient-text">Land the job.</span>
            </h1>
            <p className="hl-hero-sub">
              Real-time AI analysis of your speech, code quality &amp; body
              language — all combined into one actionable report.
            </p>

            <div className="hl-ctas">
              <button
                id="btn-start-interview"
                className="hl-btn-primary"
                onClick={() => triggerTransition("/mock-interview")}
              >
                <span className="hl-btn-icon">🎤</span>
                Start Mock Interview
              </button>
              <button
                id="btn-practice-coding"
                className="hl-btn-secondary"
                onClick={() => triggerTransition("/practice")}
              >
                <span className="hl-btn-icon">💻</span>
                Practice Coding
              </button>
            </div>

            {/* Floating badges */}
            <div className="hl-badges">
              <span className="hl-badge">🎯 Real-time Feedback</span>
              <span className="hl-badge">🧠 GPT-Powered Analysis</span>
              <span className="hl-badge">📊 Detailed Reports</span>
            </div>
          </div>

          {/* RIGHT — AI Analysis preview panel */}
          <div className="hl-hero-right">
            <div className="hl-ai-panel">
              <div className="hl-ai-header">
                <span className="hl-dot red" />
                <span className="hl-dot yellow" />
                <span className="hl-dot green" />
                <span className="hl-ai-title">Live AI Analysis</span>
              </div>

              <div className="hl-video-box">
                <video ref={videoRef} className="hl-webcam" autoPlay muted playsInline />
                <div className="hl-face-box" />
                <div className="hl-scan-line" />
                <div className="hl-ai-badge">● ANALYZING</div>
              </div>

              <div className="hl-stats">
                {[
                  { label: "Communication", value: 92, color: "#6366f1" },
                  { label: "Code Accuracy",  value: 87, color: "#3b82f6" },
                  { label: "Confidence",     value: 80, color: "#22d3ee" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="hl-stat-item">
                    <div className="hl-stat-row">
                      <span>{label}</span>
                      <span style={{ color }}>{value}%</span>
                    </div>
                    <div className="hl-slider-track">
                      <div
                        className="hl-slider-fill"
                        style={{ width: `${value}%`, background: `linear-gradient(90deg,${color},#a78bfa)` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="hl-bar-graph" aria-hidden="true">
                {[65,80,55,90,70,85,60,75].map((h, i) => (
                  <span key={i} style={{ "--bar-h": `${h}%`, animationDelay: `${i * 0.08}s` }} />
                ))}
              </div>

              <div className="hl-metrics">
                <div className="hl-metric-chip">
                  <span className="hl-metric-label">Eye Contact</span>
                  <span className="hl-metric-value">Stable</span>
                </div>
                <div className="hl-metric-chip">
                  <span className="hl-metric-label">Code Quality</span>
                  <span className="hl-metric-value">A-</span>
                </div>
                <div className="hl-metric-chip">
                  <span className="hl-metric-label">Speaking Pace</span>
                  <span className="hl-metric-value">128 WPM</span>
                </div>
              </div>

              <p className="hl-analyzing">Analyzing...</p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            FEATURE CARDS ROW
        ══════════════════════════════════ */}
        <section className="hl-features-section">
          <h2 className="hl-section-title">Everything You Need to Ace Your Interview</h2>
          <div className="hl-features-grid">

            <div className="hl-feature-card" id="feature-mock-interview">
              <div className="hl-feature-icon">🎤</div>
              <h3>Mock Interviews</h3>
              <p>AI-powered interviewer simulates real industry questions with live video analysis of your posture, tone, and confidence.</p>
              <button className="hl-feature-btn" onClick={() => triggerTransition("/mock-interview")}>
                Start Interview →
              </button>
            </div>

            <div className="hl-feature-card hl-feature-card--accent" id="feature-coding">
              <div className="hl-feature-icon">💻</div>
              <h3>Coding Practice</h3>
              <p>Solve DSA problems in an in-browser IDE with instant AI feedback on your approach, complexity, and code quality.</p>
              <button className="hl-feature-btn" onClick={() => triggerTransition("/practice")}>
                Practice Now →
              </button>
            </div>

            <div className="hl-feature-card" id="feature-report">
              <div className="hl-feature-icon">📊</div>
              <h3>Detailed Reports</h3>
              <p>Get a comprehensive PDF report covering communication score, code accuracy, confidence levels, and improvement tips.</p>
              <button className="hl-feature-btn" onClick={() => triggerTransition("/report")}>
                View Sample →
              </button>
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════
            STATS ROW
        ══════════════════════════════════ */}
        <section className="hl-stats-section">
          {[
            { number: "10K+", label: "Interviews Completed" },
            { number: "94%", label: "Placement Success Rate" },
            { number: "50+", label: "DSA Topics Covered" },
            { number: "Real-time", label: "AI Feedback" },
          ].map(({ number, label }) => (
            <div key={label} className="hl-stat-card">
              <span className="hl-stat-number">{number}</span>
              <span className="hl-stat-label">{label}</span>
            </div>
          ))}
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="hl-footer">
        © {new Date().getFullYear()} Marg AI · AI Interview Coach · Built for dreamers.
      </footer>
    </div>
  );
}
