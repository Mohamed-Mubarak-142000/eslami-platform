# Handoff: foundation-agent / frontend-mvp Stitch shell

- Status: `review`
- Base ref: `975533ba31f7f927bd0e10d123dedee691515bf8`
- Result ref: `committed handoff; see repository HEAD`
- Tasks completed: `FOUND-STITCH-SHELL-001`

## Delivered outputs

| Path | Purpose |
|---|---|
| `src/components/layout/AppShell.tsx` | Backwards-compatible scholarly shell contract with optional search/actions/discovery slots and preserved landmark behavior |
| `src/components/layout/layout.css` | RTL desktop right navigation, centered reading area, optional left rail, and responsive bottom navigation |
| `src/components/layout/AppShell.stories.tsx` | Rendered contract scenario covering the complete Stitch shell composition |

## Acceptance evidence

| Criterion | Evidence/command | Result |
|---|---|---|
| Accepted Mounir Stitch shell composition | AppShell contract/CSS inspection against `design-system-agent-stitch-refresh.md` | pass |
| Existing TypeScript and lint contracts | `npm run typecheck`; `npm run lint` | pass |
| Existing unit/integration contracts | `npm test` | pass — 28/28 tests |
| Integrated production composition | `npm run build` | pass — 29 routes built |
| Rendered layout contract | `npm run build-storybook` | pass |
| Responsive and landmark regression | targeted Playwright landmark + mobile/tablet/desktop overflow checks | pass — 12/12 across Chromium, Firefox, WebKit |
| Patch integrity and path ownership | `git diff --check`; Foundation boundary from exact activation ref | pass — 4 owned files including handoff |

## Decisions and assumptions

- Existing `children`, `navigation`, `title`, `contextualRail`, `unreadNotifications`, and
  `nested` props retain their behavior. New `search`, `actions`, `navigationLabel`, and
  `railLabel` props are optional.
- The document-level shell remains the sole owner of the skip link and primary `main` landmark;
  nested/admin shells remain semantic-neutral content wrappers.
- The desktop grid relies on RTL direction and logical borders: navigation occupies the right,
  content the center, and the optional discovery rail the left. The rail column is removed when
  no rail is supplied.
- Header slots accept composition from route owners without embedding speculative search,
  authentication, or discovery business data in Foundation.

## Open risks and deferred work

- Root route owners currently use the backwards-compatible minimal props. Populating the new
  search/actions/discovery slots requires a later Integration-owned composition task.
- The brand mark is typographic and dependency-free; any future logo asset remains a separately
  approved design-system/product decision.

## Cross-owner requests

- none

## Boundary check

- Command: `./.github/scripts/Invoke-AgentBoundaryPS51.ps1 -AgentId foundation-agent -BaseRef 975533b`
- Result: `pass — 4 Foundation-owned files checked including this handoff`

The agent stops after creating this handoff. Only the orchestrator may accept it and activate
the successor.
