"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import LoadingAnimation from "../LoadingAnimation";

function avg(arr) {
  if (!arr.length) return 0;
  return parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));
}

function getZoneColor(v) {
  if (v >= 4 && v <= 6) return "#16a34a";
  if ((v >= 2 && v < 4) || (v > 6 && v <= 8)) return "#d97706";
  return "#dc2626";
}

function getZoneBadge(arousal) {
  if (arousal >= 4 && arousal <= 6) return { bg: "#dcfce7", text: "#15803d", label: "Optimal" };
  if ((arousal >= 2 && arousal < 4) || (arousal > 6 && arousal <= 8)) return { bg: "#fef3c7", text: "#92400e", label: "Caution" };
  return { bg: "#fee2e2", text: "#991b1b", label: "Risk" };
}

function Cell({ value }) {
  const color = getZoneColor(value);
  const bg = color === "#16a34a" ? "#f0fdf4" : color === "#d97706" ? "#fffbeb" : "#fef2f2";
  return (
    <td style={{ padding: "12px 16px", textAlign: "center" }}>
      <span style={{
        display: "inline-block", minWidth: 44, padding: "3px 10px",
        borderRadius: 8, fontSize: 13, fontWeight: 600,
        color, background: bg,
      }}>
        {value}
      </span>
    </td>
  );
}

const RANK_ICONS = { 1: "🥇", 2: "🥈", 3: "🥉" };

const COLUMNS = [
  { key: "overall", label: "G-Score" },
  { key: "arousal", label: "Arousal" },
  { key: "workload", label: "Workload" },
  { key: "energy", label: "Energy" },
  { key: "recovery", label: "Recovery" },
  { key: "motivation", label: "Motivation" },
  { key: "social", label: "Social" },
];

