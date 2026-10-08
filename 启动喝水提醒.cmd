@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo  桌面效率工具箱 - 启动方式
echo  ==========================
echo   1. 快速启动（已构建版本，秒开）
echo   2. 开发模式（热更新，改代码用）
echo   3. 退出
echo.
set /p choice=请选择 [1/2/3]:

if "%choice%"=="1" (
  call "%~dp0快速启动.cmd"
  exit /b 0
)
if "%choice%"=="2" (
  call "%~dp0启动开发模式.cmd"
  exit /b 0
)
if "%choice%"=="3" exit /b 0

echo 无效选择，默认进入开发模式 ...
call "%~dp0启动开发模式.cmd"
