// Tests para Middleware de Autenticación
// Ruta: tests\autenticacion\middleware.test.js

const AuthMiddleware = require('../../src/compartido/middlewares/middlewareAutenticacion');

describe('Tests de Middleware de Autenticación', () => {
    let req, res, next;

    beforeEach(() => {
        // Configurar objetos mock de request, response y next
        req = {
            session: {},
            originalUrl: '/test-url',
            headers: {}
        };
        res = {
            redirect: jest.fn(),
            set: jest.fn(),
            locals: {}
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('verificarExpiracionSesion - Control de expiración de sesión', () => {
        test('Debe permitir continuar si no hay sesión activa', () => {
            req.session = null;

            AuthMiddleware.verificarExpiracionSesion(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.redirect).not.toHaveBeenCalled();
        });

        test('Debe actualizar timestamp de última actividad en sesión válida', () => {
            const ahora = Date.now();
            req.session = {
                userId: 1,
                lastActivity: ahora - 5000 // 5 segundos atrás
            };

            AuthMiddleware.verificarExpiracionSesion(req, res, next);

            expect(req.session.lastActivity).toBeGreaterThan(ahora - 5000);
            expect(next).toHaveBeenCalled();
        });

        test('Debe destruir sesión si ha expirado (más de 30 minutos)', (done) => {
            const hace31Minutos = Date.now() - (31 * 60 * 1000);
            req.session = {
                userId: 1,
                lastActivity: hace31Minutos,
                destroy: jest.fn((callback) => callback(null))
            };

            AuthMiddleware.verificarExpiracionSesion(req, res, next);

            // Esperar a que se ejecute la destrucción asíncrona
            setTimeout(() => {
                expect(req.session.destroy).toHaveBeenCalled();
                expect(res.redirect).toHaveBeenCalledWith('/');
                expect(next).not.toHaveBeenCalled();
                done();
            }, 10);
        });

        test('Debe manejar error al destruir sesión expirada', (done) => {
            const hace31Minutos = Date.now() - (31 * 60 * 1000);
            req.session = {
                userId: 1,
                lastActivity: hace31Minutos,
                destroy: jest.fn((callback) => callback(new Error('Error de BD')))
            };

            // Espiar console.error
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            AuthMiddleware.verificarExpiracionSesion(req, res, next);

            setTimeout(() => {
                expect(consoleSpy).toHaveBeenCalled();
                expect(res.redirect).toHaveBeenCalledWith('/');
                consoleSpy.mockRestore();
                done();
            }, 10);
        });
    });

    describe('validarSesionAdmin - Protección de rutas de administrador', () => {
        test('Debe permitir acceso a administrador autenticado', () => {
            req.session = {
                userId: 1,
                userRole: 'admin'
            };

            AuthMiddleware.validarSesionAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.redirect).not.toHaveBeenCalled();
            expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-store, must-revalidate');
        });

        test('Debe redirigir a login si no hay sesión', () => {
            req.session = {}; // Necesita ser un objeto para poder establecer redirectUrl

            AuthMiddleware.validarSesionAdmin(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/auth/login');
            expect(next).not.toHaveBeenCalled();
        });

        test('Debe redirigir a login si no hay userId', () => {
            req.session = {
                userRole: 'admin'
            };

            AuthMiddleware.validarSesionAdmin(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/auth/login');
            expect(next).not.toHaveBeenCalled();
        });

        test('Debe redirigir a login si el rol no es admin', () => {
            req.session = {
                userId: 1,
                userRole: 'aprendiz'
            };

            AuthMiddleware.validarSesionAdmin(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/auth/login');
            expect(next).not.toHaveBeenCalled();
        });

        test('Debe guardar URL de redirección cuando se rechaza el acceso', () => {
            req.session = {
                userId: 1,
                userRole: 'aprendiz'
            };
            req.originalUrl = '/administrador/panel-principal';

            AuthMiddleware.validarSesionAdmin(req, res, next);

            expect(req.session.redirectUrl).toBe('/administrador/panel-principal');
            expect(res.redirect).toHaveBeenCalledWith('/auth/login');
        });

        test('Debe establecer headers de no-cache correctamente', () => {
            req.session = {
                userId: 1,
                userRole: 'admin'
            };

            AuthMiddleware.validarSesionAdmin(req, res, next);

            expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-store, must-revalidate');
            expect(res.set).toHaveBeenCalledWith('Pragma', 'no-cache');
            expect(res.set).toHaveBeenCalledWith('Expires', '0');
        });
    });

    describe('validarSesionAprendiz - Protección de rutas de aprendiz', () => {
        test('Debe permitir acceso a aprendiz autenticado', () => {
            req.session = {
                userId: 1,
                userRole: 'aprendiz'
            };

            AuthMiddleware.validarSesionAprendiz(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.redirect).not.toHaveBeenCalled();
        });

        test('Debe redirigir a login si no hay sesión', () => {
            req.session = null;

            AuthMiddleware.validarSesionAprendiz(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/auth/login');
            expect(next).not.toHaveBeenCalled();
        });

        test('Debe redirigir a login si el rol no es aprendiz', () => {
            req.session = {
                userId: 1,
                userRole: 'admin'
            };

            AuthMiddleware.validarSesionAprendiz(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/auth/login');
            expect(next).not.toHaveBeenCalled();
        });

        test('Debe establecer headers de no-cache', () => {
            req.session = {
                userId: 1,
                userRole: 'aprendiz'
            };

            AuthMiddleware.validarSesionAprendiz(req, res, next);

            expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-store, must-revalidate');
        });
    });

    describe('validarNoAutenticado - Prevenir acceso a páginas públicas cuando está autenticado', () => {
        test('Debe redirigir a dashboard si aprendiz ya está autenticado', () => {
            req.session = {
                userId: 1,
                userRole: 'aprendiz'
            };

            AuthMiddleware.validarNoAutenticado(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/aprendiz/dashboard');
            expect(next).not.toHaveBeenCalled();
        });

        test('Debe redirigir a panel-principal si admin ya está autenticado', () => {
            req.session = {
                userId: 2,
                userRole: 'admin'
            };

            AuthMiddleware.validarNoAutenticado(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/administrador/panel-principal');
            expect(next).not.toHaveBeenCalled();
        });

        test('Debe permitir acceso si no hay sesión', () => {
            req.session = null;

            AuthMiddleware.validarNoAutenticado(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.redirect).not.toHaveBeenCalled();
        });

        test('Debe permitir acceso si sesión no tiene userId', () => {
            req.session = {
                userRole: 'aprendiz'
            };

            AuthMiddleware.validarNoAutenticado(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.redirect).not.toHaveBeenCalled();
        });

        test('Debe establecer headers de no-cache cuando permite acceso', () => {
            req.session = null;

            AuthMiddleware.validarNoAutenticado(req, res, next);

            expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-store, must-revalidate');
        });
    });

    describe('verificarRegistro - Validar proceso de registro en curso', () => {
        test('Debe permitir continuar si hay registro en proceso', () => {
            req.session = {
                registroEnProceso: true,
                userEmail: 'nuevo@test.com',
                userRole: 'aprendiz'
            };

            AuthMiddleware.verificarRegistro(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.redirect).not.toHaveBeenCalled();
        });

        test('Debe redirigir a inicio si no hay registro en proceso', () => {
            req.session = {
                userEmail: 'nuevo@test.com'
            };

            AuthMiddleware.verificarRegistro(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/');
            expect(next).not.toHaveBeenCalled();
        });

        test('Debe redirigir a inicio si falta userEmail', () => {
            req.session = {
                registroEnProceso: true,
                userRole: 'aprendiz'
            };

            AuthMiddleware.verificarRegistro(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/');
            expect(next).not.toHaveBeenCalled();
        });

        test('Debe redirigir a inicio si no hay sesión', () => {
            req.session = null;

            AuthMiddleware.verificarRegistro(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/');
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('cargarUsuario - Cargar datos de usuario en res.locals', () => {
        test('Debe cargar datos de usuario en res.locals si hay sesión', () => {
            req.session = {
                userId: 1,
                userEmail: 'test@example.com',
                userName: 'Test User',
                userRole: 'admin'
            };

            AuthMiddleware.cargarUsuario(req, res, next);

            expect(res.locals.user).toEqual({
                id: 1,
                email: 'test@example.com',
                name: 'Test User'
            });
            expect(res.locals.userRole).toBe('admin');
            expect(next).toHaveBeenCalled();
        });

        test('No debe cargar datos si no hay sesión', () => {
            req.session = null;

            AuthMiddleware.cargarUsuario(req, res, next);

            expect(res.locals.user).toBeUndefined();
            expect(res.locals.userRole).toBeUndefined();
            expect(next).toHaveBeenCalled();
        });

        test('No debe cargar datos si sesión no tiene userId', () => {
            req.session = {
                userEmail: 'test@example.com'
            };

            AuthMiddleware.cargarUsuario(req, res, next);

            expect(res.locals.user).toBeUndefined();
            expect(next).toHaveBeenCalled();
        });
    });

    describe('validarAutenticado - Validar cualquier usuario autenticado', () => {
        test('Debe permitir acceso si hay sesión válida', () => {
            req.session = {
                userId: 1,
                userRole: 'aprendiz'
            };

            AuthMiddleware.validarAutenticado(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.redirect).not.toHaveBeenCalled();
        });

        test('Debe redirigir a login si no hay sesión', () => {
            req.session = null;

            AuthMiddleware.validarAutenticado(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/auth/login');
            expect(next).not.toHaveBeenCalled();
        });

        test('Debe redirigir a login si no hay userId', () => {
            req.session = {
                userRole: 'aprendiz'
            };

            AuthMiddleware.validarAutenticado(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/auth/login');
            expect(next).not.toHaveBeenCalled();
        });

        test('Debe establecer headers de no-cache cuando permite acceso', () => {
            req.session = {
                userId: 1,
                userRole: 'admin'
            };

            AuthMiddleware.validarAutenticado(req, res, next);

            expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-store, must-revalidate');
        });
    });

    describe('setNoCacheHeaders - Configuración de headers', () => {
        test('Debe establecer todos los headers de no-cache correctamente', () => {
            AuthMiddleware.setNoCacheHeaders(res);

            expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-store, must-revalidate');
            expect(res.set).toHaveBeenCalledWith('Pragma', 'no-cache');
            expect(res.set).toHaveBeenCalledWith('Expires', '0');
            expect(res.set).toHaveBeenCalledTimes(3);
        });
    });

    describe('SESSION_TIMEOUT - Configuración de tiempo de expiración', () => {
        test('Debe estar configurado en 10 minutos (600000 ms)', () => {
            expect(AuthMiddleware.SESSION_TIMEOUT).toBe(10 * 60 * 1000);
            expect(AuthMiddleware.SESSION_TIMEOUT).toBe(600000);
        });
    });

    describe('Integración - Flujo completo de autenticación', () => {
        test('Debe permitir acceso completo a admin con sesión válida y reciente', () => {
            req.session = {
                userId: 1,
                userRole: 'admin',
                userEmail: 'admin@test.com',
                userName: 'Admin User',
                lastActivity: Date.now() - 5000 // 5 segundos atrás
            };

            // 1. Verificar expiración
            AuthMiddleware.verificarExpiracionSesion(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);

            // 2. Cargar usuario
            AuthMiddleware.cargarUsuario(req, res, next);
            expect(next).toHaveBeenCalledTimes(2);
            expect(res.locals.user).toBeDefined();

            // 3. Validar sesión admin
            AuthMiddleware.validarSesionAdmin(req, res, next);
            expect(next).toHaveBeenCalledTimes(3);
            expect(res.redirect).not.toHaveBeenCalled();
        });

        test('Debe bloquear acceso completo si sesión expiró', (done) => {
            req.session = {
                userId: 1,
                userRole: 'admin',
                lastActivity: Date.now() - (31 * 60 * 1000),
                destroy: jest.fn((callback) => callback(null))
            };

            AuthMiddleware.verificarExpiracionSesion(req, res, next);

            setTimeout(() => {
                expect(res.redirect).toHaveBeenCalledWith('/');
                expect(next).not.toHaveBeenCalled();
                done();
            }, 10);
        });

        test('Debe bloquear admin intentando acceder a login', () => {
            req.session = {
                userId: 1,
                userRole: 'admin'
            };

            AuthMiddleware.validarNoAutenticado(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/administrador/panel-principal');
            expect(next).not.toHaveBeenCalled();
        });
    });
});
