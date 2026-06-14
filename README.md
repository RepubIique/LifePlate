# LifePlate

Monorepo for the LifePlate meal-tracking app.

## Packages

- `apps/mobile` — Expo React Native app
- `apps/api` — Fastify API (deployed to Render)
- `packages/shared` — shared types and nutrition logic

## Common commands

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
