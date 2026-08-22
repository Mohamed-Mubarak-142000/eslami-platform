# Sequential Agent Workflow

## Pipeline

```text
orchestrator
  -> product
  -> ux
  -> design-system
  -> foundation
  -> feature-ui
  -> integration
  -> qa
  -> release-review
  -> orchestrator closes milestone
```

There is exactly one active delivery agent. The orchestrator is coordination-only and does
not implement product code.

## Agents

| Order | Agent | Owns | Must not do |
|---:|---|---|---|
| 0 | `orchestrator-agent` | state, handoff acceptance, scope routing | product implementation |
| 1 | `product-agent` | requirements, stories, acceptance criteria, domain decisions | UX/code/design |
| 2 | `ux-agent` | IA, flows, wireframe specifications, content structure | visual tokens/code |
| 3 | `design-system-agent` | tokens, primitives, patterns, Storybook design contracts | feature business logic |
| 4 | `foundation-agent` | project scaffold, shared config, core libraries, mocks | feature screens |
| 5 | `feature-ui-agent` | feature modules and screen behavior using frozen foundations | shared config/design primitives |
| 6 | `integration-agent` | routes, API adapters, auth integration, analytics wiring | redesigning features/contracts |
| 7 | `qa-agent` | automated tests, test evidence, defect reports | production source fixes |
| 8 | `release-review-agent` | read-only release, accessibility, security, performance review | any implementation edit |

Detailed contracts are under [`workflow/agents/`](agents/).

## State machine

Allowed stage states:

```text
pending -> active -> review -> accepted
                    -> changes_requested -> active
pending/active/review -> blocked
```

Only the orchestrator changes state. Only an `accepted` stage unlocks its successor.

## Start protocol

The orchestrator:

1. Confirms the predecessor is `accepted`.
2. Records the new `active_agent`, stage, base Git commit, task IDs, and acceptance criteria.
3. Gives the agent its contract, predecessor handoff, base ref, and owned paths.
4. Makes no implementation edits while the delivery agent is active.

## Agent execution protocol

Each delivery agent:

1. Reads `AGENTS.md`, its own contract, `ownership.json`, current state, and predecessor handoff.
2. Confirms required inputs exist. Missing inputs become a blocker or request, not a guessed edit.
3. Changes only owned paths.
4. Runs its contract checks and the boundary guard.
5. Creates a handoff using `workflow/templates/HANDOFF.md`.
6. Stops. It never activates or messages the next delivery agent directly; the orchestrator
   validates and dispatches the next agent.

## Handoff acceptance gate

The orchestrator accepts only when:

- all declared acceptance criteria have evidence;
- required checks pass;
- changed paths match ownership;
- no unresolved blocking request exists;
- outputs needed by the next agent are listed with exact paths;
- risks, assumptions, and deferred items are explicit.

If rejected, only the same agent is reactivated. The next agent never fixes predecessor work.

## Cross-owner change request

Create `workflow/requests/<timestamp>-<requester>-to-<owner>.md` containing:

- requester and owning agent;
- exact path and requested outcome;
- why the current task is blocked;
- acceptance criteria and urgency.

The orchestrator queues the request for the owning agent. The requester must not apply it.

## Branch/worktree strategy

Recommended for enforceable isolation:

- branch: `agent/<stage>/<task-id>`;
- one clean worktree per agent;
- commit hash recorded at activation and handoff;
- merge only after orchestrator acceptance;
- OS/container ACL grants writes only to owned directories where available.

The repository guard detects violations; worktrees prevent agents from accidentally sharing
uncommitted state.
