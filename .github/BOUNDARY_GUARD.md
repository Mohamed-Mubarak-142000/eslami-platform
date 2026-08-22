# PowerShell 5.1 boundary invocation

The workflow guard is owned by the orchestrator, so Foundation does not alter it. Use the
repository-controlled compatibility entrypoint on Windows PowerShell 5.1 or PowerShell 7+:

```powershell
./.github/scripts/Invoke-AgentBoundaryPS51.ps1 -AgentId foundation-agent -BaseRef <activation-ref>
```

It adds a process-scoped `ConvertFrom-Json -AsHashtable` adapter only on PowerShell 5.1,
applies `.github/git-excludes` to omit reproducible build/install artifacts from Git's
untracked-file query, and delegates to the canonical guard unchanged. Unknown agents,
invalid refs, and ownership violations retain non-zero behavior. Source paths are never
excluded.
