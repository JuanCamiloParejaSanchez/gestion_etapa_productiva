// src/modulos/aprendiz/rutas/rutasEtapaAprendiz.js
// Propósito: Define las rutas relacionadas con la gestión de la etapa productiva del aprendiz.
// Maneja las operaciones CRUD para la etapa productiva y la documentación asociada.

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const controladorRegistroEtapaAprendiz = require('../controladores/controladorEtapaAprendiz');
const middlewareAutenticacion = require('../../../compartido/middlewares/middlewareAutenticacion');

// Validaciones para el formulario de etapa productiva
const validacionesEtapaProductiva = [
    body('alternativaSeleccionada')
        .isIn([
            'contratoAprendizaje',
            'pasantia',
            'vinculoFormativo',
            'apoyoEntidades',
            'vinculoLaboral',
            'proyectosProductivos',
            'monitoria',
            'unidadesProductivas'
        ])
        .withMessage('Alternativa seleccionada no válida'),

    body('areaFormacion')
        .isIn(['si', 'no'])
        .withMessage('Valor no válido para área de formación'),

    body('fechaInicioProductiva')
        .optional()
        .isDate()
        .withMessage('Fecha de inicio no válida'),

    body('fechaFinProductiva')
        .optional()
        .isDate()
        .withMessage('Fecha de fin no válida'),

    body('empresaPatrocinadora')
        .optional()
        .trim()
        .isLength({ min: 3 })
        .withMessage('Nombre de empresa muy corto'),

    body('correoEmpresa')
        .optional()
        .isEmail()
        .withMessage('Correo de empresa no válido'),

    body('telefonoEmpresa')
        .optional()
        .matches(/^\d{7,10}$/)
        .withMessage('Teléfono de empresa no válido'),

    body('celularEmpresa')
        .optional()
        .matches(/^\d{10}$/)
        .withMessage('Celular de empresa no válido')
];

// Aplicar middleware de autenticación a todas las rutas
router.use(middlewareAutenticacion.validarSesionAprendiz);

// Rutas para la etapa productiva
router.get('/', (req, res) => {
    res.render('aprendiz/etapaProductiva', {
        title: 'Etapa Productiva',
        layout: 'plantillas/principal'
    });
});

router.post('/actualizar', validacionesEtapaProductiva, async (req, res) => {
    // Aquí iría la lógica para actualizar la etapa productiva
    // Esta función debería estar en un controlador separado
});

router.get('/documentos', (req, res) => {
    // Aquí iría la lógica para listar documentos
});

router.post('/documentos/subir', (req, res) => {
    // Aquí iría la lógica para subir documentos
});

module.exports = router;