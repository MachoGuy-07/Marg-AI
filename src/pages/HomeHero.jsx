// pages/HomeHero.jsx
import React from "react";
import "../styles/home.css";

/**
 * Hero section that matches the screenshot:
 * - large centered headline
 * - small underline accent
 * - italic tagline
 * - centered red LOGIN button
 */
export default function HomeHero() {
  return (
    <>
      <section id="home" className="hero">
        <div className="hero-overlay" />
        <div className="hero-inner container">
          <div className="hero-content">
            <h1 className="hero-title">Stay steps ahead before the competition begins with Marg AI</h1>

            <div className="accent-row">
              <div className="accent-line" />
            </div>

            <div className="hero-tag">“Your Preparation. Powered by AI.”</div>

            <div className="hero-cta">
              <button className="btn-login">LOGIN</button>
            </div>
          </div>

          <div className="hero-visual">
            {/* decorative illustration circle(s). Replace with an image or SVG as needed */}
            <div className="visual-blob" />
            <div className="visual-avatars">
              <div className="avatar avatar-a" />
              <div className="avatar avatar-b" />
            </div>
          </div>
        </div>
      </section>

      {/* placeholder anchors for other sections */}
      <div id="about" style={{ height: 1 }} />
      <div id="services" style={{ height: 1 }} />
      <div id="testimonials" style={{ height: 1 }} />
      <div id="contact" style={{ height: 1 }} />
      <div id="login" style={{ height: 1 }} />
    </>
  );
}