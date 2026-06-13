CREATE TABLE IF NOT EXISTS daily_hydration (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  glasses INTEGER NOT NULL DEFAULT 0 CHECK (glasses >= 0 AND glasses <= 24),
  PRIMARY KEY (user_id, log_date)
);
