// Tests de Integración - Flujo completo de registro de bitácoras
// Ruta: tests/integracion/registro-bitacoras.test.js

const request = require('supertest');
const express = require('express');
const session = require('express-session');
const path = require('path');

// Mocks de servicios
const mockAnalizarSentimiento = jest.fn();
const mockInsertarBitacora = jest.fn();
const mockObtenerBitacorasPorAprendiz = jest.fn();
const mockObtenerDatosCompletos = jest.fn();
const mockPoolQuery = jest.fn();

// Mock del pool de base de datos
jest.mock('../../src/configuracion/baseDatos', () => ({
    pool: {
        query: (...args) => mockPoolQuery(...args)
    }
}));

jest.mock('../../src/modulos/administrador/servicios/servicioWatsonSentimientos', () => {
    return jest.fn().mockImplementation(() => ({
        analizarSentimiento: mockAnalizarSentimiento
    }));
});

jest.mock('../../src/modulos/aprendiz/servicios/servicioBitacora', () => ({
    insertarBitacora: (...args) => mockInsertarBitacora(...args),
    obtenerBitacorasPorAprendiz: (...args) => mockObtenerBitacorasPorAprendiz(...args)
}));

jest.mock('../../src/modulos/aprendiz/servicios/servicioAprendiz', () => {
    return jest.fn().mockImplementation(() => ({
        obtenerDatosCompletos: mockObtenerDatosCompletos
    }));
});

jest.mock('../../src/compartido/servicios/servicioAlertas', () => ({
    contarAlertasActivas: jest.fn().mockResolvedValue(0),
    obtenerAlertasAprendiz: jest.fn().mockResolvedValue([])
}));

const controladorDashboardAprendiz = require('../../src/modulos/aprendiz/controladores/controladorDashboardAprendiz');
const AuthMiddleware = require('../../src/compartido/middlewares/middlewareAutenticacion');

