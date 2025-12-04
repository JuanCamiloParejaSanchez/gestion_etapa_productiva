#!/bin/bash

# Script de inicio para Azure App Service
# Descarga el certificado SSL de MySQL y luego inicia la aplicación

echo "Iniciando configuración de Azure App Service..."

# Verificar versión de Node.js
echo "Versión de Node.js: $(node --version)"
echo "Versión de npm: $(npm --version)"

# Instalar dependencias si no existen
if [ ! -d "/home/site/wwwroot/node_modules" ] || [ ! -d "/home/site/wwwroot/node_modules/dotenv" ]; then
    echo "Instalando dependencias de npm..."
    cd /home/site/wwwroot
    npm ci --omit=dev --prefer-offline --no-audit
    
    if [ $? -eq 0 ]; then
        echo "✅ Dependencias instaladas exitosamente"
    else
        echo "⚠️  Error al instalar dependencias, intentando con npm install..."
        npm install --omit=dev --prefer-offline --no-audit
    fi
else
    echo "✅ Las dependencias ya están instaladas"
fi

# Descargar certificado SSL de MySQL si no existe
if [ ! -f "/home/site/wwwroot/DigiCertGlobalRootG2.crt.pem" ]; then
    echo "Descargando certificado SSL de DigiCert..."
    cd /home/site/wwwroot
    curl -sSL https://cacerts.digicert.com/DigiCertGlobalRootG2.crt.pem -o DigiCertGlobalRootG2.crt.pem
    
    if [ $? -eq 0 ]; then
        echo "✅ Certificado SSL descargado exitosamente"
    else
        echo "⚠️  Error al descargar el certificado SSL, continuando de todas formas..."
    fi
else
    echo "✅ Certificado SSL ya existe"
fi

# Mostrar información de configuración
echo "Variables de entorno configuradas:"
echo "- NODE_ENV: $NODE_ENV"
echo "- PORT: $PORT"
echo "- DB_HOST: $DB_HOST"
echo "- USE_AZURE_BLOB: $USE_AZURE_BLOB"

# Iniciar la aplicación
echo "Iniciando aplicación Node.js..."
cd /home/site/wwwroot
npm start
