# Handoff: <agent-id> / <milestone>

- Status: `review`
- Base ref: `<commit>`
- Result ref: `<commit or working-tree marker>`
- Tasks completed: `<ids>`

## Delivered outputs

| Path | Purpose |
|---|---|
| `<path>` | `<why the next agent needs it>` |

## Acceptance evidence

| Criterion | Evidence/command | Result |
|---|---|---|
| `<criterion>` | `<evidence>` | pass/fail |

## Decisions and assumptions

- `<decision>`

## Open risks and deferred work

- `<risk or none>`

## Cross-owner requests

- `<request path or none>`

## Boundary check

- Command: `./workflow/scripts/Test-AgentBoundary.ps1 -AgentId <agent-id> -BaseRef <base-ref>`
- Result: `<pass/fail>`

The agent stops after creating this handoff. Only the orchestrator may accept it and activate
the successor.
