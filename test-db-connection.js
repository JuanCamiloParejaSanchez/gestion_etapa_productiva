// Script de prueba de conexión a Azure MySQL
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function testConnection() {
    console.log('🔍 Probando conexión a Azure MySQL Flexible Server...\n');
    
    // Mostrar configuración (sin contraseña)
    console.log('📋 Configuración:');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Usuario: ${process.env.DB_USER}`);
    console.log(`   Base de datos: ${process.env.DB_NAME}`);
    console.log(`   Puerto: ${process.env.DB_PORT}`);
    console.log(`   SSL: ${process.env.DB_SSL}`);
    console.log(`   Certificado: ${process.env.DB_SSL_CA_PATH}\n`);
    
    // Verificar que existe el certificado
    const certPath = path.join(__dirname, process.env.DB_SSL_CA_PATH);
    if (!fs.existsSync(certPath)) {
        console.error(`❌ ERROR: No se encuentra el certificado SSL en: ${certPath}`);
        console.log('   Por favor, asegúrate de que el archivo exista.\n');
        process.exit(1);
    }
    console.log(`✅ Certificado SSL encontrado: ${certPath}\n`);
    
    try {
        // Configuración de conexión
        const config = {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT),
            ssl: {
                ca: fs.readFileSync(certPath),
                rejectUnauthorized: true
            }
        };
        
        console.log('🔌 Intentando conectar...');
        const connection = await mysql.createConnection(config);
        
        console.log('✅ ¡Conexión exitosa!\n');
        
        // Probar una consulta simple
        console.log('🧪 Ejecutando consulta de prueba...');
        const [rows] = await connection.query('SELECT VERSION() as version, DATABASE() as database, USER() as user');
        
        console.log('📊 Información del servidor:');
        console.log(`   Versión MySQL: ${rows[0].version}`);
        console.log(`   Base de datos actual: ${rows[0].database}`);
        console.log(`   Usuario conectado: ${rows[0].user}\n`);
        
        // Verificar SSL
        const [sslRows] = await connection.query("SHOW STATUS LIKE 'Ssl_cipher'");
        console.log('🔐 Estado de SSL:');
        console.log(`   ${sslRows[0].Variable_name}: ${sslRows[0].Value || 'No SSL'}\n`);
        
        await connection.end();
        console.log('✅ Prueba completada exitosamente!');
        console.log('🎉 Tu conexión a Azure MySQL está funcionando correctamente.\n');
        
    } catch (error) {
        console.error('❌ ERROR al conectar a la base de datos:\n');
        
        if (error.code === 'ENOTFOUND') {
            console.error('   🔴 No se pudo resolver el host de la base de datos.');
            console.error('   💡 Verifica que DB_HOST sea correcto.');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('   🔴 Acceso denegado.');
            console.error('   💡 Verifica el usuario y contraseña (DB_USER y DB_PASSWORD).');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('   🔴 Conexión rechazada.');
            console.error('   💡 Verifica que el servidor MySQL esté accesible y el puerto sea correcto.');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('   🔴 Base de datos no encontrada.');
            console.error('   💡 Verifica que DB_NAME sea correcto.');
        } else if (error.message.includes('SSL')) {
            console.error('   🔴 Error relacionado con SSL/TLS.');
            console.error('   💡 Verifica el certificado SSL y que DB_SSL=true.');
        } else {
            console.error(`   Código: ${error.code}`);
            console.error(`   Mensaje: ${error.message}`);
        }
        
        console.error('\n   Stack trace completo:');
        console.error(error);
        process.exit(1);
    }
}

// Ejecutar prueba
testConnection();
