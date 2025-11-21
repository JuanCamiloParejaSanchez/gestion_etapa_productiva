// src/modulos/administrador/rutas/rutasAdministrador.js
// Propósito: Define todas las rutas relacionadas con la gestión de administradores.

const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../../../compartido/middlewares/middlewareAutenticacion');
const gestionAdministradoresControlador = require('../controladores/gestionAdministradoresControlador');
const perfilAdministradorControlador = require('../controladores/perfilAdministradorControlador');
const gestionAprendicesControlador = require('../controladores/gestionAprendicesControlador');
const chatControlador = require('../../compartido/controladores/chatControlador');
const { uploadPhoto, procesarFotoPerfil } = require('../../../compartido/middlewares/multerConfigFotos');

// Middleware de autenticación para asegurar que solo los administradores autenticados
// puedan acceder a estas rutas.
router.use(AuthMiddleware.validarSesionAdmin);

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

// --- Rutas de Chat ---
router.post('/chat/enviar', chatControlador.enviarMensaje);
router.get('/chat/mensajes', chatControlador.obtenerMensajesNoLeidos);
router.get('/chat/historial/:otroUsuarioId/:otroUsuarioTipo', chatControlador.obtenerHistorialMensajes);
router.post('/chat/mensajes/:id/marcar-leido', chatControlador.marcarMensajeLeido);
router.get('/chat/contador', chatControlador.obtenerContadorMensajes);
router.get('/chat/conversaciones', chatControlador.obtenerConversaciones);
router.delete('/chat/conversaciones/:otroUsuarioId/:otroUsuarioTipo', chatControlador.eliminarConversacion);
router.get('/chat/buscar-usuarios', chatControlador.buscarUsuarios);

module.exports = router;
