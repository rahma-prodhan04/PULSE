"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "'Inter', system-ui, sans-serif",
        background: "#f8fafc",
      }}
    >
      {/* Left brand panel — hidden on narrow screens */}
      <div
        className="login-brand-panel"
        style={{
          width: 420,
          flexShrink: 0,
          background: "#0a2818",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Soft glow accent, echoes the curve's optimal-zone green */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(34,197,94,0.18) 0%, rgba(34,197,94,0) 70%)",
          }}
        />

        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <img
              src="/pulse-logo.png"
              alt="Pulse"
              width={36}
              height={36}
              style={{ borderRadius: 9 }}
            />
            <span style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>Pulse</span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(134,239,172,0.6)", marginLeft: 46 }}>
            Culture Health Check
          </p>
        </div>

        <div style={{ position: "relative" }}>
          <p style={{ fontSize: 22, fontWeight: 600, color: "#fff", lineHeight: 1.4, margin: "0 0 12px" }}>
            Read the room, every week.
          </p>
          <p style={{ fontSize: 13, color: "rgba(134,239,172,0.65)", lineHeight: 1.6, margin: 0 }}>
            Track workload, energy, and recovery across every team — plotted against the
            Yerkes-Dodson curve so you can catch strain before it becomes conflict.
          </p>
        </div>

        <p style={{ fontSize: 11, color: "rgba(134,239,172,0.4)", position: "relative", margin: 0 }}>
          Internal tool · supervisors &amp; program managers only
        </p>
      </div>

      {/* Right — login form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ width: "100%", maxWidth: 360 }}>
          {/* Mobile-only logo, shown when the brand panel is hidden */}
          <div
            className="login-mobile-logo"
            style={{ display: "none", alignItems: "center", gap: 10, marginBottom: 28 }}
          >
            <img
              src="/pulse-logo.png"
              alt="Pulse"
              width={32}
              height={32}
              style={{ borderRadius: 8 }}
            />
            <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Pulse</span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 28px" }}>
            Sign in to view team pulse data.
          </p>

          <form onSubmit={handleLogin}>
            <label
              style={{
                display: "block", fontSize: 12, fontWeight: 600, color: "#374151",
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: "100%", padding: "11px 14px", marginBottom: 16,
                border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14,
                boxSizing: "border-box", color: "#0f172a", outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />

            <label
              style={{
                display: "block", fontSize: 12, fontWeight: 600, color: "#374151",
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%", padding: "11px 14px", marginBottom: 20,
                border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14,
                boxSizing: "border-box", color: "#0f172a", outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />

            {error && (
              <div
                style={{
                  background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
                  padding: "9px 12px", marginBottom: 16,
                }}
              >
                <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%", padding: "11px 12px", border: "none", borderRadius: 8,
                background: submitting ? "#86efac" : "#16a34a", color: "#fff",
                fontSize: 14, fontWeight: 600, cursor: submitting ? "default" : "pointer",
                transition: "background 0.15s",
              }}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 24, textAlign: "center" }}>
            Accounts are provisioned by your supervisors — reach out if you need access.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .login-brand-panel { display: none; }
          .login-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  );
}