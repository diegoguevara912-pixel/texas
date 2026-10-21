@echo off
rem Instala en la fabrica el zip de un cliente. Doble clic o arrastra el zip encima.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0instalar-cliente.ps1" %1
