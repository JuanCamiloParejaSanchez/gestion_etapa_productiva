/* Ruta: src/compartido/utilidades/logger.js */
/* Propósito: Sistema de logging estructurado y configurable */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Configuración de niveles de log personalizados
const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4,
        silly: 5
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        http: 'magenta',
        debug: 'blue',
        silly: 'gray'
    }
};

// Formato personalizado para desarrollo
const devFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`;

        // Agregar metadata si existe
        if (Object.keys(meta).length > 0) {
            log += ` | ${JSON.stringify(meta, null, 2)}`;
        }

        // Agregar stack trace para errores
        if (stack) {
            log += `\n${stack}`;
        }

        return log;
    })
);

// Formato JSON para producción
const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Configuración de transports
const transports = [];

// Transport para consola (desarrollo)
if (process.env.NODE_ENV !== 'production') {
    transports.push(
        new winston.transports.Console({
            level: process.env.LOG_LEVEL || 'debug',
            format: devFormat,
            handleExceptions: true,
            handleRejections: true
        })
    );
}

// Transport para archivo de errores
transports.push(
    new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        format: prodFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        tailable: true
    })
);

// Transport para archivo combinado
transports.push(
    new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        level: process.env.LOG_LEVEL || 'info',
        format: prodFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        tailable: true
    })
);

// Crear logger principal
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels: customLevels.levels,
    format: prodFormat,
    transports,
    exitOnError: false
});

// Agregar colores para desarrollo
winston.addColors(customLevels.colors);

// Logger específico para HTTP requests
const httpLogger = winston.createLogger({
    level: 'http',
    levels: customLevels.levels,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return JSON.stringify({
                timestamp,
                level,
                message,
                ...meta
            });
        })
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'http.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 3,
            tailable: true
        })
    ]
});

// Logger para auditoría de seguridad
const auditLogger = winston.createLogger({
    level: 'info',
    levels: customLevels.levels,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'audit.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            tailable: true
        })
    ]
});

// Middleware para logging de HTTP requests
const httpLoggerMiddleware = (req, res, next) => {
    const start = Date.now();

    // Log de request entrante
    httpLogger.http('Request received', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.session?.id,
        userId: req.session?.userId,
        userRole: req.session?.userRole
    });

    // Log de response
    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 400 ? 'warn' : 'http';

        httpLogger.log(level, 'Request completed', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userId: req.session?.userId
        });
    });

    next();
};

// Función para logging de auditoría
const logAudit = (action, details = {}) => {
    auditLogger.info('Audit event', {
        action,
        timestamp: new Date().toISOString(),
        ...details
    });
};

// Función para logging de errores con contexto
const logError = (error, context = {}) => {
    logger.error('Application error', {
        error: {
            message: error.message,
            stack: error.stack,
            name: error.name
        },
        context
    });
};

// Función para logging de autenticación
const logAuth = (event, details = {}) => {
    const level = event.includes('failed') || event.includes('error') ? 'warn' : 'info';

    logger.log(level, `Authentication: ${event}`, {
        event,
        timestamp: new Date().toISOString(),
        ...details
    });
};

// Función para logging de base de datos
const logDatabase = (operation, details = {}) => {
    logger.debug(`Database: ${operation}`, {
        operation,
        ...details
    });
};

// Función para logging de Watson
const logWatson = (operation, details = {}) => {
    logger.debug(`Watson: ${operation}`, {
        operation,
        ...details
    });
};

// Función para crear child loggers
const createChildLogger = (context) => {
    return logger.child(context);
};

// Función para obtener estadísticas de logs
const getLogStats = () => {
    const stats = {
        errorCount: 0,
        warnCount: 0,
        infoCount: 0,
        totalSize: 0
    };

    try {
        const files = fs.readdirSync(logsDir);
        files.forEach(file => {
            const filePath = path.join(logsDir, file);
            const stat = fs.statSync(filePath);
            stats.totalSize += stat.size;

            // Contar líneas por tipo (simplificado)
            if (file.includes('error')) {
                stats.errorCount += 1;
            } else if (file.includes('combined')) {
                stats.infoCount += 1;
            }
        });
    } catch (error) {
        logger.error('Error getting log stats', { error: error.message });
    }

    return stats;
};

// Función para rotar logs manualmente
const rotateLogs = () => {
    try {
        transports.forEach(transport => {
            if (transport instanceof winston.transports.File) {
                // Forzar rotación agregando un log dummy
                transport.log({ level: 'info', message: 'Manual log rotation' });
            }
        });
        logger.info('Manual log rotation completed');
    } catch (error) {
        logger.error('Error during manual log rotation', { error: error.message });
    }
};

// Función para limpiar logs antiguos
const cleanupOldLogs = (daysToKeep = 30) => {
    try {
        const files = fs.readdirSync(logsDir);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        files.forEach(file => {
            const filePath = path.join(logsDir, file);
            const stat = fs.statSync(filePath);

            if (stat.mtime < cutoffDate) {
                fs.unlinkSync(filePath);
                logger.info('Old log file deleted', { file });
            }
        });
    } catch (error) {
        logger.error('Error cleaning up old logs', { error: error.message });
    }
};

module.exports = {
    logger,
    httpLogger,
    auditLogger,
    httpLoggerMiddleware,
    logAudit,
    logError,
    logAuth,
    logDatabase,
    logWatson,
    createChildLogger,
    getLogStats,
    rotateLogs,
    cleanupOldLogs
};