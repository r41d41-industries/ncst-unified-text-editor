# Creates a Desktop shortcut that starts NCST Unified Text Editor without a console window.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $Desktop "NCST Unified Text Editor.lnk"
$Vbs = Join-Path $Root "scripts\launch-hidden.vbs"
$LocalCopy = Join-Path $Root "scripts\NCST Unified Text Editor.lnk"

if (-not (Test-Path $Vbs)) {
  throw "Launcher not found at $Vbs"
}

$Wsh = New-Object -ComObject WScript.Shell
function New-AppShortcut([string]$Path) {
  $Shortcut = $Wsh.CreateShortcut($Path)
  $Shortcut.TargetPath = Join-Path $env:SystemRoot "System32\wscript.exe"
  $Shortcut.Arguments = '"' + $Vbs + '"'
  $Shortcut.WorkingDirectory = $Root
  $Shortcut.WindowStyle = 7
  $Shortcut.Description = "NCST Unified Text Editor"
  $Electron = Join-Path $Root "node_modules\electron\dist\electron.exe"
  if (Test-Path $Electron) {
    $Shortcut.IconLocation = "$Electron,0"
  } else {
    $Shortcut.IconLocation = (Join-Path $env:SystemRoot "System32\shell32.dll") + ",21"
  }
  $Shortcut.Save()
}

New-AppShortcut $ShortcutPath
New-AppShortcut $LocalCopy
Write-Output "Desktop shortcut created: $ShortcutPath"
