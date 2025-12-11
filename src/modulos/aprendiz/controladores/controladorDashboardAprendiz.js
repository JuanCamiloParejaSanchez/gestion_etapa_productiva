// src/modulos/aprendiz/controladores/controladorDashboardAprendiz.js
// Propósito: Maneja la lógica para el dashboard del aprendiz, su perfil y bitácoras.

const { pool } = require('../../../configuracion/baseDatos'); // Importamos el pool de la BD
const ServicioAprendiz = require('../servicios/servicioAprendiz');
const servicioAprendiz = new ServicioAprendiz();
const { formatearError } = require('../../../compartido/utilidades/utilRespuestas');
const BaseController = require('../../compartido/controladores/baseController');
const { aprendizSchemas } = require('../../../validaciones/esquemasValidacion');
const path = require('path');
const fs = require('fs');
const servicioDocumentosAprendiz = require('../servicios/servicioDocumentosAprendiz');
const multer = require('multer');
const archiver = require('archiver');
const ServicioWatsonSentimientos = require('../../administrador/servicios/servicioWatsonSentimientos');
// Importar la función decodeOriginalName
const { decodeOriginalName, normalizarNombreDocumento } = require('../../../compartido/middlewares/multerConfig');
const servicioAlertas = require('../../../compartido/servicios/servicioAlertas');
const servicioCorreo = require('../servicios/servicioCorreo');
const notificacionesService = require('../../../compartido/servicios/notificacionesService');
const opcionesFormularioServicio = require('../../../compartido/servicios/opcionesFormularioServicio');
const ServicioGestionAprendices = require('../../administrador/servicios/servicioGestionAprendices');
const servicioGestionAprendices = new ServicioGestionAprendices();
const gestionAdministradoresControlador = require('../../administrador/controladores/gestionAdministradoresControlador');
// Importar configuración de Azure Blob Storage
const { getUrl, deleteFile: deleteAzureFile, uploadFile, downloadFile, generateSasUrl } = require('../../../configuracion/azureBlobConfig');
const { USE_AZURE_BLOB } = require('../../../compartido/middlewares/multerConfig');

// Helper para procesar la URL de la foto
const procesarFotoPerfil = async (administrador) => {
    if (administrador.fotoPerfilPath) {
        // Si ya es una URL completa, no hacemos nada
        if (administrador.fotoPerfilPath.startsWith('http')) return;

        // Si es una ruta local (empieza con /), no hacemos nada
        if (administrador.fotoPerfilPath.startsWith('/')) return;

        // Si llegamos aquí, asumimos que es un blob path (ej: documentos/foto.jpg)
        // Verificamos si tenemos configuración de Azure
        if (process.env.AZURE_STORAGE_ACCOUNT_NAME) {
            try {
                const sasUrl = await generateSasUrl(administrador.fotoPerfilPath);
                administrador.fotoPerfilPath = sasUrl;
            } catch (sasError) {
                console.error('❌ Error generando SAS URL:', sasError);
            }
        }
    }
};

class ControladorDashboardAprendiz extends BaseController {

