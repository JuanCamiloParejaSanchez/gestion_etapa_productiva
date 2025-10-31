// Ruta: src/modulos/aprendiz/servicios/servicioBitacora.js
// Propósito: Servicio para la gestión de bitácoras de aprendices

const { pool } = require('../../../configuracion/baseDatos');

/**
 * Inserta una nueva bitácora en la base de datos
 * @param {Object} datosBitacora - Datos de la bitácora a insertar
 * @returns {Promise<Object>} Resultado de la inserción
 */
async function insertarBitacora(datosBitacora) {
    try {
        const query = `
            INSERT INTO bitacoras (
                aprendiz_id,
                respuesta_desafio,
                respuesta_logro,
                respuesta_comunicacion,
                sentimiento_desafio,
                sentimiento_logro,
                sentimiento_comunicacion,
                score_desafio,
                score_logro,
                score_comunicacion,
                emocion_alegria_desafio,
                emocion_miedo_desafio,
                emocion_enojo_desafio,
                emocion_tristeza_desafio,
                emocion_disgusto_desafio,
                emocion_alegria_logro,
                emocion_miedo_logro,
                emocion_enojo_logro,
                emocion_tristeza_logro,
                emocion_disgusto_logro,
                emocion_alegria_comunicacion,
                emocion_miedo_comunicacion,
                emocion_enojo_comunicacion,
                emocion_tristeza_comunicacion,
                emocion_disgusto_comunicacion,
                entidades_desafio,
                entidades_logro,
                entidades_comunicacion,
                palabras_clave_desafio,
                palabras_clave_logro,
                palabras_clave_comunicacion,
                fecha_registro
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const valores = [
            datosBitacora.aprendizId,
            datosBitacora.respuesta_desafio,
            datosBitacora.respuesta_logro,
            datosBitacora.respuesta_comunicacion,
            datosBitacora.sentimiento_desafio,
            datosBitacora.sentimiento_logro,
            datosBitacora.sentimiento_comunicacion,
            datosBitacora.score_desafio,
            datosBitacora.score_logro,
            datosBitacora.score_comunicacion,
            datosBitacora.emocion_alegria_desafio || null,
            datosBitacora.emocion_miedo_desafio || null,
            datosBitacora.emocion_enojo_desafio || null,
            datosBitacora.emocion_tristeza_desafio || null,
            datosBitacora.emocion_disgusto_desafio || null,
            datosBitacora.emocion_alegria_logro || null,
            datosBitacora.emocion_miedo_logro || null,
            datosBitacora.emocion_enojo_logro || null,
            datosBitacora.emocion_tristeza_logro || null,
            datosBitacora.emocion_disgusto_logro || null,
            datosBitacora.emocion_alegria_comunicacion || null,
            datosBitacora.emocion_miedo_comunicacion || null,
            datosBitacora.emocion_enojo_comunicacion || null,
            datosBitacora.emocion_tristeza_comunicacion || null,
            datosBitacora.emocion_disgusto_comunicacion || null,
            datosBitacora.entidades_desafio ? JSON.stringify(datosBitacora.entidades_desafio) : null,
            datosBitacora.entidades_logro ? JSON.stringify(datosBitacora.entidades_logro) : null,
            datosBitacora.entidades_comunicacion ? JSON.stringify(datosBitacora.entidades_comunicacion) : null,
            datosBitacora.palabras_clave_desafio ? JSON.stringify(datosBitacora.palabras_clave_desafio) : null,
            datosBitacora.palabras_clave_logro ? JSON.stringify(datosBitacora.palabras_clave_logro) : null,
            datosBitacora.palabras_clave_comunicacion ? JSON.stringify(datosBitacora.palabras_clave_comunicacion) : null
        ];

        const [resultado] = await pool.query(query, valores);

        return {
            success: true,
            id: resultado.insertId
        };
    } catch (error) {
        console.error('Error al insertar bitácora:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Obtiene las bitácoras de un aprendiz específico
 * @param {number} aprendizId - ID del aprendiz
 * @returns {Promise<Array>} Lista de bitácoras
 */
async function obtenerBitacorasPorAprendiz(aprendizId) {
    try {
        const query = `
            SELECT * FROM bitacoras 
            WHERE aprendiz_id = ? 
            ORDER BY fecha_registro DESC
        `;

        const [bitacoras] = await pool.query(query, [aprendizId]);
        return bitacoras;
    } catch (error) {
        console.error('Error al obtener bitácoras:', error);
        throw error;
    }
}

/**
 * Obtiene una bitácora específica por ID
 * @param {number} id - ID de la bitácora
 * @returns {Promise<Object|null>} Bitácora o null si no existe
 */
async function obtenerBitacoraPorId(id) {
    try {
        const query = 'SELECT * FROM bitacoras WHERE id = ?';
        const [bitacoras] = await pool.query(query, [id]);
        return bitacoras.length > 0 ? bitacoras[0] : null;
    } catch (error) {
        console.error('Error al obtener bitácora por ID:', error);
        throw error;
    }
}

/**
 * Obtiene la última bitácora de un aprendiz
 * @param {number} aprendizId - ID del aprendiz
 * @returns {Promise<Object|null>} Última bitácora o null
 */
async function obtenerUltimaBitacora(aprendizId) {
    try {
        const query = `
            SELECT * FROM bitacoras 
            WHERE aprendiz_id = ? 
            ORDER BY fecha_registro DESC 
            LIMIT 1
        `;

        const [bitacoras] = await pool.query(query, [aprendizId]);
        return bitacoras.length > 0 ? bitacoras[0] : null;
    } catch (error) {
        console.error('Error al obtener última bitácora:', error);
        throw error;
    }
}

/**
 * Elimina una bitácora por ID
 * @param {number} id - ID de la bitácora
 * @returns {Promise<boolean>} True si se eliminó correctamente
 */
async function eliminarBitacora(id) {
    try {
        const query = 'DELETE FROM bitacoras WHERE id = ?';
        const [resultado] = await pool.query(query, [id]);
        return resultado.affectedRows > 0;
    } catch (error) {
        console.error('Error al eliminar bitácora:', error);
        throw error;
    }
}

module.exports = {
    insertarBitacora,
    obtenerBitacorasPorAprendiz,
    obtenerBitacoraPorId,
    obtenerUltimaBitacora,
    eliminarBitacora
};
