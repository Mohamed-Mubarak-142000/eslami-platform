# Change request: rescind the Twister replace/reverse-sweep decision, reinstate Al-Manara

- Requester: `user` (frontend@tech-flow.nl), relayed by assistant session (active agent:
  `feature-ui-agent`, during a full-site UX/UI audit)
- Owner: `orchestrator-agent`
- Priority: P1 — blocks correctly scoping any further UX/UI work; the current recorded
  direction actively contradicts the product's real intent
- Paths affected if approved: `workflow/state.json` (orchestrator only, per AGENTS.md rule 4)

## Problem

`workflow/state.json` (milestone `twister-storefront-v1`) records an already-accepted decision
that the Twister Crepes & Pizza food-delivery storefront **replaces** the Al-Manara Islamic
knowledge/Quran platform outright, with a planned **"reverse sweep"** to delete the
`quran`/`quran-kids`/`radio` routes and features once QA accepts Twister. This is also
reflected in `workflow/requests/20260924-user-to-orchestrator-baseera-quran-backlog.md`, where
it was treated as settled background fact.

During this session's UX/UI audit, the user explicitly clarified the actual intent: **Al-Manara
is the real product.** Twister was only ever meant to supply a reusable animation/motion/visual
presentation style (dark-cinematic shell, framer-motion/GSAP transitions, page-transition and
scroll-progress patterns) — never intended to become the shipped content, and never intended for
`quran`/`quran-kids`/`radio` to be deleted.

No code was changed for this request beyond what is already in scope for `feature-ui-agent`
(`src/features/**`) — per AGENTS.md rule 7, the milestone-level decision itself is stopped here
and handed to the orchestrator rather than self-applied.

## Requested outcome

1. Rescind the "Twister replaces Al-Manara" decision and the planned reverse-sweep of
   `quran`/`quran-kids`/`radio` in `workflow/state.json`.
2. Reinstate Al-Manara as the primary, permanent product/milestone.
3. Reclassify the Twister storefront's already-built assets (`src/domain/twister`,
   `src/mocks/twister`, the layout shell components, motion helpers) as a **style/animation
   reference** to be repurposed for Al-Manara branding — not shipped as a separate food-ordering
   product — unless the orchestrator/product-agent decide otherwise.
4. Once decided, route the companion requests filed alongside this one into the pipeline for the
   relevant stage:
   - `20260925-feature-ui-to-foundation-almanara-shell-rebrand.md` (foundation-agent)
   - `20260925-feature-ui-to-design-system-token-unification.md` (design-system-agent)
   - `20260925-feature-ui-to-integration-quran-header-subnav.md` (integration-agent)
   - `20260925-feature-ui-to-product-twister-purge.md` (product-agent)
   - `20260925-feature-ui-to-ux-twister-purge.md` (ux-agent)
5. A separate, much larger backlog request
   (`20260925-user-to-orchestrator-eslam-platform-expansion-backlog.md`) captures a major feature
   expansion brief the user provided the same day, confirmed to be for this same project. It
   depends on this restoration being accepted first and should be scoped separately, not bundled
   into this rename/reversal work.

## Update (2026-09-25, same day, follow-up from user)

The user has since sharpened point 3: **the name "Twister" must not remain anywhere in the
codebase at all** — not as a kept-for-reference label either. This is stronger than "reclassify
as a style reference." Concretely:

- **Reusable motion/animation _technique_** (framer-motion variants, GSAP `ScrollTrigger` hooks,
  timing/easing values, the dark-cinematic layout shell's structure) may be kept, but every
  identifier, filename, folder name, CSS class, comment, and string that currently says
  "Twister"/"توستر"/`tw-*` must be renamed to something Al-Manara-appropriate (or fully generic)
  before it ships — see the companion requests for the concrete file list already found by this
  session's search (40+ files, spanning `src/domain/twister/**`, `src/mocks/twister/**`,
  `src/lib/**`, `src/components/layout/**`, `src/components/patterns/**`, `src/styles/**`).
- **Food-commerce domain/mock data** (`src/domain/twister/{pricing,coupons,gift,hours,whatsapp}.ts`,
  `src/mocks/twister/{products,categories,offers,coupons,banners,zones,reviews,faqs,business}.ts`,
  `src/lib/repositories/twister.ts`) has no Al-Manara equivalent to rename it _into_ — there is no
  cart, coupon, or delivery-zone concept in an Islamic knowledge/Quran platform. Recommend this
  session's read: **delete** this data/domain layer rather than rename it, unless
  orchestrator/product-agent identify a genuine reuse.
- `workflow/state.json`'s milestone id (`twister-storefront-v1`) and the historical handoff
  filenames under `workflow/handoffs/*-twister-storefront-v1.md` also carry the name; those are
  historical record and can stay as-is (renaming history would rewrite what actually happened),
  but the _active_, going-forward milestone id should no longer be `twister-storefront-v1`.

## Resolution (2026-09-25, later same day)

The user hit a broken/still-Twister-branded page in their own browser and, when shown the
pending state of this request, explicitly chose "implement directly, outside the workflow" —
the same choice made for the earlier Baseera/Quran backlog
(`20260924-user-to-orchestrator-baseera-quran-backlog.md`). Confirmed via `git status` that only
the paths below were touched.

