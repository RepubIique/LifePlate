-- Explicit home cooked vs takeaway tagging for meals.

ALTER TABLE meals
  ADD COLUMN IF NOT EXISTS meal_source TEXT
  CHECK (meal_source IS NULL OR meal_source IN ('home_cooked', 'takeaway'));
