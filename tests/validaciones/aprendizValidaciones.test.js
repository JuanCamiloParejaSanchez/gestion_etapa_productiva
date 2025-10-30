/**
 * Tests para aprendizValidaciones.js
 * Verifica todas las validaciones relacionadas con los datos de aprendices
 */

const { validationResult } = require('express-validator');
const {
    validacionesCamposBasicos,
    validacionesUbicacion,
    validacionesContactoFormacion,
    validacionesEtapaProductiva,
    validacionesFechas,
    validarId,
    validarFiltros,
    validarActualizacion
} = require('../../src/validaciones/aprendizValidaciones');

// Helper para ejecutar validaciones
const executeValidations = async (validations, req) => {
    for (const validation of validations) {
        await validation.run(req);
    }
    return validationResult(req);
};

// Mock de request
const createMockRequest = (body = {}, params = {}, query = {}) => ({
    body,
    params,
    query,
    session: {}
});

describe('Validaciones de Aprendiz - Campos Básicos', () => {
    describe('Validación de nombres', () => {
        test('Debe aceptar nombres válidos', async () => {
            const req = createMockRequest({
                nombres: 'Juan Carlos',
                primerApellido: 'Pérez',
                segundoApellido: 'González',
                tipoDocumento: 'CC',
                numeroDocumento: '12345678',
                fechaNacimiento: '2000-01-01',
                celular: '3001234567'
            });

            const result = await executeValidations(validacionesCamposBasicos, req);
            expect(result.isEmpty()).toBe(true);
        });

        test('Debe rechazar nombres vacíos', async () => {
            const req = createMockRequest({
                nombres: '',
                primerApellido: 'Pérez',
                tipoDocumento: 'CC',
                numeroDocumento: '12345678',
                fechaNacimiento: '2000-01-01',
                celular: '3001234567'
            });

            const result = await executeValidations(validacionesCamposBasicos, req);
            expect(result.isEmpty()).toBe(false);
            expect(result.array().some(err => err.path === 'nombres')).toBe(true);
        });

        test('Debe rechazar nombres con números', async () => {
            const req = createMockRequest({
                nombres: 'Juan123',
                primerApellido: 'Pérez',
                tipoDocumento: 'CC',
                numeroDocumento: '12345678',
                fechaNacimiento: '2000-01-01',
                celular: '3001234567'
            });

            const result = await executeValidations(validacionesCamposBasicos, req);
            expect(result.isEmpty()).toBe(false);
            const errores = result.array();
            expect(errores.some(err => err.path === 'nombres')).toBe(true);
        });

        test('Debe rechazar nombres muy cortos', async () => {
            const req = createMockRequest({
                nombres: 'A',
                primerApellido: 'Pérez',
                tipoDocumento: 'CC',
                numeroDocumento: '12345678',
                fechaNacimiento: '2000-01-01',
                celular: '3001234567'
            });

            const result = await executeValidations(validacionesCamposBasicos, req);
            expect(result.isEmpty()).toBe(false);
        });

        test('Debe aceptar nombres con tildes', async () => {
            const req = createMockRequest({
                nombres: 'José María',
                primerApellido: 'Pérez',
                tipoDocumento: 'CC',
                numeroDocumento: '12345678',
                fechaNacimiento: '2000-01-01',
                celular: '3001234567'
            });

            const result = await executeValidations(validacionesCamposBasicos, req);
            expect(result.isEmpty()).toBe(true);
        });
    });

    describe('Validación de apellidos', () => {
        test('Debe aceptar apellidos válidos', async () => {
            const req = createMockRequest({
                nombres: 'Juan',
                primerApellido: 'Pérez',
                segundoApellido: 'González',
                tipoDocumento: 'CC',
                numeroDocumento: '12345678',
                fechaNacimiento: '2000-01-01',
                celular: '3001234567'
            });

            const result = await executeValidations(validacionesCamposBasicos, req);
            expect(result.isEmpty()).toBe(true);
        });

        test('Debe rechazar primer apellido vacío', async () => {
            const req = createMockRequest({
                nombres: 'Juan',
                primerApellido: '',
                tipoDocumento: 'CC',
                numeroDocumento: '12345678',
                fechaNacimiento: '2000-01-01',
                celular: '3001234567'
            });

            const result = await executeValidations(validacionesCamposBasicos, req);
            expect(result.isEmpty()).toBe(false);
            expect(result.array().some(err => err.path === 'primerApellido')).toBe(true);
        });

        test('Debe permitir segundo apellido vacío', async () => {
            const req = createMockRequest({
                nombres: 'Juan',
                primerApellido: 'Pérez',
                tipoDocumento: 'CC',
                numeroDocumento: '12345678',
                fechaNacimiento: '2000-01-01',
                celular: '3001234567'
            });
            // No incluir segundoApellido en lugar de enviarlo vacío

            const result = await executeValidations(validacionesCamposBasicos, req);
            expect(result.isEmpty()).toBe(true);
        });
    });

    describe('Validación de tipo de documento', () => {
        test('Debe aceptar tipos de documento válidos', async () => {
            const tiposValidos = ['CC', 'TI', 'CE', 'PEP', 'PPT'];
            
            for (const tipo of tiposValidos) {
                const req = createMockRequest({
                    nombres: 'Juan',
                    primerApellido: 'Pérez',
                    tipoDocumento: tipo,
                    numeroDocumento: '12345678',
                    fechaNacimiento: '2000-01-01',
                    celular: '3001234567'
                });

                const result = await executeValidations(validacionesCamposBasicos, req);
                expect(result.isEmpty()).toBe(true);
            }
        });

        test('Debe rechazar tipos de documento inválidos', async () => {
            const req = createMockRequest({
                nombres: 'Juan',
                primerApellido: 'Pérez',
                tipoDocumento: 'INVALIDO',
                numeroDocumento: '12345678',
                fechaNacimiento: '2000-01-01',
                celular: '3001234567'
            });

            const result = await executeValidations(validacionesCamposBasicos, req);
            expect(result.isEmpty()).toBe(false);
            expect(result.array().some(err => err.path === 'tipoDocumento')).toBe(true);
        });
    });

    describe('Validación de número de documento', () => {
        test('Debe aceptar número de documento válido', async () => {
            const req = createMockRequest({
                nombres: 'Juan',
                primerApellido: 'Pérez',
                tipoDocumento: 'CC',
                numeroDocumento: '12345678',
                fechaNacimiento: '2000-01-01',
                celular: '3001234567'
            });

            const result = await executeValidations(validacionesCamposBasicos, req);
            expect(result.isEmpty()).toBe(true);
        });

        test('Debe rechazar número de documento con letras', async () => {
            const req = createMockRequest({
                nombres: 'Juan',
                primerApellido: 'Pérez',
                tipoDocumento: 'CC',
                numeroDocumento: '123ABC456',
                fechaNacimiento: '2000-01-01',
                celular: '3001234567'
            });

            const result = await executeValidations(validacionesCamposBasicos, req);
            expect(result.isEmpty()).toBe(false);
        });

        test('Debe rechazar número de documento muy corto', async () => {
            const req = createMockRequest({
                nombres: 'Juan',
                primerApellido: 'Pérez',
                tipoDocumento: 'CC',
                numeroDocumento: '123',
                fechaNacimiento: '2000-01-01',
                celular: '3001234567'
            });

            const result = await executeValidations(validacionesCamposBasicos, req);
            expect(result.isEmpty()).toBe(false);
        });

        test('Debe rechazar número de documento muy largo', async () => {
            const req = createMockRequest({
                nombres: 'Juan',
                primerApellido: 'Pérez',
                tipoDocumento: 'CC',
                numeroDocumento: '12345678901234567890123',
                fechaNacimiento: '2000-01-01',
                celular: '3001234567'
            });

            const result = await executeValidations(validacionesCamposBasicos, req);
            expect(result.isEmpty()).toBe(false);
        });
    });

    describe('Validación de fecha de nacimiento', () => {
        test('Debe aceptar fecha de nacimiento válida', async () => {
            const req = createMockRequest({
                nombres: 'Juan',
                primerApellido: 'Pérez',
                tipoDocumento: 'CC',
                numeroDocumento: '12345678',
                fechaNacimiento: '2000-01-01',
                celular: '3001234567'
            });

            const result = await executeValidations(validacionesCamposBasicos, req);
            expect(result.isEmpty()).toBe(true);
        });

        test('Debe rechazar persona menor de 10 años', async () => {
            const hoy = new Date();
            const fechaNacimiento = new Date(hoy.getFullYear() - 5, hoy.getMonth(), hoy.getDate());
            
            const req = createMockRequest({
                nombres: 'Juan',
                primerApellido: 'Pérez',
                tipoDocumento: 'CC',
                numeroDocumento: '12345678',
                fechaNacimiento: fechaNacimiento.toISOString().split('T')[0],
                celular: '3001234567'
            });

            const result = await executeValidations(validacionesCamposBasicos, req);
            expect(result.isEmpty()).toBe(false);
        });

        test('Debe rechazar fecha de nacimiento inválida', async () => {
            const req = createMockRequest({
                nombres: 'Juan',
                primerApellido: 'Pérez',
                tipoDocumento: 'CC',
                numeroDocumento: '12345678',
                fechaNacimiento: 'fecha-invalida',
                celular: '3001234567'
            });

            const result = await executeValidations(validacionesCamposBasicos, req);
            expect(result.isEmpty()).toBe(false);
        });
    });

    describe('Validación de celular', () => {
        test('Debe aceptar número de celular válido', async () => {
            const req = createMockRequest({
                nombres: 'Juan',
                primerApellido: 'Pérez',
                tipoDocumento: 'CC',
                numeroDocumento: '12345678',
                fechaNacimiento: '2000-01-01',
                celular: '3001234567'
            });

            const result = await executeValidations(validacionesCamposBasicos, req);
            expect(result.isEmpty()).toBe(true);
        });

        test('Debe rechazar celular con menos de 10 dígitos', async () => {
            const req = createMockRequest({
                nombres: 'Juan',
                primerApellido: 'Pérez',
                tipoDocumento: 'CC',
                numeroDocumento: '12345678',
                fechaNacimiento: '2000-01-01',
                celular: '300123'
            });

            const result = await executeValidations(validacionesCamposBasicos, req);
            expect(result.isEmpty()).toBe(false);
        });

        test('Debe rechazar celular con más de 10 dígitos', async () => {
            const req = createMockRequest({
                nombres: 'Juan',
                primerApellido: 'Pérez',
                tipoDocumento: 'CC',
                numeroDocumento: '12345678',
                fechaNacimiento: '2000-01-01',
                celular: '30012345678'
            });

            const result = await executeValidations(validacionesCamposBasicos, req);
            expect(result.isEmpty()).toBe(false);
        });

        test('Debe rechazar celular con letras', async () => {
            const req = createMockRequest({
                nombres: 'Juan',
                primerApellido: 'Pérez',
                tipoDocumento: 'CC',
                numeroDocumento: '12345678',
                fechaNacimiento: '2000-01-01',
                celular: '300ABC4567'
            });

            const result = await executeValidations(validacionesCamposBasicos, req);
            expect(result.isEmpty()).toBe(false);
        });
    });
});

