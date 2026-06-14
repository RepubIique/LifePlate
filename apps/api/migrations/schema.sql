-- LifePlate canonical schema (starting point).
-- Idempotent: safe on fresh databases and on DBs that ran the old numbered migrations.

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

-- ---------------------------------------------------------------------------
-- Meals & analysis
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_type TEXT,
  meal_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS meals_user_created_idx ON meals(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS meal_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL UNIQUE REFERENCES meals(id) ON DELETE CASCADE,
  calories INTEGER,
  protein INTEGER,
  carbs INTEGER,
  fat INTEGER,
  fibre INTEGER,
  sugar INTEGER,
  sodium INTEGER,
  confidence DECIMAL(4, 3),
  raw_ai_response JSONB
);

ALTER TABLE meal_analysis ADD COLUMN IF NOT EXISTS fibre INTEGER;
ALTER TABLE meal_analysis ADD COLUMN IF NOT EXISTS sugar INTEGER;
ALTER TABLE meal_analysis ADD COLUMN IF NOT EXISTS sodium INTEGER;

CREATE TABLE IF NOT EXISTS foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS foods_meal_idx ON foods(meal_id);

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

UPDATE users u
SET meals_logged = stats.meal_count
FROM (
  SELECT m.user_id, COUNT(*)::integer AS meal_count
  FROM meals m
  GROUP BY m.user_id
) stats
WHERE u.id = stats.user_id
  AND u.meals_logged IS DISTINCT FROM stats.meal_count;
