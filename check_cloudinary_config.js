// check_cloudinary_config.js
// Script para verificar la configuración de Cloudinary

console.log('🔍 Verificando configuración de Cloudinary...\n');

// Verificar variables de entorno
const USE_CLOUDINARY = process.env.USE_CLOUDINARY;
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_URL = process.env.CLOUDINARY_URL;

console.log('📋 Variables de entorno:');
console.log(`USE_CLOUDINARY: ${USE_CLOUDINARY || 'NO CONFIGURADO'}`);
console.log(`CLOUDINARY_CLOUD_NAME: ${CLOUD_NAME || 'NO CONFIGURADO'}`);
console.log(`CLOUDINARY_API_KEY: ${API_KEY ? 'CONFIGURADO' : 'NO CONFIGURADO'}`);
console.log(`CLOUDINARY_API_SECRET: ${API_SECRET ? 'CONFIGURADO' : 'NO CONFIGURADO'}`);
console.log(`CLOUDINARY_URL: ${CLOUDINARY_URL ? 'CONFIGURADO' : 'NO CONFIGURADO (OPCIONAL)'}`);

console.log('\n📊 Estado de configuración:');

const hasIndividualCreds = CLOUD_NAME && API_KEY && API_SECRET;
const hasUrlCreds = CLOUDINARY_URL;

if (USE_CLOUDINARY === 'true' && (hasIndividualCreds || hasUrlCreds)) {
    console.log('✅ Cloudinary está ACTIVADO y configurado correctamente');
    console.log('📁 Los archivos se subirán a Cloudinary');

    if (hasIndividualCreds) {
        console.log('🔧 Usando credenciales individuales (CLOUD_NAME, API_KEY, API_SECRET)');
    } else if (hasUrlCreds) {
        console.log('🔧 Usando CLOUDINARY_URL');
    }
} else if (USE_CLOUDINARY === 'true') {
    console.log('❌ Cloudinary está ACTIVADO pero faltan credenciales');
    console.log('🔧 Configure UNA de estas opciones en Render:');
    console.log('');
    console.log('   Opción 1 (Recomendada - Individual):');
    console.log('   USE_CLOUDINARY=true');
    console.log('   CLOUDINARY_CLOUD_NAME=tu_cloud_name');
    console.log('   CLOUDINARY_API_KEY=tu_api_key');
    console.log('   CLOUDINARY_API_SECRET=tu_api_secret');
    console.log('');
    console.log('   Opción 2 (Alternativa - URL completa):');
    console.log('   USE_CLOUDINARY=true');
    console.log('   CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name');
} else {
    console.log('⚠️  Cloudinary está DESACTIVADO');
    console.log('📁 Los archivos se guardarán localmente');
    console.log('💡 Para producción, active Cloudinary para evitar pérdida de archivos');
}

console.log('\n🚀 Para configurar en Render:');
console.log('1. Ve a tu proyecto en Render');
console.log('2. Environment → Add Environment Variable');
console.log('3. Agrega UNA de estas opciones:');
console.log('');
console.log('   Opción 1 (Recomendada - Variables individuales):');
console.log('   USE_CLOUDINARY=true');
console.log('   CLOUDINARY_CLOUD_NAME=tu_cloud_name');
console.log('   CLOUDINARY_API_KEY=tu_api_key');
console.log('   CLOUDINARY_API_SECRET=tu_api_secret');
console.log('');
console.log('   Opción 2 (Alternativa - URL completa):');
console.log('   USE_CLOUDINARY=true');
console.log('   CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name');
console.log('');
console.log('4. Redeploy la aplicación');
console.log('5. Verifica con: node check_cloudinary_config.js');

console.log('\n🔗 Obtener credenciales de Cloudinary:');
console.log('1. Ve a https://cloudinary.com');
console.log('2. Dashboard → Account → Settings');
console.log('3. Copia Cloud Name, API Key y API Secret');