import test from "node:test";
import assert from "node:assert/strict";

test("computeLoggingAccess grants seven calendar days from signup", async () => {
  const { computeLoggingAccess, FREE_LOGGING_DAYS } = await import("@lifeplate/shared");

  const createdAt = "2026-06-01T15:00:00.000Z";
  assert.equal(FREE_LOGGING_DAYS, 7);

  assert.deepEqual(
    computeLoggingAccess({ isPaid: false, createdAt, todayKey: "2026-06-01" }),
    { loggingLocked: false, freeLoggingDaysRemaining: 7 },
  );
  assert.deepEqual(
    computeLoggingAccess({ isPaid: false, createdAt, todayKey: "2026-06-07" }),
    { loggingLocked: false, freeLoggingDaysRemaining: 1 },
  );
  assert.deepEqual(
    computeLoggingAccess({ isPaid: false, createdAt, todayKey: "2026-06-08" }),
    { loggingLocked: true, freeLoggingDaysRemaining: 0 },
  );
});

test("computeLoggingAccess unlocks logging for Plus users", async () => {
  const { computeLoggingAccess } = await import("@lifeplate/shared");

  assert.deepEqual(
    computeLoggingAccess({
      isPaid: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      todayKey: "2026-12-31",
    }),
    { loggingLocked: false, freeLoggingDaysRemaining: 0 },
  );
});

test("computeLoggingAccess uses UTC calendar days when utcCalendar is set", async () => {
  const { computeLoggingAccess } = await import("@lifeplate/shared");

  const createdAt = "2026-06-01T23:30:00.000Z";

  assert.deepEqual(
    computeLoggingAccess({
      isPaid: false,
      createdAt,
      todayKey: "2026-06-01",
      utcCalendar: true,
    }),
    { loggingLocked: false, freeLoggingDaysRemaining: 7 },
  );
  assert.deepEqual(
    computeLoggingAccess({
      isPaid: false,
      createdAt,
      todayKey: "2026-06-08",
      utcCalendar: true,
    }),
    { loggingLocked: true, freeLoggingDaysRemaining: 0 },
  );
});
