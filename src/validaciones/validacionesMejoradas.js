/* Ruta: src/validaciones/validacionesMejoradas.js */
/* Propósito: Sistema de validaciones mejorado con sanitización y seguridad */

const { body, param, query, validationResult } = require('express-validator');
const { logAudit } = require('../compartido/utilidades/logger');

// Función para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Log de errores de validación
        logAudit('validation_failed', {
            errors: errors.array(),
            ip: req.ip,
            url: req.url,
            method: req.method,
            userId: req.session?.userId,
            body: req.body
        });

        return res.status(400).json({
            error: 'Datos de entrada inválidos',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            }))
        });
    }

    next();
};

// Validaciones para autenticación
const validacionesAutenticacion = {
    login: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Correo electrónico inválido')
            .isLength({ max: 100 })
            .withMessage('El correo no puede exceder 100 caracteres'),

        body('password')
            .isLength({ min: 12, max: 128 })
            .withMessage('La contraseña debe tener entre 12 y 128 caracteres')
            .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{12,}$/)
            .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un símbolo'),

        body('role')
            .isIn(['aprendiz', 'admin'])
            .withMessage('Rol inválido')
    ],

    registroAprendiz: [
        body('nombres')
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Los nombres deben tener entre 2 y 50 caracteres')
            .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
            .withMessage('Los nombres solo pueden contener letras y espacios'),

        body('primerApellido')
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('El primer apellido debe tener entre 2 y 50 caracteres')
            .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
            .withMessage('El apellido solo puede contener letras y espacios'),

        body('segundoApellido')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('El segundo apellido no puede exceder 50 caracteres')
            .matches(/^[a-zA-ZÀ-ÿ\s]*$/)
            .withMessage('El apellido solo puede contener letras y espacios'),

        body('tipoDocumento')
            .isIn(['CC', 'TI', 'CE', 'PAS'])
            .withMessage('Tipo de documento inválido'),

        body('numeroDocumento')
            .isLength({ min: 7, max: 10 })
            .withMessage('El número de documento debe tener entre 7 y 10 dígitos')
            .isNumeric()
            .withMessage('El número de documento solo puede contener números'),

        body('fechaNacimiento')
            .isISO8601()
            .withMessage('Fecha de nacimiento inválida')
            .custom((value) => {
                const birthDate = new Date(value);
                const today = new Date();
                const age = today.getFullYear() - birthDate.getFullYear();
                if (age < 14 || age > 100) {
                    throw new Error('La edad debe estar entre 14 y 100 años');
                }
                return true;
            }),

        body('correoElectronico')
            .isEmail()
            .normalizeEmail()
            .withMessage('Correo electrónico inválido')
            .isLength({ max: 100 })
            .withMessage('El correo no puede exceder 100 caracteres'),

        body('telefonoFijo')
            .optional()
            .matches(/^(\+57|57)?[0-9]{7,10}$/)
            .withMessage('Teléfono fijo inválido'),

        body('celular')
            .matches(/^(\+57|57)?[0-9]{10}$/)
            .withMessage('Número de celular inválido'),

        body('departamento')
            .isLength({ min: 2, max: 50 })
            .withMessage('Departamento inválido'),

        body('municipio')
            .isLength({ min: 2, max: 50 })
            .withMessage('Municipio inválido'),

        body('direccion')
            .trim()
            .isLength({ min: 10, max: 200 })
            .withMessage('La dirección debe tener entre 10 y 200 caracteres'),

        body('programaFormacion')
            .isIn(['tecnoActividadFisica', 'tecnoEntrenamientoDeportivo', 'tecnoAnalisisDesarrollo', 'tecProcesamientoPruebas', 'tecProgramacion'])
            .withMessage('Programa de formación inválido'),

        body('alternativaSeleccionada')
            .optional()
            .isIn(['contratoAprendizaje', 'pasantia', 'vinculoFormativo', 'apoyoEntidades', 'vinculoLaboral', 'proyectosProductivos', 'monitoria', 'unidadesProductivas'])
            .withMessage('Alternativa de etapa productiva inválida')
    ],

    crearPassword: [
        body('password')
            .isLength({ min: 12, max: 128 })
            .withMessage('La contraseña debe tener entre 12 y 128 caracteres')
            .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{12,}$/)
            .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un símbolo'),

        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Las contraseñas no coinciden');
                }
                return true;
            }),

        body('correoElectronico')
            .isEmail()
            .normalizeEmail()
            .withMessage('Correo electrónico inválido')
    ],

    resetPassword: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Correo electrónico inválido'),

        body('codigo')
            .isLength({ min: 6, max: 6 })
            .withMessage('Código de verificación inválido')
            .matches(/^[0-9]+$/)
            .withMessage('El código debe contener solo números'),

        body('password')
            .isLength({ min: 12, max: 128 })
            .withMessage('La contraseña debe tener entre 12 y 128 caracteres')
            .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{12,}$/)
            .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un símbolo'),

        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Las contraseñas no coinciden');
                }
                return true;
            })
    ]
};

