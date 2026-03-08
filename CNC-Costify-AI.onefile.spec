# -*- mode: python ; coding: utf-8 -*-
import os
from PyInstaller.utils.hooks import collect_submodules, collect_data_files

block_cipher = None

# Collect all OCC submodules to ensure dynamic imports work
occ_hidden_imports = collect_submodules('OCC')

# Collect OCC data files (resources like STEP definitions)
try:
    occ_datas = collect_data_files('OCC')
except Exception:
    occ_datas = []
    print("WARNING: Could not collect OCC data files. STEP reading might fail.")

# Manual override for Conda resources (fix for missing resources in OneFile build)
conda_occ_resources = 'C:/Users/HP/Miniconda3-occt/envs/occ/Library/share/opencascade/resources'
if os.path.exists(conda_occ_resources):
    print(f"Found Conda OCC resources at {conda_occ_resources}")
    # Copy entire resources folder to share/opencascade/resources in the bundle
    occ_datas.append((conda_occ_resources, 'share/opencascade/resources'))
else:
    print(f"WARNING: Conda OCC resources not found at {conda_occ_resources}")


a = Analysis(
    ['server.py'],
    pathex=['C:/Users/HP/Miniconda3-occt/envs/occ/Library/bin'],
    binaries=[],
    datas=[
        ('assets/icons', 'assets/icons'),
        ('CNC_Costify_AI_V6.html', '.'),
        ('STLLoader.js', '.')
    ] + occ_datas,
    hiddenimports=occ_hidden_imports + [
        'OCC.Core.BRepBuilderAPI', 
        'OCC.Core.gp', 
        'OCC.Core.Bnd', 
        'OCC.Core.BRepBndLib',
        'OCC.Core.STEPControl',
        'OCC.Core.IFSelect',
        'OCC.Core.TopExp',
        'OCC.Core.TopAbs',
        'OCC.Core.GProp',
        'OCC.Core.BRepGProp',
        'OCC.Core.BRepMesh',
        'OCC.Core.BRep',
        'OCC.Core.TopoDS',
        'OCC.Core.BRepAdaptor',
        'OCC.Core.GeomAbs',
        'OCC.Core.UnitsAPI',
        'OCC.Core.Message',
        'OCC.Core.Interface',
        'OCC.Core.TCollection'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=['rthook_occ.py'],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

# Force include OCC DLLs from Conda Library/bin
conda_bin_dir = 'C:/Users/HP/Miniconda3-occt/envs/occ/Library/bin'
if os.path.exists(conda_bin_dir):
    print(f"Collecting OCC DLLs from {conda_bin_dir}")
    import glob
    # Collect TK*.dll (OCC core), tbb*.dll (threading), free*.dll (FreeImage/FreeType)
    # Also include lib*.dll (libpng, libxml, etc.), iconv, fontconfig, charset
    dll_patterns = ['TK*.dll', 'tbb*.dll', 'free*.dll', 'lib*.dll', 'iconv.dll', 'fontconfig*.dll', 'charset.dll']
    for pattern in dll_patterns:
        for dll_path in glob.glob(os.path.join(conda_bin_dir, pattern)):
            # Add to binaries: (dest_name, source_path, type)
            # Type 'BINARY' is standard for DLLs
            filename = os.path.basename(dll_path)
            a.binaries.append((filename, dll_path, 'BINARY'))
else:
    print(f"WARNING: Conda bin dir not found at {conda_bin_dir}")

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='CNC-Costify-AI',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # No console window
    disable_windowed_traceback=True,
    target_arch=None,
    icon='assets/icons/app.ico',
)
