// src/modulos/administrador/controladores/gestionAprendicesControlador.js
// Propósito: Controlador para la gestión de aprendices - maneja requests HTTP y responses

const { pool } = require('../../../configuracion/baseDatos');
const ServicioWatsonSentimientos = require('../servicios/servicioWatsonSentimientos');
const servicioAlertas = require('../../../compartido/servicios/servicioAlertas');
const ServicioGestionAprendices = require('../servicios/servicioGestionAprendices');
const servicioGestionAprendices = new ServicioGestionAprendices();
const { logger } = require('../../../compartido/utilidades/logger');
const ExcelJS = require('exceljs');
const servicioCorreo = require('../../../compartido/servicios/servicioCorreo');
const opcionesFormularioServicio = require('../../../compartido/servicios/opcionesFormularioServicio');
const { USE_AZURE_BLOB } = require('../../../compartido/middlewares/multerConfig');
const { generateSasUrl } = require('../../../configuracion/azureBlobConfig');

// Crear una instancia del servicio de análisis de sentimientos con Watson
const servicioAnalisisSentimientos = new ServicioWatsonSentimientos();


const gestionAprendicesControlador = {

    // --- NUEVA FUNCIÓN PARA EL PANEL PRINCIPAL ---
    async mostrarPanelPrincipal(req, res) {
        try {
            // Obtener alertas para el administrador
            const alertas = await servicioAlertas.obtenerAlertasAdministrador();

            // Obtener el nombre completo actual del administrador desde la BD
            const [adminResult] = await pool.query(
                'SELECT nombreCompleto FROM administradores WHERE id = ?',
                [req.session.userId]
            );

            const nombreCompleto = adminResult.length > 0 ? adminResult[0].nombreCompleto : 'Administrador';

            res.render('administrador/panelPrincipal', {
                title: 'Panel del Administrador',
                userRole: 'admin',
                alertas: alertas,
                userName: nombreCompleto,
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
            // Obtener filtros desde query parameters
            const filtros = {};
            if (req.query.mes && req.query.anio) {
                filtros.mes = parseInt(req.query.mes);
                filtros.anio = parseInt(req.query.anio);
            }
            if (req.query.programa) {
                filtros.programa = req.query.programa;
            }
            if (req.query.estado) {
                filtros.estado = req.query.estado;
            }
            if (req.query.alternativa) {
                filtros.alternativa = req.query.alternativa;
            }

            const datosReportes = await servicioGestionAprendices.obtenerDatosReportes(filtros);

            logger.debug('Datos completos para reportes obtenidos', {
                programas: datosReportes.datosProgramas.labels.length,
                estados: datosReportes.datosEstados.labels.length,
                alternativas: datosReportes.datosAlternativas.labels.length,
                documentos: datosReportes.datosDocumentos.labels.length,
                seguimiento: datosReportes.datosSeguimiento.labels.length,
                departamentos: datosReportes.datosDepartamentos.labels.length,
                filtrosAplicados: filtros
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
                estadisticasGenerales: datosReportes.estadisticasGenerales,
                mes: filtros.mes,
                anio: filtros.anio,
                programa: filtros.programa,
                estado: filtros.estado,
                alternativa: filtros.alternativa
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
            const clientIP = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('User-Agent') || 'Unknown';

            logger.info('Solicitud DataTables recibida', {
                ip: clientIP,
                userAgent: userAgent.substring(0, 100), // Limitar longitud
                userId: req.session?.userId,
                userRole: req.session?.userRole,
                options: {
                    draw: options.draw,
                    start: options.start,
                    length: options.length,
                    search: options.search?.value,
                    order: options.order,
                    hasFilters: !!(options.nombre || options.documento || options.programaFormacion || options.estadoFormacion)
                }
            });

            const result = await servicioGestionAprendices.obtenerDatosAprendices(options);

            logger.info('Respuesta DataTables enviada', {
                ip: clientIP,
                recordsTotal: result.recordsTotal,
                recordsFiltered: result.recordsFiltered,
                dataLength: result.data?.length,
                draw: result.draw,
                duration: Date.now() - (req.startTime || Date.now())
            });

            res.json(result);
        } catch (error) {
            logger.error('Error al obtener datos de aprendices:', {
                error: error.message,
                stack: error.stack,
                ip: req.ip,
                userId: req.session?.userId,
                options: req.body
            });
            res.status(500).json({
                error: 'Error interno del servidor.',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
            });
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

            // Normalizar datos del aprendiz para mostrar uniformemente
            const aprendizNormalizado = servicioGestionAprendices.normalizarAprendiz(aprendizResult[0]);

            res.render('administrador/verBitacorasAprendiz', {
                title: 'Bitácoras del Aprendiz',
                userRole: 'admin',
                layout: 'plantillas/principal',
                aprendiz: aprendizNormalizado,
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
            
            // Obtener documentos del aprendiz con su retroalimentación más reciente
            const [documentosResult] = await pool.query(`
                SELECT
                    d.*,
                    n.retroalimentacion
                FROM documentos_aprendiz d
                LEFT JOIN (
                    SELECT
                        referencia_id,
                        retroalimentacion,
                        ROW_NUMBER() OVER (PARTITION BY referencia_id ORDER BY fecha_creacion DESC) as rn
                    FROM notificaciones
                    WHERE referencia_tipo = 'documento' AND retroalimentacion IS NOT NULL AND retroalimentacion != ''
                ) n ON d.id = n.referencia_id AND n.rn = 1
                WHERE d.aprendiz_id = ?
                ORDER BY d.fecha_subida DESC
            `, [id]);
            
            // Normalizar datos del aprendiz para mostrar uniformemente
            const aprendizNormalizado = servicioGestionAprendices.normalizarAprendiz(aprendizResult[0]);

            // Generar SAS URLs para documentos si se usa Azure Blob Storage
            if (USE_AZURE_BLOB && documentosResult.length > 0) {
                for (const doc of documentosResult) {
                    const path = doc.rutaArchivo || doc.nombreGuardado;
                    // Limpiar slash inicial si existe y asegurar que no sea una URL completa
                    if (path && !path.startsWith('http')) {
                        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
                        try {
                            // Generar URL con firma de acceso compartido (SAS) válida por 60 minutos
                            doc.sasUrl = await generateSasUrl(cleanPath, 'r', 60);
                        } catch (error) {
                            console.error(`Error generando SAS URL para documento ${doc.id}:`, error);
                        }
                    }
                }
            }

            res.render('administrador/verificarDocumentacion', {
                title: 'Verificar Documentación',
                userRole: 'admin',
                layout: 'plantillas/principal',
                aprendiz: aprendizNormalizado,
                documentos: documentosResult,
                useAzure: USE_AZURE_BLOB,
                azureAccountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
                azureContainerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'documentos'
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

            // NO normalizar para el formulario de edición
            // Los valores deben coincidir con las opciones del formulario (camelCase)
            const aprendiz = aprendizResult[0];

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
                aprendiz: aprendiz,
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
            
            // Normalizar datos del aprendiz para mostrar uniformemente
            const aprendizNormalizado = servicioGestionAprendices.normalizarAprendiz(aprendizResult[0]);
            
            res.render('administrador/verAprendiz', {
                title: 'Ver Aprendiz',
                userRole: 'admin',
                layout: 'plantillas/principal',
                aprendiz: aprendizNormalizado,
                userName: req.session?.userName || 'Administrador'
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
                'GFPI-F-023 V5',
                'Informe final',
                'Carta de finalización o satisfacción',
                'Documento de identidad'
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

            const aprendiz = servicioGestionAprendices.normalizarAprendiz(aprendizResult[0]);

            // Obtener documentos subidos del aprendiz usando el ID del aprendiz
            const consultaDocumentosSubidos = `
                SELECT 
                    id,
                    tipo_documento as tipoDocumento,
                    descripcion,
                    nombre_original as nombreOriginal,
                    nombre_guardado as nombreGuardado,
                    ruta_archivo as rutaArchivo,
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

            // Configuración de Azure
            const azureAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
            const azureContainerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'documentos';

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
                subidos: await Promise.all(documentosSubidos.map(async doc => {
                    let fileUrl;
                    if (USE_AZURE_BLOB) {
                        if (doc.rutaArchivo && (doc.rutaArchivo.startsWith('http://') || doc.rutaArchivo.startsWith('https://'))) {
                            fileUrl = doc.rutaArchivo;
                        } else {
                            const path = doc.rutaArchivo || doc.nombreGuardado;
                            const cleanPath = path && path.startsWith('/') ? path.substring(1) : path;
                            if (cleanPath) {
                                try {
                                    fileUrl = await generateSasUrl(cleanPath);
                                } catch (e) {
                                    console.error('Error generando SAS URL:', e);
                                    fileUrl = '#';
                                }
                            } else {
                                fileUrl = '#';
                            }
                        }
                    } else {
                        fileUrl = doc.rutaArchivo || `/uploads/documentos/${doc.nombreGuardado}`;
                    }

                    return {
                        id: doc.id,
                        tipoDocumento: doc.tipoDocumento,
                        descripcion: doc.descripcion,
                        nombreOriginal: doc.nombreOriginal,
                        nombreGuardado: doc.nombreGuardado,
                        url: fileUrl,
                        fechaSubida: doc.fechaSubida,
                        tamanoBytes: doc.tamanoBytes,
                        tipoMime: doc.tipoMime
                    };
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
    },

    // --- FUNCIONES DE EXPORTACIÓN DE REPORTES ---

    async exportarProgramasExcel(req, res) {
        try {
            // Obtener filtros desde query parameters
            const filtros = {};
            if (req.query.mes && req.query.anio) {
                filtros.mes = parseInt(req.query.mes);
                filtros.anio = parseInt(req.query.anio);
            }
            if (req.query.programa) {
                filtros.programa = req.query.programa;
            }
            if (req.query.estado) {
                filtros.estado = req.query.estado;
            }
            if (req.query.alternativa) {
                filtros.alternativa = req.query.alternativa;
            }

            const datosReportes = await servicioGestionAprendices.obtenerDatosReportes(filtros);

            // Calcular total para porcentajes
            const total = datosReportes.datosProgramas.data.reduce((sum, val) => sum + val, 0);

            // Crear datos para Excel con porcentaje
            const datos = datosReportes.datosProgramas.labels.map((label, index) => {
                const cantidad = datosReportes.datosProgramas.data[index];
                const porcentaje = total > 0 ? ((cantidad / total) * 100).toFixed(1) : 0;
                return {
                    'Programa de Formación': label,
                    'Cantidad de Aprendices': cantidad,
                    'Porcentaje (%)': porcentaje
                };
            });

            // Crear libro de Excel
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Programas');

            // Definir columnas basadas en las claves del primer objeto
            if (datos.length > 0) {
                const columns = Object.keys(datos[0]).map(key => ({ header: key, key }));
                worksheet.columns = columns;
                worksheet.addRows(datos);
            }

            // Configurar headers para descarga
            const fechaFiltro = filtros.mes && filtros.anio ? `${filtros.anio}_${filtros.mes.toString().padStart(2, '0')}_` : '';
            const nombreArchivo = `reporte_programas_${fechaFiltro}${new Date().toISOString().split('T')[0]}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);

            // Enviar archivo
            const buffer = await workbook.xlsx.writeBuffer();
            res.send(buffer);

        } catch (error) {
            logger.error('Error al exportar programas a Excel:', error);
            res.status(500).json({ error: 'Error al generar el archivo Excel' });
        }
    },

    async exportarEstadosExcel(req, res) {
        try {
            // Obtener filtros desde query parameters
            const filtros = {};
            if (req.query.mes && req.query.anio) {
                filtros.mes = parseInt(req.query.mes);
                filtros.anio = parseInt(req.query.anio);
            }
            if (req.query.programa) {
                filtros.programa = req.query.programa;
            }
            if (req.query.estado) {
                filtros.estado = req.query.estado;
            }
            if (req.query.alternativa) {
                filtros.alternativa = req.query.alternativa;
            }

            const datosReportes = await servicioGestionAprendices.obtenerDatosReportes(filtros);

            // Calcular total para porcentajes
            const total = datosReportes.datosEstados.data.reduce((sum, val) => sum + val, 0);

            // Crear datos para Excel con porcentaje
            const datos = datosReportes.datosEstados.labels.map((label, index) => {
                const cantidad = datosReportes.datosEstados.data[index];
                const porcentaje = total > 0 ? ((cantidad / total) * 100).toFixed(1) : 0;
                return {
                    'Estado de Formación': label,
                    'Cantidad de Aprendices': cantidad,
                    'Porcentaje (%)': porcentaje
                };
            });

            // Crear libro de Excel
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Estados');

            // Definir columnas basadas en las claves del primer objeto
            if (datos.length > 0) {
                const columns = Object.keys(datos[0]).map(key => ({ header: key, key }));
                worksheet.columns = columns;
                worksheet.addRows(datos);
            }

            // Configurar headers para descarga
            const nombreArchivo = `reporte_estados_${new Date().toISOString().split('T')[0]}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);

            // Enviar archivo
            const buffer = await workbook.xlsx.writeBuffer();
            res.send(buffer);

        } catch (error) {
            logger.error('Error al exportar estados a Excel:', error);
            res.status(500).json({ error: 'Error al generar el archivo Excel' });
        }
    },

    async exportarAlternativasExcel(req, res) {
        try {
            // Obtener filtros desde query parameters
            const filtros = {};
            if (req.query.mes && req.query.anio) {
                filtros.mes = parseInt(req.query.mes);
                filtros.anio = parseInt(req.query.anio);
            }
            if (req.query.programa) {
                filtros.programa = req.query.programa;
            }
            if (req.query.estado) {
                filtros.estado = req.query.estado;
            }
            if (req.query.alternativa) {
                filtros.alternativa = req.query.alternativa;
            }

            const datosReportes = await servicioGestionAprendices.obtenerDatosReportes(filtros);

            // Calcular total para porcentajes
            const total = datosReportes.datosAlternativas.data.reduce((sum, val) => sum + val, 0);

            // Crear datos para Excel con porcentaje
            const datos = datosReportes.datosAlternativas.labels.map((label, index) => {
                const cantidad = datosReportes.datosAlternativas.data[index];
                const porcentaje = total > 0 ? ((cantidad / total) * 100).toFixed(1) : 0;
                return {
                    'Alternativa de Etapa Productiva': label,
                    'Cantidad de Aprendices': cantidad,
                    'Porcentaje (%)': porcentaje
                };
            });

            // Crear libro de Excel
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Alternativas');

            // Definir columnas basadas en las claves del primer objeto
            if (datos.length > 0) {
                const columns = Object.keys(datos[0]).map(key => ({ header: key, key }));
                worksheet.columns = columns;
                worksheet.addRows(datos);
            }

            // Configurar headers para descarga
            const nombreArchivo = `reporte_alternativas_${new Date().toISOString().split('T')[0]}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);

            // Enviar archivo
            const buffer = await workbook.xlsx.writeBuffer();
            res.send(buffer);

        } catch (error) {
            logger.error('Error al exportar alternativas a Excel:', error);
            res.status(500).json({ error: 'Error al generar el archivo Excel' });
        }
    },

    async exportarDocumentosExcel(req, res) {
        try {
            // Obtener filtros desde query parameters
            const filtros = {};
            if (req.query.mes && req.query.anio) {
                filtros.mes = parseInt(req.query.mes);
                filtros.anio = parseInt(req.query.anio);
            }
            if (req.query.programa) {
                filtros.programa = req.query.programa;
            }
            if (req.query.estado) {
                filtros.estado = req.query.estado;
            }
            if (req.query.alternativa) {
                filtros.alternativa = req.query.alternativa;
            }

            const datosReportes = await servicioGestionAprendices.obtenerDatosReportes(filtros);

            // Calcular total para porcentajes
            const total = datosReportes.datosDocumentos.data.reduce((sum, val) => sum + val, 0);

            // Crear datos para Excel con porcentaje
            const datos = datosReportes.datosDocumentos.labels.map((label, index) => {
                const cantidad = datosReportes.datosDocumentos.data[index];
                const porcentaje = total > 0 ? ((cantidad / total) * 100).toFixed(1) : 0;
                return {
                    'Estado de Documentos': label,
                    'Cantidad de Aprendices': cantidad,
                    'Porcentaje (%)': porcentaje
                };
            });

            // Crear libro de Excel
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Documentos');

            // Definir columnas basadas en las claves del primer objeto
            if (datos.length > 0) {
                const columns = Object.keys(datos[0]).map(key => ({ header: key, key }));
                worksheet.columns = columns;
                worksheet.addRows(datos);
            }

            // Configurar headers para descarga
            const nombreArchivo = `reporte_documentos_${new Date().toISOString().split('T')[0]}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);

            // Enviar archivo
            const buffer = await workbook.xlsx.writeBuffer();
            res.send(buffer);

        } catch (error) {
            logger.error('Error al exportar documentos a Excel:', error);
            res.status(500).json({ error: 'Error al generar el archivo Excel' });
        }
    },

    async exportarSeguimientoExcel(req, res) {
        try {
            // Obtener filtros desde query parameters
            const filtros = {};
            if (req.query.mes && req.query.anio) {
                filtros.mes = parseInt(req.query.mes);
                filtros.anio = parseInt(req.query.anio);
            }
            if (req.query.programa) {
                filtros.programa = req.query.programa;
            }
            if (req.query.estado) {
                filtros.estado = req.query.estado;
            }
            if (req.query.alternativa) {
                filtros.alternativa = req.query.alternativa;
            }

            const datosReportes = await servicioGestionAprendices.obtenerDatosReportes(filtros);

            // Calcular total para porcentajes
            const total = datosReportes.datosSeguimiento.data.reduce((sum, val) => sum + val, 0);

            // Crear datos para Excel con porcentaje
            const datos = datosReportes.datosSeguimiento.labels.map((label, index) => {
                const cantidad = datosReportes.datosSeguimiento.data[index];
                const porcentaje = total > 0 ? ((cantidad / total) * 100).toFixed(1) : 0;
                return {
                    'Estado de Seguimiento': label,
                    'Cantidad de Aprendices': cantidad,
                    'Porcentaje (%)': porcentaje
                };
            });

            // Crear libro de Excel
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Seguimiento');

            // Definir columnas basadas en las claves del primer objeto
            if (datos.length > 0) {
                const columns = Object.keys(datos[0]).map(key => ({ header: key, key }));
                worksheet.columns = columns;
                worksheet.addRows(datos);
            }

            // Configurar headers para descarga
            const nombreArchivo = `reporte_seguimiento_${new Date().toISOString().split('T')[0]}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);

            // Enviar archivo
            const buffer = await workbook.xlsx.writeBuffer();
            res.send(buffer);

        } catch (error) {
            logger.error('Error al exportar seguimiento a Excel:', error);
            res.status(500).json({ error: 'Error al generar el archivo Excel' });
        }
    },

    async exportarReporteCompletoExcel(req, res) {
        try {
            // Obtener filtros desde query parameters
            const filtros = {};
            if (req.query.mes && req.query.anio) {
                filtros.mes = parseInt(req.query.mes);
                filtros.anio = parseInt(req.query.anio);
            }
            if (req.query.programa) {
                filtros.programa = req.query.programa;
            }
            if (req.query.estado) {
                filtros.estado = req.query.estado;
            }
            if (req.query.alternativa) {
                filtros.alternativa = req.query.alternativa;
            }

            const datosReportes = await servicioGestionAprendices.obtenerDatosReportes(filtros);

            // Crear libro de Excel con múltiples hojas
            const workbook = new ExcelJS.Workbook();

            // Función auxiliar para calcular porcentajes
            const calcularDatosConPorcentaje = (labels, data, nombreCampo) => {
                const total = data.reduce((sum, val) => sum + val, 0);
                return labels.map((label, index) => {
                    const cantidad = data[index];
                    const porcentaje = total > 0 ? ((cantidad / total) * 100).toFixed(1) : 0;
                    return {
                        [nombreCampo]: label,
                        'Cantidad de Aprendices': cantidad,
                        'Porcentaje (%)': porcentaje
                    };
                });
            };

            // Hoja 1: Programas
            const datosProgramas = calcularDatosConPorcentaje(
                datosReportes.datosProgramas.labels,
                datosReportes.datosProgramas.data,
                'Programa de Formación'
            );
            const wsProgramas = workbook.addWorksheet('Programas');
            if (datosProgramas.length > 0) {
                const columns = Object.keys(datosProgramas[0]).map(key => ({ header: key, key }));
                wsProgramas.columns = columns;
                wsProgramas.addRows(datosProgramas);
            }

            // Hoja 2: Estados
            const datosEstados = calcularDatosConPorcentaje(
                datosReportes.datosEstados.labels,
                datosReportes.datosEstados.data,
                'Estado de Formación'
            );
            const wsEstados = workbook.addWorksheet('Estados');
            if (datosEstados.length > 0) {
                const columns = Object.keys(datosEstados[0]).map(key => ({ header: key, key }));
                wsEstados.columns = columns;
                wsEstados.addRows(datosEstados);
            }

            // Hoja 3: Alternativas
            const datosAlternativas = calcularDatosConPorcentaje(
                datosReportes.datosAlternativas.labels,
                datosReportes.datosAlternativas.data,
                'Alternativa de Etapa Productiva'
            );
            const wsAlternativas = workbook.addWorksheet('Alternativas');
            if (datosAlternativas.length > 0) {
                const columns = Object.keys(datosAlternativas[0]).map(key => ({ header: key, key }));
                wsAlternativas.columns = columns;
                wsAlternativas.addRows(datosAlternativas);
            }

            // Hoja 4: Documentos
            const datosDocumentos = calcularDatosConPorcentaje(
                datosReportes.datosDocumentos.labels,
                datosReportes.datosDocumentos.data,
                'Estado de Documentos'
            );
            const wsDocumentos = workbook.addWorksheet('Documentos');
            if (datosDocumentos.length > 0) {
                const columns = Object.keys(datosDocumentos[0]).map(key => ({ header: key, key }));
                wsDocumentos.columns = columns;
                wsDocumentos.addRows(datosDocumentos);
            }

            // Hoja 5: Seguimiento
            const datosSeguimiento = calcularDatosConPorcentaje(
                datosReportes.datosSeguimiento.labels,
                datosReportes.datosSeguimiento.data,
                'Estado de Seguimiento'
            );
            const wsSeguimiento = workbook.addWorksheet('Seguimiento');
            if (datosSeguimiento.length > 0) {
                const columns = Object.keys(datosSeguimiento[0]).map(key => ({ header: key, key }));
                wsSeguimiento.columns = columns;
                wsSeguimiento.addRows(datosSeguimiento);
            }

            // Hoja 6: Departamentos
            const datosDepartamentos = calcularDatosConPorcentaje(
                datosReportes.datosDepartamentos.labels,
                datosReportes.datosDepartamentos.data,
                'Departamento'
            );
            const wsDepartamentos = workbook.addWorksheet('Departamentos');
            if (datosDepartamentos.length > 0) {
                const columns = Object.keys(datosDepartamentos[0]).map(key => ({ header: key, key }));
                wsDepartamentos.columns = columns;
                wsDepartamentos.addRows(datosDepartamentos);
            }

            // Hoja 7: KPIs Generales
            const datosKPIs = [{
                'Métrica': 'Total de Aprendices',
                'Valor': datosReportes.estadisticasGenerales.total_aprendices
            }, {
                'Métrica': 'Aprendices Activos',
                'Valor': datosReportes.estadisticasGenerales.activos
            }, {
                'Métrica': 'Aprendices Inactivos',
                'Valor': datosReportes.estadisticasGenerales.inactivos
            }, {
                'Métrica': 'Aprendices Aplazados',
                'Valor': datosReportes.estadisticasGenerales.aplazados
            }, {
                'Métrica': 'Aprendices Retirados',
                'Valor': datosReportes.estadisticasGenerales.retirados
            }, {
                'Métrica': 'Aprendices Certificados',
                'Valor': datosReportes.estadisticasGenerales.certificados || 0
            }, {
                'Métrica': 'Aprendices por Certificar',
                'Valor': datosReportes.estadisticasGenerales.por_certificar || 0
            }];
            const wsKPIs = workbook.addWorksheet('KPIs');
            if (datosKPIs.length > 0) {
                const columns = Object.keys(datosKPIs[0]).map(key => ({ header: key, key }));
                wsKPIs.columns = columns;
                wsKPIs.addRows(datosKPIs);
            }

            // Configurar headers para descarga
            const nombreArchivo = `reporte_completo_${new Date().toISOString().split('T')[0]}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);

            // Enviar archivo
            const buffer = await workbook.xlsx.writeBuffer();
            res.send(buffer);

        } catch (error) {
            logger.error('Error al exportar reporte completo a Excel:', error);
            res.status(500).json({ error: 'Error al generar el archivo Excel' });
        }
    },

    /**
     * Aprobar un documento
     */
    async aprobarDocumento(req, res) {
        try {
            const documentoId = req.params.id;
            const adminId = req.session.userId;
            const { retroalimentacion, enviarEmail } = req.body || {};
            const archivoAdjunto = req.file; // Archivo subido con multer

            logger.info('Intentando aprobar documento', {
                documentoId,
                adminId,
                tieneArchivo: !!archivoAdjunto,
                archivoAdjunto: archivoAdjunto ? {
                    filename: archivoAdjunto.filename,
                    originalname: archivoAdjunto.originalname,
                    size: archivoAdjunto.size,
                    path: archivoAdjunto.path
                } : null,
                reqBody: req.body,
                reqFile: req.file
            });

            // Obtener información del documento y del aprendiz
            const [documentoInfo] = await pool.query(`
                SELECT 
                    d.aprendiz_id,
                    d.tipo_documento,
                    d.estado as estado_actual,
                    a.correoElectronico,
                    a.nombres,
                    a.primerApellido,
                    a.segundoApellido
                FROM documentos_aprendiz d
                INNER JOIN aprendices a ON d.aprendiz_id = a.id
                WHERE d.id = ?
            `, [documentoId]);

            if (documentoInfo.length === 0) {
                return res.status(404).json({ success: false, message: 'Documento no encontrado' });
            }

            const { aprendiz_id, tipo_documento, estado_actual, correoElectronico, nombres, primerApellido, segundoApellido } = documentoInfo[0];

            // Actualizar el documento (sin retroalimentacion, esa va en la notificación)
            const query = `
                UPDATE documentos_aprendiz
                SET estado = 'aprobado',
                    fecha_revision = NOW(),
                    revisado_por = ?
                WHERE id = ?
            `;
            const params = [adminId, documentoId];

            await pool.query(query, params);

            // Crear notificación SIEMPRE al aprobar
            const notificacionesService = require('../../../compartido/servicios/notificacionesService');
            
            let mensajeNotificacion;
            if (retroalimentacion && retroalimentacion.trim()) {
                mensajeNotificacion = `El documento "${tipo_documento}" ha sido aprobado. Tu tutor(a) te dejó un comentario.`;
            } else if (estado_actual === 'aprobado') {
                mensajeNotificacion = `El documento "${tipo_documento}" fue aprobado nuevamente.`;
            } else {
                mensajeNotificacion = `El documento "${tipo_documento}" ha sido aprobado correctamente.`;
            }

            await notificacionesService.crearNotificacion({
                usuarioId: aprendiz_id,
                tipo: 'documento_aprobado',
                titulo: `Documento aprobado: ${tipo_documento}`,
                mensaje: mensajeNotificacion,
                referenciaId: documentoId,
                referenciaTipo: 'documento',
                retroalimentacion: retroalimentacion && retroalimentacion.trim() ? retroalimentacion : null,
                archivoAdjunto: archivoAdjunto ? `/uploads/adjuntos/${archivoAdjunto.filename}` : null
            });

            // Enviar email si está habilitado
            if (enviarEmail === 'true' || enviarEmail === true) {
                try {
                    const nombreCompleto = `${nombres} ${primerApellido} ${segundoApellido || ''}`.trim();
                    const resultadoEmail = await servicioCorreo.enviarCorreoDocumentoAprobado({
                        correoAprendiz: correoElectronico,
                        nombreAprendiz: nombreCompleto,
                        tipoDocumento: tipo_documento,
                        retroalimentacion: retroalimentacion && retroalimentacion.trim() ? retroalimentacion : null,
                        esReaprobacion: estado_actual === 'aprobado'
                    });

                    if (resultadoEmail.success) {
                        logger.info('Email de aprobación enviado exitosamente', { 
                            email: correoElectronico,
                            aprendiz: nombreCompleto,
                            documento: tipo_documento,
                            messageId: resultadoEmail.messageId
                        });
                    } else {
                        logger.warn('No se pudo enviar email de aprobación', {
                            email: correoElectronico,
                            error: resultadoEmail.error
                        });
                    }
                } catch (errorEmail) {
                    logger.error('Error al enviar email de aprobación:', errorEmail);
                    // No fallar la operación si el email falla
                }
            }

            logger.info('Documento aprobado', { 
                documentoId, 
                adminId, 
                aprendiz_id,
                conRetroalimentacion: !!retroalimentacion,
                esReaprobacion: estado_actual === 'aprobado',
                emailEnviado: !!enviarEmail
            });

            res.json({ success: true, message: 'Documento aprobado correctamente' });
        } catch (error) {
            logger.error('Error al aprobar documento:', error);
            res.status(500).json({ success: false, message: 'Error al aprobar el documento' });
        }
    },

    /**
     * Rechazar un documento con retroalimentación
     */
    async rechazarDocumento(req, res) {
        try {
            const documentoId = req.params.id;
            const adminId = req.session.userId;
            const { retroalimentacion, enviarEmail } = req.body;

            // Obtener información del documento y del aprendiz
            const [documentoInfo] = await pool.query(`
                SELECT 
                    d.aprendiz_id,
                    d.tipo_documento,
                    d.estado as estado_actual,
                    a.correoElectronico,
                    a.nombres,
                    a.primerApellido,
                    a.segundoApellido
                FROM documentos_aprendiz d
                INNER JOIN aprendices a ON d.aprendiz_id = a.id
                WHERE d.id = ?
            `, [documentoId]);

            if (documentoInfo.length === 0) {
                return res.status(404).json({ success: false, message: 'Documento no encontrado' });
            }

            const { aprendiz_id, tipo_documento, estado_actual, correoElectronico, nombres, primerApellido, segundoApellido } = documentoInfo[0];

            // Actualizar el documento (sin retroalimentacion, esa va en la notificación)
            const query = `
                UPDATE documentos_aprendiz
                SET estado = 'rechazado',
                    fecha_revision = NOW(),
                    revisado_por = ?
                WHERE id = ?
            `;

            await pool.query(query, [adminId, documentoId]);

            // Crear notificación SIEMPRE que se rechace un documento
            // Esto asegura que el aprendiz reciba notificación incluso si es un re-rechazo
            const notificacionesService = require('../../../compartido/servicios/notificacionesService');
            
            const mensajeNotificacion = estado_actual === 'rechazado' 
                ? `El documento "${tipo_documento}" fue rechazado nuevamente. Revisa la nueva retroalimentación hecha por el tutor(a) para que lo corrijas y lo envíes nuevamente.`
                : `El documento "${tipo_documento}" no fue aprobado. Revisa la retroalimentación hecha por el tutor(a) para que lo corrijas y lo envíes nuevamente.`;

            await notificacionesService.crearNotificacion({
                usuarioId: aprendiz_id,
                tipo: 'documento_rechazado',
                titulo: `Documento rechazado: ${tipo_documento}`,
                mensaje: mensajeNotificacion,
                referenciaId: documentoId,
                referenciaTipo: 'documento',
                retroalimentacion: retroalimentacion
            });

            // Enviar email si está habilitado
            if (enviarEmail === 'true' || enviarEmail === true) {
                try {
                    const nombreCompleto = `${nombres} ${primerApellido} ${segundoApellido || ''}`.trim();
                    const resultadoEmail = await servicioCorreo.enviarCorreoDocumentoRechazado({
                        correoAprendiz: correoElectronico,
                        nombreAprendiz: nombreCompleto,
                        tipoDocumento: tipo_documento,
                        retroalimentacion: retroalimentacion,
                        esRerechazo: estado_actual === 'rechazado'
                    });

                    if (resultadoEmail.success) {
                        logger.info('Email de rechazo enviado exitosamente', { 
                            email: correoElectronico,
                            aprendiz: nombreCompleto,
                            documento: tipo_documento,
                            messageId: resultadoEmail.messageId
                        });
                    } else {
                        logger.warn('No se pudo enviar email de rechazo', {
                            email: correoElectronico,
                            error: resultadoEmail.error
                        });
                    }
                } catch (errorEmail) {
                    logger.error('Error al enviar email de rechazo:', errorEmail);
                    // No fallar la operación si el email falla
                }
            }

            logger.info('Documento rechazado', { 
                documentoId, 
                adminId, 
                aprendiz_id,
                esRerechazo: estado_actual === 'rechazado',
                emailEnviado: !!enviarEmail
            });

            res.json({ success: true, message: 'Documento rechazado y aprendiz notificado' });
        } catch (error) {
            logger.error('Error al rechazar documento:', error);
            res.status(500).json({ success: false, message: 'Error al rechazar el documento' });
        }
    },

    /**
     * Obtener opciones para filtros dinámicos desde el servicio centralizado
     * Este endpoint proporciona las mismas opciones que aparecen en el formulario de registro
     * Garantiza una única fuente de verdad para todas las opciones del sistema
     *
     * @route GET /administrador/opciones-filtros
     * @returns {Object} JSON con todas las opciones de filtros
     */
    async obtenerOpcionesFiltros(req, res) {
        try {
            // Obtener todas las opciones del servicio centralizado
            const opciones = opcionesFormularioServicio.obtenerTodasLasOpciones();

            // Obtener lista de administradores activos para el filtro de instructores
            const [administradoresResult] = await pool.execute(`
                SELECT
                    id,
                    nombreCompleto as value,
                    nombreCompleto as label
                FROM administradores
                WHERE activo = TRUE
                ORDER BY nombreCompleto ASC
            `);

            const instructoresProductiva = administradoresResult.map(admin => ({
                value: admin.value,
                label: admin.label
            }));

            // Obtener lista de fichas únicas de administradores activos
            const [fichasResult] = await pool.execute(`
                SELECT DISTINCT
                    fichaGrupo as value,
                    fichaGrupo as label
                FROM administradores
                WHERE activo = TRUE AND fichaGrupo IS NOT NULL AND fichaGrupo != ''
                ORDER BY fichaGrupo ASC
            `);

            const fichas = fichasResult.map(ficha => ({
                value: ficha.value,
                label: ficha.label
            }));

            logger.info('✅ Opciones de filtros obtenidas del servicio centralizado', {
                programas: opciones.programaFormacion.length,
                alternativas: opciones.alternativaSeleccionada.length,
                tipoDocumento: opciones.tipoDocumento.length,
                eps: opciones.eps.length,
                genero: opciones.genero.length,
                instructores: instructoresProductiva.length,
                fichas: fichas.length
            });

            // Responder con las opciones en el formato esperado por el frontend
            res.json({
                success: true,
                data: {
                    programas: opciones.programaFormacion,
                    alternativas: opciones.alternativaSeleccionada,
                    tipoDocumento: opciones.tipoDocumento,
                    eps: opciones.eps,
                    genero: opciones.genero,
                    estadoFormacion: opciones.estadoFormacion,
                    areaFormacion: opciones.areaFormacion,
                    instructoresProductiva: instructoresProductiva,
                    fichas: fichas
                }
            });

        } catch (error) {
            logger.error('❌ Error al obtener opciones de filtros:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cargar las opciones de filtros',
                error: error.message
            });
        }
    }
};

module.exports = gestionAprendicesControlador;
