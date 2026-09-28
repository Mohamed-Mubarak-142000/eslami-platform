> **Status update (2026-09-25, later same day):** problem 1 (Twister nav on every Quran page) is
> now resolved a different way than this request originally proposed — `SiteHeader`'s _default_
> `navItems` were changed directly to Al-Manara's nav (see the "Resolution" section in
> `20260925-user-to-orchestrator-almanara-restore.md`), so every `/quran/**` page inherits the
> correct nav automatically without needing a per-page override. Problem 2 (subnav on detail
> pages) is still open. Separately, `/quran/more` was split into 4 dedicated routes
> (`/quran/prayer-times`, `/quran/hijri`, `/quran/duas`, `/quran/topics`) plus a hub — new
> `src/app/**` files `integration-agent` should be aware of/review.

# Change request: Al-Manara header override + consistent subnav on Quran route pages

- Requester: `feature-ui-agent` (during a full-site UX/UI audit, 2026-09-25)
- Owner: `integration-agent` (owns `src/app/**`)
- Priority: P1 for the header override (every `/quran/**` page currently shows food-storefront
  navigation), P2 for the subnav consistency item
- Paths affected if approved: all `src/app/quran/**/page.tsx` files
- Depends on: `20260925-user-to-orchestrator-almanara-restore.md` (decision on Twister's status)

## Problem 1 — Twister nav on every Quran page

Every route under `src/app/quran/**` (hub and detail pages alike) imports `SiteHeader` from
`@/components/layout` and renders it with no `navItems`/`ctaLabel` override, so it falls back to
`defaultSiteHeaderNavItems` — the Twister storefront's menu/offers/order-now nav. A user reading
Quran or in the kids learning area currently sees "Order Now → Menu" navigation.

This session already fixed the equivalent issue in `src/features/landing/LandingPage.tsx` (in
scope: `src/features/**`), passing an Al-Manara `navItems` array plus `ctaLabel`/`ctaHref`:

```tsx
const alManaraNavItems: readonly SiteHeaderNavItem[] = [
  { href: "/", label: "الرئيسية" },
  { href: "/quran", label: "القرآن الكريم" },
  { href: "/quran/kids", label: "تعليم الأطفال" },
  { href: "/quran/more", label: "الأدعية ومواقيت الصلاة" },
  { href: "/#why", label: "لماذا المنارة" },
];
...
<SiteHeader isAuthenticated={isAuthenticated} navItems={alManaraNavItems} ctaLabel={joinLabel} ctaHref={primaryHref} />
```

The same override needs to be applied everywhere `SiteHeader` is rendered under
`src/app/quran/**` — but that file tree is `integration-agent`'s ownership, not
`feature-ui-agent`'s, so it isn't done in this session.

(Note: `SiteHeader`'s brand `aria-label` and CTA are still partly hardcoded inside the component
itself — see the companion request
`20260925-feature-ui-to-foundation-almanara-shell-rebrand.md` to `foundation-agent` for the part
that can't be fixed via props at all.)

## Problem 2 — missing subnav on detail pages

`QuranSubnav` is rendered only by hub pages (`src/app/quran/page.tsx`, `.../kids/page.tsx`,
`.../read/page.tsx`, `.../more/page.tsx`). None of the one-level-deeper detail pages
(`src/app/quran/[reciterId]/page.tsx`, `.../read/[surahNumber]/page.tsx`,
`.../kids/listen/[surahNumber]/page.tsx`, `.../kids/match/[surahNumber]/page.tsx`,
`.../kids/audio/[reciterId]/page.tsx`, `.../kids/progress/[surahNumber]/page.tsx`) render it —
confirmed this is a `page.tsx`-level composition choice, not something a `src/features/**`
component controls, so it can't be fixed from this session either.

## Requested outcome

1. Apply the Al-Manara `navItems`/`ctaLabel`/`ctaHref` override (same values as
   `LandingPage.tsx`) to every `<SiteHeader>` render under `src/app/quran/**`.
2. Render `<QuranSubnav active="…">` in the detail-page files listed above, consistent with
   their hub siblings, so navigation affordance doesn't disappear exactly when a user is deepest
   in a flow.
3. Once the header override lands, the dangling nav routes (`/menu`, `/offers`, `/reviews`,
   `/contact`) are no longer linked from anywhere and don't need to be scaffolded.

## Acceptance criteria

- Visiting any `/quran/**` route shows Al-Manara navigation, never Twister's.
- Every detail page shows the same subnav its hub page does, with the correct tab marked active.
