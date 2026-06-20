-- Gamification: streak freezes and co-op challenges.

CREATE TABLE IF NOT EXISTS user_streak_freezes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, log_date)
);

CREATE TABLE IF NOT EXISTS coop_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('hydration_5_of_7')),
  week_start DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'active', 'completed', 'expired', 'declined')
  ),
  invited_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (user_a_id < user_b_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS coop_challenges_pair_week_type_idx
  ON coop_challenges (user_a_id, user_b_id, challenge_type, week_start);

CREATE INDEX IF NOT EXISTS coop_challenges_user_a_status_idx
  ON coop_challenges (user_a_id, status);

CREATE INDEX IF NOT EXISTS coop_challenges_user_b_status_idx
  ON coop_challenges (user_b_id, status);
