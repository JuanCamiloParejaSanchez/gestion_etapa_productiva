// Ruta: src/modulos/aprendiz/servicios/servicioRecuperacion.js
// Propósito: Maneja las operaciones de base de datos y envío de correos
// para el proceso de recuperación de contraseña con códigos de verificación

const { pool } = require('../../../configuracion/baseDatos');

class ServicioRecuperacion {
    /**
     * Genera un código de verificación de 6 dígitos
     * @returns {string} Código de 6 dígitos
     */
    generarCodigo() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Guarda un código de verificación en la base de datos
     * @param {string} email - Email del usuario
     * @param {string} codigo - Código de verificación
     * @param {Date} expiracion - Fecha de expiración
     * @param {string} role - Rol del usuario ('aprendiz' o 'admin')
     * @returns {Promise<boolean>}
     */
    async guardarCodigo(email, codigo, expiracion, role) {
        const query = `
            INSERT INTO reset_tokens (email, token, expiracion, role)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                token = VALUES(token),
                expiracion = VALUES(expiracion),
                role = VALUES(role),
                usado = 0
        `;
        try {
            await pool.query(query, [email, codigo, expiracion, role]);
            return true;
        } catch (error) {
            console.error('Error al guardar código:', error);
            throw new Error('Error al procesar la solicitud');
        }
    }

    /**
     * Verifica si un código es válido y no ha expirado
     * @param {string} email - Email del usuario
     * @param {string} codigo - Código de verificación
     * @returns {Promise<Object|null>} Información del código o null si no es válido
     */
    async verificarCodigo(email, codigo) {
        const query = `
            SELECT email, expiracion, role
            FROM reset_tokens
            WHERE email = ?
              AND token = ?
              AND expiracion > NOW()
              AND usado = 0
        `;
        try {
            const [rows] = await pool.query(query, [email, codigo]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error al verificar código:', error);
            throw new Error('Error al verificar el código');
        }
    }

    /**
     * Marca un código como usado después de su uso
     * @param {string} email - Email del usuario
     * @param {string} codigo - Código de verificación
     * @returns {Promise<boolean>}
     */
    async marcarCodigoUsado(email, codigo) {
        const query = `
            UPDATE reset_tokens
            SET usado = 1
            WHERE email = ? AND token = ?
        `;
        try {
            await pool.query(query, [email, codigo]);
            return true;
        } catch (error) {
            console.error('Error al marcar código como usado:', error);
            throw new Error('Error al marcar el código como usado');
        }
    }

    // Métodos legacy para compatibilidad (se pueden eliminar después)
    async guardarToken(email, token, expiracion) {
        return this.guardarCodigo(email, token, expiracion);
    }

    async verificarToken(token) {
        const query = `
            SELECT email, expiracion
            FROM reset_tokens
            WHERE token = ?
              AND expiracion > NOW()
              AND usado = 0
        `;

        try {
            const [rows] = await pool.query(query, [token]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error al verificar token:', error);
            throw new Error('Error al verificar el token');
        }
    }

    async invalidarToken(token) {
        const query = `
            UPDATE reset_tokens
            SET usado = 1
            WHERE token = ?
        `;

        try {
            await pool.query(query, [token]);
            return true;
        } catch (error) {
            console.error('Error al invalidar token:', error);
            throw new Error('Error al invalidar el token');
        }
    }
}

module.exports = new ServicioRecuperacion();