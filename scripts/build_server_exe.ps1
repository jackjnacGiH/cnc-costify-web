Param(
    [string]$EnvName = "occ"
)

$ErrorActionPreference = "Stop"

# Go to project root
Set-Location (Resolve-Path "$PSScriptRoot\..")

$pythonExe = Join-Path $env:USERPROFILE "Miniconda3-occt\envs\$EnvName\python.exe"
if (-not (Test-Path $pythonExe)) {
    Write-Error "Python exe not found at $pythonExe"
}

Write-Host "Installing PyInstaller in environment '$EnvName'..."
& $pythonExe -m pip install --quiet pyinstaller

Write-Host "Building EXE with icon..."
$env:PYTHONNOUSERSITE = "1"
$env:PYTHONPATH = ""
& $pythonExe -m PyInstaller `
  --noconfirm `
  --clean `
  --noconsole `
  --name "CNC-Costify-AI" `
  --icon "assets/icons/app.ico" `
  --add-data "assets/icons;assets/icons" `
  server.py

Write-Host "Done. Output: dist\\CNC-Costify-AI\\CNC-Costify-AI.exe"