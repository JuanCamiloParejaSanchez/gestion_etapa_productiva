// Ruta: src/modulos/aprendiz/controladores/controladorRecuperacion.js
// Propósito: Maneja la lógica de recuperación de contraseña con códigos de verificación
// Autor: JuanBogotá

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const ServicioAprendiz = require('../servicios/servicioAprendiz');
const servicioAprendiz = new ServicioAprendiz();
const consultasAdministrador = require('../../administrador/servicios/servicioConsultasAdministrador');
const servicioRecuperacion = require('../servicios/servicioRecuperacion');
const servicioCorreo = require('../servicios/servicioCorreo');

const controladorRecuperacion = {
    async mostrarFormularioRecuperar(req, res) {
        try {
            res.render('autenticacion/recuperarContrasena', {
                title: 'Recuperar Contraseña - SENA',
                pagina: 'recuperar-contrasena',
                layout: 'plantillas/principal'
            });
        } catch (error) {
            console.error('Error:', error);
            res.render('compartido/paginaError', {
                title: 'Error',
                message: 'Error al cargar el formulario',
                error: {
                    status: 500,
                    description: 'Error interno del servidor'
                },
                layout: 'plantillas/principal'
            });
        }
    },

    async solicitarRecuperacion(req, res) {
        try {
            const { email } = req.body;
            console.log(`[RECUPERACION] Buscando usuario con email: ${email}`);
            let usuario = await servicioAprendiz.buscarPorEmail(email);
            let role = null;
            if (usuario) {
                role = 'aprendiz';
                console.log(`[RECUPERACION] Usuario encontrado como aprendiz: ${usuario.nombres || usuario.email}`);
            } else {
                usuario = await consultasAdministrador.buscarPorEmail(email);
                if (usuario) {
                    role = 'admin';
                    console.log(`[RECUPERACION] Usuario encontrado como admin: ${usuario.nombreCompleto || usuario.correoInstitucional}`);
                } else {
                    console.log(`[RECUPERACION] Usuario no encontrado en aprendices ni administradores`);
                }
            }

            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'El correo electrónico no está registrado en el sistema. Por favor, verifica e intenta nuevamente.'
                });
            }

            // Generar código de verificación de 6 dígitos
            const codigo = servicioRecuperacion.generarCodigo();
            const expiracion = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

            // Guardar código en base de datos (ahora también guardamos el role)
            await servicioRecuperacion.guardarCodigo(email, codigo, expiracion, role);

            // Enviar código por correo
            console.log(`[RECUPERACION] Enviando código ${codigo} a ${email} para rol ${role}`);
            try {
                const resultadoEnvio = await servicioCorreo.enviarCodigoVerificacion(email, codigo);
                console.log(`[RECUPERACION] Código enviado exitosamente a ${email}:`, resultadoEnvio);
            } catch (error) {
                console.error(`[RECUPERACION] Error al enviar código a ${email}:`, error);
                return res.status(500).json({
                    success: false,
                    message: 'Error al enviar el código de verificación. Por favor, intenta nuevamente.'
                });
            }

            return res.json({
                success: true,
                message: 'Se ha enviado un código de verificación a tu correo electrónico. El código expira en 10 minutos.'
            });

        } catch (error) {
            console.error('Error en solicitud de recuperación:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar la solicitud. Por favor, intenta nuevamente.'
            });
        }
    },

    async mostrarFormularioReset(req, res) {
        try {
            const { token } = req.params;
            const tokenValido = await servicioRecuperacion.verificarToken(token);

            if (!tokenValido) {
                return res.render('compartido/paginaError', {
                    title: 'Error',
                    message: 'Enlace inválido',
                    error: {
                        status: 400,
                        description: 'El enlace de recuperación no es válido o ha expirado'
                    },
                    layout: 'plantillas/principal'
                });
            }

            res.render('autenticacion/resetPassword', {
                title: 'Restablecer Contraseña - SENA',
                token,
                pagina: 'reset-password',
                layout: 'plantillas/principal'
            });

        } catch (error) {
            console.error('Error:', error);
            res.render('compartido/paginaError', {
                title: 'Error',
                message: 'Error al cargar el formulario',
                error: {
                    status: 500,
                    description: 'Error interno del servidor'
                },
                layout: 'plantillas/principal'
            });
        }
    },

    async resetPassword(req, res) {
        try {
            const { email, codigo, password, confirmPassword } = req.body;

            if (!email || !codigo || !password || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son requeridos.'
                });
            }

            // Verificar que las contraseñas coincidan
            if (password !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Las contraseñas no coinciden.'
                });
            }

            // Validar contraseña
            const errors = [];
            if (password.length < 12) errors.push('al menos 12 caracteres');
            if (!/[A-Z]/.test(password)) errors.push('una letra mayúscula');
            if (!/[a-z]/.test(password)) errors.push('una letra minúscula');
            if (!/[0-9]/.test(password)) errors.push('un número');
            if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) errors.push('un símbolo');
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe contener: ' + errors.join(', ')
                });
            }

            // Verificar código y obtener el role
            const infoCodigo = await servicioRecuperacion.verificarCodigo(email, codigo);
            if (!infoCodigo) {
                return res.status(400).json({
                    success: false,
                    message: 'El código de verificación es inválido o ha expirado.'
                });
            }
            const role = infoCodigo.role;

            // Hashear la nueva contraseña
            const hashedPassword = await bcrypt.hash(password, 10);
            let resultado;
            if (role === 'aprendiz') {
                resultado = await servicioAprendiz.actualizarPassword(email, hashedPassword);
            } else if (role === 'admin') {
                resultado = await consultasAdministrador.actualizarPassword(email, hashedPassword);
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'No se pudo determinar el tipo de usuario para actualizar la contraseña.'
                });
            }

            // Marcar el código como usado
            await servicioRecuperacion.marcarCodigoUsado(email, codigo);

            if (resultado?.success) {
                return res.json({
                    success: true,
                    message: 'Contraseña restablecida exitosamente. Ahora puedes iniciar sesión.',
                    redirect: '/'
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Error al actualizar la contraseña.'
                });
            }
        } catch (error) {
            console.error('Error al restablecer contraseña:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor al restablecer la contraseña.'
            });
        }
    }
};

module.exports = controladorRecuperacion;