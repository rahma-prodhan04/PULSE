"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import {
  ScatterChart, Scatter, XAxis, YAxis, BarChart, Bar,
  ResponsiveContainer, Tooltip, Cell, ReferenceArea, ReferenceLine,
} from "recharts";
import LoadingAnimation from "../../LoadingAnimation";
import ExportButton from "../../ExportButton";

function getWeekNumber(dateStr) {
  const programStart = new Date("2026-06-01");
  const current = new Date(dateStr);
  const diff = Math.round((current - programStart) / (7 * 24 * 60 * 60 * 1000));
  return diff + 3;
}

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

const dimIcons = { Social: "👥", Workload: "💼", Energy: "⚡", Recovery: "❤️", Motivation: "🎯" };

export default function WeekView() {
  const { week } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState([]);
  const [teams, setTeams] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("Cohort average");

  useEffect(() => {
    async function fetchData() {
      const { data: allData } = await supabase.from("survey_responses").select("week_start");
      const uniqueWeeks = [...new Set(allData?.map(r => r.week_start))].sort();
      setWeeks(uniqueWeeks);

      const { data, error } = await supabase
        .from("survey_responses")
        .select(`q1_workload, q2_energy, q3_recovery, q4_motivation, q5_social, week_start, team_id, teams ( name )`)
        .eq("week_start", week);

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
    if (week) fetchData();
  }, [week]);

  const cohortAvg = teams.length ? avg(teams.map(t => t.overall)) : 0;

  const cohortDimensions = teams.length ? [
    { label: "Social", value: avg(teams.map(t => t.social)) },
    { label: "Workload", value: avg(teams.map(t => t.workload)) },
    { label: "Energy", value: avg(teams.map(t => t.energy)) },
    { label: "Recovery", value: avg(teams.map(t => t.recovery)) },
    { label: "Motivation", value: avg(teams.map(t => t.motivation)) },
  ].map(d => ({ ...d, color: getDimColor(d.value) })) : [];

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

  const barData = teams.map(t => ({ name: t.name, score: t.overall, color: getZoneColor(t.arousal) }));

  if (loading) return <LoadingAnimation onDone={() => setLoading(false)} />;

  if (!loading && responses.length === 0) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>No data for this week</p>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>Try a different week.</p>
          <button onClick={() => router.push("/")}
            style={{ marginTop: 16, fontSize: 13, padding: "8px 20px", borderRadius: 8, border: "none", background: "#16a34a", color: "#fff", cursor: "pointer" }}>
            Back to overview
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
            { label: "Teams", icon: "👤" },
            { label: "Timeline", icon: "🕐" },
            { label: "Spread", icon: "📊" },
          ].map(item => (
            <button key={item.label}
              onClick={() => {
                if (item.label === "Overview") router.push("/");
                if (item.label === "Timeline") router.push("/timeline");
                if (item.label === "Teams") router.push("/teams");
                if (item.label === "Spread") router.push("/spread")
              }}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 20px", border: "none", background: "transparent",
                borderLeft: "3px solid transparent",
                color: "rgba(134,239,172,0.7)",
                fontSize: 13, cursor: "pointer", textAlign: "left",
              }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: "#fff", margin: "0 0 8px" }}>
            Week {getWeekNumber(week)} of program
          </p>
          <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ height: "100%", width: `${Math.min((getWeekNumber(week) / 12) * 100, 100)}%`, background: "#22c55e", borderRadius: 2 }} />
          </div>
        </div>
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
                <button onClick={() => router.push("/")}
                  style={{ fontSize: 13, color: "#64748b", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  ← Overview
                </button>
                <span style={{ color: "#e2e8f0" }}>/</span>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Week {getWeekNumber(week)}</h1>
              </div>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                {responses.length} responses · {teams.length} teams
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <select
                style={{ fontSize: 13, padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", color: "#374151", cursor: "pointer" }}
                value={week}
                onChange={(e) => {
                  if (e.target.value === "all") router.push("/");
                  else router.push(`/week/${e.target.value}`);
                }}
              >
                <option value="all">📅 All weeks</option>
                {weeks.map(w => (
                  <option key={w} value={w}>Week {getWeekNumber(w)}</option>
                ))}
              </select>
              <ExportButton
                exportData={{
                  teams,
                  cohortAvg,
                  cohortDimensions,
                  responses,
                  trendData: [{ week, label: week, v: cohortAvg, g: cohortAvg }],
                }}
                filename={`PULSE_Dashboard_Week_${getWeekNumber(week)}.pdf`}
                page2Chart="comparison"
              />
            </div>
          </div>
        </header>

        {/* Body */}
        <main style={{ flex: 1, overflowY: "auto", padding: "20px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Metric cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[
              { label: "WEEK AVG SCORE", value: cohortAvg.toFixed(1), suffix: " / 10", sub: "Across all dimensions", subColor: "#16a34a", iconBg: "#dcfce7", icon: "📈" },
              { label: "TEAMS REPORTING", value: teams.length.toString(), sub: `${responses.length} total responses`, subColor: "#64748b", iconBg: "#dbeafe", icon: "👥" },
              { label: "HIGHEST SCORE", value: teams[0]?.name || "—", sub: `${teams[0]?.overall ?? "—"} overall`, subColor: "#16a34a", iconBg: "#dcfce7", icon: "🏆" },
              { label: "LOWEST SCORE", value: teams[teams.length - 1]?.name || "—", sub: `${teams[teams.length - 1]?.overall ?? "—"} overall`, subColor: "#dc2626", iconBg: "#fee2e2", icon: "⚠️" },
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

            {/* Curve */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.07em", margin: 0, textTransform: "uppercase" }}>
                    Yerkes-Dodson Curve — Week {getWeekNumber(week)}
                  </p>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>ⓘ</span>
                </div>
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
                      if (d.name) return (
                        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                          <p style={{ fontWeight: 600, margin: "0 0 2px", color: "#0f172a" }}>{d.name}</p>
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
              <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.07em", margin: "0 0 14px", textTransform: "uppercase" }}>Team Scores This Week</p>
              <div style={{ display: "flex", flexDirection: "column" }}>
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
              <div style={{ display: "flex", flexDirection: "column" }}>
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

            {/* Bar chart */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 20px" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.07em", margin: "0 0 14px", textTransform: "uppercase" }}>Team Score Comparison</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 32, left: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload?.length) return (
                      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                        <p style={{ fontWeight: 600, margin: "0 0 2px" }}>{payload[0].payload.name}</p>
                        <p style={{ color: "#64748b", margin: 0 }}>Score: <b>{payload[0].value}</b></p>
                      </div>
                    );
                    return null;
                  }} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}