/**
 * STEP File Parser — Client-side (Browser & Node.js compatible)
 *
 * Strategy:
 *  1. Build a full entity map from the DATA section (#id = TYPE(args);)
 *  2. Resolve VERTEX_POINT → CARTESIAN_POINT to get actual geometry vertices
 *     (ignores direction vectors, surface normals, etc.)
 *  3. Compute axis-aligned bounding box from vertices only
 *  4. Detect unit scale from SI_UNIT declaration
 *  5. Estimate fill factor from face/surface type counts
 *  6. volume_mm3 = bounding_box × fill_factor
 */

class StepConverter {
    constructor() {}

    // ─── Parse all STEP entities into a map ─────────────────────────────────
    _parseEntities(content) {
        const map = {};
        // Match:  #123 = TYPE_NAME('label', (...));
        // The args group captures everything between the outer parens.
        // We use a simple regex that works for flat entity lines.
        const re = /#(\d+)\s*=\s*([A-Z_][A-Z0-9_]*)\s*\(([\s\S]*?)\)\s*;/gm;
        let m;
        while ((m = re.exec(content)) !== null) {
            map[m[1]] = { type: m[2].toUpperCase(), args: m[3] };
        }
        return map;
    }

    // ─── Extract 3-D coordinates from VERTEX_POINT refs only ────────────────
    _getVertexCoords(entityMap) {
        // 1. Build CARTESIAN_POINT lookup
        const cpMap = {};
        for (const [id, { type, args }] of Object.entries(entityMap)) {
            if (type !== 'CARTESIAN_POINT') continue;
            const nums = args.match(/[-+]?\d*\.?\d+(?:[Ee][+-]?\d+)?/g);
            if (nums && nums.length >= 3) {
                cpMap[id] = [parseFloat(nums[0]), parseFloat(nums[1]), parseFloat(nums[2])];
            }
        }

        // 2. Collect CARTESIAN_POINT ids referenced by VERTEX_POINT
        const vpIds = new Set();
        for (const [, { type, args }] of Object.entries(entityMap)) {
            if (type !== 'VERTEX_POINT') continue;
            const refs = args.match(/#(\d+)/g);
            if (refs) refs.forEach(r => { const id = r.slice(1); if (cpMap[id]) vpIds.add(id); });
        }

        // 3. Return vertex coords; fall back to ALL cartesian points if none found
        if (vpIds.size > 0) {
            return [...vpIds].map(id => cpMap[id]);
        }
        return Object.values(cpMap);
    }

    // ─── Detect unit scale factor → mm ──────────────────────────────────────
    _detectScale(content, dx, dy, dz) {
        // STEP unit line looks like:  SI_UNIT(.MILLI.,.METRE.)
        const m = content.match(/SI_UNIT\s*\([^)]*\.(MILLI|CENTI|DECI|KILO)?\.\s*,\s*\.METRE\.\s*\)/i);
        if (m) {
            const p = (m[1] || '').toUpperCase();
            if (p === 'MILLI') return 1.0;
            if (p === 'CENTI') return 10.0;
            if (p === 'DECI') return 100.0;
            if (p === 'KILO') return 1e6;
            return 1000.0; // bare METRE
        }
        // Heuristic: if bounding box max dim < 10, likely metres → convert
        const maxDim = Math.max(dx, dy, dz);
        if (maxDim > 0 && maxDim < 10) return 1000.0;
        return 1.0;
    }

    // ─── Estimate fill factor from geometry statistics ───────────────────────
    _fillFactor(entityMap) {
        let faces = 0, planes = 0, curves = 0, solids = 0;
        const CURVED = new Set([
            'CYLINDRICAL_SURFACE', 'CONICAL_SURFACE', 'SPHERICAL_SURFACE',
            'TOROIDAL_SURFACE', 'B_SPLINE_SURFACE_WITH_KNOTS', 'B_SPLINE_SURFACE'
        ]);
        for (const { type } of Object.values(entityMap)) {
            if (type === 'ADVANCED_FACE') faces++;
            if (type === 'PLANE') planes++;
            if (CURVED.has(type)) curves++;
            if (type === 'MANIFOLD_SOLID_BREP') solids++;
        }
        if (faces === 0) return 0.55;
        const pr = planes / faces;   // plane ratio
        const cr = curves / faces;   // curve ratio

        // Calibrated against AL_Base_1 (machined block, mostly flat):
        //   real vol = 4,368,222 / bbox vol = 6,900,000  → fill ≈ 0.633
        let f;
        if (pr > 0.85) {
            // Mostly planar → rectangular machined block (pockets, slots)
            f = 0.63;
        } else if (cr > 0.50) {
            // Mostly curved → turned part or round stock
            f = 0.50;
        } else if (cr > 0.30) {
            // Mixed (pockets + holes)
            f = 0.56;
        } else {
            // General prismatic with holes/features
            f = 0.60;
        }
        if (solids > 1) f = Math.min(f * 1.05, 0.85);
        return f;
    }

    // ─── Main bounding-box + fill computation ────────────────────────────────
    _computeFromContent(content) {
        const entityMap = this._parseEntities(content);
        const verts = this._getVertexCoords(entityMap);

        if (!verts || verts.length < 2) {
            return { volume_mm3: 0, stock: null, error: 'No vertices' };
        }

        const xs = verts.map(v => v[0]);
        const ys = verts.map(v => v[1]);
        const zs = verts.map(v => v[2]);
        const rawDx = Math.max(...xs) - Math.min(...xs);
        const rawDy = Math.max(...ys) - Math.min(...ys);
        const rawDz = Math.max(...zs) - Math.min(...zs);

        const scale  = this._detectScale(content, rawDx, rawDy, rawDz);
        const dx = rawDx * scale;
        const dy = rawDy * scale;
        const dz = rawDz * scale;

        const bbVol  = dx * dy * dz;
        const fill   = this._fillFactor(entityMap);
        const vol    = Math.round(bbVol * fill * 100) / 100;

        // Sort dims ascending for stock (height = smallest, depth = largest)
        const dims = [dx, dy, dz].map(v => Math.round(v * 100) / 100).sort((a, b) => a - b);

        return {
            volume_mm3: vol,
            stock: {
                type: 'box',
                stock: {
                    width_mm:  dims[1],
                    depth_mm:  dims[2],
                    height_mm: dims[0]
                },
                volume_mm3: Math.round(bbVol * 1000) / 1000
            }
        };
    }

    // ─── Public API (mirrors old interface so HTML code needs no changes) ────

    /** Returns estimated volume in mm³ */
    async calculateVolumeFromSTEP(fileContent /*, fileName */) {
        try {
            const r = this._computeFromContent(fileContent);
            return r.volume_mm3 > 0 ? r.volume_mm3 : 0;
        } catch (e) {
            console.error('STEP volume calc failed:', e);
            return 0;
        }
    }

    /** Returns stock object: { type, stock: { width_mm, depth_mm, height_mm }, volume_mm3 } */
    calculateStockFromSTEP(fileContent) {
        try {
            const r = this._computeFromContent(fileContent);
            return r.stock || null;
        } catch (e) {
            console.error('STEP stock calc failed:', e);
            return null;
        }
    }

    /** Read file as text (browser FileReader) */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload  = e => resolve(e.target.result);
            reader.onerror = e => reject(e);
            reader.readAsText(file);
        });
    }
}

// Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StepConverter;
}
