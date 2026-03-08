# CNC Costify AI 2026

**Version:** 3.0.0
**Last Updated:** 2026-03-01
**Status:** Active Development

## 📖 Project Overview
CNC Costify AI 2026 is an advanced cost estimation tool for CNC machining. It leverages Artificial Intelligence and geometric analysis to provide accurate cost calculations based on 3D CAD models (STEP/STP files). The application combines a modern, responsive user interface with a powerful Python-based geometry processing backend.

### Key Features
*   **3D Model Analysis**: Automated parsing of STEP files to calculate volume, stock size, and shape (Rectangle/Cylinder).
    *   *Note: Supports .STEP and .STP formats only for precise geometric calculation.*
*   **Smart Cost Calculation**: Real-time cost estimation including material cost, machining time, setup costs, and additional processes (Coating, Surface, Wire Cut).
*   **Material Database**: Integrated database of common engineering materials with density and cost factors.
*   **AI Chat Assistant**: Built-in AI chat (OpenAI/Gemini) for technical consultation, material properties, and general inquiries.
*   **Multi-language Support**: Full support for Thai (TH) and English (EN) interfaces.
*   **Offline Capability**: Fully functional offline mode with local license management.
*   **Responsive UI**: Optimized for various screen sizes with clear status indicators.

---

## 🏗 System Architecture

The application follows a **Hybrid Desktop Architecture**:

1.  **Frontend (Electron + Web Technologies)**:
    *   **Framework**: Electron (v35.x)
    *   **UI Library**: HTML5, Tailwind CSS (CDN/Local)
    *   **Logic**: Vanilla JavaScript (ES6+)
    *   **Entry Point**: `electron/main.js` -> `CNC_Costify_AI_V6.html`

2.  **Backend (Python Flask)**:
    *   **Framework**: Flask
    *   **Core Engine**: PythonOCC (OpenCASCADE Technology) for 3D geometry processing.
    *   **Role**: Handles complex geometric calculations, file parsing, and business logic that requires heavy computation.
    *   **Communication**: REST API over HTTP (localhost:5001/5002).
    *   **Entry Point**: `server.py`

---

## 📂 Project Structure

```plaintext
CNC Costify AI 2026/
├── assets/                 # Icons and static resources
├── dist/                   # Compiled backend executables (PyInstaller output)
├── electron/               # Electron main process files
│   ├── main.js             # Application entry point & window management
│   ├── preload.js          # IPC bridge between Main and Renderer
│   ├── licenseManager.js   # License validation logic
│   └── activation.html     # Activation window UI
├── release_final_v5/       # Final installer output (Electron Builder)
├── scripts/                # Utility scripts (versioning, benchmarking, etc.)
│   └── update-version.js   # Automated version sync script
├── CNC-Costify-AI.onefile.spec  # PyInstaller spec for OneFile build
├── CNC_Costify_AI_V6.html  # Main Application UI
├── server.py               # Python Flask Backend
├── package.json            # Node.js dependencies & scripts
├── .gitignore              # Git configuration
├── CNC Costify AI 2026.MD  # Project Documentation
├── INSTALL.md              # Installation Instructions
└── CHANGELOG.md            # Version History
```

---

## 🛠 Tech Stack & Dependencies

### Frontend (Node.js/NPM)
*   **electron**: Desktop runtime
*   **electron-builder**: Installer generation (NSIS)
*   **nodemon**: Development server
*   **tailwindcss**: Utility-first CSS framework

### Backend (Python/Conda)
*   **Python 3.10/3.11**: Recommended runtime
*   **Flask**: Web server gateway
*   **pythonocc-core**: 3D CAD kernel bindings
*   **PyInstaller**: Executable packaging

---

## 🚀 Installation & Setup

### Prerequisites
1.  **Node.js**: v16+ (LTS recommended)
2.  **Miniconda/Anaconda**: For managing PythonOCC environment.
3.  **Git**: For version control.

### Development Setup
1.  **Clone Repository**:
    ```bash
    git clone <repository_url>
    cd "CNC Costify AI 2026"
    ```

2.  **Install Node Dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Python Environment**:
    ```bash
    conda create -n occ python=3.10
    conda activate occ
    conda install -c conda-forge pythonocc-core=7.8.1 flask pyinstaller openpyxl
    ```

4.  **Run in Development Mode**:
    *   **Backend**: `python server.py` (Keep running in one terminal)
    *   **Frontend**: `npm run electron:dev`

---

## 📦 Build & Deployment

The project uses a two-step build process: Backend (Python) and Frontend/Installer (Electron).

### 1. Build Backend (OneFile)
Compiles `server.py` into a standalone `.exe` with all OCC dependencies included.
```bash
npm run backend:build:onefile
```
*   *Note*: Uses `CNC-Costify-AI.onefile.spec` to handle DLLs and resources.

### 2. Build Installer (OneClick)
Packages the Electron app and the compiled Backend into a Setup executable.
```bash
npm run build:oneclick
```
*   **Output**: `release_final_v5/CNC Costify AI 2026 V3.0 Setup.exe`

### Automated Command
To rebuild everything in one go:
```bash
npm run build:oneclick
```

---

## 🔧 Configuration & Scripts

### `package.json` Scripts
*   `npm run start`: Start backend server.
*   `npm run dev`: Start backend with nodemon.
*   `npm run electron:dev`: Launch Electron in dev mode.
*   `npm run update-version <version>`: Update project version across all files.
*   `npm run build:oneclick`: Full build pipeline.

### Versioning
*   **Current Version**: 3.0.0
*   **Versioning Scheme**: Semantic Versioning (x.y.z)
*   **Files Updated**: `package.json`, `CNC_Costify_AI_V6.html`, `server.py`, `electron/main.js`.

---

## ⚠️ Troubleshooting & Known Issues

### 1. Backend Offline / Red Status
*   **Cause**: The backend `.exe` failed to start or is blocked by antivirus.
*   **Fix**:
    *   Check `CNC_Costify_AI_Log.txt` in Documents.
    *   Ensure port 5001/5002 is free.
    *   In `electron/main.js`, `verifyBackendRuntime()` has been disabled for OneFile builds to prevent startup blocking.

### 2. PyInstaller Missing DLLs
*   **Cause**: PythonOCC relies on many DLLs (TKernel, etc.) that PyInstaller might miss.
*   **Fix**:
    *   Use `CNC-Costify-AI.onefile.spec`.
    *   Ensure the `conda_occ_resources` path in the spec file matches your Conda installation.

### 3. Git Large Files
*   **Issue**: Repository size growing due to build artifacts.
*   **Fix**: `.gitignore` has been configured to exclude `dist/`, `build/`, `node_modules/`, and `*.exe`.

### 4. File Support
*   **Note**: The system currently supports **.STEP** and **.STP** files only for 3D analysis. Support for **.x_t (Parasolid)** has been removed due to library licensing constraints. Users should convert .x_t files to .STEP before uploading.

---

## 🔮 Future Roadmap
*   **Cloud Integration**: Sync material database with cloud.
*   **Advanced Analytics**: Dashboard for cost trends.
*   **User Accounts**: Multi-user support with role-based access.

---

*Generated by Trae AI Assistant*
