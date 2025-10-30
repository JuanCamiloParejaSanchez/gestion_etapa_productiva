/**
 * Tests para esquemasValidacion.js
 * Verifica todos los esquemas de validación usando Joi
 */

const {
    aprendizSchemas,
    administradorSchemas,
    authSchemas,
    validarDatos
} = require('../../src/validaciones/esquemasValidacion');

describe('Función validarDatos', () => {
    test('Debe retornar válido para datos correctos', () => {
        const schema = authSchemas.login;
        const data = {
            email: 'test@example.com',
            password: 'Password123!@#$'
        };

        const resultado = validarDatos(data, schema);
        expect(resultado.valido).toBe(true);
        expect(resultado.errores).toHaveLength(0);
        expect(resultado.datos).toBeTruthy();
    });

    test('Debe retornar inválido y lista de errores para datos incorrectos', () => {
        const schema = authSchemas.login;
        const data = {
            email: 'correo-invalido',
            password: '123'
        };

        const resultado = validarDatos(data, schema);
        expect(resultado.valido).toBe(false);
        expect(resultado.errores.length).toBeGreaterThan(0);
        expect(resultado.datos).toBeNull();
    });

    test('Debe manejar errores internos gracefully', () => {
        const resultado = validarDatos(null, null);
        expect(resultado.valido).toBe(false);
        expect(resultado.errores).toHaveLength(1);
        expect(resultado.errores[0].campo).toBe('general');
    });
});

