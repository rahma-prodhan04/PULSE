"use client";

import { useEffect, useRef } from "react";

export default function LoadingAnimation({ onDone }) {
  const bgRef = useRef(null);
  const barRef = useRef(null);

  useEffect(() => {
    if (onDone) {
      const timer = setTimeout(onDone, 3000);
      return () => clearTimeout(timer);
    }
  }, [onDone]);

  useEffect(() => {
    const bg = bgRef.current;
    const bar = barRef.current;
    if (!bg || !bar) return;

    const bx = bg.getContext("2d");
    const brc = bar.getContext("2d");
    const W = window.innerWidth, H = window.innerHeight, BW = Math.min(520, W * 0.4), BH = 88;
    bg.width = W; bg.height = H;

    const BG = "#0d2d23";
    const GRGB = "26,210,130";

    let beatPhase = 0, flash = 0, bHead = 0, bT = 0, ldotT = 0;
    let barPhase = 0, barHead = 0, progress = 0;
    const bParticles = [];
    const HIST = W;
    const bbuf = new Float32Array(HIST);
    const barBuf = new Float32Array(BW);
    const CY = H / 2;
    let animId;

    function bgEcg(ph) {
      const p = ((ph % 1) + 1) % 1;
      let v = 0;
      if      (p < 0.06) v =  Math.sin(p / 0.06 * Math.PI) * 0.07;
      else if (p < 0.13) v =  Math.sin((p - 0.06) / 0.07 * Math.PI) * 0.12;
      else if (p < 0.28) v =  0;
      else if (p < 0.31) v = -Math.sin((p - 0.28) / 0.03 * Math.PI) * 0.15;
      else if (p < 0.34) v =  Math.sin((p - 0.31) / 0.03 * Math.PI) * 1.0;
      else if (p < 0.38) v = -Math.sin((p - 0.34) / 0.04 * Math.PI) * 0.38;
      else if (p < 0.45) v =  0;
      else if (p < 0.51) v =  Math.sin((p - 0.45) / 0.06 * Math.PI) * 0.18;
      else if (p < 0.57) v =  Math.sin((p - 0.51) / 0.06 * Math.PI) * 0.21;
      else v = 0;
      return v * 90 + (Math.random() - 0.5) * 0.8;
    }

    function barEcg(ph) {
      const p = ((ph % 1) + 1) % 1;
      let v = 0;
      if      (p < 0.06) v =  Math.sin(p / 0.06 * Math.PI) * 0.07;
      else if (p < 0.13) v =  Math.sin((p - 0.06) / 0.07 * Math.PI) * 0.12;
      else if (p < 0.28) v =  0;
      else if (p < 0.31) v = -Math.sin((p - 0.28) / 0.03 * Math.PI) * 0.15;
      else if (p < 0.34) v =  Math.sin((p - 0.31) / 0.03 * Math.PI) * 1.0;
      else if (p < 0.38) v = -Math.sin((p - 0.34) / 0.04 * Math.PI) * 0.38;
      else if (p < 0.45) v =  0;
      else if (p < 0.51) v =  Math.sin((p - 0.45) / 0.06 * Math.PI) * 0.18;
      else if (p < 0.57) v =  Math.sin((p - 0.51) / 0.06 * Math.PI) * 0.21;
      else v = 0;
      return v * 28 + (Math.random() - 0.5) * 0.4;
    }

    function spawnParticles(x, y) {
      for (let i = 0; i < 20; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 0.4 + Math.random() * 2.5;
        bParticles.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 0.9, life: 1, size: Math.random() * 2 + 0.4 });
      }
    }

    function drawBgGrid() {
      for (let x = 0; x <= W; x += 20) {
        bx.beginPath(); bx.moveTo(x, 0); bx.lineTo(x, H);
        bx.strokeStyle = x % 100 === 0 ? "rgba(26,210,130,0.055)" : "rgba(26,210,130,0.02)";
        bx.lineWidth   = x % 100 === 0 ? 0.6 : 0.3;
        bx.stroke();
      }
      for (let y = 0; y <= H; y += 20) {
        bx.beginPath(); bx.moveTo(0, y); bx.lineTo(W, y);
        bx.strokeStyle = y % 100 === 0 ? "rgba(26,210,130,0.055)" : "rgba(26,210,130,0.02)";
        bx.lineWidth   = y % 100 === 0 ? 0.6 : 0.3;
        bx.stroke();
      }
    }

    function drawBgTrace() {
      const p  = bHead / HIST;
      const hx = p * W;
      const hy = CY + bbuf[bHead];

      bx.save();
      bx.beginPath();
      for (let i = 0; i < HIST; i++) {
        const si = ((bHead - HIST + i + HIST * 2) % HIST);
        const x = (i / HIST) * W, y = CY + bbuf[si];
        i === 0 ? bx.moveTo(x, y) : bx.lineTo(x, y);
      }
      const g1 = bx.createLinearGradient(0, 0, W, 0);
      g1.addColorStop(Math.max(0, p - 0.55), "rgba(0,0,0,0)");
      g1.addColorStop(Math.max(0, p - 0.08), `rgba(${GRGB},0.09)`);
      g1.addColorStop(Math.min(1, p),         "rgba(0,0,0,0)");
      bx.strokeStyle = g1; bx.lineWidth = 20; bx.lineJoin = "round"; bx.stroke();
      bx.restore();

      bx.save();
      bx.beginPath();
      for (let i = 0; i < HIST; i++) {
        const si = ((bHead - HIST + i + HIST * 2) % HIST);
        const x = (i / HIST) * W, y = CY + bbuf[si];
        i === 0 ? bx.moveTo(x, y) : bx.lineTo(x, y);
      }
      const g2 = bx.createLinearGradient(0, 0, W, 0);
      g2.addColorStop(Math.max(0, p - 0.42), "rgba(0,0,0,0)");
      g2.addColorStop(Math.max(0, p - 0.05), `rgba(${GRGB},0.6)`);
      g2.addColorStop(Math.min(1, p),         "rgba(0,0,0,0)");
      bx.strokeStyle = g2; bx.lineWidth = 3.5; bx.lineJoin = "round"; bx.stroke();
      bx.restore();

      bx.save();
      bx.beginPath();
      for (let i = 0; i < HIST; i++) {
        const si = ((bHead - HIST + i + HIST * 2) % HIST);
        const x = (i / HIST) * W, y = CY + bbuf[si];
        i === 0 ? bx.moveTo(x, y) : bx.lineTo(x, y);
      }
      const g3 = bx.createLinearGradient(0, 0, W, 0);
      g3.addColorStop(Math.max(0, p - 0.28),   "rgba(0,0,0,0)");
      g3.addColorStop(Math.max(0, p - 0.025),  `rgba(${GRGB},1)`);
      g3.addColorStop(Math.min(1, p + 0.001),  "rgba(255,255,255,0)");
      bx.strokeStyle = g3; bx.lineWidth = 1.5; bx.lineJoin = "round"; bx.stroke();
      bx.restore();

      bx.save();
      bx.fillStyle = BG;
      bx.fillRect(hx, CY - 115, 34, 230);
      bx.restore();

      bx.save();
      [22, 13, 7].forEach((r, ri) => {
        bx.beginPath(); bx.arc(hx, hy, r, 0, Math.PI * 2);
        bx.strokeStyle = `rgba(${GRGB},${[0.07, 0.18, 0.38][ri]})`;
        bx.lineWidth   = [0.6, 1, 1.5][ri];
        bx.stroke();
      });
      bx.beginPath(); bx.arc(hx, hy, 3.8, 0, Math.PI * 2);
      bx.fillStyle = "#fff"; bx.fill();
      const ct = bx.createLinearGradient(hx - 22, 0, hx, 0);
      ct.addColorStop(0, "rgba(255,255,255,0)");
      ct.addColorStop(1, `rgba(${GRGB},0.7)`);
      bx.beginPath(); bx.moveTo(hx - 22, hy); bx.lineTo(hx - 1, hy);
      bx.strokeStyle = ct; bx.lineWidth = 1.3; bx.stroke();
      bx.restore();
    }

    function drawBgParticles() {
      for (let i = bParticles.length - 1; i >= 0; i--) {
        const p = bParticles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= 0.022; p.vx *= 0.97;
        if (p.life <= 0) { bParticles.splice(i, 1); continue; }
        bx.save();
        bx.globalCompositeOperation = "screen";
        bx.beginPath(); bx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        bx.fillStyle = `rgba(${GRGB},${p.life * 0.8})`; bx.fill();
        bx.restore();
      }
    }

    function drawBgVignette() {
      const g = bx.createRadialGradient(W/2, H/2, H * 0.12, W/2, H/2, W * 0.8);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.72)");
      bx.fillStyle = g; bx.fillRect(0, 0, W, H);
    }

    function drawBgScanlines() {
      for (let y = 0; y < H; y += 3) {
        bx.fillStyle = "rgba(0,0,0,0.04)";
        bx.fillRect(0, y, W, 1.5);
      }
    }

    function drawBar() {
      brc.clearRect(0, 0, BW, BH);
      const mid   = BH / 2;
      const fillX = progress * BW;

      brc.save();
      brc.beginPath(); brc.moveTo(0, mid); brc.lineTo(BW, mid);
      brc.strokeStyle = "rgba(26,210,130,0.1)"; brc.lineWidth = 1; brc.stroke();
      brc.restore();

      if (fillX > 1) {
        brc.save();
        brc.beginPath(); brc.rect(0, 0, fillX, BH); brc.clip();
        brc.beginPath();
        for (let i = 0; i < BW; i++) {
          const si = ((barHead - BW + i + BW * 2) % BW);
          const x = i, y = mid + barBuf[si];
          i === 0 ? brc.moveTo(x, y) : brc.lineTo(x, y);
        }
        const gC = brc.createLinearGradient(0, 0, fillX, 0);
        gC.addColorStop(0,   "rgba(26,210,130,0.5)");
        gC.addColorStop(0.9, "rgba(26,210,130,1)");
        gC.addColorStop(1,   "rgba(26,210,130,1)");
        brc.strokeStyle = gC; brc.lineWidth = 1.4; brc.lineJoin = "round"; brc.stroke();
        brc.restore();
      }

      if (fillX < BW) {
        brc.save();
        brc.beginPath(); brc.rect(fillX + 1, 0, BW - fillX, BH); brc.clip();
        brc.beginPath();
        for (let i = 0; i < BW; i++) {
          const si = ((barHead - BW + i + BW * 2) % BW);
          const x = i, y = mid + barBuf[si];
          i === 0 ? brc.moveTo(x, y) : brc.lineTo(x, y);
        }
        brc.strokeStyle = "rgba(26,210,130,0.08)"; brc.lineWidth = 1; brc.lineJoin = "round"; brc.stroke();
        brc.restore();
      }

      const headY = mid + barBuf[barHead];
      brc.save();
      [14, 8].forEach((r, ri) => {
        brc.beginPath(); brc.arc(fillX, headY, r, 0, Math.PI * 2);
        brc.strokeStyle = `rgba(26,210,130,${[0.12, 0.28][ri]})`;
        brc.lineWidth   = [0.7, 1.2][ri]; brc.stroke();
      });
      brc.beginPath(); brc.arc(fillX, headY, 3.2, 0, Math.PI * 2);
      brc.fillStyle = "#fff"; brc.fill();
      brc.restore();
    }

    const loadTexts = ["Loading your dashboard", "Fetching team data", "Almost ready…"];
    let loadIdx = 0;

    function frame() {
      const dt = 0.016;
      bT += dt;

      const bHz  = 68 / 60;
      const prev = beatPhase;
      beatPhase += bHz * dt;
      barPhase  += bHz * dt;

      const beat = Math.floor(beatPhase) > Math.floor(prev);
      if (beat) {
        flash = 1;
        spawnParticles((bHead / HIST) * W, CY + bbuf[bHead]);
        if (Math.random() < 0.15) {
          loadIdx = (loadIdx + 1) % loadTexts.length;
          const lbl = document.getElementById("loadlbl");
          if (lbl) lbl.textContent = loadTexts[loadIdx];
        }
      }
      flash *= 0.85;

      ldotT += dt;
      const bdot = document.getElementById("bdot");
      if (bdot) {
        const s = 0.85 + 0.15 * Math.abs(Math.sin(ldotT * Math.PI * 1.1));
        bdot.style.transform = `scale(${s})`;
        bdot.style.boxShadow = `0 0 ${8 + 6 * Math.abs(Math.sin(ldotT * Math.PI * 1.1))}px rgba(26,210,130,0.7)`;
      }

      bbuf[bHead]     = bgEcg(beatPhase);
      barBuf[barHead] = barEcg(barPhase);
      barHead = (barHead + 1) % BW;

      progress = (bT % 4) / 4;

      bx.fillStyle = BG; bx.fillRect(0, 0, W, H);
      drawBgGrid();
      if (flash > 0.005) {
        const g = bx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.7);
        g.addColorStop(0, `rgba(${GRGB},${flash * 0.1})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        bx.fillStyle = g; bx.fillRect(0, 0, W, H);
      }
      drawBgTrace();
      drawBgParticles();
      drawBgScanlines();
      drawBgVignette();
      drawBar();

      bHead = (bHead + 1) % HIST;
      animId = requestAnimationFrame(frame);
    }

    animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
  <div style={{ background: "#0a1f17", width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
    <div style={{ position: "relative", background: "#0d2d23", borderRadius: 20, overflow: "hidden", width: "100%", height: "100%", maxWidth: "100%", maxHeight: "100%" }}>
      <canvas ref={bgRef} style={{ display: "block", width: "100%", height: "100%" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div id="bdot" style={{ width: 10, height: 10, borderRadius: "50%", background: "#1ad282" }} />
            <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: 22, fontWeight: 700, color: "#fff" }}>Pulse</span>
          </div>
          <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: 11, color: "rgba(26,210,130,0.5)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 52 }}>
            Culture Health Check
          </p>
          <div style={{ position: "relative", width: "40%", maxWidth: 520, height: 44 }}>
           <canvas ref={barRef} width={520} height={88} style={{ width: "100%", height: 44, display: "block" }} />
          </div>
          <p id="loadlbl" style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: 9, letterSpacing: "0.25em", color: "rgba(26,210,130,0.4)", textTransform: "uppercase", textAlign: "center", marginTop: 10 }}>
            Loading your dashboard
          </p>
        </div>
      </div>
    </div>
  );
}