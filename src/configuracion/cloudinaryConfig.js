// src/configuracion/cloudinaryConfig.js
// Configuración para Cloudinary (alternativa gratuita a S3)

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Función para crear storage de Cloudinary para multer
const createCloudinaryStorage = (folder = 'documentos') => {
    return new CloudinaryStorage({
        cloudinary: cloudinary,
        params: async (req, file) => {
            // Decodificar el nombre original para manejar tildes y caracteres especiales
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

            const nombreOriginalDecodificado = decodeOriginalName(file.originalname);
            const path = require('path');
            const ext = path.extname(nombreOriginalDecodificado).toLowerCase();
            const basename = path.basename(nombreOriginalDecodificado, ext);
            const sanitizedBasename = slugify(basename);
            const finalFilename = `${sanitizedBasename}-${Date.now()}`;

            // Forzar resource_type 'raw' para documentos
            const documentExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
            const isDocument = documentExts.includes(ext);

            return {
                folder: folder,
                allowed_formats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'],
                resource_type: isDocument ? 'raw' : 'auto',
                public_id: finalFilename
            };
        }
    });
};

// Función para eliminar archivo de Cloudinary
const deleteFile = (publicId) => {
    return new Promise((resolve, reject) => {
        // Para documentos, usar resource_type: 'raw'
        const options = publicId.includes('documentos/') ? { resource_type: 'raw' } : {};
        cloudinary.uploader.destroy(publicId, options, (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
    });
};

// Función para obtener URL de Cloudinary (son públicas por defecto)
const getUrl = (publicId, options = {}) => {
    // Para archivos raw (documentos), construir URL manualmente
    if (publicId.includes('documentos/')) {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        return `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}`;
    }

    // Para otros archivos (imágenes), usar cloudinary.url normal
    let defaultOptions = {
        secure: true,
        quality: 'auto',
        fetch_format: 'auto'
    };

    return cloudinary.url(publicId, { ...defaultOptions, ...options });
};

module.exports = {
    cloudinary,
    createCloudinaryStorage,
    deleteFile,
    getUrl
};