// client/src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const nav = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("marg_user") || "null");
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // fetch authoritative profile from backend if token exists
  useEffect(() => {
    const token = localStorage.getItem("marg_token");
    if (!token) return;

    setLoading(true);
    fetch("http://localhost:5000/api/auth/profile", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed to load profile");
        // update local user from server
        setUser(d.user);
        localStorage.setItem("marg_user", JSON.stringify(d.user));
      })
      .catch((err) => {
        console.error("Profile fetch error:", err);
        setError(err.message || "Failed to fetch profile");
      })
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    localStorage.removeItem("marg_token");
    localStorage.removeItem("marg_user");
    setUser(null);
    nav("/");
  }

  if (loading) {
    return (
      <div className="page-wrap">
        <div className="card">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-wrap">
        <div className="card">
          <h3>You are not signed in</h3>
          <p>
            <a href="/login">Sign in</a> to access your profile and saved reports.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="profile-grid">
        <div className="card profile-card">
          <div className="profile-header">
            <div className="avatar">{(user.name || "U").split(" ").map(n => n[0]).slice(0,2).join("")}</div>
            <div>
              <h2 style={{ margin: 0 }}>{user.name}</h2>
              <div className="muted">{user.email}</div>
              <div className="muted">Member since {new Date(user.createdAt || user.joined || Date.now()).toLocaleDateString()}</div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <button className="btn primary" onClick={() => nav("/mock-interview")}>Start Mock Interview</button>
            <button className="btn" onClick={handleLogout} style={{ marginLeft: 8 }}>Sign out</button>
          </div>
        </div>

        <div className="card stats-card">
          <h3>Your progress</h3>
          <ul>
            <li>Mock interviews attended: <strong>3</strong></li>
            <li>Average communication score: <strong>7.8/10</strong></li>
            <li>Last interview: <strong>{new Date().toLocaleDateString()}</strong></li>
          </ul>

          <hr />

          <h4>Saved Reports</h4>
          <p className="muted">No saved reports yet – they will appear here after sessions.</p>

          {error && <div style={{ color: "salmon", marginTop: 12 }}>{error}</div>}
        </div>
      </div>
    </div>
  );
}