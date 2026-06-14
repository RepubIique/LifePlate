CREATE TABLE IF NOT EXISTS alpha_feedback_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  message TEXT NOT NULL CHECK (char_length(trim(message)) > 0 AND char_length(message) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alpha_feedback_messages_created_at
  ON alpha_feedback_messages (created_at DESC);
