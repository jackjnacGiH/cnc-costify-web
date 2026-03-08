const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Logic to find python (same as server.js)
const isWin = process.platform === 'win32';
let pythonCmd = process.env.OCC_PYTHON || null;
if (!pythonCmd && isWin) {
    const home = process.env.USERPROFILE || process.env.HOMEDRIVE + process.env.HOMEPATH || 'C:\\Users\\HP';
    const occCandidate = path.join(home, 'Miniconda3-occt', 'envs', 'occ', 'python.exe');
    if (fs.existsSync(occCandidate)) {
        pythonCmd = occCandidate;
    }
}
if (!pythonCmd) {
    pythonCmd = isWin ? 'python' : 'python3';
}

const serverPy = path.join(__dirname, '..', 'server.py');
const port = 5002;

console.log(`[Standalone Backend] Starting with: ${pythonCmd}`);
console.log(`[Standalone Backend] Server script: ${serverPy}`);
console.log(`[Standalone Backend] Port: ${port}`);

const child = spawn(pythonCmd, [serverPy], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: { ...process.env, FLASK_PORT: String(port), PYTHONUNBUFFERED: '1' }
});

child.on('exit', (code) => {
    console.log(`Backend exited with code ${code}`);
});
