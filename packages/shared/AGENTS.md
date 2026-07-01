# Shared (`packages/shared`)

Pure TypeScript shared by API and mobile. No React, Fastify, or database code.

Read `/AGENTS.md` and `docs/conventions.md` before editing.

## Layout

```
src/
├── index.ts           # Main exports — types, meal types, profile, gamification
├── logDate.ts         # Log-date keys, timeline ordering, date windows
├── freeTier.ts        # Free vs Plus logging access rules
├── gamification.ts    # Badges, milestones, coop challenge types
├── streaks.ts         # Streak computation from day keys
├── plus.ts            # LifePlate Plus feature definitions
├── widgetPlate.ts     # iOS widget props helpers
└── nutrition/         # Dashboard pillars, scores, recommendations
test/                  # node --test unit tests
```

## What goes here

| Add to shared | Keep in app packages |
|---------------|-------------------|
| API request/response interfaces | HTTP handlers, SQL queries |
| Nutrition math, date helpers | UI components, caches |
| Constants (`MAX_MEAL_REANALYZES`, `GOALS`) | OpenAI prompts, storage |
| Gamification/streak pure functions | RevenueCat SDK calls |

When API and mobile must agree on a shape or algorithm, it belongs here.

## Key modules

- **`index.ts`** — `MealConfirmRequest`, `UserProfile`, `InsightsResponse`, meal types, portion scaling
- **`logDate.ts`** — `dateKeyFromIso`, `compareMealsTimeline`, paid/free backdate limits
- **`freeTier.ts`** — `computeLoggingAccess`, `FREE_LOGGING_DAYS`
- **`nutrition/`** — pillar progress, gut health, weekly trends, period comparison
- **`gamification.ts`** — badge/milestone definitions, `GamificationBundleResponse`

## Build & test

Shared compiles to `dist/`. API and mobile import the built output.

```bash
pnpm --filter @lifeplate/shared build
pnpm --filter @lifeplate/shared test
```

**Always build shared before API tests** — API test script does this automatically.

## Adding types or functions

1. Add exports to `src/index.ts` or the appropriate submodule
2. Keep functions **pure** — no I/O, no env reads
3. Add unit tests in `test/` for non-trivial logic
4. Run `pnpm typecheck` from repo root

## Nutrition submodule

`src/nutrition/` is the largest area. It powers the insights dashboard and coaching copy. Files are split by concern (pillars, trends, recommendations). Prefer extending existing builders (`buildFibrePillar`, `buildWeeklyTrends`, …) over duplicating macro math.
