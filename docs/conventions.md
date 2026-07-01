# Conventions

Coding patterns and workflows for LifePlate. Read `architecture.md` first for system overview.

## TypeScript & modules

- **ESM** throughout (`"type": "module"` in package.json)
- API imports use `.js` extensions in source (e.g. `./config.js`) — required for Node ESM
- Shared package exports from `packages/shared/src/index.ts`; API/mobile import `@lifeplate/shared`
- After changing shared types, run `pnpm --filter @lifeplate/shared build` before API/mobile tests

## API patterns

### Routes

- One file per domain under `apps/api/src/routes/`
- Export `async function fooRoutes(app: FastifyInstance)`
- Protected routes: `{ preHandler: requireAuth }` then cast `request as AuthedRequest` for `userId`
- Request/response shapes defined in `@lifeplate/shared` — keep handlers thin

### Services

- Business logic lives in `apps/api/src/services/`, not in route files
- OpenAI calls: `services/openai.ts`
- Side effects after meal changes: `services/mealSideEffects.ts` (streaks, caches, gamification)
- Throw domain errors (`MealGuardrailError`, `FreeTierError`, …) — don't manually format 4xx in every handler

### Errors

API error responses:

```json
{ "error": "Human message", "code": "OPTIONAL_CODE" }
```

Mobile parses these in `apps/mobile/lib/apiErrors.ts`. Preserve `code` for guardrail/rate-limit cases.

## Mobile patterns

### Navigation

- **Expo Router** — files in `app/` map to routes
- Use `@/` path alias for imports (e.g. `@/lib/api`, `@/context/AuthContext`)

### Data fetching

- `lib/api.ts` — all authenticated HTTP calls; attaches Supabase JWT
- Context providers hold server state; `lib/*Cache.ts` files handle stale-while-revalidate caching
- On 401, `sessionEvents.notifyUnauthorized()` triggers re-auth flow

### Styling

- Theme via `ThemeContext` and `src/theme/` (lifeplate palette, premium variants)
- Prefer existing components in `components/ui/` before adding one-offs

### Expo

- **SDK 56** — read versioned docs before changing native/Expo APIs (see `apps/mobile/AGENTS.md`)
- `EXPO_PUBLIC_*` env vars must be read statically (`process.env.EXPO_PUBLIC_FOO`) — Metro does not inline dynamic lookups in production builds (`lib/env.ts`)

## Shared package boundaries

**Belongs in shared:**

- API request/response interfaces
- Pure functions: nutrition math, date keys, gamification stats, free-tier rules
- Constants used by both clients (`MAX_MEAL_REANALYZES`, `GOALS`, meal types)

**Does not belong in shared:**

- React components, Fastify handlers, SQL, Supabase/OpenAI clients
- Platform-specific code

Nutrition dashboard computations live in `packages/shared/src/nutrition/` with tests in `packages/shared/test/`.

## Testing

```bash
pnpm test           # shared + api + mobile unit tests
pnpm typecheck      # all packages
pnpm build:api      # shared build + api compile (CI)
```

| Package | Test location | Runner |
|---------|---------------|--------|
| shared | `packages/shared/test/*.test.mjs` | `node --test` |
| api | `apps/api/test/*.test.mjs` | `node --test` (after tsc) |
| mobile | `apps/mobile/lib/__tests__/` | package test script |

Add tests for pure logic in shared; API tests for HTTP/service behavior; mobile tests for lib utilities.

## Environment variables

See `.env.example` for the full list. Critical ones:

| Var | Where | Purpose |
|-----|-------|---------|
| `DATABASE_URL` | API | Postgres connection |
| `SUPABASE_JWT_SECRET` | API | Local JWT verification (required in prod) |
| `OPENAI_API_KEY` | API | Meal analysis (mock fallback in dev if missing) |
| `EXPO_PUBLIC_API_URL` | Mobile | API base URL |
| `EXPO_PUBLIC_SUPABASE_*` | Mobile | Auth client |

## Git & PR hygiene

- Keep changes scoped to the requested task
- Update `AGENTS.md` / `docs/` when architecture or conventions change
- CI runs: `pnpm typecheck`, `pnpm test`, `pnpm build:api`

## Log dates & timeline

Meals are grouped by `log_date` (YYYY-MM-DD), not just `created_at`. Utilities in `packages/shared/src/logDate.ts`:

- `dateKeyFromIso`, `mealLogDateKey`, `compareMealsTimeline`
- Free vs paid backdating limits in `freeTier.ts`

When touching timeline or "log on previous day" features, start with shared log-date helpers.
