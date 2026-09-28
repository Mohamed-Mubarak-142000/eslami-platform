# Change request: scope a major "Eslam Platform" expansion brief into the pipeline

- Requester: `user` (frontend@tech-flow.nl), relayed by assistant session (active agent:
  `feature-ui-agent`)
- Owner: `orchestrator-agent`
- Priority: P2 — informational/backlog until scoped; no urgency, but large enough to need
  deliberate sequencing rather than ad hoc implementation
- Paths affected if approved: essentially all of `src/**`, `docs/**`, plus new backend/auth
  infrastructure — this is milestone-sized, not a single-agent task
- Depends on: `20260925-user-to-orchestrator-almanara-restore.md` (Al-Manara must be the
  confirmed active milestone before this backlog is scoped against it)

## Problem

The user provided a comprehensive build brief for "منصة إسلام — Eslam Platform" — confirmed to be
the **same project as Al-Manara** (not a separate product), with a concrete visual identity
(palette already forwarded to `design-system-agent` in
`20260925-feature-ui-to-design-system-token-unification.md`) and a large functional scope:
a Quran reader, Hadith, daily Adhkar, a full course/LMS module, an articles/library CMS, personal
learning dashboard, admin CMS with CRUD, real authentication, PWA/offline behavior, and specific
performance/accessibility/SEO targets.

This is far larger than a `feature-ui-agent` task — it touches nearly every path owned by every
other agent (`foundation-agent`: config/domain/lib/layout; `design-system-agent`: tokens/ui/
patterns; `integration-agent`: routes/backend integration; `product-agent`/`ux-agent`: scoping
and information architecture; `qa-agent`: a much larger surface to verify) and includes entirely
new product surface (courses/lessons/instructors, an articles CMS, a real admin backend, real
auth) that doesn't exist in the current Al-Manara feature set at all. Per AGENTS.md rule 7 and
rule 8 (no silent scope expansion, pipeline is sequential, not one agent doing everything), this
session is recording it here rather than attempting to build it directly.

## What already exists vs. what's new

Checked against the current Al-Manara feature set (`src/features/quran/**`,
`src/features/quran-kids/**`, `src/features/quran-extras/**`) before filing this, so the backlog
below reflects real gaps, not guesses:

**Quran reader** (`src/features/quran/**`) — already has: surah list, tap-to-reveal tafsir,
previous/next navigation, resume-last-surah. This session additionally implemented (in scope,
already shipped): search by surah number, adjustable reading font size, and copy-ayah-with-
reference (`QuranReadIndex.tsx`, `QuranReadSurah.tsx`). Still missing: juz navigation,
per-ayah bookmarking (only surah-level "resume" exists), multiple reading themes (light/dark/
warm), a sourced translation panel (tafsir exists, a separate translation edition does not).

**Adhkar** (`src/features/quran-extras/duas/**`) — this session added the category taxonomy
(morning/evening/sleep/after-prayer/general) and a tap counter with reset + completed state
(`DuasList.tsx`, `duasData.ts`), reusing only the small set of already-seeded, low-transcription-
risk duas — no new religious text was authored. The "morning"/"evening"/"after-prayer" categories
currently render an honest empty state rather than invented content; populating them requires a
verified Adhkar dataset (e.g. a reviewed Hisn al-Muslim-equivalent source), which is exactly the
kind of content-sourcing decision this backlog flags for `product-agent`/a religious reviewer,
not something to fabricate.

**Genuinely new, not built at all**: Hadith module (topic browsing, search, grading/attribution
display), Courses/Lessons/LMS (catalog, filters, course detail, lesson video/audio player,
curriculum sidebar, progress), Articles/resource library (listing, article page, TOC), personal
learning dashboard (enrolled courses, notes, reading preferences), Admin CMS (courses/lessons/
articles CRUD, review workflow, revision history), real authentication/backend persistence
(current auth is demo/local-only per the existing codebase), About/Contact pages with a real
submission backend, expanded PWA/offline behavior, and the specific Lighthouse/WCAG 2.2 AA/SEO
structured-data targets called out in the brief.

## Guardrails from the user's own brief (carry these into whichever agent picks this up)

These are the user's own stated constraints and should not be lost when this is scoped into
tickets:

- Never generate/reconstruct Quran text from memory — use a verified dataset/provider, preserve
  orthography and diacritics, attribute translations and tafsir separately from the Quran text
  itself.
- Never invent a Hadith, its attribution, or its authenticity grading.
- Never invent repetition counts, religious rewards, or Adhkar text not sourced from a verified
  collection — no competitive streaks or celebratory effects around worship.
- No automated fatwa generator; religious questions needing scholarly judgment need a defined
  human review process, not an AI answer.
- Do not fabricate instructor credentials, accreditation, student counts, or ratings; do not show
  downloads that lead to nonexistent files; do not autoplay media or audio.
- Admin/auth: enforce authorization server-side, never rely on a hidden route as access control;
  if no real backend exists yet, ship an explicitly labeled prototype and document what's needed
  for production rather than presenting demo persistence as real.
- Motion: sacred text (Quran/Hadith/Adhkar) must render as stable, non-animated text — no letter
  animation or decorative effects on or behind it.
- Full color palette, typography, and visual-language brief already recorded in
  `20260925-feature-ui-to-design-system-token-unification.md`.

## Requested outcome

1. Treat this as a new backlog for `product-agent` to scope into stories/acceptance criteria (a
   new milestone or a set of milestones after Al-Manara's restoration is accepted — see the
   companion request), roughly in this order of dependency:
   - Design tokens/typography (already handed to `design-system-agent`)
   - Hadith module + Adhkar content sourcing (needs a verified content source/reviewer first)
   - Quran reader gaps (juz nav, ayah bookmarks, reading themes, translation panel) — smaller,
     mostly `feature-ui-agent`-scoped once domain support (if any) is confirmed
   - Courses/Lessons/LMS + Articles library — largest net-new surface, needs product scoping,
     new domain models, new routes, and probably a real backend for persistence
   - Admin CMS + real auth — depends on a real backend decision (currently out of scope for a
     purely frontend pipeline; needs an explicit decision on what backend/service to integrate)
   - PWA/offline, perf/a11y/SEO hardening — cross-cutting, best done incrementally per surface as
     it ships rather than as one final pass
2. Confirm whether a real backend/auth provider is being introduced at all, since large parts of
   this brief (admin CMS, real auth, course enrollment/progress sync, contact form submission)
   assume one exists; if not, scope an explicitly-labeled prototype instead, per the user's own
   brief.

## Acceptance criteria

- This backlog is either scoped into a milestone with its own `workflow/state.json` entry, or
  explicitly deferred with a note, per WORKFLOW.md (this session does not self-apply either
  outcome).
- Nothing in this backlog is implemented by skipping product/ux/design-system scoping — especially
  the religious-content and real-auth/admin-security items, which carry real correctness/liability
  risk if rushed.
