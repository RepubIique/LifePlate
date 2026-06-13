# LifePlate

Know what you're feeding your future.

AI-powered meal photo journaling for iPhone and Android (Expo) with a Fastify API backend.

## Stack

- **Mobile:** Expo, React Native, Expo Router, React Native Paper
- **API:** Fastify, PostgreSQL, OpenAI Vision
- **Auth & storage:** Supabase (Apple + Google OAuth, meal images)

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) (`corepack enable`)
- Docker (for local Postgres)
- Supabase project with Apple & Google auth enabled
- OpenAI API key

## Quick start

```bash
# 1. Install
pnpm install

# 2. Start Postgres
pnpm db:up
pnpm db:migrate

# 3. Configure env
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
# Fill in Supabase + OpenAI keys

# 4. Run API + mobile
pnpm dev
```

- API: http://localhost:3001/health
- Mobile: scan QR in Expo Go or run `pnpm dev:ios` / `pnpm dev:android`

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **Authentication → Providers:** enable Apple and Google.
3. **Redirect URLs:** add `lifeplate://auth/callback`, `lifeplate://**`, and `exp+lifeplate://**`
4. **Site URL:** set to `lifeplate://auth/callback` (not localhost)
4. **Storage:** create a public bucket named `meals` (or set `SUPABASE_STORAGE_BUCKET`).
5. Copy **Project URL**, **anon key** (mobile), and **service role key** (API only — never ship to the app).

## Project structure

```
apps/
  api/       # Fastify REST API
  mobile/    # Expo app
packages/
  shared/    # Shared TypeScript types
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/meals/upload` | Upload image → AI analysis |
| POST | `/api/meals/confirm` | Save meal |
| GET | `/api/meals` | Timeline |
| GET | `/api/insights` | Weekly stats |
| GET/PATCH | `/api/users/me` | Profile & goal |

## Mobile notes

- Use a **physical device** or simulator with network access to your machine's API (`EXPO_PUBLIC_API_URL`).
- For iOS simulator, `http://localhost:3001` works. For Android emulator, use `http://10.0.2.2:3001`.
- Without `OPENAI_API_KEY`, the API returns mock analysis for development.

## Deploy API (free tier)

Host the API on **Render** (free web service) and use **Supabase Postgres** for the database (included in your existing Supabase project — no extra DB host needed).

### 1. Supabase database URL

1. [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Project Settings → Database**
2. Under **Connection string**, choose **URI** and **Session pooler**
3. Copy the URL and replace `[YOUR-PASSWORD]` with your database password (reset under **Database password** if needed)

Use the **Session pooler** URI (port 5432), not the transaction pooler (port 6543). DDL migrations run on API startup and need session or direct mode.

If profile body metrics are not saving, open **Supabase → SQL Editor** and run:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5, 1);
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;
```

Then redeploy the API on Render (or run `pnpm db:migrate` locally against your Supabase URI).

### 2. Render

1. Push this repo to GitHub
2. [render.com](https://render.com) → **New → Blueprint** → connect the repo (uses `render.yaml`)
   - Or **New → Web Service** → Docker, point at this repo
3. Set these environment variables in Render:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Supabase connection URI from step 1 |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API |
| `OPENAI_API_KEY` | Your OpenAI key |
| `SUPABASE_STORAGE_BUCKET` | `meals` |
| `CORS_ORIGIN` | `*` |

Migrations run automatically on startup. Health check: `GET /health`.

**Free tier note:** Render sleeps after ~15 minutes idle; first request after that takes ~30–60s to wake up.

**Keep it awake (optional):** Use [UptimeRobot](https://uptimerobot.com) (free) to ping `https://lifeplate-api.onrender.com/health` every 5 minutes. This reduces cold starts for demos. Render may still spin down occasionally on the free plan.

### 3. Point the mobile app at production

In `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_URL=https://your-service.onrender.com
```

Rebuild the iPhone install (`pnpm ios:device`) — env vars are baked in at build time.
