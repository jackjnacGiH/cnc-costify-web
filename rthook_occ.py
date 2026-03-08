import os
import sys

# Runtime hook to setup OpenCascade environment variables
# This is critical for STEP file processing and Unit conversion

if getattr(sys, 'frozen', False):
    base_dir = sys._MEIPASS
    
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
