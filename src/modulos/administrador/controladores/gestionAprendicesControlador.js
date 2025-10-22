// src/modulos/administrador/controladores/gestionAprendicesControlador.js
// Propósito: Controlador para la gestión de aprendices - maneja requests HTTP y responses

const { pool } = require('../../../configuracion/baseDatos');
const ServicioWatsonSentimientos = require('../servicios/servicioWatsonSentimientos');
const servicioAlertas = require('../../../compartido/servicios/servicioAlertas');
const ServicioGestionAprendices = require('../servicios/servicioGestionAprendices');
const servicioGestionAprendices = new ServicioGestionAprendices();
const { logger } = require('../../../compartido/utilidades/logger');

// Crear una instancia del servicio de análisis de sentimientos con Watson
const servicioAnalisisSentimientos = new ServicioWatsonSentimientos();


const gestionAprendicesControlador = {

    // --- NUEVA FUNCIÓN PARA EL PANEL PRINCIPAL ---
    async mostrarPanelPrincipal(req, res) {
        try {
            // Obtener alertas para el administrador
            const alertas = await servicioAlertas.obtenerAlertasAdministrador();
            res.render('administrador/panelPrincipal', {
                title: 'Panel del Administrador',
                userRole: 'admin',
                alertas: alertas,
                layout: 'plantillas/principal'
            });
        } catch (error) {
            console.error('Error al cargar panel principal:', error);
            res.status(500).render('compartido/paginaError', {
                message: 'Error al cargar el panel principal',
                layout: 'plantillas/principal'
            });
        }
    },

    async mostrarPaginaReportes(req, res) {
        try {
            const datosReportes = await servicioGestionAprendices.obtenerDatosReportes();

            logger.debug('Datos completos para reportes obtenidos', {
                programas: datosReportes.datosProgramas.labels.length,
                estados: datosReportes.datosEstados.labels.length,
                alternativas: datosReportes.datosAlternativas.labels.length,
                documentos: datosReportes.datosDocumentos.labels.length,
                seguimiento: datosReportes.datosSeguimiento.labels.length,
                departamentos: datosReportes.datosDepartamentos.labels.length
            });

            res.render('administrador/reportes', {
                title: 'Reportes y Estadísticas',
                userRole: 'admin',
                layout: 'plantillas/principal',
                datosProgramas: JSON.stringify(datosReportes.datosProgramas),
                datosEstados: JSON.stringify(datosReportes.datosEstados),
                datosAlternativas: JSON.stringify(datosReportes.datosAlternativas),
                datosDocumentos: JSON.stringify(datosReportes.datosDocumentos),
                datosSeguimiento: JSON.stringify(datosReportes.datosSeguimiento),
                datosDepartamentos: JSON.stringify(datosReportes.datosDepartamentos),
                estadisticasGenerales: datosReportes.estadisticasGenerales
            });

        } catch (error) {
            logger.error('Error al cargar reportes:', error);
            res.status(500).render('compartido/paginaError', {
                message: 'Error al cargar los reportes',
                layout: 'plantillas/principal'
            });
        }
    },

    async listarAprendices(req, res) {
        try {
            res.render('administrador/listarAprendices', {
                title: 'Listado de Aprendices',
                userRole: 'admin',
                layout: 'plantillas/principal'
            });
        } catch (error) {
            console.error('Error al cargar listado de aprendices:', error);
            res.status(500).render('compartido/paginaError', {
                message: 'Error al cargar el listado de aprendices',
                layout: 'plantillas/principal'
            });
        }
    },

    async obtenerDatosAprendices(req, res) {
        try {
            const options = req.body;
            const result = await servicioGestionAprendices.obtenerDatosAprendices(options);
            res.json(result);
        } catch (error) {
            logger.error('Error al obtener datos de aprendices:', error);
            res.status(500).json({ error: 'Error interno del servidor.' });
        }
    },
    
    async mostrarBitacorasDeAprendiz(req, res) {
        try {
            const { id } = req.params;
            
            // Obtener información del aprendiz
            const [aprendizResult] = await pool.query(
                'SELECT * FROM aprendices WHERE id = ?',
                [id]
            );
            
            if (aprendizResult.length === 0) {
                return res.status(404).render('compartido/paginaError', {
                    message: 'Aprendiz no encontrado',
                    layout: 'plantillas/principal'
                });
            }
            
            // Obtener bitácoras del aprendiz
            const [bitacorasResult] = await pool.query(
                'SELECT * FROM bitacoras WHERE aprendizId = ? ORDER BY fechaCreacion DESC',
                [id]
            );

            let analisisSentimientos = null;
            const erroresAnalisis = [];

            // Si no hay bitácoras, no intentar análisis
            if (bitacorasResult && bitacorasResult.length > 0) {
                try {
                    // Analizar sentimientos de las bitácoras
                    analisisSentimientos = await servicioAnalisisSentimientos.analizarTendenciasAprendiz(bitacorasResult);

                    // Actualizar cada bitácora con su análisis
                    for (const bitacora of bitacorasResult) {
                        try {
                            const analisisBitacora = await servicioAnalisisSentimientos.analizarBitacora(bitacora);
                            // Normalizar scores y confianza entre 0 y 1
                            function normalizarScore(score) {
                                if (typeof score !== 'number' || isNaN(score)) return 0;
                                return Math.max(0, Math.min(1, score));
                            }
                            // Actualizar la bitácora en la base de datos
                            await pool.query(
                                `UPDATE bitacoras SET
                                    sentimiento_desafio = ?,
                                    sentimiento_logro = ?,
                                    sentimiento_comunicacion = ?,
                                    score_desafio = ?,
                                    score_logro = ?,
                                    score_comunicacion = ?,
                                    sentimiento_general = ?,
                                    score_promedio = ?,
                                    confianza = ?,
                                    contiene_ironia = ?,
                                    contextos_detectados = ?,
                                    recomendaciones = ?
                                WHERE id = ?`,
                                [
                                    analisisBitacora.analisisDetallado.desafio.sentimiento,
                                    analisisBitacora.analisisDetallado.logro.sentimiento,
                                    analisisBitacora.analisisDetallado.comunicacion.sentimiento,
                                    normalizarScore(analisisBitacora.analisisDetallado.desafio.score),
                                    normalizarScore(analisisBitacora.analisisDetallado.logro.score),
                                    normalizarScore(analisisBitacora.analisisDetallado.comunicacion.score),
                                    analisisBitacora.sentimientoGeneral,
                                    normalizarScore(analisisBitacora.scoreGeneral),
                                    normalizarScore(analisisBitacora.confianzaGeneral),
                                    analisisBitacora.analisisDetallado.desafio.contieneIronia ||
                                    analisisBitacora.analisisDetallado.logro.contieneIronia ||
                                    analisisBitacora.analisisDetallado.comunicacion.contieneIronia,
                                    JSON.stringify(analisisBitacora.contextosGenerales),
                                    JSON.stringify(analisisBitacora.recomendaciones),
                                    bitacora.id
                                ]
                            );
                        } catch (errorBitacora) {
                            console.error(`Error al analizar bitácora ${bitacora.id}:`, errorBitacora);
                            erroresAnalisis.push({
                                bitacoraId: bitacora.id,
                                error: errorBitacora.message
                            });
                        }
                    }

                    // Obtener las bitácoras actualizadas
                    const [bitacorasActualizadas] = await pool.query(
                        'SELECT * FROM bitacoras WHERE aprendizId = ? ORDER BY fechaCreacion DESC',
                        [id]
                    );

                    // Actualizar bitacorasResult con los datos actualizados
                    bitacorasResult.length = 0;
                    bitacorasResult.push(...bitacorasActualizadas);
                } catch (errorAnalisis) {
                    console.error('Error al analizar sentimientos:', errorAnalisis);
                    erroresAnalisis.push({
                        error: 'Error general en el análisis de sentimientos',
                        detalles: errorAnalisis.message
                    });
                    // analisisSentimientos permanece como null cuando hay error
                }
            }
            // Si no hay bitácoras, analisisSentimientos permanece como null
            
            // Obtener estado de Watson
            const estadoWatson = servicioAnalisisSentimientos.obtenerEstadoConexion();

            res.render('administrador/verBitacorasAprendiz', {
                title: 'Bitácoras del Aprendiz',
                userRole: 'admin',
                layout: 'plantillas/principal',
                aprendiz: aprendizResult[0],
                bitacoras: bitacorasResult,
                analisisSentimientos: analisisSentimientos,
                erroresAnalisis: erroresAnalisis.length > 0 ? erroresAnalisis : null,
                estadoWatson: estadoWatson
            });
            
        } catch (error) {
            console.error('Error al cargar bitácoras:', error);
            res.status(500).render('compartido/paginaError', {
                message: 'Error al cargar las bitácoras',
                layout: 'plantillas/principal'
            });
        }
    },
    
    async verificarDocumentacion(req, res) {
        try {
            const { id } = req.params;
            
            // Obtener información del aprendiz
            const [aprendizResult] = await pool.query(
                'SELECT * FROM aprendices WHERE id = ?',
                [id]
            );
            
            if (aprendizResult.length === 0) {
                return res.status(404).render('compartido/paginaError', {
                    message: 'Aprendiz no encontrado',
                    layout: 'plantillas/principal'
                });
            }
            
            // Obtener documentos del aprendiz
            const [documentosResult] = await pool.query(
                'SELECT * FROM documentos_aprendiz WHERE aprendiz_id = ? ORDER BY fecha_subida DESC',
                [id]
            );
            
            res.render('administrador/verificarDocumentacion', {
                title: 'Verificar Documentación',
                userRole: 'admin',
                layout: 'plantillas/principal',
                aprendiz: aprendizResult[0],
                documentos: documentosResult
            });
            
        } catch (error) {
            console.error('Error al cargar documentación:', error);
            res.status(500).render('compartido/paginaError', {
                message: 'Error al cargar la documentación',
                layout: 'plantillas/principal'
            });
        }
    },

    async editarAprendiz(req, res) {
        try {
            const { id } = req.params;

            // Obtener información del aprendiz
            const [aprendizResult] = await pool.execute(
                'SELECT * FROM aprendices WHERE id = ?',
                [id]
            );

            if (aprendizResult.length === 0) {
                return res.status(404).render('compartido/paginaError', {
                    message: 'Aprendiz no encontrado',
                    layout: 'plantillas/principal'
                });
            }

            // Obtener mensajes de sesión si existen
            const successMessage = req.session?.successMessage;
            const errorMessage = req.session?.errorMessage;

            // Limpiar mensajes de sesión
            if (req.session) {
                delete req.session.successMessage;
                delete req.session.errorMessage;
            }

            res.render('administrador/editarAprendiz', {
                title: 'Editar Aprendiz',
                userRole: 'admin',
                layout: 'plantillas/principal',
                aprendiz: aprendizResult[0],
                successMessage: successMessage,
                errorMessage: errorMessage,
                userName: req.session?.userName || 'Administrador'
            });

        } catch (error) {
            console.error('Error al cargar formulario de edición:', error);
            res.status(500).render('compartido/paginaError', {
                message: 'Error al cargar el formulario de edición',
                layout: 'plantillas/principal'
            });
        }
    },

    async verAprendiz(req, res) {
        try {
            const { id } = req.params;
            
            // Obtener información completa del aprendiz
            const [aprendizResult] = await pool.execute(
                'SELECT * FROM aprendices WHERE id = ?',
                [id]
            );
            
            if (aprendizResult.length === 0) {
                return res.status(404).render('compartido/paginaError', {
                    message: 'Aprendiz no encontrado',
                    layout: 'plantillas/principal'
                });
            }
            
            res.render('administrador/verAprendiz', {
                title: 'Ver Aprendiz',
                userRole: 'admin',
                layout: 'plantillas/principal',
                aprendiz: aprendizResult[0]
            });
            
        } catch (error) {
            console.error('Error al cargar información del aprendiz:', error);
            res.status(500).render('compartido/paginaError', {
                message: 'Error al cargar la información del aprendiz',
                layout: 'plantillas/principal'
            });
        }
    },

    async actualizarAprendiz(req, res) {
        try {
            const { id } = req.params;
            const datosActualizados = req.body;

            const result = await servicioGestionAprendices.actualizarAprendiz(id, datosActualizados);

            if (result.success) {
                // Para solicitudes AJAX, devolver JSON
                if (req.headers.accept && req.headers.accept.includes('application/json')) {
                    return res.json({
                        success: true,
                        message: 'Aprendiz actualizado correctamente'
                    });
                }

                // Para solicitudes normales del formulario, devolver JSON para el modal
                return res.json({
                    success: true,
                    message: 'Aprendiz actualizado correctamente'
                });
            } else {
                // Para solicitudes AJAX
                if (req.headers.accept && req.headers.accept.includes('application/json')) {
                    return res.status(400).json({
                        success: false,
                        message: 'No hay datos válidos para actualizar'
                    });
                }

                // Para solicitudes normales
                return res.status(400).json({
                    success: false,
                    message: 'No hay datos válidos para actualizar'
                });
            }

        } catch (error) {
            logger.error('Error al actualizar aprendiz:', error);

            // Para solicitudes AJAX
            if (req.headers.accept && req.headers.accept.includes('application/json')) {
                return res.status(500).json({
                    success: false,
                    message: 'Error al actualizar el aprendiz',
                    error: error.message
                });
            }

            // Para solicitudes normales
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar el aprendiz',
                error: error.message
            });
        }
    },

    async eliminarAprendiz(req, res) {
        try {
            const { id } = req.params;

            // Verificar si el aprendiz existe
            const aprendiz = await servicioGestionAprendices.buscarPorId(id);
            if (!aprendiz) {
                return res.status(404).json({
                    success: false,
                    message: 'Aprendiz no encontrado'
                });
            }

            const result = await servicioGestionAprendices.eliminarAprendiz(id);

            if (result.success) {
                res.json({
                    success: true,
                    message: 'Aprendiz eliminado correctamente'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Error al eliminar el aprendiz'
                });
            }

        } catch (error) {
            logger.error('Error al eliminar aprendiz:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar el aprendiz',
                error: error.message
            });
        }
    },

    async obtenerBitacorasData(req, res) {
        try {
            const { id } = req.params;
            
            // Verificar si el aprendiz existe
            const [aprendizResult] = await pool.execute(
                'SELECT id, nombres, primerApellido, segundoApellido FROM aprendices WHERE id = ?',
                [id]
            );
            
            if (aprendizResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Aprendiz no encontrado'
                });
            }
            
            // Obtener las bitácoras del aprendiz
            const [bitacorasResult] = await pool.execute(`
                SELECT 
                    id,
                    fechaRegistro,
                    contenido,
                    estado,
                    fechaAprobacion,
                    comentariosInstructor
                FROM bitacoras 
                WHERE aprendizId = ? 
                ORDER BY fechaRegistro DESC
            `, [id]);
            
            // Formatear las bitácoras para la respuesta
            const bitacoras = bitacorasResult.map(bitacora => ({
                id: bitacora.id,
                fecha: new Date(bitacora.fechaRegistro).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                contenido: bitacora.contenido,
                estado: bitacora.estado || 'pendiente',
                fechaAprobacion: bitacora.fechaAprobacion ? new Date(bitacora.fechaAprobacion).toLocaleDateString('es-ES') : null,
                comentariosInstructor: bitacora.comentariosInstructor || ''
            }));
            
            res.json({
                success: true,
                bitacoras: bitacoras,
                total: bitacoras.length
            });
            
        } catch (error) {
            console.error('Error al obtener bitácoras del aprendiz:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener las bitácoras del aprendiz',
                error: error.message
            });
        }
    },

    // --- FUNCIÓN PARA OBTENER DOCUMENTOS DE UN APRENDIZ ---
    async obtenerDocumentosAprendiz(req, res) {
        try {
            const numeroDocumento = req.params.id;

            // Definir todos los tipos de documentos requeridos (basado en gestionDocumentos.ejs)
            const tiposDocumentosRequeridos = [
                'Bitácora 1',
                'Bitácora 2',
                'Bitácora 3',
                'Bitácora 4',
                'Bitácora 5',
                'Bitácora 6',
                'Bitácora 7',
                'Bitácora 8',
                'Bitácora 9',
                'Bitácora 10',
                'Bitácora 11',
                'Bitácora 12',
                'Propuesta de intervención',
                'Diagnóstico',
                'GFPI-F-023 V5'
            ];

            // Primero obtener información del aprendiz
            const consultaAprendiz = `
                SELECT 
                    id,
                    nombres,
                    primerApellido,
                    segundoApellido,
                    tipoDocumento,
                    numeroDocumento,
                    programaFormacion,
                    correoElectronico
                FROM aprendices 
                WHERE numeroDocumento = ?
            `;

            const [aprendizResult] = await pool.execute(consultaAprendiz, [numeroDocumento]);
            
            if (aprendizResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Aprendiz no encontrado'
                });
            }

            const aprendiz = aprendizResult[0];

            // Obtener documentos subidos del aprendiz usando el ID del aprendiz
            const consultaDocumentosSubidos = `
                SELECT 
                    id,
                    tipo_documento as tipoDocumento,
                    descripcion,
                    nombre_original as nombreOriginal,
                    nombre_guardado as nombreGuardado,
                    fecha_subida as fechaSubida,
                    tamano_bytes as tamanoBytes,
                    tipo_mime as tipoMime
                FROM documentos_aprendiz 
                WHERE aprendiz_id = ? AND activo = 1
                ORDER BY fecha_subida DESC
            `;

            const [documentosSubidos] = await pool.execute(consultaDocumentosSubidos, [aprendiz.id]);

            // Obtener tipos de documentos ya subidos
            const tiposSubidos = documentosSubidos.map(doc => doc.tipoDocumento);

            // Determinar documentos pendientes
            const documentosPendientes = tiposDocumentosRequeridos
                .filter(tipo => !tiposSubidos.includes(tipo))
                .map(tipo => ({
                    nombre: tipo,
                    tipo: tipo
                }));

            // Formatear respuesta
            const respuesta = {
                success: true,
                aprendiz: {
                    nombres: aprendiz.nombres,
                    primerApellido: aprendiz.primerApellido,
                    segundoApellido: aprendiz.segundoApellido,
                    tipoDocumento: aprendiz.tipoDocumento,
                    numeroDocumento: aprendiz.numeroDocumento,
                    programaFormacion: aprendiz.programaFormacion,
                    correoElectronico: aprendiz.correoElectronico
                },
                subidos: documentosSubidos.map(doc => ({
                    id: doc.id,
                    tipoDocumento: doc.tipoDocumento,
                    descripcion: doc.descripcion,
                    nombreOriginal: doc.nombreOriginal,
                    nombreGuardado: doc.nombreGuardado,
                    fechaSubida: doc.fechaSubida,
                    tamanoBytes: doc.tamanoBytes,
                    tipoMime: doc.tipoMime
                })),
                pendientes: documentosPendientes,
                total: {
                    subidos: documentosSubidos.length,
                    pendientes: documentosPendientes.length,
                    total: tiposDocumentosRequeridos.length
                }
            };

            res.json(respuesta);

        } catch (error) {
            console.error('Error al obtener documentos del aprendiz:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los documentos del aprendiz',
                error: error.message
            });
        }
    }
};

module.exports = gestionAprendicesControlador;
