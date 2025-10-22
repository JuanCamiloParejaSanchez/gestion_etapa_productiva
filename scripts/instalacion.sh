#!/bin/bash

# Script de instalación para el Sistema de Gestión de Etapa Productiva


echo "🚀 Iniciando instalación del Sistema de Gestión de Etapa Productiva"
echo "================================================================"

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    echo "Por favor, instala Node.js desde https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm no está instalado"
    exit 1
fi

echo "✅ npm encontrado: $(npm --version)"

# Verificar si MySQL está instalado
if ! command -v mysql &> /dev/null; then
    echo "⚠️  Advertencia: MySQL no parece estar instalado"
    echo "Asegúrate de tener MySQL instalado y configurado"
fi

# Instalar dependencias
echo ""
echo "📦 Instalando dependencias..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencias instaladas correctamente"
else
    echo "❌ Error al instalar dependencias"
    exit 1
fi

# Verificar si existe el archivo .env
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creando archivo .env..."
    cat > .env << EOF
# Configuración de Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=gestion_etapa_productiva
DB_CONNECTION_LIMIT=10

# Configuración de Sesiones
SESSION_SECRET=tu_secreto_super_seguro_aqui
SESSION_NAME=sena_session
COOKIE_MAX_AGE=86400000

# Configuración de Correo (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_password_aplicacion

# Configuración del Servidor
PORT=3000
NODE_ENV=development
EOF
    echo "✅ Archivo .env creado"
    echo "⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales reales"
else
    echo "✅ Archivo .env ya existe"
fi

# Crear directorios necesarios
echo ""
echo "📁 Creando directorios necesarios..."
mkdir -p public/uploads/documentos
mkdir -p logs

echo "✅ Directorios creados"

# Verificar estructura de la base de datos
echo ""
echo "🗄️  Verificando estructura de base de datos..."
if [ -f MySQL.sql ]; then
    echo "✅ Archivo MySQL.sql encontrado"
    echo "📋 Para configurar la base de datos, ejecuta:"
    echo "   mysql -u tu_usuario -p tu_base_datos < MySQL.sql"
else
    echo "⚠️  Archivo MySQL.sql no encontrado"
fi

# Mostrar instrucciones finales
echo ""
echo "🎉 Instalación completada exitosamente!"
echo "========================================"
echo ""
echo "📋 Próximos pasos:"
echo "1. Edita el archivo .env con tus credenciales reales"
echo "2. Configura tu base de datos MySQL"
echo "3. Ejecuta: npm run dev"
echo "4. Accede a: http://localhost:3000"
echo ""
echo "📚 Documentación:"
echo "- Lee MEJORAS_IMPLEMENTADAS.md para detalles técnicos"
echo "- Consulta el Manual de usuario.pdf"
echo "- Revisa la Documentación Tecnica.pdf"
echo ""
echo "🔧 Comandos útiles:"
echo "- npm run dev     # Modo desarrollo"
echo "- npm start       # Modo producción"
echo "- npm test        # Ejecutar pruebas (cuando estén implementadas)"
echo ""
echo "🚀 ¡Tu sistema está listo para usar!" 