// Ruta: src/modulos/aprendiz/rutas/rutasRegistroAprendiz.js
// Propósito: Define las rutas relacionadas con el registro y autenticación de aprendices.

const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const registroAprendizControlador = require('../controladores/controladorRegistroAprendiz');
const autenticacionControlador = require('../../compartido/controladores/controladorAutenticacionGeneral');
const AuthMiddleware = require('../../../compartido/middlewares/middlewareAutenticacion');
const opcionesFormularioServicio = require('../../../compartido/servicios/opcionesFormularioServicio');
const upload = require('../../../compartido/middlewares/multerConfig');
const multerErrorHandler = require('../../../compartido/middlewares/multerErrorHandler');
const { uploadPhoto, procesarFotoPerfil } = require('../../../compartido/middlewares/multerConfigFotos');

// Ruta inicial de registro
// router.get('/', (req, res) => {
//     res.render('aprendiz/registroInicial', {
//         title: 'Registro de Aprendiz',
//         pagina: 'registro-aprendiz',
//         layout: 'plantillas/principal',
//         isPublic: true
//     });
// });

// Procesar el formulario de registro
// Maneja dos archivos: documentoSoporte (PDF/Excel) y fotoPerfil (imagen)
// Usamos una solución híbrida para manejar ambos tipos de archivos
const uploadFields = multer({ storage: upload.storage }).fields([
    { name: 'documentoSoporte', maxCount: 1 },
    { name: 'fotoPerfil', maxCount: 1 }
]);

router.post('/registrar-aprendiz', 
    (req, res, next) => {
        uploadFields(req, res, (err) => {
            if (err) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'El archivo excede el tamaño máximo permitido'
                    });
                }
                return multerErrorHandler(err, req, res, next);
            }
            
            // Procesar documento de soporte
            if (!req.files || !req.files.documentoSoporte) {
                return res.status(400).json({
                    success: false,
                    message: 'El documento de soporte es obligatorio'
                });
            }
            
            // Asignar el documento de soporte a req.file para compatibilidad
            req.file = req.files.documentoSoporte[0];
            console.log('📎 Documento de soporte recibido:', {
                fieldname: req.file.fieldname,
                originalname: req.file.originalname,
                filename: req.file.filename,
                size: req.file.size
            });
            
            // Validar que se recibió la foto de perfil (OBLIGATORIA)
            if (!req.files.fotoPerfil || !req.files.fotoPerfil[0]) {
                return res.status(400).json({
                    success: false,
                    message: 'La foto de perfil es obligatoria'
                });
            }
            
            const fotoFile = req.files.fotoPerfil[0];
            console.log('📸 Foto de perfil detectada, procesando...');
            
            // Validar que sea una imagen
            const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!validImageTypes.includes(fotoFile.mimetype)) {
                // Eliminar el archivo subido
                if (fotoFile.path && fs.existsSync(fotoFile.path)) {
                    fs.unlinkSync(fotoFile.path);
                }
                return res.status(400).json({
                    success: false,
                    message: 'Solo se permiten imágenes JPG, JPEG o PNG para la foto de perfil'
                });
            }
            
            // Validar tamaño (2MB)
            if (fotoFile.size > 2 * 1024 * 1024) {
                // Eliminar el archivo subido
                if (fotoFile.path && fs.existsSync(fotoFile.path)) {
                    fs.unlinkSync(fotoFile.path);
                }
                return res.status(400).json({
                    success: false,
                    message: 'La foto de perfil no puede superar los 2MB'
                });
            }
            
            // Leer el archivo desde disco para procesarlo con Sharp
            try {
                // Verificar si existe path (diskStorage) o buffer (memoryStorage)
                let buffer;
                if (fotoFile.path) {
                    buffer = fs.readFileSync(fotoFile.path);
                } else if (fotoFile.buffer) {
                    buffer = fotoFile.buffer;
                } else {
                    throw new Error('No se pudo obtener el contenido de la imagen');
                }
                
                // Crear un objeto similar al que devuelve multer.memoryStorage
                const reqConFoto = { 
                    ...req, 
                    file: {
                        ...fotoFile,
                        buffer: buffer
                    }
                };
                
                // Procesar la foto con Sharp
                return procesarFotoPerfil(reqConFoto, res, () => {
                    // Eliminar el archivo temporal original SOLO si existe path (diskStorage)
                    if (fotoFile.path && fs.existsSync(fotoFile.path)) {
                        try {
                            fs.unlinkSync(fotoFile.path);
                        } catch (e) {
                            console.warn('No se pudo eliminar archivo temporal:', e.message);
                        }
                    }
                    
                    req.fotoPerfilProcesada = reqConFoto.fotoPerfilProcesada;
                    registroAprendizControlador.registrarAprendiz(req, res);
                });
            } catch (error) {
                console.error('❌ Error leyendo archivo de foto:', error);
                // Eliminar el archivo temporal
                if (fotoFile.path && fs.existsSync(fotoFile.path)) {
                    fs.unlinkSync(fotoFile.path);
                }
                return res.status(500).json({
                    success: false,
                    message: 'Error al procesar la foto de perfil'
                });
            }
        });
    }
);

// Ruta para verificar duplicados
router.post('/verificar-duplicado', registroAprendizControlador.verificarDuplicado);

// Formulario de creación de contraseña
router.get('/compartido/crearContrasena', AuthMiddleware.verificarRegistro, (req, res) => {
    if (!req.session.userEmail) {
        return res.redirect('/');
    }
    res.render('compartido/crearContrasena', {
        title: 'Crear Contraseña - SENA',
        layout: 'plantillas/principal',
        email: req.session.userEmail
    });
});

// Ruta alternativa para crear contraseña (compatibilidad)
router.get('/crear-contrasena', AuthMiddleware.verificarRegistro, (req, res) => {
    if (!req.session.userEmail) {
        return res.redirect('/');
    }
    res.render('compartido/crearContrasena', {
        title: 'Crear Contraseña - SENA',
        layout: 'plantillas/principal',
        email: req.session.userEmail
    });
});

// Ruta para mostrar el formulario de registro de aprendiz
router.get('/registrar-aprendiz', (req, res) => {
    const opciones = opcionesFormularioServicio.obtenerTodasLasOpciones();
    res.render('aprendiz/registroInicial', {
        title: 'Registro de Aprendiz',
        pagina: 'registro-aprendiz',
        layout: 'plantillas/principal',
        isPublic: true,
        opciones: opciones
    });
});

// Ruta para obtener datos de ubicación
router.get('/data/colombia.json', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../../data/colombia.json'));
});

router.post('/crear-contrasena', AuthMiddleware.verificarRegistro, autenticacionControlador.crearPassword);

// Ruta temporal para pruebas (REMOVER EN PRODUCCIÓN)
router.post('/test-crear-contrasena', (req, res, next) => {
    // Simular sesión para pruebas
    req.session = req.session || {};
    req.session.userEmail = req.body.correoElectronico || 'test@test.com';
    req.session.userRole = 'aprendiz';
    req.session.registroEnProceso = true;
    next();
}, autenticacionControlador.crearPassword);

module.exports = router;