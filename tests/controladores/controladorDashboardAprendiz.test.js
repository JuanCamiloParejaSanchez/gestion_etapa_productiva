// tests/controladores/controladorDashboardAprendiz.test.js
// Propósito: Tests para el controlador del dashboard de aprendiz

// Mocks primero - antes de importar el controlador
const mockObtenerAprendizPorId = jest.fn();
const mockActualizarAprendiz = jest.fn();
const mockObtenerAlertasAprendiz = jest.fn();
const mockObtenerDocumentosAprendiz = jest.fn();
const mockGuardarDocumento = jest.fn();
const mockEliminarDocumento = jest.fn();
const mockGuardarBitacora = jest.fn();
const mockEnviarCorreoAlertas = jest.fn();
const mockAnalizarSentimiento = jest.fn();

jest.mock('../../src/modulos/aprendiz/servicios/servicioAprendiz', () => {
    return jest.fn().mockImplementation(() => ({
        obtenerAprendizPorId: mockObtenerAprendizPorId,
        actualizarAprendiz: mockActualizarAprendiz
    }));
});

jest.mock('../../src/compartido/servicios/servicioAlertas', () => ({
    obtenerAlertasAprendiz: mockObtenerAlertasAprendiz
}));

const mockObtenerDocumentosPorAprendiz = jest.fn();
const mockObtenerDocumentoPorId = jest.fn();
const mockInsertarDocumento = jest.fn();
const mockEliminarDocumentoPorId = jest.fn();

jest.mock('../../src/modulos/aprendiz/servicios/servicioDocumentosAprendiz', () => ({
    obtenerDocumentosAprendiz: mockObtenerDocumentosAprendiz,
    obtenerDocumentosPorAprendiz: mockObtenerDocumentosPorAprendiz,
    obtenerDocumentoPorId: mockObtenerDocumentoPorId,
    guardarDocumento: mockGuardarDocumento,
    insertarDocumento: mockInsertarDocumento,
    eliminarDocumento: mockEliminarDocumento,
    eliminarDocumentoPorId: mockEliminarDocumentoPorId,
    guardarBitacora: mockGuardarBitacora
}));

jest.mock('../../src/modulos/aprendiz/servicios/servicioCorreo', () => ({
    enviarCorreoAlertas: mockEnviarCorreoAlertas
}));

jest.mock('../../src/modulos/administrador/servicios/servicioWatsonSentimientos', () => {
    return jest.fn().mockImplementation(() => ({
        analizarSentimiento: mockAnalizarSentimiento
    }));
});

jest.mock('../../src/configuracion/baseDatos', () => ({
    pool: {
        query: jest.fn(),
        execute: jest.fn()
    }
}));

jest.mock('fs');

const controlador = require('../../src/modulos/aprendiz/controladores/controladorDashboardAprendiz');
const fs = require('fs');
const path = require('path');
const { pool } = require('../../src/configuracion/baseDatos');

