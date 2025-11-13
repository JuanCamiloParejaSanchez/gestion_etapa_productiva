// Ruta: src/modulos/aprendiz/controladores/controladorRegistroAprendiz.js
// Propósito: Maneja la lógica de registro de nuevos aprendices


const ServicioAprendiz = require('../servicios/servicioAprendiz');
const servicioDocumentosAprendiz = require('../servicios/servicioDocumentosAprendiz');
const { decodeOriginalName } = require('../../../compartido/middlewares/multerConfig');
const servicioAprendiz = new ServicioAprendiz();

const registrarAprendiz = async (req, res) => {
    console.log('🚀 Iniciando registro de aprendiz');
    console.log('📝 Método de petición:', req.method);
    console.log('🌐 URL de petición:', req.originalUrl);
    console.log('📋 Content-Type:', req.get('Content-Type'));
    
    try {
        const datosAprendiz = req.body;
        console.log('📋 Datos recibidos en bruto:', datosAprendiz);
        
        // Verificar si se subió un archivo
        if (req.file) {
            console.log('📎 Archivo recibido:', {
                fieldname: req.file.fieldname,
                originalname: req.file.originalname,
                filename: req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path
            });
            
            // Decodificar el nombre original para manejar correctamente caracteres especiales
            const nombreOriginalDecodificado = decodeOriginalName(req.file.originalname);
            
            // Agregar la información del archivo a los datos del aprendiz
            datosAprendiz.documentoSoporte = req.file.filename;
            datosAprendiz.documentoSoporteOriginal = nombreOriginalDecodificado;
            datosAprendiz.documentoSoportePath = `/uploads/documentos/${req.file.filename}`;
        } else {
            console.warn('⚠️ No se recibió ningún archivo');
            return res.status(400).json({
                success: false,
                message: 'El documento de soporte es obligatorio'
            });
        }
        
        if (!datosAprendiz || typeof datosAprendiz !== 'object') {
            console.error('❌ Datos inválidos recibidos');
            return res.status(400).json({
                success: false,
                message: 'Datos del formulario inválidos'
            });
        }
        
        // Convertir el correo a minúsculas y los demás valores string a mayúsculas
        for (const key in datosAprendiz) {
            if (typeof datosAprendiz[key] === 'string') {
                if (key === 'correoElectronico') {
                    datosAprendiz[key] = datosAprendiz[key].toLowerCase();
                } else if (!key.startsWith('documentoSoporte')) {
                    // No convertir a mayúsculas los campos relacionados con el documento
                    datosAprendiz[key] = datosAprendiz[key].toUpperCase();
                }
            }
        }
        console.log('📋 Datos procesados para registro:', datosAprendiz);

        // Validar campos obligatorios
        if (!datosAprendiz.correoElectronico || !datosAprendiz.numeroDocumento || !datosAprendiz.nombres || !datosAprendiz.primerApellido) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios para el registro'
            });
        }

        // Intentar crear el aprendiz
        const resultado = await servicioAprendiz.crearAprendiz(datosAprendiz);
        console.log('✅ Resultado del registro:', resultado);

        // Insertar el documento de soporte en la tabla documentos_aprendiz
        if (req.file && resultado.id) {
            console.log('📎 Insertando documento de soporte en documentos_aprendiz...');
            try {
                // Decodificar el nombre original para manejar correctamente caracteres especiales
                const nombreOriginalDecodificado = decodeOriginalName(req.file.originalname);
                
                const datosDocumento = {
                    aprendiz_id: resultado.id,
                    nombre_original: nombreOriginalDecodificado,
                    nombre_guardado: req.file.filename,
                    ruta_archivo: `/uploads/documentos/${req.file.filename}`,
                    tipo_mime: req.file.mimetype,
                    tamano_bytes: req.file.size,
                    tipo_documento: 'Documento de soporte',
                    descripcion: 'Documento de soporte cargado durante el registro inicial',
                    activo: 1
                };

                const resultadoDocumento = await servicioDocumentosAprendiz.insertarDocumento(datosDocumento);
                
                if (resultadoDocumento.success) {
                    console.log('✅ Documento de soporte insertado correctamente en documentos_aprendiz:', resultadoDocumento);
                } else {
                    console.warn('⚠️ No se pudo insertar el documento de soporte en documentos_aprendiz:', resultadoDocumento.message);
                }
            } catch (errorDocumento) {
                console.error('❌ Error al insertar documento de soporte:', errorDocumento);
                // No detenemos el proceso de registro aunque falle la inserción del documento
            }
        }

        // Configurar sesión
        req.session.userEmail = datosAprendiz.correoElectronico;
        req.session.aprendizId = resultado.id;
        req.session.registroEnProceso = true;
        req.session.userRole = 'aprendiz';
        
        console.log('💾 Sesión configurada:', {
            userEmail: req.session.userEmail,
            aprendizId: req.session.aprendizId,
            registroEnProceso: req.session.registroEnProceso,
            userRole: req.session.userRole
        });

        console.log('🎉 Registro completado exitosamente');
        
        // Responder siempre con JSON para el modal
        return res.json({
            success: true,
            message: 'Registro exitoso. Ahora puedes crear tu contraseña.',
            data: { 
                aprendizId: resultado.id,
                email: datosAprendiz.correoElectronico,
                documentoSoporte: datosAprendiz.documentoSoportePath,
                redirect: '/crear-contrasena'
            }
        });
    } catch (error) {
        console.error('❌ Error en registro:', error);
        
        // Manejo específico de errores de duplicación
        if (error.code === 'ER_DUP_ENTRY' || error.message.includes('ER_DUP_ENTRY')) {
            let mensaje = 'Ya existe un registro con los mismos datos.';
            
            if (error.message.includes('correoElectronico') || error.message.includes('correo_electronico')) {
                mensaje = 'Ya existe un aprendiz registrado con este correo electrónico.';
            } else if (error.message.includes('numeroDocumento') || error.message.includes('numero_documento')) {
                mensaje = 'Ya existe un aprendiz registrado con este número de documento.';
            }
            
            return res.status(409).json({
                success: false,
                message: mensaje,
                code: 'DUPLICATE_ENTRY'
            });
        }
        
        // Manejo de errores de multer
        if (error.message.includes('Tipo de archivo no permitido')) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de archivo no permitido. Use PDF, DOC, DOCX, JPG o PNG.'
            });
        }
        
        if (error.message.includes('documento de soporte solo se permiten')) {
            return res.status(400).json({
                success: false,
                message: 'Para el documento de soporte solo se permiten archivos PDF o Excel (XLS, XLSX).'
            });
        }
        
        if (error.message.includes('File too large')) {
            return res.status(400).json({
                success: false,
                message: 'El archivo es demasiado grande. El tamaño máximo es 5MB.'
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al procesar el registro'
        });
    }
};

