// src/modulos/administrador/rutas/rutasAdministrador.js
// Propósito: Define todas las rutas relacionadas con la gestión de administradores.

const express = require('express');
const router = express.Router();
const gestionAdministradoresControlador = require('../controladores/gestionAdministradoresControlador');
const perfilAdministradorControlador = require('../controladores/perfilAdministradorControlador');
const gestionAprendicesControlador = require('../controladores/gestionAprendicesControlador');
const { uploadPhoto, procesarFotoPerfil } = require('../../../compartido/middlewares/multerConfigFotos');

// --- Ruta del Panel Principal ---
router.get('/panel-principal', gestionAprendicesControlador.mostrarPanelPrincipal);
router.get('/panel', gestionAprendicesControlador.mostrarPanelPrincipal); // Alias para compatibilidad

// --- Rutas del Perfil del Administrador ---
router.get('/perfil', perfilAdministradorControlador.mostrarPerfil);
router.get('/editar-perfil', perfilAdministradorControlador.editarPerfil);
router.post('/actualizar-perfil', 
    uploadPhoto.single('fotoPerfil'),
    (req, res, next) => {
        if (req.file) {
            return procesarFotoPerfil(req, res, () => {
                perfilAdministradorControlador.actualizarPerfil(req, res);
            });
        }
        // Si no hay archivo, continuar sin procesar foto
        perfilAdministradorControlador.actualizarPerfil(req, res);
    }
);

// --- Rutas CRUD para Gestión de Administradores ---
router.get('/listar-administradores', gestionAdministradoresControlador.listarAdministradores);
router.post('/administradores-data', gestionAdministradoresControlador.obtenerDatosAdministradores); // Para la tabla dinámica
router.get('/administrador/:id', gestionAdministradoresControlador.verAdministrador);
router.get('/administrador/editar/:id', gestionAdministradoresControlador.editarAdministrador);
router.post('/administrador/actualizar/:id',
    uploadPhoto.single('fotoPerfil'),
    (req, res, next) => {
        if (req.file) {
            return procesarFotoPerfil(req, res, () => {
                gestionAdministradoresControlador.actualizarAdministrador(req, res);
            });
        }
        // Si no hay archivo, continuar sin procesar foto
        gestionAdministradoresControlador.actualizarAdministrador(req, res);
    }
);
router.delete('/administrador/:id', gestionAdministradoresControlador.eliminarAdministrador);

module.exports = router;
