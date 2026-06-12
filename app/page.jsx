"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// ── Helpers ────────────────────────────────────────────────
function ydY(x) {
  return 100 * Math.exp(-0.5 * Math.pow((x - 5.5) / 2.2, 2));
}

function getZoneColor(arousal) {
  if (arousal >= 4 && arousal <= 6) return "#1D9E75";
  if ((arousal >= 2 && arousal < 4) || (arousal > 6 && arousal <= 8)) return "#EF9F27";
  return "#E24B4A";
}

function getZoneBadge(arousal) {
  if (arousal >= 4 && arousal <= 6) return { bg: "#E1F5EE", text: "#085041", label: "Optimal" };
  if ((arousal >= 2 && arousal < 4) || (arousal > 6 && arousal <= 8)) return { bg: "#FAEEDA", text: "#854F0B", label: "Caution" };
  return { bg: "#FCEBEB", text: "#791F1F", label: "Risk" };
}

function getDimColor(v) {
  if (v >= 4 && v <= 6) return "#1D9E75";
  if ((v >= 2 && v < 4) || (v > 6 && v <= 8)) return "#EF9F27";
  return "#E24B4A";
}

function avg(arr) {
  if (!arr.length) return 0;
  return parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));
}

const curveData = Array.from({ length: 101 }, (_, i) => ({
  x: parseFloat((i / 10).toFixed(1)),
  y: parseFloat(ydY(i / 10).toFixed(1)),
}));

// ── Main component ─────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("Cohort average");

  useEffect(() => {
    async function fetchData() {
      // Fetch all survey responses with team info
      const { data, error } = await supabase
        .from("survey_responses")
        .select(`
          q1_workload,
          q2_energy,
          q3_recovery,
          q4_motivation,
          q5_social,
          week_start,
          team_id,
          teams ( name )
        `);

      if (error) {
        console.error("Supabase error:", error);
        setLoading(false);
        return;
      }

      setResponses(data);

      // Group by team and calculate averages
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
        const workload  = avg(dims.workload);
        const energy    = avg(dims.energy);
        const recovery  = avg(dims.recovery);
        const motivation = avg(dims.motivation);
        const social    = avg(dims.social);
        const overall   = avg([workload, energy, recovery, motivation, social]);
        const arousal   = avg([workload, energy, recovery, motivation]);
        return {
          name,
          workload, energy, recovery, motivation, social,
          overall,
          arousal,
          g: overall,
          perf: ydY(arousal),
        };
      }).sort((a, b) => b.overall - a.overall);

      setTeams(teamData);
      setLoading(false);
    }

    fetchData();
  }, []);

  // ── Derived cohort stats ──────────────────────────────────
  const cohortAvg = teams.length
    ? avg(teams.map(t => t.overall))
    : 0;

  const cohortDimensions = teams.length ? [
    { label: "Social",     value: avg(teams.map(t => t.social)) },
    { label: "Workload",   value: avg(teams.map(t => t.workload)) },
    { label: "Energy",     value: avg(teams.map(t => t.energy)) },
    { label: "Motivation", value: avg(teams.map(t => t.motivation)) },
    { label: "Recovery",   value: avg(teams.map(t => t.recovery)) },
  ].map(d => ({ ...d, color: getDimColor(d.value) })) : [];

  const strongestDim = cohortDimensions.length
    ? [...cohortDimensions].sort((a, b) => b.value - a.value)[0]
    : null;

  const weakestDim = cohortDimensions.length
    ? [...cohortDimensions].sort((a, b) => a.value - b.value)[0]
    : null;

  // ── Trend by week ─────────────────────────────────────────
  const trendData = Object.entries(
    responses.reduce((acc, r) => {
      const wk = r.week_start;
      if (!acc[wk]) acc[wk] = [];
      acc[wk].push(avg([r.q1_workload, r.q2_energy, r.q3_recovery, r.q4_motivation, r.q5_social]));
      return acc;
    }, {})
  )
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([week, vals]) => ({ week: week.slice(5), g: avg(vals) }));

  // ── Active dimensions for dropdown ───────────────────────
  const selectedTeamData = teams.find(t => t.name === selectedTeam);
  const activeDimensions = selectedTeam === "Cohort average"
    ? cohortDimensions
    : selectedTeamData
      ? [
          { label: "Social",     value: selectedTeamData.social },
          { label: "Workload",   value: selectedTeamData.workload },
          { label: "Energy",     value: selectedTeamData.energy },
          { label: "Motivation", value: selectedTeamData.motivation },
          { label: "Recovery",   value: selectedTeamData.recovery },
        ].map(d => ({ ...d, color: getDimColor(d.value) }))
      : [];

  // ── Loading state ─────────────────────────────────────────
  if (loading) {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Loading Pulse data...</p>
      </div>
    </div>
  );
}

