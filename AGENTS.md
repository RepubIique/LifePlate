# LifePlate — agent guide

**Read this file first.** Then open the package guide and docs for the area you are changing.

## Repo map

| Path | What it is |
|------|------------|
| `apps/mobile` | Expo React Native app (Expo Router, SDK 56) |
| `apps/api` | Fastify API (deployed to Render) |
| `packages/shared` | Shared TypeScript types, nutrition logic, gamification helpers |
| `Requirements.md` | Product requirements and MVP scope |
| `docs/` | Architecture, database, and coding conventions |

## Before you code

1. Read `docs/architecture.md` — auth, meal flow, monorepo boundaries
2. Read `docs/conventions.md` — patterns, tests, env vars
3. If touching **mobile**: read `apps/mobile/AGENTS.md`
4. If touching **API**: read `apps/api/AGENTS.md`
5. If touching **shared types or nutrition math**: read `packages/shared/AGENTS.md`
6. If changing schema: read `docs/database.md`

Do not explore the codebase blindly when these docs answer the question.

## Commands

```bash
pnpm install
pnpm db:up          # local Postgres via Docker
pnpm db:migrate
pnpm dev:api
pnpm dev:mobile
pnpm typecheck
pnpm test
pnpm build:api
```

Copy `.env.example` to `apps/api/.env` and `apps/mobile/.env` before running locally.

**Git:** push directly to `main` while iterating quickly. CI runs on every push; EAS preview builds run when mobile or shared code changes.

## Product non-negotiables

- Meal logging should feel fast — optimize for habit formation, not perfect nutrition accuracy
- LifePlate is about awareness and ownership, not aggressive dieting or weight-loss messaging
- Do not expand scope beyond `Requirements.md` unless explicitly asked
- Match existing patterns in the package you are editing

## When you change structure

Update the relevant `AGENTS.md` or `docs/` file in the same PR when you:

- Add a new route group, screen area, or major service
- Change auth, meal upload flow, or database schema
- Introduce a convention future agents should follow

Keep docs short. Link to source files instead of duplicating implementation detail.
