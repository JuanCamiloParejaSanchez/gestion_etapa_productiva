// src/modulos/administrador/rutas/rutasGestionAprendices.js
// Propósito: Define todas las rutas relacionadas con la gestión de aprendices por parte del administrador.

const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const gestionAprendicesControlador = require('../controladores/gestionAprendicesControlador');
const controladorAlertas = require('../../../compartido/controladores/controladorAlertas');
// NOTA: No necesitamos el middleware aquí, se aplica globalmente en servidor.js

// Configuración de multer para archivos adjuntos en notificaciones
const storageAdjuntos = multer.diskStorage({
    destination: (req, file, cb) => {
        // Usar process.cwd() para asegurar que apunte a la raíz del proyecto
        const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'adjuntos');
        console.log('Directorio de destino para adjuntos (cwd):', uploadPath);
        console.log('process.cwd():', process.cwd());
        // Crear directorio si no existe
        const fs = require('fs');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
            console.log('Directorio creado:', uploadPath);
        } else {
            console.log('Directorio ya existe:', uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = 'adjunto-' + uniqueSuffix + path.extname(file.originalname);
        console.log('Nombre de archivo generado:', filename);
        cb(null, filename);
    }
});

// Filtro para validar tipos de archivo
const fileFilterAdjuntos = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'image/jpeg', 'image/png', 'image/jpg', 'application/zip'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo se permiten PDF, DOC, DOCX, imágenes y ZIP.'), false);
    }
};

const uploadAdjunto = multer({
    storage: storageAdjuntos,
    fileFilter: fileFilterAdjuntos,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB máximo
    }
});

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
router.post('/documentos/:id/aprobar', uploadAdjunto.single('archivoAdjunto'), gestionAprendicesControlador.aprobarDocumento);
router.post('/documentos/:id/rechazar', gestionAprendicesControlador.rechazarDocumento);

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

// --- Ruta para Opciones de Filtros ---
router.get('/opciones-filtros', gestionAprendicesControlador.obtenerOpcionesFiltros);

module.exports = router;
