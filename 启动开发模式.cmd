@echo off
chcp 65001 >nul
taskkill /F /IM electron.exe >nul 2>&1
timeout /t 1 /nobreak >nul
cd /d "%~dp0"

echo [开发模式] 正在启动，支持热更新。关闭此窗口即可停止。
echo.
npm run dev
