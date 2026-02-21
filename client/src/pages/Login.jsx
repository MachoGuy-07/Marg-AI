// client/src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    if (!email || !password) {
      return alert("Please enter email and password");
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed");
        return;
      }

      // ✅ store token + user (MATCH WHAT REPORT EXPECTS)
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      alert("Login successful ✅");

      nav("/");

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
        <h2>Welcome Back</h2>
        <p className="muted">
          Sign in to save reports and track your interview progress.
        </p>

        <form onSubmit={handleLogin} style={{ display: "grid", gap: 12, marginTop: 12 }}>
          
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
          />

          <input
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
          />

          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>
      </div>
    </div>
  );
}