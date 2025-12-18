#!/bin/bash

# ========================================
# Script de configuración de Viatio en PC nuevo
# ========================================

echo ""
echo "========================================"
echo " VIATIO - Setup en PC Nuevo"
echo "========================================"
echo ""

# Verificar Node.js
echo "[1/6] Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js no está instalado"
    echo "Por favor, instala Node.js desde https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js instalado correctamente ($(node --version))"
echo ""

# Verificar Git
echo "[2/6] Verificando Git..."
if ! command -v git &> /dev/null; then
    echo "❌ ERROR: Git no está instalado"
    echo "Por favor, instala Git desde https://git-scm.com/"
    exit 1
fi
echo "✅ Git instalado correctamente ($(git --version))"
echo ""

# Instalar dependencias de viatio-app
echo "[3/6] Instalando dependencias de viatio-app..."
cd viatio-app || exit 1
if [ ! -f package.json ]; then
    echo "❌ ERROR: No se encuentra package.json en viatio-app"
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Falló la instalación de dependencias de viatio-app"
    exit 1
fi
echo "✅ Dependencias de viatio-app instaladas"
echo ""

# Verificar archivo .env de viatio-app
echo "[4/6] Verificando archivo .env de viatio-app..."
if [ ! -f .env ]; then
    echo "⚠️  ADVERTENCIA: No se encuentra el archivo .env"
    echo ""
    if [ -f .env.template ]; then
        echo "Copiando plantilla .env.template a .env..."
        cp .env.template .env
        echo ""
        echo "⚠️  IMPORTANTE: Debes editar viatio-app/.env con tus credenciales:"
        echo "   - EXPO_PUBLIC_FIREBASE_API_KEY"
        echo "   - EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"
        echo "   - EXPO_PUBLIC_FIREBASE_PROJECT_ID"
        echo "   - EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"
        echo "   - EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
        echo "   - EXPO_PUBLIC_FIREBASE_APP_ID"
        echo "   - EXPO_PUBLIC_GOOGLE_MAPS_API_KEY"
        echo "   - EXPO_PUBLIC_BACKEND_URL"
        echo ""
        read -p "Presiona Enter para continuar..."
    else
        echo "❌ ERROR: Tampoco existe .env.template"
        echo "Debes crear manualmente el archivo .env siguiendo GUIA_MIGRACION.md"
        exit 1
    fi
else
    echo "✅ Archivo .env encontrado"
fi
echo ""

cd ..

# Instalar dependencias de viatio-backend
echo "[5/6] Instalando dependencias de viatio-backend..."
cd viatio-backend || exit 1
if [ ! -f package.json ]; then
    echo "❌ ERROR: No se encuentra package.json en viatio-backend"
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Falló la instalación de dependencias de viatio-backend"
    exit 1
fi
echo "✅ Dependencias de viatio-backend instaladas"
echo ""

# Verificar archivo .env de viatio-backend
echo "[6/6] Verificando archivo .env de viatio-backend..."
if [ ! -f .env ]; then
    echo "⚠️  ADVERTENCIA: No se encuentra el archivo .env"
    echo ""
    if [ -f .env.example ]; then
        echo "Copiando plantilla .env.example a .env..."
        cp .env.example .env
        echo ""
        echo "⚠️  IMPORTANTE: Debes editar viatio-backend/.env con:"
        echo "   - GEMINI_API_KEY"
        echo "   - CORS_ORIGINS (actualizar con la IP de este PC)"
        echo ""
        echo "Para obtener tu IP:"
        echo "  - Mac/Linux: ifconfig | grep 'inet '"
        echo "  - Windows: ipconfig"
        echo ""
        read -p "Presiona Enter para continuar..."
    else
        echo "❌ ERROR: Tampoco existe .env.example"
        echo "Debes crear manualmente el archivo .env siguiendo GUIA_MIGRACION.md"
        exit 1
    fi
else
    echo "✅ Archivo .env encontrado"
fi
echo ""

cd ..

# Resumen final
echo ""
echo "========================================"
echo " ✅ SETUP COMPLETADO"
echo "========================================"
echo ""
echo "Siguiente paso:"
echo ""
echo "1. Si creaste archivos .env nuevos, editarlos con tus credenciales"
echo "2. Abrir 2 terminales:"
echo ""
echo "   Terminal 1 - Backend:"
echo "   cd viatio-backend"
echo "   npm run dev"
echo ""
echo "   Terminal 2 - App:"
echo "   cd viatio-app"
echo "   npm start"
echo ""
echo "3. Seguir las instrucciones en pantalla para ejecutar la app"
echo ""
echo "========================================"
echo ""
