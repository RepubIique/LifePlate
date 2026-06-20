import assert from "node:assert/strict";
import test from "node:test";
import {
  reorderMealsForDay,
  ReorderMealsValidationError,
} from "../dist/services/mealReorder.js";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const MEAL_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const MEAL_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const MEAL_C = "cccccccc-cccc-cccc-cccc-cccccccccccc";

function createMockClient(rows) {
  const queries = [];
  return {
    queries,
    async query(sql, params) {
      queries.push({ sql, params });
      if (sql.includes("SELECT id, log_date")) {
        return { rows };
      }
      if (sql.includes("UPDATE meals AS m")) {
        return { rowCount: params[0].length };
      }
      throw new Error(`unexpected query: ${sql}`);
    },
  };
}

test("reorderMealsForDay assigns sort_index from mealIds order", async () => {
  const client = createMockClient([
    { id: MEAL_A, log_date: "2026-06-10" },
    { id: MEAL_B, log_date: "2026-06-10" },
  ]);

  await reorderMealsForDay(client, USER_ID, "2026-06-10", [MEAL_B, MEAL_A]);

  const update = client.queries.find((q) => q.sql.includes("UPDATE meals AS m"));
  assert.ok(update);
  assert.deepEqual(update.params[0], [MEAL_B, MEAL_A]);
  assert.deepEqual(update.params[1], [0, 1]);
  assert.equal(update.params[2], USER_ID);
});

test("reorderMealsForDay rejects meals on a different log date", async () => {
  const client = createMockClient([
    { id: MEAL_A, log_date: "2026-06-10" },
    { id: MEAL_B, log_date: "2026-06-11" },
  ]);

  await assert.rejects(
    () => reorderMealsForDay(client, USER_ID, "2026-06-10", [MEAL_A, MEAL_B]),
    (err) => {
      assert.ok(err instanceof ReorderMealsValidationError);
      assert.equal(err.message, "Meals must share the same log date");
      return true;
    },
  );
});

test("reorderMealsForDay rejects unknown meal ids", async () => {
  const client = createMockClient([
    { id: MEAL_A, log_date: "2026-06-10" },
  ]);

  await assert.rejects(
    () => reorderMealsForDay(client, USER_ID, "2026-06-10", [MEAL_A, MEAL_B]),
    (err) => {
      assert.ok(err instanceof ReorderMealsValidationError);
      assert.equal(err.message, "One or more mealIds were not found");
      return true;
    },
  );
});

test("reorderMealsForDay rejects when query returns fewer rows than requested", async () => {
  const client = createMockClient([]);

  await assert.rejects(
    () =>
      reorderMealsForDay(client, USER_ID, "2026-06-10", [MEAL_A, MEAL_B, MEAL_C]),
    ReorderMealsValidationError,
  );
});
