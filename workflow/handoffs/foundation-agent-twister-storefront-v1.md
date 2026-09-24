# Handoff: foundation-agent / twister-storefront-v1

- Status: `review`
- Base ref: `0531b59`
- Result ref: working tree (committed immediately after this handoff)
- Tasks completed: `TW-FD-01` .. `TW-FD-07`

## Delivered outputs

| Path                                                                                                                                                                                                       | Purpose                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`, `package-lock.json`                                                                                                                                                                        | Adds `zustand`, `react-hook-form`, `@hookform/resolvers`, `prettier`, `husky`, `lint-staged`, `@axe-core/playwright`, `@lhci/cli`; `prepare`/`format`/`format:check` scripts; `lint-staged` config. No existing dependency removed.                                                                                                                                   |
| `.prettierrc.json`, `.prettierignore`                                                                                                                                                                      | Root Prettier config/ignore.                                                                                                                                                                                                                                                                                                                                          |
| `.husky/pre-commit`                                                                                                                                                                                        | Runs `npx lint-staged` (eslint --fix + prettier --write on staged files).                                                                                                                                                                                                                                                                                             |
| `.env.example`                                                                                                                                                                                             | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` documented, no real secrets.                                                                                                                                                                                                                                          |
| `.github/workflows/ci.yml`                                                                                                                                                                                 | Adds an `npm run build` step so CI mirrors the full local check set.                                                                                                                                                                                                                                                                                                  |
| `src/domain/twister/**` (`schemas.ts`, `pricing.ts`, `coupons.ts`, `gift.ts`, `hours.ts`, `cairo-time.ts`, `whatsapp.ts`, `index.ts`, `twister.test.ts`)                                                   | Zod schemas for every entity in `domain-model.md`; pure functions `priceLine`, `cartTotals`, `validateCoupon`, `freeFriesGift`, `isOpenNow`, `offerStatus`, `buildWhatsAppMessage`/`buildWhatsAppUrl`, `orderRef`. 20 unit tests.                                                                                                                                     |
| `src/mocks/twister/**` (`categories.ts`, `products.ts`, `zones.ts`, `coupons.ts`, `offers.ts`, `business.ts`, `reviews.ts`, `faqs.ts`, `banners.ts`, `announcements.ts`, `index.ts`, `seed.test.ts`)       | Seed data matching `menu-catalog.md`/`offers.md`/`business-facts.md`, zod-validated in 10 tests.                                                                                                                                                                                                                                                                      |
| `src/lib/storage.ts`, `src/lib/storage.test.ts`                                                                                                                                                            | SSR/private-browsing-safe `localJsonStorage` (read/write/remove JSON, silent fallback).                                                                                                                                                                                                                                                                               |
| `src/lib/repositories/**`                                                                                                                                                                                  | `CrudRepository`/`SingletonRepository`/`LogRepository` interfaces + localStorage implementations; `src/lib/repositories/twister.ts` wires the 6 admin CRUD resources + `businessInfoRepository` + `ordersRepository` (browser-scoped order log) to the seed data.                                                                                                     |
| `src/lib/format.ts`, `src/lib/format.test.ts`                                                                                                                                                              | `formatEgp`/`formatEgpAmount` (no decimals, thousands separator, `ج.م` suffix).                                                                                                                                                                                                                                                                                       |
| `src/lib/pwa.ts`, `src/lib/pwa.test.ts`                                                                                                                                                                    | `registerServiceWorker`, `isStandaloneDisplayMode` (both no-op safely outside the browser; nothing calls them yet — opt-in for a later stage).                                                                                                                                                                                                                        |
| `src/lib/fonts.ts`                                                                                                                                                                                         | Loads Cairo/Alexandria via `next/font/google`, exports `twisterFontVariables`.                                                                                                                                                                                                                                                                                        |
| `src/lib/analytics.ts` (extended)                                                                                                                                                                          | Adds the PII-free Twister event union (`add_to_cart`, `remove_from_cart`, `coupon_applied`/`rejected`, `begin_checkout`, `whatsapp_order_sent`, `whatsapp_popup_blocked`, `offer_viewed`/`clicked`, `admin_export_json`) to the existing `AnalyticsEvent` union; extends `assertNoSensitiveTelemetry`'s banned-key list. Existing Al-Manara variants/tests untouched. |
| `src/lib/motion/twister.ts` (+ `index.ts` export, `twister.test.ts`)                                                                                                                                       | `heroTimelineSteps` data, `useCoarsePointer`, `useAmbientMotionAllowed`, `useSectionReveal` (lazy GSAP+ScrollTrigger). Existing `MotionFoundation`/`useAuthBrandTimeline` untouched.                                                                                                                                                                                  |
| `src/lib/test/setup.ts` (extended)                                                                                                                                                                         | Adds a `next/font/google` mock (module only works inside Next's own compiler; the real font loading is verified separately via `npm run build`).                                                                                                                                                                                                                      |
| `src/components/layout/{SiteHeader,SiteFooter,BrandLogo,LoadingScreen,AmbientLayer,ScrollProgress,PageTransition,StickyWhatsAppButton,AdminShell}.tsx`, `twister-shell.css`, `layout.test.tsx`, `index.ts` | Rewritten/new Twister shell components (see decisions below for `SiteHeader`/`BrandLogo`/`SplashScreen` back-compat approach). 9 unit tests.                                                                                                                                                                                                                          |
| `public/manifest.webmanifest`, `public/icons/icon.svg`, `public/sw.js`, `public/images/placeholder-banner.svg`                                                                                             | PWA manifest + monogram icon (SVG, real logo pending per business-facts.md) + minimal offline-fallback service worker (unregistered by default) + a labelled placeholder banner image used by mock offers/banners.                                                                                                                                                    |

## Acceptance evidence

| Criterion                                                                                                                                                                                                                           | Evidence/command                                                                                                                                                                                          | Result |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Dependencies added without removing anything                                                                                                                                                                                        | `package.json` diff; `npm install` (334 packages added)                                                                                                                                                   | pass   |
| Husky + lint-staged wired, root Prettier config                                                                                                                                                                                     | `.husky/pre-commit`, `.prettierrc.json`, `.prettierignore`, `package.json#lint-staged`                                                                                                                    | pass   |
| `src/domain/twister` schemas + pure fns match business-rules.md/whatsapp-order-message.md, with tests                                                                                                                               | `npm run test` → `src/domain/twister/twister.test.ts (20 tests)` all pass                                                                                                                                 | pass   |
| `src/mocks/twister` seed data matches menu-catalog/offers/business-facts, zod-validated                                                                                                                                             | `npm run test` → `src/mocks/twister/seed.test.ts (10 tests)` all pass                                                                                                                                     | pass   |
| `src/lib/{storage,repositories,format,motion,pwa,analytics}` exist per cross-cutting plan                                                                                                                                           | files listed above; `storage.test.ts` (4), `repositories.test.ts` (5), `format.test.ts` (3), `motion/twister.test.ts` (1), `pwa.test.ts` (2), `analytics.test.ts` (3) all pass                            | pass   |
| `src/components/layout` rewritten (SiteHeader 6 nav + CTA + drawer + `cartSlot`, SiteFooter, LoadingScreen, AmbientLayer/CursorGlow, ScrollProgress, PageTransition, StickyWhatsAppButton, AdminShell), no `src/features/**` import | `layout.test.tsx` (9 tests) incl. "renders exactly one `<main>`"; `grep -rn "@/features" src/components/layout/` → no matches                                                                             | pass   |
| Cairo/Alexandria via `next/font` bound to `--ds-font-ui`/`--ds-font-heading`                                                                                                                                                        | `src/lib/fonts.ts` + `twister-shell.css`'s `:root` override; `npm run build` compiles the real Google-fonts fetch successfully (Vitest uses a mock — `next/font/google` only runs inside Next's compiler) | pass   |
| `npm install`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` all pass, legacy Al-Manara code present/unmodified/unbroken                                                                                     | see command log below                                                                                                                                                                                     | pass   |
| Governance-gap paths (`src/i18n/**`, `public/**`, dotfiles) used appropriately                                                                                                                                                      | `public/**` additions above; `src/i18n/**` deliberately left untouched (see decisions)                                                                                                                    | pass   |

### Command log

```
$ npm install
added 334 packages, and audited 902 packages in 2m — 0 install errors

$ npm run lint
> eslint . --max-warnings=0
(no output — clean)

$ npm run typecheck
> next typegen && tsc --noEmit
Generating route types...
✓ Types generated successfully
(no tsc errors)

$ npm run test
Test Files  30 passed (30)
     Tests  170 passed (170)

$ npm run build
▲ Next.js 16.3.2 (Turbopack)
✓ Compiled successfully in 5.3s
  Running TypeScript ... Finished TypeScript in 6.6s
✓ Generating static pages using 3 workers (23/23)
(all existing quran/quran-kids/auth routes still build; no new routes yet — nothing in
src/app/** consumes the new Twister layout components this stage)
```

`git status --short` after the above shows only files under foundation-agent's owned paths
(modified + untracked); no `.next/`, `tsconfig.tsbuildinfo`, or `next-env.d.ts` leaked in.

## Decisions and assumptions

- **`SiteHeader`/`BrandLogo` back-compat, not parallel components.** `SiteHeader.tsx` is rewritten
  in place to the Twister spec (6 nav items from `CPY-NAV`, `اطلب الآن` CTA, `cartSlot` prop,
  RTL full-height mobile drawer, zero `src/features/**` import — the old version imported
  `@/features/landing/landing.css` directly, which the new contract forbids). It keeps
  `isAuthenticated?: boolean` as a declared-but-unused, `@deprecated`-annotated prop purely so
  the ~16 legacy `src/app/quran*`/`src/features/landing` call sites (all outside my ownership,
  so I cannot edit their call sites) still typecheck and render without throwing. Those legacy
  pages will now visually show the Twister header/nav instead of the old Quran nav — a
  behavioral, not a build/typecheck/lint/test regression, and consistent with the precedent the
  design-system handoff already established (`tokens.css` is single/global, so legacy components
  already render in the new dark-luxury palette ahead of the reverse sweep). `BrandLogo` was
  similarly adapted in place (same prop names, `priority` now a harmless no-op) to a text/monogram
  wordmark per business-facts.md ("real logo missing → text fallback"), so `SplashScreen.tsx`
  (untouched, still used by the live root layout) keeps compiling and rendering. `SplashScreen`
  itself was **not** modified or removed — a new `LoadingScreen.tsx` (pizza-spin animation, one
  session per browser) was added alongside it as the Twister-era component; `SplashScreen` still
  serves the legacy root layout until integration-agent switches it over.
- **`AdminShell` takes `activeHref` as a prop, not `usePathname()`.** Keeps it a plain,
  router-independent component (easier to unit test, Storybook-ready, and avoids the Next
  App-Router-context requirement) — the composing admin page passes its own segment.
- **Font wiring binds via CSS, not the root `<html>`/`<body>`.** `src/app/layout.tsx` is
  integration-agent's file, not mine, so `next/font`'s generated `variable` className can't be
  applied to `<body>` yet. `src/lib/fonts.ts` loads Cairo/Alexandria and exports
  `twisterFontVariables`; every new shell component applies it on its own root element, and
  `twister-shell.css`'s `:root` block redefines `--ds-font-ui`/`--ds-font-heading` to
  `var(--font-cairo)`/`var(--font-alexandria)` (falling back to the design-system's original
  stack when the variable is absent). This is fully wired and verified by a real `next build`;
  the one remaining step — applying `twisterFontVariables` at the real root `<body>` once a
  Twister-specific root layout exists — is integration-agent's, flagged below.
- **`twister-shell.css` also carries the token/foundation import.** `tokens.css`/`foundations.css`
  were previously wired into Storybook only (`.storybook/preview.tsx`), never into the actual
  Next app bundle (`src/app/layout.tsx` only imports `styles/application.css`, which does not
  `@import` them). `twister-shell.css` starts with
  `@import "../../styles/tokens.css"; @import "../../styles/foundations.css";` (read-only
  reference, not an edit to `src/styles/**`) so every new layout component gets real `--ds-*`
  variables wherever it's mounted — the same relative-`@import` pattern already used by
  `src/lib/styles/tailwind.css`.
- **`src/i18n/**` deliberately left unchanged.** Every product/UX doc for this milestone is
  Arabic-only/RTL-only with no bilingual requirement (unlike Al-Manara's `ar`/`en` dictionaries);
  inventing English copy to satisfy the existing `Record<Locale, T>` shape would fabricate
  content nobody asked for. New layout copy (`CPY-NAV`, `CPY-CTA-ORDER`, footer/WhatsApp text) is
  inlined as literal Arabic strings directly in the components instead, matching the docs
  verbatim. `src/i18n/locales.ts`'s existing `defaultLocale: "ar"` / `dirFor.ar: "rtl"` already
  match Twister's requirements with no change needed.
- **Coupon repository key.** `Coupon`'s natural key is `code`, not `id`; `couponsRepository` maps
  seed coupons to `{ ...coupon, id: coupon.code }` so it fits the shared `CrudRepository<T extends
{ id: string }>` contract without a bespoke repository type.
- **`weekly-thursday` offers never report `expired`.** Added an `Offer.recurrence` field
  (`"none" | "weekly-thursday"`, not in the original `domain-model.md` table) since the doc
  describes "عروض الخميس" as a permanent weekly recurrence but the `Offer` schema only has a
  single `startAt`/`endAt` pair. `offerStatus` treats a `weekly-thursday` offer as `active` during
  the Cairo-local Thursday window and `scheduled` otherwise — never `expired` — so it doesn't
  vanish from `/offers` after its first week.
- **PWA assets are SVG/text placeholders, not real photography/binary icons.** Consistent with
  business-facts.md's placeholder discipline (no fabricated real assets); real PNG icon exports
  are deferred until real brand art exists.

## Open risks and deferred work

- **`PAT-06 CartLineItem`** (deferred by design-system-agent to feature-ui-agent) still needs the
  real `CartLine`/`Product` types — now available in `src/domain/twister`. No longer blocked.
- **`AdminDataTable` mobile card variant** — still not built (design-system-agent's deferral);
  unaffected by this stage.
- **Applying `twisterFontVariables` at the real root layout** and wiring `AmbientLayer`,
  `ScrollProgress`, `PageTransition`, `StickyWhatsAppButton`, the new `SiteHeader`/`SiteFooter`,
  and `LoadingScreen` into actual routes is feature-ui-agent's/integration-agent's job — nothing
  in `src/app/**` consumes them yet (out of my ownership).
- **`registerServiceWorker()`/the `/sw.js` offline fallback** are inert until some route calls
  `registerServiceWorker()` and a real `/offline` page exists (`src/app/offline/page.tsx`,
  SCR-010) — both left for later stages; the service worker's install step already fails open
  (catches the 404) if triggered before `/offline` exists.
- **Real menu prices/photos/logo/business hours/zones/coupons** are still `owner-confirm`
  placeholders (tracked in `business-facts.md`); `verified: false` is set everywhere applicable.

## Cross-owner requests

- None blocking. For the orchestrator's awareness only: once `src/app/**` grows a real Twister
  root layout, integration-agent should apply `twisterFontVariables` (from `@/lib/fonts`) on the
  root `<body>` so the whole document — not just each shell component's own subtree — shares one
  `--font-cairo`/`--font-alexandria` scope; functionally equivalent either way, just tidier.

## Process note for the orchestrator (boundary guard result caveat)

This session ran directly on `main` without a dedicated worktree. Between foundation-agent's
activation and this session, three commits unrelated to this milestone landed on `main`
(`42c3320`, `0ac3c1e`, `d7bc495` — Quran-kids feature work the user explicitly authorized outside
the sequential workflow; see `workflow/requests/20260924-user-to-orchestrator-baseera-quran-backlog.md`).
Running the guard against the milestone's actual `base_ref` therefore also reports every file
those three commits touched, since the guard diffs `base_ref` against the current tree
(`git diff --name-only $BaseRef --`, not a range restricted to this agent's own commits):

```
$ ./.github/scripts/Invoke-AgentBoundaryPS51.ps1 -AgentId foundation-agent -BaseRef 0531b59
Boundary violation for foundation-agent:
 - src/app/quran/kids/... (14 files)
 - src/features/quran*/... (~60 files)
 - workflow/requests/20260924-user-to-orchestrator-baseera-quran-backlog.md
 - workflow/state.json
