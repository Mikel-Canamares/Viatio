@echo off
REM ========================================
REM Script de configuración de Viatio en PC nuevo
REM ========================================

echo.
echo ========================================
echo  VIATIO - Setup en PC Nuevo
echo ========================================
echo.

REM Verificar Node.js
echo [1/6] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado
    echo Por favor, instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js instalado correctamente
echo.

REM Verificar Git
echo [2/6] Verificando Git...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Git no está instalado
    echo Por favor, instala Git desde https://git-scm.com/
    pause
    exit /b 1
)
echo ✅ Git instalado correctamente
echo.

REM Instalar dependencias de viatio-app
echo [3/6] Instalando dependencias de viatio-app...
cd viatio-app
if not exist package.json (
    echo ❌ ERROR: No se encuentra package.json en viatio-app
    pause
    exit /b 1
)

call npm install
if %errorlevel% neq 0 (
    echo ❌ ERROR: Falló la instalación de dependencias de viatio-app
    pause
    exit /b 1
)
echo ✅ Dependencias de viatio-app instaladas
echo.

REM Verificar archivo .env de viatio-app
echo [4/6] Verificando archivo .env de viatio-app...
if not exist .env (
    echo ⚠️  ADVERTENCIA: No se encuentra el archivo .env
    echo.
    echo Copiando plantilla .env.template a .env...
    if exist .env.template (
        copy .env.template .env
        echo.
        echo ⚠️  IMPORTANTE: Debes editar viatio-app\.env con tus credenciales:
        echo    - EXPO_PUBLIC_FIREBASE_API_KEY
        echo    - EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
        echo    - EXPO_PUBLIC_FIREBASE_PROJECT_ID
        echo    - EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
        echo    - EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
        echo    - EXPO_PUBLIC_FIREBASE_APP_ID
        echo    - EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        echo    - EXPO_PUBLIC_BACKEND_URL
        echo.
    ) else (
        echo ❌ ERROR: Tampoco existe .env.template
        echo Debes crear manualmente el archivo .env siguiendo GUIA_MIGRACION.md
    )
    pause
) else (
    echo ✅ Archivo .env encontrado
)
echo.

cd ..

REM Instalar dependencias de viatio-backend
echo [5/6] Instalando dependencias de viatio-backend...
cd viatio-backend
if not exist package.json (
    echo ❌ ERROR: No se encuentra package.json en viatio-backend
    pause
    exit /b 1
)

call npm install
if %errorlevel% neq 0 (
    echo ❌ ERROR: Falló la instalación de dependencias de viatio-backend
    pause
    exit /b 1
)
echo ✅ Dependencias de viatio-backend instaladas
echo.

REM Verificar archivo .env de viatio-backend
echo [6/6] Verificando archivo .env de viatio-backend...
if not exist .env (
    echo ⚠️  ADVERTENCIA: No se encuentra el archivo .env
    echo.
    echo Copiando plantilla .env.example a .env...
    if exist .env.example (
        copy .env.example .env
        echo.
        echo ⚠️  IMPORTANTE: Debes editar viatio-backend\.env con:
        echo    - GEMINI_API_KEY
        echo    - CORS_ORIGINS (actualizar con la IP de este PC)
        echo.
        echo Para obtener tu IP, ejecuta: ipconfig
        echo Busca "IPv4 Address" de tu conexión WiFi/Ethernet
        echo.
    ) else (
        echo ❌ ERROR: Tampoco existe .env.example
        echo Debes crear manualmente el archivo .env siguiendo GUIA_MIGRACION.md
    )
    pause
) else (
    echo ✅ Archivo .env encontrado
)
echo.

cd ..

REM Resumen final
echo.
echo ========================================
echo  ✅ SETUP COMPLETADO
echo ========================================
echo.
echo Siguiente paso:
echo.
echo 1. Si creaste archivos .env nuevos, editarlos con tus credenciales
echo 2. Abrir 2 terminales:
echo.
echo    Terminal 1 - Backend:
echo    cd viatio-backend
echo    npm run dev
echo.
echo    Terminal 2 - App:
echo    cd viatio-app
echo    npm start
echo.
echo 3. Seguir las instrucciones en pantalla para ejecutar la app
echo.
echo ========================================
echo.

pause
