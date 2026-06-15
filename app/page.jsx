"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import {
  ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer,
  Tooltip, LineChart, Line, ReferenceLine, AreaChart, Area, ReferenceArea
} from "recharts";
import LoadingAnimation from "./LoadingAnimation";

function ydY(x) {
  return 100 * Math.exp(-0.5 * Math.pow((x - 5) / 2.2, 2));
}

function getZoneColor(arousal) {
  if (arousal >= 4 && arousal <= 6) return "#16a34a";
  if ((arousal >= 2 && arousal < 4) || (arousal > 6 && arousal <= 8)) return "#d97706";
  return "#dc2626";
}

function getZoneBadge(arousal) {
  if (arousal >= 4 && arousal <= 6) return { bg: "#dcfce7", text: "#15803d", label: "Optimal" };
  if ((arousal >= 2 && arousal < 4) || (arousal > 6 && arousal <= 8)) return { bg: "#fef3c7", text: "#92400e", label: "Caution" };
  return { bg: "#fee2e2", text: "#991b1b", label: "Risk" };
}

function getDimColor(v) {
  if (v >= 4 && v <= 6) return "#16a34a";
  if ((v >= 2 && v < 4) || (v > 6 && v <= 8)) return "#d97706";
  return "#dc2626";
}

function avg(arr) {
  if (!arr.length) return 0;
  return parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));
}

const curveData = Array.from({ length: 101 }, (_, i) => ({
  x: parseFloat((i / 10).toFixed(1)),
  y: parseFloat(ydY(i / 10).toFixed(1)),
}));

const dimIcons = {
  Social: "👥",
  Workload: "💼",
  Energy: "⚡",
  Recovery: "❤️",
  Motivation: "🎯",
};

const metricIcons = {
  "Cohort avg score": "📈",
  "Strongest signal": "👥",
  "Weakest signal": "⚠️",
  "Total responses": "👥",
};

