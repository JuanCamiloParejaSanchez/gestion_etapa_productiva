// Ruta: src/modulos/aprendiz/rutas/rutasRegistroAprendiz.js
// Propósito: Define las rutas relacionadas con el registro y autenticación de aprendices.

const express = require('express');
const router = express.Router();
const path = require('path');
const registroAprendizControlador = require('../controladores/controladorRegistroAprendiz');
const autenticacionControlador = require('../../compartido/controladores/controladorAutenticacionGeneral');
const AuthMiddleware = require('../../../compartido/middlewares/middlewareAutenticacion');
const opcionesFormularioServicio = require('../../../compartido/servicios/opcionesFormularioServicio');

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
router.post('/registrar-aprendiz', (req, res) => {
    console.log('Ruta /registrar-aprendiz alcanzada');
    registroAprendizControlador.registrarAprendiz(req, res);
});

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