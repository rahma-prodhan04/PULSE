# 🚀 PULSE — Predictive Team Health & Performance Platform

**PULSE** is a full-stack web application that leverages psychological performance theory (Yerkes-Dodson Law) to provide actionable intelligence on team wellbeing and productivity. Built with modern web technologies and data-driven design principles.

## 🎯 The Problem We Solve

Team burnout and underperformance are silent productivity killers. PULSE transforms subjective team management into data-driven decision-making by:
- **Identifying risk zones early** before team performance degrades
- **Quantifying team health** across 5 key dimensions of wellbeing
- **Providing actionable insights** through scientific performance models
- **Automating health calculations** at scale with PostgreSQL triggers

## ✨ Key Features

### Real-Time Analytics Dashboard
- Multi-dimensional team health visualization with **Yerkes-Dodson curve** analysis
- Color-coded risk stratification: **Optimal** (green) → **Caution** (amber) → **Risk** (red)
- Real-time aggregation of weekly survey responses

### Historical Trend Analysis
- Track team health progression over time with interactive charts
- Identify seasonal patterns and improvement trajectories
- Compare performance across multiple teams

### Enterprise-Grade Features
- **Multi-team management** from single unified interface
- **PDF report generation** with custom styling for stakeholder communication
- **Responsive design** optimized for desktop and mobile
- **Database-level computation** with PostgreSQL triggers for scalability

## 🛠️ Modern Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| **Visualization** | Recharts (D3-powered charts), SVG-based rendering |
| **Backend/Database** | Supabase (PostgreSQL with RLS, triggers, indexes) |
| **Export/Reporting** | html2canvas, jsPDF (client-side PDF generation) |
| **Code Quality** | ESLint, TypeScript strict mode |

### Architectural Highlights
- **Server-side rendering** with Next.js for optimal performance
- **Database-level computation** using PostgreSQL triggers for accurate health index calculations
- **Type-safe development** with full TypeScript coverage
- **Responsive design** with Tailwind CSS v4 for desktop/mobile parity
- **Client-side PDF export** eliminating server overhead

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account ([create one free](https://supabase.com))

### Setup (5 minutes)

```bash
# 1. Clone and install
git clone <repo-url> && cd PULSE
npm install

# 2. Create .env.local with Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# 3. Initialize database (run in Supabase SQL Editor)
# Copy entire content of supabase/schema.sql

# 4. Seed teams table with your team names

# 5. Launch development server
npm run dev
# Navigate to http://localhost:3000
```

## 📁 Project Architecture

```
app/                        # Next.js App Router pages
├── page.jsx               # 📊 Main dashboard (Yerkes-Dodson visualization)
├── ExportButton.jsx       # 📄 PDF generation with html2canvas
├── LoadingAnimation.jsx   # ⏳ Custom loading states
├── layout.tsx             # 🎨 Root layout + styling
├── teams/                 # Team management & multi-tenant support
├── timeline/              # 📈 Historical trend analysis
└── week/[week]/           # 📅 Weekly detail drill-down

lib/
└── supabase.js            # 🔐 Supabase client initialization

supabase/
└── schema.sql             # 🗄️ Full database schema with triggers & indexes
```

## 🗄️ Intelligent Data Model

### Three-Table Architecture with Automatic Aggregation

```sql
teams                    -- Team metadata
└─> survey_responses     -- Individual submissions (5 dimensions: 1-10 scale)
    └─> team_health_index -- Auto-aggregated weekly metrics (PostgreSQL trigger)
```

**Why this design?**
- **Normalization** prevents data redundancy
- **PostgreSQL triggers** auto-calculate health indices on insert (no N+1 queries)
- **Indexed queries** enable fast weekly/team filtering (`idx_responses_week_start`, `idx_responses_team_id`)
- **Scalable** handles thousands of team members and years of historical data efficiently

### Key Calculations (Database-Level)
- **Individual Health Index** = Average of 5 survey dimensions
- **Team Health Index** = Average of all team members' individual indices
- **Week Derivation** = Auto-calculated from submission timestamp

**Result:** Queries return pre-aggregated metrics without application-level computation.

## 📦 Available Scripts

```bash
npm run dev      # Development server with hot-reload (port 3000)
npm run build    # Optimized production build
npm start        # Production server
npm run lint     # ESLint analysis
```

## 🧠 The Science: Yerkes-Dodson Curve

PULSE implements the **Yerkes-Dodson Law** — a psychological principle showing optimal performance occurs at moderate arousal levels:

| Zone | Range | Status | Recommendation |
|------|-------|--------|-----------------|
| **Optimal** | 4.0 – 6.0 | ✅ Peak Performance | Maintain current pace |
| **Caution** | 2.0 – 4.0 or 6.0 – 8.0 | ⚠️ Stress/Boredom | Monitor closely; intervention may help |
| **Risk** | < 2.0 or > 8.0 | 🚨 Burnout/Disengagement | Immediate action required |

**Data Visualization:** The iconic Yerkes-Dodson curve is rendered dynamically on the dashboard based on real team metrics.

## 💡 Technical Insights & Future Enhancements

### Current Capabilities
✅ Real-time multi-team health monitoring  
✅ Automated metric calculation at database layer  
✅ Historical trend analysis and pattern detection  
✅ PDF report generation for stakeholder communication  

### Potential Roadmap
- **Predictive analytics** using time-series forecasting (TensorFlow.js)
- **Anomaly detection** to flag unusual team dynamics
- **Integration with Slack/Teams** for real-time notifications
- **Custom alert thresholds** per team
- **Role-based access control** (RBAC) with Supabase RLS policies
- **Export to BI tools** (Tableau, Power BI) via API

## 🤝 Contributing

PULSE is actively developed. Contributions welcome!

- **Bug reports:** Open an issue with reproduction steps
- **Feature requests:** Discuss in issues before submitting PRs
- **Code contributions:** Follow existing patterns, add tests where applicable

## 📄 License

MIT License — see LICENSE file for details

## 📞 Questions & Feedback

Have questions about the codebase, architecture, or implementation? Open an issue or reach out!

---

**Built with ❤️ to bring data-driven insights to team management**
