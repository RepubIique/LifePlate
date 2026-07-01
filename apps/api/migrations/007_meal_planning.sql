-- Planned vs logged meals for future meal planning ("pencil logging").
ALTER TABLE meals
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'logged'
    CHECK (status IN ('logged', 'planned'));

CREATE INDEX IF NOT EXISTS idx_meals_user_plan_date
  ON meals (user_id, log_date)
  WHERE status = 'planned';