describe('Tests de Integración - Registro de Bitácoras', () => {
    let app;
    const testUserId = 1;

    beforeEach(() => {
        jest.clearAllMocks();

        // Configurar mock del pool de base de datos
        mockPoolQuery.mockResolvedValue([{ insertId: 1, affectedRows: 1 }]);

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

        // Rutas de bitácoras
        app.get('/aprendiz/bitacora',
            AuthMiddleware.validarSesionAprendiz,
            (req, res) => controladorDashboardAprendiz.mostrarFormularioBitacora(req, res)
        );

        app.post('/aprendiz/bitacora',
            AuthMiddleware.validarSesionAprendiz,
            (req, res) => controladorDashboardAprendiz.registrarBitacora(req, res)
        );
    });

    describe('Flujo completo: Ver formulario → Registrar bitácora → Análisis Watson', () => {
        it('debe completar el flujo completo de registro de bitácora', async () => {
            // PASO 1: Ver formulario de bitácora
            mockObtenerDatosCompletos.mockResolvedValue({
                id: testUserId,
                nombres: 'Juan',
                apellidos: 'Pérez'
            });

            const formResponse = await request(app)
                .get('/aprendiz/bitacora');

            expect(formResponse.status).toBe(200);
            expect(formResponse.body.view).toBe('aprendiz/registrarBitacora');

            // PASO 2: Registrar bitácora con análisis de sentimiento
            const bitacoraData = {
                respuestaDesafio: 'Esta semana enfrenté el desafío de implementar una API REST. Fue complicado al inicio pero logré superarlo.',
                respuestaLogro: 'Completé exitosamente la integración con la base de datos y optimicé las consultas SQL.',
                respuestaComunicacion: 'Tuve una excelente comunicación con mi equipo. Realizamos dailies efectivos y colaboramos bien.'
            };

            // Mock de análisis de Watson
            mockAnalizarSentimiento.mockImplementation((texto) => {
                if (texto.includes('desafío') || texto.includes('complicado')) {
                    return Promise.resolve({
                        sentimiento: 'neutral',
                        score: 0.1,
                        emociones: { tristeza: 0.2, alegría: 0.5 },
                        entidades: ['API REST'],
                        palabrasClave: ['desafío', 'implementar', 'API']
                    });
                } else if (texto.includes('exitosamente') || texto.includes('optimicé')) {
                    return Promise.resolve({
                        sentimiento: 'positivo',
                        score: 0.8,
                        emociones: { alegría: 0.9, tristeza: 0.1 },
                        entidades: ['base de datos', 'SQL'],
                        palabrasClave: ['completé', 'optimicé', 'exitosamente']
                    });
                } else {
                    return Promise.resolve({
                        sentimiento: 'positivo',
                        score: 0.7,
                        emociones: { alegría: 0.8 },
                        entidades: ['equipo'],
                        palabrasClave: ['comunicación', 'colaboración']
                    });
                }
            });

            mockInsertarBitacora.mockResolvedValue({ success: true, id: 1 });

            const registroResponse = await request(app)
                .post('/aprendiz/bitacora')
                .send(bitacoraData);

            expect(registroResponse.status).toBe(201);
            expect(registroResponse.body.success).toBe(true);
            
            // Verificar que se llamó al análisis de sentimiento 3 veces (una por cada respuesta)
            expect(mockAnalizarSentimiento).toHaveBeenCalledTimes(3);
            expect(mockAnalizarSentimiento).toHaveBeenCalledWith(bitacoraData.respuestaDesafio);
            expect(mockAnalizarSentimiento).toHaveBeenCalledWith(bitacoraData.respuestaLogro);
            expect(mockAnalizarSentimiento).toHaveBeenCalledWith(bitacoraData.respuestaComunicacion);

            // Verificar que se insertó en la base de datos
            expect(mockPoolQuery).toHaveBeenCalled();
            const queryCall = mockPoolQuery.mock.calls[0];
            const valores = queryCall[1];
            
            expect(valores[0]).toBe(testUserId); // aprendizId
            expect(valores[1]).toBe(bitacoraData.respuestaDesafio);
            expect(valores[2]).toBe(bitacoraData.respuestaLogro);
            expect(valores[3]).toBe(bitacoraData.respuestaComunicacion);

            // Verificar que se guardaron los sentimientos
            expect(valores[4]).toBeDefined(); // sentimiento_desafio
            expect(valores[5]).toBeDefined(); // sentimiento_logro
            expect(valores[6]).toBeDefined(); // sentimiento_comunicacion
        });
    });

    describe('Registro de múltiples bitácoras', () => {
        it('debe permitir registrar múltiples bitácoras en secuencia', async () => {
            const bitacoras = [
                {
                    respuestaDesafio: 'Durante la semana 1 enfrenté el desafío de aprender nuevas tecnologías, lo cual requirió dedicación y esfuerzo constante.',
                    respuestaLogro: 'En la semana 1 logré completar los objetivos planteados y avancé significativamente en el desarrollo de mis habilidades técnicas.',
                    respuestaComunicacion: 'La comunicación con mi equipo durante la semana 1 fue excelente, mantuvimos reuniones productivas y logramos coordinarnos eficientemente.'
                },
                {
                    respuestaDesafio: 'Durante la semana 2 tuve que superar obstáculos técnicos complejos que pusieron a prueba mis conocimientos y capacidad de resolución.',
                    respuestaLogro: 'En la semana 2 logré implementar soluciones innovadoras que mejoraron el rendimiento del proyecto de manera significativa.',
                    respuestaComunicacion: 'Durante la semana 2 mantuve una comunicación fluida con todos los miembros del equipo, compartiendo avances y resolviendo dudas.'
                },
                {
                    respuestaDesafio: 'La semana 3 presentó desafíos relacionados con la integración de sistemas, requiriendo análisis detallado y planificación cuidadosa.',
                    respuestaLogro: 'En la semana 3 completé exitosamente la integración planificada, cumpliendo con todos los requisitos y estándares de calidad.',
                    respuestaComunicacion: 'La comunicación durante la semana 3 fue muy efectiva, realizamos seguimientos diarios y documentamos todos los procesos adecuadamente.'
                }
            ];

            mockAnalizarSentimiento.mockResolvedValue({
                sentimiento: 'positivo',
                score: 0.7,
                emociones: { alegría: 0.8 },
                entidades: [],
                palabrasClave: []
            });

            mockInsertarBitacora.mockResolvedValue({ success: true, id: 1 });

            for (let i = 0; i < bitacoras.length; i++) {
                const response = await request(app)
                    .post('/aprendiz/bitacora')
                    .send(bitacoras[i]);

                expect(response.status).toBe(201);
                expect(response.body.success).toBe(true);
            }

            expect(mockAnalizarSentimiento).toHaveBeenCalledTimes(9); // 3 respuestas × 3 bitácoras
        });
    });

    describe('Análisis de sentimiento Watson', () => {
        it('debe analizar correctamente sentimientos positivos', async () => {
            const bitacoraPositiva = {
                respuestaDesafio: 'Excelente semana, superé todos los retos con éxito y logré completar todos mis objetivos propuestos de manera satisfactoria.',
                respuestaLogro: 'Logré implementar todas las funcionalidades planificadas y además optimicé el código para mejorar el rendimiento general del sistema.',
                respuestaComunicacion: 'Gran trabajo en equipo, comunicación fluida y efectiva que nos permitió coordinar todas las actividades de manera eficiente y productiva.'
            };

            mockAnalizarSentimiento.mockResolvedValue({
                sentimiento: 'positivo',
                score: 0.9,
                emociones: { alegría: 0.95, tristeza: 0.05 },
                entidades: [],
                palabrasClave: ['excelente', 'éxito', 'gran']
            });

            mockInsertarBitacora.mockResolvedValue({ success: true, id: 1 });

            const response = await request(app)
                .post('/aprendiz/bitacora')
                .send(bitacoraPositiva);

            expect(response.status).toBe(201);
            expect(mockAnalizarSentimiento).toHaveBeenCalledTimes(3);
        });

        it('debe analizar correctamente sentimientos negativos', async () => {
            const bitacoraNegativa = {
                respuestaDesafio: 'Fue una semana muy difícil, no pude completar las tareas asignadas debido a múltiples inconvenientes técnicos que surgieron inesperadamente.',
                respuestaLogro: 'No logré avanzar mucho, tuve varios problemas con las herramientas y no pude alcanzar los objetivos que me había propuesto para esta semana.',
                respuestaComunicacion: 'Hubo falta de comunicación con el equipo, no pudimos coordinarnos adecuadamente y esto afectó negativamente el desarrollo de las actividades.'
            };

            mockAnalizarSentimiento.mockResolvedValue({
                sentimiento: 'negativo',
                score: -0.7,
                emociones: { tristeza: 0.8, alegría: 0.1 },
                entidades: [],
                palabrasClave: ['difícil', 'problemas', 'falta']
            });

            // El controlador usa pool.query directamente
            mockPoolQuery.mockResolvedValue([{ insertId: 1, affectedRows: 1 }]);

            const response = await request(app)
                .post('/aprendiz/bitacora')
                .send(bitacoraNegativa);

            expect(response.status).toBe(201);
            expect(mockPoolQuery).toHaveBeenCalled();
        });

        it('debe manejar sentimientos neutrales', async () => {
            const bitacoraNeutral = {
                respuestaDesafio: 'Esta semana trabajé en documentación técnica del proyecto, actualizando los manuales de usuario y los diagramas de arquitectura del sistema.',
                respuestaLogro: 'Actualicé los archivos del proyecto según los requerimientos establecidos, completando la revisión de todos los documentos pendientes del sprint.',
                respuestaComunicacion: 'Asistí a las reuniones programadas con el equipo de desarrollo, participando en las discusiones técnicas y tomando nota de los acuerdos establecidos.'
            };

            mockAnalizarSentimiento.mockResolvedValue({
                sentimiento: 'neutral',
                score: 0,
                emociones: { alegría: 0.5, tristeza: 0.5 },
                entidades: ['documentación', 'proyecto'],
                palabrasClave: ['trabajé', 'actualicé', 'asistí']
            });

            mockInsertarBitacora.mockResolvedValue({ success: true, id: 1 });

            const response = await request(app)
                .post('/aprendiz/bitacora')
                .send(bitacoraNeutral);

            expect(response.status).toBe(201);
        });
    });

    describe('Validaciones de bitácoras', () => {
        it('debe validar que todos los campos requeridos estén presentes', async () => {
            const bitacoraIncompleta = {
                respuestaDesafio: 'Solo desafío',
                // Faltan los otros campos
            };

            const response = await request(app)
                .post('/aprendiz/bitacora')
                .send(bitacoraIncompleta);

            expect(response.status).toBe(400);
            expect(mockInsertarBitacora).not.toHaveBeenCalled();
        });

        it('debe validar longitud mínima de respuestas', async () => {
            const bitacoraCorta = {
                respuestaDesafio: 'Ab',  // Muy corto
                respuestaLogro: 'Cd',
                respuestaComunicacion: 'Ef'
            };

            const response = await request(app)
                .post('/aprendiz/bitacora')
                .send(bitacoraCorta);

            expect(response.status).toBe(400);
            expect(mockInsertarBitacora).not.toHaveBeenCalled();
        });

        it('debe rechazar bitácora sin autenticación', async () => {
            const appSinAuth = express();
            appSinAuth.use(express.json());
            appSinAuth.use(session({
                secret: 'test-secret',
                resave: false,
                saveUninitialized: false
            }));

            appSinAuth.post('/aprendiz/bitacora',
                AuthMiddleware.validarSesionAprendiz,
                controladorDashboardAprendiz.registrarBitacora
            );

            const response = await request(appSinAuth)
                .post('/aprendiz/bitacora')
                .send({
                    respuestaDesafio: 'Test',
                    respuestaLogro: 'Test',
                    respuestaComunicacion: 'Test'
                });

            expect(response.status).toBe(302);
        });
    });

    describe('Manejo de errores de Watson', () => {
        it('debe manejar error en el servicio de Watson', async () => {
            const bitacoraData = {
                respuestaDesafio: 'Desafío de prueba para validar el manejo de errores en el sistema cuando el servicio de Watson no está disponible temporalmente.',
                respuestaLogro: 'Logro de prueba para verificar que el sistema maneje correctamente los errores y proporcione retroalimentación adecuada al usuario final.',
                respuestaComunicacion: 'Comunicación de prueba para asegurar que los mensajes de error sean claros y ayuden al usuario a entender qué sucedió durante el proceso.'
            };

            mockAnalizarSentimiento.mockRejectedValue(new Error('Watson service error'));

            const response = await request(app)
                .post('/aprendiz/bitacora')
                .send(bitacoraData);

            expect(response.status).toBe(500);
            expect(mockInsertarBitacora).not.toHaveBeenCalled();
        });

        it('debe continuar aunque Watson devuelva datos incompletos', async () => {
            const bitacoraData = {
                respuestaDesafio: 'Desafío de prueba para verificar la robustez del sistema cuando Watson retorna información parcial sin todos los campos esperados.',
                respuestaLogro: 'Logro de prueba que valida que el sistema pueda procesar y almacenar datos aun cuando la respuesta de Watson esté incompleta.',
                respuestaComunicacion: 'Comunicación de prueba para garantizar que el flujo continúe funcionando correctamente incluso con datos parciales del análisis de sentimientos.'
            };

            // Watson devuelve respuesta incompleta
            mockAnalizarSentimiento.mockResolvedValue({
                sentimiento: 'positivo',
                score: 0.5
                // Faltan emociones, entidades, palabrasClave
            });

            // El controlador usa pool.query directamente
            mockPoolQuery.mockResolvedValue([{ insertId: 1, affectedRows: 1 }]);

            const response = await request(app)
                .post('/aprendiz/bitacora')
                .send(bitacoraData);

            expect(response.status).toBe(201);
            expect(mockPoolQuery).toHaveBeenCalled();
        });
    });

    describe('Persistencia de datos', () => {
        it('debe guardar correctamente todos los datos de la bitácora', async () => {
            const bitacoraData = {
                respuestaDesafio: 'Texto desafío completo que describe detalladamente todos los retos enfrentados durante la semana y las estrategias utilizadas para superarlos.',
                respuestaLogro: 'Texto logro completo que documenta todos los objetivos alcanzados, las metas cumplidas y los resultados obtenidos durante el período de trabajo.',
                respuestaComunicacion: 'Texto comunicación completo que refleja cómo fue la interacción con el equipo, la calidad de la comunicación y los acuerdos establecidos.'
            };

            mockAnalizarSentimiento.mockResolvedValue({
                sentimiento: 'positivo',
                score: 0.8,
                emociones: { alegría: 0.9, miedo: 0.1, enojo: 0.05, tristeza: 0.05, disgusto: 0.05 },
                entidades: ['entity1', 'entity2'],
                palabrasClave: ['palabra1', 'palabra2', 'palabra3']
            });

            mockInsertarBitacora.mockResolvedValue({ success: true, id: 1 });

            const response = await request(app)
                .post('/aprendiz/bitacora')
                .send(bitacoraData);

            expect(response.status).toBe(201);
            expect(mockPoolQuery).toHaveBeenCalled();

            const queryCall = mockPoolQuery.mock.calls[0];
            const datosGuardados = queryCall[1];

            // Verificar que se guardaron las respuestas
            expect(datosGuardados[1]).toBe(bitacoraData.respuestaDesafio);
            expect(datosGuardados[2]).toBe(bitacoraData.respuestaLogro);
            expect(datosGuardados[3]).toBe(bitacoraData.respuestaComunicacion);

            // Verificar que se guardaron los análisis
            expect(datosGuardados[4]).toBeDefined(); // sentimiento_desafio
            expect(datosGuardados[5]).toBeDefined(); // sentimiento_logro
            expect(datosGuardados[6]).toBeDefined(); // sentimiento_comunicacion

            expect(datosGuardados[7]).toBeDefined(); // score_desafio
            expect(datosGuardados[8]).toBeDefined(); // score_logro
            expect(datosGuardados[9]).toBeDefined(); // score_comunicacion
        });

        it('debe asociar la bitácora al aprendiz correcto', async () => {
            const bitacoraData = {
                respuestaDesafio: 'Texto de prueba para validar que la bitácora se asocie correctamente al aprendiz que la está registrando en el sistema.',
                respuestaLogro: 'Texto de prueba para verificar que los datos se almacenen con el identificador correcto del usuario en la base de datos.',
                respuestaComunicacion: 'Texto de prueba para asegurar la integridad referencial entre la bitácora y el aprendiz que la creó en el sistema.'
            };

            mockAnalizarSentimiento.mockResolvedValue({
                sentimiento: 'neutral',
                score: 0,
                emociones: {},
                entidades: [],
                palabrasClave: []
            });

            mockInsertarBitacora.mockResolvedValue({ success: true, id: 1 });

            await request(app)
                .post('/aprendiz/bitacora')
                .send(bitacoraData);

            const datosGuardados = mockPoolQuery.mock.calls[0][1];
            expect(datosGuardados[0]).toBe(testUserId);
        });
    });

    describe('Extracción de entidades y palabras clave', () => {
        it('debe extraer y guardar entidades del análisis', async () => {
            const bitacoraData = {
                respuestaDesafio: 'Trabajé con React y Node.js para crear una aplicación web moderna que incluye componentes reutilizables y gestión de estado eficiente.',
                respuestaLogro: 'Implementé autenticación con JWT y bcrypt siguiendo las mejores prácticas de seguridad, asegurando la protección de datos de los usuarios.',
                respuestaComunicacion: 'Colaboré con el equipo usando Slack y Trello para coordinar tareas, compartir conocimientos y mantener un seguimiento efectivo del proyecto.'
            };

            mockAnalizarSentimiento.mockImplementation((texto) => {
                const entidades = [];
                if (texto.includes('React')) entidades.push('React');
                if (texto.includes('Node.js')) entidades.push('Node.js');
                if (texto.includes('JWT')) entidades.push('JWT');
                if (texto.includes('Slack')) entidades.push('Slack');

                return Promise.resolve({
                    sentimiento: 'positivo',
                    score: 0.7,
                    emociones: { alegría: 0.8 },
                    entidades: entidades,
                    palabrasClave: ['trabajé', 'implementé', 'colaboré']
                });
            });

            mockInsertarBitacora.mockResolvedValue({ success: true, id: 1 });

            const response = await request(app)
                .post('/aprendiz/bitacora')
                .send(bitacoraData);

            expect(response.status).toBe(201);
            expect(mockPoolQuery).toHaveBeenCalled();
        });
    });
});
