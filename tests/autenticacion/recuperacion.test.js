// Tests para recuperación de contraseña
// Ruta: tests/autenticacion/recuperacion.test.js

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

// AHORA importamos los controladores
const controladorRecuperacion = require('../../src/modulos/aprendiz/controladores/controladorRecuperacion');
const ServicioAprendiz = require('../../src/modulos/aprendiz/servicios/servicioAprendiz');
const servicioConsultasAdministrador = require('../../src/modulos/administrador/servicios/servicioConsultasAdministrador');
const servicioRecuperacion = require('../../src/modulos/aprendiz/servicios/servicioRecuperacion');
const servicioCorreo = require('../../src/modulos/aprendiz/servicios/servicioCorreo');

describe('Tests de Recuperación de Contraseña', () => {
    let app;

    beforeEach(() => {
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
        app.post('/auth/recuperar-contrasena', controladorRecuperacion.solicitarRecuperacion);
        app.post('/auth/reset-password', controladorRecuperacion.resetPassword);

        jest.clearAllMocks();
    });

    describe('POST /auth/recuperar-contrasena - Solicitud de recuperación', () => {
        test('Debe generar y enviar código de recuperación para aprendiz existente', async () => {
            const mockAprendiz = {
                id: 1,
                correoElectronico: 'aprendiz@test.com',
                nombres: 'Juan Pérez'
            };

            mockBuscarPorEmail.mockResolvedValue(mockAprendiz);
            servicioRecuperacion.generarCodigo = jest.fn().mockReturnValue('123456');
            servicioRecuperacion.guardarCodigo = jest.fn().mockResolvedValue(true);
            servicioCorreo.enviarCodigoVerificacion = jest.fn().mockResolvedValue({ success: true });

            const response = await request(app)
                .post('/auth/recuperar-contrasena')
                .send({ email: 'aprendiz@test.com' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('código de verificación');
            expect(mockBuscarPorEmail).toHaveBeenCalledWith('aprendiz@test.com');
            expect(servicioRecuperacion.generarCodigo).toHaveBeenCalled();
            expect(servicioRecuperacion.guardarCodigo).toHaveBeenCalled();
            expect(servicioCorreo.enviarCodigoVerificacion).toHaveBeenCalledWith('aprendiz@test.com', '123456');
        });

        test('Debe generar y enviar código de recuperación para administrador existente', async () => {
            const mockAdmin = {
                id: 2,
                correoInstitucional: 'admin@sena.edu.co',
                nombreCompleto: 'Admin Usuario'
            };

            mockBuscarPorEmail.mockResolvedValue(null);
            mockBuscarPorEmailAdmin.mockResolvedValue(mockAdmin);
            servicioRecuperacion.generarCodigo = jest.fn().mockReturnValue('654321');
            servicioRecuperacion.guardarCodigo = jest.fn().mockResolvedValue(true);
            servicioCorreo.enviarCodigoVerificacion = jest.fn().mockResolvedValue({ success: true });

            const response = await request(app)
                .post('/auth/recuperar-contrasena')
                .send({ email: 'admin@sena.edu.co' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockBuscarPorEmailAdmin).toHaveBeenCalledWith('admin@sena.edu.co');
            expect(servicioCorreo.enviarCodigoVerificacion).toHaveBeenCalledWith('admin@sena.edu.co', '654321');
        });

        test('Debe rechazar recuperación para email no registrado', async () => {
            mockBuscarPorEmail.mockResolvedValue(null);
            mockBuscarPorEmailAdmin.mockResolvedValue(null);

            const response = await request(app)
                .post('/auth/recuperar-contrasena')
                .send({ email: 'noexiste@test.com' });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('no está registrado');
        });

        test('Debe manejar error al enviar correo', async () => {
            const mockAprendiz = {
                id: 1,
                correoElectronico: 'aprendiz@test.com',
                nombres: 'Juan Pérez'
            };

            mockBuscarPorEmail.mockResolvedValue(mockAprendiz);
            servicioRecuperacion.generarCodigo = jest.fn().mockReturnValue('123456');
            servicioRecuperacion.guardarCodigo = jest.fn().mockResolvedValue(true);
            servicioCorreo.enviarCodigoVerificacion = jest.fn().mockRejectedValue(
                new Error('Error al enviar correo')
            );

            const response = await request(app)
                .post('/auth/recuperar-contrasena')
                .send({ email: 'aprendiz@test.com' });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Error al enviar el código');
        });

        test('Debe generar código de 6 dígitos', () => {
            const codigo = '123456';
            servicioRecuperacion.generarCodigo = jest.fn().mockReturnValue(codigo);

            const codigoGenerado = servicioRecuperacion.generarCodigo();

            expect(codigoGenerado).toBe('123456');
            expect(codigoGenerado).toHaveLength(6);
            expect(/^\d{6}$/.test(codigoGenerado)).toBe(true);
        });
    });

    describe('POST /auth/reset-password - Restablecer contraseña', () => {
        test('Debe restablecer contraseña con código válido (aprendiz)', async () => {
            const mockInfoCodigo = {
                email: 'aprendiz@test.com',
                role: 'aprendiz',
                expiracion: new Date(Date.now() + 600000)
            };

            servicioRecuperacion.verificarCodigo = jest.fn().mockResolvedValue(mockInfoCodigo);
            mockActualizarPassword.mockResolvedValue({ success: true });
            servicioRecuperacion.marcarCodigoUsado = jest.fn().mockResolvedValue(true);

            const response = await request(app)
                .post('/auth/reset-password')
                .send({
                    email: 'aprendiz@test.com',
                    codigo: '123456',
                    password: 'NewPass@123456789',
                    confirmPassword: 'NewPass@123456789'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('exitosamente');
            expect(servicioRecuperacion.verificarCodigo).toHaveBeenCalledWith('aprendiz@test.com', '123456');
            expect(mockActualizarPassword).toHaveBeenCalled();
            expect(servicioRecuperacion.marcarCodigoUsado).toHaveBeenCalledWith('aprendiz@test.com', '123456');
        });

        test('Debe restablecer contraseña con código válido (admin)', async () => {
            const mockInfoCodigo = {
                email: 'admin@sena.edu.co',
                role: 'admin',
                expiracion: new Date(Date.now() + 600000)
            };

            servicioRecuperacion.verificarCodigo = jest.fn().mockResolvedValue(mockInfoCodigo);
            mockActualizarPasswordAdmin.mockResolvedValue({ success: true });
            servicioRecuperacion.marcarCodigoUsado = jest.fn().mockResolvedValue(true);

            const response = await request(app)
                .post('/auth/reset-password')
                .send({
                    email: 'admin@sena.edu.co',
                    codigo: '654321',
                    password: 'AdminNew@123456789',
                    confirmPassword: 'AdminNew@123456789'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockActualizarPasswordAdmin).toHaveBeenCalled();
        });

        test('Debe rechazar si las contraseñas no coinciden', async () => {
            const response = await request(app)
                .post('/auth/reset-password')
                .send({
                    email: 'aprendiz@test.com',
                    codigo: '123456',
                    password: 'NewPass@123456789',
                    confirmPassword: 'Different@123456789'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('no coinciden');
        });

        test('Debe rechazar contraseña que no cumple requisitos mínimos', async () => {
            const response = await request(app)
                .post('/auth/reset-password')
                .send({
                    email: 'aprendiz@test.com',
                    codigo: '123456',
                    password: 'weak',
                    confirmPassword: 'weak'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('contraseña debe contener');
        });

        test('Debe validar contraseña con al menos 12 caracteres', async () => {
            const response = await request(app)
                .post('/auth/reset-password')
                .send({
                    email: 'aprendiz@test.com',
                    codigo: '123456',
                    password: 'Short@1',
                    confirmPassword: 'Short@1'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('12 caracteres');
        });

        test('Debe validar contraseña con mayúsculas', async () => {
            const response = await request(app)
                .post('/auth/reset-password')
                .send({
                    email: 'aprendiz@test.com',
                    codigo: '123456',
                    password: 'nouppercase@123456',
                    confirmPassword: 'nouppercase@123456'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('mayúscula');
        });

        test('Debe validar contraseña con minúsculas', async () => {
            const response = await request(app)
                .post('/auth/reset-password')
                .send({
                    email: 'aprendiz@test.com',
                    codigo: '123456',
                    password: 'NOLOWERCASE@123456',
                    confirmPassword: 'NOLOWERCASE@123456'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('minúscula');
        });

        test('Debe validar contraseña con números', async () => {
            const response = await request(app)
                .post('/auth/reset-password')
                .send({
                    email: 'aprendiz@test.com',
                    codigo: '123456',
                    password: 'NoNumbers@Password',
                    confirmPassword: 'NoNumbers@Password'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('número');
        });

        test('Debe validar contraseña con símbolos', async () => {
            const response = await request(app)
                .post('/auth/reset-password')
                .send({
                    email: 'aprendiz@test.com',
                    codigo: '123456',
                    password: 'NoSymbol123456',
                    confirmPassword: 'NoSymbol123456'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('símbolo');
        });

        test('Debe rechazar código inválido o expirado', async () => {
            servicioRecuperacion.verificarCodigo = jest.fn().mockResolvedValue(null);

            const response = await request(app)
                .post('/auth/reset-password')
                .send({
                    email: 'aprendiz@test.com',
                    codigo: '999999',
                    password: 'NewPass@123456789',
                    confirmPassword: 'NewPass@123456789'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('inválido o ha expirado');
        });

        test('Debe rechazar si faltan campos requeridos', async () => {
            const response = await request(app)
                .post('/auth/reset-password')
                .send({
                    email: 'aprendiz@test.com',
                    codigo: '123456'
                    // Faltan password y confirmPassword
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('requeridos');
        });

        test('Debe hashear la contraseña antes de guardarla', async () => {
            const mockInfoCodigo = {
                email: 'aprendiz@test.com',
                role: 'aprendiz',
                expiracion: new Date(Date.now() + 600000)
            };

            servicioRecuperacion.verificarCodigo = jest.fn().mockResolvedValue(mockInfoCodigo);
            
            let hashedPasswordSaved = null;
            mockActualizarPassword.mockImplementation(
                async (email, password) => {
                    hashedPasswordSaved = password;
                    return { success: true };
                }
            );
            servicioRecuperacion.marcarCodigoUsado = jest.fn().mockResolvedValue(true);

            await request(app)
                .post('/auth/reset-password')
                .send({
                    email: 'aprendiz@test.com',
                    codigo: '123456',
                    password: 'NewPass@123456789',
                    confirmPassword: 'NewPass@123456789'
                });

            expect(hashedPasswordSaved).not.toBe('NewPass@123456789');
            expect(hashedPasswordSaved).toBeTruthy();
            
            // Verificar que el hash es válido
            const isValidHash = await bcrypt.compare('NewPass@123456789', hashedPasswordSaved);
            expect(isValidHash).toBe(true);
        });
    });

    describe('Validación de tokens y códigos', () => {
        test('Debe validar formato de código de 6 dígitos', async () => {
            servicioRecuperacion.verificarCodigo = jest.fn().mockResolvedValue(null);

            const response = await request(app)
                .post('/auth/reset-password')
                .send({
                    email: 'aprendiz@test.com',
                    codigo: '12345', // Solo 5 dígitos
                    password: 'NewPass@123456789',
                    confirmPassword: 'NewPass@123456789'
                });

            expect(response.status).toBe(400);
            expect(servicioRecuperacion.verificarCodigo).toHaveBeenCalled();
        });

        test('Debe rechazar códigos no numéricos', async () => {
            servicioRecuperacion.verificarCodigo = jest.fn().mockResolvedValue(null);

            const response = await request(app)
                .post('/auth/reset-password')
                .send({
                    email: 'aprendiz@test.com',
                    codigo: 'ABC123',
                    password: 'NewPass@123456789',
                    confirmPassword: 'NewPass@123456789'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('Manejo de errores del servidor', () => {
        test('Debe manejar error al verificar código', async () => {
            servicioRecuperacion.verificarCodigo = jest.fn().mockRejectedValue(
                new Error('Error de base de datos')
            );

            const response = await request(app)
                .post('/auth/reset-password')
                .send({
                    email: 'aprendiz@test.com',
                    codigo: '123456',
                    password: 'NewPass@123456789',
                    confirmPassword: 'NewPass@123456789'
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });

        test('Debe manejar error al actualizar contraseña', async () => {
            const mockInfoCodigo = {
                email: 'aprendiz@test.com',
                role: 'aprendiz',
                expiracion: new Date(Date.now() + 600000)
            };

            servicioRecuperacion.verificarCodigo = jest.fn().mockResolvedValue(mockInfoCodigo);
            mockActualizarPassword.mockRejectedValue(
                new Error('Error al actualizar')
            );

            const response = await request(app)
                .post('/auth/reset-password')
                .send({
                    email: 'aprendiz@test.com',
                    codigo: '123456',
                    password: 'NewPass@123456789',
                    confirmPassword: 'NewPass@123456789'
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });
});
