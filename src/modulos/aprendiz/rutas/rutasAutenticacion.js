// Ruta: src/modulos/aprendiz/rutas/rutasAutenticacion.js
// Propósito: Define las rutas para la autenticación de usuarios

const express = require('express');
const router = express.Router();
const controladorAutenticacionGeneral = require('../../compartido/controladores/controladorAutenticacionGeneral');
const controladorRecuperacion = require('../controladores/controladorRecuperacion');
const AuthMiddleware = require('../../../compartido/middlewares/middlewareAutenticacion');

// Rutas de login
router.get('/login', AuthMiddleware.validarNoAutenticado, controladorAutenticacionGeneral.mostrarLogin);
router.post('/login', AuthMiddleware.validarNoAutenticado, controladorAutenticacionGeneral.iniciarSesion);
router.get('/logout', AuthMiddleware.validarAutenticado, controladorAutenticacionGeneral.cerrarSesion);

// ✨ --- RUTA AÑADIDA PARA CREAR ADMINS TEMPORALMENTE --- ✨
router.post('/admin/register-temp', controladorAutenticacionGeneral.registrarAdminTemporal);

// Rutas de recuperación de contraseña
router.get('/recuperar-contrasena',
    AuthMiddleware.validarNoAutenticado,
    controladorRecuperacion.mostrarFormularioRecuperar
);

router.post('/recuperar-contrasena',
    AuthMiddleware.validarNoAutenticado,
    controladorRecuperacion.solicitarRecuperacion
);

router.get('/reset-password/:token',
    AuthMiddleware.validarNoAutenticado,
    controladorRecuperacion.mostrarFormularioReset
);

router.post('/reset-password',
    AuthMiddleware.validarNoAutenticado,
    controladorRecuperacion.resetPassword
);

module.exports = router;