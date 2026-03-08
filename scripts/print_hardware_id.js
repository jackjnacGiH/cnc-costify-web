#!/usr/bin/env node
// Print hardware_id as computed by electron/licenseManager.js
const path = require('path');
const lm = require(path.join(__dirname, '..', 'electron', 'licenseManager.js'));

const id = lm.computeHardwareId();
if (!id) {
  console.error('Failed to compute hardware_id');
  process.exit(1);
}
console.log(id);