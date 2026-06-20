import assert from "node:assert/strict";
import test from "node:test";
import {
  MEAL_LOG_DATE_COLUMN_SQL,
  MEAL_LOG_DATE_KEY_COLUMN_SQL,
  MEAL_LOG_DATE_KEY_SQL,
  MEAL_LOG_DATE_SQL,
} from "../dist/services/mealLogDate.js";

test("mealLogDate constants reference log_date column", () => {
  assert.equal(MEAL_LOG_DATE_SQL, "log_date");
  assert.equal(MEAL_LOG_DATE_COLUMN_SQL, "m.log_date");
  assert.equal(MEAL_LOG_DATE_KEY_SQL, "log_date::text");
  assert.equal(MEAL_LOG_DATE_KEY_COLUMN_SQL, "m.log_date::text");
});
