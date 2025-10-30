// Tests para generación y validación de tokens
// Ruta: tests/autenticacion/tokens.test.js

const servicioRecuperacion = require('../../src/modulos/aprendiz/servicios/servicioRecuperacion');
const { pool } = require('../../src/configuracion/baseDatos');

// Mock de la base de datos
jest.mock('../../src/configuracion/baseDatos', () => ({
    pool: {
        query: jest.fn()
    }
}));

describe('Tests de Generación y Validación de Tokens', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generarCodigo - Generación de códigos de verificación', () => {
        test('Debe generar un código de 6 dígitos', () => {
            const codigo = servicioRecuperacion.generarCodigo();
            
            expect(codigo).toBeDefined();
            expect(typeof codigo).toBe('string');
            expect(codigo).toHaveLength(6);
        });

        test('Debe generar códigos numéricos válidos', () => {
            const codigo = servicioRecuperacion.generarCodigo();
            
            expect(/^\d{6}$/.test(codigo)).toBe(true);
            expect(parseInt(codigo)).toBeGreaterThanOrEqual(100000);
            expect(parseInt(codigo)).toBeLessThanOrEqual(999999);
        });

        test('Debe generar códigos únicos (probabilísticamente)', () => {
            const codigos = new Set();
            const cantidadCodigos = 100;
            
            for (let i = 0; i < cantidadCodigos; i++) {
                const codigo = servicioRecuperacion.generarCodigo();
                codigos.add(codigo);
            }
            
            // Al menos el 90% debe ser único (con 100 códigos de 900,000 posibles)
            expect(codigos.size).toBeGreaterThanOrEqual(cantidadCodigos * 0.9);
        });

        test('Códigos generados deben estar en el rango correcto', () => {
            for (let i = 0; i < 50; i++) {
                const codigo = servicioRecuperacion.generarCodigo();
                const numero = parseInt(codigo);
                
                expect(numero).toBeGreaterThanOrEqual(100000);
                expect(numero).toBeLessThan(1000000);
            }
        });
    });

    describe('guardarCodigo - Almacenamiento de códigos', () => {
        test('Debe guardar código correctamente en la base de datos', async () => {
            const email = 'test@example.com';
            const codigo = '123456';
            const expiracion = new Date(Date.now() + 600000);
            const role = 'aprendiz';

            pool.query.mockResolvedValue([{ affectedRows: 1 }]);

            const resultado = await servicioRecuperacion.guardarCodigo(email, codigo, expiracion, role);

            expect(resultado).toBe(true);
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO reset_tokens'),
                [email, codigo, expiracion, role]
            );
        });

        test('Debe actualizar código existente (ON DUPLICATE KEY UPDATE)', async () => {
            const email = 'test@example.com';
            const codigo = '654321';
            const expiracion = new Date(Date.now() + 600000);
            const role = 'admin';

            pool.query.mockResolvedValue([{ affectedRows: 2 }]); // 2 indica update

            const resultado = await servicioRecuperacion.guardarCodigo(email, codigo, expiracion, role);

            expect(resultado).toBe(true);
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('ON DUPLICATE KEY UPDATE'),
                expect.any(Array)
            );
        });

        test('Debe manejar error de base de datos al guardar', async () => {
            const email = 'test@example.com';
            const codigo = '123456';
            const expiracion = new Date();
            const role = 'aprendiz';

            pool.query.mockRejectedValue(new Error('Error de BD'));

            await expect(
                servicioRecuperacion.guardarCodigo(email, codigo, expiracion, role)
            ).rejects.toThrow('Error al procesar la solicitud');
        });

        test('Debe resetear el flag "usado" al guardar nuevo código', async () => {
            const email = 'test@example.com';
            const codigo = '999999';
            const expiracion = new Date(Date.now() + 600000);
            const role = 'aprendiz';

            pool.query.mockResolvedValue([{ affectedRows: 1 }]);

            await servicioRecuperacion.guardarCodigo(email, codigo, expiracion, role);

            const query = pool.query.mock.calls[0][0];
            expect(query).toContain('usado = 0');
        });
    });

    describe('verificarCodigo - Validación de códigos', () => {
        test('Debe verificar código válido correctamente', async () => {
            const email = 'test@example.com';
            const codigo = '123456';
            const mockResult = [{
                email: email,
                expiracion: new Date(Date.now() + 600000),
                role: 'aprendiz'
            }];

            pool.query.mockResolvedValue([mockResult]);

            const resultado = await servicioRecuperacion.verificarCodigo(email, codigo);

            expect(resultado).toEqual(mockResult[0]);
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT email, expiracion, role'),
                [email, codigo]
            );
        });

        test('Debe retornar null para código inexistente', async () => {
            const email = 'test@example.com';
            const codigo = '000000';

            pool.query.mockResolvedValue([[]]);

            const resultado = await servicioRecuperacion.verificarCodigo(email, codigo);

            expect(resultado).toBeNull();
        });

        test('Debe verificar que el código no esté expirado (expiracion > NOW())', async () => {
            const email = 'test@example.com';
            const codigo = '123456';

            pool.query.mockResolvedValue([[]]);

            await servicioRecuperacion.verificarCodigo(email, codigo);

            const query = pool.query.mock.calls[0][0];
            expect(query).toContain('expiracion > NOW()');
        });

        test('Debe verificar que el código no haya sido usado', async () => {
            const email = 'test@example.com';
            const codigo = '123456';

            pool.query.mockResolvedValue([[]]);

            await servicioRecuperacion.verificarCodigo(email, codigo);

            const query = pool.query.mock.calls[0][0];
            expect(query).toContain('usado = 0');
        });

        test('Debe retornar información del rol del usuario', async () => {
            const email = 'admin@sena.edu.co';
            const codigo = '789012';
            const mockResult = [{
                email: email,
                expiracion: new Date(Date.now() + 600000),
                role: 'admin'
            }];

            pool.query.mockResolvedValue([mockResult]);

            const resultado = await servicioRecuperacion.verificarCodigo(email, codigo);

            expect(resultado.role).toBe('admin');
        });

        test('Debe manejar error de base de datos al verificar', async () => {
            const email = 'test@example.com';
            const codigo = '123456';

            pool.query.mockRejectedValue(new Error('Error de conexión'));

            await expect(
                servicioRecuperacion.verificarCodigo(email, codigo)
            ).rejects.toThrow('Error al verificar el código');
        });
    });

    describe('marcarCodigoUsado - Invalidación de códigos', () => {
        test('Debe marcar código como usado correctamente', async () => {
            const email = 'test@example.com';
            const codigo = '123456';

            pool.query.mockResolvedValue([{ affectedRows: 1 }]);

            const resultado = await servicioRecuperacion.marcarCodigoUsado(email, codigo);

            expect(resultado).toBe(true);
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE reset_tokens'),
                [email, codigo]
            );
        });

        test('Debe establecer usado = 1 al marcar', async () => {
            const email = 'test@example.com';
            const codigo = '123456';

            pool.query.mockResolvedValue([{ affectedRows: 1 }]);

            await servicioRecuperacion.marcarCodigoUsado(email, codigo);

            const query = pool.query.mock.calls[0][0];
            expect(query).toContain('usado = 1');
        });

        test('Debe manejar error de base de datos al marcar usado', async () => {
            const email = 'test@example.com';
            const codigo = '123456';

            pool.query.mockRejectedValue(new Error('Error de BD'));

            await expect(
                servicioRecuperacion.marcarCodigoUsado(email, codigo)
            ).rejects.toThrow('Error al marcar el código como usado');
        });
    });

    describe('verificarToken - Verificación de tokens (método legacy)', () => {
        test('Debe verificar token válido', async () => {
            const token = 'abc123def456';
            const mockResult = [{
                email: 'test@example.com',
                expiracion: new Date(Date.now() + 600000)
            }];

            pool.query.mockResolvedValue([mockResult]);

            const resultado = await servicioRecuperacion.verificarToken(token);

            expect(resultado).toEqual(mockResult[0]);
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE token = ?'),
                [token]
            );
        });

        test('Debe retornar null para token inválido', async () => {
            const token = 'tokeninvalido';

            pool.query.mockResolvedValue([[]]);

            const resultado = await servicioRecuperacion.verificarToken(token);

            expect(resultado).toBeNull();
        });

        test('Debe verificar que token no esté expirado', async () => {
            const token = 'abc123';

            pool.query.mockResolvedValue([[]]);

            await servicioRecuperacion.verificarToken(token);

            const query = pool.query.mock.calls[0][0];
            expect(query).toContain('expiracion > NOW()');
        });

        test('Debe verificar que token no haya sido usado', async () => {
            const token = 'abc123';

            pool.query.mockResolvedValue([[]]);

            await servicioRecuperacion.verificarToken(token);

            const query = pool.query.mock.calls[0][0];
            expect(query).toContain('usado = 0');
        });
    });

    describe('invalidarToken - Invalidación de tokens (método legacy)', () => {
        test('Debe invalidar token correctamente', async () => {
            const token = 'abc123def456';

            pool.query.mockResolvedValue([{ affectedRows: 1 }]);

            const resultado = await servicioRecuperacion.invalidarToken(token);

            expect(resultado).toBe(true);
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE reset_tokens'),
                [token]
            );
        });

        test('Debe establecer usado = 1 al invalidar', async () => {
            const token = 'abc123';

            pool.query.mockResolvedValue([{ affectedRows: 1 }]);

            await servicioRecuperacion.invalidarToken(token);

            const query = pool.query.mock.calls[0][0];
            expect(query).toContain('usado = 1');
        });

        test('Debe manejar error al invalidar token', async () => {
            const token = 'abc123';

            pool.query.mockRejectedValue(new Error('Error de BD'));

            await expect(
                servicioRecuperacion.invalidarToken(token)
            ).rejects.toThrow('Error al invalidar el token');
        });
    });

    describe('Escenarios de seguridad', () => {
        test('Código expirado no debe ser validado', async () => {
            const email = 'test@example.com';
            const codigo = '123456';

            // Simular que no se encuentran resultados (expirado)
            pool.query.mockResolvedValue([[]]);

            const resultado = await servicioRecuperacion.verificarCodigo(email, codigo);

            expect(resultado).toBeNull();
        });

        test('Código usado no debe ser reutilizable', async () => {
            const email = 'test@example.com';
            const codigo = '123456';

            // Primera verificación - válido
            pool.query.mockResolvedValueOnce([[{
                email: email,
                expiracion: new Date(Date.now() + 600000),
                role: 'aprendiz'
            }]]);

            const primerUso = await servicioRecuperacion.verificarCodigo(email, codigo);
            expect(primerUso).not.toBeNull();

            // Marcar como usado
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
            await servicioRecuperacion.marcarCodigoUsado(email, codigo);

            // Segunda verificación - debe retornar null
            pool.query.mockResolvedValueOnce([[]]);
            const segundoUso = await servicioRecuperacion.verificarCodigo(email, codigo);
            expect(segundoUso).toBeNull();
        });

        test('No debe permitir códigos para emails diferentes', async () => {
            const emailCorrecto = 'correcto@test.com';
            const emailIncorrecto = 'incorrecto@test.com';
            const codigo = '123456';

            pool.query.mockResolvedValue([[]]);

            const resultado = await servicioRecuperacion.verificarCodigo(emailIncorrecto, codigo);

            expect(resultado).toBeNull();
        });

        test('Debe prevenir inyección SQL en verificación de código', async () => {
            const email = "test@example.com' OR '1'='1";
            const codigo = "123456' OR '1'='1";

            pool.query.mockResolvedValue([[]]);

            await servicioRecuperacion.verificarCodigo(email, codigo);

            // Verificar que se usaron parámetros preparados
            expect(pool.query).toHaveBeenCalledWith(
                expect.any(String),
                [email, codigo] // Parámetros separados
            );
        });
    });

    describe('Flujo completo de recuperación de contraseña', () => {
        test('Flujo exitoso: generar -> guardar -> verificar -> marcar usado', async () => {
            const email = 'test@example.com';
            const expiracion = new Date(Date.now() + 600000);
            const role = 'aprendiz';

            // 1. Generar código
            const codigo = servicioRecuperacion.generarCodigo();
            expect(codigo).toMatch(/^\d{6}$/);

            // 2. Guardar código
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
            const guardado = await servicioRecuperacion.guardarCodigo(email, codigo, expiracion, role);
            expect(guardado).toBe(true);

            // 3. Verificar código
            pool.query.mockResolvedValueOnce([[{
                email: email,
                expiracion: expiracion,
                role: role
            }]]);
            const verificado = await servicioRecuperacion.verificarCodigo(email, codigo);
            expect(verificado).not.toBeNull();
            expect(verificado.email).toBe(email);

            // 4. Marcar como usado
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
            const marcado = await servicioRecuperacion.marcarCodigoUsado(email, codigo);
            expect(marcado).toBe(true);

            // 5. Verificar que ya no es válido
            pool.query.mockResolvedValueOnce([[]]);
            const noDisponible = await servicioRecuperacion.verificarCodigo(email, codigo);
            expect(noDisponible).toBeNull();
        });

        test('Múltiples códigos para diferentes usuarios deben ser independientes', async () => {
            const email1 = 'user1@test.com';
            const email2 = 'user2@test.com';
            const codigo1 = '111111';
            const codigo2 = '222222';
            const expiracion = new Date(Date.now() + 600000);

            // Guardar código para usuario 1
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
            await servicioRecuperacion.guardarCodigo(email1, codigo1, expiracion, 'aprendiz');

            // Guardar código para usuario 2
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
            await servicioRecuperacion.guardarCodigo(email2, codigo2, expiracion, 'admin');

            // Verificar que cada código pertenece a su usuario
            expect(pool.query).toHaveBeenCalledWith(
                expect.any(String),
                [email1, codigo1, expiracion, 'aprendiz']
            );
            expect(pool.query).toHaveBeenCalledWith(
                expect.any(String),
                [email2, codigo2, expiracion, 'admin']
            );
        });
    });

    describe('Compatibilidad con métodos legacy', () => {
        test('guardarToken debe llamar a guardarCodigo', async () => {
            const email = 'test@example.com';
            const token = '123456';
            const expiracion = new Date(Date.now() + 600000);

            pool.query.mockResolvedValue([{ affectedRows: 1 }]);

            const resultado = await servicioRecuperacion.guardarToken(email, token, expiracion);

            expect(resultado).toBe(true);
            expect(pool.query).toHaveBeenCalled();
        });
    });
});
