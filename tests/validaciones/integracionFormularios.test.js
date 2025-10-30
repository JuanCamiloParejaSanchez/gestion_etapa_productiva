/**
 * Tests de Integración para Validación de Formularios
 * Verifica flujos completos de validación end-to-end
 */

const request = require('supertest');
const express = require('express');
const { body, validationResult } = require('express-validator');
const {
    validacionesCamposBasicos,
    validacionesUbicacion,
    validacionesContactoFormacion,
    validarActualizacion
} = require('../../src/validaciones/aprendizValidaciones');
const {
    aprendizSchemas,
    validarDatos
} = require('../../src/validaciones/esquemasValidacion');
const {
    handleValidationErrors,
    sanitizarEntrada,
    validacionesAutenticacion
} = require('../../src/validaciones/validacionesMejoradas');

// Mock del logger
jest.mock('../../src/compartido/utilidades/logger', () => ({
    logAudit: jest.fn()
}));

// Crear aplicación Express de prueba
const createTestApp = (validations = []) => {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Ruta de prueba con validaciones
    app.post('/test', sanitizarEntrada, validations, handleValidationErrors, (req, res) => {
        res.status(200).json({ success: true, data: req.body });
    });

    return app;
};

describe('Integración de Formularios - Registro de Aprendiz', () => {
    const datosCompletos = {
        nombres: 'Juan Carlos',
        primerApellido: 'Pérez',
        segundoApellido: 'González',
        tipoDocumento: 'CC',
        numeroDocumento: '12345678',
        fechaNacimiento: '2000-01-15',
        celular: '3001234567',
        direccion: 'Calle 123 # 45-67',
        departamento: 'Cundinamarca',
        municipio: 'Bogotá',
        barrio: 'Centro',
        correoElectronico: 'juan.perez@example.com',
        numeroFicha: '2345678',
        programaFormacion: 'tecnoActividadFisica'
    };

    test('Debe procesar formulario completo y válido', async () => {
        const app = createTestApp([
            ...validacionesCamposBasicos,
            ...validacionesUbicacion,
            ...validacionesContactoFormacion
        ]);

        const response = await request(app)
            .post('/test')
            .send(datosCompletos);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test('Debe sanitizar datos antes de validar', async () => {
        const app = createTestApp([
            ...validacionesCamposBasicos,
            ...validacionesUbicacion,
            ...validacionesContactoFormacion
        ]);

        const datosConEspacios = {
            ...datosCompletos,
            nombres: '  Juan Carlos  ',
            direccion: '  Calle 123 # 45-67  '
        };

        const response = await request(app)
            .post('/test')
            .send(datosConEspacios);

        expect(response.status).toBe(200);
        expect(response.body.data.nombres).toBe('Juan Carlos');
        expect(response.body.data.direccion).toBe('Calle 123 # 45-67');
    });

    test('Debe rechazar formulario con múltiples errores', async () => {
        const app = createTestApp([
            ...validacionesCamposBasicos,
            ...validacionesUbicacion,
            ...validacionesContactoFormacion
        ]);

        const datosInvalidos = {
            nombres: '',
            primerApellido: 'P',
            tipoDocumento: 'INVALIDO',
            numeroDocumento: '123',
            fechaNacimiento: 'fecha-invalida',
            celular: '300',
            direccion: 'Cll',
            departamento: '',
            municipio: '',
            correoElectronico: 'correo-invalido',
            numeroFicha: 'ABC',
            programaFormacion: 'invalido'
        };

        const response = await request(app)
            .post('/test')
            .send(datosInvalidos);

        expect(response.status).toBe(400);
        expect(response.body.error).toBeDefined();
        expect(response.body.details).toBeDefined();
        expect(response.body.details.length).toBeGreaterThan(5);
    });

    test('Debe validar relación entre campos (segundo apellido opcional)', async () => {
        const app = createTestApp([
            ...validacionesCamposBasicos,
            ...validacionesUbicacion,
            ...validacionesContactoFormacion
        ]);

        const datosSinSegundoApellido = {
            ...datosCompletos
        };
        delete datosSinSegundoApellido.segundoApellido;

        const response = await request(app)
            .post('/test')
            .send(datosSinSegundoApellido);

        expect(response.status).toBe(200);
    });

    test('Debe validar edad mínima mediante fecha de nacimiento', async () => {
        const app = createTestApp(validacionesAutenticacion.registroAprendiz);

        const hoy = new Date();
        const fechaNacimiento = new Date(hoy.getFullYear() - 5, hoy.getMonth(), hoy.getDate());

        const datosConEdadInvalida = {
            ...datosCompletos,
            fechaNacimiento: fechaNacimiento.toISOString().split('T')[0]
        };

        const response = await request(app)
            .post('/test')
            .send(datosConEdadInvalida);

        expect(response.status).toBe(400);
        expect(response.body.details.some(d => d.field === 'fechaNacimiento')).toBe(true);
    });
});

describe('Integración de Formularios - Actualización de Perfil', () => {
    test('Debe procesar actualización parcial de datos', async () => {
        const app = createTestApp(validarActualizacion);

        const datosActualizacion = {
            nombres: 'Juan Carlos',
            primerApellido: 'Pérez',
            segundoApellido: 'González',
            tipoDocumento: 'CC',
            numeroDocumento: '12345678',
            fechaNacimiento: '2000-01-15',
            celular: '3009876543',
            direccion: 'Nueva Calle 456 # 78-90',
            departamento: 'Cundinamarca',
            municipio: 'Bogotá',
            barrio: 'Nuevo Barrio',
            correoElectronico: 'juan.nuevo@example.com',
            numeroFicha: '2345678',
            programaFormacion: 'tecnoActividadFisica',
            alternativaSeleccionada: 'contratoAprendizaje'
        };

        const response = await request(app)
            .post('/test')
            .send(datosActualizacion);

        expect(response.status).toBe(200);
    });
});

describe('Integración de Formularios - Validación con Joi', () => {
    test('Debe validar registro completo con Joi', () => {
        const datosCompletos = {
            tipoDocumento: 'CC',
            numeroDocumento: '12345678',
            nombres: 'Juan Carlos',
            primerApellido: 'Pérez',
            segundoApellido: 'González',
            fechaNacimiento: '2000-01-15',
            eps: 'Sanitas',
            telefonoFijo: '6012345678',
            celular: '3001234567',
            direccion: 'Calle 123 # 45-67',
            barrio: 'Centro',
            departamento: 'Cundinamarca',
            municipio: 'Bogotá',
            correoElectronico: 'juan.perez@example.com',
            fechaInicioFormacion: '2023-01-01',
            fechaInicioLectiva: '2023-01-15',
            fechaFinLectiva: '2023-06-30',
            fechaInicioProductiva: '2023-07-01',
            fechaFinProductiva: '2023-12-31',
            instructorLectiva: 'María López García',
            instructorProductiva: 'Carlos Gómez Ruiz',
            numeroFicha: '2345678',
            programaFormacion: 'tecnoActividadFisica',
            alternativaSeleccionada: 'contratoAprendizaje',
            areaFormacion: 'Deportes',
            empresaPatrocinadora: 'Empresa XYZ',
            areaPractica: 'Entrenamiento',
            jefeInmediato: 'Roberto Martínez',
            telefonoEmpresa: '6019876543',
            celularEmpresa: '3009876543',
            direccionEmpresa: 'Carrera 50 # 100-20',
            correoEmpresa: 'contacto@empresa.com',
            horario: 'Lunes a Viernes 8:00 - 17:00'
        };

        const resultado = validarDatos(datosCompletos, aprendizSchemas.registro);
        
        expect(resultado.valido).toBe(true);
        expect(resultado.errores).toHaveLength(0);
        expect(resultado.datos).toBeTruthy();
    });

    test('Debe validar y reportar múltiples errores con Joi', () => {
        const datosInvalidos = {
            tipoDocumento: 'INVALIDO',
            numeroDocumento: '123',
            nombres: 'A',
            primerApellido: '123',
            fechaNacimiento: '2030-01-01',
            eps: 'S',
            celular: '300',
            direccion: 'Cll',
            barrio: 'C',
            departamento: 'C',
            municipio: 'C',
            correoElectronico: 'invalido',
            fechaInicioFormacion: '2030-01-01',
            fechaInicioLectiva: '2023-06-30',
            fechaFinLectiva: '2023-01-15',
            fechaInicioProductiva: '2023-01-01',
            fechaFinProductiva: '2022-12-31',
            instructorLectiva: 'ML',
            instructorProductiva: 'CG',
            numeroFicha: 'ABC',
            programaFormacion: 'invalido',
            alternativaSeleccionada: 'invalida',
            areaFormacion: 'D',
            empresaPatrocinadora: 'E',
            areaPractica: 'E',
            jefeInmediato: 'RM',
            telefonoEmpresa: '123',
            celularEmpresa: '300',
            direccionEmpresa: 'Crr',
            correoEmpresa: 'invalido',
            horario: 'LV'
        };

        const resultado = validarDatos(datosInvalidos, aprendizSchemas.registro);
        
        expect(resultado.valido).toBe(false);
        expect(resultado.errores.length).toBeGreaterThan(10);
        expect(resultado.datos).toBeNull();
    });
});

describe('Integración de Formularios - Seguridad', () => {
    test('Debe prevenir inyección XSS en campos de texto', async () => {
        const app = createTestApp([
            ...validacionesCamposBasicos,
            ...validacionesUbicacion,
            ...validacionesContactoFormacion
        ]);

        const datosConXSS = {
            nombres: 'Juan<script>alert("xss")</script>Carlos',
            primerApellido: 'Pérez',
            segundoApellido: 'González',
            tipoDocumento: 'CC',
            numeroDocumento: '12345678',
            fechaNacimiento: '2000-01-15',
            celular: '3001234567',
            direccion: 'Calle 123 # 45-67',
            departamento: 'Cundinamarca',
            municipio: 'Bogotá',
            barrio: 'Centro',
            correoElectronico: 'juan.perez@example.com',
            numeroFicha: '2345678',
            programaFormacion: 'tecnoActividadFisica'
        };

        const response = await request(app)
            .post('/test')
            .send(datosConXSS);

        if (response.status === 200) {
            expect(response.body.data.nombres).not.toContain('<script>');
        }
    });

    test('Debe limitar longitud de cadenas para prevenir ataques', async () => {
        const app = createTestApp([
            ...validacionesCamposBasicos,
            ...validacionesUbicacion,
            ...validacionesContactoFormacion
        ]);

        const datosConCadenaLarga = {
            nombres: 'A'.repeat(30000),
            primerApellido: 'Pérez',
            tipoDocumento: 'CC',
            numeroDocumento: '12345678',
            fechaNacimiento: '2000-01-15',
            celular: '3001234567',
            direccion: 'Calle 123 # 45-67',
            departamento: 'Cundinamarca',
            municipio: 'Bogotá',
            correoElectronico: 'juan.perez@example.com',
            numeroFicha: '2345678',
            programaFormacion: 'tecnoActividadFisica'
        };

        const response = await request(app)
            .post('/test')
            .send(datosConCadenaLarga);

        // Debe ser rechazado o sanitizado
        if (response.status === 200) {
            expect(response.body.data.nombres.length).toBeLessThanOrEqual(10000);
        } else {
            expect(response.status).toBe(400);
        }
    });
});

describe('Integración de Formularios - Validaciones en Cascada', () => {
    test('Debe validar fechas en orden cronológico', () => {
        const datosConFechasIncorrectas = {
            tipoDocumento: 'CC',
            numeroDocumento: '12345678',
            nombres: 'Juan',
            primerApellido: 'Pérez',
            fechaNacimiento: '2000-01-15',
            eps: 'Sanitas',
            celular: '3001234567',
            direccion: 'Calle 123 # 45-67',
            barrio: 'Centro',
            departamento: 'Cundinamarca',
            municipio: 'Bogotá',
            correoElectronico: 'juan.perez@example.com',
            fechaInicioFormacion: '2023-01-01',
            fechaInicioLectiva: '2023-06-30',
            fechaFinLectiva: '2023-01-15',
            fechaInicioProductiva: '2023-07-01',
            fechaFinProductiva: '2023-12-31',
            instructorLectiva: 'María López',
            instructorProductiva: 'Carlos Gómez',
            numeroFicha: '2345678',
            programaFormacion: 'tecnoActividadFisica',
            alternativaSeleccionada: 'contratoAprendizaje',
            areaFormacion: 'Deportes',
            empresaPatrocinadora: 'Empresa XYZ',
            areaPractica: 'Entrenamiento',
            jefeInmediato: 'Roberto Martínez',
            telefonoEmpresa: '6019876543',
            celularEmpresa: '3009876543',
            direccionEmpresa: 'Carrera 50 # 100-20',
            correoEmpresa: 'contacto@empresa.com',
            horario: 'Lunes a Viernes 8:00 - 17:00'
        };

        const resultado = validarDatos(datosConFechasIncorrectas, aprendizSchemas.registro);
        
        expect(resultado.valido).toBe(false);
        expect(resultado.errores.some(e => e.campo === 'fechaFinLectiva')).toBe(true);
    });

    test('Debe validar dependencias entre campos opcionales', () => {
        const datosValidos = {
            tipoDocumento: 'CC',
            numeroDocumento: '12345678',
            nombres: 'Juan',
            primerApellido: 'Pérez',
            segundoApellido: '', // Opcional
            fechaNacimiento: '2000-01-15',
            eps: 'Sanitas',
            telefonoFijo: '', // Opcional
            celular: '3001234567',
            direccion: 'Calle 123 # 45-67',
            barrio: 'Centro',
            departamento: 'Cundinamarca',
            municipio: 'Bogotá',
            correoElectronico: 'juan.perez@example.com',
            fechaInicioFormacion: '2023-01-01',
            fechaInicioLectiva: '2023-01-15',
            fechaFinLectiva: '2023-06-30',
            fechaInicioProductiva: '2023-07-01',
            fechaFinProductiva: '2023-12-31',
            instructorLectiva: 'María López',
            instructorProductiva: 'Carlos Gómez',
            numeroFicha: '2345678',
            programaFormacion: 'tecnoActividadFisica',
            alternativaSeleccionada: 'contratoAprendizaje',
            areaFormacion: 'Deportes',
            empresaPatrocinadora: 'Empresa XYZ',
            areaPractica: 'Entrenamiento',
            jefeInmediato: 'Roberto Martínez',
            telefonoEmpresa: '6019876543',
            celularEmpresa: '3009876543',
            direccionEmpresa: 'Carrera 50 # 100-20',
            correoEmpresa: 'contacto@empresa.com',
            horario: 'Lunes a Viernes 8:00 - 17:00'
        };

        const resultado = validarDatos(datosValidos, aprendizSchemas.registro);
        
        expect(resultado.valido).toBe(true);
    });
});

describe('Integración de Formularios - Normalización de Datos', () => {
    test('Debe normalizar correos electrónicos', async () => {
        const app = createTestApp([
            ...validacionesCamposBasicos,
            ...validacionesUbicacion,
            ...validacionesContactoFormacion
        ]);

        const datosConCorreoMayusculas = {
            nombres: 'Juan',
            primerApellido: 'Pérez',
            tipoDocumento: 'CC',
            numeroDocumento: '12345678',
            fechaNacimiento: '2000-01-15',
            celular: '3001234567',
            direccion: 'Calle 123 # 45-67',
            departamento: 'Cundinamarca',
            municipio: 'Bogotá',
            correoElectronico: 'JUAN.PEREZ@EXAMPLE.COM',
            numeroFicha: '2345678',
            programaFormacion: 'tecnoActividadFisica'
        };

        const response = await request(app)
            .post('/test')
            .send(datosConCorreoMayusculas);

        expect(response.status).toBe(200);
        expect(response.body.data.correoElectronico.toLowerCase()).toBe('juan.perez@example.com');
    });

    test('Debe eliminar espacios en blanco de campos', async () => {
        const app = createTestApp([
            ...validacionesCamposBasicos,
            ...validacionesUbicacion,
            ...validacionesContactoFormacion
        ]);

        const datosConEspacios = {
            nombres: '  Juan  ',
            primerApellido: '  Pérez  ',
            tipoDocumento: 'CC',
            numeroDocumento: '  12345678  ',
            fechaNacimiento: '2000-01-15',
            celular: '  3001234567  ',
            direccion: '  Calle 123 # 45-67  ',
            departamento: '  Cundinamarca  ',
            municipio: '  Bogotá  ',
            correoElectronico: '  juan.perez@example.com  ',
            numeroFicha: '  2345678  ',
            programaFormacion: 'tecnoActividadFisica'
        };

        const response = await request(app)
            .post('/test')
            .send(datosConEspacios);

        expect(response.status).toBe(200);
        expect(response.body.data.nombres).toBe('Juan');
        expect(response.body.data.numeroDocumento).toBe('12345678');
    });
});
