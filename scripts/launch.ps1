#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot
if (-not (Test-Path (Join-Path $ProjectRoot "node_modules\electron"))) {
    npm install
}
$bundle = Join-Path $ProjectRoot "editor\live-preview.bundle.js"
if (-not (Test-Path $bundle)) {
    npm run build:live
}
npx --no-install electron .
