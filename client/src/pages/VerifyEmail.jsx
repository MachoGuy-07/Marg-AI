import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "../styles/login.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/verify-email/${token}`);
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
          setTimeout(() => navigate("/login", { replace: true }), 3000);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Network error. Please try again later.");
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="auth-root" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="auth-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        <h2>Email Verification</h2>
        <div style={{ marginTop: '20px' }}>
          {status === "verifying" && <p>Verifying your email, please wait...</p>}
          {status === "success" && (
            <div>
              <p style={{ color: '#4caf50', marginBottom: '16px' }}>{message}</p>
              <p style={{ fontSize: '14px', color: '#aab' }}>Redirecting to login...</p>
            </div>
          )}
          {status === "error" && (
            <div>
              <p className="auth-error" style={{ marginBottom: '16px' }}>{message}</p>
              <Link to="/login" className="btn primary" style={{ display: 'inline-block', color: '#fff', textDecoration: 'none' }}>
                Go to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
