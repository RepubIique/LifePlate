# Database

PostgreSQL accessed via `pg` in `apps/api/src/db.ts`. Schema is SQL migrations in `apps/api/migrations/`.

## Migration workflow

```bash
pnpm db:up        # starts Postgres (docker-compose)
pnpm db:migrate   # runs apps/api/src/migrate.ts
```

| File | Purpose |
|------|---------|
| `migrations/schema.sql` | Baseline schema (tracked as version `baseline`) |
| `migrations/001_*.sql` … `006_*.sql` | Incremental changes, applied in order |

**Rules for agents:**

- Never edit `schema.sql` for new changes — add the next numbered `00N_description.sql`
- Fresh DB: baseline runs once, then numbered files
- Production uses session/direct Postgres URL, not transaction pooler (see startup log in `index.ts`)

## Core tables

### `users`

Profile, streak counters, `is_paid`, body metrics, `friend_code`. Synced from Supabase auth on first API request.

### `meals`

Persisted meals. Macros and `foods[]` live on the row (no separate `meal_analysis` table). Important columns:

- `log_date` — calendar day the meal belongs to
- `sort_index` — order within a day on the timeline
- `image_url` — cloud URL or empty (device-only photos)
- `raw_ai_response` — JSONB from OpenAI
- `reanalyze_count` — capped by `MAX_MEAL_REANALYZES` in shared
- `meal_source` — `home_cooked` | `takeaway` (migration `005`)
- `shared_from_meal_id`, `shared_by_user_id` — accepted meal shares

### `meal_drafts`

Temporary buffer between upload and confirm. Expires via `expires_at`. Holds analysis JSON until user confirms or abandons.

### `daily_hydration`

Per-user, per-day glass count (`user_id`, `log_date` PK).

### `daily_insights`

Cached AI insight text per user per day.

### Rate limiting

- `upload_attempts` — photo/text upload rate limit
- `refine_attempts` — draft refinement rate limit

Pruned on API startup when migrations run.

## Social & gamification (migrations 003–004)

| Table | Purpose |
|-------|---------|
| `friendships` | Mutual friends (`user_a_id < user_b_id`) |
| `meal_share_requests` | Pending/accepted/declined shares between friends |
| `user_streak_freezes` | Streak freeze per log date |
| `coop_challenges` | Friend hydration challenges |

## Other

- `alpha_feedback_messages` — in-app alpha feedback board

## Indexes worth knowing

- `meals_user_log_date_sort_idx` — timeline queries by day + sort order
- `meal_drafts_user_expires_idx` — draft cleanup
- `friendships_user_a_idx`, `friendships_user_b_idx` — friend lookups

## When adding columns

1. Add `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` in a new numbered migration
2. Update shared TypeScript types if the field is exposed to clients
3. Update route handlers and any service that reads/writes the column
4. Note the change in this file if it's a meaningful schema concept
