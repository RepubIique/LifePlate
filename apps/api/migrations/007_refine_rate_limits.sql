CREATE TABLE IF NOT EXISTS refine_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS refine_attempts_user_created_idx
  ON refine_attempts(user_id, created_at DESC);