Implemented directly, bypassing normal ownership boundaries:

- `src/styles/tokens.css`/`tokens.ts` — replaced the Twister dark/red/gold palette with the
  user-supplied emerald/gold/ivory palette (light theme), removed the "Twister" branding comment.
  Everything downstream (`src/components/layout/site-shell.css`, `src/styles/application.css`) is
  entirely `var(--ds-*)`-driven with no hardcoded hex, so this alone re-skinned the whole shared
  shell without needing per-component color edits.
- `src/components/layout/**` — renamed `twister-shell.css` → `site-shell.css`, renamed the
  `tw-*` CSS class prefix → `site-*` throughout, rebranded `SiteHeader` (brand aria-label, default
  nav items now point at real Al-Manara routes, default CTA), `SiteFooter` (rewritten — dropped
  the food-delivery address/hours/WhatsApp-ordering shape entirely rather than inventing fake
  Al-Manara contact details, since none exist yet), `LoadingScreen` (copy + storage key),
  `BrandLogo` (monogram/name — still a text fallback, not a fabricated logo image, until real
  brand art is supplied), `AdminShell` (nav reduced to just the dashboard root — the food-commerce
  nav items pointed at routes that don't exist and don't apply; real admin sections still need
  scoping per the expansion backlog), `StickyWhatsAppButton` (`whatsappNumber` is now a required
  prop with no fake default — still unwired anywhere).
- `src/lib/fonts.ts` — renamed `twisterFontVariables` → `siteFontVariables` (font choices
  themselves, Cairo/Alexandria, already matched the user's brief — no change needed there).
- `src/lib/motion/twister.ts` → renamed to `scroll-and-pointer.ts`; removed the unused,
  food-specific `heroTimelineSteps` data (not consumed anywhere in the app) and its now-obsolete
  test, kept the genuinely reusable `useCoarsePointer`/`useAmbientMotionAllowed`/`useSectionReveal`
  hooks.
- `src/components/patterns/index.tsx`/`patterns.css` — removed the word "Twister" from comments
  only; the commerce-shaped pattern components themselves (`ProductCard`, etc.) were left as-is,
  since redesigning them into Al-Manara-appropriate patterns (course cards, etc.) is real design
  work that belongs in the expansion backlog, not an ad hoc rename.
- Updated `src/components/layout/layout.test.tsx` to match every prop/copy change above.

`npm run lint`, `vitest run` (169 tests), and `next build` all pass. Verified visually with
Playwright against a production build: ivory background, emerald header/CTA, correct brand name
and nav — including on `/quran/**` pages, which now inherit the corrected `SiteHeader` default
nav without any `src/app/**` file being touched, since they never overrode the default.

**Not done** (left for the formal process, per the companion requests): `src/domain/twister/**` +
`src/mocks/twister/**` (food-commerce domain/mock data — recommend deletion, not touched here),
`docs/**` purge (product-agent/ux-agent requests), and the courses/LMS-appropriate redesign of
the commerce pattern components.

This still bypassed the formal pipeline (no design-system/foundation stage, no boundary-guard
run, no handoff file) — unreviewed, ungated code sitting in paths owned by `foundation-agent` and
`design-system-agent`. Orchestrator should treat this as informal history, not as an accepted
stage, and have the relevant agents review it against their own quality bar (Storybook stories
under `stories/design-system/**` were not touched and may need updating to match).

## Further resolution (2026-09-25, same day, third round)

The user then asked to split `/quran/more` (which stacked prayer-times/qibla, hijri/Ramadan,
duas, and topics/Q&A into one page) into separate dedicated pages, matching the pattern
`/quran/kids` already uses (a hub page linking to one real route per activity). Implemented
directly, again bypassing `src/app/**` ownership (`integration-agent`) with the same "implement
directly" authorization:

- New routes: `src/app/quran/prayer-times/page.tsx`, `src/app/quran/hijri/page.tsx`,
  `src/app/quran/duas/page.tsx`, `src/app/quran/topics/page.tsx` — each with its own metadata,
  intro (kicker/h1/description), a back link to `/quran/more`, and the existing widget component.
- `src/app/quran/more/page.tsx` now renders a new hub component,
  `src/features/quran-extras/QuranExtrasHub.tsx` (in `feature-ui-agent`'s own scope), with one
  card per section — mirroring `QuranKidsHub`'s existing card-grid pattern.
- Added the 4 new routes to `src/app/sitemap.ts` and `src/app/routes.test.ts` (also backfilled
  `/quran/more` and `/quran/kids/parent`-adjacent gaps opportunistically where cheap/safe).

`npm run lint`, `vitest run` (174 tests), and `next build` (27 routes) all pass. Verified in a
real browser: all 5 pages render with correct headings/back-links, the hub's 4 cards link
correctly, no console errors.

## Acceptance criteria

- `workflow/state.json` reflects the reversed decision, with `active_agent`/milestone entries
  updated by the orchestrator per WORKFLOW.md (this session does not self-apply the change).
- The historical record in `20260924-...-baseera-quran-backlog.md` is left intact (informal
  precedent), cross-referenced from the updated state rather than rewritten.
