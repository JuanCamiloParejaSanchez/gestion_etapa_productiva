const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const registroAdministradorControlador = require('../controladores/registroAdministradorControlador');
const { uploadPhoto, procesarFotoPerfil } = require('../../../compartido/middlewares/multerConfigFotos');

// Mostrar formulario de registro
router.get('/registro-administrador', registroAdministradorControlador.mostrarFormulario);
router.get('/registrar-administrador', registroAdministradorControlador.mostrarFormulario); // Alias para consistencia

// Verificar duplicados de correo o número de identificación
router.post('/verificar-duplicado-admin', registroAdministradorControlador.verificarDuplicado);

// Procesar registro con foto de perfil
router.post('/registrar-administrador', 
    uploadPhoto.single('fotoPerfil'), // Middleware de multer para manejar el archivo
    (req, res, next) => {
        // Validar que se recibió la foto de perfil (OBLIGATORIA)
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'La foto de perfil es obligatoria'
            });
        }
        
        console.log('📸 Foto de perfil detectada para administrador, procesando...');
        
        // Validar que sea una imagen (ya validado por multer pero doble verificación)
        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validImageTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: 'Solo se permiten imágenes JPG, JPEG o PNG para la foto de perfil'
            });
        }
        
        // El tamaño ya está validado por multer (2MB)
        
        // Procesar la foto con Sharp (el buffer ya está en req.file.buffer)
        return procesarFotoPerfil(req, res, () => {
            // La foto procesada está ahora en req.fotoPerfilProcesada
            registroAdministradorControlador.registrarAdministrador(req, res);
        });
    }
);

module.exports = router;
