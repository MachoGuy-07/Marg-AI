// client/src/pages/AIInterview.jsx
import React, { useEffect, useRef } from "react";

const copy = `Our AI-based interview platform makes preparing for interviews easier and more effective. It simulates real interview scenarios, evaluates your communication, confidence, and body language, and analyzes your answers in real time. With personalized feedback after each session, you clearly understand your strengths and what to improve. The platform adapts to your progress with targeted questions and industry-specific challenges. By offering a safe space to practice and refine your performance, it helps you walk into every interview more prepared, confident, and ahead of the competition.`;

export default function AIInterview() {
  const sectionRef = useRef(null);

  // Intersection observer to trigger reveal animation
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add("reveal");
          } else {
            el.classList.remove("reveal");
          }
        });
      },
      { threshold: 0.25 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="ai-interview" ref={sectionRef} className="ai-section">
      <div className="ai-inner container">
        <h2 className="ai-heading">AI Interview</h2>
        <div className="ai-content">
          <p className="ai-text">{copy}</p>
        </div>
      </div>
    </section>
  );
}