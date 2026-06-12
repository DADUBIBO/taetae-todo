$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$scriptPath = Join-Path $root "script.js"
$gitignorePath = Join-Path $root ".gitignore"
$rulesPath = Join-Path $root "database.rules.json"

$script = Get-Content -LiteralPath $scriptPath -Raw
$gitignore = Get-Content -LiteralPath $gitignorePath -Raw

$checks = @(
  @{
    Name = "script.js imports Firebase Auth"
    Pass = $script -match "firebase-auth\.js" -and $script -match "signInAnonymously"
  },
  @{
    Name = "script.js stores todos under users/{uid}/todos"
    Pass = $script -match "users/\$\{user\.uid\}/todos"
  },
  @{
    Name = ".gitignore does not exclude env.js"
    Pass = $gitignore -notmatch "(?m)^env\.js$"
  },
  @{
    Name = "database.rules.json exists"
    Pass = Test-Path -LiteralPath $rulesPath
  }
)

$failed = $checks | Where-Object { -not $_.Pass }

foreach ($check in $checks) {
  $status = if ($check.Pass) { "PASS" } else { "FAIL" }
  Write-Host "$status $($check.Name)"
}

if ($failed.Count -gt 0) {
  throw "Deployment config verification failed: $($failed.Name -join ', ')"
}
