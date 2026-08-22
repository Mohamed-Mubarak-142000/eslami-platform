---
name: eslam-frontend-pipeline
description: Run the Eslam Platform frontend milestone through its strict sequential agent workflow with path ownership, handoff gates, and independent QA/release review. Use when starting, continuing, reviewing, or recovering this repository's multi-agent delivery pipeline.
---

# Eslam Frontend Pipeline

Operate the repository workflow without implementing work owned by another agent.

## Procedure

1. Read `/AGENTS.md`, `/workflow/WORKFLOW.md`, `/workflow/state.json`, and
   `/workflow/ownership.json`.
2. If acting as orchestrator, read `/workflow/agents/orchestrator-agent.md`; otherwise read only
   the active agent's contract and predecessor handoff.
3. Confirm exactly one delivery agent is active and its predecessor is accepted.
4. Use the task IDs, base ref, owned paths, and acceptance criteria recorded at activation.
5. On completion, run the contract checks and `workflow/scripts/Test-AgentBoundary.ps1`.
6. Write the handoff from `/workflow/templates/HANDOFF.md`, then stop. The orchestrator alone
   reviews it and activates the successor.

Never fix another owner's output. File a cross-owner request according to
`/workflow/WORKFLOW.md` and continue only with unblocked owned work.

Prompt rules are not an OS security boundary. For strong isolation, the orchestrator must use
separate branches/worktrees or containers plus filesystem write restrictions.
