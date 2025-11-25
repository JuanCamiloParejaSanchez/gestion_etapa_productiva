// Ruta: src/modulos/aprendiz/servicios/servicioDocumentosAprendiz.js
// Propósito: Maneja las consultas a la base de datos para los documentos de los aprendices.

const { pool } = require('../../../configuracion/baseDatos');

const servicioDocumentosAprendiz = {
    /**
     * Inserta la metadata de un documento en la base de datos.
     * @param {Object} datosDocumento
     * @returns {Promise<Object>}
     */
    async insertarDocumento(datosDocumento) {
        try {
            // Aceptar tanto snake_case como camelCase para compatibilidad
            const aprendiz_id = datosDocumento.aprendiz_id || datosDocumento.aprendizId;
            const nombre_original = datosDocumento.nombre_original || datosDocumento.nombreOriginal;
            const nombre_guardado = datosDocumento.nombre_guardado || datosDocumento.nombreGuardado;
            const ruta_archivo = datosDocumento.ruta_archivo || datosDocumento.rutaArchivo;
            const tipo_mime = datosDocumento.tipo_mime || datosDocumento.tipoMime;
            const tamano_bytes = datosDocumento.tamano_bytes || datosDocumento.tamanoBytes;
            const descripcion = datosDocumento.descripcion;
            const tipo_documento = datosDocumento.tipo_documento || datosDocumento.tipoDocumento;
            const activo = datosDocumento.activo !== undefined ? datosDocumento.activo : 1;
            const query = `
                INSERT INTO documentos_aprendiz (aprendiz_id, nombre_original, nombre_guardado, ruta_archivo, tipo_mime, tamano_bytes, descripcion, tipo_documento, activo, fecha_subida, fecha_actualizacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `;
            const [result] = await pool.query(query, [aprendiz_id, nombre_original, nombre_guardado, ruta_archivo, tipo_mime, tamano_bytes, descripcion, tipo_documento, activo]);
            return { success: true, id: result.insertId };
        } catch (error) {
            console.error('Error en servicioDocumentosAprendiz.insertarDocumento:', error);
            return { success: false, message: 'Error al insertar el documento en la base de datos.' };
        }
    },

    /**
     * Obtiene todos los documentos asociados a un aprendiz específico.
     * @param {number} aprendizId
     * @returns {Promise<Array>}
     */
    async obtenerDocumentosPorAprendiz(aprendizId) {
        try {
            const query = 'SELECT * FROM documentos_aprendiz WHERE aprendiz_id = ? ORDER BY fecha_subida DESC';
            const [rows] = await pool.query(query, [aprendizId]);
            return rows;
        } catch (error) {
            console.error('Error en servicioDocumentosAprendiz.obtenerDocumentosPorAprendiz:', error);
            throw error;
        }
    },

    /**
     * Obtiene la metadata de un documento por su nombre_guardado y el ID del aprendiz.
     * @param {string} nombreGuardado
     * @param {number} aprendizId
     * @returns {Promise<Object|null>}
     */
    async obtenerDocumentoPorNombreGuardadoYAprendiz(nombreGuardado, aprendizId) {
        try {
            const query = 'SELECT * FROM documentos_aprendiz WHERE nombre_guardado = ? AND aprendiz_id = ?';
            const [rows] = await pool.query(query, [nombreGuardado, aprendizId]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en servicioDocumentosAprendiz.obtenerDocumentoPorNombreGuardadoYAprendiz:', error);
            throw error;
        }
    },

    /**
     * Obtiene la metadata de un documento por su ID.
     * Utilizado para verificar la existencia y propiedad antes de eliminar.
     * @param {number} documentoId
     * @returns {Promise<Object|null>}
     */
    async obtenerDocumentoPorId(documentoId) {
        try {
            const query = 'SELECT * FROM documentos_aprendiz WHERE id = ?';
            const [rows] = await pool.query(query, [documentoId]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en servicioDocumentosAprendiz.obtenerDocumentoPorId:', error);
            throw error;
        }
    },

    /**
     * Obtiene la metadata de un documento por su nombre original y el ID del aprendiz.
     * @param {string} nombreOriginal
     * @param {number} aprendizId
     * @returns {Promise<Object|null>}
     */
    async obtenerDocumentoPorNombreOriginalYAprendiz(nombreOriginal, aprendizId) {
        try {
            const query = 'SELECT * FROM documentos_aprendiz WHERE nombre_original = ? AND aprendiz_id = ?';
            const [rows] = await pool.query(query, [nombreOriginal, aprendizId]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en servicioDocumentosAprendiz.obtenerDocumentoPorNombreOriginalYAprendiz:', error);
            throw error;
        }
    },

    /**
     * Elimina un documento de la base de datos por su ID.
     * @param {number} documentoId
     * @returns {Promise<boolean>}
     */
    async eliminarDocumentoPorId(documentoId) {
        try {
            const query = 'DELETE FROM documentos_aprendiz WHERE id = ?';
            const [result] = await pool.query(query, [documentoId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en servicioDocumentosAprendiz.eliminarDocumentoPorId:', error);
            throw error;
        }
    },

    /**
     * Obtiene un documento por su ID y el ID del aprendiz propietario.
     * @param {number} documentoId
     * @param {number} aprendizId
     * @returns {Promise<Object|null>}
     */
    async obtenerDocumentoPorIdYAprendiz(documentoId, aprendizId) {
        try {
            const sql = 'SELECT * FROM documentos_aprendiz WHERE id = ? AND aprendiz_id = ?';
            const [rows] = await pool.query(sql, [documentoId, aprendizId]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error en servicioDocumentosAprendiz.obtenerDocumentoPorIdYAprendiz:', error);
            throw error;
        }
    },

    /**
     * Obtiene una lista de documentos por sus IDs.
     * @param {Array<string>} documentoIds
     * @param {number} aprendizId
     * @returns {Promise<Array<Object>>}
     */
    async obtenerDocumentosPorIds(documentoIds, aprendizId) {
        try {
            // Unir los IDs en una cadena para la cláusula IN de SQL.
            const placeholders = documentoIds.map(() => '?').join(',');
            const sql = `SELECT * FROM documentos_aprendiz WHERE id IN (${placeholders}) AND aprendiz_id = ?`;
            
            const [rows] = await pool.query(sql, [...documentoIds, aprendizId]);
            return rows;
        } catch (error) {
            console.error('Error en servicioDocumentosAprendiz.obtenerDocumentosPorIds:', error);
            throw error;
        }
    },

    /**
     * Obtiene un documento de un tipo específico para un aprendiz dado.
     * @param {string} tipoDocumento
     * @param {number} aprendizId
     * @returns {Promise<Object|null>}
     */
    async obtenerDocumentoPorTipoYAprendiz(tipoDocumento, aprendizId) {
        try {
            const sql = 'SELECT * FROM documentos_aprendiz WHERE tipo_documento = ? AND aprendiz_id = ? LIMIT 1';
            const [rows] = await pool.query(sql, [tipoDocumento, aprendizId]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error al obtener documento por tipo y aprendiz:', error);
            throw error;
        }
    }
};

module.exports = servicioDocumentosAprendiz;
