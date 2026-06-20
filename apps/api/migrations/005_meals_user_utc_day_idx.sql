-- Speed up per-day meal lookups (reorder, day-scoped queries).
-- Use ::date (immutable) — to_char() is not allowed in index expressions.
CREATE INDEX IF NOT EXISTS meals_user_utc_day_idx
  ON meals (user_id, ((created_at AT TIME ZONE 'UTC')::date));
