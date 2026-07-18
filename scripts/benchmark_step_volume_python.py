"""
Benchmark STEP/STP volume using OpenCASCADE (PythonOCC) mass properties.

Usage:
  python scripts/benchmark_step_volume_python.py [--dir <path>] [--ref <reference.csv>] [--out <output.csv>]

CSV columns:
  file, volume_mm3, zw3d_volume, solidworks_volume, diff_vs_zw3d, diff_vs_solidworks, runtime_ms, filesize_bytes
"""

import os
import sys
import time
import argparse
import csv

try:
    # Core OCC imports
    from OCC.Core.STEPControl import STEPControl_Reader
    from OCC.Core.IFSelect import IFSelect_RetDone
    from OCC.Core.TopExp import TopExp_Explorer
    from OCC.Core.TopAbs import TopAbs_SOLID
    from OCC.Core.GProp import GProp_GProps
    from OCC.Core.BRepGProp import brepgprop_VolumeProperties
    from OCC.Core.TopoDS import TopoDS_Shape
except Exception as e:
    print("ERROR: pythonocc-core not installed or OCC imports failed.")
    print("Install: python -m pip install pythonocc-core")
    raise


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", default=os.getcwd(), help="Directory containing STEP/STP files")
    parser.add_argument("--ref", default=None, help="Reference CSV with columns: file,zw3d_volume,solidworks_volume")
    parser.add_argument("--out", default="benchmark_step_occt.csv", help="Output CSV path")
    return parser.parse_args()


def load_reference(ref_path):
    if not ref_path or not os.path.exists(ref_path):
        return {}
    ref = {}
    with open(ref_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            file = (row.get('file') or '').strip()
            zw = row.get('zw3d_volume')
            sw = row.get('solidworks_volume')
            try:
                zw_val = float(zw) if zw not in (None, '') else None
            except ValueError:
                zw_val = None
            try:
                sw_val = float(sw) if sw not in (None, '') else None
            except ValueError:
                sw_val = None
            if file:
                ref[file] = {"zw3d_volume": zw_val, "solidworks_volume": sw_val}
    return ref


def compute_volume_step(path_step):
    """Compute volume (mm^3) of all solids in a STEP file using OCCT mass properties."""
    reader = STEPControl_Reader()
    status = reader.ReadFile(path_step)
    if status != IFSelect_RetDone:
        raise RuntimeError(f"Failed to read STEP file: {path_step}")

    # Transfer all roots to produce a combined shape
    reader.TransferRoots()
    shape = reader.OneShape()

    # Sum mass properties over SOLID sub-shapes
    total_volume = 0.0
    exp = TopExp_Explorer(shape, TopAbs_SOLID)
    has_solid = False
    while exp.More():
        solid = exp.Current()
        has_solid = True
        props = GProp_GProps()
        brepgprop_VolumeProperties(solid, props)
        total_volume += props.Mass()
        exp.Next()

    if not has_solid:
        # Fallback: compute on the whole shape (may be 0 if not a solid)
        props = GProp_GProps()
        brepgprop_VolumeProperties(shape, props)
        total_volume = props.Mass()

    # Note: Units are taken from the STEP; most files here are mm, so mass==volume_mm3
    return total_volume


def main():
    args = parse_args()
    dir_path = os.path.abspath(args.dir)
    ref_map = load_reference(args.ref)

    files = [
        f for f in os.listdir(dir_path)
        if f.lower().endswith('.step') or f.lower().endswith('.stp')
    ]
    files.sort()
    if not files:
        print("No STEP/STP files found.")
        return

    out_path = os.path.abspath(args.out)
    rows = []
    header = [
        'file','volume_mm3','zw3d_volume','solidworks_volume',
        'diff_vs_zw3d','diff_vs_solidworks','runtime_ms','filesize_bytes'
    ]
    rows.append(header)

    for fname in files:
        fpath = os.path.join(dir_path, fname)
        start = time.time()
        try:
            vol = compute_volume_step(fpath)
        except Exception as e:
            print(f"ERROR {fname}: {e}")
            vol = float('nan')
        runtime_ms = int((time.time() - start) * 1000)
        size = os.path.getsize(fpath)

        ref = ref_map.get(fname, {})
        zw = ref.get('zw3d_volume')
        sw = ref.get('solidworks_volume')

        diff_zw = (vol - zw) if (zw is not None and not (vol != vol)) else ''
        diff_sw = (vol - sw) if (sw is not None and not (vol != vol)) else ''

        row = [
            fname,
            f"{vol:.6f}" if vol == vol else '',
            f"{zw:.6f}" if isinstance(zw, float) else '',
            f"{sw:.6f}" if isinstance(sw, float) else '',
            f"{diff_zw:.6f}" if isinstance(diff_zw, float) else '',
            f"{diff_sw:.6f}" if isinstance(diff_sw, float) else '',
            str(runtime_ms),
            str(size)
        ]
        rows.append(row)
        print(f"Done {fname} -> volume={row[1] or 'ERR'} mm³, runtime={runtime_ms} ms")

    with open(out_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    print(f"CSV written: {out_path}")


if __name__ == '__main__':
    main()