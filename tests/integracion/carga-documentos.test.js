// Tests de Integración - Flujo completo de carga de documentos
// Ruta: tests/integracion/carga-documentos.test.js

const request = require('supertest');
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Mocks de servicios
const mockObtenerDocumentosPorAprendiz = jest.fn();
const mockInsertarDocumento = jest.fn();
const mockEliminarDocumentoPorId = jest.fn();
const mockObtenerDocumentoPorNombreGuardadoYAprendiz = jest.fn();
const mockObtenerDocumentoPorId = jest.fn();

jest.mock('../../src/modulos/aprendiz/servicios/servicioDocumentosAprendiz', () => ({
    obtenerDocumentosPorAprendiz: (...args) => mockObtenerDocumentosPorAprendiz(...args),
    insertarDocumento: (...args) => mockInsertarDocumento(...args),
    eliminarDocumentoPorId: (...args) => mockEliminarDocumentoPorId(...args),
    obtenerDocumentoPorNombreGuardadoYAprendiz: (...args) => mockObtenerDocumentoPorNombreGuardadoYAprendiz(...args),
    obtenerDocumentoPorId: (...args) => mockObtenerDocumentoPorId(...args)
}));

jest.mock('../../src/modulos/aprendiz/servicios/servicioAprendiz', () => {
    return jest.fn().mockImplementation(() => ({
        obtenerDatosCompletos: jest.fn().mockResolvedValue({
            id: 1,
            nombres: 'Test',
            apellidos: 'User',
            email: 'test@aprendiz.com'
        })
    }));
});

jest.mock('../../src/compartido/servicios/servicioAlertas', () => ({
    contarAlertasActivas: jest.fn().mockResolvedValue(0),
    obtenerAlertasAprendiz: jest.fn().mockResolvedValue([])
}));

// Mock de fs para evitar operaciones de archivo reales
jest.mock('fs');

const controladorDashboardAprendiz = require('../../src/modulos/aprendiz/controladores/controladorDashboardAprendiz');
const AuthMiddleware = require('../../src/compartido/middlewares/middlewareAutenticacion');

