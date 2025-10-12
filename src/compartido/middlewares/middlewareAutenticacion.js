// Ruta: src/compartido/middlewares/middlewareAutenticacion.js
// Propósito: Proporciona middlewares para proteger rutas y validar el estado
// de autenticación de los usuarios.

const AuthMiddleware = {
    // Configuración de tiempo de expiración (30 minutos)
    SESSION_TIMEOUT: 10 * 60 * 1000, // 30 minutos en milisegundos

    /* Función auxiliar para configurar headers de no-cache */
    setNoCacheHeaders: (res) => {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
    },

    /* Middleware para verificar expiración de sesión por inactividad */
    verificarExpiracionSesion: (req, res, next) => {
        if (req.session && req.session.userId) {
            const ahora = Date.now();
            const ultimaActividad = req.session.lastActivity || req.session.cookie._expires;

            if (ultimaActividad && (ahora - ultimaActividad) > AuthMiddleware.SESSION_TIMEOUT) {
                // Sesión expirada, destruirla
                req.session.destroy((err) => {
                    if (err) {
                        console.error('Error al destruir sesión expirada:', err);
                    }
                    return res.redirect('/');
                });
                return;
            }

            // Actualizar timestamp de última actividad
            req.session.lastActivity = ahora;
        }
        next();
    },

    /* Middleware para proteger rutas de administradores. */
    validarSesionAdmin: (req, res, next) => {
        console.log('🔐 Verificando sesión de administrador...');

        if (req.session && req.session.userId && req.session.userRole === 'admin') {
            console.log('✅ Sesión válida como administrador.');
            AuthMiddleware.setNoCacheHeaders(res);
            return next();
        }

        console.log('❌ Acceso denegado: no hay sesión o el rol no es admin. Redirigiendo a /auth/login');
        req.session.redirectUrl = req.originalUrl;
        return res.redirect('/auth/login');
    },


    /**
     * Middleware para evitar que usuarios autenticados accedan a login/registro.
     */
    validarNoAutenticado: (req, res, next) => {
        if (req.session && req.session.userId) {
            const redirectUrl = req.session.userRole === 'admin'
                ? '/administrador/panel-principal'
                : '/aprendiz/dashboard';
            return res.redirect(redirectUrl);
        }
        AuthMiddleware.setNoCacheHeaders(res);
        next();
    },

    /**
     * Verifica si existe un registro en proceso.
     */
    verificarRegistro: (req, res, next) => {
        console.log('🔍 Verificando registro en proceso...');
        console.log('Sesión:', {
            registroEnProceso: req.session?.registroEnProceso,
            userEmail: req.session?.userEmail,
            userRole: req.session?.userRole
        });

        if (!req.session || !req.session.registroEnProceso || !req.session.userEmail) {
            console.log('❌ No hay registro en proceso. Redirigiendo a inicio.');
            return res.redirect('/');
        }

        console.log('✅ Registro en proceso verificado.');
        next();
    },

    /**
     * Middleware para proteger rutas de aprendices.
     */
    validarSesionAprendiz: (req, res, next) => {
        if (!req.session || req.session.userRole !== 'aprendiz') {
            return res.redirect('/auth/login');
        }
        AuthMiddleware.setNoCacheHeaders(res);
        next();
    },

    /**
     * Carga los datos del usuario autenticado en res.locals
     */
    cargarUsuario: (req, res, next) => {
        if (req.session && req.session.userId) {
            res.locals.user = {
                id: req.session.userId,
                email: req.session.userEmail,
                name: req.session.userName
            };
            res.locals.userRole = req.session.userRole;
            console.log('Usuario cargado en locals:', res.locals.userRole);
        }
        next();
    },

    /**
     * Middleware para proteger rutas autenticadas generales
     */
    validarAutenticado: (req, res, next) => {
        if (!req.session || !req.session.userId) {
            return res.redirect('/auth/login');
        }
        AuthMiddleware.setNoCacheHeaders(res);
        next();
    }
};

module.exports = AuthMiddleware;
