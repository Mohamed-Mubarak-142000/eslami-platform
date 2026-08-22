# Change request: PowerShell 5.1 boundary-guard compatibility

- Requester: `orchestrator-agent`
- Owner: `foundation-agent`
- Priority: P0 before Foundation handoff
- Path: `workflow/scripts/Test-AgentBoundary.ps1`

## Problem

The current guard uses `ConvertFrom-Json -AsHashtable`, which is unavailable in Windows
PowerShell 5.1 on the active development environment. Product delivery required an in-process
compatibility function to validate its boundary.

## Requested outcome

Make the committed guard run unchanged on Windows PowerShell 5.1 and PowerShell 7+, or provide
a repository-controlled equivalent that preserves the same ownership checks.

## Acceptance criteria

- The normal documented command runs without a compatibility shim on Windows PowerShell 5.1.
- Unknown agent IDs and invalid base refs fail non-zero.
- an owned-path fixture passes and an out-of-owner fixture fails.
- Existing `ownership.json` semantics remain unchanged or are migrated with documentation.
