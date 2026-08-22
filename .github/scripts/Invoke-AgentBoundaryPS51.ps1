param([Parameter(Mandatory=$true)][string]$AgentId,[Parameter(Mandatory=$true)][string]$BaseRef)
$ErrorActionPreference = 'Stop'
$priorConfigCount = $env:GIT_CONFIG_COUNT
$priorConfigKey = $env:GIT_CONFIG_KEY_0
$priorConfigValue = $env:GIT_CONFIG_VALUE_0
$env:GIT_CONFIG_COUNT = '1'
$env:GIT_CONFIG_KEY_0 = 'core.excludesFile'
$env:GIT_CONFIG_VALUE_0 = (Resolve-Path "$PSScriptRoot\..\git-excludes").Path
if ($PSVersionTable.PSVersion.Major -lt 6) {
  function global:ConvertFrom-Json {
    [CmdletBinding()] param([Parameter(ValueFromPipeline=$true)][string]$InputObject,[switch]$AsHashtable)
    process {
      $value = Microsoft.PowerShell.Utility\ConvertFrom-Json -InputObject $InputObject
      if (-not $AsHashtable) { return $value }
      $table = @{}; foreach ($property in $value.PSObject.Properties) { $table[$property.Name] = @($property.Value) }; return $table
    }
  }
}
try { & "$PSScriptRoot\..\..\workflow\scripts\Test-AgentBoundary.ps1" -AgentId $AgentId -BaseRef $BaseRef; if ($LASTEXITCODE) { exit $LASTEXITCODE } }
finally {
  if ($PSVersionTable.PSVersion.Major -lt 6) { Remove-Item Function:\global:ConvertFrom-Json -ErrorAction SilentlyContinue }
  $env:GIT_CONFIG_COUNT = $priorConfigCount; $env:GIT_CONFIG_KEY_0 = $priorConfigKey; $env:GIT_CONFIG_VALUE_0 = $priorConfigValue
}
