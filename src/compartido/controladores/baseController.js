// src/compartido/controladores/baseController.js
// Propósito: Clase base para controladores con métodos comunes
// Autor: Implementado como mejora arquitectónica

const { validationResult } = require('express-validator');
const { logger } = require('../utilidades/logger');

class BaseController {

    /**
     * Valida los datos de entrada usando un esquema Joi
     * @param {Object} data - Datos a validar
     * @param {Object} schema - Esquema de validación Joi
     * @returns {Object} - { valido: boolean, errores: Array, datos: Object }
     */
    validate(data, schema) {
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
            logger.error('Error en validación:', error);
            return {
                valido: false,
                errores: [{ campo: 'general', mensaje: 'Error interno de validación' }],
                datos: null
            };
        }
    }

    /**
     * Maneja errores de validación y envía respuesta HTTP
     * @param {Object} res - Objeto response de Express
     * @param {Array} errores - Array de errores de validación
     * @returns {Object} - Respuesta JSON con errores
     */
    validationError(res, errores) {
        return res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors: errores
        });
    }

    /**
     * Envía respuesta de éxito estándar
     * @param {Object} res - Objeto response de Express
     * @param {Object} data - Datos a enviar
     * @param {string} message - Mensaje de éxito
     * @param {number} statusCode - Código HTTP (default: 200)
     * @returns {Object} - Respuesta JSON
     */
    success(res, data = null, message = 'Operación exitosa', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Envía respuesta de error estándar
     * @param {Object} res - Objeto response de Express
     * @param {string} message - Mensaje de error
     * @param {number} statusCode - Código HTTP (default: 500)
     * @param {Object} error - Objeto de error adicional
     * @returns {Object} - Respuesta JSON
     */
    error(res, message = 'Error interno del servidor', statusCode = 500, error = null) {
        const response = {
            success: false,
            message,
            timestamp: new Date().toISOString()
        };

        if (error && process.env.NODE_ENV === 'development') {
            response.error = {
                name: error.name,
                message: error.message,
                stack: error.stack
            };
        }

        return res.status(statusCode).json(response);
    }

    /**
     * Maneja errores de base de datos
     * @param {Object} res - Objeto response de Express
     * @param {Error} error - Error de base de datos
     * @param {string} operation - Operación que falló
     * @returns {Object} - Respuesta JSON
     */
    databaseError(res, error, operation = 'operación de base de datos') {
        logger.error(`Error en ${operation}:`, error);
        return this.error(res, `Error en ${operation}`, 500, error);
    }

    /**
     * Verifica si el usuario está autenticado
     * @param {Object} req - Objeto request de Express
     * @returns {boolean} - True si está autenticado
     */
    isAuthenticated(req) {
        return !!(req.session && req.session.userId);
    }

    /**
     * Verifica permisos de usuario
     * @param {Object} req - Objeto request de Express
     * @param {string|string[]} roles - Rol(es) requerido(s)
     * @returns {boolean} - True si tiene permisos
     */
    hasRole(req, roles) {
        if (!this.isAuthenticated(req)) return false;

        const userRole = req.session.userRole;
        if (Array.isArray(roles)) {
            return roles.includes(userRole);
        }
        return userRole === roles;
    }

    /**
     * Middleware para verificar autenticación
     * @param {Object} req - Objeto request de Express
     * @param {Object} res - Objeto response de Express
     * @param {Function} next - Función next de middleware
     */
    requireAuth(req, res, next) {
        if (!this.isAuthenticated(req)) {
            return this.error(res, 'Autenticación requerida', 401);
        }
        next();
    }

    /**
     * Middleware para verificar roles
     * @param {string|string[]} roles - Rol(es) requerido(s)
     * @returns {Function} - Middleware function
     */
    requireRole(roles) {
        return (req, res, next) => {
            if (!this.hasRole(req, roles)) {
                return this.error(res, 'Permisos insuficientes', 403);
            }
            next();
        };
    }
}

module.exports = BaseController;