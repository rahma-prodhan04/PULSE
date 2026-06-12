"use client";

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
import { useState } from "react";

function ydY(x) {
  return 100 * Math.exp(-0.5 * Math.pow((x - 5.5) / 2.2, 2));
}

const teams = [
  { name: "Claroe",      arousal: 6.57, g: 6.24, zone: "optimal" },
  { name: "WHC",         arousal: 5.82, g: 6.10, zone: "optimal" },
  { name: "RNSH1",       arousal: 5.62, g: 5.70, zone: "optimal" },
  { name: "Rockfield",   arousal: 5.46, g: 5.66, zone: "optimal" },
  { name: "NSWRA",       arousal: 5.56, g: 5.56, zone: "optimal" },
  { name: "DCPM",        arousal: 5.36, g: 5.38, zone: "optimal" },
  { name: "Tweed S",     arousal: 5.14, g: 5.35, zone: "optimal" },
  { name: "RNSH2",       arousal: 5.18, g: 5.26, zone: "optimal" },
  { name: "Sensear",     arousal: 5.12, g: 5.09, zone: "low"     },
  { name: "IPWEA",       arousal: 4.71, g: 4.92, zone: "low"     },
  { name: "Sailability", arousal: 4.65, g: 4.87, zone: "low"     },
].map(t => ({ ...t, perf: ydY(t.arousal) }));

const teamDimensions = {
  "Claroe":      { workload: 7.5, energy: 6.2, recovery: 5.8, motivation: 6.0, social: 4.5 },
  "WHC":         { workload: 6.0, energy: 5.8, recovery: 4.8, motivation: 6.6, social: 8.2 },
  "RNSH1":       { workload: 5.7, energy: 5.7, recovery: 5.7, motivation: 5.7, social: 5.7 },
  "Rockfield":   { workload: 6.2, energy: 5.5, recovery: 4.5, motivation: 5.5, social: 6.5 },
  "NSWRA":       { workload: 6.0, energy: 4.8, recovery: 5.5, motivation: 5.5, social: 6.0 },
  "DCPM":        { workload: 6.0, energy: 5.3, recovery: 4.8, motivation: 5.2, social: 5.8 },
  "Tweed S":     { workload: 6.0, energy: 5.4, recovery: 5.3, motivation: 4.9, social: 7.0 },
  "RNSH2":       { workload: 6.3, energy: 4.7, recovery: 5.3, motivation: 5.7, social: 6.3 },
  "Sensear":     { workload: 5.1, energy: 5.4, recovery: 3.9, motivation: 4.9, social: 5.3 },
  "IPWEA":       { workload: 4.7, energy: 5.3, recovery: 4.5, motivation: 5.0, social: 6.5 },
  "Sailability": { workload: 5.3, energy: 4.1, recovery: 5.4, motivation: 4.6, social: 6.7 },
};

const cohortDimensions = [
  { label: "Social",    value: 5.76, color: "#1D9E75" },
  { label: "Workload",  value: 5.54, color: "#1D9E75" },
  { label: "Motivation",value: 5.32, color: "#EF9F27" },
  { label: "Energy",    value: 5.42, color: "#EF9F27" },
  { label: "Recovery",  value: 5.07, color: "#E24B4A" },
];

const trendData = [
  { week: "Wk 1 (Jun 1)", g: 5.53 },
  { week: "Wk 2 (Jun 8)", g: 5.31 },
];

const flags = [
  { team: "Sensear",    desc: "Lowest overall score at 5.09. Recovery at 3.9 is the weakest across all teams.", bg: "#FCEBEB", icon: "⚠", iconColor: "#A32D2D" },
  { team: "Recovery",   desc: "Cohort-wide concern at 5.07 avg — lowest dimension across all teams.", bg: "#FAEEDA", icon: "↓", iconColor: "#854F0B" },
  { team: "WHC",        desc: "Strongest social score at 8.2 — highest in the cohort. Good benchmark.", bg: "#E1F5EE", icon: "★", iconColor: "#085041" },
  { team: "Social",     desc: "Cohort-wide score of 5.76 shows interns feel connected — a strong buffer against burnout.", bg: "#E1F5EE", icon: "↑", iconColor: "#085041" },
];

const zoneColor = { optimal: "#1D9E75", low: "#378ADD", high: "#E24B4A" };
const zoneBadge = {
  optimal: { bg: "#E1F5EE", text: "#085041", label: "Good" },
  low:     { bg: "#E6F1FB", text: "#185FA5", label: "Low"  },
  high:    { bg: "#FCEBEB", text: "#791F1F", label: "Risk" },
};

