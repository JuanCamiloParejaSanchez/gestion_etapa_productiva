const servicioRecuperacion = require('../../src/modulos/aprendiz/servicios/servicioRecuperacion');

// Mock del pool de base de datos
jest.mock('../../src/configuracion/baseDatos', () => ({
  pool: {
    query: jest.fn(),
    execute: jest.fn()
  }
}));

const { pool } = require('../../src/configuracion/baseDatos');

describe('ServicioRecuperacion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generarCodigo', () => {
    test('debe generar un código de 6 dígitos', () => {
      const codigo = servicioRecuperacion.generarCodigo();

      expect(codigo).toMatch(/^\d{6}$/);
      expect(codigo.length).toBe(6);
    });

    test('debe generar códigos diferentes en llamadas consecutivas', () => {
      const codigo1 = servicioRecuperacion.generarCodigo();
      const codigo2 = servicioRecuperacion.generarCodigo();

      // Es estadísticamente improbable que sean iguales
      expect(codigo1).not.toBe(codigo2);
    });

    test('debe generar código entre 100000 y 999999', () => {
      const codigo = servicioRecuperacion.generarCodigo();
      const codigoNum = parseInt(codigo);

      expect(codigoNum).toBeGreaterThanOrEqual(100000);
      expect(codigoNum).toBeLessThanOrEqual(999999);
    });
  });

  describe('guardarCodigo', () => {
    test('debe guardar código exitosamente', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      const email = 'usuario@example.com';
      const codigo = '123456';
      const expiracion = new Date();
      const role = 'aprendiz';

      const result = await servicioRecuperacion.guardarCodigo(email, codigo, expiracion, role);

      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO reset_tokens'),
        [email, codigo, expiracion, role]
      );
    });

    test('debe actualizar código si ya existe (ON DUPLICATE KEY)', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 2 }]); // 2 indica actualización

      const email = 'usuario@example.com';
      const codigo = '654321';
      const expiracion = new Date();
      const role = 'admin';

      const result = await servicioRecuperacion.guardarCodigo(email, codigo, expiracion, role);

      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalled();
    });

    test('debe lanzar error cuando falla la consulta', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(
        servicioRecuperacion.guardarCodigo('usuario@example.com', '123456', new Date(), 'aprendiz')
      ).rejects.toThrow('Error al procesar la solicitud');
    });

    test('debe manejar diferentes roles correctamente', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      await servicioRecuperacion.guardarCodigo('admin@example.com', '123456', new Date(), 'admin');
      await servicioRecuperacion.guardarCodigo('aprendiz@example.com', '654321', new Date(), 'aprendiz');

      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(pool.query.mock.calls[0][1][3]).toBe('admin');
      expect(pool.query.mock.calls[1][1][3]).toBe('aprendiz');
    });
  });

  describe('verificarCodigo', () => {
    test('debe verificar código válido exitosamente', async () => {
      const mockToken = {
        email: 'usuario@example.com',
        expiracion: new Date(Date.now() + 3600000),
        role: 'aprendiz'
      };

      pool.query.mockResolvedValue([[mockToken]]);

      const result = await servicioRecuperacion.verificarCodigo('usuario@example.com', '123456');

      expect(result).toEqual(mockToken);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE email = ?'),
        ['usuario@example.com', '123456']
      );
    });

    test('debe retornar null para código inválido', async () => {
      pool.query.mockResolvedValue([[]]);

      const result = await servicioRecuperacion.verificarCodigo('usuario@example.com', '999999');

      expect(result).toBeNull();
    });

    test('debe retornar null para código expirado', async () => {
      pool.query.mockResolvedValue([[]]); // La consulta filtra por expiracion > NOW()

      const result = await servicioRecuperacion.verificarCodigo('usuario@example.com', '123456');

      expect(result).toBeNull();
    });

    test('debe verificar que el código no haya sido usado', async () => {
      pool.query.mockResolvedValue([[]]);

      await servicioRecuperacion.verificarCodigo('usuario@example.com', '123456');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('usado = 0'),
        expect.any(Array)
      );
    });

    test('debe lanzar error cuando falla la consulta', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(
        servicioRecuperacion.verificarCodigo('usuario@example.com', '123456')
      ).rejects.toThrow('Error al verificar el código');
    });
  });

  describe('marcarCodigoUsado', () => {
    test('debe marcar código como usado exitosamente', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await servicioRecuperacion.marcarCodigoUsado('usuario@example.com', '123456');

      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE reset_tokens'),
        ['usuario@example.com', '123456']
      );
    });

    test('debe actualizar el campo usado a 1', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      await servicioRecuperacion.marcarCodigoUsado('usuario@example.com', '123456');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SET usado = 1'),
        expect.any(Array)
      );
    });

    test('debe lanzar error cuando falla la actualización', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(
        servicioRecuperacion.marcarCodigoUsado('usuario@example.com', '123456')
      ).rejects.toThrow('Error al marcar el código como usado');
    });
  });

  describe('Métodos legacy (compatibilidad)', () => {
    describe('guardarToken', () => {
      test('debe funcionar como alias de guardarCodigo', async () => {
        pool.query.mockResolvedValue([{ affectedRows: 1 }]);

        const result = await servicioRecuperacion.guardarToken(
          'usuario@example.com',
          'token123',
          new Date()
        );

        expect(result).toBe(true);
        expect(pool.query).toHaveBeenCalled();
      });
    });

    describe('verificarToken', () => {
      test('debe verificar token por el token mismo', async () => {
        const mockToken = {
          email: 'usuario@example.com',
          expiracion: new Date(Date.now() + 3600000)
        };

        pool.query.mockResolvedValue([[mockToken]]);

        const result = await servicioRecuperacion.verificarToken('token123');

        expect(result).toEqual(mockToken);
        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining('WHERE token = ?'),
          ['token123']
        );
      });

      test('debe retornar null para token inválido', async () => {
        pool.query.mockResolvedValue([[]]);

        const result = await servicioRecuperacion.verificarToken('invalidtoken');

        expect(result).toBeNull();
      });

      test('debe lanzar error cuando falla la consulta', async () => {
        pool.query.mockRejectedValue(new Error('Database error'));

        await expect(
          servicioRecuperacion.verificarToken('token123')
        ).rejects.toThrow('Error al verificar el token');
      });
    });

    describe('invalidarToken', () => {
      test('debe invalidar token exitosamente', async () => {
        pool.query.mockResolvedValue([{ affectedRows: 1 }]);

        const result = await servicioRecuperacion.invalidarToken('token123');

        expect(result).toBe(true);
        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE reset_tokens'),
          ['token123']
        );
      });

      test('debe lanzar error cuando falla la invalidación', async () => {
        pool.query.mockRejectedValue(new Error('Database error'));

        await expect(
          servicioRecuperacion.invalidarToken('token123')
        ).rejects.toThrow('Error al invalidar el token');
      });
    });
  });

  describe('Flujo completo de recuperación', () => {
    test('debe completar flujo de recuperación correctamente', async () => {
      // 1. Generar código
      const codigo = servicioRecuperacion.generarCodigo();
      expect(codigo).toMatch(/^\d{6}$/);

      // 2. Guardar código
      pool.query.mockResolvedValue([{ affectedRows: 1 }]);
      const guardado = await servicioRecuperacion.guardarCodigo(
        'usuario@example.com',
        codigo,
        new Date(Date.now() + 600000), // 10 minutos
        'aprendiz'
      );
      expect(guardado).toBe(true);

      // 3. Verificar código
      pool.query.mockResolvedValue([[{
        email: 'usuario@example.com',
        expiracion: new Date(Date.now() + 600000),
        role: 'aprendiz'
      }]]);
      const verificado = await servicioRecuperacion.verificarCodigo('usuario@example.com', codigo);
      expect(verificado).toBeDefined();
      expect(verificado.email).toBe('usuario@example.com');

      // 4. Marcar como usado
      pool.query.mockResolvedValue([{ affectedRows: 1 }]);
      const marcado = await servicioRecuperacion.marcarCodigoUsado('usuario@example.com', codigo);
      expect(marcado).toBe(true);
    });
  });
});
