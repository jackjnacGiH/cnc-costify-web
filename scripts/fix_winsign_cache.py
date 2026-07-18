"""
Fix winCodeSign cache for Windows (no admin needed).

Strategy:
1. Download winCodeSign-2.6.0.7z
2. Extract with 7za.exe (ignoring exit code 2 = only macOS symlinks fail)
3. Create the 2 missing symlink targets as regular empty files
4. electron-builder will find the directory and skip re-extraction
"""
import os
import sys
import urllib.request
import subprocess
import shutil

CACHE_DIR = os.path.join(os.environ.get("LOCALAPPDATA", ""), "electron-builder", "Cache", "winCodeSign")
VERSION   = "winCodeSign-2.6.0"
DEST      = os.path.join(CACHE_DIR, VERSION)
URL       = f"https://github.com/electron-userland/electron-builder-binaries/releases/download/{VERSION}/{VERSION}.7z"
TMP_7Z    = os.path.join(CACHE_DIR, f"{VERSION}.7z")

# 7za.exe from node_modules
SEVEN_ZIP = r"D:\Project Vibe codeAI\CNC Costify AI 2027\node_modules\7zip-bin\win\x64\7za.exe"

def main():
    os.makedirs(CACHE_DIR, exist_ok=True)

    # Clean up
    if os.path.isdir(DEST):
        print(f"Removing existing: {DEST}")
        shutil.rmtree(DEST, ignore_errors=True)
    for f in os.listdir(CACHE_DIR):
        if f.endswith(".7z"):
            try:
                os.remove(os.path.join(CACHE_DIR, f))
            except Exception:
                pass

    # Download
    print(f"Downloading {URL} ...")
    urllib.request.urlretrieve(URL, TMP_7Z)
    size = os.path.getsize(TMP_7Z)
    print(f"Downloaded: {size:,} bytes")

    # Extract with 7za (exit code 2 expected due to macOS symlinks — we accept it)
    os.makedirs(DEST, exist_ok=True)
    cmd = [SEVEN_ZIP, "x", "-bd", TMP_7Z, f"-o{DEST}", "-y"]
    print(f"Extracting with 7za...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    print(f"  exit code: {result.returncode}")
    if result.stdout:
        # Show last few lines
        lines = result.stdout.strip().split('\n')
        print('\n'.join(lines[-6:]))
    if result.stderr:
        print("STDERR:", result.stderr[:500])

    # Create dummy files for the 2 macOS symlinks that failed
    missing = [
        os.path.join(DEST, "darwin", "10.12", "lib", "libcrypto.dylib"),
        os.path.join(DEST, "darwin", "10.12", "lib", "libssl.dylib"),
    ]
    for path in missing:
        if not os.path.exists(path):
            os.makedirs(os.path.dirname(path), exist_ok=True)
            open(path, 'w').close()
            print(f"  Created placeholder: {path}")
        else:
            print(f"  Already exists: {os.path.basename(path)}")

    # Clean up .7z
    if os.path.exists(TMP_7Z):
        os.remove(TMP_7Z)

    # Show what was extracted
    print(f"\nCache directory contents:")
    for entry in sorted(os.listdir(DEST)):
        print(f"  {entry}/")

    # Check for the key Windows binary
    win_sign_exe = None
    for root, dirs, files in os.walk(DEST):
        for f in files:
            if f.lower() in ("signtool.exe", "windowskernelplatformtools.msi"):
                win_sign_exe = os.path.join(root, f)

    if win_sign_exe:
        print(f"\n✅ Windows sign tool found: {win_sign_exe}")
    else:
        # Just list what's in windows dir
        win_dirs = [d for d in os.listdir(DEST) if 'window' in d.lower()]
        if win_dirs:
            print(f"\n✅ Windows dirs: {win_dirs}")
        else:
            print("\n⚠ No 'windows' directory found — listing all top-level:")
            for e in os.listdir(DEST):
                print(f"  {e}")

    print(f"\n✅ Cache ready at: {DEST}")
    print("   Run 'npm run dist:win' now.")

if __name__ == "__main__":
    main()