function Sparkline({ data, color }) {
  const padded = data.length < 8
    ? Array.from({ length: 8 }, (_, i) => {
        const base = data[Math.floor(i / 8 * data.length)]?.v ?? 5;
        return { v: base + Math.sin(i * 1.2) * 0.3 };
      })
    : data;
  return (
    <ResponsiveContainer width="100%" height={52}>
      <AreaChart data={padded} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotoneX" dataKey="v" stroke={color} strokeWidth={2}
          fill={`url(#spark-${color.replace("#", "")})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("Cohort average");
  const [weekFilter, setWeekFilter] = useState("");

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from("survey_responses")
        .select(`q1_workload, q2_energy, q3_recovery, q4_motivation, q5_social, week_start, team_id, teams ( name )`);

      if (error) { console.error(error); return; }

      setResponses(data);

      const teamMap = {};
      data.forEach((r) => {
        const name = r.teams?.name || "Unknown";
        if (!teamMap[name]) teamMap[name] = { workload: [], energy: [], recovery: [], motivation: [], social: [] };
        teamMap[name].workload.push(r.q1_workload);
        teamMap[name].energy.push(r.q2_energy);
        teamMap[name].recovery.push(r.q3_recovery);
        teamMap[name].motivation.push(r.q4_motivation);
        teamMap[name].social.push(r.q5_social);
      });

      const teamData = Object.entries(teamMap).map(([name, dims]) => {
        const workload = avg(dims.workload), energy = avg(dims.energy),
          recovery = avg(dims.recovery), motivation = avg(dims.motivation), social = avg(dims.social);
        const overall = avg([workload, energy, recovery, motivation, social]);
        const arousal = avg([workload, energy, recovery, motivation]);
        return { name, workload, energy, recovery, motivation, social, overall, arousal, g: overall, perf: ydY(arousal) };
      }).sort((a, b) => b.overall - a.overall);

      setTeams(teamData);
    }
    fetchData();
  }, []);

  const cohortAvg = teams.length ? avg(teams.map(t => t.overall)) : 0;

  const cohortDimensions = teams.length ? [
    { label: "Social", value: avg(teams.map(t => t.social)) },
    { label: "Workload", value: avg(teams.map(t => t.workload)) },
    { label: "Energy", value: avg(teams.map(t => t.energy)) },
    { label: "Recovery", value: avg(teams.map(t => t.recovery)) },
    { label: "Motivation", value: avg(teams.map(t => t.motivation)) },
  ].map(d => ({ ...d, color: getDimColor(d.value) })) : [];

  const strongestDim = cohortDimensions.length ? [...cohortDimensions].sort((a, b) => b.value - a.value)[0] : null;
  const weakestDim = cohortDimensions.length ? [...cohortDimensions].sort((a, b) => a.value - b.value)[0] : null;

  const trendData = Object.entries(
    responses.reduce((acc, r) => {
      const wk = r.week_start;
      if (!acc[wk]) acc[wk] = [];
      acc[wk].push(avg([r.q1_workload, r.q2_energy, r.q3_recovery, r.q4_motivation, r.q5_social]));
      return acc;
    }, {})
  ).sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([week, vals]) => ({ week, label: week, v: avg(vals), g: avg(vals) }));

  const weeks = trendData.map(t => t.week);

  // Sparkline data per metric
  const sparklines = {
    score:    trendData.map(t => ({ v: t.g })),
    social:   trendData.map((t, i) => ({ v: [6.25, 5.23][i] ?? t.g })),
    recovery: trendData.map((t, i) => ({ v: [4.96, 5.17][i] ?? t.g })),
    total:    trendData.map((t, i) => ({ v: [56, 51][i] ?? 50 })),
  };

  const selectedTeamData = teams.find(t => t.name === selectedTeam);
  const activeDimensions = selectedTeam === "Cohort average"
    ? cohortDimensions
    : selectedTeamData
      ? [
          { label: "Social", value: selectedTeamData.social },
          { label: "Workload", value: selectedTeamData.workload },
          { label: "Energy", value: selectedTeamData.energy },
          { label: "Recovery", value: selectedTeamData.recovery },
          { label: "Motivation", value: selectedTeamData.motivation },
        ].map(d => ({ ...d, color: getDimColor(d.value) }))
      : [];

  if (loading) return <LoadingAnimation onDone={() => setLoading(false)} />;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', system-ui, sans-serif", background: "#f8fafc", overflow: "hidden" }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 200, background: "#0a2818", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, background: "rgba(34,197,94,0.15)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💚</div>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Pulse</span>
          </div>
          <p style={{ fontSize: 11, color: "rgba(134,239,172,0.6)", marginLeft: 42 }}>Culture Health Check</p>
        </div>

        {/* Nav */}
        <nav style={{ padding: "12px 0", flex: 1 }}>
          {[
            { label: "Overview", icon: "⊞", active: true },
            { label: "Teams", icon: "👤", active: false },
            { label: "Timeline", icon: "🕐", active: false },
            { label: "Flags", icon: "🚩", active: false },
            { label: "Settings", icon: "⚙", active: false },
          ].map(item => (
            <button key={item.label}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 20px", border: "none", background: item.active ? "rgba(34,197,94,0.12)" : "transparent",
                borderLeft: `3px solid ${item.active ? "#22c55e" : "transparent"}`,
                color: item.active ? "#fff" : "rgba(134,239,172,0.7)",
                fontSize: 13, cursor: "pointer", textAlign: "left",
              }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Progress */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>📈</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#fff" }}>{trendData.length} weeks collected</span>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ height: "100%", width: `${Math.min((trendData.length / 12) * 100, 100)}%`, background: "#22c55e", borderRadius: 2 }} />
          </div>
          <p style={{ fontSize: 11, color: "rgba(134,239,172,0.5)" }}>
            {trendData.length > 0 ? `${trendData[0].week.slice(5)} – ${trendData[trendData.length - 1].week.slice(5)}` : "No data"}
          </p>
        </div>

        {/* Help */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 14 }}>💬</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#fff" }}>Need help?</span>
          </div>
          <p style={{ fontSize: 11, color: "#22c55e", marginLeft: 22 }}>Visit our help center ↗</p>
        </div>

        {/* User */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "#22c55e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#0a2818", flexShrink: 0 }}>N</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", margin: 0 }}>Osman</p>
            <p style={{ fontSize: 11, color: "rgba(134,239,172,0.5)", margin: 0 }}>Admin</p>
          </div>
          <span style={{ color: "rgba(134,239,172,0.5)", fontSize: 12 }}>▾</span>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Topbar */}
        <header style={{ padding: "20px 28px 16px", background: "#fff", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Overview</h1>
              <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                {responses.length} responses · {teams.length} teams · {weekFilter || "All weeks"}
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <select
                style={{ fontSize: 13, padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", color: "#374151", cursor: "pointer" }}
                value={weekFilter}
                onChange={e => {
                  setWeekFilter(e.target.value);
                  if (e.target.value) router.push(`/week/${e.target.value}`);
                }}
              >
                <option value="">📅 All weeks ▾</option>
                {weeks.map((w, i) => <option key={w} value={w}>Week {i + 3}</option>)}
              </select>
              <button style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, padding: "8px 16px", border: "none", borderRadius: 8, background: "#16a34a", color: "#fff", cursor: "pointer" }}>
                ⬇ Export
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable body */}
        <main style={{ flex: 1, overflowY: "auto", padding: "20px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Metric cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[
              { label: "COHORT AVG SCORE", value: cohortAvg.toFixed(1), suffix: " / 10", sub: "Across all dimensions", subColor: "#16a34a", spark: sparklines.score, sparkColor: "#16a34a", iconBg: "#dcfce7", icon: "📈" },
              { label: "STRONGEST SIGNAL", value: strongestDim?.label || "—", sub: `${strongestDim?.value ?? "—"} avg`, subColor: "#16a34a", spark: sparklines.social, sparkColor: "#16a34a", iconBg: "#dcfce7", icon: "👥" },
              { label: "WEAKEST SIGNAL", value: weakestDim?.label || "—", sub: `${weakestDim?.value ?? "—"} avg`, badge: "Needs attention", subColor: "#dc2626", spark: sparklines.recovery, sparkColor: "#dc2626", iconBg: "#fee2e2", icon: "⚠️" },
              { label: "TOTAL RESPONSES", value: responses.length.toString(), sub: `${teams.length} teams participated`, subColor: "#64748b", spark: sparklines.total, sparkColor: "#6366f1", iconBg: "#ede9fe", icon: "👥" },
            ].map(m => (
              <div key={m.label} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.07em", margin: "0 0 6px" }}>{m.label}</p>
                    <p style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1 }}>
                      {m.value}{m.suffix && <span style={{ fontSize: 14, fontWeight: 400, color: "#94a3b8" }}>{m.suffix}</span>}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                      <p style={{ fontSize: 12, color: m.subColor, margin: 0 }}>{m.sub}</p>
                      {m.badge && <span style={{ fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 20, background: "#fee2e2", color: "#dc2626" }}>{m.badge}</span>}
                    </div>
                  </div>
                  <div style={{ width: 40, height: 40, background: m.iconBg, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {m.icon}
                  </div>
                </div>
                <div style={{ marginTop: "auto" }}>
                  <Sparkline data={m.spark} color={m.sparkColor} />
                </div>
              </div>
            ))}
          </div>

          {/* Middle row */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>

            {/* Curve */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.07em", margin: 0, textTransform: "uppercase" }}>
                    Yerkes-Dodson Curve — Cohort Position
                  </p>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>ⓘ</span>
                </div>
                <select style={{ fontSize: 12, padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", color: "#374151" }}>
                  <option>Cohort average</option>
                </select>
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

              <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <defs>
                  <linearGradient id="riskFillL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dc2626" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="cautionFillL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d97706" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="optimalFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="x" type="number" domain={[0, 10]} tickCount={6}
                  tick={{ fontSize: 11 }}
                  label={{ value: "Arousal level", position: "insideBottom", offset: -10, fontSize: 11, fill: "#94a3b8" }} />
                <YAxis dataKey="y" type="number" domain={[0, 110]} hide />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const d = payload[0].payload;
                    if (d.name) return (
                      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                        <p style={{ fontWeight: 600, margin: "0 0 2px", color: "#0f172a" }}>{d.name}</p>
                        <p style={{ color: "#64748b", margin: 0 }}>Score: <b style={{ color: "#0f172a" }}>{d.g}</b> · Arousal: <b style={{ color: "#0f172a" }}>{d.x}</b></p>
                      </div>
                    );
                  }
                  return null;
                }} />

                {/* Zone fill — risk left (0–2) */}
                <ReferenceArea x1={0} x2={2} fill="#dc2626" fillOpacity={0.08} />
                <ReferenceArea x1={2} x2={4} fill="#d97706" fillOpacity={0.08} />
                <ReferenceArea x1={4} x2={6} fill="#16a34a" fillOpacity={0.12} />
                <ReferenceArea x1={6} x2={8} fill="#d97706" fillOpacity={0.08} />
                <ReferenceArea x1={8} x2={10} fill="#dc2626" fillOpacity={0.08} />

                {/* Vertical dividers */}
                <ReferenceLine x={2} stroke="#e2e8f0" strokeDasharray="4 3" strokeWidth={1} />
                <ReferenceLine x={4} stroke="#e2e8f0" strokeDasharray="4 3" strokeWidth={1} />
                <ReferenceLine x={6} stroke="#e2e8f0" strokeDasharray="4 3" strokeWidth={1} />
                <ReferenceLine x={8} stroke="#e2e8f0" strokeDasharray="4 3" strokeWidth={1} />

                {/* Risk fill left */}
                <Scatter data={curveData.filter(d => d.x <= 2)}
                  line={{ stroke: "transparent" }} shape={() => <></>}
                  fill="url(#riskFillL)" />

                {/* Caution fill left */}
                <Scatter data={curveData.filter(d => d.x >= 2 && d.x <= 4)}
                  line={{ stroke: "transparent" }} shape={() => <></>}
                  fill="url(#cautionFillL)" />

                {/* Optimal fill */}
                <Scatter data={curveData.filter(d => d.x >= 4 && d.x <= 6)}
                  line={{ stroke: "transparent" }} shape={() => <></>}
                  fill="url(#optimalFill)" />

                {/* Caution fill right */}
                <Scatter data={curveData.filter(d => d.x >= 6 && d.x <= 8)}
                  line={{ stroke: "transparent" }} shape={() => <></>}
                  fill="url(#cautionFillL)" />

                {/* Risk fill right */}
                <Scatter data={curveData.filter(d => d.x >= 8)}
                  line={{ stroke: "transparent" }} shape={() => <></>}
                  fill="url(#riskFillL)" />

                {/* Curve — risk left */}
                <Scatter data={curveData.filter(d => d.x <= 2)}
                  line={{ stroke: "#dc2626", strokeWidth: 2.5 }} shape={() => <></>} />

                {/* Curve — caution left */}
                <Scatter data={curveData.filter(d => d.x >= 2 && d.x <= 4)}
                  line={{ stroke: "#d97706", strokeWidth: 2.5 }} shape={() => <></>} />

                {/* Curve — optimal */}
                <Scatter data={curveData.filter(d => d.x >= 4 && d.x <= 6)}
                  line={{ stroke: "#16a34a", strokeWidth: 2.5 }} shape={() => <></>} />

                {/* Curve — caution right */}
                <Scatter data={curveData.filter(d => d.x >= 6 && d.x <= 8)}
                  line={{ stroke: "#d97706", strokeWidth: 2.5 }} shape={() => <></>} />

                {/* Curve — risk right */}
                <Scatter data={curveData.filter(d => d.x >= 8)}
                  line={{ stroke: "#dc2626", strokeWidth: 2.5 }} shape={() => <></>} />

                {/* Team dots */}
                <Scatter
                  data={teams.map(t => ({ x: t.arousal, y: t.perf, name: t.name, g: t.g, color: getZoneColor(t.arousal) }))}
                  fill="#16a34a"
                  shape={(props) => {
                    return <circle cx={props.cx} cy={props.cy} r={7}
                      fill={props.color || "#16a34a"}
                      stroke="#fff" strokeWidth={2} />;
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>

              <div style={{ display: "flex", gap: 20, marginTop: 4 }}>
                {[["#16a34a", "Optimal (4 – 6)"], ["#d97706", "Caution (2 – 4, 6 – 8)"], ["#dc2626", "Risk (1 – 2, 9 – 10)"]].map(([c, l]) => (
                  <span key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748b" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "inline-block" }} />{l}
                  </span>
                ))}
              </div>
            </div>

            {/* Team scores */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 20px" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.07em", margin: "0 0 14px", textTransform: "uppercase" }}>Team Overall Scores</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {teams.map((t, i) => {
                  const badge = getZoneBadge(t.arousal);
                  const color = getZoneColor(t.arousal);
                  return (
                    <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < teams.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                      <span style={{ fontSize: 11, color: "#94a3b8", width: 16, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "#0f172a", flex: 1 }}>{t.name}</span>
                      <div style={{ width: 80, height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
                        <div style={{ height: "100%", width: `${(t.overall / 10) * 100}%`, background: color, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", minWidth: 32, textAlign: "right" }}>{t.overall}</span>
                      <span style={{ fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 20, background: i === 0 ? "#fef3c7" : badge.bg, color: i === 0 ? "#92400e" : badge.text, flexShrink: 0 }}>
                        {i === 0 ? "Top" : badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16 }}>

            {/* Dimensions */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.07em", margin: 0, textTransform: "uppercase" }}>Dimensions</p>
                <select
                  style={{ fontSize: 12, padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", color: "#374151" }}
                  value={selectedTeam}
                  onChange={e => setSelectedTeam(e.target.value)}
                >
                  <option>Cohort average</option>
                  {teams.map(t => <option key={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {activeDimensions.map((d, i) => (
                  <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < activeDimensions.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{dimIcons[d.label] || "📊"}</span>
                    <span style={{ fontSize: 13, color: "#374151", width: 80, flexShrink: 0 }}>{d.label}</span>
                    <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(d.value / 10) * 100}%`, background: d.color, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", minWidth: 32, textAlign: "right" }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trend */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.07em", margin: 0, textTransform: "uppercase" }}>Avg Score Trend — By Week</p>
                <select style={{ fontSize: 12, padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", color: "#374151" }}>
                  <option>All weeks</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[3, 8]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [v.toFixed(2), "Score"]} />
                  <Line type="monotone" dataKey="g" stroke="#16a34a" strokeWidth={2.5}
                    dot={{ r: 5, fill: "#16a34a", stroke: "#fff", strokeWidth: 2 }}
                    label={{ position: "top", fontSize: 11, fill: "#374151", fontWeight: 600 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}