describe('Validaciones de Ubicación', () => {
    test('Debe aceptar datos de ubicación válidos', async () => {
        const req = createMockRequest({
            direccion: 'Calle 123 # 45-67',
            departamento: 'Cundinamarca',
            municipio: 'Bogotá',
            barrio: 'Centro'
        });

        const result = await executeValidations(validacionesUbicacion, req);
        expect(result.isEmpty()).toBe(true);
    });

    test('Debe rechazar dirección muy corta', async () => {
        const req = createMockRequest({
            direccion: 'Cll',
            departamento: 'Cundinamarca',
            municipio: 'Bogotá',
            barrio: 'Centro'
        });

        const result = await executeValidations(validacionesUbicacion, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar departamento vacío', async () => {
        const req = createMockRequest({
            direccion: 'Calle 123 # 45-67',
            departamento: '',
            municipio: 'Bogotá',
            barrio: 'Centro'
        });

        const result = await executeValidations(validacionesUbicacion, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar municipio vacío', async () => {
        const req = createMockRequest({
            direccion: 'Calle 123 # 45-67',
            departamento: 'Cundinamarca',
            municipio: '',
            barrio: 'Centro'
        });

        const result = await executeValidations(validacionesUbicacion, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe permitir barrio opcional', async () => {
        const req = createMockRequest({
            direccion: 'Calle 123 # 45-67',
            departamento: 'Cundinamarca',
            municipio: 'Bogotá'
        });

        const result = await executeValidations(validacionesUbicacion, req);
        expect(result.isEmpty()).toBe(true);
    });
});

describe('Validaciones de Contacto y Formación', () => {
    test('Debe aceptar datos de contacto y formación válidos', async () => {
        const req = createMockRequest({
            correoElectronico: 'juan.perez@example.com',
            numeroFicha: '2345678',
            programaFormacion: 'tecnoActividadFisica'
        });

        const result = await executeValidations(validacionesContactoFormacion, req);
        expect(result.isEmpty()).toBe(true);
    });

    test('Debe rechazar correo electrónico inválido', async () => {
        const req = createMockRequest({
            correoElectronico: 'correo-invalido',
            numeroFicha: '2345678',
            programaFormacion: 'tecnoActividadFisica'
        });

        const result = await executeValidations(validacionesContactoFormacion, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar número de ficha incorrecto', async () => {
        const req = createMockRequest({
            correoElectronico: 'juan.perez@example.com',
            numeroFicha: '123',
            programaFormacion: 'tecnoActividadFisica'
        });

        const result = await executeValidations(validacionesContactoFormacion, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar número de ficha con letras', async () => {
        const req = createMockRequest({
            correoElectronico: 'juan.perez@example.com',
            numeroFicha: '234ABC8',
            programaFormacion: 'tecnoActividadFisica'
        });

        const result = await executeValidations(validacionesContactoFormacion, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar programa de formación inválido', async () => {
        const req = createMockRequest({
            correoElectronico: 'juan.perez@example.com',
            numeroFicha: '2345678',
            programaFormacion: 'programaInvalido'
        });

        const result = await executeValidations(validacionesContactoFormacion, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe aceptar ambos programas de formación válidos', async () => {
        const programas = ['tecnoActividadFisica', 'tecnoEntrenamientoDeportivo'];
        
        for (const programa of programas) {
            const req = createMockRequest({
                correoElectronico: 'juan.perez@example.com',
                numeroFicha: '2345678',
                programaFormacion: programa
            });

            const result = await executeValidations(validacionesContactoFormacion, req);
            expect(result.isEmpty()).toBe(true);
        }
    });
});

describe('Validaciones de Etapa Productiva', () => {
    test('Debe aceptar alternativa válida sin datos de empresa', async () => {
        const req = createMockRequest({
            alternativaSeleccionada: 'contratoAprendizaje'
        });

        const result = await executeValidations(validacionesEtapaProductiva, req);
        expect(result.isEmpty()).toBe(true);
    });

    test('Debe aceptar todas las alternativas válidas', async () => {
        const alternativas = [
            'contratoAprendizaje',
            'pasantia',
            'apoyoEntidades',
            'vinculoLaboral',
            'proyectosProductivos',
            'monitoria',
            'unidadesProductivas'
        ];

        for (const alternativa of alternativas) {
            const req = createMockRequest({
                alternativaSeleccionada: alternativa
            });

            const result = await executeValidations(validacionesEtapaProductiva, req);
            expect(result.isEmpty()).toBe(true);
        }
    });

    test('Debe rechazar alternativa inválida', async () => {
        const req = createMockRequest({
            alternativaSeleccionada: 'alternativaInvalida'
        });

        const result = await executeValidations(validacionesEtapaProductiva, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe validar datos opcionales de empresa correctamente', async () => {
        const req = createMockRequest({
            alternativaSeleccionada: 'contratoAprendizaje',
            empresaPatrocinadora: 'Empresa XYZ',
            correoEmpresa: 'contacto@empresa.com',
            telefonoEmpresa: '6012345678',
            direccionEmpresa: 'Calle 100 # 20-30',
            jefeInmediato: 'Carlos Gómez'
        });

        const result = await executeValidations(validacionesEtapaProductiva, req);
        expect(result.isEmpty()).toBe(true);
    });

    test('Debe rechazar correo de empresa inválido', async () => {
        const req = createMockRequest({
            alternativaSeleccionada: 'contratoAprendizaje',
            correoEmpresa: 'correo-invalido'
        });

        const result = await executeValidations(validacionesEtapaProductiva, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar teléfono de empresa inválido', async () => {
        const req = createMockRequest({
            alternativaSeleccionada: 'contratoAprendizaje',
            telefonoEmpresa: '123'
        });

        const result = await executeValidations(validacionesEtapaProductiva, req);
        expect(result.isEmpty()).toBe(false);
    });
});

describe('Validaciones de Fechas', () => {
    test('Debe aceptar fechas válidas en orden correcto', async () => {
        const req = createMockRequest({
            fechaInicioLectiva: '2023-01-01',
            fechaFinLectiva: '2023-06-30',
            fechaInicioProductiva: '2023-07-01',
            fechaFinProductiva: '2023-12-31'
        });

        const result = await executeValidations(validacionesFechas, req);
        expect(result.isEmpty()).toBe(true);
    });

    test('Debe rechazar fecha fin lectiva anterior a inicio lectiva', async () => {
        const req = createMockRequest({
            fechaInicioLectiva: '2023-06-30',
            fechaFinLectiva: '2023-01-01',
            fechaInicioProductiva: '2023-07-01',
            fechaFinProductiva: '2023-12-31'
        });

        const result = await executeValidations(validacionesFechas, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar fecha fin productiva anterior a inicio productiva', async () => {
        const req = createMockRequest({
            fechaInicioLectiva: '2023-01-01',
            fechaFinLectiva: '2023-06-30',
            fechaInicioProductiva: '2023-12-31',
            fechaFinProductiva: '2023-07-01'
        });

        const result = await executeValidations(validacionesFechas, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar fechas con formato inválido', async () => {
        const req = createMockRequest({
            fechaInicioLectiva: 'fecha-invalida',
            fechaFinLectiva: '2023-06-30'
        });

        const result = await executeValidations(validacionesFechas, req);
        expect(result.isEmpty()).toBe(false);
    });
});

describe('Validación de ID', () => {
    test('Debe aceptar ID válido', async () => {
        const req = createMockRequest({}, { id: '123' }, {});

        const result = await executeValidations(validarId, req);
        expect(result.isEmpty()).toBe(true);
    });

    test('Debe rechazar ID no numérico', async () => {
        const req = createMockRequest({}, { id: 'abc' }, {});

        const result = await executeValidations(validarId, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar ID decimal', async () => {
        const req = createMockRequest({}, { id: '12.5' }, {});

        const result = await executeValidations(validarId, req);
        expect(result.isEmpty()).toBe(false);
    });
});

describe('Validación de Filtros', () => {
    test('Debe aceptar filtros válidos', async () => {
        const req = createMockRequest({}, {}, {
            nombre: 'Juan',
            documento: '12345678',
            programaFormacion: 'tecnoActividadFisica',
            alternativaSeleccionada: 'contratoAprendizaje'
        });

        const result = await executeValidations(validarFiltros, req);
        expect(result.isEmpty()).toBe(true);
    });

    test('Debe rechazar término de búsqueda muy corto', async () => {
        const req = createMockRequest({}, {}, {
            nombre: 'J'
        });

        const result = await executeValidations(validarFiltros, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar documento no numérico', async () => {
        const req = createMockRequest({}, {}, {
            documento: 'ABC123'
        });

        const result = await executeValidations(validarFiltros, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar programa de formación inválido en filtros', async () => {
        const req = createMockRequest({}, {}, {
            programaFormacion: 'programaInvalido'
        });

        const result = await executeValidations(validarFiltros, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar alternativa inválida en filtros', async () => {
        const req = createMockRequest({}, {}, {
            alternativaSeleccionada: 'alternativaInvalida'
        });

        const result = await executeValidations(validarFiltros, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe aceptar filtros vacíos', async () => {
        const req = createMockRequest({}, {}, {});

        const result = await executeValidations(validarFiltros, req);
        expect(result.isEmpty()).toBe(true);
    });
});

describe('Validación de Actualización Completa', () => {
    test('Debe aceptar datos completos y válidos para actualización', async () => {
        const req = createMockRequest({
            nombres: 'Juan Carlos',
            primerApellido: 'Pérez',
            segundoApellido: 'González',
            tipoDocumento: 'CC',
            numeroDocumento: '12345678',
            fechaNacimiento: '2000-01-01',
            celular: '3001234567',
            direccion: 'Calle 123 # 45-67',
            departamento: 'Cundinamarca',
            municipio: 'Bogotá',
            barrio: 'Centro',
            correoElectronico: 'juan.perez@example.com',
            numeroFicha: '2345678',
            programaFormacion: 'tecnoActividadFisica',
            alternativaSeleccionada: 'contratoAprendizaje',
            fechaInicioLectiva: '2023-01-01',
            fechaFinLectiva: '2023-06-30',
            fechaInicioProductiva: '2023-07-01',
            fechaFinProductiva: '2023-12-31'
        });

        const result = await executeValidations(validarActualizacion, req);
        expect(result.isEmpty()).toBe(true);
    });

    test('Debe detectar múltiples errores en actualización', async () => {
        const req = createMockRequest({
            nombres: '',
            primerApellido: 'P',
            tipoDocumento: 'INVALIDO',
            numeroDocumento: '123',
            fechaNacimiento: 'invalida',
            celular: '300',
            correoElectronico: 'invalido',
            numeroFicha: 'ABC',
            programaFormacion: 'invalido'
        });

        const result = await executeValidations(validarActualizacion, req);
        expect(result.isEmpty()).toBe(false);
        const errores = result.array();
        expect(errores.length).toBeGreaterThan(5);
    });
});
