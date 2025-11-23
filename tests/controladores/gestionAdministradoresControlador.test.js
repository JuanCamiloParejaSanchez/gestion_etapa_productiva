// tests/controladores/gestionAdministradoresControlador.test.js
// Propósito: Tests para el controlador de gestión de administradores

const {
    listarAdministradores,
    obtenerDatosAdministradores,
    verAdministrador,
    editarAdministrador,
    actualizarAdministrador,
    eliminarAdministrador
} = require('../../src/modulos/administrador/controladores/gestionAdministradoresControlador');

// Mock del pool de base de datos
jest.mock('../../src/configuracion/baseDatos', () => ({
    pool: {
        query: jest.fn(),
        execute: jest.fn()
    }
}));

const { pool } = require('../../src/configuracion/baseDatos');

describe('GestionAdministradoresControlador', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockReq = {
            session: {
                userId: 1,
                usuario: 'Admin Test',
                userRole: 'administrador'
            },
            body: {},
            params: {},
            query: {}
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            render: jest.fn().mockReturnThis()
        };

        jest.clearAllMocks();
    });

    describe('listarAdministradores()', () => {
        it('debería renderizar la página de listado correctamente', async () => {
            await listarAdministradores(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalledWith(
                'administrador/listarAdministradores',
                expect.objectContaining({
                    layout: 'plantillas/principal',
                    title: 'Listado de Administradores',
                    usuario: 'Admin Test',
                    userId: 1
                })
            );
        });

        it('debería manejar errores y renderizar página de error', async () => {
            let renderCount = 0;
            mockRes.render.mockImplementation(() => {
                renderCount++;
                if (renderCount === 1) {
                    throw new Error('Error de renderizado');
                }
                return mockRes;
            });

            await listarAdministradores(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.render).toHaveBeenCalledWith(
                'compartido/paginaError',
                expect.objectContaining({
                    title: 'Error del Servidor',
                    mensaje: 'Error interno del servidor'
                })
            );
        });

        it('debería pasar correctamente la información de sesión', async () => {
            mockReq.session.usuario = 'Juan Pérez';
            mockReq.session.userId = 999;

            await listarAdministradores(mockReq, mockRes);

            const renderCall = mockRes.render.mock.calls[0][1];
            expect(renderCall.usuario).toBe('Juan Pérez');
            expect(renderCall.userId).toBe(999);
        });
    });

    describe('obtenerDatosAdministradores()', () => {
        it('debería retornar datos con formato DataTables correcto', async () => {
            const mockData = [
                {
                    id: 1,
                    numeroIdentificacion: '12345678',
                    nombreCompleto: 'Admin Uno',
                    correoInstitucional: 'admin1@sena.edu.co',
                    telefono: '3001234567',
                    departamento: 'TI',
                    cargo: 'Supervisor'
                }
            ];

            pool.query
                .mockResolvedValueOnce([[{ total: 10 }]]) // Total de registros
                .mockResolvedValueOnce([[{ total: 1 }]])  // Registros filtrados
                .mockResolvedValueOnce([mockData]);        // Datos

            mockReq.body = {
                draw: 1,
                start: 0,
                length: 10,
                search: { value: '' },
                order: []
            };

            await obtenerDatosAdministradores(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                draw: 1,
                recordsTotal: 10,
                recordsFiltered: 1,
                data: mockData
            });
        });

        it('debería aplicar búsqueda global correctamente', async () => {
            pool.query
                .mockResolvedValueOnce([[{ total: 10 }]])
                .mockResolvedValueOnce([[{ total: 2 }]])
                .mockResolvedValueOnce([[
                    { id: 1, nombreCompleto: 'Juan Test' }
                ]]);

            mockReq.body = {
                draw: 1,
                start: 0,
                length: 10,
                search: { value: 'Juan' },
                order: []
            };

            await obtenerDatosAdministradores(mockReq, mockRes);

            expect(pool.query).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    recordsFiltered: 2
                })
            );
        });

        it('debería aplicar filtros por nombre y documento', async () => {
            pool.query
                .mockResolvedValueOnce([[{ total: 10 }]])
                .mockResolvedValueOnce([[{ total: 1 }]])
                .mockResolvedValueOnce([[{ id: 1 }]]);

            mockReq.body = {
                draw: 1,
                start: 0,
                length: 10,
                search: { value: '' },
                nombre: 'Pedro',
                documento: '123456',
                order: []
            };

            await obtenerDatosAdministradores(mockReq, mockRes);

            expect(pool.query).toHaveBeenCalled();
        });

        it('debería aplicar ordenamiento correctamente', async () => {
            pool.query
                .mockResolvedValueOnce([[{ total: 10 }]])
                .mockResolvedValueOnce([[{ total: 10 }]])
                .mockResolvedValueOnce([[]]);

            mockReq.body = {
                draw: 1,
                start: 0,
                length: 10,
                search: { value: '' },
                order: [{ column: 1, dir: 'desc' }]
            };

            await obtenerDatosAdministradores(mockReq, mockRes);

            expect(pool.query).toHaveBeenCalled();
        });

        it('debería aplicar paginación correctamente', async () => {
            pool.query
                .mockResolvedValueOnce([[{ total: 50 }]])
                .mockResolvedValueOnce([[{ total: 50 }]])
                .mockResolvedValueOnce([[]]);

            mockReq.body = {
                draw: 1,
                start: 10,
                length: 10,
                search: { value: '' },
                order: []
            };

            await obtenerDatosAdministradores(mockReq, mockRes);

            expect(pool.query).toHaveBeenCalled();
        });

        it('debería manejar errores de base de datos', async () => {
            pool.query.mockRejectedValue(new Error('Error de conexión'));

            mockReq.body = {
                draw: 1,
                start: 0,
                length: 10,
                search: { value: '' },
                order: []
            };

            await obtenerDatosAdministradores(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.any(String),
                    data: []
                })
            );
        });

        it('debería manejar length=-1 (sin paginación)', async () => {
            pool.query
                .mockResolvedValueOnce([[{ total: 10 }]])
                .mockResolvedValueOnce([[{ total: 10 }]])
                .mockResolvedValueOnce([[]]);

            mockReq.body = {
                draw: 1,
                start: 0,
                length: -1,
                search: { value: '' },
                order: []
            };

            await obtenerDatosAdministradores(mockReq, mockRes);

            expect(pool.query).toHaveBeenCalled();
        });
    });

    describe('verAdministrador()', () => {
        it('debería mostrar el perfil de un administrador', async () => {
            const mockAdmin = {
                id: 1,
                nombreCompleto: 'Admin Test',
                correoInstitucional: 'admin@sena.edu.co',
                numeroIdentificacion: '12345678',
                telefono: '3001234567',
                departamento: 'TI',
                cargo: 'Supervisor',
                created_at: new Date()
            };

            pool.execute.mockResolvedValue([[mockAdmin]]);

            mockReq.params.id = 1;

            await verAdministrador(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalledWith(
                'administrador/verMiPerfilAdministrador',
                expect.objectContaining({
                    administrador: mockAdmin,
                    esMiPerfil: true
                })
            );
        });

        it('debería retornar error 404 si el administrador no existe', async () => {
            pool.execute.mockResolvedValue([[]]);

            mockReq.params.id = 999;

            await verAdministrador(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.render).toHaveBeenCalledWith(
                'compartido/paginaError',
                expect.objectContaining({
                    title: 'Administrador no encontrado'
                })
            );
        });

        it('debería identificar correctamente si es el perfil propio', async () => {
            pool.execute.mockResolvedValue([[{ id: 1 }]]);

            mockReq.params.id = 1;
            mockReq.session.userId = 1;

            await verAdministrador(mockReq, mockRes);

            const renderCall = mockRes.render.mock.calls[0][1];
            expect(renderCall.esMiPerfil).toBe(true);
        });

        it('debería manejar errores de base de datos', async () => {
            pool.execute.mockRejectedValue(new Error('Error de DB'));

            mockReq.params.id = 1;

            await verAdministrador(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('editarAdministrador()', () => {
        it('debería mostrar el formulario de edición', async () => {
            const mockAdmin = {
                id: 1,
                nombreCompleto: 'Admin Test',
                correoInstitucional: 'admin@sena.edu.co',
                numeroIdentificacion: '12345678'
            };

            pool.execute.mockResolvedValue([[mockAdmin]]);

            mockReq.params.id = 1;

            await editarAdministrador(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalledWith(
                'administrador/editarPerfilAdministrador',
                expect.objectContaining({
                    administrador: mockAdmin
                })
            );
        });

        it('debería retornar error 404 si no existe el administrador', async () => {
            pool.execute.mockResolvedValue([[]]);

            mockReq.params.id = 999;

            await editarAdministrador(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

    describe('actualizarAdministrador()', () => {
        it('debería actualizar un administrador exitosamente', async () => {
            pool.execute
                .mockResolvedValueOnce([[]])  // Verificar correo no duplicado
                .mockResolvedValueOnce([[]])  // Verificar identificación no duplicada
                .mockResolvedValueOnce([{ affectedRows: 1 }]); // Actualización

            mockReq.params.id = 1;
            mockReq.body = {
                nombreCompleto: 'Admin Actualizado',
                correoInstitucional: 'admin@sena.edu.co',
                numeroIdentificacion: '12345678',
                telefono: '3001234567',
                departamento: 'TI',
                cargo: 'Supervisor'
            };

            await actualizarAdministrador(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Perfil actualizado exitosamente'
            });
        });

        it('debería validar que todos los campos sean obligatorios', async () => {
            mockReq.params.id = 1;
            mockReq.body = {
                nombreCompleto: '',
                correoInstitucional: 'admin@sena.edu.co'
            };

            await actualizarAdministrador(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Todos los campos son obligatorios'
                })
            );
        });

        it('debería validar formato de correo electrónico', async () => {
            mockReq.params.id = 1;
            mockReq.body = {
                nombreCompleto: 'Test',
                correoInstitucional: 'correo-invalido',
                numeroIdentificacion: '12345678',
                telefono: '3001234567',
                departamento: 'TI',
                cargo: 'Test'
            };

            await actualizarAdministrador(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('correo')
                })
            );
        });

        it('debería validar número de identificación (7-12 dígitos)', async () => {
            mockReq.params.id = 1;
            mockReq.body = {
                nombreCompleto: 'Test',
                correoInstitucional: 'test@sena.edu.co',
                numeroIdentificacion: '123',
                telefono: '3001234567',
                departamento: 'TI',
                cargo: 'Test'
            };

            await actualizarAdministrador(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('identificación')
                })
            );
        });

        it('debería validar teléfono (10 dígitos)', async () => {
            mockReq.params.id = 1;
            mockReq.body = {
                nombreCompleto: 'Test',
                correoInstitucional: 'test@sena.edu.co',
                numeroIdentificacion: '12345678',
                telefono: '123',
                departamento: 'TI',
                cargo: 'Test'
            };

            await actualizarAdministrador(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('teléfono')
                })
            );
        });

        it('debería detectar correo duplicado', async () => {
            pool.execute.mockResolvedValueOnce([[{ id: 2 }]]); // Correo ya existe

            mockReq.params.id = 1;
            mockReq.body = {
                nombreCompleto: 'Test',
                correoInstitucional: 'duplicado@sena.edu.co',
                numeroIdentificacion: '12345678',
                telefono: '3001234567',
                departamento: 'TI',
                cargo: 'Test'
            };

            await actualizarAdministrador(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('correo')
                })
            );
        });

        it('debería detectar identificación duplicada', async () => {
            pool.execute
                .mockResolvedValueOnce([[]])  // Correo OK
                .mockResolvedValueOnce([[{ id: 2 }]]); // Identificación duplicada

            mockReq.params.id = 1;
            mockReq.body = {
                nombreCompleto: 'Test',
                correoInstitucional: 'test@sena.edu.co',
                numeroIdentificacion: '12345678',
                telefono: '3001234567',
                departamento: 'TI',
                cargo: 'Test'
            };

            await actualizarAdministrador(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('debería normalizar el correo a minúsculas', async () => {
            pool.execute
                .mockResolvedValueOnce([[]])
                .mockResolvedValueOnce([[]])
                .mockResolvedValueOnce([{ affectedRows: 1 }]);

            mockReq.params.id = 1;
            mockReq.body = {
                nombreCompleto: 'Test',
                correoInstitucional: 'TEST@SENA.EDU.CO',
                numeroIdentificacion: '12345678',
                telefono: '3001234567',
                departamento: 'TI',
                cargo: 'Test'
            };

            await actualizarAdministrador(mockReq, mockRes);

            // Verificar que se llamó a execute con el correo normalizado
            const updateCall = pool.execute.mock.calls[2]; // La tercera llamada es el UPDATE
            const params = updateCall[1];
            expect(params[1]).toBe('test@sena.edu.co'); // El correo es el segundo parámetro
        });

        it('debería retornar error 404 si no se actualiza ningún registro', async () => {
            pool.execute
                .mockResolvedValueOnce([[]])
                .mockResolvedValueOnce([[]])
                .mockResolvedValueOnce([{ affectedRows: 0 }]);

            mockReq.params.id = 999;
            mockReq.body = {
                nombreCompleto: 'Test',
                correoInstitucional: 'test@sena.edu.co',
                numeroIdentificacion: '12345678',
                telefono: '3001234567',
                departamento: 'TI',
                cargo: 'Test'
            };

            await actualizarAdministrador(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('debería manejar errores de base de datos', async () => {
            pool.execute.mockRejectedValue(new Error('DB Error'));

            mockReq.params.id = 1;
            mockReq.body = {
                nombreCompleto: 'Test',
                correoInstitucional: 'test@sena.edu.co',
                numeroIdentificacion: '12345678',
                telefono: '3001234567',
                departamento: 'TI',
                cargo: 'Test'
            };

            await actualizarAdministrador(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('eliminarAdministrador()', () => {
        it('debería eliminar un administrador exitosamente', async () => {
            pool.execute
                .mockResolvedValueOnce([[{ id: 2, nombreCompleto: 'Admin 2' }]])
                .mockResolvedValueOnce([{ affectedRows: 1 }]);

            mockReq.params.id = 2;
            mockReq.session.userId = 1;

            await eliminarAdministrador(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Administrador eliminado exitosamente'
            });
        });

        it('debería retornar error 404 si el administrador no existe', async () => {
            pool.execute.mockResolvedValueOnce([[]]);

            mockReq.params.id = 999;

            await eliminarAdministrador(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'El administrador no existe'
                })
            );
        });

        it('debería prevenir auto-eliminación', async () => {
            pool.execute.mockResolvedValueOnce([[{ id: 1, nombreCompleto: 'Admin' }]]);

            mockReq.params.id = 1;
            mockReq.session.userId = 1;

            await eliminarAdministrador(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('propio')
                })
            );
        });

        it('debería manejar errores de base de datos', async () => {
            pool.execute.mockRejectedValue(new Error('DB Error'));

            mockReq.params.id = 2;

            await eliminarAdministrador(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });

        it('debería manejar fallos en la eliminación de BD', async () => {
            pool.execute
                .mockResolvedValueOnce([[{ id: 2 }]])
                .mockResolvedValueOnce([{ affectedRows: 0 }]);

            mockReq.params.id = 2;
            mockReq.session.userId = 1;

            await eliminarAdministrador(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('Pruebas de Integración', () => {
        it('debería completar flujo de listar -> ver -> editar -> actualizar', async () => {
            // Listar
            await listarAdministradores(mockReq, mockRes);
            expect(mockRes.render).toHaveBeenCalled();

            // Ver
            pool.execute.mockResolvedValue([[{ id: 1 }]]);
            mockReq.params.id = 1;
            await verAdministrador(mockReq, mockRes);
            expect(mockRes.render).toHaveBeenCalledTimes(2);

            // Editar
            await editarAdministrador(mockReq, mockRes);
            expect(mockRes.render).toHaveBeenCalledTimes(3);

            // Actualizar
            pool.execute
                .mockResolvedValueOnce([[]])
                .mockResolvedValueOnce([[]])
                .mockResolvedValueOnce([{ affectedRows: 1 }]);

            mockReq.body = {
                nombreCompleto: 'Test',
                correoInstitucional: 'test@sena.edu.co',
                numeroIdentificacion: '12345678',
                telefono: '3001234567',
                departamento: 'TI',
                cargo: 'Test'
            };

            await actualizarAdministrador(mockReq, mockRes);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true })
            );
        });
    });
});
