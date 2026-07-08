"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import { useCohort } from "../lib/CohortContext";

const NAV_ITEMS = [
  { label: "Overview", icon: "⊞", path: "/" },
  { label: "Teams", icon: "👤", path: "/teams" },
  { label: "Timeline", icon: "🕐", path: "/timeline" },
  { label: "Spread", icon: "📊", path: "/spread" },
];

export default function Sidebar({ weeksCollected = 0, weekRangeLabel = "No data" }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { cohorts, selectedCohortId, setSelectedCohortId } = useCohort();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // Matches "/teams" as active for both /teams and /teams/[team]
  function isActive(path) {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  }

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <img src="/pulse-logo.png" alt="Pulse" width={32} height={32} style={{ borderRadius: 8 }} />
          <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Pulse</span>
        </div>
        <p style={{ fontSize: 11, color: "rgba(134,239,172,0.6)", marginLeft: 42 }}>Culture Health Check</p>
      </div>

      {/* Cohort selector */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(134,239,172,0.5)", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 6px" }}>Cohort</p>
        <select
          value={selectedCohortId || ""}
          onChange={(e) => setSelectedCohortId(e.target.value)}
          style={{
            width: "100%", fontSize: 12, padding: "6px 10px", borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)",
            color: "#fff", cursor: "pointer",
          }}
        >
          {cohorts.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}{c.is_active ? " · active" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 0", flex: 1 }}>
        {NAV_ITEMS.map(item => {
          const active = isActive(item.path);
          return (
            <button key={item.label}
              onClick={() => router.push(item.path)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 20px", border: "none",
                background: active ? "rgba(34,197,94,0.12)" : "transparent",
                borderLeft: `3px solid ${active ? "#22c55e" : "transparent"}`,
                color: active ? "#fff" : "rgba(134,239,172,0.7)",
                fontSize: 13, cursor: "pointer", textAlign: "left",
              }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Progress */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 14 }}>📈</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: "#fff" }}>{weeksCollected} weeks collected</span>
        </div>
        <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
          <div style={{ height: "100%", width: `${Math.min((weeksCollected / 12) * 100, 100)}%`, background: "#22c55e", borderRadius: 2 }} />
        </div>
        <p style={{ fontSize: 11, color: "rgba(134,239,172,0.5)" }}>{weekRangeLabel}</p>
      </div>

      {/* User */}
      <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, background: "#22c55e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#0a2818", flexShrink: 0 }}>
          {user?.email?.[0]?.toUpperCase() || "?"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user?.email || "Loading..."}
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{ background: "transparent", border: "none", color: "rgba(134,239,172,0.6)", fontSize: 11, cursor: "pointer", padding: "4px 6px" }}
          title="Log out"
        >
          ↪
        </button>
      </div>
    </aside>
  );
}
