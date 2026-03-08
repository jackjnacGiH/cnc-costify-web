// Benchmark STEP volume calculation and export CSV
// Usage: node scripts/benchmark_step_volume.js [--dir <path>] [--ref <reference.csv>] [--out <output.csv>]

const fs = require('fs');
const path = require('path');
const StepConverter = require('../step-converter');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { dir: process.cwd(), ref: null, out: 'benchmark_step_results.csv' };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dir' && args[i + 1]) {
      opts.dir = path.resolve(args[++i]);
    } else if (a === '--ref' && args[i + 1]) {
      opts.ref = path.resolve(args[++i]);
    } else if (a === '--out' && args[i + 1]) {
      opts.out = path.resolve(args[++i]);
    }
  }
  return opts;
}

function loadReferenceMap(refPath) {
  if (!refPath) return {};
  if (!fs.existsSync(refPath)) return {};
  const csv = fs.readFileSync(refPath, 'utf8');
  const lines = csv.split(/\r?\n/).filter(Boolean);
  // Expect header: file,zw3d_volume,solidworks_volume
  const header = lines.shift();
  const map = {};
  for (const line of lines) {
    const [file, zw3d, solidworks] = line.split(',');
    map[file.trim()] = {
      zw3d_volume: zw3d ? parseFloat(zw3d) : undefined,
      solidworks_volume: solidworks ? parseFloat(solidworks) : undefined,
    };
  }
  return map;
}

async function main() {
  const { dir, ref, out } = parseArgs();
  console.log(`Benchmark directory: ${dir}`);
  const files = fs.readdirSync(dir)
    .filter(f => /\.(step|stp)$/i.test(f))
    .map(f => path.join(dir, f));

  if (files.length === 0) {
    console.log('No STEP files found.');
    process.exit(0);
  }

  const refMap = loadReferenceMap(ref);
  const converter = new StepConverter();

  const rows = [];
  rows.push(['file', 'volume_mm3', 'zw3d_volume', 'solidworks_volume', 'diff_vs_zw3d', 'diff_vs_solidworks', 'runtime_ms', 'filesize_bytes'].join(','));

  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const start = Date.now();
    const content = fs.readFileSync(filePath, 'utf8');
    let volume = 0;
    try {
      volume = await converter.calculateVolumeFromSTEP(content, fileName);
    } catch (err) {
      console.error(`Error calculating volume for ${fileName}:`, err.message);
      volume = NaN;
    }
    const runtime = Date.now() - start;
    const size = fs.statSync(filePath).size;
    const refEntry = refMap[fileName] || {};
    const zw = refEntry.zw3d_volume;
    const sw = refEntry.solidworks_volume;
    const diffZw = typeof zw === 'number' && typeof volume === 'number' ? (volume - zw) : '';
    const diffSw = typeof sw === 'number' && typeof volume === 'number' ? (volume - sw) : '';
    rows.push([
      fileName,
      Number.isFinite(volume) ? volume.toFixed(6) : '',
      typeof zw === 'number' ? zw.toFixed(6) : '',
      typeof sw === 'number' ? sw.toFixed(6) : '',
      diffZw !== '' ? diffZw.toFixed(6) : '',
      diffSw !== '' ? diffSw.toFixed(6) : '',
      runtime,
      size
    ].join(','));
    console.log(`Done ${fileName} -> volume=${Number.isFinite(volume) ? volume.toFixed(3) : 'ERR'} mm³, runtime=${runtime} ms`);
  }

  fs.writeFileSync(out, rows.join('\n'), 'utf8');
  console.log(`CSV written: ${out}`);
}

main().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});