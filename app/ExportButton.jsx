"use client";

import { useState, useRef, useEffect } from "react";

export default function ExportButton({ weeks, dashboardRef, weekOffset = 1 }) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function exportToPDF(weekLabel) {
    setOpen(false);
    setExporting(true);
    await new Promise(r => setTimeout(r, 100));

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const mainEl = dashboardRef.current;
      if (!mainEl) throw new Error("Dashboard ref not found");

      mainEl.scrollTop = 0;
      await new Promise(r => setTimeout(r, 200));

      // ── Zoom out so full width fits in viewport ──────────────
      const originalZoom = document.body.style.zoom;
      document.body.style.zoom = "0.75";
      await new Promise(r => setTimeout(r, 400));

      // Fix ResponsiveContainers AFTER zoom so sizes are correct
      const responsiveContainers = mainEl.querySelectorAll(".recharts-responsive-container");
      const originalStyles = [];
      responsiveContainers.forEach((el) => {
        originalStyles.push({ el, width: el.style.width, height: el.style.height });
        const rect = el.getBoundingClientRect();
        el.style.width  = `${rect.width}px`;
        el.style.height = `${rect.height}px`;
      });

      const rechartsWrappers = mainEl.querySelectorAll(".recharts-wrapper");
      const originalWrapperStyles = [];
      rechartsWrappers.forEach((el) => {
        originalWrapperStyles.push({ el, width: el.style.width, height: el.style.height });
        const rect = el.getBoundingClientRect();
        el.style.width  = `${rect.width}px`;
        el.style.height = `${rect.height}px`;
      });

      await new Promise(r => setTimeout(r, 150));

      const mainRect      = mainEl.getBoundingClientRect();
      const captureWidth  = Math.round(mainRect.width);
      const captureHeight = mainEl.scrollHeight;

      const canvas = await html2canvas(mainEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#f8fafc",
        width: captureWidth,
        height: captureHeight,
        scrollX: -mainRect.left,
        scrollY: 0,
        windowWidth: captureWidth,
        windowHeight: captureHeight,
        ignoreElements: (el) => el.classList?.contains("recharts-tooltip-wrapper"),
      });

      // ── Restore zoom and styles ──────────────────────────────
      document.body.style.zoom = originalZoom;
      originalStyles.forEach(({ el, width, height }) => {
        el.style.width = width;
        el.style.height = height;
      });
      originalWrapperStyles.forEach(({ el, width, height }) => {
        el.style.width = width;
        el.style.height = height;
      });

      // ── Build PDF ────────────────────────────────────────────
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidthMm  = pdf.internal.pageSize.getWidth();  // 297mm
      const pageHeightMm = pdf.internal.pageSize.getHeight(); // 210mm

      // Scale canvas to page width
      const scaleMmPerPx = pageWidthMm / canvas.width;

      // How many canvas pixels fit in one A4 page height (with small margin)
      const sliceHeightPx = Math.floor((pageHeightMm * 0.95) / scaleMmPerPx);

      let fromY   = 0;
      let isFirst = true;

      while (fromY < canvas.height) {
        const toY = Math.min(fromY + sliceHeightPx, canvas.height);

        const sliceCanvas    = document.createElement("canvas");
        sliceCanvas.width    = canvas.width;
        sliceCanvas.height   = toY - fromY;
        const ctx            = sliceCanvas.getContext("2d");
        ctx.drawImage(
          canvas,
          0, fromY, canvas.width, toY - fromY,
          0, 0,     canvas.width, toY - fromY
        );

        const sliceHeightMm = (toY - fromY) * scaleMmPerPx;

        if (!isFirst) pdf.addPage();
        pdf.addImage(
          sliceCanvas.toDataURL("image/png"),
          "PNG",
          0, 0,
          pageWidthMm, sliceHeightMm
        );

        isFirst = false;
        fromY   = toY;
      }

      pdf.setProperties({
        title: `PULSE Dashboard — ${weekLabel}`,
        subject: "Intern Team Health Report",
        creator: "PULSE",
      });

      const weekIndex = weeks.indexOf(weekLabel);
      const filename = weekLabel === "All weeks"
        ? "PULSE_Dashboard_All_Weeks.pdf"
        : `PULSE_Dashboard_Week_${weekIndex + weekOffset}.pdf`;

      pdf.save(filename);

    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>

      {/* Export button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        disabled={exporting}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          fontWeight: 500,
          padding: "8px 16px",
          border: "none",
          borderRadius: 8,
          background: exporting ? "#86efac" : "#16a34a",
          color: "#fff",
          cursor: exporting ? "not-allowed" : "pointer",
          transition: "background 0.15s",
          whiteSpace: "nowrap",
        }}
      >
        {exporting ? (
          <><span style={{ fontSize: 13 }}>⏳</span> Exporting…</>
        ) : (
          <><span style={{ fontSize: 13 }}>⬇</span> Export <span style={{ fontSize: 10, marginLeft: 2 }}>▾</span></>
        )}
      </button>

      {/* Dropdown */}
      {open && !exporting && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          right: 0,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          minWidth: 180,
          zIndex: 1000,
          overflow: "hidden",
        }}>

          {/* Header */}
          <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid #f1f5f9" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.06em", margin: 0, textTransform: "uppercase" }}>
              Export as PDF
            </p>
          </div>

          {/* All weeks */}
          <button
            onClick={() => exportToPDF("All weeks")}
            style={itemStyle()}
            onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <span style={{ fontSize: 14 }}>📅</span>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#0f172a" }}>All weeks</p>
              <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>Full dashboard view</p>
            </div>
          </button>

          {/* By week label */}
          {weeks.length > 0 && (
            <div style={{ padding: "6px 14px 4px" }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: "#cbd5e1", letterSpacing: "0.06em", margin: 0, textTransform: "uppercase" }}>
                By week
              </p>
            </div>
          )}

          {/* Individual weeks */}
          {weeks.map((week, i) => (
            <button
              key={week}
              onClick={() => exportToPDF(week)}
              style={itemStyle()}
              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: 14 }}>🗓</span>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#0f172a" }}>Week {i + weekOffset}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{week}</p>
              </div>
            </button>
          ))}

        </div>
      )}
    </div>
  );
}

function itemStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "9px 14px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
    transition: "background 0.1s",
  };
}