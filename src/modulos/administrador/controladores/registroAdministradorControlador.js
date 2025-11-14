const bcrypt = require('bcrypt');
const servicioConsultasAdministrador = require('../servicios/servicioConsultasAdministrador');

// Mostrar formulario de registro
exports.mostrarFormulario = (req, res) => {
    res.render('administrador/registroAdministrador');
};

// Verificar duplicados de correo o número de identificación
exports.verificarDuplicado = async (req, res) => {
    try {
        const { campo, valor } = req.body;

        if (!campo || !valor) {
            return res.status(400).json({
                success: false,
                message: 'Campo y valor son requeridos'
            });
        }

        let administradorExistente = null;

        if (campo === 'correoInstitucional') {
            administradorExistente = await servicioConsultasAdministrador.buscarPorEmail(valor.toLowerCase());
        } else if (campo === 'numeroIdentificacion') {
            administradorExistente = await servicioConsultasAdministrador.buscarPorNumeroIdentificacion(valor.toUpperCase());
        } else {
            return res.status(400).json({
                success: false,
                message: 'Campo no válido para verificación'
            });
        }

        return res.json({
            success: true,
            existe: !!administradorExistente,
            campo: campo
        });

    } catch (error) {
        console.error('Error verificando duplicado:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar duplicado'
        });
    }
};

// Procesar registro de administrador
exports.registrarAdministrador = async (req, res) => {
    console.log('🚀 Iniciando registro de administrador');
    console.log('📝 Método de petición:', req.method);
    console.log('🌐 URL de petición:', req.originalUrl);
    console.log('📋 Content-Type:', req.get('Content-Type'));
    
    try {
        let { nombreCompleto, correoInstitucional, numeroIdentificacion, telefono, departamento, cargo } = req.body;
        console.log('📋 Datos recibidos en bruto:', req.body);

        // Verificar si se subió la foto de perfil (OBLIGATORIA)
        if (!req.fotoPerfilProcesada) {
            console.warn('⚠️ No se recibió foto de perfil');
            return res.status(400).json({
                success: false,
                message: 'La foto de perfil es obligatoria'
            });
        }

        console.log('📸 Foto de perfil recibida y procesada:', {
            originalname: req.fotoPerfilProcesada.originalname,
            filename: req.fotoPerfilProcesada.filename,
            mimetype: req.fotoPerfilProcesada.mimetype,
            size: req.fotoPerfilProcesada.size,
            path: req.fotoPerfilProcesada.path
        });

        // Normalizar email a minúsculas y otros campos a mayúsculas
        if (correoInstitucional) {
            correoInstitucional = correoInstitucional.toLowerCase().trim();
        }
        
        // Normalizar otros campos a mayúsculas
        if (nombreCompleto) nombreCompleto = nombreCompleto.toUpperCase().trim();
        if (numeroIdentificacion) numeroIdentificacion = numeroIdentificacion.toUpperCase().trim();
        if (telefono) telefono = telefono.trim();
        if (departamento) departamento = departamento.toUpperCase().trim();
        if (cargo) cargo = cargo.toUpperCase().trim();

        // Validaciones básicas
        if (!nombreCompleto || !correoInstitucional || !numeroIdentificacion || !telefono || !departamento || !cargo) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos obligatorios deben ser completados.'
            });
        }

        console.log('📋 Datos procesados para registro:', {
            nombreCompleto,
            correoInstitucional,
            numeroIdentificacion,
            telefono,
            departamento,
            cargo
        });

        // Insertar en la base de datos sin contraseña pero con foto de perfil
        const nuevoAdmin = {
            nombreCompleto,
            correoInstitucional,
            numeroIdentificacion,
            telefono,
            departamento,
            cargo,
            fotoPerfil: req.fotoPerfilProcesada.filename,
            fotoPerfilPath: req.fotoPerfilProcesada.path,
            password: null, // Contraseña se creará después
            rol: 'admin',
            activo: true
        };
        
        const resultado = await servicioConsultasAdministrador.insertarAdministrador(nuevoAdmin);

        if (resultado && resultado.insertId) {
            // Configurar sesión
            req.session.userEmail = correoInstitucional;
            req.session.administradorId = resultado.insertId;
            req.session.registroEnProceso = true;
            req.session.userRole = 'admin';
            
            console.log('💾 Sesión configurada:', {
                userEmail: req.session.userEmail,
                administradorId: req.session.administradorId,
                registroEnProceso: req.session.registroEnProceso,
                userRole: req.session.userRole
            });

            console.log('🎉 Registro completado exitosamente');
            
            return res.json({
                success: true,
                message: 'Registro exitoso. Ahora puedes crear tu contraseña.',
                data: { 
                    administradorId: resultado.insertId,
                    email: correoInstitucional,
                    redirect: '/crear-contrasena'
                }
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Error al registrar el administrador.'
            });
        }
    } catch (error) {
        console.error('❌ Error en registro de administrador:', error);
        
        // Manejar error de duplicado
        if (error.code === 'ER_DUP_ENTRY' || error.message.includes('ER_DUP_ENTRY')) {
            let mensaje = 'Ya existe un registro con los mismos datos.';
            
            if (error.message.includes('correo_institucional') || error.message.includes('correoInstitucional')) {
                mensaje = 'Ya existe un administrador registrado con este correo institucional.';
            } else if (error.message.includes('numero_identificacion') || error.message.includes('numeroIdentificacion')) {
                mensaje = 'Ya existe un administrador registrado con este número de identificación.';
            }
            
            return res.status(409).json({
                success: false,
                message: mensaje,
                code: 'DUPLICATE_ENTRY'
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al registrar el administrador.'
        });
    }
};
