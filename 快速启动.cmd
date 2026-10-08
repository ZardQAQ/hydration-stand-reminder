@echo off
chcp 65001 >nul
taskkill /F /IM electron.exe >nul 2>&1
timeout /t 1 /nobreak >nul
cd /d "%~dp0"

if not exist "out\main\index.js" (
  echo [提示] 未找到构建产物，正在执行 npm run build ...
  call npm run build
  if errorlevel 1 (
    echo [错误] 构建失败，请检查上方日志。
    pause
    exit /b 1
  )
)

echo [快速启动] 正在打开已构建版本 ...
start "" "%~dp0node_modules\electron\dist\electron.exe" .
