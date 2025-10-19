/* Ruta: src/configuracion/seguridad.js */
/* Propósito: Configuración centralizada de medidas de seguridad */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const { logAudit } = require('../compartido/utilidades/logger');

// Configuración de Helmet para headers de seguridad
const helmetConfig = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "https://cdn.datatables.net", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "data:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://code.jquery.com", "https://cdn.jsdelivr.net", "https://cdn.datatables.net", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.watson.cloud.ibm.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    frameguard: { action: 'deny' }
};

// Configuración de Rate Limiting
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs: windowMs || 15 * 60 * 1000, // 15 minutos por defecto
        max: max || 100, // límite de requests por ventana
        message: {
            error: message || 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.',
            retryAfter: Math.ceil((windowMs || 15 * 60 * 1000) / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logAudit('rate_limit_exceeded', {
                ip: req.ip,
                url: req.url,
                method: req.method,
                userAgent: req.get('User-Agent'),
                userId: req.session?.userId
            });

            res.status(429).json({
                error: message || 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.',
                retryAfter: Math.ceil((windowMs || 15 * 60 * 1000) / 1000)
            });
        },
        skip: (req) => {
            // Skip rate limiting para requests de health check
            return req.url === '/health' || req.url === '/status';
        }
    });
};

// Rate limiters específicos
const authRateLimit = createRateLimit(
    15 * 60 * 1000, // 15 minutos
    5, // 5 intentos
    'Demasiados intentos de autenticación. Cuenta bloqueada temporalmente.'
);

const apiRateLimit = createRateLimit(
    15 * 60 * 1000, // 15 minutos
    100, // 100 requests
    'Demasiadas solicitudes a la API.'
);

const fileUploadRateLimit = createRateLimit(
    60 * 60 * 1000, // 1 hora
    10, // 10 uploads
    'Demasiados archivos subidos. Intenta más tarde.'
);

// Configuración de CORS
const corsConfig = {
    origin: function (origin, callback) {
        // Lista de orígenes permitidos
        const allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            process.env.FRONTEND_URL
        ].filter(Boolean);

        // Permitir requests sin origen (como mobile apps)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        logAudit('cors_rejected', {
            origin,
            userAgent: origin
        });

        return callback(new Error('No permitido por política CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
    maxAge: 86400 // 24 horas
};

// Middleware de validación de entrada
const validateInput = (req, res, next) => {
    // Sanitizar headers potencialmente peligrosos
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-client-ip'];

    suspiciousHeaders.forEach(header => {
        if (req.headers[header]) {
            // Log pero no bloquear - podría ser legítimo
            logAudit('suspicious_header', {
                header,
                value: req.headers[header],
                ip: req.ip,
                url: req.url
            });
        }
    });

    // Validar tamaño del body
    if (req.headers['content-length']) {
        const contentLength = parseInt(req.headers['content-length']);
        const maxBodySize = 10 * 1024 * 1024; // 10MB

        if (contentLength > maxBodySize) {
            logAudit('large_request_body', {
                contentLength,
                ip: req.ip,
                url: req.url,
                userId: req.session?.userId
            });

            return res.status(413).json({
                error: 'Cuerpo de la solicitud demasiado grande'
            });
        }
    }

    // Validar caracteres peligrosos en parámetros de URL
    const urlParams = req.url.split('?')[1];
    if (urlParams) {
        const dangerousPatterns = [
            /(\.\.|\/etc\/|\/var\/|\/usr\/|\/home\/)/i,
            /(<script|javascript:|data:|vbscript:)/i,
            /(\.\.\/|\.\.\\)/
        ];

        if (dangerousPatterns.some(pattern => pattern.test(urlParams))) {
            logAudit('suspicious_url_pattern', {
                url: req.url,
                ip: req.ip,
                userId: req.session?.userId
            });

            return res.status(400).json({
                error: 'URL malformada'
            });
        }
    }

    next();
};

// Middleware de sanitización de datos
const sanitizeData = (req, res, next) => {
    // Función recursiva para sanitizar objetos
    const sanitizeValue = (value) => {
        if (typeof value === 'string') {
            // Remover caracteres de control y normalizar
            return value
                .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remover caracteres de control
                .trim()
                .substring(0, 10000); // Limitar longitud
        } else if (Array.isArray(value)) {
            return value.map(sanitizeValue).slice(0, 100); // Limitar arrays
        } else if (typeof value === 'object' && value !== null) {
            const sanitized = {};
            Object.keys(value).slice(0, 50).forEach(key => { // Limitar propiedades
                if (key.length <= 100) { // Limitar longitud de keys
                    sanitized[key.substring(0, 100)] = sanitizeValue(value[key]);
                }
            });
            return sanitized;
        }
        return value;
    };

    // Sanitizar body, query y params
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeValue(req.body);
    }

    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeValue(req.query);
    }

    if (req.params && typeof req.params === 'object') {
        req.params = sanitizeValue(req.params);
    }

    next();
};

