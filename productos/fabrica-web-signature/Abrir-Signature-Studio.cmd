@echo off
chcp 65001 >nul
title Signature Studio
cd /d "%~dp0"
where python >nul 2>nul
if %errorlevel%==0 (
  python apps\studio\server.py %*
) else (
  py -3 apps\studio\server.py %*
)
pause
