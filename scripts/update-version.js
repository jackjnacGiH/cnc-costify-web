const fs = require('fs');
const path = require('path');

const newVersion = process.argv[2];

if (!newVersion) {
  console.error('Please provide a version number (e.g., 5.14.0)');
  process.exit(1);
}

const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(newVersion)) {
  console.error('Invalid version format. Use x.y.z');
  process.exit(1);
}

const majorMinor = newVersion.split('.').slice(0, 2).join('.');
const vVersion = `V${majorMinor}`; // e.g., V5.14
const appNameBase = 'CNC Costify AI';
const fullAppName = `${appNameBase} ${vVersion}`;

console.log(`Updating to Version: ${newVersion}`);
console.log(`App Name: ${fullAppName}`);

// 1. Update package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const previousMajorMinor = String(packageJson.version || '')
  .split('.')
  .slice(0, 2)
  .join('.');
const previousVVersion = previousMajorMinor ? `V${previousMajorMinor}` : null;

packageJson.version = newVersion;
packageJson.description = String(packageJson.description || appNameBase)
  .replace(/CNC Costify AI V\d+\.\d+/, fullAppName);
packageJson.build.productName = fullAppName;
packageJson.build.artifactName = `${fullAppName} Setup.exe`;
packageJson.build.nsis.shortcutName = fullAppName;
for (const [name, command] of Object.entries(packageJson.scripts || {})) {
  packageJson.scripts[name] = String(command)
    .replace(/CNC Costify AI V\d+\.\d+ Setup\.exe/g, `${fullAppName} Setup.exe`);
}

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✔ Updated package.json');

// Keep the root package-lock identity aligned without changing dependencies.
const packageLockPath = path.join(__dirname, '..', 'package-lock.json');
if (fs.existsSync(packageLockPath)) {
  const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
  packageLock.version = newVersion;
  if (packageLock.packages && packageLock.packages['']) {
    packageLock.packages[''].version = newVersion;
  }
  fs.writeFileSync(packageLockPath, JSON.stringify(packageLock, null, 2) + '\n');
  console.log('✔ Updated package-lock.json');
}

// 2. Update CNC_Costify_AI_V6.html
const htmlPath = path.join(__dirname, '..', 'CNC_Costify_AI_V6.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');
htmlContent = htmlContent.replace(/<title>CNC Costify AI(?: 2027)?(?: V\d+\.\d+)?<\/title>/, `<title>${fullAppName}</title>`);
fs.writeFileSync(htmlPath, htmlContent);
console.log('✔ Updated CNC_Costify_AI_V6.html');

// 3. Update server.py
const serverPyPath = path.join(__dirname, '..', 'server.py');
let serverPyContent = fs.readFileSync(serverPyPath, 'utf8');
serverPyContent = serverPyContent.replace(/Server Script Version: \d+\.\d+\.\d+/, `Server Script Version: ${newVersion}`);
fs.writeFileSync(serverPyPath, serverPyContent);
console.log('✔ Updated server.py');

// 4. Update electron/main.js
const mainJsPath = path.join(__dirname, '..', 'electron', 'main.js');
let mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
mainJsContent = mainJsContent.replace(/title: 'CNC Costify AI(?: 2027)?(?: V\d+\.\d+)?'/, `title: '${fullAppName}'`);
mainJsContent = mainJsContent.replace(
  /title: 'Activation – CNC Costify AI(?: 2027)?(?: V\d+\.\d+)?'/,
  `title: 'Activation – ${fullAppName}'`,
);
fs.writeFileSync(mainJsPath, mainJsContent);
console.log('✔ Updated electron/main.js');

const activationPath = path.join(__dirname, '..', 'electron', 'activation.html');
let activationContent = fs.readFileSync(activationPath, 'utf8');
activationContent = activationContent.replace(
  /<title>Activation – CNC Costify AI(?: 2027)?(?: V\d+\.\d+)?<\/title>/,
  `<title>Activation – ${fullAppName}</title>`,
);
fs.writeFileSync(activationPath, activationContent);
console.log('✔ Updated electron/activation.html');

// 5. Keep the offline-signing compatibility comment aligned.
const signerPath = path.join(__dirname, '..', 'lib', 'licenseSigner.js');
let signerContent = fs.readFileSync(signerPath, 'utf8');
signerContent = signerContent.replace(/Desktop V\d+\.\d+\+ verifies/, `Desktop ${vVersion}+ verifies`);
fs.writeFileSync(signerPath, signerContent);
console.log('✔ Updated lib/licenseSigner.js');

// 6. Update website release labels and installer URL references.
for (const locale of ['th', 'en']) {
  const messagePath = path.join(__dirname, '..', 'website', 'messages', `${locale}.json`);
  const messages = JSON.parse(fs.readFileSync(messagePath, 'utf8'));
  if (messages.Brand) messages.Brand.version = vVersion;
  fs.writeFileSync(messagePath, JSON.stringify(messages, null, 2) + '\n');
}

const websiteFiles = [
  path.join('website', 'src', 'app', '[locale]', 'layout.tsx'),
  path.join('website', 'src', 'app', '[locale]', 'page.tsx'),
  path.join('website', 'src', 'app', '[locale]', 'download', 'page.tsx'),
  path.join('website', 'src', 'app', '[locale]', 'docs', 'page.tsx'),
  path.join('website', 'src', 'app', '[locale]', 'features', 'page.tsx'),
];
for (const relativePath of websiteFiles) {
  const filePath = path.join(__dirname, '..', relativePath);
  let content = fs.readFileSync(filePath, 'utf8');
  if (previousVVersion) {
    content = content.split(previousVVersion).join(vVersion);
  }
  fs.writeFileSync(filePath, content);
}
console.log('✔ Updated website release labels');

console.log('Update complete!');
