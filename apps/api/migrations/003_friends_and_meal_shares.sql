-- Friend codes, friendships, and meal share requests.

ALTER TABLE users ADD COLUMN IF NOT EXISTS friend_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_friend_code_unique
  ON users (friend_code)
  WHERE friend_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS friendships (
  user_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_a_id, user_b_id),
  CHECK (user_a_id < user_b_id)
);

CREATE INDEX IF NOT EXISTS friendships_user_a_idx ON friendships (user_a_id);
CREATE INDEX IF NOT EXISTS friendships_user_b_idx ON friendships (user_b_id);

ALTER TABLE meals ADD COLUMN IF NOT EXISTS shared_from_meal_id UUID REFERENCES meals(id) ON DELETE SET NULL;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS shared_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS meal_share_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_meal_id UUID REFERENCES meals(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  meal_type TEXT,
  meal_name TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  log_date DATE NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL,
  calories INTEGER,
  protein INTEGER,
  carbs INTEGER,
  fat INTEGER,
  fibre INTEGER,
  sugar INTEGER,
  sodium INTEGER,
  confidence DECIMAL(4, 3),
  foods TEXT[] NOT NULL DEFAULT '{}',
  raw_ai_response JSONB,
  portion_meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS meal_share_requests_to_user_status_idx
  ON meal_share_requests (to_user_id, status);

CREATE INDEX IF NOT EXISTS meal_share_requests_from_user_idx
  ON meal_share_requests (from_user_id);
