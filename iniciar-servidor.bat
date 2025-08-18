@echo off
title Servidor de Pedidos Parados
color 0A

echo.
echo ========================================
echo   SERVIDOR DE PEDIDOS PARADOS
echo ========================================
echo.

REM Verificar si Node.js portable existe
if not exist "%USERPROFILE%\Desktop\node\node.exe" (
    echo [ERROR] Node.js portable no encontrado.
    echo.
    echo Asegurate de que Node.js este en: %USERPROFILE%\Desktop\node\
    echo.
    pause
    exit /b 1
)

echo [INFO] Node.js portable detectado
echo.

REM Verificar si package.json existe
if not exist package.json (
    echo [ERROR] package.json no encontrado.
    echo Asegurate de ejecutar este archivo desde la carpeta del proyecto.
    pause
    exit /b 1
)

REM Verificar si node_modules existe, si no, instalar dependencias
if not exist node_modules (
    echo [INFO] Instalando dependencias...
    echo.
    "%USERPROFILE%\Desktop\node\npm.cmd" install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Error instalando dependencias.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencias instaladas correctamente
    echo.
)

REM Obtener la IP local
echo [INFO] Obteniendo direccion IP...
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do (
    for /f "tokens=1" %%j in ("%%i") do (
        set LOCAL_IP=%%j
        goto :found_ip
    )
)

:found_ip
if defined LOCAL_IP (
    echo [OK] Tu IP local es: %LOCAL_IP%
) else (
    echo [WARNING] No se pudo detectar la IP automaticamente.
    echo Usa 'ipconfig' en otra ventana para encontrar tu IP.
)

echo.
echo ========================================
echo   INFORMACION DEL SERVIDOR
echo ========================================
echo.
echo Direccion local:   http://localhost:3001
if defined LOCAL_IP (
    echo Direccion de red:  http://%LOCAL_IP%:3001
    echo.
    echo LINK PARA TU OFICINA:
    echo    http://%LOCAL_IP%:3001
)
echo.
echo ========================================
echo.

REM Iniciar el servidor
echo [INFO] Iniciando servidor...
echo.
"%USERPROFILE%\Desktop\node\node.exe" server.js

REM Si el servidor se cierra, pausar para ver errores
echo.
echo [INFO] Servidor detenido.
pause