const curveData = Array.from({ length: 101 }, (_, i) => ({
  x: parseFloat((i / 10).toFixed(1)),
  y: parseFloat(ydY(i / 10).toFixed(1)),
}));

function getDimColor(v) {
  if (v >= 6.5) return "#1D9E75";
  if (v >= 5.5) return "#EF9F27";
  return "#E24B4A";
}

export default function Dashboard() {
  const [selectedTeam, setSelectedTeam] = useState("Cohort average");

  const activeDimensions = selectedTeam === "Cohort average"
    ? cohortDimensions
    : Object.entries(teamDimensions[selectedTeam] || {}).map(([key, value]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value,
        color: getDimColor(value),
      }));

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
              {item === "Flags" && (
                <span className="ml-auto text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                  2
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-[11px] mb-2" style={{ color: "#9FE1CB" }}>
            2 weeks collected
          </p>
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full w-[17%] rounded-full bg-teal-400" />
          </div>
          <p className="text-[10px] mt-1.5" style={{ color: "#5DCAA5" }}>
            Jun 1 — Jun 12
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
              107 responses · 11 teams · last check-in Jun 12
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="text-xs px-4 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50">
              All weeks
            </button>
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
              { label: "Cohort avg score", value: "5.4",  sub: "Across all 5 dimensions",    valueColor: "#085041", subColor: "#0F6E56" },
              { label: "Strongest signal", value: "Social", sub: "5.76 avg — connection high", valueColor: "#1D9E75", subColor: "" },
              { label: "Weakest signal",   value: "Recovery", sub: "5.07 avg — needs attention", valueColor: "#A32D2D", subColor: "#A32D2D" },
              { label: "Total responses",  value: "107",  sub: "11 teams participated",       valueColor: "",       subColor: "" },
            ].map((m) => (
              <div key={m.label} className="bg-white border border-gray-100 rounded-xl p-5">
                <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-2">{m.label}</p>
                <p className="text-3xl font-medium" style={{ color: m.valueColor || "#111" }}>{m.value}</p>
                <p className="text-xs mt-1.5" style={{ color: m.subColor || "#9ca3af" }}>{m.sub}</p>
              </div>
            ))}
          </div>

          {/* Middle row */}
          <div className="grid gap-4" style={{ gridTemplateColumns: "1.8fr 1.1fr 1fr" }}>

            {/* Curve */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-4">
                Yerkes-Dodson curve — cohort position
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart margin={{ top: 8, right: 8, bottom: 24, left: 0 }}>
                  <XAxis dataKey="x" type="number" domain={[0, 10]} tickCount={6} tick={{ fontSize: 11 }}
                    label={{ value: "Arousal level", position: "insideBottom", offset: -12, fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis dataKey="y" type="number" domain={[0, 110]} hide />
                  <Tooltip formatter={(v, n) => n === "y" ? null : [v, ""]} />
                  <Scatter data={curveData} line={{ stroke: "#d1d5db", strokeWidth: 2 }} shape={() => <></>} />
                  <Scatter
                    data={teams.map((t) => ({ x: t.arousal, y: t.perf, name: t.name }))}
                    fill="#1D9E75"
                    shape={(props) => {
                      const team = teams.find((t) => t.arousal === props.x);
                      return (
                        <circle cx={props.cx} cy={props.cy} r={7}
                          fill={team ? zoneColor[team.zone] : "#1D9E75"}
                          stroke="#fff" strokeWidth={2} />
                      );
                    }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
              <div className="flex gap-5 mt-2">
                {[["#1D9E75","Optimal"],["#E24B4A","High arousal"],["#378ADD","Low arousal"]].map(([c, l]) => (
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
                {teams.map((t) => (
                  <div key={t.name} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: zoneColor[t.zone] }} />
                    <span className="text-sm text-gray-800 flex-1">{t.name}</span>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(t.g / 10) * 100}%`, background: zoneColor[t.zone] }} />
                    </div>
                    <span className="text-sm font-medium text-gray-800 w-7 text-right">{t.g}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: zoneBadge[t.zone].bg, color: zoneBadge[t.zone].text }}>
                      {t.name === "Claroe" ? "Top" : zoneBadge[t.zone].label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Flags */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-4">Key insights</p>
              <div className="flex flex-col">
                {flags.map((f) => (
                  <div key={f.team} className="flex gap-3 py-3 border-b border-gray-50 last:border-0">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm"
                      style={{ background: f.bg, color: f.iconColor }}>{f.icon}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{f.team}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
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