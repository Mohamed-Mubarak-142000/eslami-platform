# Change request: purge "Twister" naming from UX docs

- Requester: `feature-ui-agent` (during a full-site UX/UI audit, 2026-09-25; user follow-up: "لازم
  ميكونش فيه حاجة اسمها Twister خالص" — there must be nothing called Twister at all)
- Owner: `ux-agent` (owns `docs/ux/**`)
- Priority: P2 — documentation/process, not runtime, but explicitly requested by the user
- Paths affected if approved: `docs/ux/**` files referencing Twister (information architecture,
  microcopy, states docs referenced as `LAY-A`/`CPY-NAV`/`CPY-CTA-ORDER` etc. in
  `src/components/layout/SiteHeader.tsx`'s own comments)
- Depends on: `20260925-user-to-orchestrator-almanara-restore.md` (decision on Twister's status)

## Problem

A repo-wide search for "twister" (case-insensitive) found it in `docs/ux/**` alongside the
runtime code covered by the companion requests to `foundation-agent`/`design-system-agent`. These
UX docs are the specification `SiteHeader.tsx`/`SiteFooter.tsx` currently implement verbatim
(6-item Twister nav, "اطلب الآن" CTA, cart slot) — per the companion request to
`foundation-agent` (`20260925-feature-ui-to-foundation-almanara-shell-rebrand.md`), that
implementation is being rebranded for Al-Manara, so the UX spec driving it needs to change too or
the two will drift apart again.

## Requested outcome

1. Update (or archive, if superseded) the Twister-era information-architecture/microcopy specs in
   `docs/ux/**` to reflect Al-Manara's actual navigation once `foundation-agent`/`integration-agent`
   land the header rebrand, so the docs stay the source of truth rather than a stale spec for a
   product that no longer ships.
2. Remove "Twister" naming from any doc kept as an active (non-archived) spec.

## Acceptance criteria

- No active (non-archived) file under `docs/ux/**` references "Twister" or specifies Twister-era
  navigation/copy as the current contract.
