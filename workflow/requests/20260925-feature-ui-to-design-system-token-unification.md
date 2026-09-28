> **Status update (2026-09-25, later same day):** `src/styles/tokens.css`/`tokens.ts` were
> rewritten directly with the palette below, bypassing the formal process — see the "Resolution"
> section in `20260925-user-to-orchestrator-almanara-restore.md`. Still open: migrating
> `quran.css`/`quran-kids.css`/`landing.css` off their own hardcoded hex values onto these tokens
> (point 3 below), `src/components/ui/**` review, and Storybook snapshot updates.

# Change request: unify design tokens under one Al-Manara identity

- Requester: `feature-ui-agent` (during a full-site UX/UI audit, 2026-09-25)
- Owner: `design-system-agent` (owns `src/styles/**`, `src/components/ui/**`,
  `src/components/patterns/**`)
- Priority: P2 — not blocking, but every Al-Manara page currently ignores the app's only formal
  token source
- Paths affected if approved: `src/styles/tokens.css`, `src/styles/tailwind-theme.css`,
  `src/styles/foundations.css`, and (informationally) the feature stylesheets listed below, which
  `design-system-agent` may want feature-ui-agent to migrate afterward via a follow-up request
- Depends on: `20260925-user-to-orchestrator-almanara-restore.md` (decision on Twister's status)

## Problem

`src/styles/tokens.css` is the single global token source, explicitly commented "Twister Crepes
& Pizza — dark-luxury cinematic brand palette (single theme, no light mode)" — dark canvas
(`#0f0f0f`), red primary (`#d62828`), gold accent (`#f4b400`), applied globally via
`body { background: var(--ds-color-canvas) }`.

Meanwhile, every Al-Manara feature stylesheet ignores these tokens completely and hardcodes its
own, different palette: `src/features/landing/landing.css` defines an undocumented
`--landing-green:#176f62` / `--landing-mint:#dff4ed` custom-property set; `src/features/quran/quran.css`
and `src/features/quran-kids/quran-kids.css` hardcode raw hex values throughout (`#dce5e1`,
`#61736f`, `#2f9e44`, `#e03131`, etc.) rather than referencing either token set. The result is two
unrelated design systems coexisting for one product, with no shared source of truth for color,
and a light-content app (Al-Manara's actual pages) sitting on top of a dark-theme-only token
file that was never meant for it.

## Requested outcome

1. Decide and publish a single Al-Manara color/typography token set in `tokens.css` — informed by
   Twister's structure (the cinematic motion timing/easing tokens, radius scale, etc. are
   brand-neutral and worth keeping) but with Al-Manara-appropriate hues rather than Twister's
   red/gold/dark-only scheme, and with a light theme since Al-Manara's current UI is light-first.
2. Publish the `--landing-*` custom properties currently ad hoc in `landing.css` as proper design
   tokens (or their replacements) so they have one authoritative home.
3. Once published, `feature-ui-agent` can follow up with a request-approved pass to migrate
   `quran.css`/`quran-kids.css`/`landing.css` off hardcoded hex values onto the new tokens.

## Update (2026-09-25, follow-up from user): the name "Twister" must not remain anywhere

Beyond re-hueing the palette, the user has clarified the word "Twister" itself must not remain
anywhere in the codebase — not in comments, identifiers, or class names. This session found it,
in addition to `tokens.css`'s header comment already noted above, in `src/styles/tokens.ts` (the
JS-side token export), `src/components/patterns/index.tsx` / `patterns.css`, and
`stories/design-system/twister.stories.tsx` + `stories/design-system/twister-story-matrix.md` —
please check these for residual "Twister"/"توستر" strings/comments and rename alongside the token
rewrite. (`storybook-static/**` is a build artifact and will regenerate once the source stories
are renamed — no need to hand-edit it.)

## Update (2026-09-25, later follow-up): user-supplied concrete palette

The user has since supplied a concrete palette and typography direction for this project
(referred to as "Eslam Platform" — confirmed to be the same project as Al-Manara, just a more
precise identity brief, not a separate product). This resolves the open "decide the hues" item
in point 1 above — the palette is a given, not a `design-system-agent` decision:

```
Primary emerald:  #005544
Deep emerald:     #003E32
Warm gold:        #CDA23E
Soft gold:        #E8D7A6
Ivory background: #FBF8F1
White surface:    #FFFFFF
Main text:        #183D34
Muted text:       #68766E
Subtle border:    #E5E6DC
```

Notes from the user's brief, worth preserving verbatim for whoever implements this:

- Gold is an accent, not a primary — ensure contrast stays readable; emerald/ivory carry most of
  the UI.
- Typography: **Alexandria** or **Cairo** for interface text; **Amiri** or **Noto Naskh Arabic**
  for editorial/long-form Arabic reading; a separate, properly licensed Quran font for verified
  Quran text specifically (not the same font as general editorial content) — do not apply
  decorative letter-spacing to Arabic text anywhere.
- Visual language cues to translate into the design system (not literal instructions to
  `design-system-agent`, but useful context for the token/component work): arch-shaped frames,
  subtle Islamic geometric patterns used sparingly, gold dividers, spacious editorial reading
  layouts, restrained shadows, generous whitespace — avoid glow/neon/particles/aggressive banners,
  and avoid any decorative animation behind or on sacred text (Quran/Hadith/Adhkar passages must
  render as stable, non-animated text).
- A companion, much larger backlog request
  (`20260925-user-to-orchestrator-eslam-platform-expansion-backlog.md`) captures the full brief
  this palette came from — see it for the broader design direction if useful context.

## Acceptance criteria

- One documented token set (using the palette above) drives both the shared layout shell and the
  Al-Manara feature pages — no page relies on undocumented local custom properties for its base
  palette.
- No file under `src/styles/**` or `src/components/patterns/**` references "Twister" in any form.
- Existing Storybook/visual snapshots for `src/components/ui` and `src/components/patterns` are
  updated to match.
