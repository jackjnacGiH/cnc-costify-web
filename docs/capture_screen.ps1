# Screenshot helper — finds CNC Costify AI window by title, brings it to front,
# then captures it. Works without user manually switching windows.
#
# Usage:  powershell -File capture_screen.ps1 <output_filename>

param([Parameter(Mandatory=$true)][string]$OutName)

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class Win32 {
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    [DllImport("user32.dll", SetLastError=true, CharSet=CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern IntPtr GetWindow(IntPtr hWnd, uint cmd);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
    public struct RECT { public int Left, Top, Right, Bottom; }
}
"@

# Find all visible windows whose title matches "CNC Costify AI" — pick the
# largest one (frontend Electron BrowserWindow), skip the tiny tray/dummy ones.
$candidates = @()
$enumProc = [Win32+EnumWindowsProc]{
    param($h, $l)
    if ([Win32]::IsWindowVisible($h)) {
        $sb = New-Object System.Text.StringBuilder 256
        [Win32]::GetWindowText($h, $sb, 256) | Out-Null
        $title = $sb.ToString()
        if ($title -match 'CNC Costify AI') {
            $r = New-Object Win32+RECT
            [Win32]::GetWindowRect($h, [ref]$r) | Out-Null
            $w = $r.Right - $r.Left; $hgt = $r.Bottom - $r.Top
            if ($w -gt 400 -and $hgt -gt 400) {
                $script:candidates += [PSCustomObject]@{
                    Hwnd = $h; Title = $title; W = $w; H = $hgt; Rect = $r
                }
            }
        }
    }
    return $true
}
[Win32]::EnumWindows($enumProc, [IntPtr]::Zero) | Out-Null

if ($candidates.Count -eq 0) {
    Write-Host "ERROR: no visible CNC Costify AI window found"
    exit 1
}

# Pick window with largest area
$target = $candidates | Sort-Object -Property @{Expression={$_.W * $_.H}} -Descending | Select-Object -First 1
Write-Host ("Target window: '{0}' {1}x{2}" -f $target.Title, $target.W, $target.H)

# Restore if minimized, then bring to front
if ([Win32]::IsIconic($target.Hwnd)) { [Win32]::ShowWindow($target.Hwnd, 9) | Out-Null }  # SW_RESTORE
[Win32]::BringWindowToTop($target.Hwnd) | Out-Null
[Win32]::SetForegroundWindow($target.Hwnd) | Out-Null
Start-Sleep -Milliseconds 600  # let it repaint

# Re-read rect (in case window moved/resized)
$r = New-Object Win32+RECT
[Win32]::GetWindowRect($target.Hwnd, [ref]$r) | Out-Null
$w = $r.Right - $r.Left; $h = $r.Bottom - $r.Top

$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$outDir = Join-Path $dir 'manual_images'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
$outPath = Join-Path $outDir ($OutName + '.png')

$bmp = New-Object System.Drawing.Bitmap $w, $h
$g   = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($r.Left, $r.Top, 0, 0, $bmp.Size)
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Host "Saved: $outPath ($w x $h)"
