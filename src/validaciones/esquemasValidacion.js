// src/validaciones/esquemasValidacion.js
// Propósito: Esquemas de validación centralizados usando Joi

const Joi = require('joi');

/**
 * Función para validar datos usando un esquema Joi
 * @param {Object} data - Datos a validar
 * @param {Object} schema - Esquema Joi
 * @returns {Object} - { valido: boolean, errores: Array, datos: Object }
 */
function validarDatos(data, schema) {
    try {
        const { error, value } = schema.validate(data, { abortEarly: false });
        if (error) {
            return {
                valido: false,
                errores: error.details.map(detail => ({
                    campo: detail.path.join('.'),
                    mensaje: detail.message
                })),
                datos: null
            };
        }
        return {
            valido: true,
            errores: [],
            datos: value
        };
    } catch (error) {
        console.error('Error en validación:', error);
        return {
            valido: false,
            errores: [{ campo: 'general', mensaje: 'Error interno de validación' }],
            datos: null
        };
    }
}

// Esquemas de validación para aprendices
const aprendizSchemas = {
    // Validación para registro inicial de aprendiz
    registro: Joi.object({
        tipoDocumento: Joi.string()
            .valid('CC', 'TI', 'CE', 'PAS')
            .required()
            .messages({
                'any.only': 'Tipo de documento debe ser CC, TI, CE o PAS',
                'any.required': 'Tipo de documento es requerido'
            }),

        numeroDocumento: Joi.string()
            .min(5)
            .max(20)
            .pattern(/^[0-9A-Za-z]+$/)
            .required()
            .messages({
                'string.min': 'Número de documento debe tener al menos 5 caracteres',
                'string.max': 'Número de documento no puede exceder 20 caracteres',
                'string.pattern.base': 'Número de documento solo puede contener letras y números',
                'any.required': 'Número de documento es requerido'
            }),

        nombres: Joi.string()
            .min(2)
            .max(100)
            .pattern(/^[a-zA-ZÀ-ÿ\s]+$/)
            .required()
            .messages({
                'string.min': 'Los nombres deben tener al menos 2 caracteres',
                'string.max': 'Los nombres no pueden exceder 100 caracteres',
                'string.pattern.base': 'Los nombres solo pueden contener letras y espacios',
                'any.required': 'Los nombres son requeridos'
            }),

        primerApellido: Joi.string()
            .min(2)
            .max(50)
            .pattern(/^[a-zA-ZÀ-ÿ\s]+$/)
            .required()
            .messages({
                'string.min': 'El primer apellido debe tener al menos 2 caracteres',
                'string.max': 'El primer apellido no puede exceder 50 caracteres',
                'string.pattern.base': 'El primer apellido solo puede contener letras y espacios',
                'any.required': 'El primer apellido es requerido'
            }),

        segundoApellido: Joi.string()
            .min(2)
            .max(50)
            .pattern(/^[a-zA-ZÀ-ÿ\s]+$/)
            .allow('')
            .optional()
            .messages({
                'string.min': 'El segundo apellido debe tener al menos 2 caracteres',
                'string.max': 'El segundo apellido no puede exceder 50 caracteres',
                'string.pattern.base': 'El segundo apellido solo puede contener letras y espacios'
            }),

        fechaNacimiento: Joi.date()
            .iso()
            .max('now')
            .min(new Date(Date.now() - 100 * 365 * 24 * 60 * 60 * 1000)) // Máximo 100 años
            .required()
            .messages({
                'date.max': 'La fecha de nacimiento no puede ser futura',
                'date.min': 'La fecha de nacimiento parece incorrecta',
                'date.format.iso': 'Formato de fecha inválido (debe ser ISO)',
                'any.required': 'Fecha de nacimiento es requerida'
            }),

        eps: Joi.string()
            .min(2)
            .max(100)
            .required()
            .messages({
                'string.min': 'EPS debe tener al menos 2 caracteres',
                'string.max': 'EPS no puede exceder 100 caracteres',
                'any.required': 'EPS es requerida'
            }),

        telefonoFijo: Joi.string()
            .pattern(/^[0-9+\-\s()]+$/)
            .min(7)
            .max(20)
            .allow('')
            .optional()
            .messages({
                'string.pattern.base': 'Formato de teléfono fijo inválido',
                'string.min': 'Teléfono fijo debe tener al menos 7 caracteres',
                'string.max': 'Teléfono fijo no puede exceder 20 caracteres'
            }),

        celular: Joi.string()
            .pattern(/^[0-9+\-\s()]+$/)
            .min(10)
            .max(20)
            .required()
            .messages({
                'string.pattern.base': 'Formato de celular inválido',
                'string.min': 'Celular debe tener al menos 10 caracteres',
                'string.max': 'Celular no puede exceder 20 caracteres',
                'any.required': 'Celular es requerido'
            }),

        direccion: Joi.string()
            .min(10)
            .max(200)
            .required()
            .messages({
                'string.min': 'Dirección debe tener al menos 10 caracteres',
                'string.max': 'Dirección no puede exceder 200 caracteres',
                'any.required': 'Dirección es requerida'
            }),

        barrio: Joi.string()
            .min(2)
            .max(100)
            .required()
            .messages({
                'string.min': 'Barrio debe tener al menos 2 caracteres',
                'string.max': 'Barrio no puede exceder 100 caracteres',
                'any.required': 'Barrio es requerido'
            }),

        departamento: Joi.string()
            .min(2)
            .max(50)
            .required()
            .messages({
                'string.min': 'Departamento debe tener al menos 2 caracteres',
                'string.max': 'Departamento no puede exceder 50 caracteres',
                'any.required': 'Departamento es requerido'
            }),

        municipio: Joi.string()
            .min(2)
            .max(50)
            .required()
            .messages({
                'string.min': 'Municipio debe tener al menos 2 caracteres',
                'string.max': 'Municipio no puede exceder 50 caracteres',
                'any.required': 'Municipio es requerido'
            }),

        correoElectronico: Joi.string()
            .email()
            .max(100)
            .required()
            .messages({
                'string.email': 'Formato de correo electrónico inválido',
                'string.max': 'Correo electrónico no puede exceder 100 caracteres',
                'any.required': 'Correo electrónico es requerido'
            }),

        fechaInicioFormacion: Joi.date()
            .iso()
            .max('now')
            .required()
            .messages({
                'date.max': 'Fecha de inicio de formación no puede ser futura',
                'date.format.iso': 'Formato de fecha inválido',
                'any.required': 'Fecha de inicio de formación es requerida'
            }),

        fechaInicioLectiva: Joi.date()
            .iso()
            .max('now')
            .required()
            .messages({
                'date.max': 'Fecha de inicio lectiva no puede ser futura',
                'date.format.iso': 'Formato de fecha inválido',
                'any.required': 'Fecha de inicio lectiva es requerida'
            }),

        fechaFinLectiva: Joi.date()
            .iso()
            .when('fechaInicioLectiva', {
                is: Joi.exist(),
                then: Joi.date().greater(Joi.ref('fechaInicioLectiva'))
            })
            .required()
            .messages({
                'date.greater': 'Fecha de fin lectiva debe ser posterior a fecha de inicio',
                'date.format.iso': 'Formato de fecha inválido',
                'any.required': 'Fecha de fin lectiva es requerida'
            }),

        fechaInicioProductiva: Joi.date()
            .iso()
            .when('fechaFinLectiva', {
                is: Joi.exist(),
                then: Joi.date().min(Joi.ref('fechaFinLectiva'))
            })
            .required()
            .messages({
                'date.min': 'Fecha de inicio productiva debe ser posterior o igual a fecha de fin lectiva',
                'date.format.iso': 'Formato de fecha inválido',
                'any.required': 'Fecha de inicio productiva es requerida'
            }),

        fechaFinProductiva: Joi.date()
            .iso()
            .when('fechaInicioProductiva', {
                is: Joi.exist(),
                then: Joi.date().greater(Joi.ref('fechaInicioProductiva'))
            })
            .required()
            .messages({
                'date.greater': 'Fecha de fin productiva debe ser posterior a fecha de inicio',
                'date.format.iso': 'Formato de fecha inválido',
                'any.required': 'Fecha de fin productiva es requerida'
            }),

        instructorLectiva: Joi.string()
            .min(5)
            .max(100)
            .required()
            .messages({
                'string.min': 'Instructor lectiva debe tener al menos 5 caracteres',
                'string.max': 'Instructor lectiva no puede exceder 100 caracteres',
                'any.required': 'Instructor lectiva es requerido'
            }),

        instructorProductiva: Joi.string()
            .min(5)
            .max(100)
            .required()
            .messages({
                'string.min': 'Instructor productiva debe tener al menos 5 caracteres',
                'string.max': 'Instructor productiva no puede exceder 100 caracteres',
                'any.required': 'Instructor productiva es requerido'
            }),

        numeroFicha: Joi.string()
            .pattern(/^[0-9]+$/)
            .min(4)
            .max(20)
            .required()
            .messages({
                'string.pattern.base': 'Número de ficha debe contener solo números',
                'string.min': 'Número de ficha debe tener al menos 4 caracteres',
                'string.max': 'Número de ficha no puede exceder 20 caracteres',
                'any.required': 'Número de ficha es requerido'
            }),

        programaFormacion: Joi.string()
            .valid('tecnoActividadFisica', 'tecnoEntrenamientoDeportivo', 'tecnoAnalisisDesarrollo', 'tecProcesamientoPruebas', 'tecProgramacion')
            .required()
            .messages({
                'any.only': 'Programa de formación inválido',
                'any.required': 'Programa de formación es requerido'
            }),

        alternativaSeleccionada: Joi.string()
            .valid('contratoAprendizaje', 'pasantia', 'apoyoEntidades', 'vinculoLaboral', 'proyectosProductivos', 'monitoria', 'unidadesProductivas')
            .required()
            .messages({
                'any.only': 'Alternativa de etapa productiva inválida',
                'any.required': 'Alternativa de etapa productiva es requerida'
            }),

        areaFormacion: Joi.string()
            .min(2)
            .max(100)
            .required()
            .messages({
                'string.min': 'Área de formación debe tener al menos 2 caracteres',
                'string.max': 'Área de formación no puede exceder 100 caracteres',
                'any.required': 'Área de formación es requerida'
            }),

        empresaPatrocinadora: Joi.string()
            .min(2)
            .max(100)
            .required()
            .messages({
                'string.min': 'Empresa patrocinadora debe tener al menos 2 caracteres',
                'string.max': 'Empresa patrocinadora no puede exceder 100 caracteres',
                'any.required': 'Empresa patrocinadora es requerida'
            }),

        areaPractica: Joi.string()
            .min(2)
            .max(100)
            .required()
            .messages({
                'string.min': 'Área de práctica debe tener al menos 2 caracteres',
                'string.max': 'Área de práctica no puede exceder 100 caracteres',
                'any.required': 'Área de práctica es requerida'
            }),

        jefeInmediato: Joi.string()
            .min(5)
            .max(100)
            .required()
            .messages({
                'string.min': 'Jefe inmediato debe tener al menos 5 caracteres',
                'string.max': 'Jefe inmediato no puede exceder 100 caracteres',
                'any.required': 'Jefe inmediato es requerido'
            }),

        telefonoEmpresa: Joi.string()
            .pattern(/^[0-9+\-\s()]+$/)
            .min(7)
            .max(20)
            .required()
            .messages({
                'string.pattern.base': 'Formato de teléfono empresa inválido',
                'string.min': 'Teléfono empresa debe tener al menos 7 caracteres',
                'string.max': 'Teléfono empresa no puede exceder 20 caracteres',
                'any.required': 'Teléfono empresa es requerido'
            }),

        celularEmpresa: Joi.string()
            .pattern(/^[0-9+\-\s()]+$/)
            .min(10)
            .max(20)
            .required()
            .messages({
                'string.pattern.base': 'Formato de celular empresa inválido',
                'string.min': 'Celular empresa debe tener al menos 10 caracteres',
                'string.max': 'Celular empresa no puede exceder 20 caracteres',
                'any.required': 'Celular empresa es requerido'
            }),

        direccionEmpresa: Joi.string()
            .min(10)
            .max(200)
            .required()
            .messages({
                'string.min': 'Dirección empresa debe tener al menos 10 caracteres',
                'string.max': 'Dirección empresa no puede exceder 200 caracteres',
                'any.required': 'Dirección empresa es requerida'
            }),

        correoEmpresa: Joi.string()
            .email()
            .max(100)
            .required()
            .messages({
                'string.email': 'Formato de correo empresa inválido',
                'string.max': 'Correo empresa no puede exceder 100 caracteres',
                'any.required': 'Correo empresa es requerido'
            }),

        horario: Joi.string()
            .min(5)
            .max(100)
            .required()
            .messages({
                'string.min': 'Horario debe tener al menos 5 caracteres',
                'string.max': 'Horario no puede exceder 100 caracteres',
                'any.required': 'Horario es requerido'
            })
    }),

    // Validación para actualización de perfil de aprendiz
    actualizarPerfil: Joi.object({
        celular: Joi.string()
            .pattern(/^[0-9+\-\s()]+$/)
            .min(10)
            .max(20)
            .required()
            .messages({
                'string.pattern.base': 'Formato de celular inválido',
                'string.min': 'Celular debe tener al menos 10 caracteres',
                'string.max': 'Celular no puede exceder 20 caracteres',
                'any.required': 'Celular es requerido'
            }),

        direccion: Joi.string()
            .min(10)
            .max(200)
            .required()
            .messages({
                'string.min': 'Dirección debe tener al menos 10 caracteres',
                'string.max': 'Dirección no puede exceder 200 caracteres',
                'any.required': 'Dirección es requerida'
            }),

        barrio: Joi.string()
            .min(2)
            .max(100)
            .required()
            .messages({
                'string.min': 'Barrio debe tener al menos 2 caracteres',
                'string.max': 'Barrio no puede exceder 100 caracteres',
                'any.required': 'Barrio es requerido'
            }),

        departamento: Joi.string()
            .min(2)
            .max(50)
            .required()
            .messages({
                'string.min': 'Departamento debe tener al menos 2 caracteres',
                'string.max': 'Departamento no puede exceder 50 caracteres',
                'any.required': 'Departamento es requerido'
            }),

        municipio: Joi.string()
            .min(2)
            .max(50)
            .required()
            .messages({
                'string.min': 'Municipio debe tener al menos 2 caracteres',
                'string.max': 'Municipio no puede exceder 50 caracteres',
                'any.required': 'Municipio es requerido'
            })
    }),

    // Validación para bitácoras semanales
    bitacora: Joi.object({
        respuestaDesafio: Joi.string()
            .min(50)
            .max(2000)
            .required()
            .messages({
                'string.min': 'La respuesta del desafío debe tener al menos 50 caracteres',
                'string.max': 'La respuesta del desafío no puede exceder 2000 caracteres',
                'any.required': 'La respuesta del desafío es requerida'
            }),

        respuestaLogro: Joi.string()
            .min(50)
            .max(2000)
            .required()
            .messages({
                'string.min': 'La respuesta del logro debe tener al menos 50 caracteres',
                'string.max': 'La respuesta del logro no puede exceder 2000 caracteres',
                'any.required': 'La respuesta del logro es requerida'
            }),

        respuestaComunicacion: Joi.string()
            .min(50)
            .max(2000)
            .required()
            .messages({
                'string.min': 'La respuesta de comunicación debe tener al menos 50 caracteres',
                'string.max': 'La respuesta de comunicación no puede exceder 2000 caracteres',
                'any.required': 'La respuesta de comunicación es requerida'
            })
    })
};

