import os
import sys

# Runtime hook to setup OpenCascade environment variables
# This is critical for STEP file processing and Unit conversion

if getattr(sys, 'frozen', False):
    base_dir = sys._MEIPASS

    # Python 3.8+ requires os.add_dll_directory() for DLLs outside standard search paths.
    # CRITICAL: keep the returned cookie alive — DLL directory is removed when GC'd.
    # Stash on sys module which lives for entire process.
    if not hasattr(sys, '_occ_dll_cookies'):
        sys._occ_dll_cookies = []
    try:
        sys._occ_dll_cookies.append(os.add_dll_directory(base_dir))
    except (AttributeError, OSError):
        pass

    # Also prepend to PATH as fallback
    os.environ['PATH'] = base_dir + os.pathsep + os.environ.get('PATH', '')

    # Belt-and-braces: pre-load every TK*.dll using LOAD_WITH_ALTERED_SEARCH_PATH
    # so each DLL's siblings (its dependencies) resolve from the same folder.
    # winmode=8 = LOAD_WITH_ALTERED_SEARCH_PATH — searches the DLL's own dir first.
    import ctypes, glob
    sys._occ_loaded_dlls = []
    LOAD_WITH_ALTERED_SEARCH_PATH = 0x00000008

    # Multi-pass loop: keep retrying failed loads until no progress (resolves topology)
    pending = sorted(glob.glob(os.path.join(base_dir, 'TK*.dll')))
    rounds, max_rounds = 0, 8
    while pending and rounds < max_rounds:
        rounds += 1
        next_pending = []
        for p in pending:
            try:
                sys._occ_loaded_dlls.append(ctypes.WinDLL(p, winmode=LOAD_WITH_ALTERED_SEARCH_PATH))
            except OSError:
                next_pending.append(p)
        if len(next_pending) == len(pending):
            break  # no progress this round
        pending = next_pending
    print(f"DEBUG: preloaded {len(sys._occ_loaded_dlls)} OCC DLLs in {rounds} rounds; "
          f"{len(pending)} unresolved: {[os.path.basename(p) for p in pending]}")
    
    # 1. Try to find the bundled Conda resources (Preferred)
    # Structure: share/opencascade/resources
    occ_res_dir = os.path.join(base_dir, 'share', 'opencascade', 'resources')
    
    if os.path.exists(occ_res_dir):
        print(f"DEBUG: Found bundled OCC resources at {occ_res_dir}")
        
        # Units
        units_file = os.path.join(occ_res_dir, 'UnitsAPI', 'Units.dat')
        if os.path.exists(units_file):
            os.environ['CSF_UnitsDefinition'] = units_file
        
        # STEP
        step_dir = os.path.join(occ_res_dir, 'XSTEPResource')
        if os.path.exists(step_dir):
            os.environ['CSF_STEPDefaults'] = step_dir
            
        # Standard Resources & Plugins
        std_res_dir = os.path.join(occ_res_dir, 'StdResource')
        if os.path.exists(std_res_dir):
            os.environ['CSF_StandardDefaults'] = std_res_dir
            os.environ['CSF_PluginDefaults'] = std_res_dir
            os.environ['CSF_XCAFDefaults'] = std_res_dir
        
        # Shaders
        shaders_dir = os.path.join(occ_res_dir, 'Shaders')
        if os.path.exists(shaders_dir):
            os.environ['CSF_ShadersDirectory'] = shaders_dir

        # CASROOT
        os.environ['CASROOT'] = os.path.dirname(occ_res_dir)
        
    else:
        # 2. Fallback: Search for 'STEP' and 'Units' anywhere (Old Logic)
        print("DEBUG: Bundled resources not found at standard path. Searching recursively...")
        resource_root = None
        for root, dirs, files in os.walk(base_dir):
            # Check for signatures of resource directories
            if 'Units.dat' in files or ('STEP' in dirs and 'StdResource' in dirs):
                resource_root = root
                break
                
        if resource_root:
            print(f"DEBUG: Found resources at {resource_root}")
            # Try to infer structure
            if os.path.exists(os.path.join(resource_root, 'Units.dat')):
                 os.environ['CSF_UnitsDefinition'] = os.path.join(resource_root, 'Units.dat')
            
            # If we found the parent 'resources' dir
            if 'UnitsAPI' in os.listdir(resource_root):
                 os.environ['CSF_UnitsDefinition'] = os.path.join(resource_root, 'UnitsAPI', 'Units.dat')
                 os.environ['CSF_STEPDefaults'] = os.path.join(resource_root, 'XSTEPResource')
                 os.environ['CSF_StandardDefaults'] = os.path.join(resource_root, 'StdResource')
            
            # Set CASROOT
            os.environ['CASROOT'] = os.path.dirname(resource_root)

    # Print final config for debugging
    print(f"OCC Config: CASROOT={os.environ.get('CASROOT')}")
    print(f"OCC Config: CSF_UnitsDefinition={os.environ.get('CSF_UnitsDefinition')}")
