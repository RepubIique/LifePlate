-- Scale: explicit calendar day + within-day order; denormalized list fields on meals.

ALTER TABLE meals ADD COLUMN IF NOT EXISTS log_date DATE;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS sort_index SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE meals ADD COLUMN IF NOT EXISTS calories INTEGER;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS protein INTEGER;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS carbs INTEGER;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS fat INTEGER;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS fibre INTEGER;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS sugar INTEGER;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS sodium INTEGER;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS confidence DECIMAL(4, 3);
ALTER TABLE meals ADD COLUMN IF NOT EXISTS foods TEXT[] NOT NULL DEFAULT '{}';

UPDATE meals
SET log_date = (created_at AT TIME ZONE 'UTC')::date
WHERE log_date IS NULL;

WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, log_date
           ORDER BY created_at DESC
         ) - 1 AS idx
  FROM meals
  WHERE log_date IS NOT NULL
)
UPDATE meals m
SET sort_index = ranked.idx
FROM ranked
WHERE m.id = ranked.id;

UPDATE meals m
SET calories = a.calories,
    protein = a.protein,
    carbs = a.carbs,
    fat = a.fat,
    fibre = a.fibre,
    sugar = a.sugar,
    sodium = a.sodium,
    confidence = a.confidence
FROM meal_analysis a
WHERE a.meal_id = m.id
  AND m.calories IS NULL;

DO $$
BEGIN
  IF to_regclass('public.foods') IS NOT NULL THEN
    UPDATE meals m
    SET foods = COALESCE(agg.food_names, '{}')
    FROM (
      SELECT meal_id, array_agg(food_name ORDER BY food_name) AS food_names
      FROM foods
      GROUP BY meal_id
    ) agg
    WHERE m.id = agg.meal_id
      AND cardinality(m.foods) = 0;
  END IF;
END $$;

ALTER TABLE meals ALTER COLUMN log_date SET NOT NULL;

CREATE INDEX IF NOT EXISTS meals_user_log_date_sort_idx
  ON meals (user_id, log_date DESC, sort_index ASC);

CREATE INDEX IF NOT EXISTS meals_user_log_date_idx
  ON meals (user_id, log_date);
