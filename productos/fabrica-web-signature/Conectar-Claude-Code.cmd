@echo off
chcp 65001 >nul
title Conectar Claude Code a la fabrica
cd /d "%~dp0"
echo Este paso se hace una sola vez. Se abrira tu navegador para iniciar sesion con tu cuenta de Claude.
echo Nadie mas ve tus datos: la sesion queda guardada por Claude Code en tu equipo, no en la fabrica.
echo.
where python >nul 2>nul
if %errorlevel%==0 (
  python core\fabrica.py conectar-claude
) else (
  py -3 core\fabrica.py conectar-claude
)
pause