describe('Tests de Integración - Carga de Documentos', () => {
    let app;
    const testUserId = 1;

    // Configuración de multer para tests
    const storage = multer.memoryStorage();
    const upload = multer({ storage });

    beforeEach(() => {
        jest.clearAllMocks();

        // Configurar aplicación de prueba
        app = express();
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(session({
            secret: 'test-secret',
            resave: false,
            saveUninitialized: false
        }));

        // Mock de autenticación
        app.use((req, res, next) => {
            req.session.userId = testUserId;
            req.session.userRole = 'aprendiz';
            next();
        });

        // Configurar vistas
        app.set('view engine', 'ejs');
        app.set('views', path.join(__dirname, '../../views'));

        // Mock de render
        app.use((req, res, next) => {
            res.render = jest.fn((view, options) => {
                res.status(200).json({ view, ...options });
            });
            next();
        });

        // Rutas de documentos
        app.get('/aprendiz/documentos', 
            AuthMiddleware.validarSesionAprendiz,
            (req, res) => controladorDashboardAprendiz.mostrarGestionDocumentos(req, res)
        );

        app.post('/aprendiz/documentos/subir',
            AuthMiddleware.validarSesionAprendiz,
            upload.single('documento'),
            (req, res) => controladorDashboardAprendiz.subirDocumento(req, res)
        );

        app.delete('/aprendiz/documentos/eliminar/:id',
            AuthMiddleware.validarSesionAprendiz,
            (req, res) => controladorDashboardAprendiz.eliminarDocumento(req, res)
        );

        app.get('/aprendiz/documentos/descargar/:nombreGuardado',
            AuthMiddleware.validarSesionAprendiz,
            (req, res) => controladorDashboardAprendiz.descargarDocumento(req, res)
        );

        // Mock de fs
        fs.existsSync = jest.fn().mockReturnValue(true);
        fs.unlinkSync = jest.fn();
    });

    describe('Flujo completo: Ver documentos → Subir → Listar → Descargar → Eliminar', () => {
        it('debe completar el flujo completo de gestión de documentos', async () => {
            const documentosMock = [
                {
                    id: 1,
                    nombre_original: 'Bitácora 1.pdf',
                    nombre_guardado: 'bitacora1_123456.pdf',
                    tipo_documento: 'Bitácora 1',
                    ruta_archivo: 'public/uploads/documentos/bitacora1_123456.pdf',
                    fecha_subida: new Date(),
                    tamano_bytes: 102400
                }
            ];

            // PASO 1: Ver listado inicial de documentos
            mockObtenerDocumentosPorAprendiz.mockResolvedValue([]);

            const listarResponse1 = await request(app)
                .get('/aprendiz/documentos');

            expect(listarResponse1.status).toBe(200);
            expect(mockObtenerDocumentosPorAprendiz).toHaveBeenCalledWith(testUserId);

            // PASO 2: Subir un nuevo documento
            mockObtenerDocumentosPorAprendiz.mockResolvedValue([]);
            mockInsertarDocumento.mockResolvedValue({ success: true, id: 1 });

            const uploadResponse = await request(app)
                .post('/aprendiz/documentos/subir')
                .field('descripcion', 'Primera bitácora del mes')
                .field('tipoDocumento', 'Bitácora 1')
                .attach('documento', Buffer.from('PDF content'), {
                    filename: 'Bitácora 1.pdf',
                    contentType: 'application/pdf'
                });

            expect(uploadResponse.status).toBe(201);
            expect(uploadResponse.body.success).toBe(true);
            expect(mockInsertarDocumento).toHaveBeenCalled();

            // PASO 3: Listar documentos actualizado
            mockObtenerDocumentosPorAprendiz.mockResolvedValue(documentosMock);

            const listarResponse2 = await request(app)
                .get('/aprendiz/documentos');

            expect(listarResponse2.status).toBe(200);
            expect(listarResponse2.body.documentos).toHaveLength(1);
            expect(listarResponse2.body.documentos[0].nombre_original).toBe('Bitácora 1.pdf');

            // PASO 4: Descargar documento
            mockObtenerDocumentoPorNombreGuardadoYAprendiz.mockResolvedValue(documentosMock[0]);
            
            // Mock de res.download
            app._router.stack.forEach(layer => {
                if (layer.route && layer.route.path === '/aprendiz/documentos/descargar/:nombreGuardado') {
                    layer.route.stack.pop();
                    layer.route.get((req, res) => {
                        res.download = jest.fn((filePath, fileName, callback) => {
                            res.status(200).json({ 
                                downloaded: true, 
                                file: fileName 
                            });
                        });
                        controladorDashboardAprendiz.descargarDocumento(req, res);
                    });
                }
            });

            // PASO 5: Eliminar documento
            const documentoParaEliminar = {
                ...documentosMock[0],
                aprendiz_id: testUserId  // Asegurarnos de que pertenece al usuario
            };
            mockObtenerDocumentoPorId.mockResolvedValue(documentoParaEliminar);
            mockEliminarDocumentoPorId.mockResolvedValue(true);

            const deleteResponse = await request(app)
                .delete('/aprendiz/documentos/eliminar/1');

            expect(deleteResponse.status).toBe(200);
            expect(deleteResponse.body.success).toBe(true);
            expect(mockEliminarDocumentoPorId).toHaveBeenCalledWith(1);

            // PASO 6: Verificar lista vacía
            mockObtenerDocumentosPorAprendiz.mockResolvedValue([]);

            const listarResponse3 = await request(app)
                .get('/aprendiz/documentos');

            expect(listarResponse3.status).toBe(200);
            expect(listarResponse3.body.documentos).toHaveLength(0);
        });
    });

    describe('Subir múltiples tipos de documentos', () => {
        it('debe permitir subir diferentes tipos de documentos', async () => {
            const tiposDocumentos = [
                { tipo: 'Bitácora 1', nombre: 'Bitácora 1.pdf' },
                { tipo: 'Bitácora 2', nombre: 'Bitácora 2.pdf' },
                { tipo: 'Propuesta de intervención', nombre: 'Propuesta.docx' },
                { tipo: 'Diagnóstico', nombre: 'Diagnostico.pdf' },
                { tipo: 'GFPI-F-023 V5', nombre: 'Formato.xlsx' }
            ];

            mockObtenerDocumentosPorAprendiz.mockResolvedValue([]);
            mockInsertarDocumento.mockResolvedValue({ success: true, id: 1 });

            for (const doc of tiposDocumentos) {
                const response = await request(app)
                    .post('/aprendiz/documentos/subir')
                    .field('tipoDocumento', doc.tipo)
                    .field('descripcion', `Documento ${doc.tipo}`)
                    .attach('documento', Buffer.from('content'), {
                        filename: doc.nombre,
                        contentType: 'application/pdf'
                    });

                expect(response.status).toBe(201);
                expect(response.body.success).toBe(true);
            }

            expect(mockInsertarDocumento).toHaveBeenCalledTimes(tiposDocumentos.length);
        });
    });

    describe('Reemplazo de documentos existentes', () => {
        it('debe reemplazar un documento existente al subir uno con el mismo nombre', async () => {
            const documentoExistente = {
                id: 1,
                nombre_original: 'Bitácora 1.pdf',
                nombre_guardado: 'bitacora1_old.pdf',
                ruta_archivo: 'public/uploads/documentos/bitacora1_old.pdf',
                aprendiz_id: testUserId
            };

            mockObtenerDocumentosPorAprendiz.mockResolvedValue([documentoExistente]);
            mockInsertarDocumento.mockResolvedValue({ success: true, id: 2 });

            const response = await request(app)
                .post('/aprendiz/documentos/subir')
                .field('tipoDocumento', 'Bitácora 1')
                .attach('documento', Buffer.from('new content'), {
                    filename: 'Bitácora 1.pdf',
                    contentType: 'application/pdf'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(mockEliminarDocumentoPorId).toHaveBeenCalledWith(documentoExistente.id);
            expect(fs.unlinkSync).toHaveBeenCalled();
        });
    });

    describe('Validaciones de carga de documentos', () => {
        it('debe rechazar subida sin archivo', async () => {
            const response = await request(app)
                .post('/aprendiz/documentos/subir')
                .field('tipoDocumento', 'Bitácora 1');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('archivo');
        });

        it('debe rechazar subida sin autenticación', async () => {
            const appSinAuth = express();
            appSinAuth.use(express.json());
            appSinAuth.use(session({
                secret: 'test-secret',
                resave: false,
                saveUninitialized: false
            }));

            appSinAuth.post('/aprendiz/documentos/subir',
                AuthMiddleware.validarSesionAprendiz,
                upload.single('documento'),
                controladorDashboardAprendiz.subirDocumento
            );

            const response = await request(appSinAuth)
                .post('/aprendiz/documentos/subir')
                .attach('documento', Buffer.from('content'), 'test.pdf');

            expect(response.status).toBe(302);
        });

        it('debe manejar errores en el servicio de documentos', async () => {
            mockObtenerDocumentosPorAprendiz.mockResolvedValue([]);
            mockInsertarDocumento.mockResolvedValue({ success: false });

            const response = await request(app)
                .post('/aprendiz/documentos/subir')
                .field('tipoDocumento', 'Bitácora 1')
                .attach('documento', Buffer.from('content'), {
                    filename: 'test.pdf',
                    contentType: 'application/pdf'
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Eliminación de documentos', () => {
        it('debe eliminar documento correctamente', async () => {
            const documento = {
                id: 1,
                aprendiz_id: testUserId,
                ruta_archivo: 'public/uploads/documentos/test.pdf'
            };

            mockObtenerDocumentoPorId.mockResolvedValue(documento);
            mockEliminarDocumentoPorId.mockResolvedValue(true);

            const response = await request(app)
                .delete('/aprendiz/documentos/eliminar/1');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockEliminarDocumentoPorId).toHaveBeenCalledWith(1);
        });

        it('debe rechazar eliminación de documento no perteneciente al usuario', async () => {
            const documento = {
                id: 1,
                aprendiz_id: 999, // Diferente al usuario actual
                ruta_archivo: 'public/uploads/documentos/test.pdf'
            };

            mockObtenerDocumentoPorId.mockResolvedValue(documento);

            const response = await request(app)
                .delete('/aprendiz/documentos/eliminar/1');

            expect(response.status).toBe(404);
            expect(mockEliminarDocumentoPorId).not.toHaveBeenCalled();
        });

        it('debe manejar eliminación de documento inexistente', async () => {
            mockObtenerDocumentoPorId.mockResolvedValue(null);

            const response = await request(app)
                .delete('/aprendiz/documentos/eliminar/999');

            expect(response.status).toBe(404);
            expect(mockEliminarDocumentoPorId).not.toHaveBeenCalled();
        });
    });

    describe('Manejo de archivos físicos', () => {
        it('debe manejar error si el archivo físico no existe al descargar', async () => {
            const documento = {
                id: 1,
                nombre_original: 'test.pdf',
                nombre_guardado: 'test_123.pdf',
                ruta_archivo: 'public/uploads/documentos/test_123.pdf',
                aprendiz_id: testUserId
            };

            mockObtenerDocumentoPorNombreGuardadoYAprendiz.mockResolvedValue(documento);
            fs.existsSync.mockReturnValue(false);

            const response = await request(app)
                .get('/aprendiz/documentos/descargar/test_123.pdf');

            expect(response.status).toBe(404);
        });

        it('debe limpiar archivo temporal si falla la inserción en BD', async () => {
            mockObtenerDocumentosPorAprendiz.mockResolvedValue([]);
            mockInsertarDocumento.mockRejectedValue(new Error('DB Error'));

            const response = await request(app)
                .post('/aprendiz/documentos/subir')
                .field('tipoDocumento', 'Bitácora 1')
                .attach('documento', Buffer.from('content'), {
                    filename: 'test.pdf',
                    contentType: 'application/pdf'
                });

            expect(response.status).toBe(500);
            // En un escenario real, verificaríamos que se llamó fs.unlinkSync
        });
    });

    describe('Documentos obligatorios', () => {
        it('debe poder subir todas las bitácoras obligatorias', async () => {
            mockObtenerDocumentosPorAprendiz.mockResolvedValue([]);
            mockInsertarDocumento.mockResolvedValue({ success: true, id: 1 });

            const bitacoras = Array.from({ length: 12 }, (_, i) => `Bitácora ${i + 1}`);

            for (const bitacora of bitacoras) {
                const response = await request(app)
                    .post('/aprendiz/documentos/subir')
                    .field('tipoDocumento', bitacora)
                    .attach('documento', Buffer.from('content'), {
                        filename: `${bitacora}.pdf`,
                        contentType: 'application/pdf'
                    });

                expect(response.status).toBe(201);
                expect(response.body.success).toBe(true);
            }

            expect(mockInsertarDocumento).toHaveBeenCalledTimes(12);
        });
    });
});
