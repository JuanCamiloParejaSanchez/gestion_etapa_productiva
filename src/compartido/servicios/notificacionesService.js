/**
 * Servicio de Notificaciones
 * Gestiona las notificaciones del sistema para los aprendices
 */

const { pool } = require('../../configuracion/baseDatos');
const fs = require('fs');
const path = require('path');

/**
 * Crear una notificación para un aprendiz
 * @param {Object} params - Parámetros de la notificación
 * @param {number} params.usuarioId - ID del aprendiz
 * @param {string} params.tipo - Tipo de notificación
 * @param {string} params.titulo - Título de la notificación
 * @param {string} params.mensaje - Mensaje de la notificación
 * @param {number} params.referenciaId - ID de referencia (opcional)
 * @param {string} params.referenciaTipo - Tipo de referencia (opcional)
 * @param {string} params.retroalimentacion - Retroalimentación asociada (opcional)
 * @param {string} params.archivoAdjunto - Ruta del archivo adjunto (opcional)
 * @returns {Promise<Object>} - Resultado de la operación
 */
async function crearNotificacion({ usuarioId, tipo, titulo, mensaje, referenciaId = null, referenciaTipo = null, retroalimentacion = null, archivoAdjunto = null }) {
    try {
        const query = `
            INSERT INTO notificaciones
            (usuario_id, tipo, titulo, mensaje, referencia_id, referencia_tipo, retroalimentacion, archivo_adjunto)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [resultado] = await pool.query(query, [
            usuarioId,
            tipo,
            titulo,
            mensaje,
            referenciaId,
            referenciaTipo,
            retroalimentacion,
            archivoAdjunto
        ]);

        return {
            success: true,
            notificacionId: resultado.insertId
        };
    } catch (error) {
        console.error('Error al crear notificación:', error);
        throw error;
    }
}

/**
 * Obtener notificaciones de un aprendiz
 * @param {number} usuarioId - ID del aprendiz
 * @param {boolean} soloNoLeidas - Si es true, solo retorna las no leídas
 * @returns {Promise<Array>} - Lista de notificaciones
 */
async function obtenerNotificaciones(usuarioId, soloNoLeidas = false) {
    try {
        let query = `
            SELECT
                n.id,
                n.tipo,
                n.titulo,
                n.mensaje,
                n.leida,
                n.fecha_creacion,
                n.fecha_lectura,
                n.referencia_id,
                n.referencia_tipo,
                n.retroalimentacion,
                n.archivo_adjunto,
                d.tipo_documento
            FROM notificaciones n
            LEFT JOIN documentos_aprendiz d ON n.referencia_id = d.id AND n.referencia_tipo = 'documento'
            WHERE n.usuario_id = ?
        `;

        if (soloNoLeidas) {
            query += ' AND n.leida = FALSE';
        }

        query += ' ORDER BY n.fecha_creacion DESC LIMIT 50';

        const [notificaciones] = await pool.query(query, [usuarioId]);

        // Verificar si los archivos adjuntos existen y filtrar los que no
        const notificacionesFiltradas = await Promise.all(notificaciones.map(async (notif) => {
            if (notif.archivo_adjunto) {
                // Extraer el path relativo del archivo (remover '/uploads' del inicio)
                const relativePath = notif.archivo_adjunto.replace('/uploads/', '');
                const fullPath = path.join(__dirname, '../../../public/uploads', relativePath);

                try {
                    // Verificar si el archivo existe
                    await fs.promises.access(fullPath, fs.constants.F_OK);
                    // Si existe, mantener el archivo_adjunto
                    return notif;
                } catch (error) {
                    // Si no existe, remover el archivo_adjunto
                    console.warn(`Archivo adjunto no encontrado: ${fullPath}`);
                    return { ...notif, archivo_adjunto: null };
                }
            }
            return notif;
        }));

        return notificacionesFiltradas;
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        throw error;
    }
}

/**
 * Contar notificaciones no leídas
 * @param {number} usuarioId - ID del aprendiz
 * @returns {Promise<number>} - Cantidad de notificaciones no leídas
 */
async function contarNoLeidas(usuarioId) {
    try {
        const query = `
            SELECT COUNT(*) as count
            FROM notificaciones
            WHERE usuario_id = ? AND leida = FALSE
        `;
        
        const [resultado] = await pool.query(query, [usuarioId]);
        
        return resultado[0].count;
    } catch (error) {
        console.error('Error al contar notificaciones no leídas:', error);
        throw error;
    }
}

/**
 * Marcar una notificación como leída
 * @param {number} notificacionId - ID de la notificación
 * @param {number} usuarioId - ID del aprendiz (para verificar permisos)
 * @returns {Promise<Object>} - Resultado de la operación
 */
async function marcarComoLeida(notificacionId, usuarioId) {
    try {
        const query = `
            UPDATE notificaciones
            SET leida = TRUE, fecha_lectura = NOW()
            WHERE id = ? AND usuario_id = ?
        `;
        
        const [resultado] = await pool.query(query, [notificacionId, usuarioId]);
        
        return {
            success: resultado.affectedRows > 0
        };
    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
        throw error;
    }
}

/**
 * Marcar todas las notificaciones como leídas
 * @param {number} usuarioId - ID del aprendiz
 * @returns {Promise<Object>} - Resultado de la operación
 */
async function marcarTodasComoLeidas(usuarioId) {
    try {
        const query = `
            UPDATE notificaciones
            SET leida = TRUE, fecha_lectura = NOW()
            WHERE usuario_id = ? AND leida = FALSE
        `;
        
        const [resultado] = await pool.query(query, [usuarioId]);
        
        return {
            success: true,
            actualizadas: resultado.affectedRows
        };
    } catch (error) {
        console.error('Error al marcar todas las notificaciones como leídas:', error);
        throw error;
    }
}

/**
 * Eliminar una notificación específica
 * @param {number} notificacionId - ID de la notificación
 * @param {number} usuarioId - ID del aprendiz (para verificar permisos)
 * @returns {Promise<Object>} - Resultado de la operación
 */
async function eliminarNotificacion(notificacionId, usuarioId) {
    try {
        const query = `
            DELETE FROM notificaciones
            WHERE id = ? AND usuario_id = ?
        `;
        
        const [resultado] = await pool.query(query, [notificacionId, usuarioId]);
        
        return {
            success: resultado.affectedRows > 0,
            message: resultado.affectedRows > 0 
                ? 'Notificación eliminada correctamente' 
                : 'Notificación no encontrada o sin permisos'
        };
    } catch (error) {
        console.error('Error al eliminar notificación:', error);
        throw error;
    }
}

/**
 * Eliminar todas las notificaciones leídas de un usuario
 * @param {number} usuarioId - ID del aprendiz
 * @returns {Promise<Object>} - Resultado de la operación
 */
async function eliminarTodasLeidas(usuarioId) {
    try {
        const query = `
            DELETE FROM notificaciones
            WHERE usuario_id = ? AND leida = TRUE
        `;
        
        const [resultado] = await pool.query(query, [usuarioId]);
        
        return {
            success: true,
            eliminadas: resultado.affectedRows,
            message: `Se eliminaron ${resultado.affectedRows} notificación(es) leída(s)`
        };
    } catch (error) {
        console.error('Error al eliminar notificaciones leídas:', error);
        throw error;
    }
}

/**
 * Eliminar notificaciones antiguas (más de 30 días)
 * @returns {Promise<Object>} - Resultado de la operación
 */
async function limpiarNotificacionesAntiguas() {
    try {
        const query = `
            DELETE FROM notificaciones
            WHERE fecha_creacion < DATE_SUB(NOW(), INTERVAL 30 DAY)
        `;
        
        const [resultado] = await pool.query(query);
        
        return {
            success: true,
            eliminadas: resultado.affectedRows
        };
    } catch (error) {
        console.error('Error al limpiar notificaciones antiguas:', error);
        throw error;
    }
}

module.exports = {
    crearNotificacion,
    obtenerNotificaciones,
    contarNoLeidas,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    eliminarTodasLeidas,
    limpiarNotificacionesAntiguas
};
