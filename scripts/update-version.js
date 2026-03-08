const fs = require('fs');
const path = require('path');

const newVersion = process.argv[2];

if (!newVersion) {
  console.error('Please provide a version number (e.g., 3.0.1)');
  process.exit(1);
}

const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(newVersion)) {
  console.error('Invalid version format. Use x.y.z');
  process.exit(1);
}

const majorMinor = newVersion.split('.').slice(0, 2).join('.');
const vVersion = `V${majorMinor}`; // e.g., V3.0
const appNameBase = 'CNC Costify AI 2026';
const fullAppName = `${appNameBase} ${vVersion}`;

console.log(`Updating to Version: ${newVersion}`);
console.log(`App Name: ${fullAppName}`);

// 1. Update package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

packageJson.version = newVersion;
packageJson.build.productName = fullAppName;
packageJson.build.artifactName = `${fullAppName} Setup.exe`;
packageJson.build.nsis.shortcutName = fullAppName;

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✔ Updated package.json');

// 2. Update CNC_Costify_AI_V6.html
const htmlPath = path.join(__dirname, '..', 'CNC_Costify_AI_V6.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');
// Replace <title>CNC Costify AI 2026 V3.0</title>
htmlContent = htmlContent.replace(/<title>CNC Costify AI 2026 V\d+\.\d+<\/title>/, `<title>${fullAppName}</title>`);
fs.writeFileSync(htmlPath, htmlContent);
console.log('✔ Updated CNC_Costify_AI_V6.html');

// 3. Update server.py
const serverPyPath = path.join(__dirname, '..', 'server.py');
let serverPyContent = fs.readFileSync(serverPyPath, 'utf8');
// Replace Server Script Version: 3.0.0
serverPyContent = serverPyContent.replace(/Server Script Version: \d+\.\d+\.\d+/, `Server Script Version: ${newVersion}`);
fs.writeFileSync(serverPyPath, serverPyContent);
console.log('✔ Updated server.py');

// 4. Update electron/main.js
const mainJsPath = path.join(__dirname, '..', 'electron', 'main.js');
let mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
// Replace title: 'CNC Costify AI 2026' or title: 'CNC Costify AI 2026 V...'
// Note: main.js currently has title: 'CNC Costify AI 2026', user might want version there too?
// Let's standardise it to fullAppName
mainJsContent = mainJsContent.replace(/title: 'CNC Costify AI 2026.*'/, `title: '${fullAppName}'`);
// Also check if there's any other title usage
fs.writeFileSync(mainJsPath, mainJsContent);
console.log('✔ Updated electron/main.js');

console.log('Update complete!');