describe('ControladorDashboardAprendiz', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockReq = {
            session: {
                userId: 100,
                userName: 'Juan Pérez',
                userEmail: 'juan@sena.edu.co',
                userRole: 'aprendiz'
            },
            body: {},
            params: {},
            query: {},
            file: null
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            render: jest.fn().mockReturnThis(),
            download: jest.fn(),
            attachment: jest.fn()
        };

        jest.clearAllMocks();
    });

    describe('mostrarDashboard()', () => {
        it('debería mostrar el dashboard con datos del aprendiz', async () => {
            const mockAprendiz = {
                id: 100,
                nombres: 'Juan',
                primerApellido: 'Pérez',
                correoElectronico: 'juan@sena.edu.co'
            };

            const mockAlertas = [
                { id: 1, tipo: 'documento_pendiente', mensaje: 'Subir documento' }
            ];

            mockObtenerAprendizPorId.mockResolvedValue(mockAprendiz);
            mockObtenerAlertasAprendiz.mockResolvedValue(mockAlertas);

            await controlador.mostrarDashboard(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalledWith(
                'aprendiz/dashboard',
                expect.objectContaining({
                    title: 'Dashboard del Aprendiz',
                    user: expect.objectContaining({
                        name: 'Juan Pérez'
                    }),
                    alertas: mockAlertas
                })
            );
        });

        it('debería retornar error 401 si no hay usuario en sesión', async () => {
            mockReq.session.userId = null;

            await controlador.mostrarDashboard(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.render).toHaveBeenCalledWith(
                'compartido/paginaError',
                expect.objectContaining({
                    title: 'Error de Autenticación'
                })
            );
        });

        it('debería retornar error 404 si el aprendiz no existe', async () => {
            mockObtenerAprendizPorId.mockResolvedValue(null);

            await controlador.mostrarDashboard(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('debería manejar errores inesperados', async () => {
            mockObtenerAprendizPorId.mockRejectedValue(new Error('Error de BD'));

            await controlador.mostrarDashboard(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('actualizarPerfil()', () => {
        it('debería actualizar el perfil exitosamente', async () => {
            const datosActualizados = {
                nombres: 'Juan Carlos',
                primerApellido: 'Pérez',
                tipoDocumento: 'CC',
                numeroDocumento: '1234567890',
                fechaNacimiento: '2000-01-01',
                eps: 'Sura',
                celular: '3001234567',
                direccion: 'Calle 123',
                barrio: 'Centro',
                departamento: 'Cundinamarca',
                municipio: 'Bogotá',
                correoElectronico: 'juan@sena.edu.co',
                fechaInicioLectiva: '2024-01-01',
                fechaFinLectiva: '2024-06-30',
                instructorLectiva: 'Instructor 1',
                instructorProductiva: 'Instructor 2',
                numeroFicha: '123456',
                programaFormacion: 'ADSI',
                alternativaSeleccionada: 'Contrato de aprendizaje',
                areaFormacion: 'Desarrollo de Software',
                fechaInicioProductiva: '2024-07-01',
                fechaFinProductiva: '2024-12-31',
                empresaPatrocinadora: 'Empresa XYZ',
                areaPractica: 'Desarrollo',
                jefeInmediato: 'Jefe Test',
                celularEmpresa: '6011234567',
                direccionEmpresa: 'Calle Empresa',
                correoEmpresa: 'empresa@test.com',
                horario: 'Lunes a Viernes 8am-5pm'
            };

            mockReq.body = datosActualizados;

            mockActualizarAprendiz.mockResolvedValue({
                success: true,
                message: 'Perfil actualizado'
            });

            await controlador.actualizarPerfil(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Perfil actualizado exitosamente.'
            });
        });

        it('debería retornar error 401 si no hay userId en sesión', async () => {
            mockReq.session.userId = null;

            await controlador.actualizarPerfil(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it('debería prevenir actualización de perfil de otro usuario', async () => {
            mockReq.body = { id: 999 };

            await controlador.actualizarPerfil(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('no autorizado')
                })
            );
        });

        it('debería validar campos requeridos', async () => {
            mockReq.body = {
                nombres: 'Juan'
                // Faltan campos requeridos
            };

            await controlador.actualizarPerfil(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('debería manejar errores del servicio', async () => {
            mockReq.body = {
                nombres: 'Juan',
                primerApellido: 'Pérez',
                tipoDocumento: 'CC',
                numeroDocumento: '1234567890',
                fechaNacimiento: '2000-01-01',
                eps: 'Sura',
                celular: '3001234567',
                direccion: 'Calle 123',
                barrio: 'Centro',
                departamento: 'Cundinamarca',
                municipio: 'Bogotá',
                correoElectronico: 'juan@sena.edu.co',
                fechaInicioLectiva: '2024-01-01',
                fechaFinLectiva: '2024-06-30',
                instructorLectiva: 'Instructor 1',
                instructorProductiva: 'Instructor 2',
                numeroFicha: '123456',
                programaFormacion: 'ADSI',
                alternativaSeleccionada: 'Contrato',
                areaFormacion: 'TI',
                fechaInicioProductiva: '2024-07-01',
                fechaFinProductiva: '2024-12-31',
                empresaPatrocinadora: 'Empresa',
                areaPractica: 'Dev',
                jefeInmediato: 'Jefe',
                celularEmpresa: '6011234567',
                direccionEmpresa: 'Calle',
                correoEmpresa: 'empresa@test.com',
                horario: 'L-V'
            };

            mockActualizarAprendiz.mockRejectedValue(new Error('Error de actualización'));

            await controlador.actualizarPerfil(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('mostrarMiPerfil()', () => {
        it('debería mostrar el perfil del aprendiz', async () => {
            const mockAprendiz = { id: 100, nombres: 'Juan' };

            mockObtenerAprendizPorId.mockResolvedValue(mockAprendiz);

            await controlador.mostrarMiPerfil(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalledWith(
                'aprendiz/verMiPerfilAprendiz',
                expect.objectContaining({
                    aprendiz: mockAprendiz
                })
            );
        });

        it('debería retornar error si no hay sesión', async () => {
            mockReq.session.userId = null;

            await controlador.mostrarMiPerfil(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });
    });

    describe('mostrarGestionDocumentos()', () => {
        it('debería mostrar la página de gestión de documentos', async () => {
            const mockDocumentos = [
                { id: 1, nombre_original: 'documento1.pdf' },
                { id: 2, nombre_original: 'documento2.pdf' }
            ];

            mockObtenerDocumentosPorAprendiz.mockResolvedValue(mockDocumentos);

            await controlador.mostrarGestionDocumentos(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalledWith(
                'aprendiz/gestionDocumentos',
                expect.objectContaining({
                    documentos: mockDocumentos
                })
            );
        });

        it('debería retornar error si no hay sesión', async () => {
            mockReq.session.userId = null;

            await controlador.mostrarGestionDocumentos(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });
    });

    describe('subirDocumento()', () => {
        it('debería subir un documento exitosamente', async () => {
            mockReq.file = {
                originalname: 'test.pdf',
                filename: 'test_123.pdf',
                path: '/uploads/test_123.pdf',
                mimetype: 'application/pdf',
                size: 1024
            };
            mockReq.body = {
                descripcion: 'Documento de prueba',
                tipoDocumento: 'certificado'
            };

            mockObtenerDocumentosPorAprendiz.mockResolvedValue([]);
            mockInsertarDocumento.mockResolvedValue({
                success: true,
                id: 1
            });

            await controlador.subirDocumento(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Documento subido.',
                    documentoId: 1
                })
            );
        });

        it('debería retornar error si no hay archivo', async () => {
            mockReq.file = null;

            await controlador.subirDocumento(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'No se seleccionó ningún archivo.'
                })
            );
        });

        it('debería retornar error si no hay sesión', async () => {
            mockReq.session.userId = null;
            mockReq.file = { path: '/test.pdf' };

            fs.unlinkSync = jest.fn();

            await controlador.subirDocumento(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(fs.unlinkSync).toHaveBeenCalled();
        });

        it('debería reemplazar documento existente con mismo nombre', async () => {
            mockReq.file = {
                originalname: 'documento.pdf',
                filename: 'documento_new.pdf',
                path: '/uploads/documento_new.pdf',
                mimetype: 'application/pdf',
                size: 2048
            };
            mockReq.body = {
                tipoDocumento: 'certificado'
            };

            const documentoExistente = {
                id: 1,
                nombre_original: 'documento.pdf',
                ruta_archivo: 'public/uploads/documentos/documento_old.pdf'
            };

            mockObtenerDocumentosPorAprendiz.mockResolvedValue([
                documentoExistente
            ]);
            fs.existsSync = jest.fn().mockReturnValue(true);
            fs.unlinkSync = jest.fn();
            mockEliminarDocumentoPorId.mockResolvedValue(true);
            mockInsertarDocumento.mockResolvedValue({
                success: true,
                id: 2
            });

            await controlador.subirDocumento(mockReq, mockRes);

            expect(mockEliminarDocumentoPorId).toHaveBeenCalledWith(1);
            expect(mockRes.status).toHaveBeenCalledWith(201);
        });
    });

    describe('eliminarDocumento()', () => {
        it('debería eliminar un documento exitosamente', async () => {
            mockReq.params.id = '1';

            const mockDoc = {
                id: 1,
                aprendiz_id: 100,
                ruta_archivo: 'public/uploads/documentos/test.pdf'
            };

            mockObtenerDocumentoPorId.mockResolvedValue(mockDoc);
            fs.existsSync = jest.fn().mockReturnValue(true);
            fs.unlinkSync = jest.fn();
            mockEliminarDocumentoPorId.mockResolvedValue(true);

            await controlador.eliminarDocumento(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Documento eliminado.'
                })
            );
        });

        it('debería retornar error si no hay sesión', async () => {
            mockReq.session.userId = null;

            await controlador.eliminarDocumento(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it('debería retornar error si el documento no pertenece al usuario', async () => {
            mockReq.params.id = '1';

            mockObtenerDocumentoPorId.mockResolvedValue({
                id: 1,
                aprendiz_id: 999 // Diferente al usuario actual
            });

            await controlador.eliminarDocumento(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('debería retornar error si no existe el documento', async () => {
            mockReq.params.id = '999';

            mockObtenerDocumentoPorId.mockResolvedValue(null);

            await controlador.eliminarDocumento(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

    describe('registrarBitacora()', () => {
        it('debería registrar una bitácora exitosamente', async () => {
            mockReq.body = {
                respuestaDesafio: 'Enfrenté desafíos técnicos complejos durante el desarrollo del proyecto que requirieron investigación profunda y colaboración',
                respuestaLogro: 'Completé exitosamente el proyecto cumpliendo con todos los requisitos y plazos establecidos por el cliente',
                respuestaComunicacion: 'Mejoré significativamente mi comunicación con el equipo mediante reuniones diarias y documentación detallada'
            };

            mockAnalizarSentimiento.mockResolvedValue({
                sentimiento: 'positivo',
                score: 3.5,
                confianza: 0.85,
                contieneIronia: false,
                contextosDetectados: [],
                emociones: {},
                entidades: [],
                palabrasClave: []
            });

            pool.query.mockResolvedValue([{ insertId: 1 }]);

            await controlador.registrarBitacora(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Bitácora registrada exitosamente'
                })
            );
        });

        it('debería validar datos de entrada', async () => {
            mockReq.body = {
                respuestaDesafio: '' // Campo vacío
            };

            await controlador.registrarBitacora(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('debería manejar errores del servicio Watson', async () => {
            mockReq.body = {
                respuestaDesafio: 'Esta es una respuesta al desafío que debe tener al menos cincuenta caracteres para pasar la validación',
                respuestaLogro: 'Esta es una respuesta de logro que también debe cumplir con el requisito mínimo de cincuenta caracteres',
                respuestaComunicacion: 'Esta es una respuesta sobre comunicación que igualmente debe tener cincuenta caracteres o más'
            };

            mockAnalizarSentimiento.mockRejectedValue(new Error('Watson error'));

            await controlador.registrarBitacora(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getContadorAlertas()', () => {
        it('debería retornar el contador de alertas', async () => {
            const mockAlertas = [
                { id: 1, tipo: 'pendiente' },
                { id: 2, tipo: 'urgente' }
            ];

            mockObtenerAlertasAprendiz.mockResolvedValue(mockAlertas);

            await controlador.getContadorAlertas(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                contador: 2,
                alertas: mockAlertas
            });
        });

        it('debería retornar 0 si no hay sesión', async () => {
            mockReq.session.userId = null;

            await controlador.getContadorAlertas(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    contador: 0
                })
            );
        });

        it('debería manejar errores', async () => {
            mockObtenerAlertasAprendiz.mockRejectedValue(
                new Error('Error de alertas')
            );

            await controlador.getContadorAlertas(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('Pruebas de Respuestas HTTP', () => {
        it('debería retornar código 200 para operaciones exitosas', async () => {
            const mockAprendiz = { id: 100, nombres: 'Test' };
            mockObtenerAprendizPorId.mockResolvedValue(mockAprendiz);

            await controlador.mostrarMiPerfil(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalled();
        });

        it('debería retornar código 201 para creaciones exitosas', async () => {
            mockReq.file = {
                originalname: 'test.pdf',
                filename: 'test.pdf',
                mimetype: 'application/pdf',
                size: 1024
            };
            mockReq.body = { tipoDocumento: 'certificado' };

            mockObtenerDocumentosPorAprendiz.mockResolvedValue([]);
            mockInsertarDocumento.mockResolvedValue({ success: true, id: 1 });

            await controlador.subirDocumento(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
        });

        it('debería retornar código 400 para errores de validación', async () => {
            mockReq.file = null;

            await controlador.subirDocumento(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('debería retornar código 401 para errores de autenticación', async () => {
            mockReq.session.userId = null;

            await controlador.mostrarMiPerfil(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it('debería retornar código 404 para recursos no encontrados', async () => {
            mockObtenerAprendizPorId.mockResolvedValue(null);

            await controlador.mostrarMiPerfil(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('debería retornar código 500 para errores internos', async () => {
            mockObtenerAprendizPorId.mockRejectedValue(new Error('Error interno'));

            await controlador.mostrarMiPerfil(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });
});