// Esquemas de validación para administradores
const administradorSchemas = {
    // Validación para registro de administrador
    registro: Joi.object({
        nombreCompleto: Joi.string()
            .min(5)
            .max(100)
            .pattern(/^[a-zA-ZÀ-ÿ\s]+$/)
            .required()
            .messages({
                'string.min': 'Nombre completo debe tener al menos 5 caracteres',
                'string.max': 'Nombre completo no puede exceder 100 caracteres',
                'string.pattern.base': 'Nombre completo solo puede contener letras y espacios',
                'any.required': 'Nombre completo es requerido'
            }),

        correoInstitucional: Joi.string()
            .email()
            .pattern(/@sena\.edu\.co$/)
            .max(100)
            .required()
            .messages({
                'string.email': 'Formato de correo institucional inválido',
                'string.pattern.base': 'Debe ser un correo institucional del SENA (@sena.edu.co)',
                'string.max': 'Correo institucional no puede exceder 100 caracteres',
                'any.required': 'Correo institucional es requerido'
            }),

        numeroIdentificacion: Joi.string()
            .min(5)
            .max(20)
            .pattern(/^[0-9A-Za-z]+$/)
            .required()
            .messages({
                'string.min': 'Número de identificación debe tener al menos 5 caracteres',
                'string.max': 'Número de identificación no puede exceder 20 caracteres',
                'string.pattern.base': 'Número de identificación solo puede contener letras y números',
                'any.required': 'Número de identificación es requerido'
            }),

        telefono: Joi.string()
            .pattern(/^[0-9+\-\s()]+$/)
            .min(7)
            .max(20)
            .required()
            .messages({
                'string.pattern.base': 'Formato de teléfono inválido',
                'string.min': 'Teléfono debe tener al menos 7 caracteres',
                'string.max': 'Teléfono no puede exceder 20 caracteres',
                'any.required': 'Teléfono es requerido'
            }),

        departamento: Joi.string()
            .min(2)
            .max(50)
            .required()
            .messages({
                'string.min': 'Departamento debe tener al menos 2 caracteres',
                'string.max': 'Departamento no puede exceder 50 caracteres',
                'any.required': 'Departamento es requerido'
            }),

        cargo: Joi.string()
            .min(3)
            .max(50)
            .required()
            .messages({
                'string.min': 'Cargo debe tener al menos 3 caracteres',
                'string.max': 'Cargo no puede exceder 50 caracteres',
                'any.required': 'Cargo es requerido'
            })
    }),

    // Validación para actualización de perfil de administrador
    actualizarPerfil: Joi.object({
        nombreCompleto: Joi.string()
            .min(5)
            .max(100)
            .pattern(/^[a-zA-ZÀ-ÿ\s]+$/)
            .required()
            .messages({
                'string.min': 'Nombre completo debe tener al menos 5 caracteres',
                'string.max': 'Nombre completo no puede exceder 100 caracteres',
                'string.pattern.base': 'Nombre completo solo puede contener letras y espacios',
                'any.required': 'Nombre completo es requerido'
            }),

        telefono: Joi.string()
            .pattern(/^[0-9+\-\s()]+$/)
            .min(7)
            .max(20)
            .required()
            .messages({
                'string.pattern.base': 'Formato de teléfono inválido',
                'string.min': 'Teléfono debe tener al menos 7 caracteres',
                'string.max': 'Teléfono no puede exceder 20 caracteres',
                'any.required': 'Teléfono es requerido'
            }),

        departamento: Joi.string()
            .min(2)
            .max(50)
            .required()
            .messages({
                'string.min': 'Departamento debe tener al menos 2 caracteres',
                'string.max': 'Departamento no puede exceder 50 caracteres',
                'any.required': 'Departamento es requerido'
            }),

        cargo: Joi.string()
            .min(3)
            .max(50)
            .required()
            .messages({
                'string.min': 'Cargo debe tener al menos 3 caracteres',
                'string.max': 'Cargo no puede exceder 50 caracteres',
                'any.required': 'Cargo es requerido'
            })
    })
};

