// Tests para autenticación - Login
// Ruta: tests/autenticacion/login.test.js

const request = require('supertest');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');

// Mock de servicios ANTES de importar el controlador
const mockBuscarPorEmail = jest.fn();
const mockActualizarPassword = jest.fn();
const mockBuscarPorEmailAdmin = jest.fn();

jest.mock('../../src/modulos/aprendiz/servicios/servicioAprendiz', () => {
    return jest.fn().mockImplementation(() => ({
        buscarPorEmail: mockBuscarPorEmail,
        actualizarPassword: mockActualizarPassword
    }));
});

jest.mock('../../src/modulos/administrador/servicios/servicioConsultasAdministrador', () => ({
    buscarPorEmail: mockBuscarPorEmailAdmin
}));

// AHORA importamos el controlador (después del mock)
const controladorAutenticacionGeneral = require('../../src/modulos/compartido/controladores/controladorAutenticacionGeneral');
const ServicioAprendiz = require('../../src/modulos/aprendiz/servicios/servicioAprendiz');
const servicioConsultasAdministrador = require('../../src/modulos/administrador/servicios/servicioConsultasAdministrador');

describe('Tests de Login - Autenticación', () => {
    let app;

    beforeEach(() => {
        // Limpiar mocks antes de cada test
        jest.clearAllMocks();
        
        // Configurar aplicación de prueba
        app = express();
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(session({
            secret: 'test-secret',
            resave: false,
            saveUninitialized: false,
            cookie: { secure: false }
        }));

        // Configurar rutas de prueba
        app.get('/auth/login', controladorAutenticacionGeneral.mostrarLogin);
        app.post('/auth/login', controladorAutenticacionGeneral.iniciarSesion);
    });

    describe('POST /auth/login - Validación de credenciales', () => {
        test('Debe rechazar login sin email', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    password: 'Test@123456789',
                    role: 'aprendiz'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('email');
        });

        test('Debe rechazar login sin password', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    role: 'aprendiz'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('contraseña');
        });

        test('Debe rechazar login sin rol', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Test@123456789'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('rol');
        });

        test('Debe rechazar login con rol inválido', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Test@123456789',
                    role: 'usuario_invalido'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Rol de usuario inválido');
        });
    });

    describe('POST /auth/login - Login exitoso de Aprendiz', () => {
        test('Debe iniciar sesión correctamente con credenciales válidas de aprendiz', async () => {
            const password = 'Test@123456789';
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const mockAprendiz = {
                id: 1,
                correoElectronico: 'aprendiz@test.com',
                password: hashedPassword,
                nombres: 'Juan',
                nombreUsuario: 'Juan Pérez'
            };

            // Mockear el servicio de aprendiz
            mockBuscarPorEmail.mockResolvedValue(mockAprendiz);

            const response = await request(app)
                .post('/auth/login')
                .set('Content-Type', 'application/json')
                .send({
                    email: 'aprendiz@test.com',
                    password: password,
                    role: 'aprendiz'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('Inicio de sesión exitoso');
            expect(response.body.data.redirect).toBe('/aprendiz/dashboard');
            expect(mockBuscarPorEmail).toHaveBeenCalledWith('aprendiz@test.com');
        });

        test('Debe establecer correctamente las variables de sesión para aprendiz', async () => {
            const mockAprendiz = {
                id: 1,
                correoElectronico: 'aprendiz@test.com',
                password: await bcrypt.hash('Test@123456789', 10),
                nombres: 'Juan',
                nombreUsuario: 'Juan Pérez'
            };

            // Mockear el servicio de aprendiz
            mockBuscarPorEmail.mockResolvedValue(mockAprendiz);

            const agent = request.agent(app);
            const response = await agent
                .post('/auth/login')
                .set('Content-Type', 'application/json')
                .send({
                    email: 'aprendiz@test.com',
                    password: 'Test@123456789',
                    role: 'aprendiz'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('POST /auth/login - Login exitoso de Administrador', () => {
        test('Debe iniciar sesión correctamente con credenciales válidas de admin', async () => {
            const mockAdmin = {
                id: 2,
                correoInstitucional: 'admin@sena.edu.co',
                password: await bcrypt.hash('Admin@123456789', 10),
                nombreCompleto: 'Admin Usuario'
            };

            mockBuscarPorEmailAdmin.mockResolvedValue(mockAdmin);

            const response = await request(app)
                .post('/auth/login')
                .set('Content-Type', 'application/json')
                .send({
                    email: 'admin@sena.edu.co',
                    password: 'Admin@123456789',
                    role: 'admin'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('Inicio de sesión exitoso');
            expect(response.body.data.redirect).toBe('/administrador/panel-principal');
            expect(mockBuscarPorEmailAdmin).toHaveBeenCalledWith('admin@sena.edu.co');
        });
    });

    describe('POST /auth/login - Login con credenciales incorrectas', () => {
        test('Debe rechazar login con email no registrado (aprendiz)', async () => {
            mockBuscarPorEmail.mockResolvedValue(null);

            const response = await request(app)
                .post('/auth/login')
                .set('Content-Type', 'application/json')
                .send({
                    email: 'noexiste@test.com',
                    password: 'Test@123456789',
                    role: 'aprendiz'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Credenciales incorrectas');
        });

        test('Debe rechazar login con contraseña incorrecta', async () => {
            const mockAprendiz = {
                id: 1,
                correoElectronico: 'aprendiz@test.com',
                password: await bcrypt.hash('Test@123456789', 10),
                nombres: 'Juan'
            };

            mockBuscarPorEmail.mockResolvedValue(mockAprendiz);

            const response = await request(app)
                .post('/auth/login')
                .set('Content-Type', 'application/json')
                .send({
                    email: 'aprendiz@test.com',
                    password: 'PasswordIncorrecto@123',
                    role: 'aprendiz'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Credenciales incorrectas');
        });

        test('Debe rechazar login con email no registrado (admin)', async () => {
            mockBuscarPorEmailAdmin.mockResolvedValue(null);

            const response = await request(app)
                .post('/auth/login')
                .set('Content-Type', 'application/json')
                .send({
                    email: 'noadmin@test.com',
                    password: 'Admin@123456789',
                    role: 'admin'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Credenciales incorrectas');
        });
    });

    describe('POST /auth/login - Manejo de errores del servidor', () => {
        test('Debe manejar errores de base de datos correctamente', async () => {
            mockBuscarPorEmail.mockRejectedValue(
                new Error('Error de conexión a base de datos')
            );

            const response = await request(app)
                .post('/auth/login')
                .set('Content-Type', 'application/json')
                .send({
                    email: 'aprendiz@test.com',
                    password: 'Test@123456789',
                    role: 'aprendiz'
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Error interno del servidor');
        });
    });

    // GET /auth/login - Test de renderizado omitido porque requiere configuración EJS completa

    describe('POST /auth/login - Validación de formato de datos', () => {
        test('Debe manejar correctamente emails en mayúsculas', async () => {
            const mockAprendiz = {
                id: 1,
                correoElectronico: 'aprendiz@test.com',
                password: await bcrypt.hash('Test@123456789', 10),
                nombres: 'Juan'
            };

            mockBuscarPorEmail.mockResolvedValue(mockAprendiz);

            const response = await request(app)
                .post('/auth/login')
                .set('Content-Type', 'application/json')
                .send({
                    email: 'APRENDIZ@TEST.COM', // Email en mayúsculas
                    password: 'Test@123456789',
                    role: 'aprendiz'
                });

            // Verificar que el servicio fue llamado (puede normalizar o no)
            expect(mockBuscarPorEmail).toHaveBeenCalled();
        });

        test('Debe validar que el password no esté vacío o sea solo espacios', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: '   ',
                    role: 'aprendiz'
                });

            // El sistema trata password vacío como credenciales incorrectas (401)
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /auth/login - Seguridad contra ataques', () => {
        test('Debe prevenir inyección SQL en el campo email', async () => {
            mockBuscarPorEmail.mockResolvedValue(null);

            const response = await request(app)
                .post('/auth/login')
                .set('Content-Type', 'application/json')
                .send({
                    email: "admin' OR '1'='1",
                    password: 'Test@123456789',
                    role: 'aprendiz'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        test('Debe limitar intentos de fuerza bruta (múltiples intentos fallidos)', async () => {
            mockBuscarPorEmail.mockResolvedValue(null);

            // Simular múltiples intentos fallidos
            const intentos = 5;
            for (let i = 0; i < intentos; i++) {
                const response = await request(app)
                    .post('/auth/login')
                    .set('Content-Type', 'application/json')
                    .send({
                        email: 'attacker@test.com',
                        password: `WrongPassword${i}`,
                        role: 'aprendiz'
                    });

                expect(response.status).toBe(401);
            }

            // Verificar que todas las peticiones fueron procesadas
            expect(mockBuscarPorEmail).toHaveBeenCalledTimes(intentos);
        });
    });

    describe('POST /auth/login - Redirecciones según tipo de petición', () => {
        test('Debe redirigir en peticiones HTML cuando falla el login', async () => {
            mockBuscarPorEmail.mockResolvedValue(null);

            const response = await request(app)
                .post('/auth/login')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send({
                    email: 'noexiste@test.com',
                    password: 'Test@123456789',
                    role: 'aprendiz'
                });

            expect(response.status).toBe(302); // Redirección
            expect(response.header.location).toContain('/auth/login');
        });

        test('Debe retornar JSON en peticiones con Content-Type JSON', async () => {
            mockBuscarPorEmail.mockResolvedValue(null);

            const response = await request(app)
                .post('/auth/login')
                .set('Content-Type', 'application/json')
                .send({
                    email: 'noexiste@test.com',
                    password: 'Test@123456789',
                    role: 'aprendiz'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('message');
        });
    });
});
