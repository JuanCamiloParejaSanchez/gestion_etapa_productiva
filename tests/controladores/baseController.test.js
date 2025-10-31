// tests/controladores/baseController.test.js
// Propósito: Tests para el controlador base con métodos comunes

const BaseController = require('../../src/compartido/controladores/baseController');
const Joi = require('joi');

describe('BaseController', () => {
    let baseController;
    let mockReq;
    let mockRes;

    beforeEach(() => {
        baseController = new BaseController();
        
        // Mock del objeto request
        mockReq = {
            session: {},
            body: {},
            params: {},
            query: {}
        };

        // Mock del objeto response
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            render: jest.fn().mockReturnThis()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('validate()', () => {
        it('debería validar datos correctos exitosamente', () => {
            const schema = Joi.object({
                nombre: Joi.string().required(),
                edad: Joi.number().min(0).required()
            });

            const data = {
                nombre: 'Juan Pérez',
                edad: 25
            };

            const resultado = baseController.validate(data, schema);

            expect(resultado.valido).toBe(true);
            expect(resultado.errores).toEqual([]);
            expect(resultado.datos).toEqual(data);
        });

        it('debería retornar errores cuando los datos son inválidos', () => {
            const schema = Joi.object({
                nombre: Joi.string().required(),
                edad: Joi.number().min(0).required()
            });

            const data = {
                nombre: '',
                edad: -5
            };

            const resultado = baseController.validate(data, schema);

            expect(resultado.valido).toBe(false);
            expect(resultado.errores.length).toBeGreaterThan(0);
            expect(resultado.datos).toBe(null);
        });

        it('debería manejar errores de validación con múltiples campos', () => {
            const schema = Joi.object({
                correo: Joi.string().email().required(),
                telefono: Joi.string().pattern(/^\d{10}$/).required(),
                edad: Joi.number().min(18).required()
            });

            const data = {
                correo: 'correo-invalido',
                telefono: '123',
                edad: 15
            };

            const resultado = baseController.validate(data, schema);

            expect(resultado.valido).toBe(false);
            expect(resultado.errores.length).toBe(3);
        });

        it('debería manejar datos vacíos correctamente', () => {
            const schema = Joi.object({
                nombre: Joi.string().required()
            });

            const resultado = baseController.validate({}, schema);

            expect(resultado.valido).toBe(false);
            expect(resultado.errores).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        campo: 'nombre'
                    })
                ])
            );
        });
    });

    describe('validationError()', () => {
        it('debería enviar respuesta 400 con errores de validación', () => {
            const errores = [
                { campo: 'nombre', mensaje: 'El nombre es requerido' },
                { campo: 'edad', mensaje: 'La edad debe ser mayor a 0' }
            ];

            baseController.validationError(mockRes, errores);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Datos de entrada inválidos',
                errors: errores
            });
        });

        it('debería manejar array vacío de errores', () => {
            baseController.validationError(mockRes, []);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    errors: []
                })
            );
        });
    });

    describe('success()', () => {
        it('debería enviar respuesta de éxito con código 200 por defecto', () => {
            const data = { id: 1, nombre: 'Test' };
            const mensaje = 'Operación exitosa';

            baseController.success(mockRes, data, mensaje);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: mensaje,
                    data: data,
                    timestamp: expect.any(String)
                })
            );
        });

        it('debería enviar respuesta con código HTTP personalizado', () => {
            const data = { id: 1 };
            
            baseController.success(mockRes, data, 'Creado', 201);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Creado'
                })
            );
        });

        it('debería funcionar sin datos (data null)', () => {
            baseController.success(mockRes, null, 'Operación completada');

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: null
                })
            );
        });

        it('debería incluir timestamp en formato ISO', () => {
            baseController.success(mockRes);

            const call = mockRes.json.mock.calls[0][0];
            expect(call.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });
    });

    describe('error()', () => {
        it('debería enviar respuesta de error con código 500 por defecto', () => {
            const mensaje = 'Error interno del servidor';

            baseController.error(mockRes, mensaje);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: mensaje,
                    timestamp: expect.any(String)
                })
            );
        });

        it('debería enviar respuesta con código HTTP personalizado', () => {
            baseController.error(mockRes, 'No encontrado', 404);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('debería incluir detalles del error en desarrollo', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            const error = new Error('Error de prueba');
            baseController.error(mockRes, 'Error', 500, error);

            const call = mockRes.json.mock.calls[0][0];
            expect(call.error).toBeDefined();
            expect(call.error.name).toBe('Error');
            expect(call.error.message).toBe('Error de prueba');
            expect(call.error.stack).toBeDefined();

            process.env.NODE_ENV = originalEnv;
        });

        it('NO debería incluir detalles del error en producción', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const error = new Error('Error sensible');
            baseController.error(mockRes, 'Error', 500, error);

            const call = mockRes.json.mock.calls[0][0];
            expect(call.error).toBeUndefined();

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('databaseError()', () => {
        it('debería manejar errores de base de datos', () => {
            const error = new Error('Connection timeout');
            error.code = 'ECONNREFUSED';

            baseController.databaseError(mockRes, error, 'consulta de usuarios');

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('consulta de usuarios')
                })
            );
        });

        it('debería usar operación por defecto', () => {
            const error = new Error('DB Error');

            baseController.databaseError(mockRes, error);

            const call = mockRes.json.mock.calls[0][0];
            expect(call.message).toContain('operación de base de datos');
        });
    });

    describe('isAuthenticated()', () => {
        it('debería retornar true cuando el usuario está autenticado', () => {
            mockReq.session.userId = 123;

            const resultado = baseController.isAuthenticated(mockReq);

            expect(resultado).toBe(true);
        });

        it('debería retornar false cuando no hay sesión', () => {
            mockReq.session = null;

            const resultado = baseController.isAuthenticated(mockReq);

            expect(resultado).toBe(false);
        });

        it('debería retornar false cuando no hay userId en la sesión', () => {
            mockReq.session = {};

            const resultado = baseController.isAuthenticated(mockReq);

            expect(resultado).toBe(false);
        });
    });

    describe('hasRole()', () => {
        it('debería retornar true cuando el usuario tiene el rol requerido', () => {
            mockReq.session.userId = 123;
            mockReq.session.userRole = 'administrador';

            const resultado = baseController.hasRole(mockReq, 'administrador');

            expect(resultado).toBe(true);
        });

        it('debería retornar true cuando el usuario tiene uno de los roles requeridos', () => {
            mockReq.session.userId = 123;
            mockReq.session.userRole = 'aprendiz';

            const resultado = baseController.hasRole(mockReq, ['administrador', 'aprendiz']);

            expect(resultado).toBe(true);
        });

        it('debería retornar false cuando el usuario no tiene el rol requerido', () => {
            mockReq.session.userId = 123;
            mockReq.session.userRole = 'aprendiz';

            const resultado = baseController.hasRole(mockReq, 'administrador');

            expect(resultado).toBe(false);
        });

        it('debería retornar false cuando el usuario no está autenticado', () => {
            const resultado = baseController.hasRole(mockReq, 'administrador');

            expect(resultado).toBe(false);
        });
    });

    describe('requireAuth() middleware', () => {
        it('debería llamar next() cuando el usuario está autenticado', () => {
            mockReq.session.userId = 123;
            const next = jest.fn();

            baseController.requireAuth(mockReq, mockRes, next);

            expect(next).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('debería retornar error 401 cuando el usuario no está autenticado', () => {
            const next = jest.fn();

            baseController.requireAuth(mockReq, mockRes, next);

            expect(next).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Autenticación requerida'
                })
            );
        });
    });

    describe('requireRole() middleware', () => {
        it('debería retornar middleware function', () => {
            const middleware = baseController.requireRole('administrador');

            expect(typeof middleware).toBe('function');
        });

        it('debería llamar next() cuando el usuario tiene el rol requerido', () => {
            mockReq.session.userId = 123;
            mockReq.session.userRole = 'administrador';
            const next = jest.fn();
            const middleware = baseController.requireRole('administrador');

            middleware(mockReq, mockRes, next);

            expect(next).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('debería retornar error 403 cuando el usuario no tiene el rol', () => {
            mockReq.session.userId = 123;
            mockReq.session.userRole = 'aprendiz';
            const next = jest.fn();
            const middleware = baseController.requireRole('administrador');

            middleware(mockReq, mockRes, next);

            expect(next).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Permisos insuficientes'
                })
            );
        });

        it('debería funcionar con array de roles', () => {
            mockReq.session.userId = 123;
            mockReq.session.userRole = 'aprendiz';
            const next = jest.fn();
            const middleware = baseController.requireRole(['administrador', 'aprendiz']);

            middleware(mockReq, mockRes, next);

            expect(next).toHaveBeenCalled();
        });
    });

    describe('Integración de métodos', () => {
        it('debería permitir encadenar métodos de respuesta', () => {
            const data = { test: true };
            
            baseController.success(mockRes, data);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalled();
        });

        it('debería validar y responder con error en un flujo completo', () => {
            const schema = Joi.object({
                email: Joi.string().email().required()
            });

            const data = { email: 'invalido' };
            const resultado = baseController.validate(data, schema);

            if (!resultado.valido) {
                baseController.validationError(mockRes, resultado.errores);
            }

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });
});
