"use client";

import { useState, useRef } from "react";

function ydY(x) {
  return 100 * Math.exp(-0.5 * Math.pow((x - 5) / 2.2, 2));
}

function buildCurvePoints(W, H, topPad) {
  const usableH = H - topPad;
  return Array.from({ length: 101 }, (_, i) => {
    const x    = i / 10;
    const svgX = (x / 10) * W;
    const svgY = topPad + usableH - (ydY(x) / 100) * usableH;
    return `${svgX.toFixed(1)},${svgY.toFixed(1)}`;
  }).join(" ");
}

function PrintHeader({ exportedAt }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <svg width="28" height="28" viewBox="0 0 28 28" style={{ display: "block", flexShrink: 0 }}>
          <rect width="28" height="28" rx="6" fill="#16a34a" />
          <text x="14" y="19" textAnchor="middle" dominantBaseline="auto" fontSize="13" fontWeight="700" fill="#ffffff" fontFamily="system-ui, sans-serif">P</text>
        </svg>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", lineHeight: "28px" }}>Pulse</span>
        <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: "28px" }}>Culture Health Check</span>
      </div>
      <span style={{ fontSize: 12, color: "#94a3b8" }}>{exportedAt}</span>
    </div>
  );
}

function TeamScoresSVG({ teams, getZoneColor, getZoneLabel }) {
  const ROW_H = 26;
  const W = 380;
  const H = teams.length * ROW_H + 4;
  const X_RANK = 18, X_DOT = 34, X_NAME = 46, X_BAR = 210, BAR_W = 80, X_SCORE = 302, X_BADGE = 330;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      {teams.map((t, i) => {
        const color = getZoneColor(t.arousal);
        const label = i === 0 ? "Top" : getZoneLabel(t.arousal);
        const bgColor = i === 0 ? "#fef3c7" : color + "22";
        const txtColor = i === 0 ? "#92400e" : color;
        const y = i * ROW_H;
        const midY = y + ROW_H / 2;
        const barFill = (t.overall / 10) * BAR_W;
        return (
          <g key={t.name}>
            {i < teams.length - 1 && <line x1={0} y1={y + ROW_H} x2={W} y2={y + ROW_H} stroke="#f1f5f9" strokeWidth="1" />}
            <text x={X_RANK} y={midY + 4} textAnchor="end" fontSize={10} fill="#94a3b8">{i + 1}</text>
            <circle cx={X_DOT} cy={midY} r={4} fill={color} />
            <text x={X_NAME} y={midY + 4} fontSize={12} fill="#0f172a">{t.name}</text>
            <rect x={X_BAR} y={midY - 3} width={BAR_W} height={5} rx={2} fill="#f1f5f9" />
            <rect x={X_BAR} y={midY - 3} width={barFill} height={5} rx={2} fill={color} />
            <text x={X_SCORE} y={midY + 4} fontSize={12} fontWeight="600" fill="#0f172a">{t.overall}</text>
            <rect x={X_BADGE} y={midY - 9} width={46} height={17} rx={8} fill={bgColor} />
            <text x={X_BADGE + 23} y={midY + 4} textAnchor="middle" fontSize={9} fontWeight="600" fill={txtColor}>{label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function TeamScoresDisplay({ teams, getZoneColor }) {
  if (teams.length === 0) return <p style={{ fontSize: 12, color: "#94a3b8" }}>No team data</p>;

  const W = 560, H = 180, pad = { t: 20, r: 20, b: 50, l: 40 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const barW = Math.max(innerW / teams.length * 0.7, 20);
  const barSpacing = innerW / teams.length;

  const maxScore = 10;
  const yPos = (score) => pad.t + innerH - (score / maxScore) * innerH;
  const xPos = (i) => pad.l + (i + 0.5) * barSpacing;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      {[0, 2.5, 5, 7.5, 10].map((v) => (
        <g key={v}>
          <line x1={pad.l} y1={yPos(v)} x2={W - pad.r} y2={yPos(v)} stroke="#f1f5f9" strokeWidth="1" />
          <text x={pad.l - 8} y={yPos(v) + 3} textAnchor="end" fontSize={9} fill="#94a3b8">{v}</text>
        </g>
      ))}

      {teams.map((t, i) => {
        const color = getZoneColor(t.arousal);
        const x = xPos(i) - barW / 2;
        const y = yPos(t.overall);
        const barHeight = (t.overall / maxScore) * innerH;

        return (
          <g key={t.name}>
            <rect x={x} y={y} width={barW} height={barHeight} fill={color} rx="3" ry="3" />
            <text x={xPos(i)} y={y - 5} textAnchor="middle" fontSize={10} fontWeight="600" fill="#0f172a">
              {t.overall}
            </text>
            <text x={xPos(i)} y={H - 8} textAnchor="middle" fontSize={9} fill="#64748b">
              {t.name}
            </text>
          </g>
        );
      })}

      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} stroke="#e2e8f0" strokeWidth="1" />
      <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="#e2e8f0" strokeWidth="1" />
    </svg>
  );
}

export default function ExportButton({ exportData, filename = "PULSE_Dashboard.pdf", page2Chart = "trend" }) {
  const [exporting, setExporting] = useState(false);
  const topRef = useRef(null);
  const bottomRef = useRef(null);

  async function exportToPDF() {
    setExporting(true);
    await new Promise(r => setTimeout(r, 600));

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF }   = await import("jspdf");

      const topEl    = topRef.current;
      const bottomEl = bottomRef.current;
      if (!topEl || !bottomEl) throw new Error("Print refs not found");

      const CAPTURE_W = 1123;
      const opts = (el) => ({
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: CAPTURE_W,
        height: el.scrollHeight,
        windowWidth: CAPTURE_W,
        windowHeight: el.scrollHeight,
      });

      const [topCanvas, bottomCanvas] = await Promise.all([
        html2canvas(topEl,    opts(topEl)),
        html2canvas(bottomEl, opts(bottomEl)),
      ]);

      const pdf   = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      function addCanvas(canvas, isFirst) {
        const mmPerPx       = pageW / canvas.width;
        const sliceHeightPx = Math.floor((pageH * 0.98) / mmPerPx);
        let fromY = 0;
        while (fromY < canvas.height) {
          const toY    = Math.min(fromY + sliceHeightPx, canvas.height);
          const sliceH = toY - fromY;
          const slice  = document.createElement("canvas");
          slice.width  = canvas.width;
          slice.height = sliceH;
          slice.getContext("2d").drawImage(canvas, 0, fromY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
          if (!isFirst || fromY > 0) pdf.addPage();
          pdf.addImage(slice.toDataURL("image/png"), "PNG", 0, 0, pageW, sliceH * mmPerPx);
          fromY = toY;
        }
      }

      addCanvas(topCanvas,    true);
      addCanvas(bottomCanvas, false);

      pdf.setProperties({ title: filename.replace(".pdf", ""), subject: "Intern Team Health Report", creator: "PULSE" });
      pdf.save(filename);

    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  const { teams = [], cohortAvg = 0, cohortDimensions = [], trendData = [], responses = [] } = exportData || {};

  const getDimColor  = (v) => v >= 4 && v <= 6 ? "#16a34a" : (v >= 2 && v < 4) || (v > 6 && v <= 8) ? "#d97706" : "#dc2626";
  const getZoneLabel = (v) => v >= 4 && v <= 6 ? "Optimal" : (v >= 2 && v < 4) || (v > 6 && v <= 8) ? "Caution" : "Risk";
  const getZoneColor = (v) => v >= 4 && v <= 6 ? "#16a34a" : (v >= 2 && v < 4) || (v > 6 && v <= 8) ? "#d97706" : "#dc2626";

  const strongestDim = [...cohortDimensions].sort((a, b) => b.value - a.value)[0];
  const weakestDim   = [...cohortDimensions].sort((a, b) => a.value - b.value)[0];

  const SVG_W = 500, SVG_H = 180, SVG_TOP_PAD = 28, SVG_BOT_PAD = 30;
  const curvePoints = buildCurvePoints(SVG_W, SVG_H, SVG_TOP_PAD);
  const exportedAt = `Exported ${new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`;

  const sharedContainerStyle = {
    position: "fixed", top: 0, left: "-9999px", width: "1123px",
    background: "#ffffff", fontFamily: "'Inter', system-ui, sans-serif",
    padding: "32px 48px", boxSizing: "border-box",
  };

  return (
    <>
      {/* ── Simple export button — no dropdown ── */}
      <button
        onClick={exportToPDF}
        disabled={exporting}
        style={{
          display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500,
          padding: "8px 16px", border: "none", borderRadius: 8,
          background: exporting ? "#86efac" : "#16a34a", color: "#fff",
          cursor: exporting ? "not-allowed" : "pointer", whiteSpace: "nowrap",
        }}
      >
        {exporting ? <><span>⏳</span> Exporting…</> : <><span>⬇</span> Export</>}
      </button>

      {/* ── PAGE 1: Header + metric cards + Yerkes-Dodson + Team Scores ── */}
      <div ref={topRef} style={sharedContainerStyle}>
        <PrintHeader />
        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 20px" }}>
          {responses.length} responses · {teams.length} teams
        </p>

        {/* Metric cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
          {[
            { label: "COHORT AVG SCORE", value: cohortAvg.toFixed(1), sub: "/ 10 across all dimensions", color: "#16a34a" },
            { label: "STRONGEST SIGNAL", value: strongestDim?.label || "—", sub: `${strongestDim?.value ?? "—"} avg`, color: "#16a34a" },
            { label: "WEAKEST SIGNAL",   value: weakestDim?.label  || "—", sub: `${weakestDim?.value ?? "—"} avg — needs attention`, color: "#dc2626" },
            { label: "TOTAL RESPONSES",  value: String(responses.length), sub: `${teams.length} teams participated`, color: "#6366f1" },
          ].map(m => (
            <div key={m.label} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px" }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.07em", margin: "0 0 5px", textTransform: "uppercase" }}>{m.label}</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", margin: "0 0 3px", lineHeight: 1 }}>{m.value}</p>
              <p style={{ fontSize: 11, color: m.color, margin: 0 }}>{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Yerkes-Dodson + Team Scores */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 18px" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "#64748b", letterSpacing: "0.07em", margin: "0 0 10px", textTransform: "uppercase" }}>
              Yerkes-Dodson Curve — Team Positions
            </p>
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H + SVG_BOT_PAD}`} width="100%" style={{ display: "block" }}>
              {[[0,"#dc2626"],[100,"#d97706"],[200,"#16a34a"],[300,"#d97706"],[400,"#dc2626"]].map(([x, c]) => (
                <rect key={x} x={x} y={SVG_TOP_PAD} width={100} height={SVG_H - SVG_TOP_PAD} fill={c} fillOpacity={0.08} />
              ))}
              {[["Risk","#dc2626",50],["Caution","#d97706",150],["Optimal","#16a34a",250],["Caution","#d97706",350],["Risk","#dc2626",450]].map(([l,c,x]) => (
                <text key={x} x={x} y={SVG_TOP_PAD - 8} textAnchor="middle" fontSize={9} fill={c} fontWeight="600">{l}</text>
              ))}
              <polyline points={curvePoints} fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinejoin="round" />
              {teams.map((t, i) => {
                const svgX  = (t.arousal / 10) * SVG_W;
                const svgY  = SVG_TOP_PAD + (SVG_H - SVG_TOP_PAD) - (ydY(t.arousal) / 100) * (SVG_H - SVG_TOP_PAD);
                const color = getZoneColor(t.arousal);
                return (
                  <g key={t.name}>
                    <circle cx={svgX} cy={svgY} r={7} fill={color} stroke="#fff" strokeWidth={1.5} />
                    <text x={svgX} y={svgY + 4} textAnchor="middle" fontSize={6} fontWeight="700" fill="#fff">{i + 1}</text>
                  </g>
                );
              })}
              <line x1={2} y1={SVG_H} x2={SVG_W - 2} y2={SVG_H} stroke="#e2e8f0" strokeWidth="1" />
              {[0,2,4,6,8,10].map(v => {
                const rawX = (v / 10) * SVG_W;
                const x = v === 0 ? rawX + 6 : v === 10 ? rawX - 6 : rawX;
                return <text key={v} x={x} y={SVG_H + 13} textAnchor="middle" fontSize={8} fill="#94a3b8">{v}</text>;
              })}
              <text x={SVG_W / 2} y={SVG_H + SVG_BOT_PAD - 2} textAnchor="middle" fontSize={8} fill="#94a3b8">Arousal level</text>
            </svg>
            {/* Numbered legend */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px 6px", marginTop: 8 }}>
              {teams.map((t, i) => {
                const color = getZoneColor(t.arousal);
                return (
                  <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
                      <circle cx="7" cy="7" r="7" fill={color} />
                      <text x="7" y="11" textAnchor="middle" fontSize="6" fontWeight="700" fill="#fff">{i + 1}</text>
                    </svg>
                    <span style={{ fontSize: 9, color: "#374151" }}>{t.name}</span>
                  </div>
                );
              })}
            </div>
            {/* Zone legend */}
            <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
              {[["#16a34a","Optimal (4–6)"],["#d97706","Caution (2–4, 6–8)"],["#dc2626","Risk (1–2, 9–10)"]].map(([c,l]) => (
                <span key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "#64748b" }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" style={{ flexShrink: 0 }}>
                    <circle cx="4" cy="4" r="4" fill={c} />
                  </svg>
                  {l}
                </span>
              ))}
            </div>
          </div>

          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 18px" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "#64748b", letterSpacing: "0.07em", margin: "0 0 10px", textTransform: "uppercase" }}>
              Team Overall Scores
            </p>
            <TeamScoresSVG teams={teams} getZoneColor={getZoneColor} getZoneLabel={getZoneLabel} />
          </div>
        </div>
      </div>

      {/* ── PAGE 2: Header + Dimensions + Trend or Comparison ── */}
      <div ref={bottomRef} style={sharedContainerStyle}>
        <PrintHeader />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 14 }}>

          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 18px" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "#64748b", letterSpacing: "0.07em", margin: "0 0 10px", textTransform: "uppercase" }}>
              Dimensions — Cohort Average
            </p>
            {cohortDimensions.map((d, i) => (
              <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < cohortDimensions.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <span style={{ fontSize: 14 }}>{{ Social:"👥", Workload:"💼", Energy:"⚡", Recovery:"❤️", Motivation:"🎯" }[d.label]}</span>
                <span style={{ fontSize: 12, color: "#374151", width: 80 }}>{d.label}</span>
                <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(d.value / 10) * 100}%`, background: getDimColor(d.value), borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", minWidth: 30, textAlign: "right" }}>{d.value}</span>
              </div>
            ))}
          </div>

          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 18px" }}>
            {page2Chart === "comparison" ? (
              <>
                <p style={{ fontSize: 10, fontWeight: 600, color: "#64748b", letterSpacing: "0.07em", margin: "0 0 10px", textTransform: "uppercase" }}>
                  Team Comparison
                </p>
                <TeamScoresDisplay teams={teams} getZoneColor={getZoneColor} />
              </>
            ) : (
              <>
                <p style={{ fontSize: 10, fontWeight: 600, color: "#64748b", letterSpacing: "0.07em", margin: "0 0 10px", textTransform: "uppercase" }}>
                  Avg Score Trend — By Week
                </p>
                {trendData.length > 0 ? (() => {
                  const W = 560, H = 160, pad = { t: 20, r: 20, b: 36, l: 44 };
                  const innerW = W - pad.l - pad.r;
                  const innerH = H - pad.t - pad.b;
                  const vals   = trendData.map(d => d.g);
                  const minV   = Math.max(0,  Math.min(...vals) - 0.5);
                  const maxV   = Math.min(10, Math.max(...vals) + 0.5);
                  const xPos   = (i) => pad.l + (i / Math.max(trendData.length - 1, 1)) * innerW;
                  const yPos   = (v) => pad.t + innerH - ((v - minV) / (maxV - minV)) * innerH;
                  const points = trendData.map((d, i) => `${xPos(i)},${yPos(d.g)}`).join(" ");

                  return (
                    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
                      {[minV, (minV + maxV) / 2, maxV].map(v => (
                        <g key={v}>
                          <line x1={pad.l} y1={yPos(v)} x2={W - pad.r} y2={yPos(v)} stroke="#f1f5f9" strokeWidth="1" />
                          <text x={pad.l - 6} y={yPos(v) + 3} textAnchor="end" fontSize={9} fill="#94a3b8">{v.toFixed(1)}</text>
                        </g>
                      ))}
                      <polyline points={points} fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinejoin="round" />
                      {trendData.map((d, i) => (
                        <g key={d.week}>
                          <circle cx={xPos(i)} cy={yPos(d.g)} r={5} fill="#16a34a" stroke="#fff" strokeWidth={1.5} />
                          <text x={xPos(i)} y={yPos(d.g) - 10} textAnchor="middle" fontSize={9} fill="#374151" fontWeight="600">{d.g.toFixed(2)}</text>
                          <text x={xPos(i)} y={H - 6} textAnchor="middle" fontSize={8} fill="#94a3b8">{d.week}</text>
                        </g>
                      ))}
                    </svg>
                  );
                })() : <p style={{ fontSize: 12, color: "#94a3b8" }}>No trend data yet</p>}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}