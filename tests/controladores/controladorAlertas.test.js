// tests/controladores/controladorAlertas.test.js
// Propósito: Tests para el controlador de alertas

const {
    verAlertasPorTipo,
    obtenerDocumentosPendientes
} = require('../../src/compartido/controladores/controladorAlertas');

const servicioAlertas = require('../../src/compartido/servicios/servicioAlertas');
const servicioDocumentosAprendiz = require('../../src/modulos/aprendiz/servicios/servicioDocumentosAprendiz');

// Mocks
jest.mock('../../src/compartido/servicios/servicioAlertas');
jest.mock('../../src/modulos/aprendiz/servicios/servicioDocumentosAprendiz');
jest.mock('../../src/configuracion/baseDatos', () => ({
    pool: {
        query: jest.fn(),
        execute: jest.fn()
    }
}));

const { pool } = require('../../src/configuracion/baseDatos');

describe('ControladorAlertas', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockReq = {
            params: {},
            query: {},
            body: {},
            session: {
                userId: 1,
                userRole: 'administrador'
            }
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            render: jest.fn().mockReturnThis(),
            redirect: jest.fn()
        };

        jest.clearAllMocks();
    });

    describe('verAlertasPorTipo()', () => {
        it('debería mostrar alertas de tipo bitácora correctamente', async () => {
            mockReq.params.tipo = 'bitacora';

            const mockAlertas = {
                bitacora: [
                    { 
                        mensaje: 'Aprendiz (12345678) tiene bitácoras pendientes',
                        tipo: 'bitacora'
                    }
                ]
            };

            const mockAprendiz = {
                id: 1,
                nombres: 'Juan',
                primerApellido: 'Pérez',
                segundoApellido: 'García',
                numeroDocumento: '12345678',
                correoElectronico: 'juan@sena.edu.co',
                celular: '3001234567',
                programaFormacion: 'tecnoAnalisisDesarrollo',
                alternativaSeleccionada: 'contratoAprendizaje'
            };

            servicioAlertas.obtenerAlertasAdministrador.mockResolvedValue(mockAlertas);
            pool.query.mockResolvedValue([[mockAprendiz]]);

            await verAlertasPorTipo(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalledWith(
                'administrador/aprendicesDocsPendientes',
                expect.objectContaining({
                    tipo: 'bitacora',
                    lista: expect.arrayContaining([
                        expect.objectContaining({
                            nombre: 'Juan Pérez García',
                            programa: 'Tec. Análisis y Desarrollo',
                            etapa: 'Contrato de Aprendizaje',
                            documento: '12345678'
                        })
                    ])
                })
            );
        });

        it('debería manejar alertas sin aprendiz encontrado', async () => {
            mockReq.params.tipo = 'bitacora';

            const mockAlertas = {
                bitacora: [
                    { mensaje: 'Aprendiz (99999999) tiene bitácoras pendientes' }
                ]
            };

            servicioAlertas.obtenerAlertasAdministrador.mockResolvedValue(mockAlertas);
            pool.query.mockResolvedValue([[]]); // No se encuentra el aprendiz

            await verAlertasPorTipo(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalledWith(
                'administrador/aprendicesDocsPendientes',
                expect.objectContaining({
                    lista: expect.arrayContaining([
                        expect.objectContaining({
                            nombre: 'No encontrado',
                            documento: '99999999'
                        })
                    ])
                })
            );
        });

        it('debería manejar aprendices sin segundo apellido', async () => {
            mockReq.params.tipo = 'bitacora';

            const mockAlertas = {
                bitacora: [
                    { mensaje: 'Aprendiz (12345678) tiene bitácoras pendientes' }
                ]
            };

            const mockAprendiz = {
                id: 1,
                nombres: 'María',
                primerApellido: 'López',
                segundoApellido: null,
                numeroDocumento: '12345678',
                correoElectronico: 'maria@sena.edu.co',
                programaFormacion: 'tecProgramacion',
                alternativaSeleccionada: 'pasantia'
            };

            servicioAlertas.obtenerAlertasAdministrador.mockResolvedValue(mockAlertas);
            pool.query.mockResolvedValue([[mockAprendiz]]);

            await verAlertasPorTipo(mockReq, mockRes);

            const renderCall = mockRes.render.mock.calls[0][1];
            expect(renderCall.lista[0].nombre).toBe('María López');
        });

        it('debería mapear correctamente nombres de programas', async () => {
            mockReq.params.tipo = 'bitacora';

            const mockAlertas = {
                bitacora: [
                    { mensaje: 'Aprendiz (12345678) tiene bitácoras pendientes' }
                ]
            };

            const mockAprendiz = {
                id: 1,
                nombres: 'Test',
                primerApellido: 'User',
                numeroDocumento: '12345678',
                programaFormacion: 'tecnoActividadFisica',
                alternativaSeleccionada: 'monitoria'
            };

            servicioAlertas.obtenerAlertasAdministrador.mockResolvedValue(mockAlertas);
            pool.query.mockResolvedValue([[mockAprendiz]]);

            await verAlertasPorTipo(mockReq, mockRes);

            const renderCall = mockRes.render.mock.calls[0][1];
            expect(renderCall.lista[0].programa).toBe('Tec. Actividad Física');
            expect(renderCall.lista[0].etapa).toBe('Monitoria');
        });

        it('debería usar valores por defecto para programas no mapeados', async () => {
            mockReq.params.tipo = 'bitacora';

            const mockAlertas = {
                bitacora: [
                    { mensaje: 'Aprendiz (12345678) tiene bitácoras pendientes' }
                ]
            };

            const mockAprendiz = {
                id: 1,
                nombres: 'Test',
                primerApellido: 'User',
                numeroDocumento: '12345678',
                programaFormacion: 'programaDesconocido',
                alternativaSeleccionada: 'alternativaDesconocida'
            };

            servicioAlertas.obtenerAlertasAdministrador.mockResolvedValue(mockAlertas);
            pool.query.mockResolvedValue([[mockAprendiz]]);

            await verAlertasPorTipo(mockReq, mockRes);

            const renderCall = mockRes.render.mock.calls[0][1];
            expect(renderCall.lista[0].programa).toBe('programaDesconocido');
            expect(renderCall.lista[0].etapa).toBe('alternativaDesconocida');
        });

        it('debería redirigir a bitácora si el tipo no es válido', async () => {
            mockReq.params.tipo = 'tipoInvalido';

            servicioAlertas.obtenerAlertasAdministrador.mockResolvedValue({
                bitacora: []
            });

            await verAlertasPorTipo(mockReq, mockRes);

            expect(mockRes.redirect).toHaveBeenCalledWith('/administrador/alertas/bitacora');
        });

        it('debería manejar lista vacía de alertas', async () => {
            mockReq.params.tipo = 'bitacora';

            servicioAlertas.obtenerAlertasAdministrador.mockResolvedValue({
                bitacora: []
            });

            await verAlertasPorTipo(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalledWith(
                'administrador/aprendicesDocsPendientes',
                expect.objectContaining({
                    lista: []
                })
            );
        });

        it('debería manejar mensajes de alerta sin formato de ID', async () => {
            mockReq.params.tipo = 'bitacora';

            const mockAlertas = {
                bitacora: [
                    { mensaje: 'Mensaje sin formato de ID' }
                ]
            };

            servicioAlertas.obtenerAlertasAdministrador.mockResolvedValue(mockAlertas);

            await verAlertasPorTipo(mockReq, mockRes);

            const renderCall = mockRes.render.mock.calls[0][1];
            expect(renderCall.lista[0]).toEqual({
                nombre: '',
                programa: '',
                etapa: '',
                correo: '',
                telefono: '',
                mensaje: 'Mensaje sin formato de ID'
            });
        });

        it('debería incluir teléfono fijo si no hay celular', async () => {
            mockReq.params.tipo = 'bitacora';

            const mockAlertas = {
                bitacora: [
                    { mensaje: 'Aprendiz (12345678) tiene bitácoras pendientes' }
                ]
            };

            const mockAprendiz = {
                id: 1,
                nombres: 'Test',
                primerApellido: 'User',
                numeroDocumento: '12345678',
                celular: null,
                telefonoFijo: '6011234567',
                programaFormacion: 'tecProgramacion',
                alternativaSeleccionada: 'pasantia'
            };

            servicioAlertas.obtenerAlertasAdministrador.mockResolvedValue(mockAlertas);
            pool.query.mockResolvedValue([[mockAprendiz]]);

            await verAlertasPorTipo(mockReq, mockRes);

            const renderCall = mockRes.render.mock.calls[0][1];
            expect(renderCall.lista[0].telefono).toBe('6011234567');
        });
    });

    describe('obtenerDocumentosPendientes()', () => {
        it('debería retornar lista de documentos con estados correctos', async () => {
            mockReq.params.id = '1';

            const mockDocumentos = [
                {
                    tipo_documento: 'Bitácora 1',
                    nombre_original: 'bitacora1.pdf',
                    fecha_subida: '2024-01-01',
                    ruta_archivo: 'public/uploads/bitacora1.pdf'
                },
                {
                    tipo_documento: 'Bitácora 2',
                    nombre_original: 'bitacora2.pdf',
                    fecha_subida: '2024-01-02',
                    ruta_archivo: 'public/uploads/bitacora2.pdf'
                }
            ];

            servicioDocumentosAprendiz.obtenerDocumentosPorAprendiz.mockResolvedValue(mockDocumentos);

            await obtenerDocumentosPendientes(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                documentos: expect.arrayContaining([
                    expect.objectContaining({
                        tipo: 'Bitácora 1',
                        subido: true,
                        nombre: 'bitacora1.pdf'
                    }),
                    expect.objectContaining({
                        tipo: 'Bitácora 2',
                        subido: true
                    }),
                    expect.objectContaining({
                        tipo: 'Bitácora 3',
                        subido: false
                    })
                ])
            });
        });

        it('debería retornar error 400 si no se proporciona ID', async () => {
            mockReq.params.id = null;

            await obtenerDocumentosPendientes(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'ID de aprendiz requerido.'
                })
            );
        });

        it('debería manejar aprendiz sin documentos subidos', async () => {
            mockReq.params.id = '1';

            servicioDocumentosAprendiz.obtenerDocumentosPorAprendiz.mockResolvedValue([]);

            await obtenerDocumentosPendientes(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                documentos: expect.arrayContaining([
                    expect.objectContaining({
                        tipo: expect.any(String),
                        subido: false
                    })
                ])
            });
        });

        it('debería incluir todos los documentos obligatorios', async () => {
            mockReq.params.id = '1';

            servicioDocumentosAprendiz.obtenerDocumentosPorAprendiz.mockResolvedValue([]);

            await obtenerDocumentosPendientes(mockReq, mockRes);

            const call = mockRes.json.mock.calls[0][0];
            const documentos = call.documentos;

            // Verificar que incluye las 12 bitácoras
            expect(documentos.some(d => d.tipo === 'Bitácora 1')).toBe(true);
            expect(documentos.some(d => d.tipo === 'Bitácora 12')).toBe(true);
            
            // Verificar documentos adicionales
            expect(documentos.some(d => d.tipo === 'Propuesta de intervención')).toBe(true);
            expect(documentos.some(d => d.tipo === 'Diagnóstico')).toBe(true);
            expect(documentos.some(d => d.tipo === 'GFPI-F-023 V5')).toBe(true);
        });

        it('debería manejar documentos con campos alternativos', async () => {
            mockReq.params.id = '1';

            const mockDocumentos = [
                {
                    tipo_documento: 'Bitácora 1',
                    nombre_guardado: 'bitacora_stored.pdf', // Sin nombre_original
                    fecha: '2024-01-01', // En lugar de fecha_subida
                    url: '/uploads/doc.pdf' // En lugar de ruta_archivo
                }
            ];

            servicioDocumentosAprendiz.obtenerDocumentosPorAprendiz.mockResolvedValue(mockDocumentos);

            await obtenerDocumentosPendientes(mockReq, mockRes);

            const call = mockRes.json.mock.calls[0][0];
            const doc = call.documentos.find(d => d.tipo === 'Bitácora 1');
            
            expect(doc.nombre).toBe('bitacora_stored.pdf');
            expect(doc.fecha).toBe('2024-01-01');
            expect(doc.url).toBe('/uploads/doc.pdf');
        });

        it('debería manejar errores de servicio', async () => {
            mockReq.params.id = '1';

            const error = new Error('Error de base de datos');
            servicioDocumentosAprendiz.obtenerDocumentosPorAprendiz.mockRejectedValue(error);

            await obtenerDocumentosPendientes(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Error al obtener documentos pendientes.',
                    error: 'Error de base de datos'
                })
            );
        });

        it('debería manejar respuesta null del servicio', async () => {
            mockReq.params.id = '1';

            servicioDocumentosAprendiz.obtenerDocumentosPorAprendiz.mockResolvedValue(null);

            await obtenerDocumentosPendientes(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    documentos: expect.any(Array)
                })
            );
        });
    });

    describe('Pruebas de Respuestas HTTP', () => {
        it('debería usar código 200 para respuestas exitosas', async () => {
            mockReq.params.id = '1';
            servicioDocumentosAprendiz.obtenerDocumentosPorAprendiz.mockResolvedValue([]);

            await obtenerDocumentosPendientes(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true })
            );
        });

        it('debería usar código 400 para errores de validación', async () => {
            mockReq.params.id = null;

            await obtenerDocumentosPendientes(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('debería usar código 500 para errores internos', async () => {
            mockReq.params.id = '1';
            servicioDocumentosAprendiz.obtenerDocumentosPorAprendiz.mockRejectedValue(
                new Error('Error interno')
            );

            await obtenerDocumentosPendientes(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('Pruebas de Integración', () => {
        it('debería manejar flujo completo de ver alertas y obtener documentos', async () => {
            // Paso 1: Ver alertas
            mockReq.params.tipo = 'bitacora';
            
            const mockAlertas = {
                bitacora: [
                    { mensaje: 'Aprendiz (12345678) tiene bitácoras pendientes' }
                ]
            };

            const mockAprendiz = {
                id: 1,
                nombres: 'Test',
                primerApellido: 'User',
                numeroDocumento: '12345678',
                programaFormacion: 'tecnoAnalisisDesarrollo',
                alternativaSeleccionada: 'contratoAprendizaje'
            };

            servicioAlertas.obtenerAlertasAdministrador.mockResolvedValue(mockAlertas);
            pool.query.mockResolvedValue([[mockAprendiz]]);

            await verAlertasPorTipo(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalled();

            // Paso 2: Obtener documentos pendientes del aprendiz
            mockReq.params.id = '1';
            servicioDocumentosAprendiz.obtenerDocumentosPorAprendiz.mockResolvedValue([]);

            await obtenerDocumentosPendientes(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    documentos: expect.any(Array)
                })
            );
        });
    });
});
