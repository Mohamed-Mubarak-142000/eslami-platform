param(
    [Parameter(Mandatory = $true)]
    [string]$AgentId,

    [Parameter(Mandatory = $true)]
    [string]$BaseRef
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$ownershipPath = Join-Path $repoRoot 'workflow\ownership.json'

if (-not (Test-Path -LiteralPath $ownershipPath)) {
    throw "Ownership manifest not found: $ownershipPath"
}

$ownership = Get-Content -Raw -LiteralPath $ownershipPath | ConvertFrom-Json -AsHashtable
if (-not $ownership.ContainsKey($AgentId)) {
    throw "Unknown agent id: $AgentId"
}

Push-Location $repoRoot
try {
    git rev-parse --is-inside-work-tree *> $null
    if ($LASTEXITCODE -ne 0) {
        throw 'Git repository required. Initialize Git and create a baseline commit first.'
    }

    git rev-parse --verify $BaseRef *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "Invalid base ref: $BaseRef"
    }

    $changed = @(
        git diff --name-only --diff-filter=ACMR $BaseRef --
        git ls-files --others --exclude-standard
    ) | Where-Object { $_ } | Sort-Object -Unique

    $allowed = @($ownership[$AgentId])
    $violations = foreach ($path in $changed) {
        $normalized = $path.Replace('\', '/')
        $matched = $false
        foreach ($pattern in $allowed) {
            $wildcard = $pattern.Replace('**', '*')
            if ($normalized -like $wildcard) {
                $matched = $true
                break
            }
        }
        if (-not $matched) { $normalized }
    }

    if ($violations.Count -gt 0) {
        Write-Error ("Boundary violation for {0}:`n - {1}" -f $AgentId, ($violations -join "`n - "))
        exit 1
    }

    Write-Output "Boundary check passed for $AgentId."
    Write-Output "Changed files checked: $($changed.Count)"
}
finally {
    Pop-Location
}
