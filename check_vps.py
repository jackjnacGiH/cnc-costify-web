import paramiko, os, sys
sys.stdout.reconfigure(encoding='utf-8')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
pkey = paramiko.Ed25519Key.from_private_key_file(os.path.expanduser('~/.ssh/cnc_vps'))
client.connect('72.62.254.216', username='root', pkey=pkey, timeout=30, allow_agent=False, look_for_keys=False)
for cmd in [
    'pm2 list --no-color | tail -8',
    'pm2 logs cnc-costify --lines 25 --nostream 2>&1',
    'curl -s -o /dev/null -w "HTTP %{http_code}\\n" http://127.0.0.1:5000/api/auth/me',
]:
    stdin, stdout, stderr = client.exec_command(cmd, timeout=20)
    print(f'\n$ {cmd}')
    print(stdout.read().decode('utf-8', errors='replace'))
    err = stderr.read().decode('utf-8', errors='replace')
    if err: print('[stderr]', err)
client.close()
