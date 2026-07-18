# Installation Guide for CNC Costify AI V5.13

Welcome to the CNC Costify AI V5.13 installation guide. This software provides advanced cost calculation tools for CNC machining.

## System Requirements

### Windows
- **OS:** Windows 10 or Windows 11 (64-bit)
- **Processor:** Intel Core i3 / AMD Ryzen 3 or better
- **Memory:** 4 GB RAM minimum (8 GB recommended)
- **Disk Space:** 500 MB free space
- **Display:** 1366x768 minimum resolution

### macOS (Build Required)
- **OS:** macOS 10.15 (Catalina) or later
- **Processor:** Intel or Apple Silicon (M1/M2/M3)

### Linux (Build Required)
- **OS:** Ubuntu 20.04+, Fedora 34+, or compatible distributions
- **Dependencies:** Python 3.10+, GTK3

---

## Installation Instructions

### Windows (Pre-built Installer)

1.  **Download:** Locate the installer file `CNC Costify AI V5.13 Setup.exe` in the `release_v5` folder (or download it from the distribution source).
2.  **Run Installer:** Double-click the `.exe` file.
3.  **Security Warning:** If Windows SmartScreen appears, click **"More info"** and then **"Run anyway"** (this happens because the app is not signed with a paid certificate yet).
4.  **Installation:** The installer will automatically set up the application. A shortcut will be created on your Desktop and Start Menu.
5.  **Launch:** Open "CNC Costify AI V5.13" from the Desktop shortcut.

### macOS & Linux (Building from Source)

Since the pre-built installer is currently for Windows, macOS and Linux users need to build the application from source.

**Prerequisites:**
- Node.js (v16+)
- Python (v3.10+)
- Git

**Steps:**

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd cnc-costify-web
    ```

2.  **Install Dependencies:**
    ```bash
    # Install Node.js dependencies
    npm install

    # Install Python dependencies
    pip install -r requirements.txt
    # OR using Conda (Recommended)
    conda create -n occ python=3.10
    conda activate occ
    conda install -c conda-forge pythonocc-core=7.8.1 flask pyinstaller openpyxl
    ```

3.  **Build the Application:**
    - **macOS:**
      ```bash
      npm run backend:build:onefile
      npm run dist:mac  # Ensure you add "dist:mac": "electron-builder --mac" to package.json scripts
      ```
    - **Linux:**
      ```bash
      npm run backend:build:onefile
      npm run dist:linux # Ensure you add "dist:linux": "electron-builder --linux" to package.json scripts
      ```

4.  **Run:**
    Locate the built package in the `release_v5` or `dist` directory and run it.

---

## Troubleshooting

### Windows
*   **Application fails to start:**
    *   Ensure no other instance of the application is running.
    *   Check if your antivirus is blocking `CNC-Costify-AI.exe`.
*   **"Port 5001/5002 is already in use":**
    *   The application uses port 5001/5002 for its internal server. Open Task Manager and kill any existing `python.exe` or `CNC-Costify-AI.exe` processes.

### General
*   **Calculation errors:**
    *   Ensure input values are numbers.
    *   Check if the geometry file (STEP/IGES) is valid.
    *   **Note:** .x_t (Parasolid) files are no longer supported. Please convert to .STEP before uploading.

## Support
For further assistance, please contact the development team or open an issue in the project repository.
