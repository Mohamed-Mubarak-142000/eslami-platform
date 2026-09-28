> **Status update (2026-09-25, later same day):** most of this was implemented directly,
> bypassing the formal process, after the user hit a broken/still-Twister page and asked for it
> to be fixed immediately — see the "Resolution" section in
> `20260925-user-to-orchestrator-almanara-restore.md` for exactly what changed. Still open from
> this request: `src/domain/twister/**`/`src/mocks/twister/**` (not touched — recommend deletion,
> not rename), and reviewing the informal changes against `foundation-agent`'s own quality bar.

# Change request: rebrand and wire up the shared layout shell for Al-Manara

- Requester: `feature-ui-agent` (during a full-site UX/UI audit, 2026-09-25)
- Owner: `foundation-agent` (owns `src/components/layout/**`, `src/lib/**`)
- Priority: P1 — the header/footer shell is currently food-storefront-branded and renders on
  every page of the real product (Al-Manara)
- Paths affected if approved: `src/components/layout/**`, `src/app/layout.tsx` (integration-agent
  for the root-layout wiring half of this)
- Depends on: `20260925-user-to-orchestrator-almanara-restore.md` (decision on Twister's status)

## Problem

`SiteHeader.tsx` hardcodes Twister-specific content that cannot be overridden via props:

- Brand `aria-label="توستر كريبس آند بيتزا — الرئيسية"` (`SiteHeader.tsx:62`) — no `brandName`/
  `brandAriaLabel` prop exists.
- CTA is unconditionally rendered (`ctaLabel`/`ctaHref` default to `"اطلب الآن"`/`"/menu"`, but
  there's no way to omit it entirely for a page where a "cart-style" CTA makes no sense).
- `defaultSiteHeaderNavItems` (`SiteHeader.tsx:18-25`) links to `/menu`, `/offers`, `/#zones`,
  `/reviews`, `/contact` — none of which exist in `src/app/**`.

Additionally, several already-built, reusable layout/motion components are never rendered
anywhere in the app: `SiteFooter.tsx` (Twister copy: "بيتزا وكريب وبرجر", WhatsApp order CTA),
`StickyWhatsAppButton.tsx` (Twister-specific), `LoadingScreen.tsx` (copy: "بنجهزلك المنيو…",
storage key `twister-loading-shown`), `PageTransition.tsx` (brand-neutral framer-motion
fade/rise, respects `useReducedMotion`), `ScrollProgress.tsx` (brand-neutral framer-motion
`useScroll`/`useSpring` progress bar), `AmbientLayer.tsx` (brand-neutral particle/cursor-glow
effect, already reduced-motion/coarse-pointer aware). `SplashScreen.tsx` is the only one already
correctly Al-Manara-branded and wired into `src/app/layout.tsx`.

`feature-ui-agent` cannot make any of these changes directly — `src/components/layout/**` and
root-layout wiring are outside its ownership (`src/features/**` only), per
`workflow/ownership.json` and AGENTS.md rule 1.

## Requested outcome

1. Add a `brandName`/`brandAriaLabel` prop (or equivalent) to `SiteHeader` so callers can supply
   "المنارة" instead of the hardcoded Twister label; make the CTA slot fully optional
   (`ctaLabel`/`ctaHref` already default-optional for content, but consider allowing omission of
   the CTA link entirely for pages with no relevant primary action).
2. Rebrand `SiteFooter.tsx` and `LoadingScreen.tsx` copy for Al-Manara (or provide prop-driven
   copy so `feature-ui-agent` can supply it per page/section).
3. Decide the fate of `StickyWhatsAppButton.tsx` (repurpose for an Al-Manara contact channel, or
   remove if not applicable).
4. Wire `SiteFooter`, `PageTransition`, `ScrollProgress`, and `AmbientLayer` into the real root
   layout (`src/app/layout.tsx`, integration-agent) so every Al-Manara page gets the polish these
   components already provide instead of ending abruptly with no footer/transition/progress
   indicator.

## Update (2026-09-25, follow-up from user): the name "Twister" must not remain anywhere

The user has clarified this isn't just a rebrand of _visible_ copy — the word "Twister" (and its
Arabic transliteration "توستر") must not remain anywhere in the codebase: not in filenames, CSS
class prefixes, exported identifiers, or comments. This session searched `src/**` and found it
in these `foundation-agent`-owned files (in addition to the components already listed above):

- `src/components/layout/twister-shell.css` — rename the file and every `tw-*` class it defines
  (`SiteHeader.tsx`/`SiteFooter.tsx`/`StickyWhatsAppButton.tsx` etc. reference these classes and
  would need updating in lockstep).
- `src/components/layout/BrandLogo.tsx`, `AdminShell.tsx` — check for residual "Twister"/"توستر"
  strings or comments.
- `src/lib/fonts.ts` — `twisterFontVariables` export (imported by `SiteHeader.tsx`) needs
  renaming.
- `src/lib/motion/twister.ts` (+ `twister.test.ts`, and the barrel `src/lib/motion/index.ts`) —
  rename the file/exports; per the companion request to `orchestrator-agent`
  (`20260925-user-to-orchestrator-almanara-restore.md`), the _technique_ (GSAP scroll-reveal
  hooks, coarse-pointer/reduced-motion gating) is worth keeping, only the naming needs to change.
- `src/lib/analytics.ts`, `src/lib/pwa.ts`, `src/lib/storage.ts`, `src/lib/format.ts` — check for
  Twister-specific event names/keys/copy mixed into otherwise-generic utilities.
- `src/lib/repositories/twister.ts` (+ references in `src/lib/repositories/index.ts`,
  `local-crud-repository.ts`, `types.ts`) and the entire `src/domain/twister/**` +
  `src/mocks/twister/**` trees (pricing/coupons/gift/hours/whatsapp domain logic; product/
  category/offer/banner/zone/review/FAQ mock data) — this is food-commerce data with no Al-Manara
  equivalent to rename it into; this session's recommendation is to **delete** it rather than
  rename it, pending confirmation from orchestrator/product-agent (see the companion request to
  `orchestrator-agent` for the full reasoning).
- `public/manifest.webmanifest`, `public/sw.js`, `public/icons/icon.svg`,
  `public/images/placeholder-banner.svg`, and `.env.example` — PWA metadata/icons and env sample
  also carry Twister naming/branding and need updating to Al-Manara's identity.

## Acceptance criteria

- `SiteHeader`/`SiteFooter` render Al-Manara branding without any `src/features/**` file needing
  to work around hardcoded Twister strings.
- `PageTransition`/`ScrollProgress`/`AmbientLayer` are actually visible when navigating the app.
- Existing Storybook stories/tests for these components are updated accordingly.
