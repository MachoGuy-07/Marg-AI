// client/src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!name || !email) return alert("Please enter name and email");

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // store token + user
      localStorage.setItem("marg_token", data.token);
      localStorage.setItem("marg_user", JSON.stringify(data.user));

      // navigate to profile
      nav("/profile");
    } catch (err) {
      console.error("Login error:", err);
      alert("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrap">
      <div className="card auth-card">
        <h2>Welcome to Marg AI</h2>
        <p className="muted">Sign in to save your reports, track progress and access personalized roadmaps.</p>

        <form onSubmit={handleLogin} style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <input
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setName("");
                setEmail("");
              }}
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}