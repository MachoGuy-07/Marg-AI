import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/login.css";

const TREE_PATHS = [
  { d: "M140 294 L140 228", w: 4.6, delay: 0.02 },
  { d: "M132 294 L132 240", w: 3.2, delay: 0.06 },
  { d: "M148 294 L148 240", w: 3.2, delay: 0.1 },
  { d: "M140 236 L116 212", w: 2.8, delay: 0.14 },
  { d: "M140 236 L164 212", w: 2.8, delay: 0.18 },
  { d: "M132 246 L102 226", w: 2.5, delay: 0.22 },
  { d: "M148 246 L178 226", w: 2.5, delay: 0.26 },
  { d: "M116 212 L94 188", w: 2.2, delay: 0.3 },
  { d: "M116 212 L138 186", w: 2.2, delay: 0.34 },
  { d: "M164 212 L142 186", w: 2.2, delay: 0.38 },
  { d: "M164 212 L186 188", w: 2.2, delay: 0.42 },
  { d: "M102 226 L80 208", w: 2, delay: 0.46 },
  { d: "M178 226 L200 208", w: 2, delay: 0.5 },
  { d: "M94 188 L72 170", w: 1.9, delay: 0.54 },
  { d: "M138 186 L124 164", w: 1.9, delay: 0.58 },
  { d: "M142 186 L156 164", w: 1.9, delay: 0.62 },
  { d: "M186 188 L208 170", w: 1.9, delay: 0.66 },
  { d: "M72 170 L54 170", w: 1.7, delay: 0.7 },
  { d: "M80 208 L58 216", w: 1.7, delay: 0.74 },
  { d: "M200 208 L222 216", w: 1.7, delay: 0.78 },
  { d: "M208 170 L226 170", w: 1.7, delay: 0.82 },
  { d: "M124 164 L112 144", w: 1.7, delay: 0.86 },
  { d: "M156 164 L168 144", w: 1.7, delay: 0.9 },
  { d: "M112 144 L98 132", w: 1.5, delay: 0.94 },
  { d: "M168 144 L182 132", w: 1.5, delay: 0.98 },
  { d: "M98 132 L82 124", w: 1.4, delay: 1.02 },
  { d: "M182 132 L198 124", w: 1.4, delay: 1.06 },
  { d: "M98 132 L98 106", w: 1.5, delay: 1.1 },
  { d: "M182 132 L182 106", w: 1.5, delay: 1.14 },
  { d: "M98 106 L84 92", w: 1.4, delay: 1.18 },
  { d: "M182 106 L196 92", w: 1.4, delay: 1.22 },
  { d: "M84 92 L66 84", w: 1.3, delay: 1.26 },
  { d: "M196 92 L214 84", w: 1.3, delay: 1.3 },
  { d: "M124 164 L124 130", w: 1.6, delay: 1.34 },
  { d: "M156 164 L156 130", w: 1.6, delay: 1.38 },
  { d: "M124 130 L140 110", w: 1.5, delay: 1.42 },
  { d: "M156 130 L140 110", w: 1.5, delay: 1.46 },
  { d: "M140 110 L140 88", w: 1.4, delay: 1.5 },
  { d: "M140 88 L120 74", w: 1.3, delay: 1.54 },
  { d: "M140 88 L160 74", w: 1.3, delay: 1.58 },
  { d: "M120 74 L102 68", w: 1.2, delay: 1.62 },
  { d: "M160 74 L178 68", w: 1.2, delay: 1.66 },
];