// Validaciones para gestión de aprendices
const validacionesGestionAprendices = {
    actualizarAprendiz: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID de aprendiz inválido'),

        body('nombres')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Los nombres deben tener entre 2 y 50 caracteres')
            .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
            .withMessage('Los nombres solo pueden contener letras y espacios'),

        body('primerApellido')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('El primer apellido debe tener entre 2 y 50 caracteres')
            .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
            .withMessage('El apellido solo puede contener letras y espacios'),

        body('correoElectronico')
            .optional()
            .isEmail()
            .normalizeEmail()
            .withMessage('Correo electrónico inválido'),

        body('telefonoFijo')
            .optional()
            .matches(/^(\+57|57)?[0-9]{7,10}$/)
            .withMessage('Teléfono fijo inválido'),

        body('celular')
            .optional()
            .matches(/^(\+57|57)?[0-9]{10}$/)
            .withMessage('Número de celular inválido'),

        body('programaFormacion')
            .optional()
            .isIn(['tecnoActividadFisica', 'tecnoEntrenamientoDeportivo', 'tecnoAnalisisDesarrollo', 'tecProcesamientoPruebas', 'tecProgramacion'])
            .withMessage('Programa de formación inválido')
    ],

    obtenerDatosAprendices: [
        query('draw')
            .optional()
            .isInt()
            .withMessage('Parámetro draw inválido'),

        query('start')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Parámetro start inválido'),

        query('length')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Parámetro length debe estar entre 1 y 100'),

        query('nombre')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Nombre demasiado largo'),

        query('documento')
            .optional()
            .trim()
            .isLength({ max: 20 })
            .withMessage('Número de documento demasiado largo'),

        query('programaFormacion')
            .optional()
            .isIn(['tecnoActividadFisica', 'tecnoEntrenamientoDeportivo', 'tecnoAnalisisDesarrollo', 'tecProcesamientoPruebas', 'tecProgramacion'])
            .withMessage('Programa de formación inválido'),

        query('alternativaSeleccionada')
            .optional()
            .isIn(['contratoAprendizaje', 'pasantia', 'vinculoFormativo', 'apoyoEntidades', 'vinculoLaboral', 'proyectosProductivos', 'monitoria', 'unidadesProductivas'])
            .withMessage('Alternativa inválida'),

        query('order.*.column')
            .optional()
            .isInt({ min: 0, max: 32 })
            .withMessage('Columna de ordenamiento inválida'),

        query('order.*.dir')
            .optional()
            .isIn(['asc', 'desc'])
            .withMessage('Dirección de ordenamiento inválida'),

        query('tableType')
            .optional()
            .isIn(['listarAprendices', 'docsPendientes'])
            .withMessage('Tipo de tabla inválido')
    ]
};

// Validaciones para registro de administradores
const validacionesAdministradores = {
    registroAdmin: [
        body('nombreCompleto')
            .trim()
            .isLength({ min: 5, max: 100 })
            .withMessage('El nombre completo debe tener entre 5 y 100 caracteres')
            .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
            .withMessage('El nombre solo puede contener letras y espacios'),

        body('correoInstitucional')
            .isEmail()
            .normalizeEmail()
            .withMessage('Correo institucional inválido')
            .matches(/@sena\.edu\.co$/)
            .withMessage('Debe usar un correo institucional del SENA')
            .isLength({ max: 100 })
            .withMessage('El correo no puede exceder 100 caracteres'),

        body('numeroIdentificacion')
            .isLength({ min: 5, max: 20 })
            .withMessage('Número de identificación inválido')
            .matches(/^[0-9]+$/)
            .withMessage('El número de identificación solo puede contener números'),

        body('telefono')
            .matches(/^(\+57|57)?[0-9]{7,10}$/)
            .withMessage('Teléfono inválido'),

        body('departamento')
            .optional()
            .isLength({ min: 2, max: 50 })
            .withMessage('Departamento inválido'),

        body('cargo')
            .trim()
            .isLength({ min: 3, max: 100 })
            .withMessage('El cargo debe tener entre 3 y 100 caracteres'),

        body('password')
            .isLength({ min: 12, max: 128 })
            .withMessage('La contraseña debe tener entre 12 y 128 caracteres')
            .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{12,}$/)
            .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un símbolo')
    ]
};

