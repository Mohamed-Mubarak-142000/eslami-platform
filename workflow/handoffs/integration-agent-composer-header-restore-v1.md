# Handoff: integration-agent / composer-header-restore-v1

- Status: `review`
- Base ref: `12aa17c`
- Result ref: `committed handoff; see repository HEAD`
- Tasks completed: `INT-RESTORE-HEADER-001`

## Delivered outputs

| Path | Purpose |
|---|---|
| `src/integrations/ApplicationFrame.tsx` | Restores original search/navigation/account/notification/language/theme header |
| `src/integrations/ShellComposition.tsx` | Restores the global search placeholder |

## Acceptance evidence

| Criterion | Evidence/command | Result |
|---|---|---|
| Restore original global header | ShellActions, notification count, language, theme, top navigation | pass |
| Remove prompt/media from header | Compact mode and SocialMediaActions no longer composed | pass |
| Preserve auth/mobile composition | Focused-auth branch and navigation inputs unchanged | pass |

## Decisions and assumptions

- The global field is search again; the social thought prompt now belongs only to the feed composer.

## Open risks and deferred work

- none

## Cross-owner requests

- none

## Boundary check

- Command: `./.github/scripts/Invoke-AgentBoundaryPS51.ps1 -AgentId integration-agent -BaseRef 12aa17c`
- Result: `pass — 3 integration-owned files checked`

The agent stops after creating this handoff. Only the orchestrator may accept it and activate
the successor.
