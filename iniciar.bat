@echo off
title Kiosco Escolar - PWA
color 0B

echo =============================================
echo         KIOSCO ESCOLAR - PWA
echo   Gestion de compras escolares sin efectivo
echo =============================================
echo.
echo [1] Iniciar servidor (con datos de demo)
echo [2] Resetear datos y cargar demo
echo [3] Iniciar servidor (datos actuales)
echo [4] Salir
echo.
choice /c 1234 /n /m "Selecciona una opcion: "

if errorlevel 4 goto salir
if errorlevel 3 goto iniciar
if errorlevel 2 goto seed
if errorlevel 1 goto iniciar

:seed
echo.
echo Cargando datos de demo...
node seed.js
echo.

:iniciar
echo.
echo Iniciando servidor en http://localhost:3000
echo.
echo Usuarios de prueba:
echo   Admin:    admin@kiosco.com / admin123
echo   Kiosco:   kiosco@kiosco.com / kiosco123
echo   Padre:    padre@kiosco.com / padre123
echo   Juan:     juan@kiosco.com / juan123
echo   Ana:      ana@kiosco.com / ana123
echo.
echo Presiona Ctrl+C para detener el servidor
echo =============================================
node server.js
pause

:salir
