// Ruta: src/modulos/compartido/controladores/controladorAutenticacionGeneral.js
// Propósito: Maneja la lógica de autenticación para aprendices y administradores.

const bcrypt = require('bcrypt');
const ServicioAprendiz = require('../../aprendiz/servicios/servicioAprendiz');
const servicioAprendiz = new ServicioAprendiz();
const servicioConsultasAdministrador = require('../../administrador/servicios/servicioConsultasAdministrador');
const { formatearRespuesta, formatearError } = require('../../../compartido/utilidades/utilRespuestas');

const controladorAutenticacionGeneral = {
    async mostrarLogin(req, res) {
        try {
            if (req.session?.userId) {
                const redirectUrl = req.session.userRole === 'admin'
                    ? '/administrador/panel-principal'
                    : '/aprendiz/dashboard';
                return res.redirect(redirectUrl);
            }

            res.render('autenticacion/login', {
                title: 'Iniciar Sesión - SENA',
                layout: 'plantillas/principal', // Volver a la plantilla principal
                error: req.query.error ? 'Credenciales incorrectas o usuario no encontrado.' : null,
                rol: req.query.rol // Pasar el rol recibido por query string
            });
        } catch (error) {
            console.error('Error al cargar la página de login general:', error);
            res.status(500).render('compartido/paginaError', {
                title: 'Error',
                message: 'No se pudo cargar la página de login',
                error: formatearError(error),
                layout: 'plantillas/principal'
            });
        }
    },

    async iniciarSesion(req, res) {
        const { email, password, role } = req.body;
        console.log('[DEBUG] Body recibido en login:', req.body);

        const missingFields = [];
        if (!email) missingFields.push('email');
        if (!password) missingFields.push('contraseña');
        if (!role) missingFields.push('rol');

        if (missingFields.length > 0) {
            return formatearRespuesta(res, {
                success: false,
                status: 400,
                message: `Faltan los siguientes campos: ${missingFields.join(', ')}.`
            });
        }

        const isAprendiz = role === 'aprendiz';
        const isAdmin = role === 'admin';

        if (!isAprendiz && !isAdmin) {
            return formatearRespuesta(res, {
                success: false,
                status: 400,
                message: 'Rol de usuario inválido. El rol debe ser "aprendiz" o "admin".'
            });
        }

        try {
            let user = null;
            let redirectUrl = '';

            if (isAprendiz) {
                user = await servicioAprendiz.buscarPorEmail(email);
                redirectUrl = '/aprendiz/dashboard';
            } else {
                user = await servicioConsultasAdministrador.buscarPorEmail(email);
                redirectUrl = '/administrador/panel-principal';
            }

            const expectsJSON =
                req.headers['content-type'] === 'application/json' ||
                req.headers.accept?.includes('application/json');

            if (!user || !(await bcrypt.compare(password, user.password))) {
                console.warn(`Login fallido para ${role} - ${email}`);

                if (expectsJSON) {
                    return formatearRespuesta(res, {
                        success: false,
                        status: 401,
                        message: 'Credenciales incorrectas o usuario no encontrado.'
                    });
                }

                return res.redirect('/auth/login?error=1');
            }

            req.session.userId = user.id;
            req.session.userEmail = isAdmin ? user.correoInstitucional : (user.correoElectronico || user.email);
            req.session.userRole = role;
            req.session.userName = isAdmin ? user.nombreCompleto : (user.nombreUsuario || user.nombres);

            console.log(`[LOGIN ÉXITO] ${role} inició sesión: ${email} → ${redirectUrl}`);

            if (expectsJSON) {
                return formatearRespuesta(res, {
                    success: true,
                    status: 200,
                    message: 'Inicio de sesión exitoso.',
                    data: { redirect: redirectUrl }
                });
            }

            return res.redirect(redirectUrl);

        } catch (error) {
            console.error('Error durante el inicio de sesión:', error);
            return formatearRespuesta(res, {
                success: false,
                status: 500,
                message: 'Error interno del servidor durante el inicio de sesión.',
                error: formatearError(error)
            });
        }
    },

    async cerrarSesion(req, res) {
        req.session.destroy(err => {
            if (err) {
                console.error('Error al cerrar sesión:', err);
                return res.status(500).send('No se pudo cerrar la sesión.');
            }
            res.clearCookie(process.env.SESSION_NAME || 'connect.sid');
            // Configurar headers para prevenir cache después del logout
            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.set('Pragma', 'no-cache');
            res.set('Expires', '0');
            res.redirect('/');
        });
    },

    async crearPassword(req, res) {
        let { password, confirmPassword, correoElectronico } = req.body;
        let email = req.session.userEmail;

        // Asegurar que ambos correos estén en minúsculas para comparación y búsqueda
        if (correoElectronico) correoElectronico = correoElectronico.toLowerCase();
        if (email) email = email.toLowerCase();

        if (!email) {
            return formatearRespuesta(res, {
                success: false,
                status: 400,
                message: 'Sesión inválida. Debe iniciar el proceso de registro nuevamente.'
            });
        }

        // Seguridad: Validar que el correo recibido por body (si existe) coincida con el de sesión
        if (correoElectronico && correoElectronico !== email) {
            return formatearRespuesta(res, {
                success: false,
                status: 400,
                message: 'El correo electrónico no coincide con la sesión activa.'
            });
        }

        if (!password || !confirmPassword) {
            return formatearRespuesta(res, {
                success: false,
                status: 400,
                message: 'La contraseña y su confirmación son requeridas.'
            });
        }

        if (password !== confirmPassword) {
            return formatearRespuesta(res, {
                success: false,
                status: 400,
                message: 'Las contraseñas no coinciden.'
            });
        }

        // Validación robusta de contraseña
        const errors = [];
        if (password.length < 12) errors.push('al menos 12 caracteres');
        if (!/[A-Z]/.test(password)) errors.push('una letra mayúscula');
        if (!/[a-z]/.test(password)) errors.push('una letra minúscula');
        if (!/[0-9]/.test(password)) errors.push('un número');
        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) errors.push('un símbolo');
        if (errors.length > 0) {
            return formatearRespuesta(res, {
                success: false,
                status: 400,
                message: 'La contraseña debe contener: ' + errors.join(', ')
            });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            let resultado;

            if (req.session.userRole === 'aprendiz') {
                resultado = await servicioAprendiz.actualizarPassword(email, hashedPassword);
            } else if (req.session.userRole === 'admin') {
                resultado = await servicioConsultasAdministrador.actualizarPassword(email, hashedPassword);
            } else {
                return formatearRespuesta(res, {
                    success: false,
                    status: 400,
                    message: 'Rol de usuario desconocido en sesión.'
                });
            }

            if (resultado?.success) {
                delete req.session.userEmail;
                delete req.session.registroEnProceso;
                return formatearRespuesta(res, {
                    success: true,
                    status: 200,
                    message: 'Contraseña creada exitosamente.',
                    data: { redirect: '/' }
                });
            }

            return formatearRespuesta(res, {
                success: false,
                status: 500,
                message: 'Error al crear la contraseña.'
            });
        } catch (error) {
            console.error('Error al crear contraseña:', error);
            return formatearRespuesta(res, {
                success: false,
                status: 500,
                message: 'Error interno del servidor al crear la contraseña.',
                error: formatearError(error)
            });
        }
    },

    async registrarAdminTemporal(req, res) {
        const { nombreUsuario, email, password } = req.body;

        if (!nombreUsuario || !email || !password) {
            return formatearRespuesta(res, {
                success: false,
                status: 400,
                message: 'Todos los campos son requeridos para el registro temporal de administrador.'
            });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const resultado = await servicioConsultasAdministrador.insertarAdministrador({
                nombreUsuario,
                correoElectronico: email,
                password: hashedPassword,
                rol: 'admin'
            });

            if (resultado?.success) {
                return formatearRespuesta(res, {
                    success: true,
                    status: 201,
                    message: 'Administrador registrado temporalmente con éxito.'
                });
            }

            return formatearRespuesta(res, {
                success: false,
                status: 500,
                message: resultado.message || 'Error al registrar administrador temporalmente.'
            });
        } catch (error) {
            if (error.message.includes('ER_DUP_ENTRY') || error.code === 'ER_DUP_ENTRY') {
                return formatearRespuesta(res, {
                    success: false,
                    status: 409,
                    message: 'El correo electrónico o nombre de usuario ya está registrado.'
                });
            }

            console.error('Error al registrar administrador temporalmente:', error);
            return formatearRespuesta(res, {
                success: false,
                status: 500,
                message: 'Error interno del servidor al registrar administrador temporalmente.',
                error: formatearError(error)
            });
        }
    }
};

module.exports = controladorAutenticacionGeneral;
