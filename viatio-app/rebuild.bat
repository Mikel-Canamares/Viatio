@echo off
echo.
echo ========================================
echo Limpiando build anterior...
echo ========================================
echo.

REM Limpiar build de Android
if exist android\app\build (
    rmdir /s /q android\app\build
    echo [OK] android\app\build eliminado
)

if exist android\.gradle (
    rmdir /s /q android\.gradle
    echo [OK] android\.gradle eliminado
)

REM Limpiar cache de node_modules
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo [OK] node_modules\.cache eliminado
)

echo.
echo ========================================
echo Ejecutando prebuild...
echo ========================================
echo.

call npx expo prebuild --clean

echo.
echo ========================================
echo Recompilando app...
echo ========================================
echo.

call npx expo run:android

echo.
echo ========================================
echo Listo!
echo ========================================
echo.