// Middleware de logging de seguridad
const securityLogger = (req, res, next) => {
    const start = Date.now();

    // Log de requests potencialmente sospechosos
    const suspiciousPatterns = [
        /\b(union|select|insert|update|delete|drop|create|alter)\b/i,
        /\b(script|javascript|vbscript|onload|onerror)\b/i,
        /\b(\.\.|\/etc|\/var|\/usr|\/home)\b/i
    ];

    const requestData = JSON.stringify({
        url: req.url,
        body: req.body,
        query: req.query,
        headers: req.headers
    });

    if (suspiciousPatterns.some(pattern => pattern.test(requestData))) {
        logAudit('suspicious_request', {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.session?.userId,
            body: req.body,
            query: req.query
        });
    }

    // Log de response
    res.on('finish', () => {
        const duration = Date.now() - start;

        // Log de responses de error
        if (res.statusCode >= 400) {
            logAudit('error_response', {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                ip: req.ip,
                userId: req.session?.userId
            });
        }
    });

    next();
};

// Middleware de timeout
const createTimeout = (timeoutMs = 30000) => {
    return (req, res, next) => {
        const timeout = setTimeout(() => {
            if (!res.headersSent) {
                logAudit('request_timeout', {
                    method: req.method,
                    url: req.url,
                    ip: req.ip,
                    userId: req.session?.userId,
                    timeoutMs
                });

                res.status(408).json({
                    error: 'La solicitud ha excedido el tiempo límite'
                });
            }
        }, timeoutMs);

        res.on('finish', () => {
            clearTimeout(timeout);
        });

        next();
    };
};

// Función para aplicar todas las medidas de seguridad
const applySecurityMiddleware = (app) => {
    // Headers de seguridad
    app.use(helmet(helmetConfig));

    // CORS
    app.use(cors(corsConfig));

    // Rate limiting
    app.use('/auth', authRateLimit);
    app.use('/api', apiRateLimit);
    app.use('/upload', fileUploadRateLimit);

    // Validación y sanitización
    app.use(validateInput);
    app.use(sanitizeData);

    // Logging de seguridad
    app.use(securityLogger);

    // Timeout
    app.use(createTimeout(30000)); // 30 segundos

    // Headers adicionales de seguridad
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        // Header de servidor personalizado
        res.setHeader('X-Powered-By', 'SENA-GEP');

        next();
    });
};

// Función para validar tokens CSRF (para futura implementación)
const validateCsrfToken = (req, res, next) => {
    // Implementación básica - se puede expandir
    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionToken = req.session.csrfToken;

    if (!token || !sessionToken || token !== sessionToken) {
        logAudit('csrf_token_invalid', {
            ip: req.ip,
            userId: req.session?.userId,
            url: req.url
        });

        return res.status(403).json({
            error: 'Token CSRF inválido'
        });
    }

    next();
};

// Función para generar tokens CSRF
const generateCsrfToken = () => {
    return require('crypto').randomBytes(32).toString('hex');
};

module.exports = {
    helmetConfig,
    corsConfig,
    createRateLimit,
    authRateLimit,
    apiRateLimit,
    fileUploadRateLimit,
    validateInput,
    sanitizeData,
    securityLogger,
    createTimeout,
    applySecurityMiddleware,
    validateCsrfToken,
    generateCsrfToken
};