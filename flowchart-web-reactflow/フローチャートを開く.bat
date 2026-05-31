@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Flowchart Web (React Flow)

echo ========================================
echo   Flowchart Web (React Flow) を起動します
echo   終了: この窓で Ctrl+C
echo ========================================
echo.
echo [重要] ブラウザは Chrome / Edge 等の外部で開きます。
echo        Cursor チャットの localhost リンクはクリックしないでください。
echo        詳細: docs\LOCAL_DEV.md
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

echo サーバーを起動し、数秒後に外部ブラウザで /login を開きます...
start "" cmd /c "timeout /t 7 /nobreak >nul && start http://localhost:3000/login"

call npm run dev

pause
