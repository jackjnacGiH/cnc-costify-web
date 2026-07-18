const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

console.log('--- Environment Diagnostics ---');
console.log('Node Version:', process.version);
console.log('Platform:', process.platform);
console.log('CWD:', process.cwd());

// Check Python
const isWin = process.platform === 'win32';
let pythonCmd = process.env.OCC_PYTHON || null;
if (!pythonCmd && isWin) {
    const home = process.env.USERPROFILE || process.env.HOMEDRIVE + process.env.HOMEPATH || 'C:\\Users\\HP';
    const occCandidate = path.join(home, 'Miniconda3-occt', 'envs', 'occ', 'python.exe');
    if (fs.existsSync(occCandidate)) {
        console.log('Found Conda Python:', occCandidate);
        pythonCmd = occCandidate;
    } else {
        console.log('Conda Python not found at:', occCandidate);
    }
}
if (!pythonCmd) pythonCmd = 'python';

console.log('Using Python Command:', pythonCmd);

const pyCheck = spawnSync(pythonCmd, ['-c', 'import sys; print(sys.version); import flask; print("Flask OK"); import OCC.Core; print("OCC OK")']);
if (pyCheck.error) {
    console.error('Failed to run python:', pyCheck.error);
    console.error('Check if python is installed and in your PATH.');
} else {
    console.log('Python Output:\n', pyCheck.stdout.toString());
    if (pyCheck.stderr.length > 0) {
        console.error('Python Stderr:\n', pyCheck.stderr.toString());
    }
}

// Check Ports
async function checkPort(port) {
    return new Promise(resolve => {
        const socket = net.createConnection(port, '127.0.0.1');
        socket.setTimeout(500);
        socket.on('connect', () => {
            console.log(`Port ${port} is OPEN (Something is running)`);
            socket.end();
            resolve(true);
        });
        socket.on('error', (err) => {
            console.log(`Port ${port} is CLOSED or unreachable (${err.code})`);
            resolve(false);
        });
        socket.on('timeout', () => {
             console.log(`Port ${port} timed out`);
             socket.destroy();
             resolve(false);
        });
    });
}

(async () => {
    console.log('\nChecking Ports...');
    await checkPort(5000);
    await checkPort(5002);
    console.log('\n--- Diagnostics Complete ---');
    console.log('If Python Output shows errors, check your python installation.');
    console.log('If "OCC OK" is missing, you need to install pythonocc-core.');
})();
