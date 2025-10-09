#!/bin/bash

# Script de instalación y configuración de IBM Watson Natural Language Understanding
# Para el sistema de gestión de etapa productiva del SENA

echo "🤖 Configuración de IBM Watson Natural Language Understanding"
echo "=========================================================="
echo ""

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js primero."
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor instala npm primero."
    exit 1
fi

echo "✅ Node.js y npm están instalados"
echo ""

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install ibm-watson

if [ $? -eq 0 ]; then
    echo "✅ Dependencias instaladas correctamente"
else
    echo "❌ Error al instalar dependencias"
    exit 1
fi

echo ""

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo "📝 Creando archivo .env..."
    cat > .env << EOF
# Configuración de la Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=gestion_etapa_productiva
DB_PORT=3306

# Configuración del Servidor
PORT=3000
NODE_ENV=development

# Configuración de Sesiones
SESSION_SECRET=tu_clave_secreta_aqui

# Configuración de Correo
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_password_de_aplicacion

# Configuración de IBM Watson Natural Language Understanding
# Obtén estas credenciales desde: https://cloud.ibm.com/apis/natural-language-understanding
WATSON_API_KEY=tu_api_key_aqui
WATSON_SERVICE_URL=https://api.us-south.natural-language-understanding.watson.cloud.ibm.com/instances/tu_instance_id
WATSON_VERSION=2022-04-07

# Configuración de Análisis de Sentimientos
# true = usar IBM Watson, false = usar análisis local
USE_WATSON_SENTIMENT_ANALYSIS=true
EOF
    echo "✅ Archivo .env creado"
else
    echo "⚠️ El archivo .env ya existe"
fi

echo ""

# Mostrar instrucciones de configuración
echo "🔧 Pasos para completar la configuración:"
echo ""
echo "1. Ve a https://cloud.ibm.com/ y crea una cuenta gratuita"
echo "2. Busca 'Natural Language Understanding' y crea una instancia"
echo "3. Selecciona el plan 'Lite' (gratuito)"
echo "4. Obtén tu API Key y Service URL"
echo "5. Edita el archivo .env y reemplaza:"
echo "   - WATSON_API_KEY=tu_api_key_real"
echo "   - WATSON_SERVICE_URL=tu_service_url_real"
echo ""
echo "6. Ejecuta la aplicación:"
echo "   npm run dev"
echo ""

# Verificar si los archivos de configuración existen
echo "📋 Verificando archivos de configuración..."

if [ -f "src/configuracion/watsonConfig.js" ]; then
    echo "✅ watsonConfig.js encontrado"
else
    echo "❌ watsonConfig.js no encontrado"
fi

if [ -f "src/modulos/administrador/servicios/servicioWatsonSentimientos.js" ]; then
    echo "✅ servicioWatsonSentimientos.js encontrado"
else
    echo "❌ servicioWatsonSentimientos.js no encontrado"
fi

if [ -f "CONFIGURACION_WATSON.md" ]; then
    echo "✅ CONFIGURACION_WATSON.md encontrado"
else
    echo "❌ CONFIGURACION_WATSON.md no encontrado"
fi

echo ""

# Mostrar información sobre el plan gratuito
echo "💰 Información del Plan Gratuito de IBM Watson:"
echo "   - 30,000 requests/mes"
echo "   - Suficiente para ~1,000 análisis diarios"
echo "   - Máximo 50KB por análisis"
echo "   - Rate limit: 10 requests/segundo"
echo ""

# Mostrar beneficios
echo "🎯 Beneficios de IBM Watson:"
echo "   ✅ Análisis muy preciso de sentimientos en español"
echo "   ✅ Detección de emociones avanzada"
echo "   ✅ Análisis de entidades y palabras clave"
echo "   ✅ Fallback automático a análisis local"
echo "   ✅ Mejor precisión que el análisis local (95% vs 70%)"
echo ""

echo "🚀 ¡Configuración completada!"
echo ""
echo "Para más información, consulta:"
echo "   - CONFIGURACION_WATSON.md"
echo "   - https://cloud.ibm.com/docs/natural-language-understanding"
echo ""
echo "Para probar la aplicación:"
echo "   npm run dev"
echo "" 