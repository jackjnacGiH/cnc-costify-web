$ErrorActionPreference = "SilentlyContinue"

# Stop common processes that may lock Electron builder outputs
$names = @(
  "CNC Costify AI",
  "CNC Costify AI V5.13",
  "CNC Costify AI 2026",
  "CNC Costify AI Admin",
  "CNC-Costify-AI",
  "electron",
  "node",
  "app-builder",
  "app-builder-bin"
)
foreach ($n in $names) {
  Get-Process -Name $n -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Milliseconds 800

# Clean previous unpacked outputs to avoid file locks
$root = Resolve-Path "$PSScriptRoot\.."
$paths = @(
  Join-Path $root "release3\win-unpacked",
  Join-Path $root "release2\win-unpacked",
  Join-Path $root "release\win-unpacked",
  Join-Path $root "release4\win-unpacked",
  Join-Path $root "release5\win-unpacked"
)
foreach ($p in $paths) {
  if (Test-Path $p) {
    Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue
  }
}

Write-Host "Processes stopped and unpacked directories cleaned."
