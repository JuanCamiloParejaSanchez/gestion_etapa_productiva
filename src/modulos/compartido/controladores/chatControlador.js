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

            // Validar que el remitente existe
            const tablaRemitente = remitenteTipo === 'aprendiz' ? 'aprendices' : 'administradores';
            const [remitente] = await pool.execute(`SELECT id FROM ${tablaRemitente} WHERE id = ?`, [remitenteId]);

            if (remitente.length === 0) {
                console.log('❌ [CHAT] Usuario remitente no encontrado');
                return res.status(401).json({ success: false, message: 'Usuario remitente no encontrado' });
            }

            // Validar que el destinatario existe
            const tablaDestinatario = destinatarioTipo === 'aprendiz' ? 'aprendices' : 'administradores';
            const [destinatario] = await pool.execute(`SELECT id FROM ${tablaDestinatario} WHERE id = ?`, [destinatarioId]);

            if (destinatario.length === 0) {
                console.log('❌ [CHAT] Destinatario no encontrado');
                return res.status(404).json({ success: false, message: 'Destinatario no encontrado' });
            }

            // Insertar mensaje
            const query = `
                INSERT INTO mensajes (remitente_id, remitente_tipo, destinatario_id, destinatario_tipo, mensaje)
                VALUES (?, ?, ?, ?, ?)
            `;

            const [result] = await pool.execute(query, [remitenteId, remitenteTipo, destinatarioId, destinatarioTipo, mensaje.trim()]);

            console.log('✅ [CHAT] Mensaje insertado correctamente. ID:', result.insertId);

            res.status(201).json({ success: true, message: 'Mensaje enviado correctamente' });

        } catch (error) {
            console.error('❌ [CHAT] Error al enviar mensaje:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor: ' + error.message });
        }
    }

    /**
     * Obtener mensajes no leídos para el usuario actual
     */
    async obtenerMensajesNoLeidos(req, res) {
        try {
            const usuarioId = req.session.userId;
            const usuarioTipo = req.session.userRole === 'aprendiz' ? 'aprendiz' : 'admin';

            if (!usuarioId) {
                return res.status(401).json({ success: false, mensajes: [] });
            }

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
                    m.remitente_tipo
                FROM mensajes m
                LEFT JOIN aprendices a ON m.remitente_id = a.id AND m.remitente_tipo = 'aprendiz'
                LEFT JOIN administradores adm ON m.remitente_id = adm.id AND m.remitente_tipo = 'admin'
                WHERE m.destinatario_id = ? AND m.destinatario_tipo = ? AND m.leido = FALSE
                ORDER BY m.fecha_creacion DESC
            `;

            const [mensajes] = await pool.execute(query, [usuarioId, usuarioTipo]);

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
            const { otroUsuarioId, otroUsuarioTipo } = req.params;

            console.log('📨 [HISTORIAL] Solicitando historial:', { usuarioId, usuarioTipo, otroUsuarioId, otroUsuarioTipo });

            if (!usuarioId) {
                return res.status(401).json({ success: false, mensajes: [] });
            }

            // Verificar si la conversación está eliminada para el usuario actual
            const [eliminada] = await pool.execute(
                `SELECT id FROM conversaciones_eliminadas WHERE usuario_id = ? AND usuario_tipo = ? AND otro_usuario_id = ? AND otro_usuario_tipo = ?`,
                [usuarioId, usuarioTipo, otroUsuarioId, otroUsuarioTipo]
            );

            if (eliminada.length > 0) {
                console.log('📨 [HISTORIAL] Conversación marcada como eliminada');
                return res.json({ success: true, mensajes: [] });
            }

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
                    CASE
                        WHEN m.destinatario_tipo = 'aprendiz' THEN CONCAT(da.nombres, ' ', da.primerApellido)
                        ELSE dadm.nombreCompleto
                    END as destinatario_nombre,
                    m.remitente_tipo,
                    m.destinatario_tipo,
                    m.remitente_id = ? as es_remitente
                FROM mensajes m
                LEFT JOIN aprendices a ON m.remitente_id = a.id AND m.remitente_tipo = 'aprendiz'
                LEFT JOIN administradores adm ON m.remitente_id = adm.id AND m.remitente_tipo = 'admin'
                LEFT JOIN aprendices da ON m.destinatario_id = da.id AND m.destinatario_tipo = 'aprendiz'
                LEFT JOIN administradores dadm ON m.destinatario_id = dadm.id AND m.destinatario_tipo = 'admin'
                WHERE ((m.remitente_id = ? AND m.remitente_tipo = ? AND m.destinatario_id = ? AND m.destinatario_tipo = ?)
                   OR (m.remitente_id = ? AND m.remitente_tipo = ? AND m.destinatario_id = ? AND m.destinatario_tipo = ?))
                ORDER BY m.fecha_creacion ASC
            `;

            const params = [
                usuarioId, // Para es_remitente
                usuarioId, usuarioTipo, otroUsuarioId, otroUsuarioTipo, // Mensajes enviados por usuario actual
                otroUsuarioId, otroUsuarioTipo, usuarioId, usuarioTipo // Mensajes recibidos por usuario actual
            ];

            console.log('📨 [HISTORIAL] Ejecutando query con params:', params);

            const [mensajes] = await pool.execute(query, params);

            console.log(`✅ [HISTORIAL] Encontrados ${mensajes.length} mensajes`);
            if (mensajes.length > 0) {
                console.log('📨 [HISTORIAL] Primer mensaje:', mensajes[0]);
            }

            res.json({ success: true, mensajes });

        } catch (error) {
            console.error('❌ [HISTORIAL] Error al obtener historial:', error);
            res.status(500).json({ success: false, mensajes: [] });
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
                res.json({ success: true });
            } else {
                res.status(404).json({ success: false, message: 'Mensaje no encontrado o no autorizado' });
            }

        } catch (error) {
            console.error('Error al marcar mensaje como leído:', error);
            res.status(500).json({ success: false });
        }
    }

    /**
     * Obtener contador de mensajes no leídos
     */
    async obtenerContadorMensajes(req, res) {
        try {
            const usuarioId = req.session.userId;
            const usuarioTipo = req.session.userRole === 'aprendiz' ? 'aprendiz' : 'admin';

            if (!usuarioId) {
                return res.status(401).json({ success: false, count: 0 });
            }

            const query = `
                SELECT COUNT(*) as count
                FROM mensajes
                WHERE destinatario_id = ? AND destinatario_tipo = ? AND leido = FALSE
            `;

            const [result] = await pool.execute(query, [usuarioId, usuarioTipo]);
            const count = result[0].count;

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

            res.json({ success: true, usuarios });

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
            const { otroUsuarioId, otroUsuarioTipo } = req.params;

            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
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

            // Consulta para obtener los usuarios con los que se ha chateado
            const query = `
                SELECT DISTINCT
                    CASE
                        WHEN m.remitente_id = ? AND m.remitente_tipo = ? THEN m.destinatario_id
                        ELSE m.remitente_id
                    END as otro_usuario_id,
                    CASE
                        WHEN m.remitente_id = ? AND m.remitente_tipo = ? THEN m.destinatario_tipo
                        ELSE m.remitente_tipo
                    END as otro_usuario_tipo,
                    CASE
                        WHEN m.remitente_tipo = 'aprendiz' AND m.remitente_id != ? THEN CONCAT(a.nombres, ' ', a.primerApellido)
                        WHEN m.destinatario_tipo = 'aprendiz' AND m.destinatario_id != ? THEN CONCAT(da.nombres, ' ', da.primerApellido)
                        WHEN m.remitente_tipo = 'admin' AND m.remitente_id != ? THEN adm.nombreCompleto
                        ELSE dadm.nombreCompleto
                    END as nombre,
                    MAX(m.fecha_creacion) as ultimo_mensaje,
                    SUM(CASE WHEN m.destinatario_id = ? AND m.destinatario_tipo = ? AND m.leido = FALSE THEN 1 ELSE 0 END) as no_leidos
                FROM mensajes m
                LEFT JOIN aprendices a ON m.remitente_id = a.id AND m.remitente_tipo = 'aprendiz'
                LEFT JOIN administradores adm ON m.remitente_id = adm.id AND m.remitente_tipo = 'admin'
                LEFT JOIN aprendices da ON m.destinatario_id = da.id AND m.destinatario_tipo = 'aprendiz'
                LEFT JOIN administradores dadm ON m.destinatario_id = dadm.id AND m.destinatario_tipo = 'admin'
                WHERE (m.remitente_id = ? AND m.remitente_tipo = ?) OR (m.destinatario_id = ? AND m.destinatario_tipo = ?)
                GROUP BY otro_usuario_id, otro_usuario_tipo, nombre
                ORDER BY ultimo_mensaje DESC
            `;

            const [todasConversaciones] = await pool.execute(query, [
                usuarioId, usuarioTipo, usuarioId, usuarioTipo, usuarioId, usuarioId, usuarioId, usuarioId, usuarioTipo,
                usuarioId, usuarioTipo, usuarioId, usuarioTipo
            ]);

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