    async actualizarPerfil(req, res) {
        try {
            const aprendizId = req.session.userId;
            const datosActualizados = req.body;

            if (!aprendizId) {
                return res.status(401).json({ success: false, message: 'ID de usuario no encontrado en la sesión.' });
            }

            if (datosActualizados.id && datosActualizados.id != aprendizId) {
                return res.status(403).json({ success: false, message: 'Intento de actualizar un perfil no autorizado.' });
            }

            const camposNoEditables = ['id', 'password', 'rol', 'estadoFormacion', 'fechaRegistro', 'created_at'];
            camposNoEditables.forEach(field => delete datosActualizados[field]);

            // Campos de fecha que pueden ser null
            const camposFecha = ['fechaNacimiento', 'fechaInicioLectiva', 'fechaFinLectiva', 'fechaInicioProductiva', 'fechaFinProductiva'];
            camposFecha.forEach(campo => {
                if (datosActualizados[campo] === '') {
                    datosActualizados[campo] = null;
                }
            });

            // Campos opcionales de texto que pueden ser null si vienen vacíos
            const camposOpcionales = ['segundoApellido'];
            camposOpcionales.forEach(campo => {
                if (datosActualizados[campo] === '') {
                    datosActualizados[campo] = null;
                }
            });

            const camposRequeridos = [
                'nombres', 'primerApellido', 'tipoDocumento', 'numeroDocumento', 'fechaNacimiento', 'eps',
                'celular', 'direccion', 'barrio', 'departamento', 'municipio', 'correoElectronico',
                'fechaInicioLectiva', 'fechaFinLectiva', 'instructorLectiva', 'instructorProductiva', 'numeroFicha', 'programaFormacion',
                'alternativaSeleccionada', 'areaFormacion', 'fechaInicioProductiva', 'fechaFinProductiva', 'empresaPatrocinadora', 'areaPractica', 'jefeInmediato', 'celularEmpresa', 'direccionEmpresa', 'correoEmpresa', 'horario'
            ];
            for (const field of camposRequeridos) {
                const valor = datosActualizados[field];
                if (valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '')) {
                    return res.status(400).json({ success: false, message: `El campo '${field}' es requerido.` });
                }
            }

            // Procesar foto de perfil si se subió una nueva
            if (req.fotoPerfilProcesada) {
                console.log('📸 Nueva foto de perfil detectada');
                
                // Obtener datos actuales del aprendiz para eliminar foto anterior
                const aprendizActual = await servicioAprendiz.obtenerAprendizPorId(aprendizId);
                if (aprendizActual && aprendizActual.fotoPerfilPath) {
                    const { eliminarFotoAnterior } = require('../../../compartido/middlewares/multerConfigFotos');
                    // Si es Azure, deberíamos eliminar el blob también, pero eliminarFotoAnterior es para local
                    // TODO: Implementar eliminación en Azure si es necesario
                    await eliminarFotoAnterior(aprendizActual.fotoPerfilPath);
                }
                
                let fotoFilename = req.fotoPerfilProcesada.filename;
                let fotoPath = req.fotoPerfilProcesada.path;

                // Subir a Azure Blob Storage si está habilitado
                if (USE_AZURE_BLOB) {
                    try {
                        console.log('☁️ Subiendo foto de perfil optimizada a Azure Blob Storage...');
                        // La foto procesada está en disco local (fullPath)
                        if (req.fotoPerfilProcesada.fullPath && fs.existsSync(req.fotoPerfilProcesada.fullPath)) {
                            const buffer = fs.readFileSync(req.fotoPerfilProcesada.fullPath);
                            const azureResult = await uploadFile(buffer, req.fotoPerfilProcesada.originalname, 'documentos'); // Usamos 'documentos' o un contenedor específico para fotos
                            console.log('✅ Foto de perfil subida a Azure:', azureResult.blobName);
                            
                            fotoFilename = azureResult.blobName;
                            fotoPath = azureResult.blobName;
                        }
                    } catch (azureError) {
                        console.error('❌ Error subiendo foto de perfil a Azure:', azureError);
                    }
                }

                // Agregar datos de la nueva foto
                datosActualizados.fotoPerfil = fotoFilename;
                datosActualizados.fotoPerfilPath = fotoPath;
            }

            const resultado = await servicioAprendiz.actualizarAprendiz(aprendizId, datosActualizados);

            if (resultado.success) {
                res.status(200).json({ success: true, message: 'Perfil actualizado exitosamente.' });
            } else {
                res.status(500).json({ success: false, message: resultado.message || 'Error desconocido al actualizar el perfil.' });
            }
        } catch (error) {
            console.error('Error al actualizar el perfil del aprendiz:', error);
            res.status(500).json({
                success: false,
                message: 'No se pudo actualizar su perfil. Intente nuevamente.'
            });
        }
    }

    async mostrarFormularioEditarPerfil(req, res) {
        try {
            const aprendizId = req.session.userId;
            if (!aprendizId) {
                return res.status(401).render('compartido/paginaError', {
                    title: 'Error de Autenticación',
                    message: 'No se pudo encontrar el ID del usuario en la sesión. Por favor, inicie sesión nuevamente.',
                    layout: 'plantillas/principal'
                });
            }

            const aprendiz = await servicioAprendiz.obtenerAprendizPorId(aprendizId);
            if (!aprendiz) {
                return res.status(404).render('compartido/paginaError', {
                    title: 'Perfil no encontrado',
                    message: 'No se encontró información para su perfil.',
                    layout: 'plantillas/principal'
                });
            }

            const opciones = opcionesFormularioServicio.obtenerTodasLasOpciones();
            res.render('aprendiz/editarPerfilAprendiz', {
                title: 'Editar Mi Perfil - SENA',
                aprendiz: aprendiz,
                layout: 'plantillas/principal',
                opciones: opciones
            });
        } catch (error) {
            console.error('Error al cargar el formulario de edición del perfil del aprendiz:', error);
            res.status(500).render('compartido/paginaError', {
                title: 'Error',
                message: 'No se pudo cargar el formulario de edición de su perfil',
                error: formatearError(error),
                layout: 'plantillas/principal'
            });
        }
    }

    async mostrarDashboard(req, res) {
        try {
            const aprendizId = req.session.userId;
            console.log('=== INICIO DIAGNÓSTICO DASHBOARD ===');
            console.log('ID del aprendiz:', aprendizId);
            console.log('Sesión completa:', req.session);

            if (!aprendizId) {
                console.log('Error: No se encontró ID de aprendiz en la sesión');
                return res.status(401).render('compartido/paginaError', {
                    title: 'Error de Autenticación',
                    message: 'No se ha encontrado un ID de usuario en la sesión.',
                    layout: 'plantillas/principal'
                });
            }

            const aprendiz = await servicioAprendiz.obtenerAprendizPorId(aprendizId);
            console.log('Datos del aprendiz encontrados:', aprendiz ? 'Sí' : 'No');
            
            if (!aprendiz) {
                console.log('Error: No se encontró el aprendiz en la base de datos');
                return res.status(404).render('compartido/paginaError', {
                    title: 'Aprendiz no encontrado',
                    message: 'No se pudo encontrar el perfil del aprendiz.',
                    layout: 'plantillas/principal'
                });
            }

            // Obtener alertas del aprendiz
            const alertas = await servicioAlertas.obtenerAlertasAprendiz(aprendizId);

            // Enviar correo solo si hay alertas, ha pasado al menos una semana desde el último envío y es lunes
            let enviarCorreo = false;
            const ahora = new Date();
            const diaSemana = ahora.getDay(); // 0=domingo, 1=lunes, 2=martes, ..., 6=sábado
            /* const esLunes = diaSemana === 1; */
            const esLunes = false;
            const fechaUltimoCorreo = aprendiz.fechaUltimoCorreoAlerta;
            console.log('Fecha último correo en BD:', fechaUltimoCorreo);
            console.log('Día de la semana actual:', diaSemana, '(0=domingo, 1=lunes, etc.)');
            console.log('¿Es lunes?:', esLunes);

            if (!fechaUltimoCorreo) {
                // Si nunca se ha enviado correo, enviar solo si es lunes
                enviarCorreo = esLunes;
            } else {
                const ultima = new Date(fechaUltimoCorreo);
                const diferenciaDias = (ahora - ultima) / (1000 * 60 * 60 * 24);
                console.log('Días desde último correo:', diferenciaDias);
                // Enviar solo si han pasado al menos 6 días Y es lunes
                if (diferenciaDias >= 6 && esLunes) {
                    enviarCorreo = true;
                }
            }

            if (enviarCorreo && alertas && alertas.length > 0 && aprendiz.correoElectronico) {
                try {
                    // Preparar lista de destinatarios con información para personalizar mensajes
                    const destinatarios = [
                        {
                            email: aprendiz.correoElectronico,
                            esInstructor: false,
                            nombreAprendiz: `${aprendiz.nombres} ${aprendiz.primerApellido} ${aprendiz.segundoApellido || ''}`.trim()
                        }
                    ];

                    // Buscar correo del instructor productiva si está asignado
                    if (aprendiz.instructorProductiva) {
                        const [instructorResult] = await pool.query(
                            'SELECT correoInstitucional FROM administradores WHERE nombreCompleto = ? AND activo = TRUE',
                            [aprendiz.instructorProductiva]
                        );
                        if (instructorResult.length > 0 && instructorResult[0].correoInstitucional) {
                            destinatarios.push({
                                email: instructorResult[0].correoInstitucional,
                                esInstructor: true,
                                nombreAprendiz: `${aprendiz.nombres} ${aprendiz.primerApellido} ${aprendiz.segundoApellido || ''}`.trim()
                            });
                            console.log('📧 Enviando copia al instructor:', instructorResult[0].correoInstitucional);
                        }
                    }

                    // Enviar correos personalizados a cada destinatario
                    await servicioCorreo.enviarResumenAlertasMultiples(destinatarios, alertas);

                    // Actualizar la fecha del último envío (formato compatible con MySQL)
                    const fechaMysql = ahora.toISOString().slice(0, 19).replace('T', ' ');
                    await pool.query('UPDATE aprendices SET fechaUltimoCorreoAlerta = ? WHERE id = ?', [fechaMysql, aprendizId]);
                    console.log('✅ Correo de alertas enviado a', destinatarios.length, 'destinatarios y fecha actualizada');
                } catch (e) {
                    console.error('Error enviando correo de alertas:', e);
                }
            }

            const nombreCompleto = `${aprendiz.nombres} ${aprendiz.primerApellido} ${aprendiz.segundoApellido || ''}`.trim();
            console.log('Nombre completo del aprendiz:', nombreCompleto);

            console.log('=== FIN DIAGNÓSTICO DASHBOARD ===');

            res.render('aprendiz/dashboard', {
                title: 'Dashboard del Aprendiz',
                user: { name: nombreCompleto },
                // indicadores: indicadores, // Eliminado para que no se envíen indicadores
                alertas: alertas,
                layout: 'plantillas/principal'
            });
        } catch (error) {
            console.error('Error al mostrar el dashboard del aprendiz:', error);
            res.status(500).render('compartido/paginaError', {
                title: 'Error del Servidor',
                message: 'Ocurrió un error al cargar el dashboard.',
                error: formatearError(error),
                layout: 'plantillas/principal'
            });
        }
    }

    async mostrarMiPerfil(req, res) {
        try {
            const aprendizId = req.session.userId;
            if (!aprendizId) {
                return res.status(401).render('compartido/paginaError', {
                    title: 'Error de Autenticación',
                    message: 'No se pudo encontrar el ID del usuario en la sesión.',
                    layout: 'plantillas/principal'
                });
            }
            const aprendiz = await servicioAprendiz.obtenerAprendizPorId(aprendizId);
            if (!aprendiz) {
                return res.status(404).render('compartido/paginaError', {
                    title: 'Perfil no encontrado',
                    message: 'No se encontró información para su perfil.',
                    layout: 'plantillas/principal'
                });
            }
            
            // Normalizar datos del aprendiz para mostrar los nombres completos
            const aprendizNormalizado = servicioGestionAprendices.normalizarAprendiz(aprendiz);
            
            res.render('aprendiz/verMiPerfilAprendiz', {
                title: 'Mi Perfil de Aprendiz',
                aprendiz: aprendizNormalizado,
                layout: 'plantillas/principal'
            });
        } catch (error) {
            console.error('Error al mostrar el perfil del aprendiz:', error);
            res.status(500).render('compartido/paginaError', {
                title: 'Error',
                message: 'No se pudo cargar su perfil',
                error: formatearError(error),
                layout: 'plantillas/principal'
            });
        }
    }

    async mostrarGestionDocumentos(req, res) {
        try {
            const aprendizId = req.session.userId;
            if (!aprendizId) {
                return res.status(401).render('compartido/paginaError', {
                    title: 'Error de Autenticación',
                    message: 'No se pudo encontrar el ID del usuario en la sesión.',
                    layout: 'plantillas/principal'
                });
            }
            const documentos = await servicioDocumentosAprendiz.obtenerDocumentosPorAprendiz(aprendizId);
            res.render('aprendiz/gestionDocumentos', {
                title: 'Gestión de Documentos - SENA',
                documentos: documentos,
                layout: 'plantillas/principal'
            });
        } catch (error) {
            console.error('Error al mostrar la gestión de documentos:', error);
            res.status(500).render('compartido/paginaError', {
                title: 'Error',
                message: 'No se pudo cargar la página de gestión de documentos',
                error: formatearError(error),
                layout: 'plantillas/principal'
            });
        }
    }

    async subirDocumento(req, res) {
        const aprendizId = req.session.userId;
        const { descripcion, tipoDocumento } = req.body;
        const file = req.file;
        try {
            if (!aprendizId) {
                if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
                return res.status(401).json({ success: false, message: 'ID de usuario no encontrado.' });
            }
            if (!file) {
                return res.status(400).json({ success: false, message: 'No se seleccionó ningún archivo.' });
            }
            // Decodificar y normalizar el nombre original para manejar tildes y caracteres especiales
            let nombreOriginalNormalizado = decodeOriginalName(file.originalname);
            nombreOriginalNormalizado = nombreOriginalNormalizado.normalize('NFC');
            const nombreOriginalComparacion = normalizarNombreDocumento(nombreOriginalNormalizado);
            // Buscar documento existente por nombre normalizado
            const documentos = await servicioDocumentosAprendiz.obtenerDocumentosPorAprendiz(aprendizId);
            const documentoExistente = documentos.find(doc => normalizarNombreDocumento(doc.nombre_original) === nombreOriginalComparacion);
            if (documentoExistente) {
                // Solo intentar eliminar archivo local si no es Azure Blob Storage o si la ruta no parece de Azure
                const ruta = documentoExistente.ruta_archivo;
                const esAzure = USE_AZURE_BLOB && ruta.startsWith('documentos/');
                
                if (esAzure) {
                    try {
                        await deleteAzureFile(ruta);
                    } catch (e) {
                        console.warn('No se pudo eliminar el archivo antiguo de Azure:', e.message);
                    }
                } else {
                    const oldFilePath = path.join(__dirname, '../../../..', ruta);
                    if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
                }
                
                await servicioDocumentosAprendiz.eliminarDocumentoPorId(documentoExistente.id);
            }
            // Determinar la ruta del archivo basada en el entorno
            let rutaArchivo;
            let nombreGuardado;

            if (USE_AZURE_BLOB) {
                // Subir a Azure Blob Storage
                const uploadResult = await uploadFile(file.buffer, nombreOriginalNormalizado, 'documentos');
                rutaArchivo = uploadResult.blobName;
                nombreGuardado = uploadResult.blobName.split('/').pop();
            } else {
                // En desarrollo local, usar ruta relativa
                rutaArchivo = `public/uploads/documentos/${file.filename}`.trim();
                nombreGuardado = file.filename;
            }

            // Forzar la categoría a 'certificado' para evitar errores de ENUM
            const datosDocumento = {
                aprendiz_id: aprendizId,
                nombre_original: nombreOriginalNormalizado,
                nombre_guardado: nombreGuardado,
                ruta_archivo: rutaArchivo,
                tipo_mime: file.mimetype,
                tamano_bytes: file.size,
                descripcion: descripcion || null,
                tipo_documento: tipoDocumento, // Guardar el tipo de documento real
                activo: 1
            };
            const resultado = await servicioDocumentosAprendiz.insertarDocumento(datosDocumento);
            if (resultado.success) {
                res.status(201).json({ success: true, message: 'Documento subido.', documentoId: resultado.id });
            } else {
                if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
                res.status(500).json({ success: false, message: 'Error al guardar el documento.' });
            }
        } catch (error) {
            if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            console.error('Error al subir documento:', error);
            res.status(500).json({ success: false, message: 'No se pudo subir el documento.' });
        }
    }

    async descargarDocumento(req, res) {
        try {
            const { nombreGuardado } = req.params;
            const aprendizId = req.session.userId;
            if (!aprendizId) {
                return res.status(401).send('Acceso no autorizado.');
            }
            const documento = await servicioDocumentosAprendiz.obtenerDocumentoPorNombreGuardadoYAprendiz(nombreGuardado, aprendizId);
            if (!documento) {
                return res.status(404).send('Archivo no encontrado o no tiene permisos para descargarlo.');
            }
            // --- INICIO DE LA CORRECCIÓN ---
            // Se hace el código robusto para aceptar 'rutaArchivo' (camelCase) o 'ruta_archivo' (snake_case)
            const ruta = documento.ruta_archivo || documento.ruta_archivo;
            const nombre = documento.nombre_original || documento.nombre_original;

            if (!ruta || typeof ruta !== 'string') {
                console.error(`Error: El documento con nombre guardado ${nombreGuardado} no tiene una ruta válida.`);
                return res.status(404).send('La ruta del archivo para este documento no es válida o no existe.');
            }

            // Detectar si es archivo de Azure Blob Storage (blobName que comienza con 'documentos/')
            // vs archivo local (que comienza con 'public/uploads/')
            const esArchivoAzure = USE_AZURE_BLOB && ruta.startsWith('documentos/') && !ruta.startsWith('public/uploads/');

            if (esArchivoAzure) {
                // Archivo en Azure Blob Storage - descargar y enviar al cliente
                try {
                    const ext = require('path').extname(nombre).toLowerCase();
                    let mimeType = 'application/octet-stream';
                    if (ext === '.pdf') mimeType = 'application/pdf';
                    else if (ext === '.doc') mimeType = 'application/msword';
                    else if (ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    else if (ext === '.xls') mimeType = 'application/vnd.ms-excel';
                    else if (ext === '.xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    else if (ext === '.png') mimeType = 'image/png';
                    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';

                    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
                    res.setHeader('Content-Type', mimeType);
                    
                    // Descargar el archivo desde Azure Blob Storage y enviarlo al cliente
                    const stream = await downloadFile(ruta);
                    stream.pipe(res);
                } catch (azureError) {
                    console.error('Error descargando desde Azure Blob Storage:', azureError);
                    res.status(500).send('Error al descargar el archivo desde Azure Blob Storage.');
                }
            } else {
                // Archivo local
                const rutaCompleta = path.join(__dirname, '../../../..', ruta.trim());
                if (fs.existsSync(rutaCompleta)) {
                    res.download(rutaCompleta, nombre);
                } else {
                    console.error(`Error: Archivo físico no encontrado en la ruta ${rutaCompleta}`);
                    res.status(404).send('El archivo que intenta descargar no se encuentra físicamente en el servidor.');
                }
            }
            // --- FIN DE LA CORRECCIÓN ---
        } catch (error) {
            console.error('Error en el controlador descargarDocumento:', error);
            res.status(500).send('Error interno del servidor.');
        }
    }

    async descargarMultiplesDocumentos(req, res) {
        const documentoIds = req.body.ids;
        const aprendizId = req.session.userId;
        if (!aprendizId || !documentoIds || !Array.isArray(documentoIds) || documentoIds.length === 0) {
            return res.status(400).send('Solicitud inválida.');
        }
        try {
            const documentos = await servicioDocumentosAprendiz.obtenerDocumentosPorIds(documentoIds, aprendizId);
            if (documentos.length === 0) {
                return res.status(404).send('No se encontraron documentos autorizados.');
            }
            const archive = archiver('zip', { zlib: { level: 9 } });
            res.attachment(`documentos_SENA_${Date.now()}.zip`);
            archive.pipe(res);
            // --- INICIO DE LA CORRECCIÓN ---
            // Se hace el código robusto para aceptar camelCase y snake_case y se verifica que la ruta exista.
            const documentExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
            const tempFiles = [];
            const os = require('os');

            for (const doc of documentos) {
                const ruta = doc.ruta_archivo || doc.ruta_archivo;
                const nombre = doc.nombre_original || doc.nombre_original;
                const ext = path.extname(nombre).toLowerCase();
                if (ruta && typeof ruta === 'string') {
                    // Si es Azure Blob Storage
                    if (USE_AZURE_BLOB && ruta.startsWith('documentos/') && documentExts.includes(ext)) {
                        // Descargar temporalmente el archivo de Azure Blob Storage
                        const tempPath = path.join(os.tmpdir(), `${Date.now()}_${Math.random().toString(36).slice(2)}_${nombre}`);
                        tempFiles.push(tempPath);
                        try {
                            const stream = await downloadFile(ruta);
                            const file = fs.createWriteStream(tempPath);
                            await new Promise((resolve, reject) => {
                                stream.pipe(file);
                                file.on('finish', () => {
                                    file.close(resolve);
                                });
                                stream.on('error', (err) => {
                                    fs.unlink(tempPath, () => {});
                                    console.warn(`Error descargando archivo Azure: ${ruta}`, err);
                                    resolve(); // No rechazar para no romper el ZIP
                                });
                            });
                            if (fs.existsSync(tempPath)) {
                                archive.file(tempPath, { name: nombre });
                            }
                        } catch (err) {
                            console.warn(`Error descargando archivo Azure: ${ruta}`, err);
                        }
                    } else {
                        // Archivo local
                        const filePath = path.join(__dirname, '../../../..', ruta.trim());
                        if (fs.existsSync(filePath)) {
                            archive.file(filePath, { name: nombre });
                        } else {
                            console.warn(`Archivo no encontrado: ${filePath}`);
                        }
                    }
                } else {
                    console.warn(`Documento con ID ${doc.id} no tiene una ruta de archivo válida.`);
                }
            }
            archive.finalize().then(() => {
                // Eliminar archivos temporales
                for (const tempPath of tempFiles) {
                    if (fs.existsSync(tempPath)) {
                        fs.unlink(tempPath, () => {});
                    }
                }
            });
        } catch (error) {
            console.error('Error al generar ZIP:', error);
            res.status(500).send('Error al generar el archivo ZIP.');
        }
    }

    async eliminarDocumento(req, res) {
        try {
            const documentoId = parseInt(req.params.id, 10);
            const aprendizId = req.session.userId;
            if (!aprendizId) {
                return res.status(401).json({ success: false, message: 'ID de usuario no encontrado.' });
            }
            const docInfo = await servicioDocumentosAprendiz.obtenerDocumentoPorId(documentoId);
            if (!docInfo || docInfo.aprendiz_id !== aprendizId) {
                return res.status(404).json({ success: false, message: 'Documento no encontrado o no autorizado.' });
            }
            // --- INICIO DE LA CORRECCIÓN ---
            const ruta = docInfo.ruta_archivo || docInfo.ruta_archivo;
            if (ruta && typeof ruta === 'string') {
                const documentExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
                const ext = path.extname(docInfo.nombre_original || '').toLowerCase();
                // Log para depuración
                console.log('[Azure Delete] Intentando eliminar:', {
                    ruta,
                    ext,
                    esDocumento: documentExts.includes(ext),
                    esAzure: USE_AZURE_BLOB && ruta.startsWith('documentos/'),
                    blobName: ruta
                });
                if (USE_AZURE_BLOB && ruta.startsWith('documentos/') && documentExts.includes(ext)) {
                    try {
                        const result = await deleteAzureFile(ruta);
                        console.log('[Azure Delete] Resultado:', result);
                        if (!result.success) {
                            console.warn('[Azure Delete] No se eliminó el archivo en Azure. Respuesta:', result);
                            // Intentar eliminar archivo local si existe
                            const filePath = path.join(__dirname, '../../../..', ruta.trim());
                            if (fs.existsSync(filePath)) {
                                fs.unlinkSync(filePath);
                                console.warn('[Azure Delete] Archivo local eliminado como respaldo.');
                            }
                        }
                    } catch (azureError) {
                        console.error('Error eliminando archivo de Azure Blob Storage:', azureError);
                        // Intentar eliminar archivo local si existe
                        const filePath = path.join(__dirname, '../../../..', ruta.trim());
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                            console.warn('[Azure Delete] Archivo local eliminado como respaldo tras error Azure.');
                        }
                        return res.status(500).json({ success: false, message: 'Error al eliminar el archivo de Azure Blob Storage. No se eliminó de la base de datos.' });
                    }
                } else {
                    // Eliminar archivo local
                    const filePath = path.join(__dirname, '../../../..', ruta.trim());
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
            }
            // --- FIN DE LA CORRECCIÓN ---
            const eliminadoDB = await servicioDocumentosAprendiz.eliminarDocumentoPorId(documentoId);
            if (eliminadoDB) {
                res.status(200).json({ success: true, message: 'Documento eliminado.' });
            } else {
                res.status(500).json({ success: false, message: 'Error al eliminar de la base de datos.' });
            }
        } catch (error) {
            console.error('Error al eliminar documento:', error);
            res.status(500).json({ success: false, message: 'No se pudo eliminar el documento.' });
        }
    }

    async eliminarMultiplesDocumentos(req, res) {
        const documentoIds = req.body.ids;
        const aprendizId = req.session.userId;
        if (!aprendizId || !documentoIds || !Array.isArray(documentoIds) || documentoIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No se proporcionaron IDs de documentos válidos.' });
        }
        try {
            const docsToDelete = await servicioDocumentosAprendiz.obtenerDocumentosPorIds(documentoIds, aprendizId);
            if (docsToDelete.length !== documentoIds.length) {
                return res.status(403).json({ success: false, message: 'Intento de eliminar documentos no autorizados.'});
            }
            // --- INICIO DE LA CORRECCIÓN ---
            const documentExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
            for (const doc of docsToDelete) {
                const ruta = doc.ruta_archivo || doc.ruta_archivo;
                const ext = path.extname(doc.nombre_original || '').toLowerCase();
                // Log para depuración
                console.log('[Azure Delete Multiple] Intentando eliminar:', {
                    ruta,
                    ext,
                    esDocumento: documentExts.includes(ext),
                    esAzure: USE_AZURE_BLOB && ruta.startsWith('documentos/'),
                    blobName: ruta
                });
                if (USE_AZURE_BLOB && ruta.startsWith('documentos/') && documentExts.includes(ext)) {
                    try {
                        const result = await deleteAzureFile(ruta);
                        console.log('[Azure Delete Multiple] Resultado:', result);
                        if (!result.success) {
                            console.warn('[Azure Delete Multiple] No se eliminó el archivo en Azure. Respuesta:', result);
                        }
                    } catch (azureError) {
                        console.error('Error eliminando archivo de Azure Blob Storage:', azureError);
                    }
                } else {
                    // Eliminar archivo local
                    const filePath = path.join(__dirname, '../../../..', ruta.trim());
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
                await servicioDocumentosAprendiz.eliminarDocumentoPorId(doc.id);
            }
            // --- FIN DE LA CORRECCIÓN ---
            res.status(200).json({ success: true, message: `Se eliminaron ${docsToDelete.length} documento(s) exitosamente.` });
        } catch (error) {
            console.error('Error al eliminar múltiples documentos:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor al eliminar documentos.' });
        }
    }
    
    // --- NUEVAS FUNCIONES PARA LA BITÁCORA SEMANAL ---

    /**
     * Muestra la página con el formulario para que el aprendiz
     * registre su bitácora semanal.
     */
    async mostrarFormularioBitacora(req, res) {
        try {
            // CORRECCIÓN: Construimos un objeto 'user' con la información de la sesión.
            const userInfo = {
                name: req.session.userName, 
                email: req.session.userEmail,
                role: req.session.userRole
            };

            res.render('aprendiz/registrarBitacora', {
                title: 'Mi Bitácora Semanal',
                layout: 'plantillas/principal',
                user: userInfo // Pasamos el objeto 'user' construido correctamente.
            });
        } catch (error) {
            console.error('Error al mostrar el formulario de bitácora:', error);
            res.status(500).render('compartido/paginaError', {
                title: 'Error',
                message: 'No se pudo cargar el formulario de la bitácora.',
                layout: 'plantillas/principal'
            });
        }
    }

    /**
     * Recibe los datos del formulario de la bitácora y los guarda
     * en la base de datos.
     */
    async registrarBitacora(req, res) {
        try {
            const aprendizId = req.session.userId;

            // Validar datos de entrada usando la función validarDatos
            const { validarDatos } = require('../../../validaciones/esquemasValidacion');
            const { valido, errores, datos } = validarDatos(req.body, aprendizSchemas.bitacora);
            if (!valido) {
                return this.validationError(res, errores);
            }

            const { respuestaDesafio, respuestaLogro, respuestaComunicacion } = datos;

            // Análisis de sentimientos SOLO con Watson
            const servicioWatson = new ServicioWatsonSentimientos();
            const analisisDesafio = await servicioWatson.analizarSentimiento(respuestaDesafio);
            const analisisLogro = await servicioWatson.analizarSentimiento(respuestaLogro);
            const analisisComunicacion = await servicioWatson.analizarSentimiento(respuestaComunicacion);

            // Función para normalizar los scores de Watson al rango 0-1
            function normalizarScore(score) {
                return Math.max(0, Math.min(1, (Number(score) + 5) / 10));
            }

            // Calcular métricas generales
            const scores = [analisisDesafio.score, analisisLogro.score, analisisComunicacion.score];
            const scorePromedio = scores.reduce((a, b) => a + b, 0) / 3;
            const scorePromedioNormalizado = normalizarScore(scorePromedio); // Watson va de -5 a 5
            
            // Manejar confianza con valores por defecto
            const conf1 = Number(analisisDesafio.confianza) || 0;
            const conf2 = Number(analisisLogro.confianza) || 0;
            const conf3 = Number(analisisComunicacion.confianza) || 0;
            let confianza = (conf1 + conf2 + conf3) / 3;
            confianza = Math.max(0, Math.min(1, Number(confianza.toFixed(2))));
            
            let sentimientoGeneral = 'neutral';
            if (scorePromedio > 1) sentimientoGeneral = 'positivo';
            if (scorePromedio < -1) sentimientoGeneral = 'negativo';

            // Función para asegurar JSON seguro
            const safeJson = (val, empty = '[]') => {
                try {
                    if (val === undefined || val === null) return empty;
                    if (typeof val === 'string') return val;
                    return JSON.stringify(val);
                } catch { return empty; }
            };

            // Función para mapear los valores de sentimiento de Watson al ENUM de la base de datos
            function mapSentimientoWatson(valor) {
                if (!valor) return 'neutral';
                const v = String(valor).toLowerCase().replace(/\s+/g, '_');
                switch (v) {
                    case 'very_positive':
                    case 'muy_positivo':
                    case 'muypositivo':
                    case 'verypositive':
                        return 'muy_positivo';
                    case 'positive':
                    case 'positivo':
                        return 'positivo';
                    case 'neutral':
                        return 'neutral';
                    case 'negative':
                    case 'negativo':
                        return 'negativo';
                    case 'very_negative':
                    case 'muy_negativo':
                    case 'muynegativo':
                    case 'verynegative':
                        return 'muy_negativo';
                    default:
                        return 'neutral';
                }
            }

            // Logs para depuración de sentimientos
            console.log('Sentimiento recibido (desafío):', analisisDesafio.sentimiento);
            console.log('Sentimiento mapeado (desafío):', mapSentimientoWatson(analisisDesafio.sentimiento));
            console.log('Sentimiento recibido (logro):', analisisLogro.sentimiento);
            console.log('Sentimiento mapeado (logro):', mapSentimientoWatson(analisisLogro.sentimiento));
            console.log('Sentimiento recibido (comunicación):', analisisComunicacion.sentimiento);
            console.log('Sentimiento mapeado (comunicación):', mapSentimientoWatson(analisisComunicacion.sentimiento));
            console.log('Sentimiento general calculado:', sentimientoGeneral);
            console.log('Sentimiento general mapeado:', mapSentimientoWatson(sentimientoGeneral));

            // Preparar datos para la inserción
            const datosBitacora = {
                aprendizId: aprendizId,
                respuesta_desafio: respuestaDesafio,
                respuesta_logro: respuestaLogro,
                respuesta_comunicacion: respuestaComunicacion,
                sentimiento_desafio: mapSentimientoWatson(analisisDesafio.sentimiento),
                sentimiento_logro: mapSentimientoWatson(analisisLogro.sentimiento),
                sentimiento_comunicacion: mapSentimientoWatson(analisisComunicacion.sentimiento),
                score_desafio: normalizarScore(analisisDesafio.score),
                score_logro: normalizarScore(analisisLogro.score),
                score_comunicacion: normalizarScore(analisisComunicacion.score),
                sentimiento_general: mapSentimientoWatson(sentimientoGeneral),
                score_promedio: scorePromedioNormalizado,
                confianza: confianza,
                contiene_ironia: !!(analisisDesafio.contieneIronia || analisisLogro.contieneIronia || analisisComunicacion.contieneIronia),
                contextos_detectados: safeJson([
                    ...(analisisDesafio.contextosDetectados || []),
                    ...(analisisLogro.contextosDetectados || []),
                    ...(analisisComunicacion.contextosDetectados || [])
                ]),
                recomendaciones: safeJson([]),
                emociones_desafio: safeJson(analisisDesafio.emociones, '{}'),
                emociones_logro: safeJson(analisisLogro.emociones, '{}'),
                emociones_comunicacion: safeJson(analisisComunicacion.emociones, '{}'),
                entidades_desafio: safeJson(analisisDesafio.entidades, '[]'),
                entidades_logro: safeJson(analisisLogro.entidades, '[]'),
                entidades_comunicacion: safeJson(analisisComunicacion.entidades, '[]'),
                palabras_clave_desafio: safeJson(analisisDesafio.palabrasClave, '[]'),
                palabras_clave_logro: safeJson(analisisLogro.palabrasClave, '[]'),
                palabras_clave_comunicacion: safeJson(analisisComunicacion.palabrasClave, '[]')
            };

            const query = `
                INSERT INTO bitacoras (
                    aprendizId,
                    respuesta_desafio,
                    respuesta_logro,
                    respuesta_comunicacion,
                    sentimiento_desafio,
                    sentimiento_logro,
                    sentimiento_comunicacion,
                    score_desafio,
                    score_logro,
                    score_comunicacion,
                    sentimiento_general,
                    score_promedio,
                    confianza,
                    contiene_ironia,
                    contextos_detectados,
                    recomendaciones,
                    emociones_desafio,
                    emociones_logro,
                    emociones_comunicacion,
                    entidades_desafio,
                    entidades_logro,
                    entidades_comunicacion,
                    palabras_clave_desafio,
                    palabras_clave_logro,
                    palabras_clave_comunicacion,
                    estado,
                    fechaEnvio
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;

            const values = [
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
                datosBitacora.sentimiento_general,
                datosBitacora.score_promedio,
                datosBitacora.confianza,
                datosBitacora.contiene_ironia,
                datosBitacora.contextos_detectados,
                datosBitacora.recomendaciones,
                datosBitacora.emociones_desafio,
                datosBitacora.emociones_logro,
                datosBitacora.emociones_comunicacion,
                datosBitacora.entidades_desafio,
                datosBitacora.entidades_logro,
                datosBitacora.entidades_comunicacion,
                datosBitacora.palabras_clave_desafio,
                datosBitacora.palabras_clave_logro,
                datosBitacora.palabras_clave_comunicacion,
                'enviada' // Marcar como enviada cuando el aprendiz completa el formulario
            ];

            // Validación robusta antes del INSERT
            if (values.length !== 26) {
                return res.status(500).json({
                    success: false,
                    message: `Error interno: la cantidad de valores (${values.length}) no coincide con la cantidad de columnas (26) para el registro de bitácora.`
                });
            }

            await pool.query(query, values);

            res.status(201).json({
                success: true,
                message: 'Bitácora registrada exitosamente',
                analisis: {
                    scorePromedio: datosBitacora.score_promedio,
                    nivelCompromiso: datosBitacora.confianza,
                    tendencia: sentimientoGeneral,
                    watson: {
                        desafio: analisisDesafio,
                        logro: analisisLogro,
                        comunicacion: analisisComunicacion
                    }
                }
            });

        } catch (error) {
            console.error('Error al registrar bitácora:', error);
            res.status(500).json({
                success: false,
                message: 'Error al registrar la bitácora'
            });
        }
    }

    async getContadorAlertas(req, res) {
        try {
            const aprendizId = req.session.userId;
            if (!aprendizId) {
                return res.status(401).json({ success: false, contador: 0, message: 'No autenticado' });
            }
            const alertas = await servicioAlertas.obtenerAlertasAprendiz(aprendizId);
            res.json({ success: true, contador: alertas.length, alertas });
        } catch (error) {
            console.error('Error al obtener el contador de alertas:', error);
            res.status(500).json({ success: false, contador: 0, message: 'Error interno' });
        }
    }

    /**
     * Obtener contador de notificaciones no leídas
     */
    async getContadorNotificaciones(req, res) {
        try {
            const aprendizId = req.session.userId;
            if (!aprendizId) {
                return res.status(401).json({ success: false, count: 0 });
            }

            const count = await notificacionesService.contarNoLeidas(aprendizId);
            res.json({ success: true, count });
        } catch (error) {
            console.error('Error al obtener contador de notificaciones:', error);
            res.status(500).json({ success: false, count: 0 });
        }
    }

    /**
     * Obtener lista de notificaciones
     */
    async obtenerNotificaciones(req, res) {
        try {
            const aprendizId = req.session.userId;
            if (!aprendizId) {
                return res.status(401).json({ success: false, notificaciones: [] });
            }

            const notificaciones = await notificacionesService.obtenerNotificaciones(aprendizId);
            res.json({ success: true, notificaciones });
        } catch (error) {
            console.error('Error al obtener notificaciones:', error);
            res.status(500).json({ success: false, notificaciones: [] });
        }
    }

    /**
     * Marcar una notificación como leída
     */
    async marcarNotificacionLeida(req, res) {
        try {
            const aprendizId = req.session.userId;
            const notificacionId = req.params.id;

            if (!aprendizId) {
                return res.status(401).json({ success: false });
            }

            const resultado = await notificacionesService.marcarComoLeida(notificacionId, aprendizId);
            res.json(resultado);
        } catch (error) {
            console.error('Error al marcar notificación como leída:', error);
            res.status(500).json({ success: false });
        }
    }

    /**
     * Marcar todas las notificaciones como leídas
     */
    async marcarTodasNotificacionesLeidas(req, res) {
        try {
            const aprendizId = req.session.userId;
            if (!aprendizId) {
                return res.status(401).json({ success: false });
            }

            const resultado = await notificacionesService.marcarTodasComoLeidas(aprendizId);
            res.json(resultado);
        } catch (error) {
            console.error('Error al marcar todas las notificaciones como leídas:', error);
            res.status(500).json({ success: false });
        }
    }

    /**
     * Eliminar una notificación específica
     */
    async eliminarNotificacion(req, res) {
        try {
            const aprendizId = req.session.userId;
            const notificacionId = req.params.id;

            if (!aprendizId) {
                return res.status(401).json({ success: false, message: 'No autorizado' });
            }

            const resultado = await notificacionesService.eliminarNotificacion(notificacionId, aprendizId);
            res.json(resultado);
        } catch (error) {
            console.error('Error al eliminar notificación:', error);
            res.status(500).json({ success: false, message: 'Error al eliminar la notificación' });
        }
    }

    /**
     * Eliminar todas las notificaciones leídas
     */
    async eliminarTodasNotificacionesLeidas(req, res) {
        try {
            const aprendizId = req.session.userId;
            if (!aprendizId) {
                return res.status(401).json({ success: false, message: 'No autorizado' });
            }

            const resultado = await notificacionesService.eliminarTodasLeidas(aprendizId);
            res.json(resultado);
        } catch (error) {
            console.error('Error al eliminar notificaciones leídas:', error);
            res.status(500).json({ success: false, message: 'Error al eliminar las notificaciones' });
        }
    }

    // --- Método para Listar Administradores ---
    async listarAdministradores(req, res) {
        try {
            res.render('aprendiz/listarAdministradores', {
                title: 'Listado de Administradores - SENA',
                layout: 'plantillas/principal'
            });
        } catch (error) {
            console.error('Error al mostrar la lista de administradores:', error);
            res.status(500).render('compartido/paginaError', {
                title: 'Error',
                message: 'No se pudo cargar la lista de administradores',
                error: formatearError(error),
                layout: 'plantillas/principal'
            });
        }
    }

    // --- Método para Ver Perfil de Administrador ---
    async verPerfilAdministrador(req, res) {
        try {
            const { id } = req.params;

            // Consultar los datos del administrador
            const consulta = `
                SELECT
                    id,
                    nombreCompleto,
                    correoInstitucional,
                    numeroIdentificacion,
                    telefono,
                    departamento,
                    cargo,
                    fotoPerfil,
                    fotoPerfilPath,
                    created_at as fechaRegistro
                FROM administradores
                WHERE id = ?
            `;

            const [resultados] = await pool.execute(consulta, [id]);

            if (resultados.length === 0) {
                return res.status(404).render('compartido/paginaError', {
                    layout: 'plantillas/principal',
                    title: 'Administrador no encontrado',
                    message: 'El administrador solicitado no existe',
                    usuario: req.session.usuario
                });
            }

            const administrador = resultados[0];

            // Procesar foto de perfil (SAS URL si es necesario)
            await procesarFotoPerfil(administrador);

            res.render('aprendiz/verAdministrador', {
                layout: 'plantillas/principal',
                title: 'Ver Administrador',
                administrador,
                usuario: req.session.usuario
            });

        } catch (error) {
            console.error('Error al ver administrador:', error);
            res.status(500).render('compartido/paginaError', {
                layout: 'plantillas/principal',
                title: 'Error del Servidor',
                message: 'Error interno del servidor',
                usuario: req.session.usuario
            });
        }
    }

    // --- Métodos de Ayuda ---
    async obtenerProgresoEtapa(aprendizId) {
        // Este método no está implementado en el archivo actual,
        // pero se incluye para completar la estructura de la clase.
        // En un archivo real, aquí iría la lógica para obtener el progreso
        // de la etapa actual del aprendiz.
        return { success: false, message: 'Método no implementado' };
    }
}

module.exports = new ControladorDashboardAprendiz();
