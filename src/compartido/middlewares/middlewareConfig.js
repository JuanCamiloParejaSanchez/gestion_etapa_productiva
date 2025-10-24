// src/middlewares/middlewareConfig.js
// Propósito: Configura y establece todos los middlewares globales de la aplicación.
// Maneja sesiones, seguridad, compresión, parsing de datos y logging.
// Centraliza la configuración de middlewares para mantener el código organizado y seguro.

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const { pool } = require('../../configuracion/baseDatos');
const AuthMiddleware = require('./middlewareAutenticacion');

function setupMiddlewares(app) {
    // Middleware básicos de Express
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compresión de respuestas
    app.use(compression());

    // Configuración de CORS
    app.use(cors({
        origin: process.env.NODE_ENV === 'production' ?
            process.env.ALLOWED_ORIGINS?.split(',') : '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    }));

    // Nota: Las sesiones se configuran en servidor.js para evitar duplicación

    // Configuración de seguridad con Helmet
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "'unsafe-eval'",
                    "https://cdn.jsdelivr.net",
                    "https://cdn.datatables.net",
                    "https://code.jquery.com",
                    "https://cdnjs.cloudflare.com"
                ],
                scriptSrcAttr: ["'unsafe-inline'"],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://fonts.googleapis.com",
                    "https://cdn.jsdelivr.net",
                    "https://cdn.datatables.net",
                    "https://cdnjs.cloudflare.com"
                ],
                styleSrcElem: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://fonts.googleapis.com",
                    "https://cdn.jsdelivr.net",
                    "https://cdn.datatables.net",
                    "https://cdnjs.cloudflare.com"
                ],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "https://cdn.datatables.net", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "data:"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"]
            }
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: false
    }));

    // Middleware para cargar información del usuario
    app.use(AuthMiddleware.cargarUsuario);

    // Variables globales y utilidades para las vistas
    app.use((req, res, next) => {
        // Funciones de utilidad para las vistas
        res.locals.contentFor = function(section, content) {
            res.locals[section] = content;
        };

        // Variables globales
        res.locals.user = req.session?.user || null;
        res.locals.userRole = req.session?.userRole || null;
        next();
    });

    // Logging de solicitudes
    app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            console.log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
        });
        next();
    });

    // Headers de seguridad adicional
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        next();
    });

    // Verificación de estado de la BD
    app.use(async (req, res, next) => {
        try {
            await pool.query('SELECT 1');
            next();
        } catch (error) {
            console.error('Error de conexión a la base de datos:', error);
            return res.status(503).render('compartido/paginaError', {
                message: 'Servicio no disponible',
                error: {
                    status: 503,
                    description: 'Error de conexión con la base de datos'
                }
            });
        }
    });

    // Manejo de errores
    app.use((err, req, res, next) => {
        console.error('Error no manejado:', err);

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }

        next(err);
    });
}

module.exports = setupMiddlewares;