if (!loading && responses.length === 0) {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-4xl mb-4">📭</div>
        <p className="text-base font-medium text-gray-700">No responses yet</p>
        <p className="text-sm text-gray-400 mt-1">Once interns submit their check-ins, data will appear here.</p>
      </div>
    </div>
  );
}

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">

      {/* Sidebar */}
      <aside className="w-52 flex flex-col shrink-0" style={{ background: "#085041" }}>
        <div className="px-5 py-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
            <span className="text-lg font-medium text-white">Pulse</span>
          </div>
          <p className="text-xs mt-1.5 pl-[18px]" style={{ color: "#5DCAA5" }}>
            Culture Health Check
          </p>
        </div>
        <nav className="flex flex-col gap-0.5 py-4 flex-1">
          {["Overview", "Teams", "Timeline", "Flags", "Settings"].map((item) => (
            <button
              key={item}
              className={`flex items-center gap-2.5 px-5 py-2.5 text-sm text-left border-l-2 transition-all ${
                item === "Overview"
                  ? "border-teal-400 bg-white/10 text-white"
                  : "border-transparent text-teal-200 hover:bg-white/5"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-[11px] mb-2" style={{ color: "#9FE1CB" }}>
            {trendData.length} weeks collected
          </p>
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-teal-400"
              style={{ width: `${Math.min((trendData.length / 12) * 100, 100)}%` }} />
          </div>
          <p className="text-[10px] mt-1.5" style={{ color: "#5DCAA5" }}>
            {trendData.length > 0 ? `${trendData[0].week} — ${trendData[trendData.length - 1].week}` : "No data yet"}
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center justify-between px-7 py-4 bg-white border-b border-gray-100 shrink-0">
          <div>
            <h1 className="text-base font-medium text-gray-900">Overview</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {responses.length} responses · {teams.length} teams · all weeks
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2.5">
            <select
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) router.push(`/week/${e.target.value}`);
              }}
            >
              <option value="">All weeks</option>
              {trendData.map((t, i) => (
                <option key={t.week} value={`2026-${t.week}`}>
                  Week {i + 3}
                </option>
              ))}
            </select>
          </div>
            <button className="text-xs px-4 py-1.5 rounded-full text-white" style={{ background: "#085041" }}>
              Export
            </button>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-5">

          {/* Metric cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Cohort avg score", value: cohortAvg.toFixed(1),        sub: "Across all dimensions",          valueColor: "#085041", subColor: "#0F6E56" },
              { label: "Strongest signal", value: strongestDim?.label || "—",  sub: `${strongestDim?.value ?? "—"} avg`, valueColor: "#1D9E75", subColor: "" },
              { label: "Weakest signal",   value: weakestDim?.label || "—",    sub: `${weakestDim?.value ?? "—"} avg — needs attention`, valueColor: "#A32D2D", subColor: "#A32D2D" },
              { label: "Total responses",  value: responses.length.toString(), sub: `${teams.length} teams participated`, valueColor: "", subColor: "" },
            ].map((m) => (
              <div key={m.label} className="bg-white border border-gray-100 rounded-xl p-5">
                <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-2">{m.label}</p>
                <p className="text-3xl font-medium" style={{ color: m.valueColor || "#111" }}>{m.value}</p>
                <p className="text-xs mt-1.5" style={{ color: m.subColor || "#9ca3af" }}>{m.sub}</p>
              </div>
            ))}
          </div>

          {/* Middle row */}
          <div className="grid gap-4" style={{ gridTemplateColumns: "1.8fr 1fr" }}>

            {/* Curve */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-4">
                Yerkes-Dodson curve — cohort position
              </p>
              <ResponsiveContainer width="100%" height={340}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 24, left: 20 }}>
                  <XAxis dataKey="x" type="number" domain={[0, 10]} tickCount={6} tick={{ fontSize: 11 }}
                    label={{ value: "Arousal level", position: "insideBottom", offset: -12, fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis dataKey="y" type="number" domain={[0, 110]} hide />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        if (d.name) return (
                          <div className="bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-sm text-xs">
                            <p className="font-medium text-gray-800">{d.name}</p>
                            <p className="text-gray-400 mt-0.5">Score: <span className="text-gray-700 font-medium">{d.g}</span></p>
                            <p className="text-gray-400">Arousal: <span className="text-gray-700 font-medium">{d.x}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter data={curveData} line={{ stroke: "#d1d5db", strokeWidth: 2 }} shape={() => <></>} />
                  <Scatter
                    data={teams.map((t) => ({ x: t.arousal, y: t.perf, name: t.name, g: t.g }))}
                    fill="#1D9E75"
                    shape={(props) => {
                      const team = teams.find((t) => t.arousal === props.x);
                      return (
                        <circle cx={props.cx} cy={props.cy} r={7}
                          fill={team ? getZoneColor(team.arousal) : "#1D9E75"}
                          stroke="#fff" strokeWidth={2} />
                      );
                    }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
              <div className="flex gap-5 mt-2">
                {[
                  ["#1D9E75", "Optimal (4–6)"],
                  ["#EF9F27", "Caution (2–4, 6–8)"],
                  ["#E24B4A", "Risk (1–2, 9–10)"],
                ].map(([c, l]) => (
                  <span key={l} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: c }} />{l}
                  </span>
                ))}
              </div>
            </div>

            {/* Team scores */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-4">Team overall scores</p>
              <div className="flex flex-col">
                {teams.map((t, i) => {
                  const badge = getZoneBadge(t.arousal);
                  const color = getZoneColor(t.arousal);
                  return (
                    <div key={t.name} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                      <span className="text-sm text-gray-800 flex-1">{t.name}</span>
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(t.overall / 10) * 100}%`, background: color }} />
                      </div>
                      <span className="text-sm font-medium text-gray-800 w-7 text-right">{t.overall}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: badge.bg, color: badge.text }}>
                        {i === 0 ? "Top" : badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-2 gap-4">

            {/* Dimensions with team dropdown */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] uppercase tracking-wider text-gray-400">Dimensions</p>
                <select
                  className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                >
                  <option>Cohort average</option>
                  {teams.map((t) => <option key={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                {activeDimensions.map((d) => (
                  <div key={d.label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-400 w-28 shrink-0">{d.label}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(d.value / 10) * 100}%`, background: d.color }} />
                    </div>
                    <span className="text-xs font-medium text-gray-800 w-6 text-right">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trend */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-4">Avg score trend — by week</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[4, 8]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="g" stroke="#1D9E75" strokeWidth={2.5}
                    dot={{ r: 5, fill: "#1D9E75", stroke: "#fff", strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}