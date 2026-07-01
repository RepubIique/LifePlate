# API (`apps/api`)

Fastify + PostgreSQL + Supabase + OpenAI. Read `/AGENTS.md` and `docs/architecture.md` first.

## Layout

```
src/
├── index.ts          # Server bootstrap, plugins, error handler
├── auth.ts           # requireAuth, JWT verification
├── config.ts         # Environment variables
├── db.ts             # pg pool, queries
├── routes/           # HTTP handlers (thin)
└── services/         # Business logic (thick)
migrations/           # SQL schema (numbered after schema.sql)
test/                 # node --test suites
```

## Route map

| Prefix | File | Notes |
|--------|------|-------|
| `POST /api/meals/*` | `routes/meals.ts` | Upload, confirm, CRUD, reanalyze, reorder |
| `GET /api/insights` | `routes/insights.ts` | Weekly analytics |
| `GET/PATCH /api/nutrition/*` | `routes/nutrition.ts` | Dashboard + hydration |
| `GET/PATCH /api/users/me` | `routes/users.ts` | Profile, avatar |
| `GET/POST /api/friends/*` | `routes/friends.ts` | Friend codes, list, remove |
| `GET /api/meal-shares/*` | `routes/mealShares.ts` | Incoming shares, accept/decline |
| `GET /api/gamification` | `routes/gamification.ts` | Badges, coop challenges |
| `GET/POST /api/feedback/*` | `routes/feedback.ts` | Alpha feedback board |
| `POST /api/subscription/*` | `routes/subscription.ts` | RevenueCat sync + webhook |

`GET /health` — DB connectivity check.

## Adding an endpoint

1. Add request/response types to `packages/shared/src/index.ts` (if new shapes)
2. Implement logic in `services/` — reuse existing services when possible
3. Add route in the appropriate `routes/*.ts` with `preHandler: requireAuth` if user-scoped
4. Register route module in `index.ts` if new file (existing modules already registered)
5. Add migration in `migrations/` if schema changes — see `docs/database.md`
6. Add test in `test/` for non-trivial behavior

## Auth

All user routes use `requireAuth` from `auth.ts`. Access `userId` via `(request as AuthedRequest).userId`.

JWT verified locally when `SUPABASE_JWT_SECRET` is set; otherwise Supabase admin API (slow, dev only).

## Meal pipeline services

| Service | Role |
|---------|------|
| `openai.ts` | Image/text analysis, refine, reanalyze |
| `drafts.ts` | Pre-confirm draft storage |
| `mealGuardrails.ts` | Reject non-food, unclear photos |
| `uploadRateLimit.ts` | Per-hour upload/refine limits |
| `freeTier.ts` | Free logging window, profile readiness |
| `storage.ts` | Supabase Storage for Plus user photos |
| `mealSideEffects.ts` | Post-meal streaks, stats, cache invalidation hints |

## Error handling

Throw typed errors for expected failures — `index.ts` maps them to HTTP status + `code`:

- `MealGuardrailError` — invalid image, not food, unclear photo
- `RateLimitError` — upload/refine limits
- `FreeTierError` — logging locked, profile incomplete

## Local dev

```bash
cp ../../.env.example .env   # or use apps/api/.env
pnpm db:up                   # from repo root
pnpm db:migrate
pnpm dev:api
```

Without `OPENAI_API_KEY`, analysis returns mock data (see `services/openai.ts`).

## Config notes

- `RUN_MIGRATIONS` defaults `true` locally, `false` in production
- `CORS_ORIGIN` defaults `*`
- Production requires `SUPABASE_JWT_SECRET`, real `OPENAI_API_KEY`, and valid `DATABASE_URL`
