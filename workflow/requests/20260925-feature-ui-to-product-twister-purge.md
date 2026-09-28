# Change request: purge "Twister" naming from product docs

- Requester: `feature-ui-agent` (during a full-site UX/UI audit, 2026-09-25; user follow-up: "لازم
  ميكونش فيه حاجة اسمها Twister خالص" — there must be nothing called Twister at all)
- Owner: `product-agent` (owns `docs/product/**`, `docs/*.md`, `TODO.md`)
- Priority: P2 — documentation/process, not runtime, but explicitly requested by the user
- Paths affected if approved: `docs/product/twister-storefront-v1.md` and any other
  `docs/product/**` file naming Twister, `TODO.md`, and root-level `docs/*.md` files
  (`docs/FRONTEND_ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `docs/PRODUCT_PLAN.md`) that
  reference it
- Depends on: `20260925-user-to-orchestrator-almanara-restore.md` (decision on Twister's status)

## Problem

A repo-wide search for "twister" (case-insensitive) found it in the following `product-agent`-
owned files, in addition to the runtime code already covered by the companion requests to
`foundation-agent` and `design-system-agent`:

- `docs/product/twister-storefront-v1.md` — the milestone's own product spec, named after
  Twister.
- `docs/product/{reviews-policy,admin-requirements,business-facts,menu-catalog,business-rules,
domain-model,governance,p0-requirements,personas-permissions,scope}.md` — likely reference the
  Twister storefront's product requirements (menu/cart/coupons/zones/etc.); each needs checking
  for residual naming and, per the parallel deletion recommendation in the request to
  `foundation-agent`, likely archival rather than a rename (there's no Al-Manara equivalent for a
  food-delivery menu/cart/coupon spec).
- `TODO.md`, `docs/FRONTEND_ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `docs/PRODUCT_PLAN.md` —
  root-level docs; check for residual mentions.

## Requested outcome

1. Confirm with `orchestrator-agent` (see the linked request) whether the Twister product spec is
   archived (recommended, since Al-Manara has no cart/menu/coupon/delivery-zone concept to rename
   it into) or kept as a still-active spec under a new name.
2. Once decided, remove/archive or rename the affected `docs/product/**` files and update
   `TODO.md`/root docs accordingly so no live documentation references "Twister".

## Acceptance criteria

- No file under `docs/product/**`, `TODO.md`, or root `docs/*.md` references "Twister" except
  where explicitly kept as historical/archived record (clearly labeled as such).
