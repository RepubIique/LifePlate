-- LifePlate canonical schema (baseline).
-- Fresh databases: this file runs once (tracked as version "baseline").
-- Schema changes after this: add numbered files 001_*.sql, 002_*.sql, …

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  goal TEXT,
  weight_kg DECIMAL(5, 2),
  height_cm DECIMAL(5, 1),
  age INTEGER,
  gender TEXT,
  avatar_url TEXT,
  meals_logged INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  cloud_image_backup BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5, 1);
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS meals_logged INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cloud_image_backup BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- Meals
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_type TEXT,
  meal_name TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE meals ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS log_date DATE;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS sort_index SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS calories INTEGER;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS protein INTEGER;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS carbs INTEGER;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS fat INTEGER;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS fibre INTEGER;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS sugar INTEGER;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS sodium INTEGER;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS confidence DECIMAL(4, 3);
ALTER TABLE meals ADD COLUMN IF NOT EXISTS foods TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE meals ALTER COLUMN image_url DROP NOT NULL;
ALTER TABLE meals ALTER COLUMN image_url SET DEFAULT '';

CREATE INDEX IF NOT EXISTS meals_user_created_idx ON meals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS meals_user_log_date_sort_idx
  ON meals (user_id, log_date DESC, sort_index ASC);
CREATE INDEX IF NOT EXISTS meals_user_log_date_idx ON meals (user_id, log_date);

-- ---------------------------------------------------------------------------
-- Meal AI audit (macros and foods live on meals)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS meal_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL UNIQUE REFERENCES meals(id) ON DELETE CASCADE,
  raw_ai_response JSONB
);

-- Legacy cleanup (safe on fresh DBs and after old migrations)
ALTER TABLE meal_analysis DROP COLUMN IF EXISTS calories;
ALTER TABLE meal_analysis DROP COLUMN IF EXISTS protein;
ALTER TABLE meal_analysis DROP COLUMN IF EXISTS carbs;
ALTER TABLE meal_analysis DROP COLUMN IF EXISTS fat;
ALTER TABLE meal_analysis DROP COLUMN IF EXISTS fibre;
ALTER TABLE meal_analysis DROP COLUMN IF EXISTS sugar;
ALTER TABLE meal_analysis DROP COLUMN IF EXISTS sodium;
ALTER TABLE meal_analysis DROP COLUMN IF EXISTS confidence;

DROP INDEX IF EXISTS meals_user_utc_day_idx;

-- ---------------------------------------------------------------------------
-- Meal drafts (pre-confirm upload buffer)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS meal_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL DEFAULT '',
  image_data BYTEA,
  mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
  analysis JSONB NOT NULL,
  raw_ai_response JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS meal_drafts_user_expires_idx
  ON meal_drafts(user_id, expires_at DESC);

CREATE INDEX IF NOT EXISTS meal_drafts_expires_idx
  ON meal_drafts(expires_at);

-- ---------------------------------------------------------------------------
-- Hydration & insights
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS daily_hydration (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  glasses INTEGER NOT NULL DEFAULT 0 CHECK (glasses >= 0 AND glasses <= 24),
  PRIMARY KEY (user_id, log_date)
);

CREATE TABLE IF NOT EXISTS daily_insights (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  insight_date DATE NOT NULL,
  lifeplate_insight TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, insight_date)
);

-- ---------------------------------------------------------------------------
-- Rate limits
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS upload_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS upload_attempts_user_created_idx
  ON upload_attempts(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS refine_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS refine_attempts_user_created_idx
  ON refine_attempts(user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Alpha feedback
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS alpha_feedback_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  message TEXT NOT NULL CHECK (char_length(trim(message)) > 0 AND char_length(message) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alpha_feedback_messages_created_at
  ON alpha_feedback_messages (created_at DESC);

-- ---------------------------------------------------------------------------
-- Backfills (safe to re-run)
-- ---------------------------------------------------------------------------

UPDATE meals
SET log_date = (created_at AT TIME ZONE 'UTC')::date
WHERE log_date IS NULL;

WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, log_date
           ORDER BY created_at DESC
         ) - 1 AS idx
  FROM meals
  WHERE log_date IS NOT NULL
)
UPDATE meals m
SET sort_index = ranked.idx
FROM ranked
WHERE m.id = ranked.id;

UPDATE meals m
SET calories = COALESCE(m.calories, a.calories),
    protein = COALESCE(m.protein, a.protein),
    carbs = COALESCE(m.carbs, a.carbs),
    fat = COALESCE(m.fat, a.fat),
    fibre = COALESCE(m.fibre, a.fibre),
    sugar = COALESCE(m.sugar, a.sugar),
    sodium = COALESCE(m.sodium, a.sodium),
    confidence = COALESCE(m.confidence, a.confidence)
FROM meal_analysis a
WHERE a.meal_id = m.id;

DO $$
BEGIN
  IF to_regclass('public.foods') IS NOT NULL THEN
    UPDATE meals m
    SET foods = COALESCE(agg.food_names, '{}')
    FROM (
      SELECT meal_id, array_agg(food_name ORDER BY food_name) AS food_names
      FROM foods
      GROUP BY meal_id
    ) agg
    WHERE m.id = agg.meal_id
      AND cardinality(m.foods) = 0;
  END IF;
END $$;

DROP TABLE IF EXISTS foods;

ALTER TABLE meals ALTER COLUMN log_date SET NOT NULL;

UPDATE meals
SET image_url = ''
WHERE image_url LIKE 'data:%'
   OR image_url LIKE '%data:image%'
   OR image_url LIKE '%data%3Aimage%';

UPDATE users u
SET meals_logged = stats.meal_count
FROM (
  SELECT m.user_id, COUNT(*)::integer AS meal_count
  FROM meals m
  GROUP BY m.user_id
) stats
WHERE u.id = stats.user_id
  AND u.meals_logged IS DISTINCT FROM stats.meal_count;
