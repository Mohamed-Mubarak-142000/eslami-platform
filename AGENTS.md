# Eslam Platform — Agent Operating Contract

All work in this repository follows the sequential workflow defined in
[`workflow/WORKFLOW.md`](workflow/WORKFLOW.md).

## Non-negotiable rules

1. An agent may edit only paths assigned to its `agent_id` in
   [`workflow/ownership.json`](workflow/ownership.json).
2. Reading other agents' output is allowed. Editing, deleting, renaming, formatting, or
   reverting it is forbidden.
3. Shared configuration belongs only to `foundation-agent`. Later agents request changes
   in `workflow/requests/`; they do not make those changes themselves.
4. Only `orchestrator-agent` updates `workflow/state.json`, accepts a handoff, or activates
   the next agent.
5. Every agent starts from an accepted handoff and finishes by creating exactly one file
   under `workflow/handoffs/` from the provided template.
6. An agent must run the ownership guard before handoff. A failing guard blocks handoff.
7. If work requires an out-of-scope edit, stop that part and create a change request. Never
   expand scope silently.
8. Do not run multiple implementation agents concurrently. The pipeline is sequential.
9. Existing user changes and accepted prior-agent output must never be reverted.

## Required completion checks

Before handoff, run the checks listed in the agent contract and then:

```powershell
./workflow/scripts/Test-AgentBoundary.ps1 -AgentId <agent-id> -BaseRef <handoff-base-ref>
```

If Git has not been initialized yet, the orchestrator must initialize it and create a clean
baseline before activating the first delivery agent.

## Authority model

The written contract controls agent behavior. The boundary script provides deterministic
verification against Git changes. For OS-level isolation, run each agent in a separate
worktree/container with write access limited to its owned paths; prompt instructions alone
are not a security boundary.
