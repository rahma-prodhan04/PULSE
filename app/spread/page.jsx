"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useCohort } from "../../lib/CohortContext";
import {
  ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer,
  Tooltip, ReferenceArea, ReferenceLine,
} from "recharts";
import LoadingAnimation from "../LoadingAnimation";

function ydY(x) {
  return 100 * Math.exp(-0.5 * Math.pow((x - 5) / 2.2, 2));
}
function getZoneColor(arousal) {
  if (arousal >= 4 && arousal <= 6) return "#16a34a";
  if ((arousal >= 2 && arousal < 4) || (arousal > 6 && arousal <= 8)) return "#d97706";
  return "#dc2626";
}
function avg(arr) {
  if (!arr.length) return 0;
  return parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));
}
function getWeekNumber(dateStr, programStartStr = "2026-06-01") {
  const programStart = new Date(programStartStr);
  const current = new Date(dateStr);
  const diff = Math.round((current - programStart) / (7 * 24 * 60 * 60 * 1000));
  return diff + 3;
}
function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
}

const curveData = Array.from({ length: 101 }, (_, i) => ({
  x: parseFloat((i / 10).toFixed(1)),
  y: parseFloat(ydY(i / 10).toFixed(1)),
}));

const TEAM_COLORS = [
  "#16a34a", "#2563eb", "#d97706", "#dc2626", "#7c3aed",
  "#0891b2", "#db2777", "#65a30d", "#ea580c", "#0f172a", "#64748b",
];