const TREE_NODES = [
  { cx: 54, cy: 170, delay: 1.26 },
  { cx: 58, cy: 216, delay: 1.3 },
  { cx: 66, cy: 84, delay: 1.34 },
  { cx: 72, cy: 170, delay: 1.38 },
  { cx: 82, cy: 124, delay: 1.42 },
  { cx: 84, cy: 92, delay: 1.46 },
  { cx: 98, cy: 132, delay: 1.5 },
  { cx: 98, cy: 106, delay: 1.54 },
  { cx: 102, cy: 68, delay: 1.58 },
  { cx: 112, cy: 144, delay: 1.62 },
  { cx: 120, cy: 74, delay: 1.66 },
  { cx: 124, cy: 130, delay: 1.7 },
  { cx: 124, cy: 164, delay: 1.74 },
  { cx: 138, cy: 186, delay: 1.78 },
  { cx: 140, cy: 88, delay: 1.82 },
  { cx: 140, cy: 110, delay: 1.86 },
  { cx: 156, cy: 164, delay: 1.9 },
  { cx: 156, cy: 130, delay: 1.94 },
  { cx: 160, cy: 74, delay: 1.98 },
  { cx: 168, cy: 144, delay: 2.02 },
  { cx: 178, cy: 68, delay: 2.06 },
  { cx: 182, cy: 132, delay: 2.1 },
  { cx: 182, cy: 106, delay: 2.14 },
  { cx: 196, cy: 92, delay: 2.18 },
  { cx: 198, cy: 124, delay: 2.22 },
  { cx: 208, cy: 170, delay: 2.26 },
  { cx: 214, cy: 84, delay: 2.3 },
  { cx: 222, cy: 216, delay: 2.34 },
  { cx: 226, cy: 170, delay: 2.38 },
];

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

function isSignupPath(pathname, defaultMode) {
  if (defaultMode === "signup") return true;
  return pathname === "/register";
}

