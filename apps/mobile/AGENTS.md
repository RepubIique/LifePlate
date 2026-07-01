# Mobile (`apps/mobile`)

Expo React Native app. Read `/AGENTS.md` and `docs/architecture.md` first.

## Expo SDK 56

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any Expo or native code.

## Layout

```
app/              # Expo Router screens (file-based routes)
components/       # UI by feature (meal/, timeline/, insights/, ui/, …)
context/          # React context providers (global state)
lib/              # API client, caches, hooks, meal upload, RevenueCat
src/theme/        # lifeplate palette, premium styling
widgets/          # iOS home-screen widget
```

## Navigation

Expo Router in `app/`. Root providers in `app/_layout.tsx`:

Auth → WidgetQuickAction → PlusPaywall → Meals → Friends → Gamification → PendingLogDate → Nutrition → WeekInsights → Hydration

Key screens:

| Route | Purpose |
|-------|---------|
| `app/index.tsx` | Home / quick log |
| `app/log/camera.tsx` | Photo capture |
| `app/meal/result.tsx` | Post-upload confirm |
| `app/meal/edit.tsx` | Edit persisted meal |
| `app/onboarding/*` | Goal + body metrics |
| `app/(auth)/*` | Welcome, sign in |
| `app/profile.tsx` | User profile |

## API & auth

- `lib/supabase.ts` — Supabase Auth session
- `lib/api.ts` — all backend calls; attaches Bearer token from session
- `lib/apiErrors.ts` — parses API errors; 401 triggers `sessionEvents.notifyUnauthorized()`
- `lib/env.ts` — `EXPO_PUBLIC_*` vars (must use static `process.env.EXPO_PUBLIC_*` reads)

## State & caching

Contexts hold fetched data; `lib/*Cache.ts` files implement stale-while-revalidate:

- `mealsCache.ts`, `dashboardCache.ts`, `profileCache.ts`, `friendsCache.ts`, `gamificationCache.ts`, …

After meal changes, use `lib/refreshAfterMealChange.ts` patterns rather than ad-hoc refetches.

## Meal photo flow (client)

1. `lib/useMealPhotoUpload.ts` / `lib/imagePrep.ts` — prepare image
2. `api.uploadMeal()` → draft + analysis
3. `app/meal/result.tsx` — user confirms
4. `api.confirmMeal()` → timeline update via `MealsContext`

Pending/offline recovery: `lib/mealPendingStorage.ts`, `components/meal/PendingMealRecoveryModal.tsx`

## Subscriptions

RevenueCat via `lib/revenueCat.ts` and `PlusPaywallContext`. Gated features defined in `@lifeplate/shared/plus`.

## Theming

`ThemeContext` + `src/theme/lifeplate.ts`. Use `lib/useThemedStyles.ts` for style factories.

## Local dev

```bash
cp ../../.env.example .env   # set EXPO_PUBLIC_* vars
pnpm dev:mobile              # from repo root
```

## Adding a screen

1. Create route under `app/`
2. Reuse components from `components/`; add feature components alongside existing folders
3. Add API methods to `lib/api.ts` if new endpoints (types from `@lifeplate/shared`)
4. Wire context or cache if data is shared across screens

## Tests

Unit tests in `lib/__tests__/`. Run via `pnpm --filter @lifeplate/mobile test`.
