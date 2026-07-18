"""Upload V5.1 installer to VPS via SFTP, then trigger setup commands."""
import paramiko
import os
import sys
import time
# Force UTF-8 stdout on Windows (cp1252 chokes on ✓ ✅ etc.)
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

HOST = "72.62.254.216"
USER = "root"
KEY_PATH = os.path.expanduser("~/.ssh/cnc_vps")

LOCAL = r"D:\Project Vibe codeAI\CNC Costify AI 2027\release_v5\CNC Costify AI V5.1 Setup.exe"
REMOTE_DIR = "/opt/cnc-costify/backend/downloads"
REMOTE_NAME = "CNC-Costify-AI-V5.1-Setup.exe"
REMOTE_PATH = f"{REMOTE_DIR}/{REMOTE_NAME}"

def progress(transferred, total):
    pct = (transferred / total) * 100
    mb = transferred / 1024 / 1024
    total_mb = total / 1024 / 1024
    sys.stdout.write(f"\r  {mb:.1f}/{total_mb:.1f} MB ({pct:.1f}%)")
    sys.stdout.flush()

def main():
    if not os.path.exists(LOCAL):
        print(f"ERROR: local file not found: {LOCAL}", file=sys.stderr)
        sys.exit(1)
    size_mb = os.path.getsize(LOCAL) / 1024 / 1024
    print(f"Local file: {LOCAL}")
    print(f"Size: {size_mb:.1f} MB")
    print(f"Target: {USER}@{HOST}:{REMOTE_PATH}")
    print()

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {USER}@{HOST}...", flush=True)
    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    client.connect(HOST, username=USER, pkey=pkey, timeout=30,
                   allow_agent=False, look_for_keys=False)
    print("Connected ✓", flush=True)

    # Pre-flight: pull latest code + ensure target dir exists
    print("\n[1/3] Pulling latest backend code + creating downloads dir...")
    cmds = [
        "cd /opt/cnc-costify && git pull",
        "mkdir -p /opt/cnc-costify/backend/downloads",
    ]
    for c in cmds:
        stdin, stdout, stderr = client.exec_command(c, timeout=60)
        print(f"  $ {c}")
        out = stdout.read().decode("utf-8", errors="replace").rstrip()
        err = stderr.read().decode("utf-8", errors="replace").rstrip()
        if out: print(f"    {out}")
        if err: print(f"    [stderr] {err}")

    # Upload via SFTP
    print(f"\n[2/3] Uploading {size_mb:.1f} MB...")
    sftp = client.open_sftp()
    t0 = time.time()
    sftp.put(LOCAL, REMOTE_PATH, callback=progress)
    elapsed = time.time() - t0
    sftp.close()
    print(f"\n  Upload complete in {elapsed:.1f}s ({size_mb/elapsed:.1f} MB/s)")

    # Verify size + restart pm2
    print("\n[3/3] Verifying + restarting PM2...")
    cmds = [
        f"ls -lh {REMOTE_PATH}",
        "cd /opt/cnc-costify/backend && pm2 restart cnc-costify --update-env",
        "sleep 2 && curl -sI http://127.0.0.1:5000/downloads/CNC-Costify-AI-V5.1-Setup.exe | head -5",
    ]
    for c in cmds:
        stdin, stdout, stderr = client.exec_command(c, timeout=30)
        print(f"  $ {c}")
        out = stdout.read().decode("utf-8", errors="replace").rstrip()
        err = stderr.read().decode("utf-8", errors="replace").rstrip()
        if out: print(f"    {out}")
        if err: print(f"    [stderr] {err}")

    client.close()
    print("\n✅ Done. Test: https://api.cnccostify.cloud/downloads/CNC-Costify-AI-V5.1-Setup.exe")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\nFAILED: {e}", file=sys.stderr)
        sys.exit(1)
