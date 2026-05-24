@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Flowchart Web (React Flow)

echo ========================================
echo   Flowchart Web (React Flow) を起動します
echo   終了: この窓で Ctrl+C
echo ========================================
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo [エラー] Node.js / npm が見つかりません。
  echo https://nodejs.org/ からインストールしてください。
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo 初回のみ npm install を実行します...
  call npm install
  if errorlevel 1 (
    echo [エラー] npm install に失敗しました。
    pause
    exit /b 1
  )
  echo.
)

echo サーバーを起動し、数秒後にブラウザを開きます...
start "" cmd /c "timeout /t 7 /nobreak >nul && start http://localhost:3000"

call npm run dev

pause
