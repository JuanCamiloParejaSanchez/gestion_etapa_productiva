// src/modulos/compartido/controladores/chatControlador.js
// Propósito: Maneja la lógica para el sistema de chat entre aprendices y administradores.

const { pool } = require('../../../configuracion/baseDatos');
const { formatearError } = require('../../../compartido/utilidades/utilRespuestas');
const BaseController = require('./baseController');

class ChatControlador extends BaseController {

    /**
     * Enviar un mensaje
     */
    async enviarMensaje(req, res) {
        try {
            console.log('📨 [CHAT] Iniciando envío de mensaje...');

            const remitenteId = req.session.userId;
            const remitenteTipo = req.session.userRole === 'aprendiz' ? 'aprendiz' : 'admin';

            console.log('📨 [CHAT] Remitente:', { remitenteId, remitenteTipo });

            if (!remitenteId) {
                console.log('❌ [CHAT] Usuario no autenticado');
                return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
            }

            const { destinatarioId, destinatarioTipo, mensaje } = req.body;
            console.log('📨 [CHAT] Datos recibidos:', { destinatarioId, destinatarioTipo, mensajeLength: mensaje?.length });

            // Validar datos
            if (!destinatarioId || !destinatarioTipo || !mensaje || mensaje.trim() === '') {
                console.log('❌ [CHAT] Datos incompletos o inválidos');
                return res.status(400).json({ success: false, message: 'Datos incompletos o inválidos' });
            }

            // Convertir destinatarioId a número si es necesario
            const destinatarioIdNum = parseInt(destinatarioId);
            if (isNaN(destinatarioIdNum)) {
                console.log('❌ [CHAT] ID de destinatario inválido:', destinatarioId);
                return res.status(400).json({ success: false, message: 'ID de destinatario inválido' });
            }

            // Validar que el tipo de destinatario sea válido
            if (destinatarioTipo !== 'aprendiz' && destinatarioTipo !== 'admin') {
                console.log('❌ [CHAT] Tipo de destinatario inválido:', destinatarioTipo);
                return res.status(400).json({ success: false, message: 'Tipo de destinatario inválido' });
            }

            // Validar que el remitente existe
            const tablaRemitente = remitenteTipo === 'aprendiz' ? 'aprendices' : 'administradores';
            const [remitente] = await pool.execute(`SELECT id FROM ${tablaRemitente} WHERE id = ?`, [remitenteId]);

            if (remitente.length === 0) {
                console.log('❌ [CHAT] Usuario remitente no encontrado');
                return res.status(401).json({ success: false, message: 'Usuario remitente no encontrado' });
            }

            // Validar que el destinatario existe
            const tablaDestinatario = destinatarioTipo === 'aprendiz' ? 'aprendices' : 'administradores';
            const [destinatario] = await pool.execute(`SELECT id FROM ${tablaDestinatario} WHERE id = ?`, [destinatarioIdNum]);

            if (destinatario.length === 0) {
                console.log('❌ [CHAT] Destinatario no encontrado. Tabla:', tablaDestinatario, 'ID:', destinatarioIdNum);
                return res.status(404).json({ success: false, message: 'Destinatario no encontrado' });
            }

            // Validar que no se esté enviando un mensaje a sí mismo
            if (remitenteId === destinatarioIdNum && remitenteTipo === destinatarioTipo) {
                console.log('❌ [CHAT] No se puede enviar un mensaje a sí mismo');
                return res.status(400).json({ success: false, message: 'No se puede enviar un mensaje a sí mismo' });
            }

            // Si el remitente había eliminado la conversación anteriormente, restaurarla eliminando el registro de eliminación
            await pool.execute(
                `DELETE FROM conversaciones_eliminadas WHERE usuario_id = ? AND usuario_tipo = ? AND otro_usuario_id = ? AND otro_usuario_tipo = ?`,
                [remitenteId, remitenteTipo, destinatarioIdNum, destinatarioTipo]
            );

            // Si el destinatario había eliminado la conversación anteriormente, también restaurarla
            // Esto asegura que, si el administrador borró la conversación, vuelva a aparecer cuando el aprendiz envíe un nuevo mensaje
            await pool.execute(
                `DELETE FROM conversaciones_eliminadas WHERE usuario_id = ? AND usuario_tipo = ? AND otro_usuario_id = ? AND otro_usuario_tipo = ?`,
                [destinatarioIdNum, destinatarioTipo, remitenteId, remitenteTipo]
            );

            // Insertar mensaje
            const query = `
                INSERT INTO mensajes (remitente_id, remitente_tipo, destinatario_id, destinatario_tipo, mensaje)
                VALUES (?, ?, ?, ?, ?)
            `;

            console.log('📨 [CHAT] Insertando mensaje con:', {
                remitenteId,
                remitenteTipo,
                destinatarioId: destinatarioIdNum,
                destinatarioTipo,
                mensajeLength: mensaje.trim().length
            });

            const [result] = await pool.execute(query, [remitenteId, remitenteTipo, destinatarioIdNum, destinatarioTipo, mensaje.trim()]);

            console.log('✅ [CHAT] Mensaje insertado correctamente. ID:', result.insertId);

            res.status(201).json({ success: true, message: 'Mensaje enviado correctamente' });

        } catch (error) {
            console.error('❌ [CHAT] Error al enviar mensaje:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor: ' + error.message });
        }
    }

    /**
     * Obtener mensajes no leídos para el usuario actual (excluyendo conversaciones eliminadas)
     */
    async obtenerMensajesNoLeidos(req, res) {
        try {
            const usuarioId = req.session.userId;
            const usuarioTipo = req.session.userRole === 'aprendiz' ? 'aprendiz' : 'admin';

            if (!usuarioId) {
                return res.status(401).json({ success: false, mensajes: [] });
            }

            // Obtener conversaciones eliminadas para este usuario
            const [eliminadas] = await pool.execute(
                `SELECT otro_usuario_id, otro_usuario_tipo FROM conversaciones_eliminadas WHERE usuario_id = ? AND usuario_tipo = ?`,
                [usuarioId, usuarioTipo]
            );

            let query = `
                SELECT
                    m.id,
                    m.mensaje,
                    m.fecha_creacion,
                    m.leido,
                    CASE
                        WHEN m.remitente_tipo = 'aprendiz' THEN CONCAT(a.nombres, ' ', a.primerApellido)
                        ELSE adm.nombreCompleto
                    END as remitente_nombre,
                    m.remitente_tipo
                FROM mensajes m
                LEFT JOIN aprendices a ON m.remitente_id = a.id AND m.remitente_tipo = 'aprendiz'
                LEFT JOIN administradores adm ON m.remitente_id = adm.id AND m.remitente_tipo = 'admin'
                WHERE m.destinatario_id = ? AND m.destinatario_tipo = ? AND m.leido = FALSE
            `;

            const params = [usuarioId, usuarioTipo];

            // Si hay conversaciones eliminadas, excluirlas
            if (eliminadas.length > 0) {
                const condicionesExcluir = eliminadas.map(e => 
                    `(m.remitente_id = ? AND m.remitente_tipo = ?)`
                ).join(' OR ');
                query += ` AND NOT (${condicionesExcluir})`;
                eliminadas.forEach(e => {
                    params.push(e.otro_usuario_id, e.otro_usuario_tipo);
                });
            }

            query += ` ORDER BY m.fecha_creacion DESC`;

            const [mensajes] = await pool.execute(query, params);

            res.json({ success: true, mensajes });

        } catch (error) {
            console.error('Error al obtener mensajes no leídos:', error);
            res.status(500).json({ success: false, mensajes: [] });
        }
    }

    /**
     * Obtener historial de mensajes con un usuario específico (excluyendo los eliminados para el usuario actual)
     */
    async obtenerHistorialMensajes(req, res) {
        try {
            const usuarioId = req.session.userId;
            const usuarioTipo = req.session.userRole === 'aprendiz' ? 'aprendiz' : 'admin';
            // Convertir a número para asegurar comparación correcta
            const otroUsuarioId = parseInt(req.params.otroUsuarioId);
            const otroUsuarioTipo = req.params.otroUsuarioTipo;

            console.log('📨 [HISTORIAL] Solicitando historial:', { usuarioId, usuarioTipo, otroUsuarioId, otroUsuarioTipo });

            if (!usuarioId || !otroUsuarioId || isNaN(otroUsuarioId)) {
                console.log('❌ [HISTORIAL] Datos inválidos');
                return res.status(400).json({ success: false, mensajes: [], message: 'Datos inválidos' });
            }

            // Verificar si la conversación está eliminada para el usuario actual
            const [eliminada] = await pool.execute(
                `SELECT id FROM conversaciones_eliminadas WHERE usuario_id = ? AND usuario_tipo = ? AND otro_usuario_id = ? AND otro_usuario_tipo = ?`,
                [usuarioId, usuarioTipo, otroUsuarioId, otroUsuarioTipo]
            );

            console.log('📨 [HISTORIAL] Conversación eliminada check:', eliminada.length > 0 ? 'SÍ eliminada' : 'NO eliminada');

            if (eliminada.length > 0) {
                console.log('📨 [HISTORIAL] Conversación marcada como eliminada');
                return res.json({ success: true, mensajes: [] });
            }

            // Query para obtener mensajes entre los dos usuarios
            // Asegurar que los IDs sean números para comparación correcta
            const query = `
                SELECT
                    m.id,
                    m.mensaje,
                    m.fecha_creacion,
                    m.leido,
                    CASE
                        WHEN m.remitente_tipo = 'aprendiz' THEN CONCAT(a.nombres, ' ', a.primerApellido)
                        ELSE adm.nombreCompleto
                    END as remitente_nombre,
                    m.remitente_tipo,
                    m.destinatario_tipo,
                    (CAST(m.remitente_id AS UNSIGNED) = ? AND m.remitente_tipo = ?) as es_remitente
                FROM mensajes m
                LEFT JOIN aprendices a ON m.remitente_id = a.id AND m.remitente_tipo = 'aprendiz'
                LEFT JOIN administradores adm ON m.remitente_id = adm.id AND m.remitente_tipo = 'admin'
                WHERE ((CAST(m.remitente_id AS UNSIGNED) = ? AND m.remitente_tipo = ? AND CAST(m.destinatario_id AS UNSIGNED) = ? AND m.destinatario_tipo = ?)
                   OR (CAST(m.remitente_id AS UNSIGNED) = ? AND m.remitente_tipo = ? AND CAST(m.destinatario_id AS UNSIGNED) = ? AND m.destinatario_tipo = ?))
                ORDER BY m.fecha_creacion ASC
            `;

            const params = [
                usuarioId, usuarioTipo, // Para es_remitente
                usuarioId, usuarioTipo, otroUsuarioId, otroUsuarioTipo, // Mensajes enviados por usuario actual
                otroUsuarioId, otroUsuarioTipo, usuarioId, usuarioTipo // Mensajes recibidos por usuario actual
            ];

            console.log('📨 [HISTORIAL] Ejecutando query con params:', params);

            const [mensajes] = await pool.execute(query, params);

            console.log(`✅ [HISTORIAL] Encontrados ${mensajes.length} mensajes`);
            if (mensajes.length > 0) {
                console.log('📨 [HISTORIAL] Primer mensaje:', {
                    id: mensajes[0].id,
                    remitente_id: mensajes[0].remitente_id,
                    destinatario_id: mensajes[0].destinatario_id,
                    es_remitente: mensajes[0].es_remitente
                });
            }

            res.json({ success: true, mensajes });

        } catch (error) {
            console.error('❌ [HISTORIAL] Error al obtener historial:', error);
            res.status(500).json({ success: false, mensajes: [], message: error.message });
        }
    }

    /**
     * Marcar mensaje como leído
     */
    async marcarMensajeLeido(req, res) {
        try {
            const usuarioId = req.session.userId;
            const usuarioTipo = req.session.userRole === 'aprendiz' ? 'aprendiz' : 'admin';
            const mensajeId = req.params.id;

            console.log('📨 [MARCAR LEIDO] Marcando mensaje:', { mensajeId, usuarioId, usuarioTipo });

            if (!usuarioId) {
                return res.status(401).json({ success: false });
            }

            const query = `
                UPDATE mensajes
                SET leido = TRUE, fecha_lectura = NOW()
                WHERE id = ? AND destinatario_id = ? AND destinatario_tipo = ?
            `;

            const [result] = await pool.execute(query, [mensajeId, usuarioId, usuarioTipo]);

            if (result.affectedRows > 0) {
                console.log('📨 [MARCAR LEIDO] Mensaje marcado como leído correctamente');
                res.json({ success: true });
            } else {
                console.log('📨 [MARCAR LEIDO] Mensaje no encontrado o no autorizado');
                res.status(404).json({ success: false, message: 'Mensaje no encontrado o no autorizado' });
            }

        } catch (error) {
            console.error('Error al marcar mensaje como leído:', error);
            res.status(500).json({ success: false });
        }
    }

    /**
     * Obtener contador de mensajes no leídos (excluyendo conversaciones eliminadas)
     */
    async obtenerContadorMensajes(req, res) {
        try {
            const usuarioId = req.session.userId;
            const usuarioTipo = req.session.userRole === 'aprendiz' ? 'aprendiz' : 'admin';

            console.log('📨 [CONTADOR] Solicitando contador para:', { usuarioId, usuarioTipo });

            if (!usuarioId) {
                return res.status(401).json({ success: false, count: 0 });
            }

            // Obtener conversaciones eliminadas para este usuario
            const [eliminadas] = await pool.execute(
                `SELECT otro_usuario_id, otro_usuario_tipo FROM conversaciones_eliminadas WHERE usuario_id = ? AND usuario_tipo = ?`,
                [usuarioId, usuarioTipo]
            );

            console.log('📨 [CONTADOR] Conversaciones eliminadas:', eliminadas.length);

            // Si no hay conversaciones eliminadas, usar query simple
            if (eliminadas.length === 0) {
                const query = `
                    SELECT COUNT(*) as count
                    FROM mensajes
                    WHERE destinatario_id = ? AND destinatario_tipo = ? AND leido = FALSE
                `;
                const [result] = await pool.execute(query, [usuarioId, usuarioTipo]);
                const count = result[0].count;
                console.log('📨 [CONTADOR] Contador (sin eliminadas):', count);
                return res.json({ success: true, count });
            }

            // Construir condiciones para excluir conversaciones eliminadas usando parámetros preparados
            const condicionesExcluir = eliminadas.map(() => 
                `(remitente_id = ? AND remitente_tipo = ?)`
            ).join(' OR ');

            const query = `
                SELECT COUNT(*) as count
                FROM mensajes
                WHERE destinatario_id = ? AND destinatario_tipo = ? AND leido = FALSE
                AND NOT (${condicionesExcluir})
            `;

            // Construir array de parámetros: usuarioId, usuarioTipo, y luego cada par de eliminadas
            const params = [usuarioId, usuarioTipo];
            eliminadas.forEach(e => {
                params.push(e.otro_usuario_id, e.otro_usuario_tipo);
            });

            const [result] = await pool.execute(query, params);
            const count = result[0].count;

            console.log('📨 [CONTADOR] Contador (con eliminadas):', count);

            res.json({ success: true, count });

        } catch (error) {
            console.error('Error al obtener contador de mensajes:', error);
            res.status(500).json({ success: false, count: 0 });
        }
    }

    /**
     * Buscar usuarios para iniciar conversación
     */
    async buscarUsuarios(req, res) {
        try {
            const usuarioId = req.session.userId;
            const usuarioTipo = req.session.userRole === 'aprendiz' ? 'aprendiz' : 'admin';
            const { q } = req.query; // query de búsqueda

            if (!usuarioId) {
                return res.status(401).json({ success: false, usuarios: [] });
            }

            // Determinar qué tipo de usuarios buscar
            const buscarTipo = usuarioTipo === 'aprendiz' ? 'admin' : 'aprendiz';
            const tabla = buscarTipo === 'aprendiz' ? 'aprendices' : 'administradores';
            const nombreCampo = buscarTipo === 'aprendiz' ? "CONCAT(nombres, ' ', primerApellido)" : 'nombreCompleto';

            let query = `SELECT id, ${nombreCampo} as nombre FROM ${tabla} WHERE 1=1`;
            let params = [];

            if (q && q.trim() !== '') {
                query += ` AND ${nombreCampo} LIKE ?`;
                params.push(`%${q.trim()}%`);
            }

            query += ' ORDER BY nombre ASC LIMIT 20';

            const [usuarios] = await pool.execute(query, params);

            // Agregar el tipo de usuario a cada resultado
            const usuariosConTipo = usuarios.map(usuario => ({
                ...usuario,
                tipo: buscarTipo
            }));

            res.json({ success: true, usuarios: usuariosConTipo });

        } catch (error) {
            console.error('Error al buscar usuarios:', error);
            res.status(500).json({ success: false, usuarios: [] });
        }
    }

    /* Eliminar conversación solo para el usuario activo */
    async eliminarConversacion(req, res) {
        try {
            const usuarioId = req.session.userId;
            const usuarioTipo = req.session.userRole === 'aprendiz' ? 'aprendiz' : 'admin';
            // Convertir a número para asegurar comparación correcta
            const otroUsuarioId = parseInt(req.params.otroUsuarioId);
            const otroUsuarioTipo = req.params.otroUsuarioTipo;

            if (!usuarioId || !otroUsuarioId || isNaN(otroUsuarioId)) {
                return res.status(400).json({ success: false, message: 'Datos inválidos' });
            }

            // Validar que el usuario actual existe
            const tablaUsuario = usuarioTipo === 'aprendiz' ? 'aprendices' : 'administradores';
            const [usuario] = await pool.execute(`SELECT id FROM ${tablaUsuario} WHERE id = ?`, [usuarioId]);
            if (usuario.length === 0) {
                return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
            }

            // Validar que el otro usuario existe
            const tablaOtro = otroUsuarioTipo === 'aprendiz' ? 'aprendices' : 'administradores';
            const [otroUsuario] = await pool.execute(`SELECT id FROM ${tablaOtro} WHERE id = ?`, [otroUsuarioId]);
            if (otroUsuario.length === 0) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }

            // Registrar la eliminación en la tabla conversaciones_eliminadas
            const insertQuery = `REPLACE INTO conversaciones_eliminadas (usuario_id, usuario_tipo, otro_usuario_id, otro_usuario_tipo, fecha_eliminacion)
                VALUES (?, ?, ?, ?, NOW())`;
            await pool.execute(insertQuery, [usuarioId, usuarioTipo, otroUsuarioId, otroUsuarioTipo]);

            res.json({ success: true, message: 'Conversación eliminada correctamente solo para el usuario actual' });

        } catch (error) {
            console.error('Error al eliminar conversación:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    /**
     * Obtener lista de conversaciones (excluyendo las eliminadas para el usuario actual)
     */
    async obtenerConversaciones(req, res) {
        try {
            const usuarioId = req.session.userId;
            const usuarioTipo = req.session.userRole === 'aprendiz' ? 'aprendiz' : 'admin';
            if (!usuarioId) {
                return res.status(401).json({ success: false, conversaciones: [] });
            }
    
            // Consulta mejorada para obtener conversaciones y el conteo correcto de no leídos
            const query = `
                SELECT
                    conv.otro_usuario_id,
                    conv.otro_usuario_tipo,
                    conv.nombre,
                    conv.ultimo_mensaje,
                    (SELECT COUNT(*)
                     FROM mensajes m
                     WHERE m.destinatario_id = ? 
                       AND m.destinatario_tipo = ?
                       AND m.remitente_id = conv.otro_usuario_id
                       AND m.remitente_tipo = conv.otro_usuario_tipo
                       AND m.leido = FALSE
                    ) as no_leidos
                FROM (
                    SELECT
                        otro_usuario_id,
                        otro_usuario_tipo,
                        MAX(ultimo_mensaje) as ultimo_mensaje,
                        ANY_VALUE(nombre) as nombre
                    FROM (
                        -- Mensajes enviados por el usuario actual
                        SELECT
                            m.destinatario_id as otro_usuario_id,
                            m.destinatario_tipo as otro_usuario_tipo,
                            m.fecha_creacion as ultimo_mensaje,
                            COALESCE(
                                CONCAT(a.nombres, ' ', a.primerApellido),
                                adm.nombreCompleto,
                                'Usuario desconocido'
                            ) as nombre
                        FROM mensajes m
                        LEFT JOIN aprendices a ON m.destinatario_id = a.id AND m.destinatario_tipo = 'aprendiz'
                        LEFT JOIN administradores adm ON m.destinatario_id = adm.id AND m.destinatario_tipo = 'admin'
                        WHERE m.remitente_id = ? AND m.remitente_tipo = ?
                        
                        UNION
                        
                        -- Mensajes recibidos por el usuario actual
                        SELECT
                            m.remitente_id as otro_usuario_id,
                            m.remitente_tipo as otro_usuario_tipo,
                            m.fecha_creacion as ultimo_mensaje,
                            COALESCE(
                                CONCAT(a.nombres, ' ', a.primerApellido),
                                adm.nombreCompleto,
                                'Usuario desconocido'
                            ) as nombre
                        FROM mensajes m
                        LEFT JOIN aprendices a ON m.remitente_id = a.id AND m.remitente_tipo = 'aprendiz'
                        LEFT JOIN administradores adm ON m.remitente_id = adm.id AND m.remitente_tipo = 'admin'
                        WHERE m.destinatario_id = ? AND m.destinatario_tipo = ?
                    ) as base
                    GROUP BY otro_usuario_id, otro_usuario_tipo
                ) as conv
                ORDER BY conv.ultimo_mensaje DESC
            `;
    
            const params = [
                usuarioId, usuarioTipo, // Para la subconsulta de no_leidos
                usuarioId, usuarioTipo, // Para mensajes enviados
                usuarioId, usuarioTipo  // Para mensajes recibidos
            ];

            const [todasConversaciones] = await pool.execute(query, params);
    
            // Filtrar las conversaciones eliminadas para el usuario actual
            const [eliminadas] = await pool.execute(
                `SELECT otro_usuario_id, otro_usuario_tipo FROM conversaciones_eliminadas WHERE usuario_id = ? AND usuario_tipo = ?`,
                [usuarioId, usuarioTipo]
            );
            const eliminadasSet = new Set(eliminadas.map(e => `${e.otro_usuario_id}_${e.otro_usuario_tipo}`));
            const conversaciones = todasConversaciones.filter(c => !eliminadasSet.has(`${c.otro_usuario_id}_${c.otro_usuario_tipo}`));
    
            res.json({ success: true, conversaciones });
        } catch (error) {
            console.error('Error al obtener conversaciones:', error);
            res.status(500).json({ success: false, conversaciones: [] });
        }
    }
}

module.exports = new ChatControlador();
