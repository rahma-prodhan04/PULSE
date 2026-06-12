-- ============================================================
-- PULSE — Supabase Database Setup
-- Run this entire file in Supabase > SQL Editor > New query
-- ============================================================


-- ============================================================
-- 1. TEAMS
--    One row per intern team. Seed with your 11 team names
--    after running this file.
-- ============================================================

CREATE TABLE teams (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,   
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- 2. SURVEY RESPONSES
--    One row per individual submission from Google Forms.
--    individual_health_index is calculated and stored on insert
--    via the trigger below — you never set it manually.
-- ============================================================

CREATE TABLE survey_responses (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id                  uuid NOT NULL REFERENCES teams(id),

  -- Exact timestamp from Google Forms submission
  submitted_at             timestamptz NOT NULL DEFAULT now(),

  -- Monday of the submission week — derived automatically by trigger
  week_start               date NOT NULL,

  -- The 5 survey questions (1–10)
  q1_workload              smallint NOT NULL CHECK (q1_workload  BETWEEN 1 AND 10),
  q2_energy                smallint NOT NULL CHECK (q2_energy    BETWEEN 1 AND 10),
  q3_recovery              smallint NOT NULL CHECK (q3_recovery  BETWEEN 1 AND 10),
  q4_motivation            smallint NOT NULL CHECK (q4_motivation BETWEEN 1 AND 10),
  q5_social                smallint NOT NULL CHECK (q5_social    BETWEEN 1 AND 10),

  -- Average of the 5 questions — set by trigger, do not insert manually
  individual_health_index  numeric(4,2)
);

-- Index for fast weekly queries
CREATE INDEX idx_responses_week_start ON survey_responses(week_start);
CREATE INDEX idx_responses_team_id    ON survey_responses(team_id);


-- ============================================================
-- TRIGGER: auto-fill week_start and individual_health_index
--          before each insert into survey_responses
-- ============================================================

CREATE OR REPLACE FUNCTION fn_set_response_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Derive Monday of the submission week
  NEW.week_start := date_trunc('week', NEW.submitted_at)::date;

  -- Calculate Individual Health Index (avg of 5 questions)
  NEW.individual_health_index :=
    ROUND(
      (NEW.q1_workload + NEW.q2_energy + NEW.q3_recovery +
       NEW.q4_motivation + NEW.q5_social)::numeric / 5,
    2);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_response_defaults
BEFORE INSERT ON survey_responses
FOR EACH ROW EXECUTE FUNCTION fn_set_response_defaults();


-- ============================================================
-- 3. TEAM HEALTH INDEX
--    One row per team per week — the aggregated view used by
--    both the Yerkes-Dodson snapshot and Growth-over-time chart.
--    Populated automatically by the trigger below whenever a
--    new survey_response is inserted.
-- ============================================================

CREATE TABLE team_health_index (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id             uuid NOT NULL REFERENCES teams(id),
  week_start          date NOT NULL,

  -- How many individuals submitted for this team this week
  response_count      smallint NOT NULL DEFAULT 0,

  -- Average of all individual_health_index values for this team + week
  team_health_index   numeric(4,2),

  -- Growth proxy — same value as team_health_index for now
  -- Update this formula later when your growth model evolves
  growth_score        numeric(4,2),

  -- Per-dimension averages (used by the dimension breakdown view)
  avg_workload        numeric(4,2),
  avg_energy          numeric(4,2),
  avg_recovery        numeric(4,2),
  avg_motivation      numeric(4,2),
  avg_social          numeric(4,2),

  calculated_at       timestamptz NOT NULL DEFAULT now(),

  -- Enforce one row per team per week
  UNIQUE (team_id, week_start)
);

-- Index for fast weekly and time-series queries
CREATE INDEX idx_thi_week_start ON team_health_index(week_start);
CREATE INDEX idx_thi_team_id    ON team_health_index(team_id);


-- ============================================================
-- TRIGGER: recalculate team_health_index after every new
--          survey_response insert (upserts the aggregate row)
-- ============================================================

CREATE OR REPLACE FUNCTION fn_upsert_team_health_index()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO team_health_index (
    team_id,
    week_start,
    response_count,
    team_health_index,
    growth_score,
    avg_workload,
    avg_energy,
    avg_recovery,
    avg_motivation,
    avg_social,
    calculated_at
  )
  SELECT
    NEW.team_id,
    NEW.week_start,
    COUNT(*)                                    AS response_count,
    ROUND(AVG(individual_health_index), 2)      AS team_health_index,
    ROUND(AVG(individual_health_index), 2)      AS growth_score,
    ROUND(AVG(q1_workload::numeric), 2)         AS avg_workload,
    ROUND(AVG(q2_energy::numeric), 2)           AS avg_energy,
    ROUND(AVG(q3_recovery::numeric), 2)         AS avg_recovery,
    ROUND(AVG(q4_motivation::numeric), 2)       AS avg_motivation,
    ROUND(AVG(q5_social::numeric), 2)           AS avg_social,
    now()                                       AS calculated_at
  FROM survey_responses
  WHERE team_id  = NEW.team_id
    AND week_start = NEW.week_start

  -- If a row for this team + week already exists, update it in place
  ON CONFLICT (team_id, week_start) DO UPDATE SET
    response_count    = EXCLUDED.response_count,
    team_health_index = EXCLUDED.team_health_index,
    growth_score      = EXCLUDED.growth_score,
    avg_workload      = EXCLUDED.avg_workload,
    avg_energy        = EXCLUDED.avg_energy,
    avg_recovery      = EXCLUDED.avg_recovery,
    avg_motivation    = EXCLUDED.avg_motivation,
    avg_social        = EXCLUDED.avg_social,
    calculated_at     = EXCLUDED.calculated_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_upsert_team_health_index
AFTER INSERT ON survey_responses
FOR EACH ROW EXECUTE FUNCTION fn_upsert_team_health_index();


-- ============================================================
-- 4. SEED: Insert your 11 teams
--    Replace the names below with your actual team names.
--    After inserting, note the UUIDs — you'll need them
--    when mapping Google Form team name responses to team_id.
-- ============================================================

INSERT INTO teams (name) VALUES
  ('WHC'),
  ('Claroe'),
  ('Tweed S'),
  ('RNSH1'),
  ('RNSH2'),
  ('Rockfield'),
  ('NSWRA'),
  ('DCPM'),
  ('Sailability'),
  ('IPWEA'),
  ('Sensear');


-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
--    Required because you enabled RLS on your Supabase project.
--    These policies use the anon key, which is safe for your
--    use case because:
--      - survey_responses has no personally identifiable data
--      - supervisors access the dashboard from a known app
--    When you add supervisor login later, tighten these policies
--    to require authentication.
-- ============================================================

-- TEAMS: supervisors and Apps Script need to read team names
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow anon read teams"
  ON teams FOR SELECT
  TO anon
  USING (true);

-- SURVEY RESPONSES: Apps Script inserts rows, dashboard reads them
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow anon insert survey_responses"
  ON survey_responses FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "allow anon read survey_responses"
  ON survey_responses FOR SELECT
  TO anon
  USING (true);

-- TEAM HEALTH INDEX: triggers write it, dashboard reads it
-- Triggers run as the postgres role (bypasses RLS) so only
-- a read policy is needed here for the anon/dashboard role
ALTER TABLE team_health_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow anon read team_health_index"
  ON team_health_index FOR SELECT
  TO anon
  USING (true);


-- ============================================================
-- 6. HELPER QUERY: dimension breakdown by team for a given week
--    Use this in your Next.js API route for the breakdown view.
--    Replace the date with the week you want to display.
-- ============================================================

-- SELECT
--   t.name                      AS team,
--   thi.avg_workload             AS workload,
--   thi.avg_energy               AS energy,
--   thi.avg_recovery             AS recovery,
--   thi.avg_motivation           AS motivation,
--   thi.avg_social               AS social,
--   thi.team_health_index        AS overall,
--   thi.response_count
-- FROM team_health_index thi
-- JOIN teams t ON t.id = thi.team_id
-- WHERE thi.week_start = '2025-01-20'   -- change to your target week
-- ORDER BY t.name;


-- ============================================================
-- 7. HELPER QUERY: growth over time for all teams
--    Use this in your Next.js API route for the growth chart.
-- ============================================================

-- SELECT
--   t.name                  AS team,
--   thi.week_start,
--   thi.growth_score,
--   thi.team_health_index,
--   thi.response_count
-- FROM team_health_index thi
-- JOIN teams t ON t.id = thi.team_id
-- ORDER BY thi.week_start, t.name;