describe('Esquemas de Aprendiz - Registro', () => {
    const datosValidosRegistro = {
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

    test('Debe validar correctamente datos completos de registro', () => {
        const resultado = validarDatos(datosValidosRegistro, aprendizSchemas.registro);
        expect(resultado.valido).toBe(true);
        expect(resultado.errores).toHaveLength(0);
    });

    describe('Validación de tipo de documento', () => {
        test('Debe aceptar tipos de documento válidos', () => {
            const tiposValidos = ['CC', 'TI', 'CE', 'PAS'];
            
            tiposValidos.forEach(tipo => {
                const datos = { ...datosValidosRegistro, tipoDocumento: tipo };
                const resultado = validarDatos(datos, aprendizSchemas.registro);
                expect(resultado.valido).toBe(true);
            });
        });

        test('Debe rechazar tipos de documento inválidos', () => {
            const datos = { ...datosValidosRegistro, tipoDocumento: 'INVALIDO' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
            expect(resultado.errores.some(e => e.campo === 'tipoDocumento')).toBe(true);
        });

        test('Debe rechazar tipo de documento vacío', () => {
            const datos = { ...datosValidosRegistro };
            delete datos.tipoDocumento;
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });
    });

    describe('Validación de número de documento', () => {
        test('Debe aceptar número de documento válido', () => {
            const datos = { ...datosValidosRegistro, numeroDocumento: '1234567890' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(true);
        });

        test('Debe rechazar número de documento muy corto', () => {
            const datos = { ...datosValidosRegistro, numeroDocumento: '123' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });

        test('Debe rechazar número de documento muy largo', () => {
            const datos = { ...datosValidosRegistro, numeroDocumento: '123456789012345678901' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });

        test('Debe rechazar número de documento con caracteres especiales', () => {
            const datos = { ...datosValidosRegistro, numeroDocumento: '12345@#$' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });
    });

    describe('Validación de nombres', () => {
        test('Debe aceptar nombres válidos con tildes', () => {
            const datos = { ...datosValidosRegistro, nombres: 'José María' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(true);
        });

        test('Debe rechazar nombres con números', () => {
            const datos = { ...datosValidosRegistro, nombres: 'Juan123' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });

        test('Debe rechazar nombres muy cortos', () => {
            const datos = { ...datosValidosRegistro, nombres: 'A' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });

        test('Debe rechazar nombres muy largos', () => {
            const datos = { ...datosValidosRegistro, nombres: 'A'.repeat(101) };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });
    });

    describe('Validación de apellidos', () => {
        test('Debe aceptar primer apellido válido', () => {
            const datos = { ...datosValidosRegistro, primerApellido: 'García' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(true);
        });

        test('Debe aceptar segundo apellido vacío', () => {
            const datos = { ...datosValidosRegistro, segundoApellido: '' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(true);
        });

        test('Debe rechazar primer apellido con números', () => {
            const datos = { ...datosValidosRegistro, primerApellido: 'Pérez123' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });

        test('Debe rechazar primer apellido vacío', () => {
            const datos = { ...datosValidosRegistro };
            delete datos.primerApellido;
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });
    });

    describe('Validación de fecha de nacimiento', () => {
        test('Debe aceptar fecha de nacimiento válida', () => {
            const datos = { ...datosValidosRegistro, fechaNacimiento: '2000-05-15' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(true);
        });

        test('Debe rechazar fecha de nacimiento futura', () => {
            const futuro = new Date();
            futuro.setFullYear(futuro.getFullYear() + 1);
            const datos = { ...datosValidosRegistro, fechaNacimiento: futuro.toISOString().split('T')[0] };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });

        test('Debe rechazar fecha de nacimiento muy antigua', () => {
            const datos = { ...datosValidosRegistro, fechaNacimiento: '1900-01-01' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });

        test('Debe rechazar formato de fecha inválido', () => {
            const datos = { ...datosValidosRegistro, fechaNacimiento: '15/05/2000' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });
    });

    describe('Validación de teléfonos', () => {
        test('Debe aceptar celular válido', () => {
            const datos = { ...datosValidosRegistro, celular: '3001234567' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(true);
        });

        test('Debe rechazar celular muy corto', () => {
            const datos = { ...datosValidosRegistro, celular: '300123' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });

        test('Debe rechazar celular con letras', () => {
            const datos = { ...datosValidosRegistro, celular: '300ABC4567' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });

        test('Debe aceptar teléfono fijo opcional vacío', () => {
            const datos = { ...datosValidosRegistro, telefonoFijo: '' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(true);
        });
    });

    describe('Validación de correo electrónico', () => {
        test('Debe aceptar correo electrónico válido', () => {
            const datos = { ...datosValidosRegistro, correoElectronico: 'test@example.com' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(true);
        });

        test('Debe rechazar correo electrónico inválido', () => {
            const datos = { ...datosValidosRegistro, correoElectronico: 'correo-invalido' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });

        test('Debe rechazar correo electrónico sin @', () => {
            const datos = { ...datosValidosRegistro, correoElectronico: 'correoexample.com' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });

        test('Debe rechazar correo electrónico muy largo', () => {
            const datos = { ...datosValidosRegistro, correoElectronico: 'a'.repeat(90) + '@test.com' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });
    });

    describe('Validación de fechas de formación', () => {
        test('Debe aceptar fechas en orden cronológico correcto', () => {
            const resultado = validarDatos(datosValidosRegistro, aprendizSchemas.registro);
            expect(resultado.valido).toBe(true);
        });

        test('Debe rechazar fecha fin lectiva anterior a inicio lectiva', () => {
            const datos = {
                ...datosValidosRegistro,
                fechaInicioLectiva: '2023-06-30',
                fechaFinLectiva: '2023-01-15'
            };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });

        test('Debe rechazar fecha fin productiva anterior a inicio productiva', () => {
            const datos = {
                ...datosValidosRegistro,
                fechaInicioProductiva: '2023-12-31',
                fechaFinProductiva: '2023-07-01'
            };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });

        test('Debe aceptar fecha inicio productiva igual a fecha fin lectiva', () => {
            const datos = {
                ...datosValidosRegistro,
                fechaFinLectiva: '2023-06-30',
                fechaInicioProductiva: '2023-06-30'
            };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(true);
        });
    });

    describe('Validación de programa de formación', () => {
        test('Debe aceptar programas válidos', () => {
            const programasValidos = [
                'tecnoActividadFisica',
                'tecnoEntrenamientoDeportivo',
                'tecnoAnalisisDesarrollo',
                'tecProcesamientoPruebas',
                'tecProgramacion'
            ];

            programasValidos.forEach(programa => {
                const datos = { ...datosValidosRegistro, programaFormacion: programa };
                const resultado = validarDatos(datos, aprendizSchemas.registro);
                expect(resultado.valido).toBe(true);
            });
        });

        test('Debe rechazar programa inválido', () => {
            const datos = { ...datosValidosRegistro, programaFormacion: 'programaInvalido' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });
    });

    describe('Validación de alternativa de etapa productiva', () => {
        test('Debe aceptar alternativas válidas', () => {
            const alternativasValidas = [
                'contratoAprendizaje',
                'pasantia',
                'apoyoEntidades',
                'vinculoLaboral',
                'proyectosProductivos',
                'monitoria',
                'unidadesProductivas'
            ];

            alternativasValidas.forEach(alternativa => {
                const datos = { ...datosValidosRegistro, alternativaSeleccionada: alternativa };
                const resultado = validarDatos(datos, aprendizSchemas.registro);
                expect(resultado.valido).toBe(true);
            });
        });

        test('Debe rechazar alternativa inválida', () => {
            const datos = { ...datosValidosRegistro, alternativaSeleccionada: 'alternativaInvalida' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });
    });

    describe('Validación de número de ficha', () => {
        test('Debe aceptar número de ficha válido', () => {
            const datos = { ...datosValidosRegistro, numeroFicha: '2345678' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(true);
        });

        test('Debe rechazar número de ficha con letras', () => {
            const datos = { ...datosValidosRegistro, numeroFicha: '234ABC8' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });

        test('Debe rechazar número de ficha muy corto', () => {
            const datos = { ...datosValidosRegistro, numeroFicha: '123' };
            const resultado = validarDatos(datos, aprendizSchemas.registro);
            expect(resultado.valido).toBe(false);
        });
    });
});

describe('Esquemas de Aprendiz - Actualizar Perfil', () => {
    const datosValidosActualizacion = {
        celular: '3001234567',
        direccion: 'Calle 123 # 45-67',
        barrio: 'Centro',
        departamento: 'Cundinamarca',
        municipio: 'Bogotá'
    };

    test('Debe validar correctamente datos de actualización de perfil', () => {
        const resultado = validarDatos(datosValidosActualizacion, aprendizSchemas.actualizarPerfil);
        expect(resultado.valido).toBe(true);
    });

    test('Debe rechazar datos incompletos', () => {
        const datos = { celular: '3001234567' };
        const resultado = validarDatos(datos, aprendizSchemas.actualizarPerfil);
        expect(resultado.valido).toBe(false);
    });
});

describe('Esquemas de Aprendiz - Bitácora', () => {
    const datosValidosBitacora = {
        respuestaDesafio: 'A'.repeat(50),
        respuestaLogro: 'B'.repeat(50),
        respuestaComunicacion: 'C'.repeat(50)
    };

    test('Debe validar correctamente datos de bitácora', () => {
        const resultado = validarDatos(datosValidosBitacora, aprendizSchemas.bitacora);
        expect(resultado.valido).toBe(true);
    });

    test('Debe rechazar respuestas muy cortas', () => {
        const datos = {
            respuestaDesafio: 'Muy corto',
            respuestaLogro: 'También corto',
            respuestaComunicacion: 'Corto'
        };
        const resultado = validarDatos(datos, aprendizSchemas.bitacora);
        expect(resultado.valido).toBe(false);
    });

    test('Debe rechazar respuestas muy largas', () => {
        const datos = {
            respuestaDesafio: 'A'.repeat(2001),
            respuestaLogro: 'B'.repeat(2001),
            respuestaComunicacion: 'C'.repeat(2001)
        };
        const resultado = validarDatos(datos, aprendizSchemas.bitacora);
        expect(resultado.valido).toBe(false);
    });
});

describe('Esquemas de Administrador - Registro', () => {
    const datosValidosAdminRegistro = {
        nombreCompleto: 'María López García',
        correoInstitucional: 'maria.lopez@sena.edu.co',
        numeroIdentificacion: '1234567890',
        telefono: '6012345678',
        departamento: 'Cundinamarca',
        cargo: 'Instructor'
    };

    test('Debe validar correctamente datos de registro de administrador', () => {
        const resultado = validarDatos(datosValidosAdminRegistro, administradorSchemas.registro);
        expect(resultado.valido).toBe(true);
    });

    test('Debe rechazar correo que no sea del SENA', () => {
        const datos = { ...datosValidosAdminRegistro, correoInstitucional: 'test@gmail.com' };
        const resultado = validarDatos(datos, administradorSchemas.registro);
        expect(resultado.valido).toBe(false);
    });

    test('Debe rechazar nombre completo con números', () => {
        const datos = { ...datosValidosAdminRegistro, nombreCompleto: 'María123 López' };
        const resultado = validarDatos(datos, administradorSchemas.registro);
        expect(resultado.valido).toBe(false);
    });

    test('Debe rechazar nombre completo muy corto', () => {
        const datos = { ...datosValidosAdminRegistro, nombreCompleto: 'Juan' };
        const resultado = validarDatos(datos, administradorSchemas.registro);
        expect(resultado.valido).toBe(false);
    });
});

describe('Esquemas de Autenticación', () => {
    describe('Login', () => {
        test('Debe validar credenciales de login correctas', () => {
            const datos = {
                email: 'test@example.com',
                password: 'Password123!'
            };
            const resultado = validarDatos(datos, authSchemas.login);
            expect(resultado.valido).toBe(true);
        });

        test('Debe rechazar email inválido', () => {
            const datos = {
                email: 'email-invalido',
                password: 'Password123!'
            };
            const resultado = validarDatos(datos, authSchemas.login);
            expect(resultado.valido).toBe(false);
        });

        test('Debe rechazar contraseña muy corta', () => {
            const datos = {
                email: 'test@example.com',
                password: '12345'
            };
            const resultado = validarDatos(datos, authSchemas.login);
            expect(resultado.valido).toBe(false);
        });
    });

    describe('Reset Password', () => {
        test('Debe validar solicitud de reset de contraseña', () => {
            const datos = { email: 'test@example.com' };
            const resultado = validarDatos(datos, authSchemas.resetPassword);
            expect(resultado.valido).toBe(true);
        });

        test('Debe rechazar email inválido', () => {
            const datos = { email: 'invalido' };
            const resultado = validarDatos(datos, authSchemas.resetPassword);
            expect(resultado.valido).toBe(false);
        });
    });

    describe('Change Password', () => {
        test('Debe validar cambio de contraseña correcto', () => {
            const datos = {
                currentPassword: 'OldPassword123!',
                newPassword: 'NewPassword123!',
                confirmPassword: 'NewPassword123!'
            };
            const resultado = validarDatos(datos, authSchemas.changePassword);
            expect(resultado.valido).toBe(true);
        });

        test('Debe rechazar contraseña nueva débil', () => {
            const datos = {
                currentPassword: 'OldPassword123!',
                newPassword: 'weak',
                confirmPassword: 'weak'
            };
            const resultado = validarDatos(datos, authSchemas.changePassword);
            expect(resultado.valido).toBe(false);
        });

        test('Debe rechazar contraseñas que no coinciden', () => {
            const datos = {
                currentPassword: 'OldPassword123!',
                newPassword: 'NewPassword123!',
                confirmPassword: 'DifferentPassword123!'
            };
            const resultado = validarDatos(datos, authSchemas.changePassword);
            expect(resultado.valido).toBe(false);
        });

        test('Debe rechazar nueva contraseña sin mayúsculas', () => {
            const datos = {
                currentPassword: 'OldPassword123!',
                newPassword: 'newpassword123!',
                confirmPassword: 'newpassword123!'
            };
            const resultado = validarDatos(datos, authSchemas.changePassword);
            expect(resultado.valido).toBe(false);
        });

        test('Debe rechazar nueva contraseña sin minúsculas', () => {
            const datos = {
                currentPassword: 'OldPassword123!',
                newPassword: 'NEWPASSWORD123!',
                confirmPassword: 'NEWPASSWORD123!'
            };
            const resultado = validarDatos(datos, authSchemas.changePassword);
            expect(resultado.valido).toBe(false);
        });

        test('Debe rechazar nueva contraseña sin números', () => {
            const datos = {
                currentPassword: 'OldPassword123!',
                newPassword: 'NewPassword!',
                confirmPassword: 'NewPassword!'
            };
            const resultado = validarDatos(datos, authSchemas.changePassword);
            expect(resultado.valido).toBe(false);
        });

        test('Debe rechazar nueva contraseña sin caracteres especiales', () => {
            const datos = {
                currentPassword: 'OldPassword123!',
                newPassword: 'NewPassword123',
                confirmPassword: 'NewPassword123'
            };
            const resultado = validarDatos(datos, authSchemas.changePassword);
            expect(resultado.valido).toBe(false);
        });
    });
});
