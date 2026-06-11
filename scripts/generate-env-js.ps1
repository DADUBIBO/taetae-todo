$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$envPath = Join-Path $root ".env"
$outputPath = Join-Path $root "env.js"

if (-not (Test-Path $envPath)) {
  throw ".env file not found. Copy .env.example to .env and fill in your Firebase values."
}

$values = @{}

Get-Content $envPath | ForEach-Object {
  $line = $_.Trim()

  if ($line -eq "" -or $line.StartsWith("#")) {
    return
  }

  $separatorIndex = $line.IndexOf("=")

  if ($separatorIndex -lt 1) {
    return
  }

  $key = $line.Substring(0, $separatorIndex).Trim()
  $value = $line.Substring($separatorIndex + 1).Trim().Trim('"').Trim("'")
  $values[$key] = $value
}

$requiredKeys = @(
  "FIREBASE_API_KEY",
  "FIREBASE_AUTH_DOMAIN",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_STORAGE_BUCKET",
  "FIREBASE_MESSAGING_SENDER_ID",
  "FIREBASE_APP_ID",
  "FIREBASE_DATABASE_URL"
)

foreach ($key in $requiredKeys) {
  if (-not $values.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($values[$key])) {
    throw "Missing required value in .env: $key"
  }
}

$config = [ordered]@{
  apiKey = $values["FIREBASE_API_KEY"]
  authDomain = $values["FIREBASE_AUTH_DOMAIN"]
  projectId = $values["FIREBASE_PROJECT_ID"]
  storageBucket = $values["FIREBASE_STORAGE_BUCKET"]
  messagingSenderId = $values["FIREBASE_MESSAGING_SENDER_ID"]
  appId = $values["FIREBASE_APP_ID"]
  databaseURL = $values["FIREBASE_DATABASE_URL"]
}

$json = $config | ConvertTo-Json
$content = "export const firebaseConfig = $json;`n"

Set-Content -Path $outputPath -Value $content -Encoding utf8
Write-Host "Generated env.js from .env"
