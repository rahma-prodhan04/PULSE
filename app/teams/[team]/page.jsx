"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import {
  ScatterChart, Scatter, XAxis, YAxis, LineChart, Line,
  ResponsiveContainer, Tooltip, ReferenceArea, ReferenceLine,
} from "recharts";
import LoadingAnimation from "../../LoadingAnimation";
import ExportButton from "../../ExportButton";

function ydY(x) {
  return 100 * Math.exp(-0.5 * Math.pow((x - 5) / 2.2, 2));
}
function getZoneColor(arousal) {
  if (arousal >= 4 && arousal <= 6) return "#16a34a";
  if ((arousal >= 2 && arousal < 4) || (arousal > 6 && arousal <= 8)) return "#d97706";
  return "#dc2626";
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
function getWeekNumber(dateStr) {
  const programStart = new Date("2026-06-01");
  const current = new Date(dateStr);
  const diff = Math.round((current - programStart) / (7 * 24 * 60 * 60 * 1000));
  return diff + 3;
}

const curveData = Array.from({ length: 101 }, (_, i) => ({
  x: parseFloat((i / 10).toFixed(1)),
  y: parseFloat(ydY(i / 10).toFixed(1)),
}));

const dimIcons = { Social: "👥", Workload: "💼", Energy: "⚡", Recovery: "❤️", Motivation: "🎯" };

export default function TeamView() {
  const { team } = useParams();
  const router = useRouter();
  const teamName = decodeURIComponent(team);

  const [loading, setLoading] = useState(true);
  const [allTeamNames, setAllTeamNames] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [cohortWeeklyAvg, setCohortWeeklyAvg] = useState({});

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from("survey_responses")
        .select(`q1_workload, q2_energy, q3_recovery, q4_motivation, q5_social, week_start, teams ( name )`);

      if (error) { console.error(error); setLoading(false); return; }

      const names = [...new Set(data.map(r => r.teams?.name).filter(Boolean))].sort();
      setAllTeamNames(names);

      const teamRows = data.filter(r => r.teams?.name === teamName);

      const byWeek = {};
      teamRows.forEach(r => {
        const wk = r.week_start;
        if (!byWeek[wk]) byWeek[wk] = { workload: [], energy: [], recovery: [], motivation: [], social: [] };
        byWeek[wk].workload.push(r.q1_workload);
        byWeek[wk].energy.push(r.q2_energy);
        byWeek[wk].recovery.push(r.q3_recovery);
        byWeek[wk].motivation.push(r.q4_motivation);
        byWeek[wk].social.push(r.q5_social);
      });

      const weekly = Object.entries(byWeek).map(([week, dims]) => {
        const workload = avg(dims.workload), energy = avg(dims.energy),
          recovery = avg(dims.recovery), motivation = avg(dims.motivation), social = avg(dims.social);
        const overall = avg([workload, energy, recovery, motivation, social]);
        const arousal = avg([workload, energy, recovery, motivation]);
        return {
          week, label: `W${getWeekNumber(week)}`,
          workload, energy, recovery, motivation, social,
          overall, arousal, g: overall, perf: ydY(arousal),
          responses: dims.workload.length,
        };
      }).sort((a, b) => new Date(a.week) - new Date(b.week));

      setWeeklyData(weekly);

      const cohortByWeek = {};
      data.forEach(r => {
        const wk = r.week_start;
        if (!cohortByWeek[wk]) cohortByWeek[wk] = [];
        cohortByWeek[wk].push(avg([r.q1_workload, r.q2_energy, r.q3_recovery, r.q4_motivation, r.q5_social]));
      });
      const cohortAvgMap = {};
      Object.entries(cohortByWeek).forEach(([wk, vals]) => { cohortAvgMap[wk] = avg(vals); });
      setCohortWeeklyAvg(cohortAvgMap);

      setLoading(false);
    }
    if (teamName) fetchData();
  }, [teamName]);

  const totalResponses = weeklyData.reduce((sum, w) => sum + w.responses, 0);
  const latest = weeklyData[weeklyData.length - 1];
  const overallAvg = weeklyData.length ? avg(weeklyData.map(w => w.overall)) : 0;
  const bestWeek = weeklyData.length ? [...weeklyData].sort((a, b) => b.overall - a.overall)[0] : null;
  const worstWeek = weeklyData.length ? [...weeklyData].sort((a, b) => a.overall - b.overall)[0] : null;

  const cohortDimensions = weeklyData.length ? [
    { label: "Social", value: avg(weeklyData.map(w => w.social)) },
    { label: "Workload", value: avg(weeklyData.map(w => w.workload)) },
    { label: "Energy", value: avg(weeklyData.map(w => w.energy)) },
    { label: "Recovery", value: avg(weeklyData.map(w => w.recovery)) },
    { label: "Motivation", value: avg(weeklyData.map(w => w.motivation)) },
  ].map(d => ({ ...d, color: getDimColor(d.value) })) : [];

  const trendData = weeklyData.map(w => ({
    week: w.week, label: w.label, g: w.overall, cohort: cohortWeeklyAvg[w.week] ?? null,
  }));

  if (loading) return <LoadingAnimation onDone={() => setLoading(false)} />;

  if (!loading && weeklyData.length === 0) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>No data for {teamName}</p>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>Try a different team.</p>
          <button onClick={() => router.push("/teams")}
            style={{ marginTop: 16, fontSize: 13, padding: "8px 20px", borderRadius: 8, border: "none", background: "#16a34a", color: "#fff", cursor: "pointer" }}>
            Back to teams
          </button>
        </div>
      </div>
    );
  }

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
            <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", margin: 0 }}>Osman</p>
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
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <button onClick={() => router.push("/teams")}
                  style={{ fontSize: 13, color: "#64748b", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  ← Teams
                </button>
                <span style={{ color: "#e2e8f0" }}>/</span>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>{teamName}</h1>
              </div>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                {totalResponses} responses · {weeklyData.length} weeks reported
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <select
                style={{ fontSize: 13, padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", color: "#374151", cursor: "pointer" }}
                value={teamName}
                onChange={(e) => router.push(`/teams/${encodeURIComponent(e.target.value)}`)}
              >
                {allTeamNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
              <ExportButton
                exportData={{ teams: [{ name: teamName, ...latest }], cohortAvg: overallAvg, cohortDimensions, trendData }}
                filename={`PULSE_Team_${teamName.replace(/\s+/g, "_")}.pdf`}
              />
            </div>
          </div>
        </header>

        {/* Body */}
        <main style={{ flex: 1, overflowY: "auto", padding: "20px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Metric cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[
              { label: "OVERALL AVG SCORE", value: overallAvg.toFixed(1), suffix: " / 10", sub: "Across all weeks", subColor: "#16a34a", iconBg: "#dcfce7", icon: "📈" },
              { label: "LATEST WEEK SCORE", value: latest ? latest.overall.toFixed(1) : "—", suffix: " / 10", sub: latest ? latest.label : "—", subColor: getZoneColor(latest?.arousal ?? 5), iconBg: "#dbeafe", icon: "🕐" },
              { label: "BEST WEEK", value: bestWeek?.label || "—", sub: `${bestWeek?.overall ?? "—"} overall`, subColor: "#16a34a", iconBg: "#dcfce7", icon: "🏆" },
              { label: "WEAKEST WEEK", value: worstWeek?.label || "—", sub: `${worstWeek?.overall ?? "—"} overall`, subColor: "#dc2626", iconBg: "#fee2e2", icon: "⚠️" },
            ].map(m => (
              <div key={m.label} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.07em", margin: "0 0 6px" }}>{m.label}</p>
                    <p style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1 }}>
                      {m.value}{m.suffix && <span style={{ fontSize: 14, fontWeight: 400, color: "#94a3b8" }}>{m.suffix}</span>}
                    </p>
                    <p style={{ fontSize: 12, color: m.subColor, margin: "5px 0 0" }}>{m.sub}</p>
                  </div>
                  <div style={{ width: 40, height: 40, background: m.iconBg, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {m.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Middle row */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>

            {/* Curve — trajectory across weeks */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.07em", margin: 0, textTransform: "uppercase" }}>
                  Yerkes-Dodson Curve — {teamName} Trajectory
                </p>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>ⓘ</span>
              </div>
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
                  <XAxis dataKey="x" type="number" domain={[0, 10]} tickCount={6} tick={{ fontSize: 11 }}
                    label={{ value: "Arousal level", position: "insideBottom", offset: -10, fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis dataKey="y" type="number" domain={[0, 110]} hide />
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const d = payload[0].payload;
                      if (d.label) return (
                        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                          <p style={{ fontWeight: 600, margin: "0 0 2px", color: "#0f172a" }}>{d.label}</p>
                          <p style={{ color: "#64748b", margin: 0 }}>Score: <b style={{ color: "#0f172a" }}>{d.g}</b> · Arousal: <b style={{ color: "#0f172a" }}>{d.x}</b></p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <ReferenceArea x1={0} x2={2} fill="#dc2626" fillOpacity={0.08} />
                  <ReferenceArea x1={2} x2={4} fill="#d97706" fillOpacity={0.08} />
                  <ReferenceArea x1={4} x2={6} fill="#16a34a" fillOpacity={0.12} />
                  <ReferenceArea x1={6} x2={8} fill="#d97706" fillOpacity={0.08} />
                  <ReferenceArea x1={8} x2={10} fill="#dc2626" fillOpacity={0.08} />
                  <ReferenceLine x={2} stroke="#e2e8f0" strokeDasharray="4 3" strokeWidth={1} />
                  <ReferenceLine x={4} stroke="#e2e8f0" strokeDasharray="4 3" strokeWidth={1} />
                  <ReferenceLine x={6} stroke="#e2e8f0" strokeDasharray="4 3" strokeWidth={1} />
                  <ReferenceLine x={8} stroke="#e2e8f0" strokeDasharray="4 3" strokeWidth={1} />
                  <Scatter data={curveData.filter(d => d.x <= 2)} line={{ stroke: "#dc2626", strokeWidth: 2.5 }} shape={() => <></>} />
                  <Scatter data={curveData.filter(d => d.x >= 2 && d.x <= 4)} line={{ stroke: "#d97706", strokeWidth: 2.5 }} shape={() => <></>} />
                  <Scatter data={curveData.filter(d => d.x >= 4 && d.x <= 6)} line={{ stroke: "#16a34a", strokeWidth: 2.5 }} shape={() => <></>} />
                  <Scatter data={curveData.filter(d => d.x >= 6 && d.x <= 8)} line={{ stroke: "#d97706", strokeWidth: 2.5 }} shape={() => <></>} />
                  <Scatter data={curveData.filter(d => d.x >= 8)} line={{ stroke: "#dc2626", strokeWidth: 2.5 }} shape={() => <></>} />
                  {/* One dot per week — colored by that week's zone, latest week emphasized */}
                  <Scatter
                    data={weeklyData.map((w, i) => ({
                      x: w.arousal, y: w.perf, label: w.label, g: w.overall,
                      color: getZoneColor(w.arousal), isLatest: i === weeklyData.length - 1,
                    }))}
                    shape={(props) => (
                      <circle cx={props.cx} cy={props.cy} r={props.isLatest ? 8 : 5.5}
                        fill={props.color} stroke="#fff" strokeWidth={2}
                        opacity={props.isLatest ? 1 : 0.55} />
                    )}
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

            {/* Dimensions */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 20px" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.07em", margin: "0 0 14px", textTransform: "uppercase" }}>
                Dimensions — All-time avg
              </p>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {cohortDimensions.map((d, i) => (
                  <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < cohortDimensions.length - 1 ? "1px solid #f1f5f9" : "none" }}>
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
          </div>

          {/* Trend — this team vs cohort */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.07em", margin: "0 0 14px", textTransform: "uppercase" }}>
              Score Trend — {teamName} vs Cohort Avg
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[3, 8]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v, name) => [v?.toFixed?.(2) ?? v, name === "g" ? teamName : "Cohort avg"]} />
                <Line type="monotone" dataKey="g" stroke="#16a34a" strokeWidth={2.5}
                  dot={{ r: 5, fill: "#16a34a", stroke: "#fff", strokeWidth: 2 }} name={teamName} />
                <Line type="monotone" dataKey="cohort" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 4"
                  dot={{ r: 3, fill: "#94a3b8" }} name="Cohort avg" />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748b" }}>
                <span style={{ width: 14, height: 2, background: "#16a34a", display: "inline-block" }} />{teamName}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748b" }}>
                <span style={{ width: 14, height: 2, background: "#94a3b8", display: "inline-block" }} />Cohort avg
              </span>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}