export default function Teams() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [sortBy, setSortBy] = useState("overall");
  const [sortDir, setSortDir] = useState("desc");
  const [hoveredRow, setHoveredRow] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from("survey_responses")
        .select(`q1_workload, q2_energy, q3_recovery, q4_motivation, q5_social, teams ( name )`);

      if (error) { console.error(error); return; }

      const teamMap = {};
      data.forEach(r => {
        const name = r.teams?.name || "Unknown";
        if (!teamMap[name]) teamMap[name] = { workload: [], energy: [], recovery: [], motivation: [], social: [] };
        teamMap[name].workload.push(r.q1_workload);
        teamMap[name].energy.push(r.q2_energy);
        teamMap[name].recovery.push(r.q3_recovery);
        teamMap[name].motivation.push(r.q4_motivation);
        teamMap[name].social.push(r.q5_social);
      });

      const teamData = Object.entries(teamMap).map(([name, dims]) => {
        const workload = avg(dims.workload);
        const energy = avg(dims.energy);
        const recovery = avg(dims.recovery);
        const motivation = avg(dims.motivation);
        const social = avg(dims.social);
        const overall = avg([workload, energy, recovery, motivation, social]);
        const arousal = avg([workload, energy, recovery, motivation]);
        return { name, workload, energy, recovery, motivation, social, overall, arousal };
      }).sort((a, b) => b.overall - a.overall);

      setTeams(teamData);
    }
    fetchData();
  }, []);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir(d => d === "desc" ? "asc" : "desc");
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  const sorted = [...teams].sort((a, b) =>
    sortDir === "desc" ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy]
  );

  if (loading) return <LoadingAnimation onDone={() => setLoading(false)} />;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', system-ui, sans-serif", background: "#f8fafc", overflow: "hidden" }}>

      {/* Sidebar */}
      <aside style={{ width: 200, background: "#0a2818", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, background: "rgba(34,197,94,0.15)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💚</div>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Pulse</span>
          </div>
          <p style={{ fontSize: 11, color: "rgba(134,239,172,0.6)", marginLeft: 42 }}>Culture Health Check</p>
        </div>
        <nav style={{ padding: "12px 0", flex: 1 }}>
          {[
            { label: "Overview", icon: "⊞" },
            { label: "Teams", icon: "👤", active: true },
            { label: "Timeline", icon: "🕐" },
          ].map(item => (
            <button key={item.label}
              onClick={() => {
                if (item.label === "Overview") router.push("/");
                if (item.label === "Timeline") router.push("/timeline");
                if (item.label === "Teams") router.push("/teams");
              }}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 20px", border: "none",
                background: item.active ? "rgba(34,197,94,0.12)" : "transparent",
                borderLeft: `3px solid ${item.active ? "#22c55e" : "transparent"}`,
                color: item.active ? "#fff" : "rgba(134,239,172,0.7)",
                fontSize: 13, cursor: "pointer", textAlign: "left",
              }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "#22c55e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#0a2818", flexShrink: 0 }}>N</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", margin: 0 }}>Nina</p>
            <p style={{ fontSize: 11, color: "rgba(134,239,172,0.5)", margin: 0 }}>Admin</p>
          </div>
          <span style={{ color: "rgba(134,239,172,0.5)", fontSize: 12 }}>▾</span>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Topbar */}
        <header style={{ padding: "20px 28px 16px", background: "#fff", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Teams</h1>
              <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                {teams.length} teams · click any column header to sort
              </p>
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, padding: "8px 16px", border: "none", borderRadius: 8, background: "#16a34a", color: "#fff", cursor: "pointer" }}>
              ⬇ Export
            </button>
          </div>
        </header>

        {/* Body */}
        <main style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>

          {/* Legend */}
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            {[["#16a34a", "#f0fdf4", "Optimal (4–6)"], ["#d97706", "#fffbeb", "Caution (2–4, 6–8)"], ["#dc2626", "#fef2f2", "Risk (1–2, 9–10)"]].map(([color, bg, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 28, height: 16, borderRadius: 4, background: bg, border: `1px solid ${color}`, display: "inline-block" }} />
                <span style={{ fontSize: 12, color: "#64748b" }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase", width: 48 }}>Rank</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>Team</th>
                  {COLUMNS.map(col => (
                    <th key={col.key}
                      onClick={() => handleSort(col.key)}
                      style={{
                        padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 600,
                        color: sortBy === col.key ? "#16a34a" : "#64748b",
                        letterSpacing: "0.06em", textTransform: "uppercase",
                        cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
                      }}>
                      {col.label} {sortBy === col.key ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
                    </th>
                  ))}
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>Zone</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((team, i) => {
                  const rank = i + 1;
                  const badge = getZoneBadge(team.arousal);
                  const originalRank = teams.findIndex(t => t.name === team.name) + 1;
                  return (
                    <tr key={team.name}
                      onMouseEnter={() => setHoveredRow(team.name)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        background: hoveredRow === team.name ? "#f8fafc" : "#fff",
                        transition: "background 0.1s",
                      }}>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        {RANK_ICONS[originalRank]
                          ? <span style={{ fontSize: 18 }}>{RANK_ICONS[originalRank]}</span>
                          : <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>{originalRank}</span>
                        }
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{team.name}</span>
                      </td>
                      <Cell value={team.overall} />
                      <Cell value={team.arousal} />
                      <Cell value={team.workload} />
                      <Cell value={team.energy} />
                      <Cell value={team.recovery} />
                      <Cell value={team.motivation} />
                      <Cell value={team.social} />
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20, background: badge.bg, color: badge.text }}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
            {[
              { label: "Top performing team", value: teams[0]?.name || "—", sub: `${teams[0]?.overall ?? "—"} g-score`, color: "#16a34a", icon: "🥇" },
              { label: "Needs attention", value: teams[teams.length - 1]?.name || "—", sub: `${teams[teams.length - 1]?.overall ?? "—"} g-score`, color: "#dc2626", icon: "⚠️" },
              { label: "Cohort avg g-score", value: avg(teams.map(t => t.overall)).toFixed(2), sub: "Across all teams", color: "#0f172a", icon: "📊" },
              { label: "Teams in optimal zone", value: teams.filter(t => t.arousal >= 4 && t.arousal <= 6).length.toString(), sub: `of ${teams.length} teams`, color: "#16a34a", icon: "✅" },
            ].map(m => (
              <div key={m.label} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>{m.icon}</span>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>{m.label}</p>
                </div>
                <p style={{ fontSize: 22, fontWeight: 700, color: m.color, margin: "0 0 3px", lineHeight: 1 }}>{m.value}</p>
                <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>{m.sub}</p>
              </div>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}