// Esquemas de validación para autenticación
const authSchemas = {
    login: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Formato de correo electrónico inválido',
                'any.required': 'Correo electrónico es requerido'
            }),

        password: Joi.string()
            .min(8)
            .max(100)
            .required()
            .messages({
                'string.min': 'La contraseña debe tener al menos 8 caracteres',
                'string.max': 'La contraseña no puede exceder 100 caracteres',
                'any.required': 'Contraseña es requerida'
            })
    }),

    resetPassword: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Formato de correo electrónico inválido',
                'any.required': 'Correo electrónico es requerido'
            })
    }),

    changePassword: Joi.object({
        currentPassword: Joi.string()
            .required()
            .messages({
                'any.required': 'Contraseña actual es requerida'
            }),

        newPassword: Joi.string()
            .min(8)
            .max(100)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .required()
            .messages({
                'string.min': 'La nueva contraseña debe tener al menos 8 caracteres',
                'string.max': 'La nueva contraseña no puede exceder 100 caracteres',
                'string.pattern.base': 'La contraseña debe contener al menos una letra minúscula, una mayúscula, un número y un carácter especial',
                'any.required': 'Nueva contraseña es requerida'
            }),

        confirmPassword: Joi.string()
            .valid(Joi.ref('newPassword'))
            .required()
            .messages({
                'any.only': 'La confirmación de contraseña no coincide',
                'any.required': 'Confirmación de contraseña es requerida'
            })
    })
};

module.exports = {
    aprendizSchemas,
    administradorSchemas,
    authSchemas,
    validarDatos
};