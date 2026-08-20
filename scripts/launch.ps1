#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot
if (-not (Test-Path (Join-Path $ProjectRoot "node_modules\electron"))) {
    npm install
}
npx --no-install electron .
