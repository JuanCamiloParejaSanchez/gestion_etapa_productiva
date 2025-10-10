// src/modulos/administrador/rutas/rutasGestionAprendices.js
// Propósito: Define todas las rutas relacionadas con la gestión de aprendices por parte del administrador.

const express = require('express');
const router = express.Router();
const path = require('path');
const gestionAprendicesControlador = require('../controladores/gestionAprendicesControlador');
const controladorAlertas = require('../../../compartido/controladores/controladorAlertas');
// NOTA: No necesitamos el middleware aquí, se aplica globalmente en servidor.js

// --- Rutas del Panel y Reportes ---
// CORRECCIÓN: Se mueve la lógica del panel principal al controlador para mantener la consistencia.
router.get('/panel-principal', gestionAprendicesControlador.mostrarPanelPrincipal);
router.get('/panel', gestionAprendicesControlador.mostrarPanelPrincipal); // Alias para panel-principal
router.get('/reportes', gestionAprendicesControlador.mostrarPaginaReportes);

// --- Rutas CRUD para Gestión de Aprendices ---
router.get('/listar-aprendices', gestionAprendicesControlador.listarAprendices);
router.post('/aprendices-data', gestionAprendicesControlador.obtenerDatosAprendices); // Para la tabla dinámica
router.get('/aprendiz/:id', gestionAprendicesControlador.verAprendiz);
router.get('/aprendiz/editar/:id', gestionAprendicesControlador.editarAprendiz);
router.post('/aprendiz/actualizar/:id', gestionAprendicesControlador.actualizarAprendiz);
router.delete('/aprendiz/:id', gestionAprendicesControlador.eliminarAprendiz);

// --- Ruta para Documentación ---
router.get('/aprendiz/verificar-documentacion/:id', gestionAprendicesControlador.verificarDocumentacion);
router.get('/aprendiz/:id/documentos', gestionAprendicesControlador.obtenerDocumentosAprendiz);

// --- Ruta para Bitácoras ---
router.get('/aprendiz/:id/bitacoras', gestionAprendicesControlador.mostrarBitacorasDeAprendiz);
router.get('/aprendiz/:id/bitacoras-data', gestionAprendicesControlador.obtenerBitacorasData);

// --- Ruta para Alertas ---
router.get('/alertas/:tipo', controladorAlertas.verAlertasPorTipo);
// Nuevo endpoint para documentos pendientes de un aprendiz
router.get('/alertas/documentos-pendientes/:id', controladorAlertas.obtenerDocumentosPendientes);

// --- Ruta para Datos Auxiliares ---
router.get('/data/ubicaciones', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../data/colombia.json'));
});

module.exports = router;
