// src/configuracion/cloudinaryConfig.js
// Configuración para Cloudinary (alternativa gratuita a S3)

const cloudinary = require('cloudinary').v2;
const CloudinaryStorage = require('multer-storage-cloudinary').CloudinaryStorage;

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
        params: {
            folder: folder,
            allowed_formats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'],
            resource_type: 'auto',
            public_id: (req, file) => {
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
                const ext = path.extname(nombreOriginalDecodificado);
                const basename = path.basename(nombreOriginalDecodificado, ext);

                const sanitizedBasename = slugify(basename);
                const finalFilename = `${sanitizedBasename}-${Date.now()}`;

                return finalFilename;
            }
        }
    });
};

// Función para eliminar archivo de Cloudinary
const deleteFile = (publicId) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
    });
};

// Función para obtener URL de Cloudinary (son públicas por defecto)
const getUrl = (publicId) => {
    return cloudinary.url(publicId, {
        secure: true,
        quality: 'auto',
        fetch_format: 'auto'
    });
};

module.exports = {
    cloudinary,
    createCloudinaryStorage,
    deleteFile,
    getUrl
};