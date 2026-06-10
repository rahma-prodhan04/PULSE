"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ReferenceLine,
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const teams = [
  { name: "Alpha", arousal: 6.2, perf: 72, g: 7.2, zone: "optimal" },
  { name: "Beta", arousal: 6.8, perf: 66, g: 6.6, zone: "optimal" },
  { name: "Gamma", arousal: 5.8, perf: 62, g: 6.2, zone: "optimal" },
  { name: "Epsilon", arousal: 3.2, perf: 38, g: 3.8, zone: "low" },
  { name: "Delta", arousal: 8.8, perf: 21, g: 2.1, zone: "high" },
];

const zoneColor: Record<string, string> = {
  optimal: "#1D9E75",
  low: "#378ADD",
  high: "#E24B4A",
};

const zoneBadge: Record<string, { bg: string; text: string; label: string }> = {
  optimal: { bg: "#E1F5EE", text: "#085041", label: "Good" },
  low: { bg: "#E6F1FB", text: "#185FA5", label: "Low" },
  high: { bg: "#FCEBEB", text: "#791F1F", label: "Risk" },
};

function ydY(x: number) {
  return 100 * Math.exp(-0.5 * Math.pow((x - 5.5) / 2.2, 2));
}

const curveData = Array.from({ length: 101 }, (_, i) => ({
  x: parseFloat((i / 10).toFixed(1)),
  y: parseFloat(ydY(i / 10).toFixed(1)),
}));

const trendData = [
  { week: "Wk 1", g: 5.4 },
  { week: "Wk 2", g: 5.7 },
  { week: "Wk 3", g: 5.9 },
  { week: "Wk 4", g: 5.8 },
  { week: "Wk 5", g: 6.1 },
  { week: "Wk 6", g: 6.4 },
];

const dimensions = [
  { label: "Energy", value: 6.8, color: "#1D9E75" },
  { label: "Workload stress", value: 7.2, color: "#E24B4A" },
  { label: "Focus", value: 6.4, color: "#1D9E75" },
  { label: "Motivation", value: 5.8, color: "#1D9E75" },
  { label: "Recovery", value: 5.2, color: "#EF9F27" },
  { label: "Social", value: 7.4, color: "#1D9E75" },
  { label: "Wellbeing", value: 6.0, color: "#1D9E75" },
  { label: "Challenge", value: 5.5, color: "#1D9E75" },
  { label: "Fatigue", value: 6.6, color: "#EF9F27" },
];

const flags = [
  {
    team: "Team Delta",
    desc: "Burnout risk — stress above 8 for 3 consecutive weeks.",
    bg: "#FCEBEB",
    icon: "⚠",
    iconColor: "#A32D2D",
  },
  {
    team: "Team Epsilon",
    desc: "Under-stimulated — low challenge scores 2 weeks running.",
    bg: "#E6F1FB",
    icon: "–",
    iconColor: "#185FA5",
  },
  {
    team: "Team Alpha",
    desc: "Sustained peak — 4 weeks in the optimal zone.",
    bg: "#E1F5EE",
    icon: "★",
    iconColor: "#085041",
  },
];

export default function Dashboard() {
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
            2025 intern cohort
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
            Week 6 of 12
          </p>
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full w-1/2 rounded-full bg-teal-400" />
          </div>
          <p className="text-[10px] mt-1.5" style={{ color: "#5DCAA5" }}>
            Program halfway point
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
              57 interns · 5 teams · last check-in Monday 9am
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="text-xs px-4 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50">
              Week 6
            </button>
            <button
              className="text-xs px-4 py-1.5 rounded-full text-white"
              style={{ background: "#085041" }}
            >
              Export
            </button>
          </div>
        </header>

        {/* Scrollable body */}
        <main className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-5">

          {/* Metric cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Cohort g-score", value: "6.4", sub: "+0.3 from last week", valueColor: "#085041", subColor: "#0F6E56" },
              { label: "Optimal teams", value: "3 / 5", sub: "Alpha, Beta, Gamma", valueColor: "", subColor: "" },
              { label: "Active flags", value: "2", sub: "Action needed", valueColor: "#A32D2D", subColor: "#A32D2D" },
              { label: "Response rate", value: "82%", sub: "47 of 57 submitted", valueColor: "", subColor: "" },
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
                <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                  <XAxis dataKey="x" type="number" domain={[0, 10]} tickCount={6} tick={{ fontSize: 11 }} label={{ value: "Arousal level", position: "insideBottom", offset: -2, fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis dataKey="y" type="number" domain={[0, 110]} hide />
                  <Tooltip formatter={(v: number, n: string) => n === "y" ? null : [v, ""]} />
                  <Scatter data={curveData} line={{ stroke: "#d1d5db", strokeWidth: 2 }} shape={() => <></>} />
                  {teams.map((t) => (
                    <ReferenceLine key={t.name} x={t.arousal} stroke="transparent" />
                  ))}
                  <Scatter
                    data={teams.map((t) => ({ x: t.arousal, y: t.perf, name: t.name }))}
                    fill="#1D9E75"
                    shape={(props: any) => {
                      const team = teams.find((t) => t.arousal === props.x);
                      return (
                        <circle
                          cx={props.cx}
                          cy={props.cy}
                          r={8}
                          fill={team ? zoneColor[team.zone] : "#1D9E75"}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      );
                    }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
              <div className="flex gap-5 mt-2">
                {[["#1D9E75", "Optimal"], ["#E24B4A", "High arousal"], ["#378ADD", "Low arousal"]].map(([c, l]) => (
                  <span key={l} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: c }} />
                    {l}
                  </span>
                ))}
              </div>
            </div>

            {/* Team scores */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-4">Team g-scores</p>
              <div className="flex flex-col">
                {teams.sort((a, b) => b.g - a.g).map((t) => (
                  <div key={t.name} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: zoneColor[t.zone] }} />
                    <span className="text-sm text-gray-800 flex-1">{t.name}</span>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(t.g / 10) * 100}%`, background: zoneColor[t.zone] }} />
                    </div>
                    <span className="text-sm font-medium text-gray-800 w-7 text-right">{t.g}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: zoneBadge[t.zone].bg, color: zoneBadge[t.zone].text }}>
                      {t.name === "Alpha" ? "Peak" : zoneBadge[t.zone].label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Flags */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-4">Flags</p>
              <div className="flex flex-col">
                {flags.map((f) => (
                  <div key={f.team} className="flex gap-3 py-3 border-b border-gray-50 last:border-0">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm" style={{ background: f.bg, color: f.iconColor }}>
                      {f.icon}
                    </div>
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
                <p className="text-[11px] uppercase tracking-wider text-gray-400">Arousal dimensions</p>
                <select className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white">
                  <option>Cohort average</option>
                  <option>Team Alpha</option>
                  <option>Team Beta</option>
                  <option>Team Gamma</option>
                  <option>Team Epsilon</option>
                  <option>Team Delta</option>
                </select>
              </div>
              <div className="flex flex-col">
                {dimensions.map((d) => (
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
              <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-4">g-score trend — weeks 1 to 6</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[4, 8]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="g" stroke="#1D9E75" strokeWidth={2.5} dot={{ r: 4, fill: "#1D9E75", stroke: "#fff", strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}