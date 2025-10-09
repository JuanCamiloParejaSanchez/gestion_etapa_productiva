const { validarDatos } = require('../../../validaciones/esquemasValidacion');

class BaseController {
    /**
     * Respuesta de éxito estándar
     * @param {Object} res - Response object
     * @param {Object} data - Datos a enviar
     * @param {string} message - Mensaje de éxito
     * @param {number} statusCode - Código HTTP
     */
    success(res, data = null, message = 'Operación exitosa', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            data,
            message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Respuesta de error estándar
     * @param {Object} res - Response object
     * @param {string} message - Mensaje de error
     * @param {number} statusCode - Código HTTP
     * @param {Object} details - Detalles adicionales del error
     */
    error(res, message = 'Error interno del servidor', statusCode = 500, details = null) {
        const response = {
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        };

        if (details) {
            response.details = details;
        }

        return res.status(statusCode).json(response);
    }

    /**
     * Renderiza vista con manejo de errores
     * @param {Object} res - Response object
     * @param {string} view - Nombre de la vista
     * @param {Object} data - Datos para la vista
     * @param {string} layout - Layout a usar
     */
    renderView(res, view, data = {}, layout = 'plantillas/principal') {
        try {
            return res.render(view, { ...data, layout });
        } catch (error) {
            console.error('Error al renderizar vista:', error);
            return this.error(res, 'Error al cargar la página', 500);
        }
    }

    /**
     * Valida datos usando esquema Joi
     * @param {Object} data - Datos a validar
     * @param {Object} schema - Esquema Joi
     * @returns {Object} - Resultado de validación
     */
    validate(data, schema) {
        return validarDatos(data, schema);
    }

    /**
     * Maneja errores de validación
     * @param {Object} res - Response object
     * @param {Object} errors - Errores de validación
     */
    validationError(res, errors) {
        return this.error(res, 'Datos de entrada inválidos', 400, errors);
    }

    /**
     * Verifica si el usuario está autenticado
     * @param {Object} req - Request object
     * @returns {boolean}
     */
    isAuthenticated(req) {
        return !!(req.session && req.session.userId);
    }

    /**
     * Obtiene el ID del usuario de la sesión
     * @param {Object} req - Request object
     * @returns {number|null}
     */
    getUserId(req) {
        return req.session ? req.session.userId : null;
    }

    /**
     * Verifica permisos básicos
     * @param {Object} req - Request object
     * @param {string} requiredRole - Rol requerido
     * @returns {boolean}
     */
    hasPermission(req, requiredRole) {
        return req.session && req.session.userRole === requiredRole;
    }

    /**
     * Middleware para validar datos en rutas
     * @param {Object} schema - Esquema Joi
     * @returns {Function} - Middleware function
     */
    validateRequest(schema) {
        return (req, res, next) => {
            const { valido, errores, datos } = this.validate(req.body, schema);

            if (!valido) {
                return this.validationError(res, errores);
            }

            req.validatedData = datos;
            next();
        };
    }
}

module.exports = BaseController;