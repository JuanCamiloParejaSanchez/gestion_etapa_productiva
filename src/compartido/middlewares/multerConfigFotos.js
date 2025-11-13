// Ruta: src/compartido/middlewares/multerConfigFotos.js
// Propósito: Configuración de Multer específica para fotos de perfil con optimización

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Directorios para fotos de perfil
const PHOTOS_DIR = path.join(__dirname, '../../../public/uploads/fotos');
const PHOTOS_OPTIMIZED_DIR = path.join(__dirname, '../../../public/uploads/fotos/optimized');

// Crear directorios si no existen
[PHOTOS_DIR, PHOTOS_OPTIMIZED_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Decodificar nombres con caracteres especiales
const decodeOriginalName = (originalname) => {
    return Buffer.from(originalname, 'latin1').toString('utf8');
};

// Configuración de almacenamiento temporal
const storage = multer.memoryStorage();

// Filtro para validar tipos de imagen
const imageFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes JPG, JPEG o PNG para la foto de perfil.'), false);
    }
};

// Configuración de multer para fotos
const uploadPhoto = multer({
    storage: storage,
    limits: { 
        fileSize: 2 * 1024 * 1024 // 2MB máximo
    },
    fileFilter: imageFilter
});

// Función para optimizar y redimensionar la imagen
const optimizarImagen = async (buffer, filename) => {
    try {
        const outputPath = path.join(PHOTOS_OPTIMIZED_DIR, filename);
        
        await sharp(buffer)
            .resize(500, 500, { 
                fit: 'cover', 
                position: 'center' 
            })
            .jpeg({ 
                quality: 85, 
                progressive: true 
            })
            .toFile(outputPath);
        
        console.log(`✅ Imagen optimizada guardada en: ${outputPath}`);
        return {
            success: true,
            filename: filename,
            path: `/uploads/fotos/optimized/${filename}`,
            fullPath: outputPath
        };
    } catch (error) {
        console.error('❌ Error al optimizar imagen:', error);
        throw error;
    }
};

// Middleware para procesar la foto después de subirla
const procesarFotoPerfil = async (req, res, next) => {
    if (!req.file) {
        return next();
    }
    
    try {
        // Generar nombre único para el archivo
        const timestamp = Date.now();
        const uniqueSuffix = Math.round(Math.random() * 1E9);
        const ext = path.extname(req.file.originalname);
        const filename = `perfil-${timestamp}-${uniqueSuffix}${ext}`;
        
        // Optimizar y guardar la imagen
        const result = await optimizarImagen(req.file.buffer, filename);
        
        // Agregar información del archivo procesado a la petición
        req.fotoPerfilProcesada = {
            fieldname: req.file.fieldname,
            originalname: decodeOriginalName(req.file.originalname),
            filename: result.filename,
            mimetype: 'image/jpeg',
            size: req.file.size,
            path: result.path,
            fullPath: result.fullPath
        };
        
        console.log('📸 Foto de perfil procesada:', req.fotoPerfilProcesada);
        next();
    } catch (error) {
        console.error('❌ Error procesando foto de perfil:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al procesar la foto de perfil'
        });
    }
};

// Función para eliminar foto anterior
const eliminarFotoAnterior = async (rutaFoto) => {
    if (!rutaFoto) return;
    
    try {
        const fullPath = path.join(__dirname, '../../../public', rutaFoto);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`🗑️ Foto anterior eliminada: ${fullPath}`);
        }
    } catch (error) {
        console.error('❌ Error al eliminar foto anterior:', error);
    }
};

module.exports = {
    uploadPhoto,
    procesarFotoPerfil,
    optimizarImagen,
    eliminarFotoAnterior,
    decodeOriginalName
};
