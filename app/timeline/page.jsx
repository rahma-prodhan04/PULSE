"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer,
  Tooltip, Legend, ReferenceLine,
} from "recharts";
import LoadingAnimation from "../LoadingAnimation";

function avg(arr) {
  if (!arr.length) return 0;
  return parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));
}

function getWeekNumber(dateStr) {
  const programStart = new Date("2026-06-01");
  const current = new Date(dateStr);
  const diff = Math.round((current - programStart) / (7 * 24 * 60 * 60 * 1000));
  return diff + 3;
}

const TEAM_COLORS = [
  "#16a34a", "#2563eb", "#d97706", "#dc2626", "#7c3aed",
  "#0891b2", "#db2777", "#65a30d", "#ea580c", "#0f172a", "#64748b",
];

export default function Timeline() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [teamNames, setTeamNames] = useState([]);
  const [hoveredTeam, setHoveredTeam] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from("survey_responses")
        .select(`q1_workload, q2_energy, q3_recovery, q4_motivation, q5_social, week_start, teams ( name )`);

      if (error) { console.error(error); return; }

      // Group by week then team
      const weekTeamMap = {};
      data.forEach(r => {
        const week = r.week_start;
        const team = r.teams?.name || "Unknown";
        if (!weekTeamMap[week]) weekTeamMap[week] = {};
        if (!weekTeamMap[week][team]) weekTeamMap[week][team] = [];
        weekTeamMap[week][team].push(
          avg([r.q1_workload, r.q2_energy, r.q3_recovery, r.q4_motivation, r.q5_social])
        );
      });

      // Get all unique teams
      const allTeams = [...new Set(data.map(r => r.teams?.name).filter(Boolean))].sort();
      setTeamNames(allTeams);

      // Build chart data — one row per week
      const rows = Object.entries(weekTeamMap)
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .map(([week, teams]) => {
          const row = { week: `Week ${getWeekNumber(week)}`, weekDate: week };
          allTeams.forEach(team => {
            const scores = teams[team] || [];
            row[team] = scores.length ? avg(scores) : null;
          });
          return row;
        });

      setChartData(rows);
    }
    fetchData();
  }, []);

  if (loading) return <LoadingAnimation onDone={() => setLoading(false)} />;

  // Summary stats per team
  const teamStats = teamNames.map((name, i) => {
    const scores = chartData.map(d => d[name]).filter(v => v !== null);
    const avgScore = avg(scores);
    const trend = scores.length >= 2 ? scores[scores.length - 1] - scores[0] : 0;
    return { name, avg: avgScore, trend, color: TEAM_COLORS[i % TEAM_COLORS.length] };
  }).sort((a, b) => b.avg - a.avg);

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
            { label: "Teams", icon: "👤" },
            { label: "Timeline", icon: "🕐", active: true },
          ].map(item => (
            <button key={item.label}
              onClick={() => {
                if (item.label === "Overview") router.push("/");
                if (item.label === "Timeline") router.push("/timeline");
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
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Timeline</h1>
              <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                {teamNames.length} teams · {chartData.length} weeks · all scores over time
              </p>
            </div>
            <button
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, padding: "8px 16px", border: "none", borderRadius: 8, background: "#16a34a", color: "#fff", cursor: "pointer" }}
            >
              ⬇ Export
            </button>
          </div>
        </header>

        {/* Body */}
        <main style={{ flex: 1, overflowY: "auto", padding: "20px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Main chart */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0 }}>Team g-score trajectories</p>
                <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0" }}>How each team's overall health score has changed week over week</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {teamStats.map((t, i) => (
                  <button key={t.name}
                    onMouseEnter={() => setHoveredTeam(t.name)}
                    onMouseLeave={() => setHoveredTeam(null)}
                    style={{
                      display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "4px 10px",
                      borderRadius: 20, border: `1px solid ${t.color}`,
                      background: hoveredTeam === t.name ? t.color : "transparent",
                      color: hoveredTeam === t.name ? "#fff" : t.color,
                      cursor: "pointer", transition: "all 0.15s",
                    }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.color, display: "inline-block" }} />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <XAxis dataKey="week" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[3, 8]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <ReferenceLine y={4} stroke="#16a34a" strokeDasharray="4 3" strokeOpacity={0.3} label={{ value: "Optimal floor", position: "right", fontSize: 10, fill: "#16a34a" }} />
                <ReferenceLine y={6} stroke="#16a34a" strokeDasharray="4 3" strokeOpacity={0.3} label={{ value: "Optimal ceiling", position: "right", fontSize: 10, fill: "#16a34a" }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload?.length) return (
                      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px", fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", minWidth: 180 }}>
                        <p style={{ fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>{label}</p>
                        {payload
                          .filter(p => p.value !== null)
                          .sort((a, b) => b.value - a.value)
                          .map(p => (
                            <div key={p.dataKey} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 4 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
                                <span style={{ color: "#374151" }}>{p.dataKey}</span>
                              </div>
                              <span style={{ fontWeight: 600, color: "#0f172a" }}>{p.value}</span>
                            </div>
                          ))}
                      </div>
                    );
                    return null;
                  }}
                />
                {teamNames.map((name, i) => (
                <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={TEAM_COLORS[i % TEAM_COLORS.length]}
                    strokeWidth={hoveredTeam === name ? 4 : hoveredTeam === null ? 2 : 1}
                    strokeOpacity={hoveredTeam === name ? 1 : hoveredTeam === null ? 0.8 : 0.15}
                    dot={hoveredTeam === null || hoveredTeam === name
                    ? { r: 5, fill: TEAM_COLORS[i % TEAM_COLORS.length], stroke: "#fff", strokeWidth: 2 }
                    : { r: 0 }
                    }
                    activeDot={{ r: 7 }}
                    connectNulls
                    isAnimationActive={false}
                />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Team summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {teamStats.map((t) => (
              <div key={t.name}
                onMouseEnter={() => setHoveredTeam(t.name)}
                onMouseLeave={() => setHoveredTeam(null)}
                style={{
                  background: "#fff", borderRadius: 10, border: `1px solid ${hoveredTeam === t.name ? t.color : "#e2e8f0"}`,
                  padding: "14px 16px", cursor: "default", transition: "border-color 0.15s",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{t.name}</span>
                </div>
                <p style={{ fontSize: 24, fontWeight: 700, color: t.color, margin: "0 0 4px", lineHeight: 1 }}>{t.avg}</p>
                <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>avg score</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: t.trend > 0 ? "#16a34a" : t.trend < 0 ? "#dc2626" : "#64748b", fontWeight: 500 }}>
                    {t.trend > 0 ? "↑" : t.trend < 0 ? "↓" : "→"} {Math.abs(t.trend).toFixed(2)}
                  </span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>since week 1</span>
                </div>
              </div>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}