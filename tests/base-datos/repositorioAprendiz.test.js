/**
 * Tests para RepositorioAprendiz
 * Verifica las operaciones CRUD del repositorio de aprendices
 */

const repositorioAprendiz = require('../../src/modulos/compartido/repositorios/repositorioAprendiz');

// Mock del pool de base de datos
jest.mock('../../src/configuracion/baseDatos', () => ({
  pool: {
    query: jest.fn(),
    execute: jest.fn()
  }
}));

const { pool } = require('../../src/configuracion/baseDatos');

describe('RepositorioAprendiz - Operaciones CRUD', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buscarPorId', () => {
    test('debe retornar un aprendiz cuando existe', async () => {
      const mockAprendiz = {
        id: 1,
        nombres: 'JUAN',
        primerApellido: 'PÉREZ',
        segundoApellido: 'GÓMEZ',
        correoElectronico: 'juan.perez@example.com',
        numeroDocumento: '1234567890'
      };

      pool.query.mockResolvedValue([[mockAprendiz]]);

      const resultado = await repositorioAprendiz.buscarPorId(1);

      expect(resultado).toEqual(mockAprendiz);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM aprendices WHERE id = ?',
        [1]
      );
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    test('debe retornar null cuando no existe el aprendiz', async () => {
      pool.query.mockResolvedValue([[]]);

      const resultado = await repositorioAprendiz.buscarPorId(999);

      expect(resultado).toBeNull();
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM aprendices WHERE id = ?',
        [999]
      );
    });

    test('debe manejar errores de base de datos', async () => {
      const errorDB = new Error('Error de conexión a la base de datos');
      pool.query.mockRejectedValue(errorDB);

      await expect(repositorioAprendiz.buscarPorId(1)).rejects.toThrow('Error de conexión a la base de datos');
    });

    test('debe aceptar id como string y convertirlo', async () => {
      pool.query.mockResolvedValue([[]]);

      await repositorioAprendiz.buscarPorId('123');

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM aprendices WHERE id = ?',
        ['123']
      );
    });
  });

  describe('buscarPorEmail', () => {
    test('debe retornar un aprendiz cuando el email existe', async () => {
      const mockAprendiz = {
        id: 1,
        nombres: 'MARÍA',
        correoElectronico: 'maria@example.com'
      };

      pool.query.mockResolvedValue([[mockAprendiz]]);

      const resultado = await repositorioAprendiz.buscarPorEmail('maria@example.com');

      expect(resultado).toEqual(mockAprendiz);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM aprendices WHERE correoElectronico = ?',
        ['maria@example.com']
      );
    });

    test('debe retornar null cuando el email no existe', async () => {
      pool.query.mockResolvedValue([[]]);

      const resultado = await repositorioAprendiz.buscarPorEmail('noexiste@example.com');

      expect(resultado).toBeNull();
    });

    test('debe ser case-sensitive con los emails', async () => {
      pool.query.mockResolvedValue([[]]);

      await repositorioAprendiz.buscarPorEmail('MARIA@EXAMPLE.COM');

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM aprendices WHERE correoElectronico = ?',
        ['MARIA@EXAMPLE.COM']
      );
    });

    test('debe manejar emails con caracteres especiales', async () => {
      pool.query.mockResolvedValue([[]]);

      await repositorioAprendiz.buscarPorEmail('juan.pérez+test@example.com');

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM aprendices WHERE correoElectronico = ?',
        ['juan.pérez+test@example.com']
      );
    });
  });

  describe('buscarPorNumeroDocumento', () => {
    test('debe retornar un aprendiz cuando el documento existe', async () => {
      const mockAprendiz = {
        id: 1,
        numeroDocumento: '1234567890',
        nombres: 'CARLOS'
      };

      pool.query.mockResolvedValue([[mockAprendiz]]);

      const resultado = await repositorioAprendiz.buscarPorNumeroDocumento('1234567890');

      expect(resultado).toEqual(mockAprendiz);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM aprendices WHERE numeroDocumento = ?',
        ['1234567890']
      );
    });

    test('debe retornar null cuando el documento no existe', async () => {
      pool.query.mockResolvedValue([[]]);

      const resultado = await repositorioAprendiz.buscarPorNumeroDocumento('9999999999');

      expect(resultado).toBeNull();
    });

    test('debe buscar documentos numéricos', async () => {
      pool.query.mockResolvedValue([[]]);

      await repositorioAprendiz.buscarPorNumeroDocumento(1234567890);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM aprendices WHERE numeroDocumento = ?',
        [1234567890]
      );
    });
  });

  describe('insertar', () => {
    test('debe insertar un nuevo aprendiz y retornar el ID', async () => {
      const nuevoAprendiz = {
        tipoDocumento: 'CC',
        numeroDocumento: '1234567890',
        nombres: 'JUAN',
        primerApellido: 'PÉREZ',
        segundoApellido: 'GÓMEZ',
        correoElectronico: 'juan@example.com',
        celular: '3001234567'
      };

      pool.query.mockResolvedValue([{ insertId: 10 }]);

      const resultado = await repositorioAprendiz.insertar(nuevoAprendiz);

      expect(resultado).toEqual({ id: 10 });
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO aprendices SET ?',
        [nuevoAprendiz]
      );
    });

    test('debe manejar inserción con campos mínimos', async () => {
      const aprendizMinimo = {
        nombres: 'PEDRO',
        correoElectronico: 'pedro@example.com'
      };

      pool.query.mockResolvedValue([{ insertId: 11 }]);

      const resultado = await repositorioAprendiz.insertar(aprendizMinimo);

      expect(resultado.id).toBe(11);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO aprendices SET ?',
        [aprendizMinimo]
      );
    });

    test('debe retornar insertId incluso si es 0', async () => {
      const aprendiz = { nombres: 'TEST' };
      pool.query.mockResolvedValue([{ insertId: 0 }]);

      const resultado = await repositorioAprendiz.insertar(aprendiz);

      expect(resultado).toEqual({ id: 0 });
    });

    test('debe manejar errores de duplicación', async () => {
      const aprendiz = {
        correoElectronico: 'duplicado@example.com'
      };

      const errorDuplicado = new Error('Duplicate entry');
      errorDuplicado.code = 'ER_DUP_ENTRY';
      pool.query.mockRejectedValue(errorDuplicado);

      await expect(repositorioAprendiz.insertar(aprendiz)).rejects.toThrow('Duplicate entry');
    });

    test('debe insertar campos con valores null', async () => {
      const aprendiz = {
        nombres: 'JUAN',
        segundoApellido: null,
        telefonoFijo: null
      };

      pool.query.mockResolvedValue([{ insertId: 12 }]);

      const resultado = await repositorioAprendiz.insertar(aprendiz);

      expect(resultado.id).toBe(12);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO aprendices SET ?',
        [aprendiz]
      );
    });
  });

  describe('actualizar', () => {
    test('debe actualizar campos de un aprendiz existente', async () => {
      const datosActualizados = {
        nombres: 'JUAN CARLOS',
        celular: '3009876543'
      };

      pool.query.mockResolvedValue([{ affectedRows: 1, changedRows: 1 }]);

      const resultado = await repositorioAprendiz.actualizar(1, datosActualizados);

      expect(resultado.affectedRows).toBe(1);
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE aprendices SET nombres = ?, celular = ? WHERE id = ?',
        ['JUAN CARLOS', '3009876543', 1]
      );
    });

    test('debe actualizar un solo campo', async () => {
      const datosActualizados = {
        celular: '3001234567'
      };

      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      await repositorioAprendiz.actualizar(5, datosActualizados);

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE aprendices SET celular = ? WHERE id = ?',
        ['3001234567', 5]
      );
    });

    test('debe actualizar múltiples campos', async () => {
      const datosActualizados = {
        nombres: 'MARÍA FERNANDA',
        primerApellido: 'LÓPEZ',
        segundoApellido: 'MARTÍNEZ',
        celular: '3112345678'
      };

      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      await repositorioAprendiz.actualizar(2, datosActualizados);

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE aprendices SET nombres = ?, primerApellido = ?, segundoApellido = ?, celular = ? WHERE id = ?',
        ['MARÍA FERNANDA', 'LÓPEZ', 'MARTÍNEZ', '3112345678', 2]
      );
    });

    test('debe retornar affectedRows 0 cuando el ID no existe', async () => {
      const datosActualizados = { nombres: 'PEDRO' };
      pool.query.mockResolvedValue([{ affectedRows: 0 }]);

      const resultado = await repositorioAprendiz.actualizar(999, datosActualizados);

      expect(resultado.affectedRows).toBe(0);
    });

    test('debe actualizar campos con valores null', async () => {
      const datosActualizados = {
        segundoApellido: null,
        telefonoFijo: null
      };

      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      await repositorioAprendiz.actualizar(1, datosActualizados);

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE aprendices SET segundoApellido = ?, telefonoFijo = ? WHERE id = ?',
        [null, null, 1]
      );
    });

    test('debe preservar el orden de los parámetros', async () => {
      const datosActualizados = {
        campo1: 'valor1',
        campo2: 'valor2',
        campo3: 'valor3'
      };

      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      await repositorioAprendiz.actualizar(10, datosActualizados);

      const llamada = pool.query.mock.calls[0];
      expect(llamada[1]).toEqual(['valor1', 'valor2', 'valor3', 10]);
    });
  });

  describe('actualizarPassword', () => {
    test('debe actualizar la contraseña de un aprendiz', async () => {
      const email = 'juan@example.com';
      const hashedPassword = '$2b$10$hashedPasswordExample';

      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      const resultado = await repositorioAprendiz.actualizarPassword(email, hashedPassword);

      expect(resultado.affectedRows).toBe(1);
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE aprendices SET password = ? WHERE correoElectronico = ?',
        [hashedPassword, email]
      );
    });

    test('debe retornar affectedRows 0 cuando el email no existe', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 0 }]);

      const resultado = await repositorioAprendiz.actualizarPassword(
        'noexiste@example.com',
        'hashedPass'
      );

      expect(resultado.affectedRows).toBe(0);
    });

    test('debe aceptar contraseñas hasheadas largas', async () => {
      const passwordLarga = '$2b$10$' + 'a'.repeat(100);
      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      await repositorioAprendiz.actualizarPassword('user@example.com', passwordLarga);

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE aprendices SET password = ? WHERE correoElectronico = ?',
        [passwordLarga, 'user@example.com']
      );
    });
  });

  describe('eliminar', () => {
    test('debe eliminar un aprendiz existente', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      const resultado = await repositorioAprendiz.eliminar(1);

      expect(resultado.affectedRows).toBe(1);
      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM aprendices WHERE id = ?',
        [1]
      );
    });

    test('debe retornar affectedRows 0 cuando el ID no existe', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 0 }]);

      const resultado = await repositorioAprendiz.eliminar(999);

      expect(resultado.affectedRows).toBe(0);
    });

    test('debe manejar errores de restricciones de clave foránea', async () => {
      const errorFK = new Error('Cannot delete or update a parent row');
      errorFK.code = 'ER_ROW_IS_REFERENCED_2';
      pool.query.mockRejectedValue(errorFK);

      await expect(repositorioAprendiz.eliminar(1)).rejects.toThrow();
    });

    test('debe permitir eliminar múltiples registros en secuencia', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      await repositorioAprendiz.eliminar(1);
      await repositorioAprendiz.eliminar(2);
      await repositorioAprendiz.eliminar(3);

      expect(pool.query).toHaveBeenCalledTimes(3);
    });
  });

  describe('contarTodos', () => {
    test('debe retornar el total de aprendices', async () => {
      pool.query.mockResolvedValue([[{ total: 150 }]]);

      const total = await repositorioAprendiz.contarTodos();

      expect(total).toBe(150);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as total FROM aprendices'
      );
    });

    test('debe retornar 0 cuando no hay aprendices', async () => {
      pool.query.mockResolvedValue([[{ total: 0 }]]);

      const total = await repositorioAprendiz.contarTodos();

      expect(total).toBe(0);
    });

    test('debe retornar número como tipo numérico', async () => {
      pool.query.mockResolvedValue([[{ total: 42 }]]);

      const total = await repositorioAprendiz.contarTodos();

      expect(typeof total).toBe('number');
      expect(total).toBe(42);
    });
  });

  describe('obtenerTodosConFiltros', () => {
    test('debe obtener todos los aprendices sin filtros', async () => {
      const mockAprendices = [
        { id: 1, nombres: 'JUAN' },
        { id: 2, nombres: 'MARÍA' }
      ];

      pool.query.mockResolvedValue([mockAprendices]);

      const resultado = await repositorioAprendiz.obtenerTodosConFiltros({}, null, null, null);

      expect(resultado).toEqual(mockAprendices);
      expect(resultado.length).toBe(2);
    });

    test('debe filtrar por nombre', async () => {
      const mockAprendices = [{ id: 1, nombres: 'JUAN', primerApellido: 'PÉREZ' }];
      pool.query.mockResolvedValue([mockAprendices]);

      await repositorioAprendiz.obtenerTodosConFiltros(
        { nombre: 'Juan' },
        null,
        null,
        null
      );

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('AND (nombres LIKE ? OR primerApellido LIKE ? OR segundoApellido LIKE ?)'),
        expect.arrayContaining(['%Juan%', '%Juan%', '%Juan%'])
      );
    });

    test('debe filtrar por documento', async () => {
      pool.query.mockResolvedValue([[]]);

      await repositorioAprendiz.obtenerTodosConFiltros(
        { documento: '123456' },
        null,
        null,
        null
      );

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('AND numeroDocumento LIKE ?'),
        expect.arrayContaining(['%123456%'])
      );
    });

    test('debe filtrar por programa de formación', async () => {
      pool.query.mockResolvedValue([[]]);

      await repositorioAprendiz.obtenerTodosConFiltros(
        { programaFormacion: 'ADSI' },
        null,
        null,
        null
      );

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('AND programaFormacion = ?'),
        expect.arrayContaining(['ADSI'])
      );
    });

    test('debe filtrar por alternativa seleccionada', async () => {
      pool.query.mockResolvedValue([[]]);

      await repositorioAprendiz.obtenerTodosConFiltros(
        { alternativaSeleccionada: 'Contrato de Aprendizaje' },
        null,
        null,
        null
      );

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('AND alternativaSeleccionada = ?'),
        expect.arrayContaining(['Contrato de Aprendizaje'])
      );
    });

    test('debe aplicar múltiples filtros simultáneamente', async () => {
      pool.query.mockResolvedValue([[]]);

      await repositorioAprendiz.obtenerTodosConFiltros(
        {
          nombre: 'Juan',
          documento: '123',
          programaFormacion: 'ADSI'
        },
        null,
        null,
        null
      );

      const llamada = pool.query.mock.calls[0];
      expect(llamada[0]).toContain('nombres LIKE ?');
      expect(llamada[0]).toContain('numeroDocumento LIKE ?');
      expect(llamada[0]).toContain('programaFormacion = ?');
      expect(llamada[1]).toContain('%Juan%');
      expect(llamada[1]).toContain('%123%');
      expect(llamada[1]).toContain('ADSI');
    });

    test('debe aplicar orden', async () => {
      pool.query.mockResolvedValue([[]]);

      await repositorioAprendiz.obtenerTodosConFiltros(
        {},
        'nombres ASC',
        null,
        null
      );

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY nombres ASC'),
        expect.any(Array)
      );
    });

    test('debe aplicar límite', async () => {
      pool.query.mockResolvedValue([[]]);

      await repositorioAprendiz.obtenerTodosConFiltros(
        {},
        null,
        10,
        null
      );

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ?'),
        expect.arrayContaining([10])
      );
    });

    test('debe aplicar offset', async () => {
      pool.query.mockResolvedValue([[]]);

      await repositorioAprendiz.obtenerTodosConFiltros(
        {},
        null,
        10,
        20
      );

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('OFFSET ?'),
        expect.arrayContaining([10, 20])
      );
    });

    test('debe aplicar paginación completa', async () => {
      const mockAprendices = [
        { id: 11, nombres: 'APRENDIZ 11' },
        { id: 12, nombres: 'APRENDIZ 12' }
      ];
      pool.query.mockResolvedValue([mockAprendices]);

      const resultado = await repositorioAprendiz.obtenerTodosConFiltros(
        {},
        'id ASC',
        10,
        10
      );

      expect(resultado.length).toBe(2);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY id ASC LIMIT ? OFFSET ?'),
        [10, 10]
      );
    });

    test('debe combinar filtros, orden y paginación', async () => {
      pool.query.mockResolvedValue([[]]);

      await repositorioAprendiz.obtenerTodosConFiltros(
        { nombre: 'María', programaFormacion: 'ADSI' },
        'nombres DESC',
        20,
        40
      );

      const llamada = pool.query.mock.calls[0];
      expect(llamada[0]).toContain('nombres LIKE ?');
      expect(llamada[0]).toContain('programaFormacion = ?');
      expect(llamada[0]).toContain('ORDER BY nombres DESC');
      expect(llamada[0]).toContain('LIMIT ?');
      expect(llamada[0]).toContain('OFFSET ?');
    });

    test('debe retornar array vacío cuando no hay resultados', async () => {
      pool.query.mockResolvedValue([[]]);

      const resultado = await repositorioAprendiz.obtenerTodosConFiltros(
        { nombre: 'NoExiste' },
        null,
        null,
        null
      );

      expect(resultado).toEqual([]);
      expect(Array.isArray(resultado)).toBe(true);
    });
  });

  describe('Manejo de errores generales', () => {
    test('debe propagar errores de conexión', async () => {
      const errorConexion = new Error('Connection lost');
      errorConexion.code = 'PROTOCOL_CONNECTION_LOST';
      pool.query.mockRejectedValue(errorConexion);

      await expect(repositorioAprendiz.buscarPorId(1)).rejects.toThrow('Connection lost');
    });

    test('debe propagar errores de timeout', async () => {
      const errorTimeout = new Error('Query timeout');
      errorTimeout.code = 'PROTOCOL_SEQUENCE_TIMEOUT';
      pool.query.mockRejectedValue(errorTimeout);

      await expect(repositorioAprendiz.contarTodos()).rejects.toThrow('Query timeout');
    });

    test('debe manejar errores de sintaxis SQL', async () => {
      const errorSintaxis = new Error('You have an error in your SQL syntax');
      pool.query.mockRejectedValue(errorSintaxis);

      await expect(repositorioAprendiz.obtenerTodosConFiltros({}, null, null, null))
        .rejects.toThrow('You have an error in your SQL syntax');
    });
  });
});
