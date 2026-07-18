!macro customInit
  DetailPrint "Stopping CNC Costify AI if running..."
  ; Kill all known versions
  nsExec::ExecToStack 'taskkill /IM "CNC Costify AI V5.13.exe" /F /T'
  Pop $0
  nsExec::ExecToStack 'taskkill /IM "CNC Costify AI V5.0.exe" /F /T'
  Pop $0
  nsExec::ExecToStack 'taskkill /IM "CNC Costify AI-Ollama MIT License.exe" /F /T'
  Pop $0
  nsExec::ExecToStack 'taskkill /IM "CNC Costify AI 2027 V3.2.exe" /F /T'
  Pop $0
  nsExec::ExecToStack 'taskkill /IM "CNC Costify AI 2027 V3.1.exe" /F /T'
  Pop $0
  nsExec::ExecToStack 'taskkill /IM "CNC Costify AI.exe" /F /T'
  Pop $0
  nsExec::ExecToStack 'taskkill /IM "CNC Costify AI 2026.exe" /F /T'
  Pop $0
  Sleep 400
  ; Kill bundled Python backend
  nsExec::ExecToStack 'taskkill /IM "CNC-Costify-AI.exe" /F /T'
  Pop $0
  Sleep 400
  ; Kill Admin app if running
  nsExec::ExecToStack 'taskkill /IM "CNC Costify AI Admin.exe" /F /T'
  Pop $0
  nsExec::ExecToStack 'taskkill /IM "CNC-Costify-AI-Admin.exe" /F /T'
  Pop $0
  Sleep 300

  ; Create writable data directories under ProgramData so non-admin users
  ; can write logs and config without permission errors (Errno 13).
  ; Use a temp batch file so CMD expands %PROGRAMDATA% correctly
  ; (avoids NSIS $COMMONAPPDATA variable parsing issues).
  DetailPrint "Setting up shared data directories..."
  FileOpen $0 "$TEMP\cnc_setup_dirs.cmd" w
  FileWrite $0 "@echo off$\r$\n"
  FileWrite $0 'mkdir "%PROGRAMDATA%\CNC Costify AI" 2>nul'
  FileWrite $0 "$\r$\n"
  FileWrite $0 'mkdir "%PROGRAMDATA%\CNC Costify AI\logs" 2>nul'
  FileWrite $0 "$\r$\n"
  FileWrite $0 'mkdir "%PROGRAMDATA%\CNC Costify AI\config" 2>nul'
  FileWrite $0 "$\r$\n"
  FileWrite $0 'icacls "%PROGRAMDATA%\CNC Costify AI" /grant "Users:(OI)(CI)F" /T /C /Q'
  FileWrite $0 "$\r$\n"
  FileClose $0
  nsExec::ExecToStack '"$TEMP\cnc_setup_dirs.cmd"'
  Pop $1
  Delete "$TEMP\cnc_setup_dirs.cmd"
!macroend

!macro customUnInstall
  DetailPrint "Stopping CNC Costify AI V5.13 if running..."
  nsExec::ExecToStack 'taskkill /IM "CNC Costify AI V5.13.exe" /F /T'
  Pop $0
  nsExec::ExecToStack 'taskkill /IM "CNC Costify AI V5.0.exe" /F /T'
  Pop $0
  nsExec::ExecToStack 'taskkill /IM "CNC Costify AI-Ollama MIT License.exe" /F /T'
  Pop $0
  nsExec::ExecToStack 'taskkill /IM "CNC Costify AI 2027 V3.2.exe" /F /T'
  Pop $0
  nsExec::ExecToStack 'taskkill /IM "CNC Costify AI 2027 V3.1.exe" /F /T'
  Pop $0
  nsExec::ExecToStack 'taskkill /IM "CNC Costify AI.exe" /F /T'
  Pop $0
  nsExec::ExecToStack 'taskkill /IM "CNC-Costify-AI.exe" /F /T'
  Pop $0
  nsExec::ExecToStack 'taskkill /IM "CNC Costify AI Admin.exe" /F /T'
  Pop $0
  nsExec::ExecToStack 'taskkill /IM "CNC-Costify-AI-Admin.exe" /F /T'
  Pop $0
  Sleep 300
!macroend
