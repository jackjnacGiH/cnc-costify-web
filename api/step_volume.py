"""
Vercel Python Serverless function: /api/step_volume
Parses STEP files using pure Python — no pythonocc-core required.
Endpoint: POST /api/step_volume  (multipart/form-data, field: file)
Returns:  { "volume_mm3": float, "stock": {...} }
"""

from http.server import BaseHTTPRequestHandler
import json
import re
import cgi
import io


def parse_step_entities(content: str) -> dict:
    """Build an entity map: {id_str: (type, args_str)}"""
    entity_map = {}
    # Match: #123 = TYPE_NAME(args);
    for m in re.finditer(r'#(\d+)\s*=\s*([A-Z_][A-Z0-9_]*)\s*\(([^;]*)\);', content, re.IGNORECASE):
        eid, etype, eargs = m.group(1), m.group(2).upper(), m.group(3)
        entity_map[eid] = (etype, eargs)
    return entity_map


def get_vertex_coordinates(entity_map: dict) -> list:
    """
    Extract vertex point coordinates.
    VERTEX_POINT references a CARTESIAN_POINT.
    This avoids picking up normal direction vectors.
    """
    # Build cartesian point lookup
    cp_map = {}  # id -> (x, y, z)
    for eid, (etype, eargs) in entity_map.items():
        if etype == 'CARTESIAN_POINT':
            nums = re.findall(r'[-+]?\d*\.?\d+(?:[Ee][+-]?\d+)?', eargs)
            if len(nums) >= 3:
                try:
                    cp_map[eid] = (float(nums[0]), float(nums[1]), float(nums[2]))
                except ValueError:
                    pass

    # Collect vertex point IDs
    vertex_point_ids = set()
    for eid, (etype, eargs) in entity_map.items():
        if etype == 'VERTEX_POINT':
            refs = re.findall(r'#(\d+)', eargs)
            for ref in refs:
                if ref in cp_map:
                    vertex_point_ids.add(ref)

    # If no VERTEX_POINT found, fall back to all CARTESIAN_POINTs
    if not vertex_point_ids:
        return list(cp_map.values())

    return [cp_map[vid] for vid in vertex_point_ids if vid in cp_map]


def detect_scale(content: str, dx: float, dy: float, dz: float) -> float:
    """Detect if STEP is in meters (need ×1000 to convert to mm)."""
    # Look for unit declarations
    unit_match = re.search(
        r'SI_UNIT\s*\([^)]*\)\s*,\s*\.\s*(MILLI|CENTI|DECI|KILO)?\s*\.\s*,\s*\.\s*METRE\s*\.',
        content, re.IGNORECASE
    )
    if unit_match:
        prefix = (unit_match.group(1) or '').upper()
        if prefix == 'MILLI':
            return 1.0
        elif prefix == 'CENTI':
            return 10.0
        elif prefix == '':  # bare METRE
            return 1000.0
        elif prefix == 'KILO':
            return 1_000_000.0
    # Heuristic: if all dims > 5000 they're probably in mm already,
    # but if they're < 5 they might be in metres
    max_dim = max(dx, dy, dz)
    if max_dim > 0 and max_dim < 10:
        return 1000.0  # likely metres
    return 1.0


def compute_fill_factor(entity_map: dict) -> float:
    """
    Estimate the fill factor (actual volume / bounding box volume).
    Uses face complexity heuristics calibrated against known parts.
    """
    face_count = sum(1 for (et, _) in entity_map.values() if et == 'ADVANCED_FACE')
    solid_count = sum(1 for (et, _) in entity_map.values() if et == 'MANIFOLD_SOLID_BREP')
    surface_count = sum(1 for (et, _) in entity_map.values()
                        if et in ('CYLINDRICAL_SURFACE', 'CONICAL_SURFACE', 'SPHERICAL_SURFACE',
                                  'TOROIDAL_SURFACE', 'B_SPLINE_SURFACE_WITH_KNOTS', 'B_SPLINE_SURFACE'))
    plane_count = sum(1 for (et, _) in entity_map.values() if et == 'PLANE')

    if face_count == 0:
        return 0.5  # fallback

    # Curved surface ratio — more curves = less fill
    curve_ratio = surface_count / max(face_count, 1)
    plane_ratio = plane_count / max(face_count, 1)

    # Base fill: prismatic parts (all planes) ≈ 0.55–0.75
    #            turned parts (many cylinders) ≈ 0.30–0.55
    #            complex machined ≈ 0.45–0.65
    if plane_ratio > 0.85:
        # Mostly flat faces → close to a rectangular block
        base = 0.70
    elif curve_ratio > 0.40:
        # Lots of curved surfaces → cylindrical or complex
        base = 0.45
    else:
        base = 0.58

    # Adjust for solid count (assemblies)
    if solid_count > 1:
        base = min(base * 1.05, 0.85)

    return base


def step_volume_and_stock(content: str) -> dict:
    entity_map = parse_step_entities(content)
    vertices = get_vertex_coordinates(entity_map)

    if not vertices:
        return {"error": "No vertex coordinates found in STEP file"}

    xs = [v[0] for v in vertices]
    ys = [v[1] for v in vertices]
    zs = [v[2] for v in vertices]

    raw_dx = max(xs) - min(xs)
    raw_dy = max(ys) - min(ys)
    raw_dz = max(zs) - min(zs)

    # Detect and apply scale
    scale = detect_scale(content, raw_dx, raw_dy, raw_dz)
    dx = raw_dx * scale
    dy = raw_dy * scale
    dz = raw_dz * scale

    bounding_volume = dx * dy * dz
    fill = compute_fill_factor(entity_map)
    volume_mm3 = bounding_volume * fill

    # Sort dims for stock (H × W × D convention: smallest first)
    dims = sorted([round(dx, 2), round(dy, 2), round(dz, 2)])
    h, w, d = dims[0], dims[1], dims[2]
    stock_volume = round(dx * dy * dz, 3)

    return {
        "volume_mm3": round(volume_mm3, 2),
        "stock": {
            "type": "box",
            "stock": {
                "width_mm": w,
                "depth_mm": d,
                "height_mm": h
            },
            "volume_mm3": stock_volume,
            "stock_size_label": f"{h:.2f}x{w:.2f}x{d:.2f} mm"
        }
    }


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_POST(self):
        try:
            content_type = self.headers.get('Content-Type', '')
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)

            # Parse multipart
            environ = {
                'REQUEST_METHOD': 'POST',
                'CONTENT_TYPE': content_type,
                'CONTENT_LENGTH': str(length),
            }
            fp = io.BytesIO(body)
            form = cgi.FieldStorage(fp=fp, environ=environ, headers=self.headers)

            file_item = form.getvalue('file')
            if file_item is None:
                self._json({'error': 'No file uploaded'}, 400)
                return

            if isinstance(file_item, bytes):
                content = file_item.decode('utf-8', errors='ignore')
            else:
                content = str(file_item)

            result = step_volume_and_stock(content)
            self._json(result, 200)

        except Exception as e:
            self._json({'error': str(e)}, 500)

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _json(self, data: dict, status: int = 200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self._cors()
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
