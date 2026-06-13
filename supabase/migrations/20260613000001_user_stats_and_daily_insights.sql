-- Denormalized meal stats on users + cached daily AI insights
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS meals_logged INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS daily_insights (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  insight_date DATE NOT NULL,
  lifeplate_insight TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, insight_date)
);

UPDATE users u
SET meals_logged = stats.meal_count
FROM (
  SELECT m.user_id, COUNT(*)::integer AS meal_count
  FROM meals m
  GROUP BY m.user_id
) stats
WHERE u.id = stats.user_id;
