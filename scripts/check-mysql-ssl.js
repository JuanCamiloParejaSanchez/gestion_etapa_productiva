const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  try {
    // Load .env if present
    try { require('dotenv').config(); } catch (_) {}

    const {
      DB_HOST,
      DB_PORT = '3306',
      DB_USER,
      DB_PASSWORD,
      DB_NAME,
    } = process.env;

    if (!DB_HOST || !DB_USER || !DB_PASSWORD) {
      console.log('MYSQL CHECK: Missing DB env vars (DB_HOST/DB_USER/DB_PASSWORD).');
      process.exit(0); // do not fail startup due to missing check
    }

    const certPath = path.join('/home/site/wwwroot', 'DigiCertGlobalRootG2.crt.pem');
    let ca;
    if (fs.existsSync(certPath)) {
      ca = fs.readFileSync(certPath, 'utf8');
    } else {
      console.log(`MYSQL CHECK: Certificate not found at ${certPath}, proceeding without SSL CA.`);
    }

    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      ssl: ca ? { ca } : undefined,
      connectTimeout: 8000,
    });

    const [rows] = await connection.query('SELECT 1 AS ok');
    await connection.end();
    console.log('MYSQL CHECK: OK', rows[0]);
  } catch (err) {
    console.log('MYSQL CHECK: ERROR', err && err.message ? err.message : err);
  }
}

main();
