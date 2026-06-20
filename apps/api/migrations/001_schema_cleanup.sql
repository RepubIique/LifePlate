-- Merge AI audit onto meals, drop meal_analysis, remove draft BYTEA storage.

ALTER TABLE meals ADD COLUMN IF NOT EXISTS raw_ai_response JSONB;

UPDATE meals m
SET raw_ai_response = a.raw_ai_response
FROM meal_analysis a
WHERE a.meal_id = m.id
  AND m.raw_ai_response IS NULL;

DROP TABLE IF EXISTS meal_analysis;

ALTER TABLE meal_drafts DROP COLUMN IF EXISTS image_data;
