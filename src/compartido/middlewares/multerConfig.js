// Ruta: src/compartido/middlewares/multerConfig.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Importar configuración de Cloudinary
const { createCloudinaryStorage } = require('../../configuracion/cloudinaryConfig');

// Determinar si usar Cloudinary basado en variables de entorno
const USE_CLOUDINARY = process.env.USE_CLOUDINARY === 'true' && process.env.CLOUDINARY_CLOUD_NAME;

// Directorio donde se guardarán los documentos subidos (solo para desarrollo local).
const UPLOADS_DIR = path.join(__dirname, '../../../public/uploads/documentos');

if (!USE_CLOUDINARY && !fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Esta función se asegura de que los nombres con tildes o 'ñ' se lean como UTF-8.
const decodeOriginalName = (originalname) => {
    return Buffer.from(originalname, 'latin1').toString('utf8');
};

const slugify = (text) => {
    return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
};

// Configurar storage basado en el entorno
let storage;

if (USE_CLOUDINARY) {
    // Usar Cloudinary (gratuito para pruebas)
    storage = createCloudinaryStorage('documentos');
} else {
    // Usar almacenamiento local en desarrollo
    storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, UPLOADS_DIR);
        },
        filename: (req, file, cb) => {
            // Decodificar el nombre original para manejar tildes y caracteres especiales.
            const nombreOriginalDecodificado = decodeOriginalName(file.originalname);

            // Usar el nombre decodificado para crear el nombre base y la extensión.
            const ext = path.extname(nombreOriginalDecodificado);
            const basename = path.basename(nombreOriginalDecodificado, ext);

            const sanitizedBasename = slugify(basename);
            const finalFilename = `${sanitizedBasename}-${Date.now()}${ext}`;

            cb(null, finalFilename);
        }
    });
}

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        // Para el documento de soporte (registro), solo permitir PDF y Excel
        const documentoSoporteMimes = [
            'application/pdf',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        // Para otros documentos (gestión general), permitir más tipos
        const allowedMimes = [
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg', 'image/png',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        // Verificar si es el campo documentoSoporte (del registro)
        if (file.fieldname === 'documentoSoporte') {
            if (documentoSoporteMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Para el documento de soporte solo se permiten archivos PDF o Excel (XLS, XLSX).'), false);
            }
        } else {
            // Para otros documentos, usar la lista completa
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Tipo de archivo no permitido.'), false);
            }
        }
    }
});

// Normaliza el nombre para comparación flexible (sin tildes, minúsculas, sin espacios extra)
const normalizarNombreDocumento = (nombre) => {
    return nombre
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quita tildes
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Elimina todo lo que no sea letra o número
        .trim();
};

module.exports = Object.assign(upload, {
    decodeOriginalName,
    normalizarNombreDocumento
});