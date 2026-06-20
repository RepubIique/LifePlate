-- Final cutover: meals is the source of truth for macros/foods/order.
-- meal_analysis keeps only AI audit data; foods child table is removed.

UPDATE meals m
SET calories = COALESCE(m.calories, a.calories),
    protein = COALESCE(m.protein, a.protein),
    carbs = COALESCE(m.carbs, a.carbs),
    fat = COALESCE(m.fat, a.fat),
    fibre = COALESCE(m.fibre, a.fibre),
    sugar = COALESCE(m.sugar, a.sugar),
    sodium = COALESCE(m.sodium, a.sodium),
    confidence = COALESCE(m.confidence, a.confidence)
FROM meal_analysis a
WHERE a.meal_id = m.id;

DO $$
BEGIN
  IF to_regclass('public.foods') IS NOT NULL THEN
    UPDATE meals m
    SET foods = agg.food_names
    FROM (
      SELECT meal_id, array_agg(food_name ORDER BY food_name) AS food_names
      FROM foods
      GROUP BY meal_id
    ) agg
    WHERE m.id = agg.meal_id
      AND cardinality(m.foods) = 0;
  END IF;
END $$;

DROP TABLE IF EXISTS foods;

ALTER TABLE meal_analysis DROP COLUMN IF EXISTS calories;
ALTER TABLE meal_analysis DROP COLUMN IF EXISTS protein;
ALTER TABLE meal_analysis DROP COLUMN IF EXISTS carbs;
ALTER TABLE meal_analysis DROP COLUMN IF EXISTS fat;
ALTER TABLE meal_analysis DROP COLUMN IF EXISTS fibre;
ALTER TABLE meal_analysis DROP COLUMN IF EXISTS sugar;
ALTER TABLE meal_analysis DROP COLUMN IF EXISTS sodium;
ALTER TABLE meal_analysis DROP COLUMN IF EXISTS confidence;

DROP INDEX IF EXISTS meals_user_utc_day_idx;
