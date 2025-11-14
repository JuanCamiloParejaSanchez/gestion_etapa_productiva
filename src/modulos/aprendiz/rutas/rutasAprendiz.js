// src/modulos/aprendiz/rutas/rutasAprendiz.js
// Propósito: Define las rutas específicas para el módulo del aprendiz,
// como el dashboard y otras funcionalidades del perfil del aprendiz.

const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../../../compartido/middlewares/middlewareAutenticacion');
const controladorDashboardAprendiz = require('../controladores/controladorDashboardAprendiz');
const upload = require('../../../compartido/middlewares/multerConfig');
const { uploadPhoto, procesarFotoPerfil } = require('../../../compartido/middlewares/multerConfigFotos');

// Middleware de autenticación para asegurar que solo los aprendices autenticados
// puedan acceder a estas rutas.
router.use(AuthMiddleware.validarSesionAprendiz);

// --- Rutas de Dashboard y Perfil ---
router.get('/dashboard', controladorDashboardAprendiz.mostrarDashboard);
router.get('/perfil', controladorDashboardAprendiz.mostrarMiPerfil);
router.get('/perfil/editar', controladorDashboardAprendiz.mostrarFormularioEditarPerfil);
router.put('/perfil/actualizar', uploadPhoto.single('fotoPerfil'), procesarFotoPerfil, controladorDashboardAprendiz.actualizarPerfil);

// --- Endpoint AJAX para contador de alertas ---
router.get('/alertas/contador', controladorDashboardAprendiz.getContadorAlertas);

// --- Rutas de Notificaciones ---
// IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas con parámetros dinámicos (:id)
router.get('/notificaciones/contador', controladorDashboardAprendiz.getContadorNotificaciones);
router.get('/notificaciones', controladorDashboardAprendiz.obtenerNotificaciones);
router.post('/notificaciones/marcar-todas-leidas', controladorDashboardAprendiz.marcarTodasNotificacionesLeidas);
router.delete('/notificaciones/eliminar-leidas', controladorDashboardAprendiz.eliminarTodasNotificacionesLeidas);
router.post('/notificaciones/:id/marcar-leida', controladorDashboardAprendiz.marcarNotificacionLeida);
router.delete('/notificaciones/:id', controladorDashboardAprendiz.eliminarNotificacion);

// --- Rutas de Gestión de Documentos ---
router.get('/documentos', controladorDashboardAprendiz.mostrarGestionDocumentos);
router.post('/documentos/subir', upload.single('documento'), controladorDashboardAprendiz.subirDocumento);
router.get('/documentos/descargar/:nombreGuardado', controladorDashboardAprendiz.descargarDocumento);
router.post('/documentos/descargar-multiples', controladorDashboardAprendiz.descargarMultiplesDocumentos);
router.delete('/documentos/eliminar/:id', controladorDashboardAprendiz.eliminarDocumento);
router.delete('/documentos/eliminar-multiples', controladorDashboardAprendiz.eliminarMultiplesDocumentos);

// --- Rutas para la Bitácora Semanal ---

// GET: Muestra la página con el formulario para registrar la bitácora.
router.get('/bitacora', controladorDashboardAprendiz.mostrarFormularioBitacora);

// POST: Recibe y procesa los datos del formulario de la bitácora.
router.post('/bitacora', controladorDashboardAprendiz.registrarBitacora);


module.exports = router;
