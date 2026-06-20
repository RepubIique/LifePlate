-- Speed up per-day meal lookups (reorder, day-scoped queries).
CREATE INDEX IF NOT EXISTS meals_user_utc_day_idx
  ON meals (user_id, (to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')));
