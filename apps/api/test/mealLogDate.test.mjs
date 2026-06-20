import assert from "node:assert/strict";
import test from "node:test";
import {
  MEAL_LOG_DATE_COLUMN_SQL,
  MEAL_LOG_DATE_KEY_COLUMN_SQL,
  MEAL_LOG_DATE_KEY_SQL,
  MEAL_LOG_DATE_SQL,
  MEAL_UTC_DAY_DATE_COLUMN_SQL,
  MEAL_UTC_DAY_DATE_SQL,
  MEAL_UTC_DAY_COLUMN_SQL,
  MEAL_UTC_DAY_SQL,
  UTC_TODAY_DATE_SQL,
  UTC_TODAY_SQL,
} from "../dist/services/mealLogDate.js";

test("mealLogDate constants reference log_date column", () => {
  assert.equal(MEAL_LOG_DATE_SQL, "log_date");
  assert.equal(MEAL_LOG_DATE_COLUMN_SQL, "m.log_date");
  assert.equal(MEAL_LOG_DATE_KEY_SQL, "log_date::text");
  assert.equal(MEAL_LOG_DATE_KEY_COLUMN_SQL, "m.log_date::text");
});

test("legacy UTC day aliases map to log_date", () => {
  assert.equal(MEAL_UTC_DAY_DATE_SQL, MEAL_LOG_DATE_SQL);
  assert.equal(MEAL_UTC_DAY_DATE_COLUMN_SQL, MEAL_LOG_DATE_COLUMN_SQL);
  assert.equal(MEAL_UTC_DAY_SQL, MEAL_LOG_DATE_KEY_SQL);
  assert.equal(MEAL_UTC_DAY_COLUMN_SQL, MEAL_LOG_DATE_KEY_COLUMN_SQL);
});

test("UTC today helpers remain available", () => {
  assert.equal(UTC_TODAY_DATE_SQL, `(NOW() AT TIME ZONE 'UTC')::date`);
  assert.equal(UTC_TODAY_SQL, `${UTC_TODAY_DATE_SQL}::text`);
});