// Validaciones para bitácoras
const validacionesBitacoras = {
    registrarBitacora: [
        body('contenido')
            .trim()
            .isLength({ min: 50, max: 5000 })
            .withMessage('El contenido debe tener entre 50 y 5000 caracteres')
            .custom((value) => {
                // Verificar que no contenga scripts maliciosos
                const dangerousPatterns = [
                    /<script/i,
                    /javascript:/i,
                    /vbscript:/i,
                    /onload=/i,
                    /onerror=/i
                ];

                if (dangerousPatterns.some(pattern => pattern.test(value))) {
                    throw new Error('El contenido contiene elementos no permitidos');
                }

                return true;
            }),

        body('fechaRegistro')
            .isISO8601()
            .withMessage('Fecha de registro inválida')
            .custom((value) => {
                const registroDate = new Date(value);
                const now = new Date();
                const diffTime = Math.abs(now - registroDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 30) {
                    throw new Error('La fecha de registro no puede ser anterior a 30 días');
                }

                return true;
            })
    ],

    aprobarBitacora: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID de bitácora inválido'),

        body('comentariosInstructor')
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage('Los comentarios no pueden exceder 1000 caracteres')
    ]
};

// Validaciones para documentos
const validacionesDocumentos = {
    subirDocumento: [
        body('tipoDocumento')
            .isIn([
                'Bitácora 1', 'Bitácora 2', 'Bitácora 3', 'Bitácora 4', 'Bitácora 5',
                'Bitácora 6', 'Bitácora 7', 'Bitácora 8', 'Bitácora 9', 'Bitácora 10',
                'Bitácora 11', 'Bitácora 12', 'Propuesta de intervención', 'Diagnóstico',
                'GFPI-F-023 V5', 'Informe final', 'Carta de certificación', 'Documento de identidad'
            ])
            .withMessage('Tipo de documento inválido'),

        body('descripcion')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('La descripción no puede exceder 500 caracteres')
    ]
};

// Función para sanitizar datos de entrada
const sanitizarEntrada = (req, res, next) => {
    // Sanitizar strings
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;

        return str
            .trim()
            .replace(/[<>\"'&]/g, '') // Remover caracteres HTML básicos
            .substring(0, 10000); // Limitar longitud
    };

    // Recursivamente sanitizar objetos
    const sanitizeObject = (obj) => {
        if (typeof obj === 'string') {
            return sanitizeString(obj);
        } else if (Array.isArray(obj)) {
            return obj.map(sanitizeObject).slice(0, 100);
        } else if (typeof obj === 'object' && obj !== null) {
            const sanitized = {};
            Object.keys(obj).slice(0, 50).forEach(key => {
                if (key.length <= 100) {
                    sanitized[key] = sanitizeObject(obj[key]);
                }
            });
            return sanitized;
        }
        return obj;
    };

    // Aplicar sanitización
    if (req.body) req.body = sanitizeObject(req.body);
    if (req.query) req.query = sanitizeObject(req.query);
    if (req.params) req.params = sanitizeObject(req.params);

    next();
};

// Función para validar archivos subidos
const validarArchivo = (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const file = req.file;
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB

    // Validar tipo MIME
    if (!allowedTypes.includes(file.mimetype)) {
        logAudit('invalid_file_type', {
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            ip: req.ip,
            userId: req.session?.userId
        });

        return res.status(400).json({
            error: 'Tipo de archivo no permitido. Solo se permiten PDF, DOC, DOCX, XLS y XLSX.'
        });
    }

    // Validar tamaño
    if (file.size > maxSize) {
        logAudit('file_too_large', {
            filename: file.originalname,
            size: file.size,
            maxSize,
            ip: req.ip,
            userId: req.session?.userId
        });

        return res.status(400).json({
            error: 'El archivo es demasiado grande. Máximo 10MB permitido.'
        });
    }

    // Validar nombre de archivo
    const dangerousPatterns = /[<>:"\/\\|?*\x00-\x1f]/;
    if (dangerousPatterns.test(file.originalname)) {
        logAudit('dangerous_filename', {
            filename: file.originalname,
            ip: req.ip,
            userId: req.session?.userId
        });

        return res.status(400).json({
            error: 'Nombre de archivo inválido.'
        });
    }

    next();
};

module.exports = {
    handleValidationErrors,
    sanitizarEntrada,
    validarArchivo,
    validacionesAutenticacion,
    validacionesGestionAprendices,
    validacionesAdministradores,
    validacionesBitacoras,
    validacionesDocumentos
};