@echo off
cd /d "%~dp0"
echo flowchart-web-mermaid - http://localhost:3001
echo 終了は Ctrl+C
call npm run dev
