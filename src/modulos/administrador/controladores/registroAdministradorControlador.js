const bcrypt = require('bcrypt');
const servicioConsultasAdministrador = require('../servicios/servicioConsultasAdministrador');

// Mostrar formulario de registro
exports.mostrarFormulario = (req, res) => {
    res.render('administrador/registroAdministrador');
};

// Procesar registro de administrador
exports.registrarAdministrador = async (req, res) => {
    try {
        let { nombreCompleto, correoInstitucional, numeroIdentificacion, telefono, departamento, cargo, contrasena, confirmarContrasena } = req.body;

        // Normalizar email a minúsculas
        if (correoInstitucional) {
            correoInstitucional = correoInstitucional.toLowerCase().trim();
        }

        // Validaciones básicas
        if (!nombreCompleto || !correoInstitucional || !numeroIdentificacion || !telefono || !departamento || !contrasena || !confirmarContrasena) {
            return res.status(400).render('administrador/registroAdministrador', { mensaje: 'Todos los campos obligatorios deben ser completados.' });
        }
        if (contrasena !== confirmarContrasena) {
            return res.status(400).render('administrador/registroAdministrador', { mensaje: 'Las contraseñas no coinciden.' });
        }

        // Validar requisitos de contraseña
        const errors = [];
        if (contrasena.length < 12) errors.push('al menos 12 caracteres');
        if (!/[A-Z]/.test(contrasena)) errors.push('una letra mayúscula');
        if (!/[a-z]/.test(contrasena)) errors.push('una letra minúscula');
        if (!/[0-9]/.test(contrasena)) errors.push('un número');
        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(contrasena)) errors.push('un símbolo');
        
        if (errors.length > 0) {
            return res.status(400).render('administrador/registroAdministrador', { 
                mensaje: 'La contraseña debe contener: ' + errors.join(', ') 
            });
        }

        // Hash de la contraseña
        const hash = await bcrypt.hash(contrasena, 10);

        // Insertar en la base de datos
        const nuevoAdmin = {
            nombreCompleto,
            correoInstitucional,
            numeroIdentificacion,
            telefono,
            departamento,
            cargo,
            password: hash,
            rol: 'admin',
            activo: true
        };
        const resultado = await servicioConsultasAdministrador.insertarAdministrador(nuevoAdmin);

        if (resultado && resultado.insertId) {
            return res.json({
                success: true,
                message: 'Administrador registrado exitosamente.',
                data: { redirect: '/auth/login' }
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Error al registrar el administrador.'
            });
        }
    } catch (error) {
        console.error('Error en registro de administrador:', error);
        
        // Manejar error de duplicado
        if (error.code === 'ER_DUP_ENTRY') {
            if (error.message.includes('correo_institucional')) {
                return res.status(409).json({
                    success: false,
                    message: 'Ya existe un administrador con este correo institucional.'
                });
            } else if (error.message.includes('numero_identificacion')) {
                return res.status(409).json({
                    success: false,
                    message: 'Ya existe un administrador con este número de identificación.'
                });
            }
        }
        
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al registrar el administrador.'
        });
    }
};
