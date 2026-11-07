"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div style={{
      display: "flex", minHeight: "100vh",
      fontFamily: "'Inter', system-ui, sans-serif",
      background: "#f8fafc",
    }}>

      {/* ── Left brand panel ── */}
      <div className="login-brand-panel" style={{
        width: 440, flexShrink: 0,
        background: "#0a2818",
        display: "flex", flexDirection: "column",
        justifyContent: "space-between",
        padding: "48px 40px",
        position: "relative", overflow: "hidden",
      }}>

        {/* Ambient glow */}
        <div style={{
          position: "absolute", top: -100, right: -100,
          width: 320, height: 320, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0) 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -60, left: -60,
          width: 240, height: 240, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0) 70%)",
          pointerEvents: "none",
        }} />

        {/* Logo */}
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <img src="/pulse-logo.png" alt="Pulse" width={36} height={36} style={{ borderRadius: 9 }} />
            <span style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>Pulse</span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(134,239,172,0.6)", marginLeft: 46, margin: "0 0 0 46px" }}>
            Culture Health Check
          </p>
        </div>

        {/* Headline */}
        <div style={{ position: "relative" }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: "#fff", lineHeight: 1.3, margin: "0 0 6px" }}>
            Understand your team.
          </p>
          <p style={{ fontSize: 28, fontWeight: 700, color: "#22c55e", lineHeight: 1.3, margin: "0 0 16px" }}>
            Strengthen your culture.
          </p>
          <p style={{ fontSize: 13, color: "rgba(134,239,172,0.65)", lineHeight: 1.7, margin: 0 }}>
            Pulse helps program managers track workload, energy, and recovery across
            teams — so you can catch strain early and build a healthier culture.
          </p>
        </div>

        {/* Mock dashboard card */}
        <div style={{
          position: "relative",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14, padding: "20px 22px",
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            This Week's Pulse
          </p>

          {[
            { label: "Energy", pct: 84, color: "#22c55e" },
            { label: "Workload", pct: 72, color: "#3b82f6" },
            { label: "Recovery", pct: 90, color: "#a855f7" },
          ].map(d => (
            <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", width: 70, flexShrink: 0 }}>{d.label}</span>
              <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${d.pct}%`, height: "100%", background: d.color, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", width: 36, textAlign: "right" }}>{d.pct}%</span>
            </div>
          ))}

          <div style={{ display: "flex", gap: 20, marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 2px" }}>Burnout Risk</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#22c55e", margin: 0 }}>Low</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 2px" }}>Team Trend</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#22c55e", margin: 0 }}>↑ +8% <span style={{ fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>vs last week</span></p>
            </div>
          </div>
        </div>

        {/* Quote */}
        <div style={{ position: "relative", display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            background: "rgba(34,197,94,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>💬</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: "0 0 3px" }}>
              Healthy teams make better decisions.
            </p>
            <p style={{ fontSize: 12, color: "rgba(134,239,172,0.5)", margin: 0 }}>
              Great cultures drive great outcomes.
            </p>
          </div>
        </div>

        <p style={{ fontSize: 11, color: "rgba(134,239,172,0.35)", position: "relative", margin: 0 }}>
          Internal tool · Supervisors &amp; program managers only
        </p>
      </div>

      {/* ── Right login form ── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center",
        justifyContent: "center", padding: 24,
      }}>
        <div style={{ width: "100%", maxWidth: 380 }}>

          {/* Mobile-only logo */}
          <div className="login-mobile-logo" style={{ display: "none", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <img src="/pulse-logo.png" alt="Pulse" width={32} height={32} style={{ borderRadius: 8 }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Pulse</span>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
            Welcome back 👋
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 32px", lineHeight: 1.6 }}>
            See how your team is performing this week. Track workload, energy, and recovery before small issues become major ones.
          </p>

          <form onSubmit={handleLogin}>

            {/* Email */}
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Email
            </label>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <span style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                fontSize: 15, color: "#94a3b8", pointerEvents: "none",
              }}>✉</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: "100%", padding: "11px 14px 11px 36px",
                  border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14,
                  boxSizing: "border-box", color: "#0f172a", outline: "none",
                  background: "#fff", transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>

            {/* Password */}
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: "relative", marginBottom: 24 }}>
              <span style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                fontSize: 15, color: "#94a3b8", pointerEvents: "none",
              }}>🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%", padding: "11px 40px 11px 36px",
                  border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14,
                  boxSizing: "border-box", color: "#0f172a", outline: "none",
                  background: "#fff", transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 14, color: "#94a3b8", padding: 0,
                }}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 8, padding: "9px 12px", marginBottom: 16,
              }}>
                <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%", padding: "12px", border: "none", borderRadius: 8,
                background: submitting ? "#86efac" : "#16a34a",
                color: "#fff", fontSize: 14, fontWeight: 600,
                cursor: submitting ? "default" : "pointer",
                transition: "background 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {submitting ? "Signing in…" : <><span>Continue</span><span>→</span></>}
            </button>
          </form>

          {/* Trust badges */}
          <div style={{ margin: "28px 0 0", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
              <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>🛡 Secure &amp; private</span>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { icon: "🔐", label: "Secure Login", sub: "End-to-end encryption" },
                { icon: "👥", label: "Internal Platform", sub: "Authorised access only" },
                { icon: "🛡", label: "Your Data, Protected", sub: "Privacy you can trust" },
              ].map(b => (
                <div key={b.label} style={{ textAlign: "center" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "#f0fdf4", margin: "0 auto 8px",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                  }}>{b.icon}</div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#374151", margin: "0 0 2px" }}>{b.label}</p>
                  <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>{b.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 24, textAlign: "center" }}>
            Accounts are provisioned by your supervisors — reach out if you need access.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .login-brand-panel { display: none !important; }
          .login-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  );
}