export default function SpreadView() {
  const router = useRouter();
  const { cohorts, selectedCohort, selectedCohortId, setSelectedCohortId } = useCohort();
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState([]);
  const [teamNames, setTeamNames] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState("all");

  useEffect(() => {
    async function fetchData() {
      if (!selectedCohortId) return;

      const { data, error } = await supabase
        .from("survey_responses")
        .select(`q1_workload, q2_energy, q3_recovery, q4_motivation, q5_social, week_start, teams!inner ( name, cohort_id )`)
        .eq("teams.cohort_id", selectedCohortId);

      if (error) { console.error(error); setLoading(false); return; }

      const allTeams = [...new Set(data.map(r => r.teams?.name).filter(Boolean))].sort();
      const allWeeks = [...new Set(data.map(r => r.week_start))].sort();
      setTeamNames(allTeams);
      setWeeks(allWeeks);
      setResponses(data);
      setLoading(false);
    }
    fetchData();
  }, [selectedCohortId]);

  // Build color map: team name → color
  const teamColorMap = Object.fromEntries(
    teamNames.map((name, i) => [name, TEAM_COLORS[i % TEAM_COLORS.length]])
  );

  // Individual dots for the selected week
  const dots = (() => {
    const rows = selectedWeek === "all"
      ? responses
      : responses.filter(r => r.week_start === selectedWeek);

    return rows.map((r, i) => {
      const arousal = avg([r.q1_workload, r.q2_energy, r.q3_recovery, r.q4_motivation]);
      const score = avg([r.q1_workload, r.q2_energy, r.q3_recovery, r.q4_motivation, r.q5_social]);
      const teamName = r.teams?.name || "Unknown";
      return {
        x: parseFloat(arousal.toFixed(2)),
        y: parseFloat(ydY(arousal).toFixed(2)),
        score: parseFloat(score.toFixed(2)),
        arousal: parseFloat(arousal.toFixed(2)),
        team: teamName,
        color: teamColorMap[teamName] || "#64748b",
        id: i,
      };
    });
  })();

  // Density bins along x-axis (0–10 in 0.5 increments)
  const densityBins = (() => {
    const bins = {};
    for (let i = 0; i <= 20; i++) bins[(i * 0.5).toFixed(1)] = 0;
    dots.forEach(d => {
      const bin = (Math.round(d.x * 2) / 2).toFixed(1);
      if (bins[bin] !== undefined) bins[bin]++;
    });
    const max = Math.max(...Object.values(bins), 1);
    return Object.entries(bins).map(([x, count]) => ({
      x: parseFloat(x), count, pct: count / max,
    }));
  })();

  // Zone distribution summary
  const zoneCounts = dots.reduce((acc, d) => {
    const zone = d.arousal >= 4 && d.arousal <= 6 ? "Optimal"
      : (d.arousal >= 2 && d.arousal < 4) || (d.arousal > 6 && d.arousal <= 8) ? "Caution"
      : "Risk";
    acc[zone] = (acc[zone] || 0) + 1;
    return acc;
  }, {});
  const total = dots.length || 1;

  const weekLabel = selectedWeek === "all"
    ? "All weeks"
    : `Week ${getWeekNumber(selectedWeek, selectedCohort?.start_date)} · ${formatDate(selectedWeek)}`;

  if (loading) return <LoadingAnimation onDone={() => setLoading(false)} />;

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, background: "rgba(34,197,94,0.15)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💚</div>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Pulse</span>
          </div>
          <p style={{ fontSize: 11, color: "rgba(134,239,172,0.6)", marginLeft: 42 }}>Culture Health Check</p>
        </div>

        {/* Cohort switcher */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(134,239,172,0.5)", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 6px" }}>Cohort</p>
          <select
            value={selectedCohortId || ""}
            onChange={(e) => setSelectedCohortId(e.target.value)}
            style={{ width: "100%", fontSize: 12, padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#fff", cursor: "pointer" }}
          >
            {cohorts.map(c => (
              <option key={c.id} value={c.id}>{c.name}{c.is_active ? " · active" : ""}</option>
            ))}
          </select>
        </div>

        <nav style={{ padding: "12px 0", flex: 1 }}>
          {[
            { label: "Overview", icon: "⊞" },
            { label: "Teams", icon: "👤" },
            { label: "Timeline", icon: "🕐" },
            { label: "Spread", icon: "📊", active: true },
          ].map(item => (
            <button key={item.label}
              onClick={() => {
                if (item.label === "Overview") router.push("/");
                if (item.label === "Timeline") router.push("/timeline");
                if (item.label === "Teams") router.push("/teams");
                if (item.label === "Spread") router.push("/spread");
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
            <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", margin: 0 }}>Osman</p>
            <p style={{ fontSize: 11, color: "rgba(134,239,172,0.5)", margin: 0 }}>Admin</p>
          </div>
          <span style={{ color: "rgba(134,239,172,0.5)", fontSize: 12 }}>▾</span>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <button onClick={() => router.push("/")}
                  style={{ fontSize: 13, color: "#64748b", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  ← Overview
                </button>
                <span style={{ color: "#e2e8f0" }}>/</span>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Cohort Spread</h1>
              </div>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                {dots.length} responses · {weekLabel}
              </p>
            </div>
            <select
              style={{ fontSize: 13, padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", color: "#374151", cursor: "pointer" }}
              value={selectedWeek}
              onChange={e => setSelectedWeek(e.target.value)}
            >
              <option value="all">All weeks</option>
              {weeks.map(w => (
                <option key={w} value={w}>Week {getWeekNumber(w, selectedCohort?.start_date)} · {formatDate(w)}</option>
              ))}
            </select>
          </div>
        </header>

        <main className="app-content">

          {/* Zone summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { zone: "Optimal", color: "#16a34a", bg: "#dcfce7", range: "Arousal 4–6" },
              { zone: "Caution", color: "#d97706", bg: "#fef3c7", range: "Arousal 2–4 or 6–8" },
              { zone: "Risk", color: "#dc2626", bg: "#fee2e2", range: "Arousal 1–2 or 8–10" },
            ].map(({ zone, color, range }) => {
              const count = zoneCounts[zone] || 0;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={zone} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", border: `1px solid #e2e8f0` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>{zone}</p>
                    <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: "auto" }}>{range}</span>
                  </div>
                  <p style={{ fontSize: 32, fontWeight: 700, color, margin: "0 0 2px", lineHeight: 1 }}>{pct}%</p>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 10px" }}>{count} of {total} responses</p>
                  <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.3s" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Heatmap curve */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.07em", margin: 0, textTransform: "uppercase" }}>
                  Yerkes-Dodson Curve — Individual Spread
                </p>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>ⓘ</span>
              </div>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                Each dot is one response · colour = team · overlap shows density
              </p>
            </div>

            {/* Zone labels */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, padding: "0 20px" }}>
              {[["Risk", "#dc2626", "1 – 2.9"], ["Caution", "#d97706", "2 – 3.9"], ["Optimal", "#16a34a", "4 – 6"], ["Caution", "#d97706", "6 – 8"], ["Risk", "#dc2626", "8 – 10"]].map(([label, color, range]) => (
                <div key={range} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color, margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>({range})</p>
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={Math.min(Math.max(300, dots.length * 1.8 + 200), 700)}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 20 }}>
                <XAxis dataKey="x" type="number" domain={[0, 10]} tickCount={6} tick={{ fontSize: 11 }}
                  label={{ value: "Arousal level", position: "insideBottom", offset: -10, fontSize: 11, fill: "#94a3b8" }} />
                <YAxis dataKey="y" type="number" domain={[-20, 115]} hide />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const d = payload[0].payload;
                    if (!d.team) return null;
                    return (
                      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, display: "inline-block" }} />
                          <span style={{ fontWeight: 600, color: "#0f172a" }}>{d.team}</span>
                        </div>
                        <p style={{ color: "#64748b", margin: 0 }}>Score: <b style={{ color: "#0f172a" }}>{d.score}</b> · Arousal: <b style={{ color: "#0f172a" }}>{d.arousal}</b></p>
                      </div>
                    );
                  }
                  return null;
                }} />

                <ReferenceArea x1={0} x2={2} fill="#dc2626" fillOpacity={0.06} />
                <ReferenceArea x1={2} x2={4} fill="#d97706" fillOpacity={0.06} />
                <ReferenceArea x1={4} x2={6} fill="#16a34a" fillOpacity={0.10} />
                <ReferenceArea x1={6} x2={8} fill="#d97706" fillOpacity={0.06} />
                <ReferenceArea x1={8} x2={10} fill="#dc2626" fillOpacity={0.06} />

                <ReferenceLine x={2} stroke="#e2e8f0" strokeDasharray="4 3" strokeWidth={1} />
                <ReferenceLine x={4} stroke="#e2e8f0" strokeDasharray="4 3" strokeWidth={1} />
                <ReferenceLine x={6} stroke="#e2e8f0" strokeDasharray="4 3" strokeWidth={1} />
                <ReferenceLine x={8} stroke="#e2e8f0" strokeDasharray="4 3" strokeWidth={1} />

                {/* Curve segments — drawn as thin reference, not data */}
                <Scatter data={curveData.filter(d => d.x <= 2)} line={{ stroke: "#dc2626", strokeWidth: 2 }} shape={() => <></>} />
                <Scatter data={curveData.filter(d => d.x >= 2 && d.x <= 4)} line={{ stroke: "#d97706", strokeWidth: 2 }} shape={() => <></>} />
                <Scatter data={curveData.filter(d => d.x >= 4 && d.x <= 6)} line={{ stroke: "#16a34a", strokeWidth: 2 }} shape={() => <></>} />
                <Scatter data={curveData.filter(d => d.x >= 6 && d.x <= 8)} line={{ stroke: "#d97706", strokeWidth: 2 }} shape={() => <></>} />
                <Scatter data={curveData.filter(d => d.x >= 8)} line={{ stroke: "#dc2626", strokeWidth: 2 }} shape={() => <></>} />

                {/* Individual dots plotted in a flat strip — jitter shows density */}
                <Scatter
                  data={dots.map((d, i) => ({
                    ...d,
                    // Fixed y near zero with small deterministic jitter so dots don't all overlap exactly
                    y: ydY(d.x) + ((i * 7.3) % 30) - 15,
                  }))}
                  shape={(props) => (
                    <circle
                      cx={props.cx} cy={props.cy} r={7}
                      fill={props.color || "#64748b"}
                      stroke="#fff" strokeWidth={1.5}
                      opacity={0.55}
                    />
                  )}
                />
              </ScatterChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
              {teamNames.map((name, i) => (
                <span key={name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748b" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: TEAM_COLORS[i % TEAM_COLORS.length], display: "inline-block" }} />
                  {name}
                </span>
              ))}
            </div>

            {/* Density strip */}
            <div style={{ marginTop: 6, marginBottom: 8 }}>
              <p style={{ fontSize: 10, color: "#94a3b8", margin: "0 0 4px" }}>Response density along arousal axis</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 32, paddingLeft: 10, paddingRight: 20 }}>
                {densityBins.map(bin => (
                  <div key={bin.x} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: "100%", borderRadius: 2,
                      height: `${Math.max(bin.pct * 28, bin.count > 0 ? 3 : 0)}px`,
                      background: getZoneColor(bin.x),
                      opacity: 0.35 + bin.pct * 0.65,
                      transition: "height 0.2s",
                    }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}