// client/src/pages/Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister(e) {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Registration failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      alert("Registration successful ✅");
      nav("/");

    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  }

  return (
    <div className="page-wrap">
      <div className="card auth-card">
        <h2>Create Account</h2>

        <form onSubmit={handleRegister} style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <input
            placeholder="Full Name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            required
          />

          <input
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
            type="email"
          />

          <input
            placeholder="Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
            type="password"
          />

          <button className="btn primary" type="submit">
            Register
          </button>
        </form>
      </div>
    </div>
  );
}