// Ruta: src/config/baseDatos.js
// Propósito: Configuración y conexión a la base de datos

const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 3305,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
    charset: 'utf8mb4'
};

const pool = mysql.createPool(dbConfig);

async function verifyDatabaseConnection() {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.query('SELECT 1');
        console.log('Conexión a la base de datos establecida');
        return true;
    } catch (error) {
        console.error('Error de conexión a la base de datos:', error);
        return false;
    } finally {
        if (connection) {
            try {
                connection.release();
            } catch (releaseError) {
                console.warn('Error al liberar la conexión:', releaseError);
            }
        }
    }
}

pool.on('error', (err) => {
    console.error('Error inesperado en el pool de conexiones:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Se perdió la conexión con la base de datos');
    }
});

async function cleanup() {
    try {
        await pool.end();
        console.log('Pool de conexiones cerrado correctamente');
    } catch (error) {
        console.error('Error al cerrar el pool de conexiones:', error);
        throw error;
    }
}

process.on('SIGINT', async () => {
    try {
        await cleanup();
        process.exit(0);
    } catch (error) {
        console.error('Error durante el shutdown:', error);
        process.exit(1);
    }
});

module.exports = {
    pool,
    verifyDatabaseConnection,
    cleanup
};