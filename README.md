# Pulse

> A cohort wellness dashboard for intern program managers, built on the Yerkes-Dodson performance-arousal framework.

Pulse turns anonymous weekly check-ins into a live signal of whether your intern cohort is in flow, burning out, or coasting under-stimulated. It tracks 5 wellness dimensions — workload, energy, recovery, motivation and social connection — and visualises where each team sits on the Yerkes-Dodson curve, helping managers spot patterns before they become problems.

The privacy model is intentional. Interns submit anonymously with only their team recorded — no names, no individual tracking. That shifts the tool from performance monitoring to program stewardship.

---

## The science

Pulse is built on the **Yerkes-Dodson Law** — a psychological principle showing that performance peaks at moderate arousal levels, not maximum effort.

| Zone | Arousal Range | Status | What it means |
|------|---------------|--------|---------------|
| Optimal | 4.0 – 6.0 | ✅ | Team is in flow — maintain current pace |
| Caution | 2–4 or 6–8 | ⚠️ | Under or over-stimulated — monitor closely |
| Risk | < 2.0 or > 8.0 | 🚨 | Burnout or disengagement — act now |

Each team's arousal score is calculated from their weekly survey responses and plotted on the curve in real time.

---

## Tech stack

| Layer | Tool |
|-------|------|
| Frontend | Next.js + Recharts |
| Backend/Database | Supabase (PostgreSQL) |
| Survey | Google Forms + Apps Script |
| Export | html2canvas + jsPDF |
| Hosting | Vercel (frontend) |

---

## Architecture

Three-table design with automatic aggregation:

```
teams                    — team metadata
└─> survey_responses     — individual weekly submissions (5 dimensions, 1–10 scale)
    └─> team_health_index — auto-aggregated weekly metrics via PostgreSQL trigger
```

PostgreSQL triggers calculate the team health index automatically on every insert — no application-level aggregation needed. Indexed queries on `week_start` and `team_id` keep the dashboard fast as data grows.

---

## Project structure

```
app/
  page.jsx               — main dashboard (Yerkes-Dodson visualisation)
  teams/                 — team health comparison table
  timeline/              — team score trajectories over time
  week/[week]/           — weekly drill-down view
  ExportButton.jsx       — PDF export component
  LoadingAnimation.jsx   — ECG loading screen
lib/
  supabase.js            — Supabase client
supabase/
  schema.sql             — full database schema with triggers and indexes
```

---

## Getting started

**Prerequisites:** Node.js 18+, Supabase account

```bash
# 1. Clone and install
git clone <repo-url>
cd pulse
npm install

# 2. Create .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# 3. Run schema in Supabase SQL Editor
# Copy contents of supabase/schema.sql

# 4. Seed your teams table with team names

# 5. Start dev server
npm run dev
# Open http://localhost:3000
```

---

## Status

Actively in development. Core dashboard, weekly views, team comparison, timeline and PDF export are functional. AI-powered insights panel coming soon.
