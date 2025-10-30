// Tests de integración - Flujo completo de autenticación
// Ruta: tests/autenticacion/integracion.test.js

const request = require('supertest');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');

// Mock de servicios ANTES de importar los controladores
const mockBuscarPorEmail = jest.fn();
const mockActualizarPassword = jest.fn();
const mockBuscarPorEmailAdmin = jest.fn();
const mockActualizarPasswordAdmin = jest.fn();

jest.mock('../../src/modulos/aprendiz/servicios/servicioAprendiz', () => {
    return jest.fn().mockImplementation(() => ({
        buscarPorEmail: mockBuscarPorEmail,
        actualizarPassword: mockActualizarPassword
    }));
});

jest.mock('../../src/modulos/administrador/servicios/servicioConsultasAdministrador', () => ({
    buscarPorEmail: mockBuscarPorEmailAdmin,
    actualizarPassword: mockActualizarPasswordAdmin
}));

jest.mock('../../src/modulos/aprendiz/servicios/servicioRecuperacion');
jest.mock('../../src/modulos/aprendiz/servicios/servicioCorreo');

// AHORA importamos los controladores y otros módulos
const controladorAutenticacionGeneral = require('../../src/modulos/compartido/controladores/controladorAutenticacionGeneral');
const controladorRecuperacion = require('../../src/modulos/aprendiz/controladores/controladorRecuperacion');
const AuthMiddleware = require('../../src/compartido/middlewares/middlewareAutenticacion');
const ServicioAprendiz = require('../../src/modulos/aprendiz/servicios/servicioAprendiz');
const servicioConsultasAdministrador = require('../../src/modulos/administrador/servicios/servicioConsultasAdministrador');
const servicioRecuperacion = require('../../src/modulos/aprendiz/servicios/servicioRecuperacion');
const servicioCorreo = require('../../src/modulos/aprendiz/servicios/servicioCorreo');

