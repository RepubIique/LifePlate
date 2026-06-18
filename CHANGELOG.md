# Changelog

All notable changes to LifePlate are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html) for releases.

When you ship a release:

1. Move everything under `[Unreleased]` into a new dated version section (e.g. `## [1.0.0] - 2026-06-18`).
2. Leave `[Unreleased]` empty for the next batch of work.
3. Tag the commit if you use git tags (`v1.0.0`).

---

## [Unreleased]

### Added

- **Digital Plate — carbs quadrant** — fourth macro segment on the home plate with pillar insight support.
- **Digital Plate — hydration center** — `PlateCenterWater` component shows hydration progress inside the plate.
- **Macro source attribution** — protein, fibre, and carbs pillars now show which logged meals contributed (`macroSources.ts`), with unit tests.
- **Shared taxonomy** — `proteinLabelsForFood`, `fibreLabelsForFood`, and `carbsLabelsForFood` keyword matchers with word-boundary matching and plural support (e.g. `walnut` matches `walnuts`).
- **Shared scoring** — `buildCarbsPillar`; protein/fibre pillars accept optional `classification` for server-side `sources`.
- **API response** — nutrition dashboard `todaySummary` now includes `protein` and `fibre` classification arrays.
- **Mobile env validation** — `lib/env.ts` fails fast in production builds when required `EXPO_PUBLIC_*` vars are missing.
- **API security** — `@fastify/helmet` and global rate limiting (120 req/min per IP).
- **API error handler** — global handler for `MealGuardrailError` and `RateLimitError` with consistent JSON shape.
- **API graceful shutdown** — SIGTERM/SIGINT closes Fastify and the DB pool (Render-friendly).
- **Scoring test** — zero-target edge case to ensure scores stay finite (no `NaN`).

### Changed

- **Digital Plate layout** — larger plate (196px), quadrant-style segments for protein / fibre / plants / carbs, hydration moved to center.
- **Pillar icons** — added carbs icon; icon map covers all pillar keys.
- **Pillar insight modal** — client-side macro sources for protein, fibre, and carbs with fallback to server classification.
- **API config** — production requires `DATABASE_URL`, Supabase keys, JWT secret, and a real `OPENAI_API_KEY`; dev still warns on missing vars.
- **API migrations** — gated behind `RUN_MIGRATIONS` (default `false` in production, `true` in dev/Docker); set `RUN_MIGRATIONS=true` in Render/Dockerfile.
- **API startup** — removed `backfillAllUserMealStats()` on every boot (was scanning all users each deploy).
- **OpenAI service** — mock meal analysis disabled in production; 401 auth failures throw instead of returning fake data.
- **Mobile API client** — 30s request timeout; production no longer falls back to `localhost:3001`.
- **Alpha feedback bubble** — only shown in `__DEV__` or when `EXPO_PUBLIC_ENABLE_ALPHA_FEEDBACK=true`.
- **Shared scoring** — `safeRatio()` guards division when nutrition targets are zero; fixed duplicate protein pillar tip copy.
- **Hydration history API** — `days` query param clamped to 1–90 and rejects `NaN`.
- **DB pool** — connection limits, idle timeout, and idle-client error logging.

### Fixed

- **Taxonomy** — plural food keywords (e.g. `walnuts`) match singular keyword entries.
- **Digital Plate** — meal fetch errors no longer fail silently when opening pillar modals.
- **Period comparison** — pillar row keys typed against `ComparisonPillarMetrics` instead of the broader `PillarKey`.

### Removed

- **Android `RECORD_AUDIO` permission** — unused in the app.
- **Deprecated `UploadRateLimitError` alias** — use `RateLimitError` only.

### Security

- API validates production env vars at startup instead of warning and continuing.
- Helmet security headers on all API responses.
- Global IP rate limit as a baseline beyond per-user upload/refine limits.

---

## Prior releases

History before this changelog was not recorded here. See `git log` for earlier commits.
