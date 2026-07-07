"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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

const Y_DOMAIN = [0, 115];

export default function SpreadView() {
  const router = useRouter();
  const { cohorts, selectedCohort, selectedCohortId, setSelectedCohortId } = useCohort();
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState([]);
  const [teamNames, setTeamNames] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState("all");
  const heatCanvasRef = useRef(null);
  const chartWrapperRef = useRef(null);

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

  const drawHeatmap = useCallback(() => {
    const canvas = heatCanvasRef.current;
    const wrapper = chartWrapperRef.current;
    if (!canvas || !wrapper) return;

    // Find the actual Recharts plot area by querying the SVG clipPath rect
    // This gives us exact pixel coordinates regardless of YAxis hidden width
    const svg = wrapper.querySelector("svg");
    if (!svg) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    const W = Math.round(wrapperRect.width);
    const H = Math.round(wrapperRect.height);
    if (!W || !H) return;

    canvas.width = W;
    canvas.height = H;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    // Find the inner plot area rect from Recharts SVG structure
    // Recharts renders a <clipPath><rect> that exactly bounds the plot area
    let plotX = 0, plotY = 0, plotW = W, plotH = H;
    const clipRect = svg.querySelector("defs clipPath rect");
    if (clipRect) {
      plotX = parseFloat(clipRect.getAttribute("x") || "0");
      plotY = parseFloat(clipRect.getAttribute("y") || "0");
      plotW = parseFloat(clipRect.getAttribute("width") || W);
      plotH = parseFloat(clipRect.getAttribute("height") || H);
    }

    // Convert arousal (0-10) and y-value to canvas pixel using actual plot bounds
    const toPixel = (arousal, yVal) => {
      const px = plotX + (arousal / 10) * plotW;
      const [yMin, yMax] = Y_DOMAIN;
      const py = plotY + (1 - (yVal - yMin) / (yMax - yMin)) * plotH;
      return { px, py };
    };

    const rows = selectedWeek === "all"
      ? responses
      : responses.filter(r => r.week_start === selectedWeek);

    if (!rows.length) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);

    const density = document.createElement("canvas");
    density.width = W;
    density.height = H;
    const dCtx = density.getContext("2d");

    // Green base
    dCtx.fillStyle = "#16a34a";
    dCtx.globalAlpha = 0.18;
    dCtx.fillRect(0, 0, W, H);
    dCtx.globalAlpha = 1;

    // Compute centroid
    const avgArousal = rows.reduce((sum, r) =>
      sum + avg([r.q1_workload, r.q2_energy, r.q3_recovery, r.q4_motivation]), 0
    ) / rows.length;
    const { px: centroidPx, py: centroidPy } = toPixel(avgArousal, ydY(avgArousal));

    const maxDist = Math.hypot(
      Math.max(centroidPx, W - centroidPx),
      Math.max(centroidPy, H - centroidPy)
    );

    // Each dot emits a red blob — intensity scales with proximity to centroid
    rows.forEach(r => {
      const arousal = avg([r.q1_workload, r.q2_energy, r.q3_recovery, r.q4_motivation]);
      const { px, py } = toPixel(arousal, ydY(arousal));

      const dist = Math.hypot(px - centroidPx, py - centroidPy);
      const proximity = 1 - Math.min(dist / maxDist, 1);
      const intensity = 0.015 + proximity * 0.08;
      const blobR = W * (0.04 + proximity * 0.03);

      const grad = dCtx.createRadialGradient(px, py, 0, px, py, blobR);
      grad.addColorStop(0,   `rgba(255,255,255,${intensity.toFixed(3)})`);
      grad.addColorStop(0.3, `rgba(255,255,255,${(intensity * 0.5).toFixed(3)})`);
      grad.addColorStop(0.7, `rgba(255,255,255,${(intensity * 0.15).toFixed(3)})`);
      grad.addColorStop(1,   "rgba(0,0,0,0)");
      dCtx.beginPath();
      dCtx.arc(px, py, blobR, 0, Math.PI * 2);
      dCtx.fillStyle = grad;
      dCtx.fill();
    });

    // Colorize pass
    const src = dCtx.getImageData(0, 0, W, H).data;
    const out = ctx.createImageData(W, H);
    const dst = out.data;

    for (let i = 0; i < src.length; i += 4) {
      const v = src[i] / 255;
      let rr, g, b, a;
      if (v < 0.08) {
        rr = 22; g = 163; b = 74; a = 180;
      } else if (v < 0.35) {
        const t = (v - 0.08) / 0.27;
        rr = Math.round(22 + 180 * t); g = Math.round(163 + 17 * t); b = Math.round(74 - 74 * t);
        a = Math.round(180 + 40 * t);
      } else if (v < 0.65) {
        const t = (v - 0.35) / 0.3;
        rr = Math.round(202 + 53 * t); g = Math.round(180 - 80 * t); b = 0;
        a = Math.round(210 + 30 * t);
      } else {
        const t = (v - 0.65) / 0.35;
        rr = 255; g = Math.round(100 * (1 - t)); b = 0;
        a = Math.min(255, Math.round(240 + 15 * t));
      }
      dst[i] = rr; dst[i + 1] = g; dst[i + 2] = b; dst[i + 3] = a;
    }

    ctx.putImageData(out, 0, 0);
  }, [responses, selectedWeek]);

  // Draw after render so Recharts SVG exists in DOM
  useEffect(() => {
    // Small delay to ensure Recharts has fully rendered its SVG
    const timer = setTimeout(drawHeatmap, 50);
    return () => clearTimeout(timer);
  }, [drawHeatmap]);

  const teamColorMap = Object.fromEntries(
    teamNames.map((name, i) => [name, TEAM_COLORS[i % TEAM_COLORS.length]])
  );

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
        week: r.week_start,
        id: i,
      };
    });
  })();

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

  const chartHeight = Math.min(Math.max(300, dots.length * 1.8 + 200), 700);

  if (loading) return <LoadingAnimation onDone={() => setLoading(false)} />;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', system-ui, sans-serif", background: "#f8fafc", overflow: "hidden" }}>

      <aside style={{ width: 200, background: "#0a2818", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <img src="/pulse-logo.png" alt="Pulse" width={32} height={32} style={{ borderRadius: 8 }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Pulse</span>
          </div>
          <p style={{ fontSize: 11, color: "rgba(134,239,172,0.6)", marginLeft: 42 }}>Culture Health Check</p>
        </div>

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

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <header style={{ padding: "20px 28px 16px", background: "#fff", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
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

        <main style={{ flex: 1, overflowY: "auto", padding: "20px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { zone: "Optimal", color: "#16a34a", range: "Arousal 4–6" },
              { zone: "Caution", color: "#d97706", range: "Arousal 2–4 or 6–8" },
              { zone: "Risk", color: "#dc2626", range: "Arousal 1–2 or 8–10" },
            ].map(({ zone, color, range }) => {
              const count = zoneCounts[zone] || 0;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={zone} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", border: "1px solid #e2e8f0" }}>
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

          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.07em", margin: 0, textTransform: "uppercase" }}>
                  Yerkes-Dodson Curve — Individual Spread
                </p>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>ⓘ</span>
              </div>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                Heatmap shows density · dots show team · overlap = hot zone
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, padding: "0 20px" }}>
              {[["Risk", "#dc2626", "1 – 2.9"], ["Caution", "#d97706", "2 – 3.9"], ["Optimal", "#16a34a", "4 – 6"], ["Caution", "#d97706", "6 – 8"], ["Risk", "#dc2626", "8 – 10"]].map(([label, color, range]) => (
                <div key={range} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color, margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>({range})</p>
                </div>
              ))}
            </div>

            <div ref={chartWrapperRef} style={{ position: "relative", height: chartHeight }}>
              <canvas
                ref={heatCanvasRef}
                style={{
                  position: "absolute", top: 0, left: 0,
                  pointerEvents: "none", zIndex: 0,
                  display: "block",
                }}
              />

              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 10 }}>
                    <XAxis dataKey="x" type="number" domain={[0, 10]} tickCount={6} tick={{ fontSize: 11 }}
                      label={{ value: "Arousal level", position: "insideBottom", offset: -10, fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis dataKey="y" type="number" domain={Y_DOMAIN} hide width={0} />
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
                            <p style={{ color: "#94a3b8", fontSize: 11, margin: "0 0 3px" }}>
                              Week {getWeekNumber(d.week, selectedCohort?.start_date)} · {formatDate(d.week)}
                            </p>
                            <p style={{ color: "#64748b", margin: 0 }}>Score: <b style={{ color: "#0f172a" }}>{d.score}</b> · Arousal: <b style={{ color: "#0f172a" }}>{d.arousal}</b></p>
                          </div>
                        );
                      }
                      return null;
                    }} />

                    <ReferenceArea x1={0} x2={2} fill="#dc2626" fillOpacity={0.04} />
                    <ReferenceArea x1={2} x2={4} fill="#d97706" fillOpacity={0.04} />
                    <ReferenceArea x1={4} x2={6} fill="#16a34a" fillOpacity={0.06} />
                    <ReferenceArea x1={6} x2={8} fill="#d97706" fillOpacity={0.04} />
                    <ReferenceArea x1={8} x2={10} fill="#dc2626" fillOpacity={0.04} />

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
                      data={dots.map((d, i) => ({
                        ...d,
                        y: ydY(d.x) + ((i * 13.7) % 6) - 3,
                      }))}
                      shape={(props) => (
                        <circle
                          cx={props.cx} cy={props.cy} r={6}
                          fill={props.color || "#64748b"}
                          stroke="#fff" strokeWidth={2}
                          opacity={0.9}
                        />
                      )}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
              {teamNames.map((name, i) => (
                <span key={name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748b" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: TEAM_COLORS[i % TEAM_COLORS.length], display: "inline-block" }} />
                  {name}
                </span>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}