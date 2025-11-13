// Ruta: src/compartido/middlewares/multerErrorHandler.js
// Propósito: Middleware para manejar errores de multer de forma centralizada

const multer = require('multer');

/**
 * Middleware para manejar errores de multer
 * @param {Error} err - Error de multer
 * @param {Object} req - Request
 * @param {Object} res - Response
 * @param {Function} next - Next middleware
 */
const multerErrorHandler = (err, req, res, next) => {
    console.error('❌ Error en multer:', err);

    if (err instanceof multer.MulterError) {
        // Errores específicos de multer
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    message: 'El archivo es demasiado grande. El tamaño máximo es 5MB.',
                    code: 'FILE_TOO_LARGE'
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    message: 'Demasiados archivos. Solo se permite un archivo.',
                    code: 'TOO_MANY_FILES'
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    message: 'Campo de archivo inesperado.',
                    code: 'UNEXPECTED_FIELD'
                });
            default:
                return res.status(400).json({
                    success: false,
                    message: `Error al subir el archivo: ${err.message}`,
                    code: 'MULTER_ERROR'
                });
        }
    } else if (err) {
        // Errores personalizados (ej: tipo de archivo no permitido)
        if (err.message === 'Tipo de archivo no permitido.') {
            return res.status(400).json({
                success: false,
                message: 'Tipo de archivo no permitido. Use PDF, DOC, DOCX, JPG o PNG.',
                code: 'INVALID_FILE_TYPE'
            });
        }

        // Otros errores
        return res.status(500).json({
            success: false,
            message: 'Error al procesar el archivo.',
            code: 'FILE_PROCESSING_ERROR'
        });
    }

    next();
};

module.exports = multerErrorHandler;