export default function Login({ defaultMode = "login" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState(
    isSignupPath(location.pathname, defaultMode) ? "signup" : "login"
  );
  const [treeCycle, setTreeCycle] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(
    process.env.REACT_APP_GOOGLE_CLIENT_ID || ""
  );
  const [error, setError] = useState("");

  const visibleError = useMemo(() => {
    const message = String(error || "").trim();
    if (!message) return "";
    if (/react_app_google_client_id|enable google sign-?in/i.test(message)) {
      return "";
    }
    return message;
  }, [error]);

  useEffect(() => {
    setMode(isSignupPath(location.pathname, defaultMode) ? "signup" : "login");
  }, [defaultMode, location.pathname]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTreeCycle((prev) => prev + 1);
    }, 10000);

    return () => window.clearInterval(interval);
  }, []);

  const heading = useMemo(
    () =>
      mode === "login"
        ? "Sign in and continue your interview prep."
        : "Create your account and start your interview journey.",
    [mode]
  );

  useEffect(() => {
    if (googleClientId) return;

    let canceled = false;

    const fetchAuthConfig = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/config`);
        if (!response.ok) return;
        const data = await response.json();
        if (canceled) return;
        const nextClientId = String(data?.googleClientId || "").trim();
        if (nextClientId) {
          setGoogleClientId(nextClientId);
        }
      } catch {
        // Ignore config fetch failures; local auth still works.
      }
    };

    void fetchAuthConfig();

    return () => {
      canceled = true;
    };
  }, [googleClientId]);

  const handleGoogleCredential = useCallback(
    async (credential) => {
      if (!credential) {
        setError("Google sign-in was cancelled.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential }),
        });

        const data = await response.json();
        if (!response.ok) {
          setError(data.error || "Google sign-in failed.");
          return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/", { replace: true });
      } catch (googleError) {
        console.error("Google sign-in error:", googleError);
        setError("Google sign-in failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (!googleClientId) return undefined;

    let canceled = false;

    const setupGoogle = () => {
      if (canceled) return;
      const googleApi = window.google?.accounts?.id;
      if (!googleApi) return;

      googleApi.initialize({
        client_id: googleClientId,
        callback: (response) => {
          void handleGoogleCredential(response.credential);
        },
      });

      const buttonContainer = document.getElementById("auth-google-button");
      if (buttonContainer) {
        buttonContainer.innerHTML = "";
        googleApi.renderButton(buttonContainer, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: 220,
          logo_alignment: "left",
        });
      }

    };

    if (window.google?.accounts?.id) {
      setupGoogle();
      return () => {
        canceled = true;
      };
    }

    const scriptId = "google-identity-services-script";
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      existingScript.addEventListener("load", setupGoogle);
      return () => {
        canceled = true;
        existingScript.removeEventListener("load", setupGoogle);
      };
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = setupGoogle;
    script.onerror = () => {
      if (!canceled) {
        setError("Google sign-in failed to load.");
      }
    };
    document.head.appendChild(script);

    return () => {
      canceled = true;
      script.onload = null;
      script.onerror = null;
    };
  }, [googleClientId, handleGoogleCredential]);

  const handleRootMove = (event) => {
    const root = event.currentTarget;
    const rect = root.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    root.style.setProperty("--auth-cursor-x", `${x}px`);
    root.style.setProperty("--auth-cursor-y", `${y}px`);
    root.style.setProperty("--auth-cursor-active", "1");
  };

  const handleRootLeave = (event) => {
    const root = event.currentTarget;
    root.style.setProperty("--auth-cursor-active", "0");
  };

  const handleSwitchMode = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setError("");
    if (nextMode === "signup") {
      navigate("/register", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email || !password || (mode === "signup" && !name.trim())) {
      setError("Please complete all required fields.");
      return;
    }

    const endpoint =
      mode === "login"
        ? `${API_BASE_URL}/api/auth/login`
        : `${API_BASE_URL}/api/auth/register`;
    const payload =
      mode === "login"
        ? { email: email.trim(), password }
        : { name: name.trim(), email: email.trim(), password };

    try {
      setLoading(true);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        setError(
          data.error ||
            (mode === "login"
              ? `Login failed (${response.status}).`
              : `Sign up failed (${response.status}).`)
        );
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/", { replace: true });
    } catch (submitError) {
      console.error("Authentication request failed:", submitError);
      setError(
        `Cannot reach server at ${API_BASE_URL}. Start backend with: cd server && npm run dev`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-root"
      onMouseMove={handleRootMove}
      onMouseLeave={handleRootLeave}
      style={{
        "--auth-cursor-x": "50%",
        "--auth-cursor-y": "45%",
        "--auth-cursor-active": "0",
      }}
    >
      <div className="auth-stars auth-stars-one" aria-hidden="true" />
      <div className="auth-stars auth-stars-two" aria-hidden="true" />
      <div className="auth-stars auth-stars-three" aria-hidden="true" />

      <main className="auth-frame">
        <section className="auth-left">
          <div className="auth-brand">
            <span className="auth-brand-mark" aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <defs>
                  <linearGradient id="authBrandGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#39d7ff" />
                    <stop offset="55%" stopColor="#6f6dff" />
                    <stop offset="100%" stopColor="#d75bff" />
                  </linearGradient>
                </defs>
                <rect x="2.5" y="2.5" width="43" height="43" rx="13" fill="url(#authBrandGrad)" />
                <path
                  d="M12 31V16l8.6 9.4L24 22l3.4 3.4L36 16v15"
                  fill="none"
                  stroke="#eef4ff"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="31" r="1.8" fill="#c7f4ff" />
                <circle cx="36" cy="31" r="1.8" fill="#c7f4ff" />
              </svg>
            </span>
            <p>
              <strong>Marg AI</strong>
              <span>AI Interview Coach</span>
            </p>
          </div>

          <h1>Bridge the gap between learning and earning.</h1>
          <p className="auth-copy">
            Master technical coding and ace AI-powered mock interviews.
          </p>
          <p className="auth-subcopy">{heading}</p>

          <div className="auth-tree-shell" aria-hidden="true">
            <svg key={`tree-${treeCycle}`} viewBox="0 0 280 320" className="auth-tree-svg">
              <defs>
                <linearGradient id="authTreeStrokeCore" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#58d4ff" />
                  <stop offset="52%" stopColor="#6f8dff" />
                  <stop offset="100%" stopColor="#cf5eff" />
                </linearGradient>
                <linearGradient id="authTreeStrokeSheen" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(178, 236, 255, 0.85)" />
                  <stop offset="52%" stopColor="rgba(221, 229, 255, 0.8)" />
                  <stop offset="100%" stopColor="rgba(242, 209, 255, 0.78)" />
                </linearGradient>
                <radialGradient id="authTreeNodeFill" cx="35%" cy="35%" r="75%">
                  <stop offset="0%" stopColor="#f6fbff" />
                  <stop offset="40%" stopColor="#9feaff" />
                  <stop offset="100%" stopColor="#b766ff" />
                </radialGradient>
              </defs>

              {TREE_PATHS.map((branch) => (
                <path
                  key={`${branch.d}-shadow`}
                  d={branch.d}
                  className="auth-tree-path-shadow"
                  style={{ strokeWidth: branch.w + 1.35 }}
                />
              ))}

              {TREE_PATHS.map((branch) => (
                <path
                  key={`${branch.d}-base`}
                  d={branch.d}
                  className="auth-tree-path-base"
                  style={{ strokeWidth: branch.w + 0.45 }}
                />
              ))}

              {TREE_PATHS.map((branch, index) => (
                <path
                  key={branch.d}
                  d={branch.d}
                  className="auth-tree-path"
                  style={{
                    strokeWidth: branch.w,
                    animationDelay: `${branch.delay}s`,
                    opacity: index < 3 ? 0.95 : 0.88,
                  }}
                />
              ))}

              {TREE_PATHS.map((branch, index) => (
                <path
                  key={`${branch.d}-sheen`}
                  d={branch.d}
                  className="auth-tree-path-sheen"
                  style={{
                    strokeWidth: Math.max(0.85, branch.w * 0.42),
                    animationDelay: `${branch.delay + 0.08}s`,
                    opacity: index < 8 ? 0.65 : 0.48,
                  }}
                />
              ))}

              {TREE_NODES.map((node) => (
                <g key={`${node.cx}-${node.cy}`}>
                  <circle
                    cx={node.cx}
                    cy={node.cy}
                    r={node.cx % 4 === 0 ? 6.4 : 5.8}
                    className="auth-tree-node-halo"
                    style={{ "--node-delay": `${node.delay}s` }}
                  />
                  <circle
                    cx={node.cx}
                    cy={node.cy}
                    r={node.cx % 4 === 0 ? 4.2 : 3.5}
                    className="auth-tree-node"
                    style={{ "--node-delay": `${node.delay}s` }}
                  />
                </g>
              ))}
            </svg>
            <span className="auth-tree-glow" />
          </div>
        </section>

        <section className="auth-right">
          <div className="auth-card">
            <div className="auth-mode-wrap" role="tablist" aria-label="Authentication mode">
              <span
                className={`auth-mode-pill ${mode === "signup" ? "is-signup" : ""}`}
                aria-hidden="true"
              />
              <button
                type="button"
                className={mode === "login" ? "active" : ""}
                onClick={() => handleSwitchMode("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={mode === "signup" ? "active" : ""}
                onClick={() => handleSwitchMode("signup")}
              >
                Sign Up
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === "signup" ? (
                <label>
                  <span>Full Name</span>
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="Full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </label>
              ) : null}

              <label>
                <span>Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              <label>
                <span>Password</span>
                <div className="auth-password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder="Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M1 12C2.7 8.1 6.5 5.5 12 5.5S21.3 8.1 23 12c-1.7 3.9-5.5 6.5-11 6.5S2.7 15.9 1 12Z" />
                      <circle cx="12" cy="12" r="3.2" />
                    </svg>
                  </button>
                </div>
              </label>

              {visibleError ? <p className="auth-error">{visibleError}</p> : null}

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
              </button>
            </form>

            <div className="auth-social">
              {googleClientId ? (
                <div className="auth-google-host">
                  <div id="auth-google-button" />
                </div>
              ) : (
                <button type="button" className="auth-google-fallback" disabled aria-label="Google">
                  <span className="social-badge social-google">G</span>
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  setError("LinkedIn sign-in is not configured yet. Use email or Google.")
                }
                disabled={loading}
              >
                <span className="social-badge social-linkedin">in</span>
                LinkedIn
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
