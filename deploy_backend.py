"""SSH into VPS, pull latest backend code, restart PM2."""
import paramiko
import os
import sys
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

HOST = "72.62.254.216"
USER = "root"
KEY_PATH = os.path.expanduser("~/.ssh/cnc_vps")

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    client.connect(HOST, username=USER, pkey=pkey, timeout=30,
                   allow_agent=False, look_for_keys=False)
    cmds = [
        "cd /opt/cnc-costify && git pull",
        "cd /opt/cnc-costify/backend && pm2 restart cnc-costify --update-env",
        "sleep 2 && pm2 logs cnc-costify --nostream --lines 8",
        "curl -s -o /dev/null -w 'HTTP %{http_code}\\n' http://127.0.0.1:5000/api/account/quota",
    ]
    for c in cmds:
        print(f"\n$ {c}")
        stdin, stdout, stderr = client.exec_command(c, timeout=60)
        out = stdout.read().decode("utf-8", errors="replace").rstrip()
        err = stderr.read().decode("utf-8", errors="replace").rstrip()
        if out: print(out)
        if err: print("[stderr]", err)
    client.close()
    print("\nDone.")

if __name__ == "__main__":
    main()
