// src/modulos/administrador/servicios/servicioConsultasAdministrador.js
// Propósito: Contiene las consultas SQL relacionadas con los administradores

const { pool } = require('../../../configuracion/baseDatos');

const servicioConsultasAdministrador = {
    /**
     * Busca un administrador por su correo electrónico.
     * @param {string} email - El correo electrónico del administrador.
     * @returns {Promise<Object|undefined>} Los datos del administrador o undefined si no se encuentra.
     */
    async buscarPorEmail(email) {
        try {
            const query = 'SELECT * FROM administradores WHERE correoInstitucional = ?';
            const [rows] = await pool.query(query, [email]);
            return rows[0]; // Retorna el primer administrador encontrado o undefined
        } catch (error) {
            console.error('Error al buscar administrador por correoInstitucional:', error);
            throw error;
        }
    },

    /**
     * Busca un administrador por su número de identificación.
     * @param {string} numeroIdentificacion - El número de identificación del administrador.
     * @returns {Promise<Object|undefined>} Los datos del administrador o undefined si no se encuentra.
     */
    async buscarPorNumeroIdentificacion(numeroIdentificacion) {
        try {
            const query = 'SELECT * FROM administradores WHERE numeroIdentificacion = ?';
            const [rows] = await pool.query(query, [numeroIdentificacion]);
            return rows[0]; // Retorna el primer administrador encontrado o undefined
        } catch (error) {
            console.error('Error al buscar administrador por numeroIdentificacion:', error);
            throw error;
        }
    },

    /**
     * Inserta un nuevo administrador en la base de datos.
     * NOTA: La contraseña debe estar HASHEDA antes de llamar a esta función.
     * @param {Object} datosAdmin - Objeto con nombreUsuario, correoElectronico, password (hashed).
     * @returns {Promise<Object>} Resultado de la inserción.
     */
    async insertarAdministrador(datosAdmin) {
        try {
            const { 
                nombreCompleto, 
                correoInstitucional, 
                numeroIdentificacion, 
                telefono, 
                departamento, 
                cargo, 
                fotoPerfil,
                fotoPerfilPath,
                password, 
                rol, 
                activo 
            } = datosAdmin;
            
            const query = `INSERT INTO administradores 
                (nombreCompleto, correoInstitucional, numeroIdentificacion, telefono, departamento, cargo, fotoPerfil, fotoPerfilPath, password, rol, activo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
            const [result] = await pool.query(query, [
                nombreCompleto,
                correoInstitucional,
                numeroIdentificacion,
                telefono,
                departamento,
                cargo,
                fotoPerfil || null,
                fotoPerfilPath || null,
                password,
                rol || 'admin',
                activo !== undefined ? activo : true
            ]);
            
            return { success: true, insertId: result.insertId };
        } catch (error) {
            console.error('Error al insertar administrador:', error);
            throw error;
        }
    },

    /**
     * Actualiza la contraseña de un administrador.
     * @param {string} email - El correo electrónico del administrador.
     * @param {string} hashedPassword - La contraseña hasheada.
     * @returns {Promise<Object>} Resultado de la actualización.
     */
    async actualizarPassword(email, hashedPassword) {
        try {
            const query = 'UPDATE administradores SET password = ? WHERE correoInstitucional = ?';
            const [result] = await pool.query(query, [hashedPassword, email]);

            if (result.affectedRows === 0) {
                throw new Error('No se encontró el administrador');
            }

            return { success: true, message: 'Contraseña actualizada correctamente' };
        } catch (error) {
            console.error('Error al actualizar contraseña del administrador:', error);
            throw error;
        }
    }
};

module.exports = servicioConsultasAdministrador;