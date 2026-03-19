const fs = require('fs');

function analyze(path, expectedVol, expectedStock) {
    const txt = fs.readFileSync(path, 'utf8');
    const emap = {};
    const re = /#(\d+)\s*=\s*([A-Z_][A-Z0-9_]*)\s*\(([^;]*)\)\s*;/g;
    let m;
    while ((m = re.exec(txt)) !== null)
        emap[m[1]] = { type: m[2].toUpperCase(), args: m[3] };

    const cp = {};
    for (const [id, { type, args }] of Object.entries(emap)) {
        if (type !== 'CARTESIAN_POINT') continue;
        const n = args.match(/[-+]?\d*\.?\d+(?:[Ee][+-]?\d+)?/g);
        if (n && n.length >= 3) cp[id] = [+n[0], +n[1], +n[2]];
    }
    const vpIds = new Set();
    for (const [, { type, args }] of Object.entries(emap)) {
        if (type !== 'VERTEX_POINT') continue;
        (args.match(/#(\d+)/g)||[]).forEach(r => { const id=r.slice(1); if(cp[id]) vpIds.add(id); });
    }
    const verts = vpIds.size > 0 ? [...vpIds].map(id=>cp[id]) : Object.values(cp);
    const xs=verts.map(v=>v[0]), ys=verts.map(v=>v[1]), zs=verts.map(v=>v[2]);
    const rdx=Math.max(...xs)-Math.min(...xs);
    const rdy=Math.max(...ys)-Math.min(...ys);
    const rdz=Math.max(...zs)-Math.min(...zs);

    const um = txt.match(/SI_UNIT\s*\([^)]*\.(MILLI|CENTI|DECI|KILO)?\.\s*,\s*\.METRE\.\s*\)/i);
    let s=1;
    if (um) { const p=(um[1]||'').toUpperCase(); s=p==='MILLI'?1:p==='CENTI'?10:p==='DECI'?100:p==='KILO'?1e6:1000; }
    else if (Math.max(rdx,rdy,rdz)<10) s=1000;
    const dx=rdx*s, dy=rdy*s, dz=rdz*s;

    let planes=0, curves=0, toroids=0;
    const CURVED = new Set(['CYLINDRICAL_SURFACE','CONICAL_SURFACE','SPHERICAL_SURFACE','TOROIDAL_SURFACE','B_SPLINE_SURFACE_WITH_KNOTS','B_SPLINE_SURFACE']);
    for (const { type } of Object.values(emap)) {
        if (type==='PLANE') planes++;
        else if (type==='TOROIDAL_SURFACE') { curves++; toroids++; }
        else if (CURVED.has(type)) curves++;
    }
    const tot=planes+curves, sr=tot>0?planes/tot:0.5;

    const dimsSorted = [dx,dy,dz].sort((a,b)=>a-b);
    const crossEqual = dimsSorted[0]>0 && Math.abs(dimsSorted[0]-dimsSorted[1]) < 0.15*dimsSorted[1];
    const isRound = toroids>=2 && crossEqual && sr<0.40;

    let estVol, stockLabel;
    if (isRound) {
        const D = dimsSorted[0]*2, L = dimsSorted[2];
        const roundStock = Math.PI/4*D*D*L;
        estVol = roundStock * 0.42;
        stockLabel = `⌀${D.toFixed(2)}×${L.toFixed(2)}mm (round)`;
    } else {
        const fill = Math.max(0.15, Math.min(0.85, 1.91*sr - 0.32));
        estVol = dx*dy*dz * fill;
        stockLabel = `${dimsSorted[2].toFixed(2)}×${dimsSorted[1].toFixed(2)}×${dimsSorted[0].toFixed(2)}mm`;
    }

    const err = ((estVol-expectedVol)/expectedVol*100).toFixed(1);
    console.log(`\n${path.split('\\').pop()}`);
    console.log(`  sr=${sr.toFixed(3)} toroids=${toroids} isRound=${isRound}`);
    console.log(`  dims VP: ${dx.toFixed(2)} × ${dy.toFixed(2)} × ${dz.toFixed(2)} mm`);
    console.log(`  Stock: ${stockLabel}  (ZW3D: ${expectedStock})`);
    console.log(`  Estimated: ${Math.round(estVol).toLocaleString()}  ZW3D: ${expectedVol.toLocaleString()}  Error: ${err}%`);
}

analyze('1.NID062025-PJ27-00-489.STEP', 1980000, '690×654×15mm');
analyze('VW_3D0 819 423 for 888.2.step', 24177.91, '⌀28×94mm');
