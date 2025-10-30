/**
 * Tests para validacionesMejoradas.js
 * Verifica validaciones mejoradas con sanitización y seguridad
 */

const { validationResult } = require('express-validator');
const {
    handleValidationErrors,
    sanitizarEntrada,
    validarArchivo,
    validacionesAutenticacion,
    validacionesGestionAprendices,
    validacionesAdministradores,
    validacionesBitacoras,
    validacionesDocumentos
} = require('../../src/validaciones/validacionesMejoradas');

// Mock del logger
jest.mock('../../src/compartido/utilidades/logger', () => ({
    logAudit: jest.fn()
}));

// Helper para ejecutar validaciones
const executeValidations = async (validations, req) => {
    for (const validation of validations) {
        await validation.run(req);
    }
    return validationResult(req);
};

// Mock de request y response
const createMockRequest = (body = {}, params = {}, query = {}, file = null) => ({
    body,
    params,
    query,
    file,
    session: { userId: 1 },
    ip: '127.0.0.1',
    url: '/test',
    method: 'POST'
});

const createMockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const createMockNext = () => jest.fn();

describe('handleValidationErrors', () => {
    test('Debe llamar next() cuando no hay errores de validación', () => {
        const req = createMockRequest({ email: 'test@example.com' });
        const res = createMockResponse();
        const next = createMockNext();

        // Simular que no hay errores
        req.validationErrors = () => ({ isEmpty: () => true });

        handleValidationErrors(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test('Debe retornar error 400 cuando hay errores de validación', async () => {
        const req = createMockRequest({ email: 'invalido' });
        const res = createMockResponse();
        const next = createMockNext();

        await executeValidations(validacionesAutenticacion.login, req);
        handleValidationErrors(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });
});

describe('sanitizarEntrada', () => {
    test('Debe sanitizar strings en body', () => {
        const req = createMockRequest({
            nombre: '  Juan  ',
            descripcion: '<script>alert("xss")</script>'
        });
        const res = createMockResponse();
        const next = createMockNext();

        sanitizarEntrada(req, res, next);

        expect(req.body.nombre).toBe('Juan');
        expect(req.body.descripcion).not.toContain('<script>');
        expect(next).toHaveBeenCalled();
    });

    test('Debe sanitizar arrays', () => {
        const req = createMockRequest({
            items: ['  item1  ', '  item2  ', '<script>xss</script>']
        });
        const res = createMockResponse();
        const next = createMockNext();

        sanitizarEntrada(req, res, next);

        expect(req.body.items[0]).toBe('item1');
        expect(req.body.items[1]).toBe('item2');
        expect(req.body.items[2]).not.toContain('<script>');
        expect(next).toHaveBeenCalled();
    });

    test('Debe sanitizar objetos anidados', () => {
        const req = createMockRequest({
            usuario: {
                nombre: '  Juan  ',
                email: '  test@example.com  '
            }
        });
        const res = createMockResponse();
        const next = createMockNext();

        sanitizarEntrada(req, res, next);

        expect(req.body.usuario.nombre).toBe('Juan');
        expect(req.body.usuario.email).toBe('test@example.com');
        expect(next).toHaveBeenCalled();
    });

    test('Debe limitar la longitud de strings', () => {
        const req = createMockRequest({
            descripcion: 'A'.repeat(20000)
        });
        const res = createMockResponse();
        const next = createMockNext();

        sanitizarEntrada(req, res, next);

        expect(req.body.descripcion.length).toBeLessThanOrEqual(10000);
        expect(next).toHaveBeenCalled();
    });

    test('Debe limitar el número de elementos en arrays', () => {
        const req = createMockRequest({
            items: new Array(200).fill('item')
        });
        const res = createMockResponse();
        const next = createMockNext();

        sanitizarEntrada(req, res, next);

        expect(req.body.items.length).toBeLessThanOrEqual(100);
        expect(next).toHaveBeenCalled();
    });
});

describe('validarArchivo', () => {
    test('Debe llamar next() cuando no hay archivo', () => {
        const req = createMockRequest();
        const res = createMockResponse();
        const next = createMockNext();

        validarArchivo(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    test('Debe aceptar archivos PDF válidos', () => {
        const req = createMockRequest({}, {}, {}, {
            originalname: 'documento.pdf',
            mimetype: 'application/pdf',
            size: 1024 * 1024 // 1MB
        });
        const res = createMockResponse();
        const next = createMockNext();

        validarArchivo(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    test('Debe aceptar archivos DOCX válidos', () => {
        const req = createMockRequest({}, {}, {}, {
            originalname: 'documento.docx',
            mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            size: 2 * 1024 * 1024 // 2MB
        });
        const res = createMockResponse();
        const next = createMockNext();

        validarArchivo(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    test('Debe rechazar archivos con tipo MIME no permitido', () => {
        const req = createMockRequest({}, {}, {}, {
            originalname: 'malware.exe',
            mimetype: 'application/x-msdownload',
            size: 1024
        });
        const res = createMockResponse();
        const next = createMockNext();

        validarArchivo(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: expect.stringContaining('Tipo de archivo no permitido')
            })
        );
    });

    test('Debe rechazar archivos muy grandes', () => {
        const req = createMockRequest({}, {}, {}, {
            originalname: 'documento.pdf',
            mimetype: 'application/pdf',
            size: 15 * 1024 * 1024 // 15MB (mayor a 10MB)
        });
        const res = createMockResponse();
        const next = createMockNext();

        validarArchivo(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: expect.stringContaining('demasiado grande')
            })
        );
    });

    test('Debe rechazar archivos con nombres peligrosos', () => {
        const req = createMockRequest({}, {}, {}, {
            originalname: '../../../etc/passwd',
            mimetype: 'application/pdf',
            size: 1024
        });
        const res = createMockResponse();
        const next = createMockNext();

        validarArchivo(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});

describe('Validaciones de Autenticación - Login', () => {
    test('Debe validar credenciales de login correctas', async () => {
        const req = createMockRequest({
            email: 'test@example.com',
            password: 'Password123!@#$',
            role: 'aprendiz'
        });

        const result = await executeValidations(validacionesAutenticacion.login, req);
        expect(result.isEmpty()).toBe(true);
    });

    test('Debe rechazar email inválido', async () => {
        const req = createMockRequest({
            email: 'email-invalido',
            password: 'Password123!@#$',
            role: 'aprendiz'
        });

        const result = await executeValidations(validacionesAutenticacion.login, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar contraseña muy corta', async () => {
        const req = createMockRequest({
            email: 'test@example.com',
            password: 'Pass1!',
            role: 'aprendiz'
        });

        const result = await executeValidations(validacionesAutenticacion.login, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar contraseña sin mayúscula', async () => {
        const req = createMockRequest({
            email: 'test@example.com',
            password: 'password123!@#$',
            role: 'aprendiz'
        });

        const result = await executeValidations(validacionesAutenticacion.login, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar contraseña sin minúscula', async () => {
        const req = createMockRequest({
            email: 'test@example.com',
            password: 'PASSWORD123!@#$',
            role: 'aprendiz'
        });

        const result = await executeValidations(validacionesAutenticacion.login, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar contraseña sin número', async () => {
        const req = createMockRequest({
            email: 'test@example.com',
            password: 'Password!@#$',
            role: 'aprendiz'
        });

        const result = await executeValidations(validacionesAutenticacion.login, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar contraseña sin símbolo', async () => {
        const req = createMockRequest({
            email: 'test@example.com',
            password: 'Password1234',
            role: 'aprendiz'
        });

        const result = await executeValidations(validacionesAutenticacion.login, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar rol inválido', async () => {
        const req = createMockRequest({
            email: 'test@example.com',
            password: 'Password123!@#$',
            role: 'superadmin'
        });

        const result = await executeValidations(validacionesAutenticacion.login, req);
        expect(result.isEmpty()).toBe(false);
    });
});

describe('Validaciones de Autenticación - Registro Aprendiz', () => {
    const datosValidosRegistro = {
        nombres: 'Juan Carlos',
        primerApellido: 'Pérez',
        segundoApellido: 'González',
        tipoDocumento: 'CC',
        numeroDocumento: '12345678',
        fechaNacimiento: '2000-01-15',
        correoElectronico: 'juan.perez@example.com',
        telefonoFijo: '6012345678',
        celular: '3001234567',
        departamento: 'Cundinamarca',
        municipio: 'Bogotá',
        direccion: 'Calle 123 # 45-67',
        programaFormacion: 'tecnoActividadFisica',
        alternativaSeleccionada: 'contratoAprendizaje'
    };

    test('Debe validar registro de aprendiz correcto', async () => {
        const req = createMockRequest(datosValidosRegistro);
        const result = await executeValidations(validacionesAutenticacion.registroAprendiz, req);
        expect(result.isEmpty()).toBe(true);
    });

    test('Debe rechazar nombres con números', async () => {
        const req = createMockRequest({
            ...datosValidosRegistro,
            nombres: 'Juan123'
        });
        const result = await executeValidations(validacionesAutenticacion.registroAprendiz, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe validar edad mínima de 14 años', async () => {
        const fechaNacimiento = new Date();
        fechaNacimiento.setFullYear(fechaNacimiento.getFullYear() - 10);
        
        const req = createMockRequest({
            ...datosValidosRegistro,
            fechaNacimiento: fechaNacimiento.toISOString().split('T')[0]
        });
        
        const result = await executeValidations(validacionesAutenticacion.registroAprendiz, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar edad mayor a 100 años', async () => {
        const fechaNacimiento = new Date();
        fechaNacimiento.setFullYear(fechaNacimiento.getFullYear() - 101);
        
        const req = createMockRequest({
            ...datosValidosRegistro,
            fechaNacimiento: fechaNacimiento.toISOString().split('T')[0]
        });
        
        const result = await executeValidations(validacionesAutenticacion.registroAprendiz, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar celular con formato inválido', async () => {
        const req = createMockRequest({
            ...datosValidosRegistro,
            celular: '12345'
        });
        const result = await executeValidations(validacionesAutenticacion.registroAprendiz, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe aceptar celular con prefijo +57', async () => {
        const req = createMockRequest({
            ...datosValidosRegistro,
            celular: '+573001234567'
        });
        const result = await executeValidations(validacionesAutenticacion.registroAprendiz, req);
        expect(result.isEmpty()).toBe(true);
    });
});

describe('Validaciones de Autenticación - Crear Password', () => {
    test('Debe validar creación de password correcta', async () => {
        const req = createMockRequest({
            password: 'NewPassword123!@#$',
            confirmPassword: 'NewPassword123!@#$',
            correoElectronico: 'test@example.com'
        });
        const result = await executeValidations(validacionesAutenticacion.crearPassword, req);
        expect(result.isEmpty()).toBe(true);
    });

    test('Debe rechazar contraseñas que no coinciden', async () => {
        const req = createMockRequest({
            password: 'Password123!@#$',
            confirmPassword: 'DifferentPass123!@#$',
            correoElectronico: 'test@example.com'
        });
        const result = await executeValidations(validacionesAutenticacion.crearPassword, req);
        expect(result.isEmpty()).toBe(false);
    });
});

describe('Validaciones de Autenticación - Reset Password', () => {
    test('Debe validar reset de password correcto', async () => {
        const req = createMockRequest({
            email: 'test@example.com',
            codigo: '123456',
            password: 'NewPassword123!@#$',
            confirmPassword: 'NewPassword123!@#$'
        });
        const result = await executeValidations(validacionesAutenticacion.resetPassword, req);
        expect(result.isEmpty()).toBe(true);
    });

    test('Debe rechazar código con formato inválido', async () => {
        const req = createMockRequest({
            email: 'test@example.com',
            codigo: 'ABC123',
            password: 'NewPassword123!@#$',
            confirmPassword: 'NewPassword123!@#$'
        });
        const result = await executeValidations(validacionesAutenticacion.resetPassword, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar código muy corto', async () => {
        const req = createMockRequest({
            email: 'test@example.com',
            codigo: '123',
            password: 'NewPassword123!@#$',
            confirmPassword: 'NewPassword123!@#$'
        });
        const result = await executeValidations(validacionesAutenticacion.resetPassword, req);
        expect(result.isEmpty()).toBe(false);
    });
});

describe('Validaciones de Gestión de Aprendices - Actualizar', () => {
    test('Debe validar actualización de aprendiz correcta', async () => {
        const req = createMockRequest(
            {
                nombres: 'Juan Carlos',
                primerApellido: 'Pérez',
                correoElectronico: 'juan.perez@example.com',
                celular: '3001234567'
            },
            { id: '123' }
        );
        const result = await executeValidations(validacionesGestionAprendices.actualizarAprendiz, req);
        expect(result.isEmpty()).toBe(true);
    });

    test('Debe rechazar ID no numérico', async () => {
        const req = createMockRequest(
            { nombres: 'Juan' },
            { id: 'abc' }
        );
        const result = await executeValidations(validacionesGestionAprendices.actualizarAprendiz, req);
        expect(result.isEmpty()).toBe(false);
    });
});

describe('Validaciones de Gestión de Aprendices - Obtener Datos', () => {
    test('Debe validar parámetros de DataTables correctos', async () => {
        const req = createMockRequest(
            {},
            {},
            {
                draw: '1',
                start: '0',
                length: '10',
                'order[0][column]': '0',
                'order[0][dir]': 'asc'
            }
        );
        const result = await executeValidations(validacionesGestionAprendices.obtenerDatosAprendices, req);
        expect(result.isEmpty()).toBe(true);
    });

    test('Debe rechazar length fuera de rango', async () => {
        const req = createMockRequest({}, {}, { length: '150' });
        const result = await executeValidations(validacionesGestionAprendices.obtenerDatosAprendices, req);
        expect(result.isEmpty()).toBe(false);
    });
});

describe('Validaciones de Administradores - Registro', () => {
    test('Debe validar registro de administrador correcto', async () => {
        const req = createMockRequest({
            nombreCompleto: 'María López García',
            correoInstitucional: 'maria.lopez@sena.edu.co',
            numeroIdentificacion: '1234567890',
            telefono: '6012345678',
            departamento: 'Cundinamarca',
            cargo: 'Instructor',
            password: 'Password123!@#$'
        });
        const result = await executeValidations(validacionesAdministradores.registroAdmin, req);
        expect(result.isEmpty()).toBe(true);
    });

    test('Debe rechazar correo que no sea del SENA', async () => {
        const req = createMockRequest({
            nombreCompleto: 'María López García',
            correoInstitucional: 'maria.lopez@gmail.com',
            numeroIdentificacion: '1234567890',
            telefono: '6012345678',
            cargo: 'Instructor',
            password: 'Password123!@#$'
        });
        const result = await executeValidations(validacionesAdministradores.registroAdmin, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar nombre con números', async () => {
        const req = createMockRequest({
            nombreCompleto: 'María123 López',
            correoInstitucional: 'maria.lopez@sena.edu.co',
            numeroIdentificacion: '1234567890',
            telefono: '6012345678',
            cargo: 'Instructor',
            password: 'Password123!@#$'
        });
        const result = await executeValidations(validacionesAdministradores.registroAdmin, req);
        expect(result.isEmpty()).toBe(false);
    });
});

describe('Validaciones de Bitácoras - Registrar', () => {
    test('Debe validar registro de bitácora correcto', async () => {
        const req = createMockRequest({
            contenido: 'A'.repeat(100),
            fechaRegistro: new Date().toISOString()
        });
        const result = await executeValidations(validacionesBitacoras.registrarBitacora, req);
        expect(result.isEmpty()).toBe(true);
    });

    test('Debe rechazar contenido muy corto', async () => {
        const req = createMockRequest({
            contenido: 'Muy corto',
            fechaRegistro: new Date().toISOString()
        });
        const result = await executeValidations(validacionesBitacoras.registrarBitacora, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar contenido muy largo', async () => {
        const req = createMockRequest({
            contenido: 'A'.repeat(6000),
            fechaRegistro: new Date().toISOString()
        });
        const result = await executeValidations(validacionesBitacoras.registrarBitacora, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar contenido con scripts maliciosos', async () => {
        const req = createMockRequest({
            contenido: '<script>alert("xss")</script>' + 'A'.repeat(100),
            fechaRegistro: new Date().toISOString()
        });
        const result = await executeValidations(validacionesBitacoras.registrarBitacora, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar fecha muy antigua', async () => {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - 40);
        
        const req = createMockRequest({
            contenido: 'A'.repeat(100),
            fechaRegistro: fecha.toISOString()
        });
        const result = await executeValidations(validacionesBitacoras.registrarBitacora, req);
        expect(result.isEmpty()).toBe(false);
    });
});

describe('Validaciones de Bitácoras - Aprobar', () => {
    test('Debe validar aprobación de bitácora correcta', async () => {
        const req = createMockRequest(
            { comentariosInstructor: 'Muy bien' },
            { id: '123' }
        );
        const result = await executeValidations(validacionesBitacoras.aprobarBitacora, req);
        expect(result.isEmpty()).toBe(true);
    });

    test('Debe rechazar comentarios muy largos', async () => {
        const req = createMockRequest(
            { comentariosInstructor: 'A'.repeat(1500) },
            { id: '123' }
        );
        const result = await executeValidations(validacionesBitacoras.aprobarBitacora, req);
        expect(result.isEmpty()).toBe(false);
    });
});

describe('Validaciones de Documentos - Subir', () => {
    test('Debe validar subida de documento correcta', async () => {
        const req = createMockRequest({
            tipoDocumento: 'Bitácora 1',
            descripcion: 'Descripción del documento'
        });
        const result = await executeValidations(validacionesDocumentos.subirDocumento, req);
        expect(result.isEmpty()).toBe(true);
    });

    test('Debe aceptar todos los tipos de bitácoras', async () => {
        for (let i = 1; i <= 12; i++) {
            const req = createMockRequest({
                tipoDocumento: `Bitácora ${i}`
            });
            const result = await executeValidations(validacionesDocumentos.subirDocumento, req);
            expect(result.isEmpty()).toBe(true);
        }
    });

    test('Debe rechazar tipo de documento inválido', async () => {
        const req = createMockRequest({
            tipoDocumento: 'Documento Inválido'
        });
        const result = await executeValidations(validacionesDocumentos.subirDocumento, req);
        expect(result.isEmpty()).toBe(false);
    });

    test('Debe rechazar descripción muy larga', async () => {
        const req = createMockRequest({
            tipoDocumento: 'Bitácora 1',
            descripcion: 'A'.repeat(600)
        });
        const result = await executeValidations(validacionesDocumentos.subirDocumento, req);
        expect(result.isEmpty()).toBe(false);
    });
});
