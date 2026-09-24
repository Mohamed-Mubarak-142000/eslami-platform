# Change request: evaluate a Baseera/Quran feature backlog against the Al-Manara reverse sweep

- Requester: `user` (frontend@tech-flow.nl), relayed by assistant session
- Owner: `orchestrator-agent`
- Priority: P2 — no urgency, informational until a decision is made
- Paths affected if approved: `docs/product/**` (product-agent), `src/features/quran/**`,
  `src/features/quran-kids/**` (feature-ui-agent), `src/app/quran/**` (integration-agent)

## Problem

`workflow/state.json` records an already-accepted decision: this milestone
(`twister-storefront-v1`) replaces the old Al-Manara/Baseera Islamic content platform, and a
"reverse sweep" will delete `quran`/`quran-kids`/`radio` routes and features after QA accepts
Twister. The user has since asked, in conversation, for a list of new features to add to that
same Islamic/Quran section (`src/features/quran-kids/**`, `src/features/quran/**`).

These two intents conflict: implementing new Quran/kids features now would (a) touch paths
outside `foundation-agent`'s current ownership, (b) expand scope mid-milestone without
orchestrator approval, and (c) contradict the recorded, user-approved reverse-sweep decision.
No code was changed for this request — only this backlog is recorded, per AGENTS.md rule 7
("stop that part and create a change request; never expand scope silently").

## Requested outcome

Orchestrator to decide, whenever appropriate, one of:

1. Reopen Baseera/Quran as its own milestone (rescinding or postponing the reverse sweep) and
   route this backlog to `product-agent` for scoping into stories/acceptance criteria.
2. Keep it as backlog only (no milestone yet) — this file stands as the record.
3. Confirm the reverse sweep proceeds as planned and this backlog is discarded/archived with it.

## Candidate feature backlog (unscoped ideas, not acceptance criteria)

### Quran Kids (builds on existing `src/features/quran-kids/**`)
- Parent-facing progress view, gated by a local PIN (same pattern as Twister's local admin
  login), summarizing each child's status from `progressStorage.ts`/`badges.ts`.
- Daily streak counter layered on top of the existing badge system.
- Printable/PDF completion certificate when a `SurahMemorizationChecklist` is finished.
- Child recites into the mic and plays it back next to the reciter's audio from
  `kidsAudioApi.ts` (comparison only, no scoring/AI grading).

### Quran (adults) — builds on `src/features/quran/**`
- "Resume where you left off" last-read-position sync via `localStorage`.
- Simple spaced-repetition review schedule for memorized ayat.
- Tap-to-reveal short tafsir on an ayah instead of text-only display.

### Lightweight additions consistent with the original Baseera MVP's exclusions (no
chat/groups/live)
- Prayer times + qibla direction (public API + browser geolocation, no backend needed).
- Hijri calendar and a Ramadan mode (fasting countdown) that auto-activates by date.
- Dua/supplications list with audio, reusing the existing radio/audio player primitives.

### From the original archived Baseera product plan (`almanara-final` tag), not yet built
- Scholar profile pages and topic pages.
- Sourced, verified Q&A content.

## Acceptance criteria (for whichever path the orchestrator picks)

- If reopened: a new `milestone` entry in `workflow/state.json` with its own `base_ref`,
  `active_agent` set to `product-agent`, and this backlog attached as raw input.
- If archived: a one-line note added to `workflow/state.json.notes` closing this request, and
  this file left as the historical record (per WORKFLOW.md, requesters do not self-apply).

## Resolution (2026-09-24)

The user explicitly chose "implement directly, outside the workflow" rather than any of the
three paths above — confirmed after being asked point-blank whether that meant pausing the
in-flight `twister-storefront-v1` milestone (it does not; `workflow/state.json` was left
untouched and `foundation-agent`'s active task list is unaffected).

Implemented, confined to `src/features/quran/**`, `src/features/quran-kids/**`,
`src/features/quran-extras/**` (new), and `src/app/quran/**` only — verified via `git status`
that no other in-progress Twister files were touched:

- Kids: parent PIN-gated dashboard, daily streak, printable completion certificate,
  recite-and-compare recorder (MediaRecorder, in-memory only), spaced-repetition review
  schedule.
- Adults: "resume where you left off" (surah-level). Tap-to-reveal tafsir was already built
  (`QuranReadSurah.tsx`) — not duplicated.
- New `quran-extras` feature: prayer times + qibla (client geolocation + a public timings
  API), Hijri date + Ramadan banner (`Intl` islamic-umalqura calendar, no new dependency),
  a curated short-duas list with browser text-to-speech, and a topics/Q&A placeholder shell
  from the archived "بصيرة" vision — the last one intentionally left generic/labeled as a
  sample, not attributed to any named scholar or presented as verified fatwa content.

No new npm dependencies were added (browser-native APIs only: `MediaRecorder`,
`SpeechSynthesis`, `Intl`, `crypto.subtle`, geolocation) — `package.json` stays
`foundation-agent`-only per AGENTS.md rule 3. `npm run lint`, `vitest run` (full suite, 161
tests), and `next build`'s compile step all pass; `next build`'s typecheck step fails only on
pre-existing, unrelated errors in `src/domain/twister/**` and `src/mocks/twister/**`
(foundation-agent's own in-progress uncommitted work, confirmed via `git status` before and
after this change).

This still bypassed the formal pipeline (no product/ux/design stages, no boundary-guard run,
no handoff file), so it is not a substitute for a real milestone if this work is meant to ship
— it is unreviewed, ungated feature code sitting in owned-by-feature-ui-agent /
owned-by-integration-agent paths. Orchestrator should treat this as informal history, not as
an accepted stage.
