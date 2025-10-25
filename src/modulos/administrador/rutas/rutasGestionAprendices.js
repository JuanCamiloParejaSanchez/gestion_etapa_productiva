// src/modulos/administrador/rutas/rutasGestionAprendices.js
// Propósito: Define todas las rutas relacionadas con la gestión de aprendices por parte del administrador.

const express = require('express');
const router = express.Router();
const path = require('path');
const gestionAprendicesControlador = require('../controladores/gestionAprendicesControlador');
const controladorAlertas = require('../../../compartido/controladores/controladorAlertas');
// NOTA: No necesitamos el middleware aquí, se aplica globalmente en servidor.js

// --- Rutas del Panel y Reportes ---
router.get('/reportes', gestionAprendicesControlador.mostrarPaginaReportes);

// --- Rutas de Exportación de Reportes ---
router.get('/reportes/exportar/programas', gestionAprendicesControlador.exportarProgramasExcel);
router.get('/reportes/exportar/estados', gestionAprendicesControlador.exportarEstadosExcel);
router.get('/reportes/exportar/alternativas', gestionAprendicesControlador.exportarAlternativasExcel);
router.get('/reportes/exportar/documentos', gestionAprendicesControlador.exportarDocumentosExcel);
router.get('/reportes/exportar/seguimiento', gestionAprendicesControlador.exportarSeguimientoExcel);
router.get('/reportes/exportar/completo', gestionAprendicesControlador.exportarReporteCompletoExcel);

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
