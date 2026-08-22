# Handoff: foundation-agent / social-ui-auth-v2

- Status: `review`
- Base ref: `ef089d1b45e79d702bfe7fb57727c5a1b116716e`
- Result ref: `committed handoff; see repository HEAD`
- Tasks completed: `FOUND-SOCIAL-STACK-001`

## Delivered outputs

| Path | Purpose |
|---|---|
| `package.json`, `package-lock.json` | Exact Tailwind 4, Framer Motion, GSAP, clsx, and tailwind-merge dependency contract |
| `postcss.config.mjs` | Next 16-supported `@tailwindcss/postcss` processing |
| `tsconfig.json` | shadcn-compatible `@`, components, lib, and styles aliases |
| `src/lib/styles/tailwind.css` | Tailwind entrypoint importing the accepted semantic `tailwind-theme.css` and owned source discovery |
| `src/lib/cn.ts`, `cn.test.ts` | shadcn-compatible conditional class composition and conflict merging |
| `src/lib/motion/MotionFoundation.tsx` | Narrow client boundary with user-preference reduced-motion policy and accepted preset resolver |
| `src/lib/motion/useAuthBrandTimeline.ts` | Lazy, cleanup-safe GSAP hook isolated to a decorative auth brand-panel sequence |
| `src/components/layout/AppShell.tsx` | Server-safe Tailwind entrypoint consumption and semantic utility proof without changing its public API |
| `.storybook/preview.tsx` | Tailwind semantic theme wiring for accepted design-system stories |

## Acceptance evidence

| Criterion | Evidence/command | Result |
|---|---|---|
| Install exact requested stack | `npm install` for Tailwind 4.3.3, Framer Motion 13.1.1, GSAP 3.15.0, clsx 2.1.1, tailwind-merge 3.6.0 | pass |
| Next 16 Tailwind/PostCSS integration | local `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`; `npm run build` | pass — 29 routes built |
| Strict/static quality | `npm run typecheck`; `npm run lint` | pass |
| Runtime and helper regression | `npm test` | pass — 30/30 tests |
| Tailwind + Storybook composition | `npm run build-storybook` | pass |
| Production dependency audit | `npm audit --omit=dev --audit-level=high` | pass — 0 vulnerabilities |
| Patch integrity and ownership | `git diff --check`; Foundation guard from exact activation ref | pass — 13 owned files including handoff |

## Decisions and assumptions

- Tailwind utilities consume only the accepted `@theme inline` semantic mapping. Existing
  token, primitive, pattern, and layout APIs remain authoritative and were not replaced.
- AppShell stays a Server Component. Framer Motion and GSAP live behind separate `"use client"`
  modules, following the installed Next 16 client-boundary guidance.
- `MotionFoundation` delegates preference handling to `reducedMotion="user"`; the preset hook
  resolves to the accepted zero-duration/no-transform state when reduction is requested.
- GSAP is dynamically imported only by `useAuthBrandTimeline`. It targets explicitly marked
  decorative brand-panel lines, never form controls, routing, feed cards, or reading content;
  it skips reduced motion and reverts its context on cleanup. Feature may consume it only for
  the approved auth brand panel and must not mix Framer Motion on that subtree.
- No auth, page, or feature behavior was added in Foundation.

## Open risks and deferred work

- GSAP is installed because the user explicitly requested a justified auth brand-panel
  timeline, but remains absent from all initial/server bundles until a downstream client calls
  the isolated hook. Downstream QA must measure the under-50ms main-thread budget.
- The development-only Storybook adapter advisories remain unchanged; the production audit is clean.

## Cross-owner requests

- Root `components.json` is required only for future shadcn CLI execution but is not assigned in
  `workflow/ownership.json`. The orchestrator explicitly deferred it for this milestone. If CLI
  generation becomes necessary, assign `components.json` to Foundation and configure `rsc: true`,
  `tsx: true`, CSS entry `src/lib/styles/tailwind.css`, and aliases `@/components`, `@/lib/cn`,
  `@/components/ui`, `@/lib`, `@/hooks`. Runtime shadcn compatibility is complete without it.

## Boundary check

- Command: `./.github/scripts/Invoke-AgentBoundaryPS51.ps1 -AgentId foundation-agent -BaseRef ef089d1`
- Result: `pass — 13 Foundation-owned files checked including this handoff`

The agent stops after creating this handoff. Only the orchestrator may accept it and activate
the successor.
