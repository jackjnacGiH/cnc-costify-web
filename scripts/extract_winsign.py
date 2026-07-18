"""
Pre-populate electron-builder winCodeSign cache by extracting .7z
with py7zr (handles macOS symlinks as regular files on Windows).
"""
import os
import sys
import urllib.request
import py7zr
import shutil

CACHE_DIR = os.path.join(os.environ.get("LOCALAPPDATA", ""), "electron-builder", "Cache", "winCodeSign")
VERSION   = "winCodeSign-2.6.0"
DEST      = os.path.join(CACHE_DIR, VERSION)
URL       = f"https://github.com/electron-userland/electron-builder-binaries/releases/download/{VERSION}/{VERSION}.7z"
TMP_7Z    = os.path.join(CACHE_DIR, f"{VERSION}.7z")

def main():
    os.makedirs(CACHE_DIR, exist_ok=True)

    # Remove stale partial extractions
    if os.path.isdir(DEST):
        print(f"Removing existing (possibly partial): {DEST}")
        shutil.rmtree(DEST, ignore_errors=True)

    # Remove stale temp .7z files
    for f in os.listdir(CACHE_DIR):
        if f.endswith(".7z"):
            try:
                os.remove(os.path.join(CACHE_DIR, f))
                print(f"Removed stale .7z: {f}")
            except Exception:
                pass

    # Download
    print(f"Downloading {URL} ...")
    urllib.request.urlretrieve(URL, TMP_7Z)
    print(f"Downloaded -> {TMP_7Z}  ({os.path.getsize(TMP_7Z):,} bytes)")

    # Extract with py7zr (converts symlinks to real files on Windows)
    print(f"Extracting into {DEST} ...")
    os.makedirs(DEST, exist_ok=True)
    with py7zr.SevenZipFile(TMP_7Z, mode="r") as z:
        z.extractall(path=DEST)

    # Clean up .7z
    os.remove(TMP_7Z)

    # Verify a known Windows binary exists
    win_dir = os.path.join(DEST, "windows-10")
    if not os.path.isdir(win_dir):
        # Try alternate subdir names
        subdirs = os.listdir(DEST)
        print(f"  Contents: {subdirs}")
    else:
        print(f"  windows-10 dir OK")

    print(f"\nDone! winCodeSign cache ready at:\n  {DEST}")

if __name__ == "__main__":
    main()