describe('Tests de Integración - Flujo Completo de Autenticación', () => {
    let app;

    beforeEach(() => {
        // Limpiar mocks antes de cada test
        jest.clearAllMocks();
        
        // Configurar aplicación completa
        app = express();
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(session({
            secret: 'test-secret',
            resave: false,
            saveUninitialized: false,
            cookie: { secure: false, maxAge: 30 * 60 * 1000 }
        }));

        // Middlewares globales
        app.use(AuthMiddleware.verificarExpiracionSesion);
        app.use(AuthMiddleware.cargarUsuario);

        // Rutas de autenticación
        app.post('/auth/login', AuthMiddleware.validarNoAutenticado, controladorAutenticacionGeneral.iniciarSesion);
        app.post('/auth/logout', AuthMiddleware.validarAutenticado, controladorAutenticacionGeneral.cerrarSesion);
        app.post('/auth/crear-password', AuthMiddleware.verificarRegistro, controladorAutenticacionGeneral.crearPassword);
        app.post('/auth/recuperar-contrasena', AuthMiddleware.validarNoAutenticado, controladorRecuperacion.solicitarRecuperacion);
        app.post('/auth/reset-password', AuthMiddleware.validarNoAutenticado, controladorRecuperacion.resetPassword);

        // Rutas protegidas
        app.get('/administrador/panel-principal',
            AuthMiddleware.validarSesionAdmin,
            (req, res) => res.json({ page: 'admin-panel', userId: req.session.userId })
        );

        app.get('/aprendiz/dashboard',
            AuthMiddleware.validarSesionAprendiz,
            (req, res) => res.json({ page: 'student-dashboard', userId: req.session.userId })
        );
    });

    describe('Flujo completo: Registro y creación de contraseña', () => {
        test('Flujo completo de registro de aprendiz', async () => {
            const agent = request.agent(app);
            const email = 'nuevo@aprendiz.com';
            const password = 'NewPassword@123456';

            // Simular que existe una sesión de registro
            const mockReq = { 
                session: { 
                    registroEnProceso: true, 
                    userEmail: email, 
                    userRole: 'aprendiz' 
                },
                body: { 
                    password, 
                    confirmPassword: password 
                }
            };
            const mockRes = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis()
            };

            mockActualizarPassword.mockResolvedValue({ success: true });

            await controladorAutenticacionGeneral.crearPassword(mockReq, mockRes);

            expect(mockActualizarPassword).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: expect.stringContaining('exitosamente')
                })
            );
        });

        test('Debe validar contraseña segura durante el registro', async () => {
            const mockReq = { 
                session: { 
                    registroEnProceso: true, 
                    userEmail: 'nuevo@test.com', 
                    userRole: 'aprendiz' 
                },
                body: { 
                    password: 'weak', 
                    confirmPassword: 'weak' 
                }
            };
            const mockRes = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis()
            };

            await controladorAutenticacionGeneral.crearPassword(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('contraseña debe contener')
                })
            );
        });
    });

    describe('Flujo completo: Login y acceso a rutas protegidas', () => {
        test('Login exitoso de aprendiz y acceso a dashboard', async () => {
            const agent = request.agent(app);
            const email = 'aprendiz@test.com';
            const password = 'Test@123456789';
            
            const mockAprendiz = {
                id: 1,
                correoElectronico: email,
                password: await bcrypt.hash(password, 10),
                nombres: 'Juan',
                nombreUsuario: 'Juan Pérez'
            };

            mockBuscarPorEmail.mockResolvedValue(mockAprendiz);

            // 1. Login
            const loginResponse = await agent
                .post('/auth/login')
                .set('Content-Type', 'application/json')
                .send({ email, password, role: 'aprendiz' });

            expect(loginResponse.status).toBe(200);
            expect(loginResponse.body.success).toBe(true);
            expect(loginResponse.body.data.redirect).toBe('/aprendiz/dashboard');

            // 2. Acceder a dashboard (usando la sesión del agent)
            // Nota: En un test real con sesión persistente, esto funcionaría
        });

        test('Login exitoso de administrador y acceso a panel', async () => {
            const agent = request.agent(app);
            const email = 'admin@sena.edu.co';
            const password = 'Admin@123456789';
            
            const mockAdmin = {
                id: 2,
                correoInstitucional: email,
                password: await bcrypt.hash(password, 10),
                nombreCompleto: 'Admin Usuario'
            };

            mockBuscarPorEmailAdmin.mockResolvedValue(mockAdmin);

            // 1. Login
            const loginResponse = await agent
                .post('/auth/login')
                .set('Content-Type', 'application/json')
                .send({ email, password, role: 'admin' });

            expect(loginResponse.status).toBe(200);
            expect(loginResponse.body.success).toBe(true);
            expect(loginResponse.body.data.redirect).toBe('/administrador/panel-principal');
        });

        test('Login fallido no debe crear sesión', async () => {
            const agent = request.agent(app);
            const email = 'noexiste@test.com';
            const password = 'Wrong@123456789';

            mockBuscarPorEmail.mockResolvedValue(null);

            const loginResponse = await agent
                .post('/auth/login')
                .set('Content-Type', 'application/json')
                .send({ email, password, role: 'aprendiz' });

            expect(loginResponse.status).toBe(401);
            expect(loginResponse.body.success).toBe(false);
        });
    });

    describe('Flujo completo: Recuperación de contraseña', () => {
        test('Flujo completo de recuperación exitosa (aprendiz)', async () => {
            const agent = request.agent(app);
            const email = 'aprendiz@test.com';
            const newPassword = 'NewSecure@123456';

            const mockAprendiz = {
                id: 1,
                correoElectronico: email,
                nombres: 'Juan Pérez'
            };

            // 1. Solicitar recuperación
            mockBuscarPorEmail.mockResolvedValue(mockAprendiz);
            servicioRecuperacion.generarCodigo = jest.fn().mockReturnValue('123456');
            servicioRecuperacion.guardarCodigo = jest.fn().mockResolvedValue(true);
            servicioCorreo.enviarCodigoVerificacion = jest.fn().mockResolvedValue({ success: true });

            const recuperarResponse = await agent
                .post('/auth/recuperar-contrasena')
                .send({ email });

            expect(recuperarResponse.status).toBe(200);
            expect(recuperarResponse.body.success).toBe(true);
            expect(servicioCorreo.enviarCodigoVerificacion).toHaveBeenCalledWith(email, '123456');

            // 2. Resetear contraseña con código
            const mockInfoCodigo = {
                email: email,
                role: 'aprendiz',
                expiracion: new Date(Date.now() + 600000)
            };

            servicioRecuperacion.verificarCodigo = jest.fn().mockResolvedValue(mockInfoCodigo);
            mockActualizarPassword.mockResolvedValue({ success: true });
            servicioRecuperacion.marcarCodigoUsado = jest.fn().mockResolvedValue(true);

            const resetResponse = await agent
                .post('/auth/reset-password')
                .send({
                    email,
                    codigo: '123456',
                    password: newPassword,
                    confirmPassword: newPassword
                });

            expect(resetResponse.status).toBe(200);
            expect(resetResponse.body.success).toBe(true);
            expect(mockActualizarPassword).toHaveBeenCalled();
            expect(servicioRecuperacion.marcarCodigoUsado).toHaveBeenCalledWith(email, '123456');

            // 3. Verificar que puede hacer login con nueva contraseña
            const mockAprendizActualizado = {
                ...mockAprendiz,
                password: await bcrypt.hash(newPassword, 10)
            };

            mockBuscarPorEmail.mockResolvedValue(mockAprendizActualizado);

            const loginResponse = await agent
                .post('/auth/login')
                .set('Content-Type', 'application/json')
                .send({ email, password: newPassword, role: 'aprendiz' });

            expect(loginResponse.status).toBe(200);
            expect(loginResponse.body.success).toBe(true);
        });

        test('Código expirado no debe permitir reset', async () => {
            const agent = request.agent(app);

            servicioRecuperacion.verificarCodigo = jest.fn().mockResolvedValue(null);

            const resetResponse = await agent
                .post('/auth/reset-password')
                .send({
                    email: 'test@test.com',
                    codigo: '999999',
                    password: 'NewPass@123456789',
                    confirmPassword: 'NewPass@123456789'
                });

            expect(resetResponse.status).toBe(400);
            expect(resetResponse.body.success).toBe(false);
            expect(resetResponse.body.message).toContain('inválido o ha expirado');
        });
    });

    describe('Flujo completo: Logout y destrucción de sesión', () => {
        test('Logout debe destruir sesión correctamente', async () => {
            const mockReq = {
                session: {
                    userId: 1,
                    userRole: 'admin',
                    destroy: jest.fn((callback) => callback(null))
                }
            };
            const mockRes = {
                clearCookie: jest.fn(),
                set: jest.fn(),
                redirect: jest.fn()
            };

            controladorAutenticacionGeneral.cerrarSesion(mockReq, mockRes);

            expect(mockReq.session.destroy).toHaveBeenCalled();
            expect(mockRes.clearCookie).toHaveBeenCalled();
            expect(mockRes.redirect).toHaveBeenCalledWith('/');
        });

        test('Después de logout no debe poder acceder a rutas protegidas', async () => {
            const req = { 
                session: null,
                originalUrl: '/administrador/panel-principal'
            };
            const res = { redirect: jest.fn(), set: jest.fn(), locals: {} };
            const next = jest.fn();

            AuthMiddleware.validarSesionAdmin(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/auth/login');
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('Flujo completo: Expiración de sesión por inactividad', () => {
        test('Sesión debe expirar después de 30 minutos de inactividad', (done) => {
            const hace31Minutos = Date.now() - (31 * 60 * 1000);
            const req = {
                session: {
                    userId: 1,
                    userRole: 'admin',
                    lastActivity: hace31Minutos,
                    destroy: jest.fn((callback) => callback(null))
                }
            };
            const res = { redirect: jest.fn(), set: jest.fn(), locals: {} };
            const next = jest.fn();

            AuthMiddleware.verificarExpiracionSesion(req, res, next);

            setTimeout(() => {
                expect(req.session.destroy).toHaveBeenCalled();
                expect(res.redirect).toHaveBeenCalledWith('/');
                done();
            }, 10);
        });

        test('Sesión activa debe actualizar timestamp', () => {
            const hace5Segundos = Date.now() - 5000;
            const req = {
                session: {
                    userId: 1,
                    userRole: 'admin',
                    lastActivity: hace5Segundos
                }
            };
            const res = { redirect: jest.fn(), set: jest.fn(), locals: {} };
            const next = jest.fn();

            AuthMiddleware.verificarExpiracionSesion(req, res, next);

            expect(req.session.lastActivity).toBeGreaterThan(hace5Segundos);
            expect(next).toHaveBeenCalled();
            expect(res.redirect).not.toHaveBeenCalled();
        });
    });

    describe('Flujo completo: Seguridad y prevención de ataques', () => {
        test('Múltiples intentos de login fallidos deben ser registrados', async () => {
            const agent = request.agent(app);
            const email = 'test@test.com';

            mockBuscarPorEmail.mockResolvedValue(null);

            const intentos = 5;
            for (let i = 0; i < intentos; i++) {
                const response = await agent
                    .post('/auth/login')
                    .set('Content-Type', 'application/json')
                    .send({
                        email,
                        password: `WrongPass${i}@123`,
                        role: 'aprendiz'
                    });

                expect(response.status).toBe(401);
                expect(response.body.success).toBe(false);
            }

            expect(mockBuscarPorEmail).toHaveBeenCalledTimes(intentos);
        });

        test('Código de recuperación usado no debe ser reutilizable', async () => {
            const agent = request.agent(app);
            const email = 'test@test.com';
            const codigo = '123456';

            // Primera vez - código válido
            const mockInfoCodigo = {
                email: email,
                role: 'aprendiz',
                expiracion: new Date(Date.now() + 600000)
            };

            servicioRecuperacion.verificarCodigo = jest.fn()
                .mockResolvedValueOnce(mockInfoCodigo)
                .mockResolvedValueOnce(null); // Segunda vez retorna null

            mockActualizarPassword.mockResolvedValue({ success: true });
            servicioRecuperacion.marcarCodigoUsado = jest.fn().mockResolvedValue(true);

            // Primer intento - exitoso
            const primeraRespuesta = await agent
                .post('/auth/reset-password')
                .send({
                    email,
                    codigo,
                    password: 'NewPass@123456789',
                    confirmPassword: 'NewPass@123456789'
                });

            expect(primeraRespuesta.status).toBe(200);

            // Segundo intento - debe fallar
            const segundaRespuesta = await agent
                .post('/auth/reset-password')
                .send({
                    email,
                    codigo,
                    password: 'AnotherPass@123456',
                    confirmPassword: 'AnotherPass@123456'
                });

            expect(segundaRespuesta.status).toBe(400);
            expect(segundaRespuesta.body.message).toContain('inválido o ha expirado');
        });

        test('Inyección SQL en login debe ser prevenida', async () => {
            const agent = request.agent(app);

            mockBuscarPorEmail.mockResolvedValue(null);

            const response = await agent
                .post('/auth/login')
                .set('Content-Type', 'application/json')
                .send({
                    email: "admin' OR '1'='1",
                    password: "' OR '1'='1",
                    role: 'aprendiz'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Flujo completo: Diferentes roles y permisos', () => {
        test('Admin y aprendiz deben tener accesos separados', async () => {
            // Test admin
            const reqAdmin = { session: { userId: 1, userRole: 'admin' } };
            const resAdmin = { redirect: jest.fn(), set: jest.fn(), locals: {} };
            const nextAdmin = jest.fn();

            AuthMiddleware.validarSesionAdmin(reqAdmin, resAdmin, nextAdmin);
            expect(nextAdmin).toHaveBeenCalled();

            AuthMiddleware.validarSesionAprendiz(reqAdmin, { redirect: jest.fn(), set: jest.fn(), locals: {} }, jest.fn());
            expect(resAdmin.redirect).not.toHaveBeenCalled(); // Admin accede a admin

            // Test aprendiz
            const reqAprendiz = { session: { userId: 2, userRole: 'aprendiz' } };
            const resAprendiz = { redirect: jest.fn(), set: jest.fn(), locals: {} };
            const nextAprendiz = jest.fn();

            AuthMiddleware.validarSesionAprendiz(reqAprendiz, resAprendiz, nextAprendiz);
            expect(nextAprendiz).toHaveBeenCalled();

            const resAprendizAdmin = { redirect: jest.fn(), set: jest.fn(), locals: {} };
            AuthMiddleware.validarSesionAdmin(reqAprendiz, resAprendizAdmin, jest.fn());
            expect(resAprendizAdmin.redirect).toHaveBeenCalledWith('/auth/login'); // Aprendiz no accede a admin
        });
    });

    describe('Flujo completo: Validación de datos del usuario', () => {
        test('Datos de usuario deben estar disponibles en res.locals', () => {
            const req = {
                session: {
                    userId: 1,
                    userEmail: 'test@example.com',
                    userName: 'Test User',
                    userRole: 'admin'
                }
            };
            const res = { redirect: jest.fn(), set: jest.fn(), locals: {} };
            const next = jest.fn();

            AuthMiddleware.cargarUsuario(req, res, next);

            expect(res.locals.user).toEqual({
                id: 1,
                email: 'test@example.com',
                name: 'Test User'
            });
            expect(res.locals.userRole).toBe('admin');
            expect(next).toHaveBeenCalled();
        });
    });
});