const verificarEstadoRegistro = async (req, res) => {
    try {
        if (!req.session.registroEnProceso || !req.session.userEmail) {
            return res.status(400).json({
                success: false,
                message: 'No hay un registro en proceso'
            });
        }

        const aprendiz = await servicioAprendiz.buscarPorEmail(req.session.userEmail);
        if (!aprendiz) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró el registro del aprendiz'
            });
        }

        return res.json({
            success: true,
            estado: aprendiz.estado,
            puedeCrearPassword: true
        });

    } catch (error) {
        console.error('Error verificando estado:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar el estado del registro'
        });
    }
};

const verificarDuplicado = async (req, res) => {
    try {
        const { campo, valor } = req.body;

        if (!campo || !valor) {
            return res.status(400).json({
                success: false,
                message: 'Campo y valor son requeridos'
            });
        }

        let aprendizExistente = null;

        if (campo === 'correoElectronico') {
            aprendizExistente = await servicioAprendiz.buscarPorEmail(valor.toLowerCase());
        } else if (campo === 'numeroDocumento') {
            aprendizExistente = await servicioAprendiz.buscarPorNumeroDocumento(valor.toUpperCase());
        } else {
            return res.status(400).json({
                success: false,
                message: 'Campo no válido para verificación'
            });
        }

        return res.json({
            success: true,
            existe: !!aprendizExistente,
            campo: campo
        });

    } catch (error) {
        console.error('Error verificando duplicado:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar duplicado'
        });
    }
};

module.exports = {
    registrarAprendiz,
    verificarEstadoRegistro,
    verificarDuplicado
};