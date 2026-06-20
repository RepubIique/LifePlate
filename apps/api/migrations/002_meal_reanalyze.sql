-- Track per-meal AI re-analyse usage on the edit screen (max 2 per meal).

ALTER TABLE meals ADD COLUMN IF NOT EXISTS reanalyze_count INTEGER NOT NULL DEFAULT 0;
