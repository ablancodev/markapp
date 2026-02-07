@echo off
REM Script para crear enlaces simbólicos de proyectos XAMPP en Windows
REM Esto permite abrir proyectos de htdocs en MarkApp
REM IMPORTANTE: Ejecutar como Administrador

echo ==========================================
echo   MarkApp - Crear enlace simbolico
echo ==========================================
echo.

REM Verificar que se ejecuta como administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Este script debe ejecutarse como Administrador
    echo.
    echo Haz clic derecho en el archivo y selecciona
    echo "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

set HTDOCS_PATH=C:\xampp\htdocs
set DOCS_PATH=%USERPROFILE%\Documents\xampp-projects

REM Verificar que htdocs existe
if not exist "%HTDOCS_PATH%" (
    echo ERROR: No se encuentra XAMPP htdocs en: %HTDOCS_PATH%
    echo.
    echo Si XAMPP esta en otra ubicacion, edita este script
    pause
    exit /b 1
)

echo Carpeta XAMPP encontrada: %HTDOCS_PATH%
echo.

REM Crear carpeta de destino si no existe
if not exist "%DOCS_PATH%" mkdir "%DOCS_PATH%"

echo Proyectos disponibles en htdocs:
echo --------------------------------
dir /b /ad "%HTDOCS_PATH%"
echo.

set /p PROJECT_NAME=Nombre del proyecto a enlazar (o 'todos' para todos):

if /i "%PROJECT_NAME%"=="todos" (
    echo.
    echo Creando enlaces para todos los proyectos...
    for /d %%i in ("%HTDOCS_PATH%\*") do (
        set "project_name=%%~nxi"
        mklink /D "%DOCS_PATH%\%%~nxi" "%%i" >nul 2>&1
        if errorlevel 1 (
            echo Ya existe: %%~nxi
        ) else (
            echo OK: %%~nxi
        )
    )
) else (
    set SOURCE=%HTDOCS_PATH%\%PROJECT_NAME%
    set DEST=%DOCS_PATH%\%PROJECT_NAME%

    if not exist "%SOURCE%" (
        echo ERROR: El proyecto '%PROJECT_NAME%' no existe en htdocs
        pause
        exit /b 1
    )

    if exist "%DEST%" (
        echo Ya existe un enlace o carpeta en: %DEST%
        set /p CONFIRM=Eliminar y recrear? (s/n):
        if /i "%CONFIRM%"=="s" (
            rmdir "%DEST%"
        ) else (
            echo Operacion cancelada
            pause
            exit /b 0
        )
    )

    mklink /D "%DEST%" "%SOURCE%"
    echo.
    echo Enlace creado exitosamente!
)

echo.
echo ==========================================
echo Listo!
echo ==========================================
echo.
echo Ahora puedes abrir en MarkApp:
echo %DOCS_PATH%
echo.
echo Todos tus proyectos estaran accesibles alli
echo.
pause
