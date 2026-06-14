-- Meal upload drafts (survive API restarts; TTL enforced in application code).
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