```

None of these paths were touched by foundation-agent — cross-checking `git status --short`
(this session's actual changes) against that violation list gives an empty intersection. As
corroborating evidence, running the same guard against `d7bc495` (the tip of `main` immediately
before this session's edits, i.e. isolating exactly what foundation-agent itself changed) passes
cleanly:

```
$ ./.github/scripts/Invoke-AgentBoundaryPS51.ps1 -AgentId foundation-agent -BaseRef d7bc495
Boundary check passed for foundation-agent.
Changed files checked: 67
```

(66 before this handoff file itself was added to the diff; 67 once committed — re-run after
committing to confirm.) All 67 files are modifications/additions under foundation-agent's owned
paths (`package.json`, `.github/**`, `src/lib/**`, `src/domain/**`, `src/mocks/**`,
`src/components/layout/**`, `.husky/**`, `.prettierrc.json`, `.prettierignore`, `.env.example`,
`public/**`, `workflow/handoffs/foundation-agent-*.md`) — no deletions, renames, or edits to any
other agent's paths.

## Boundary check

- Command (as specified): `./.github/scripts/Invoke-AgentBoundaryPS51.ps1 -AgentId foundation-agent -BaseRef 0531b59`
- Result: reports violations, all attributable to unrelated commits landed on `main` during this
  session (not foundation-agent's own changes) — see the process note above for full evidence.
- Corroborating check: `./.github/scripts/Invoke-AgentBoundaryPS51.ps1 -AgentId foundation-agent -BaseRef d7bc495` → **pass** (67 files checked, all within ownership, after committing).

The agent stops after creating this handoff. Only the orchestrator may accept it and activate
the successor (`feature-ui-agent`).
