// src/modulos/administrador/rutas/rutasAdministrador.js
// Propósito: Define todas las rutas relacionadas con la gestión de administradores.

const express = require('express');
const router = express.Router();
const gestionAdministradoresControlador = require('../controladores/gestionAdministradoresControlador');
const perfilAdministradorControlador = require('../controladores/perfilAdministradorControlador');

// --- Ruta del Panel Principal ---
router.get('/panel', (req, res) => {
    res.render('administrador/panelPrincipal', {
        titulo: 'Panel de Administrador',
        layout: 'plantillas/principal'
    });
});

// --- Ruta de Reportes ---
router.get('/reportes', (req, res) => {
    res.redirect('/administrador/aprendices/reportes');
});

// --- Rutas del Perfil del Administrador ---
router.get('/perfil', perfilAdministradorControlador.mostrarPerfil);
router.get('/editar-perfil', perfilAdministradorControlador.editarPerfil);
router.post('/actualizar-perfil', perfilAdministradorControlador.actualizarPerfil);

// --- Rutas CRUD para Gestión de Administradores ---
router.get('/listar-administradores', gestionAdministradoresControlador.listarAdministradores);
router.post('/administradores-data', gestionAdministradoresControlador.obtenerDatosAdministradores); // Para la tabla dinámica
router.get('/administrador/:id', gestionAdministradoresControlador.verAdministrador);
router.get('/administrador/editar/:id', gestionAdministradoresControlador.editarAdministrador);
router.post('/administrador/actualizar/:id', gestionAdministradoresControlador.actualizarAdministrador);
router.delete('/administrador/:id', gestionAdministradoresControlador.eliminarAdministrador);

module.exports = router;
