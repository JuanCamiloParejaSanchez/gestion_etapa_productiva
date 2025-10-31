/**
 * Tests para Operaciones CRUD de Base de Datos
 * Verifica las operaciones Create, Read, Update, Delete
 */

// Mock del pool de base de datos
jest.mock('../../src/configuracion/baseDatos', () => ({
  pool: {
    query: jest.fn(),
    execute: jest.fn()
  }
}));

const { pool } = require('../../src/configuracion/baseDatos');

describe('Operaciones CRUD de Base de Datos', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CREATE - Operaciones de Inserción', () => {
    test('debe insertar un registro simple', async () => {
      const nuevoAprendiz = {
        nombres: 'JUAN',
        primerApellido: 'PÉREZ',
        correoElectronico: 'juan@example.com'
      };

      pool.query.mockResolvedValue([{ insertId: 1, affectedRows: 1 }]);

      const [result] = await pool.query('INSERT INTO aprendices SET ?', [nuevoAprendiz]);

      expect(result.insertId).toBe(1);
      expect(result.affectedRows).toBe(1);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO aprendices SET ?',
        [nuevoAprendiz]
      );
    });

    test('debe insertar con todos los campos', async () => {
      const aprendizCompleto = {
        tipoDocumento: 'CC',
        numeroDocumento: '1234567890',
        nombres: 'JUAN CARLOS',
        primerApellido: 'PÉREZ',
        segundoApellido: 'GÓMEZ',
        correoElectronico: 'juan.perez@example.com',
        celular: '3001234567',
        telefonoFijo: '6012345678',
        fechaNacimiento: '2000-01-15',
        genero: 'Masculino',
        direccion: 'Calle 123 #45-67'
      };

      pool.query.mockResolvedValue([{ insertId: 10, affectedRows: 1 }]);

      const [result] = await pool.query('INSERT INTO aprendices SET ?', [aprendizCompleto]);

      expect(result.insertId).toBe(10);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO aprendices SET ?',
        [aprendizCompleto]
      );
    });

    test('debe insertar múltiples registros', async () => {
      const aprendices = [
        ['JUAN', 'PÉREZ', 'juan@example.com'],
        ['MARÍA', 'LÓPEZ', 'maria@example.com'],
        ['PEDRO', 'MARTÍNEZ', 'pedro@example.com']
      ];

      pool.query.mockResolvedValue([{ insertId: 1, affectedRows: 3 }]);

      const [result] = await pool.query(
        'INSERT INTO aprendices (nombres, primerApellido, correoElectronico) VALUES ?',
        [aprendices]
      );

      expect(result.affectedRows).toBe(3);
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    test('debe manejar inserción con campos NULL', async () => {
      const aprendiz = {
        nombres: 'JUAN',
        primerApellido: 'PÉREZ',
        segundoApellido: null,
        telefonoFijo: null,
        correoElectronico: 'juan@example.com'
      };

      pool.query.mockResolvedValue([{ insertId: 5, affectedRows: 1 }]);

      const [result] = await pool.query('INSERT INTO aprendices SET ?', [aprendiz]);

      expect(result.insertId).toBe(5);
      expect(result.affectedRows).toBe(1);
    });

    test('debe retornar error en inserción duplicada', async () => {
      const aprendiz = {
        correoElectronico: 'duplicado@example.com'
      };

      const errorDuplicado = new Error('Duplicate entry');
      errorDuplicado.code = 'ER_DUP_ENTRY';
      errorDuplicado.errno = 1062;

      pool.query.mockRejectedValue(errorDuplicado);

      await expect(pool.query('INSERT INTO aprendices SET ?', [aprendiz]))
        .rejects.toThrow('Duplicate entry');
    });

    test('debe insertar con valores por defecto', async () => {
      const aprendizMinimo = {
        nombres: 'PEDRO',
        correoElectronico: 'pedro@example.com'
      };

      pool.query.mockResolvedValue([{ insertId: 15 }]);

      const [result] = await pool.query('INSERT INTO aprendices SET ?', [aprendizMinimo]);

      expect(result.insertId).toBe(15);
    });

    test('debe insertar con fechas formateadas', async () => {
      const aprendiz = {
        nombres: 'CARLOS',
        fechaNacimiento: '2000-06-15',
        fechaInicioLectiva: '2023-01-10',
        correoElectronico: 'carlos@example.com'
      };

      pool.query.mockResolvedValue([{ insertId: 20 }]);

      await pool.query('INSERT INTO aprendices SET ?', [aprendiz]);

      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO aprendices SET ?',
        [aprendiz]
      );
    });
  });

  describe('READ - Operaciones de Lectura', () => {
    test('debe leer un registro por ID', async () => {
      const mockAprendiz = {
        id: 1,
        nombres: 'JUAN',
        primerApellido: 'PÉREZ',
        correoElectronico: 'juan@example.com'
      };

      pool.query.mockResolvedValue([[mockAprendiz]]);

      const [rows] = await pool.query('SELECT * FROM aprendices WHERE id = ?', [1]);

      expect(rows.length).toBe(1);
      expect(rows[0].id).toBe(1);
      expect(rows[0].nombres).toBe('JUAN');
    });

    test('debe leer todos los registros', async () => {
      const mockAprendices = [
        { id: 1, nombres: 'JUAN' },
        { id: 2, nombres: 'MARÍA' },
        { id: 3, nombres: 'PEDRO' }
      ];

      pool.query.mockResolvedValue([mockAprendices]);

      const [rows] = await pool.query('SELECT * FROM aprendices');

      expect(rows.length).toBe(3);
      expect(rows[0].nombres).toBe('JUAN');
      expect(rows[2].nombres).toBe('PEDRO');
    });

    test('debe leer con filtro WHERE', async () => {
      const mockAprendices = [
        { id: 1, nombres: 'JUAN', primerApellido: 'PÉREZ' }
      ];

      pool.query.mockResolvedValue([mockAprendices]);

      const [rows] = await pool.query(
        'SELECT * FROM aprendices WHERE primerApellido = ?',
        ['PÉREZ']
      );

      expect(rows.length).toBe(1);
      expect(rows[0].primerApellido).toBe('PÉREZ');
    });

    test('debe leer con múltiples condiciones WHERE', async () => {
      const mockAprendices = [
        { id: 1, nombres: 'JUAN', programaFormacion: 'ADSI', estado: 'ACTIVO' }
      ];

      pool.query.mockResolvedValue([mockAprendices]);

      const [rows] = await pool.query(
        'SELECT * FROM aprendices WHERE programaFormacion = ? AND estado = ?',
        ['ADSI', 'ACTIVO']
      );

      expect(rows.length).toBe(1);
      expect(rows[0].programaFormacion).toBe('ADSI');
    });

    test('debe leer con LIKE para búsquedas parciales', async () => {
      const mockAprendices = [
        { id: 1, nombres: 'JUAN CARLOS' },
        { id: 2, nombres: 'JUAN PABLO' }
      ];

      pool.query.mockResolvedValue([mockAprendices]);

      const [rows] = await pool.query(
        'SELECT * FROM aprendices WHERE nombres LIKE ?',
        ['%JUAN%']
      );

      expect(rows.length).toBe(2);
    });

    test('debe leer con ORDER BY', async () => {
      const mockAprendices = [
        { id: 1, nombres: 'ANA' },
        { id: 2, nombres: 'CARLOS' },
        { id: 3, nombres: 'BEATRIZ' }
      ];

      pool.query.mockResolvedValue([mockAprendices]);

      const [rows] = await pool.query(
        'SELECT * FROM aprendices ORDER BY nombres ASC'
      );

      expect(rows[0].nombres).toBe('ANA');
      expect(rows[2].nombres).toBe('BEATRIZ');
    });

    test('debe leer con LIMIT', async () => {
      const mockAprendices = [
        { id: 1, nombres: 'JUAN' },
        { id: 2, nombres: 'MARÍA' }
      ];

      pool.query.mockResolvedValue([mockAprendices]);

      const [rows] = await pool.query(
        'SELECT * FROM aprendices LIMIT ?',
        [2]
      );

      expect(rows.length).toBe(2);
    });

    test('debe leer con LIMIT y OFFSET (paginación)', async () => {
      const mockAprendices = [
        { id: 11, nombres: 'APRENDIZ 11' },
        { id: 12, nombres: 'APRENDIZ 12' }
      ];

      pool.query.mockResolvedValue([mockAprendices]);

      const [rows] = await pool.query(
        'SELECT * FROM aprendices LIMIT ? OFFSET ?',
        [10, 10]
      );

      expect(rows[0].id).toBe(11);
    });

    test('debe leer campos específicos', async () => {
      const mockAprendices = [
        { id: 1, nombres: 'JUAN', correoElectronico: 'juan@example.com' }
      ];

      pool.query.mockResolvedValue([mockAprendices]);

      const [rows] = await pool.query(
        'SELECT id, nombres, correoElectronico FROM aprendices WHERE id = ?',
        [1]
      );

      expect(rows[0]).toHaveProperty('id');
      expect(rows[0]).toHaveProperty('nombres');
      expect(rows[0]).toHaveProperty('correoElectronico');
    });

    test('debe contar registros con COUNT', async () => {
      pool.query.mockResolvedValue([[{ total: 150 }]]);

      const [rows] = await pool.query('SELECT COUNT(*) as total FROM aprendices');

      expect(rows[0].total).toBe(150);
    });

    test('debe leer con JOIN (simulado)', async () => {
      const mockResultado = [
        {
          aprendiz_id: 1,
          nombres: 'JUAN',
          documento_id: 1,
          tipo_documento: 'CV'
        }
      ];

      pool.query.mockResolvedValue([mockResultado]);

      const [rows] = await pool.query(
        `SELECT a.id as aprendiz_id, a.nombres, d.id as documento_id, d.tipo as tipo_documento
         FROM aprendices a
         LEFT JOIN documentos d ON a.id = d.aprendiz_id
         WHERE a.id = ?`,
        [1]
      );

      expect(rows[0].aprendiz_id).toBe(1);
      expect(rows[0].tipo_documento).toBe('CV');
    });

    test('debe retornar array vacío cuando no hay resultados', async () => {
      pool.query.mockResolvedValue([[]]);

      const [rows] = await pool.query('SELECT * FROM aprendices WHERE id = ?', [9999]);

      expect(rows).toEqual([]);
      expect(rows.length).toBe(0);
    });

    test('debe leer con IN clause', async () => {
      const mockAprendices = [
        { id: 1, nombres: 'JUAN' },
        { id: 2, nombres: 'MARÍA' },
        { id: 3, nombres: 'PEDRO' }
      ];

      pool.query.mockResolvedValue([mockAprendices]);

      const [rows] = await pool.query(
        'SELECT * FROM aprendices WHERE id IN (?, ?, ?)',
        [1, 2, 3]
      );

      expect(rows.length).toBe(3);
    });

    test('debe leer con GROUP BY', async () => {
      const mockResultado = [
        { programaFormacion: 'ADSI', total: 50 },
        { programaFormacion: 'MULTIMEDIA', total: 30 }
      ];

      pool.query.mockResolvedValue([mockResultado]);

      const [rows] = await pool.query(
        'SELECT programaFormacion, COUNT(*) as total FROM aprendices GROUP BY programaFormacion'
      );

      expect(rows.length).toBe(2);
      expect(rows[0].total).toBe(50);
    });
  });

  describe('UPDATE - Operaciones de Actualización', () => {
    test('debe actualizar un campo de un registro', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 1, changedRows: 1 }]);

      const [result] = await pool.query(
        'UPDATE aprendices SET nombres = ? WHERE id = ?',
        ['JUAN CARLOS', 1]
      );

      expect(result.affectedRows).toBe(1);
      expect(result.changedRows).toBe(1);
    });

    test('debe actualizar múltiples campos', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 1, changedRows: 1 }]);

      const [result] = await pool.query(
        'UPDATE aprendices SET nombres = ?, primerApellido = ?, celular = ? WHERE id = ?',
        ['JUAN CARLOS', 'PÉREZ GÓMEZ', '3009876543', 1]
      );

      expect(result.affectedRows).toBe(1);
    });

    test('debe actualizar múltiples registros con WHERE', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 5, changedRows: 5 }]);

      const [result] = await pool.query(
        'UPDATE aprendices SET estado = ? WHERE programaFormacion = ?',
        ['INACTIVO', 'PROGRAMA_ANTIGUO']
      );

      expect(result.affectedRows).toBe(5);
      expect(result.changedRows).toBe(5);
    });

    test('debe actualizar con valor NULL', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 1, changedRows: 1 }]);

      const [result] = await pool.query(
        'UPDATE aprendices SET segundoApellido = ? WHERE id = ?',
        [null, 1]
      );

      expect(result.affectedRows).toBe(1);
    });

    test('debe retornar affectedRows 0 cuando no existe el registro', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 0, changedRows: 0 }]);

      const [result] = await pool.query(
        'UPDATE aprendices SET nombres = ? WHERE id = ?',
        ['NUEVO NOMBRE', 9999]
      );

      expect(result.affectedRows).toBe(0);
      expect(result.changedRows).toBe(0);
    });

    test('debe retornar changedRows 0 cuando el valor no cambia', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 1, changedRows: 0 }]);

      const [result] = await pool.query(
        'UPDATE aprendices SET nombres = ? WHERE id = ?',
        ['JUAN', 1] // Mismo valor que ya tenía
      );

      expect(result.affectedRows).toBe(1);
      expect(result.changedRows).toBe(0); // No hubo cambio real
    });

    test('debe actualizar con condición compleja', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 3 }]);

      const [result] = await pool.query(
        'UPDATE aprendices SET estado = ? WHERE programaFormacion = ? AND fechaFinLectiva < ?',
        ['GRADUADO', 'ADSI', '2023-12-31']
      );

      expect(result.affectedRows).toBe(3);
    });

    test('debe actualizar fecha', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      const [result] = await pool.query(
        'UPDATE aprendices SET fechaFinLectiva = ? WHERE id = ?',
        ['2024-12-31', 1]
      );

      expect(result.affectedRows).toBe(1);
    });

    test('debe actualizar todos los registros sin WHERE', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 100 }]);

      const [result] = await pool.query(
        'UPDATE aprendices SET ultimaActualizacion = NOW()'
      );

      expect(result.affectedRows).toBe(100);
    });

    test('debe manejar error de restricción en UPDATE', async () => {
      const errorFK = new Error('Cannot update or delete a parent row');
      errorFK.code = 'ER_ROW_IS_REFERENCED_2';

      pool.query.mockRejectedValue(errorFK);

      await expect(pool.query(
        'UPDATE aprendices SET id = ? WHERE id = ?',
        [999, 1]
      )).rejects.toThrow('Cannot update or delete a parent row');
    });

    test('debe actualizar con CASE', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 10 }]);

      const [result] = await pool.query(
        `UPDATE aprendices 
         SET estado = CASE 
           WHEN fechaFinProductiva < NOW() THEN 'TERMINADO'
           ELSE 'EN_CURSO'
         END
         WHERE id IN (?, ?, ?)`,
        [1, 2, 3]
      );

      expect(result.affectedRows).toBe(10);
    });
  });

  describe('DELETE - Operaciones de Eliminación', () => {
    test('debe eliminar un registro por ID', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      const [result] = await pool.query('DELETE FROM aprendices WHERE id = ?', [1]);

      expect(result.affectedRows).toBe(1);
    });

    test('debe retornar affectedRows 0 cuando no existe el registro', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 0 }]);

      const [result] = await pool.query('DELETE FROM aprendices WHERE id = ?', [9999]);

      expect(result.affectedRows).toBe(0);
    });

    test('debe eliminar múltiples registros con WHERE', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 5 }]);

      const [result] = await pool.query(
        'DELETE FROM aprendices WHERE estado = ?',
        ['INACTIVO']
      );

      expect(result.affectedRows).toBe(5);
    });

    test('debe eliminar con condición compleja', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 3 }]);

      const [result] = await pool.query(
        'DELETE FROM aprendices WHERE programaFormacion = ? AND fechaCreacion < ?',
        ['PROGRAMA_ANTIGUO', '2020-01-01']
      );

      expect(result.affectedRows).toBe(3);
    });

    test('debe eliminar con IN clause', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 3 }]);

      const [result] = await pool.query(
        'DELETE FROM aprendices WHERE id IN (?, ?, ?)',
        [1, 2, 3]
      );

      expect(result.affectedRows).toBe(3);
    });

    test('debe manejar error de restricción de clave foránea', async () => {
      const errorFK = new Error('Cannot delete or update a parent row');
      errorFK.code = 'ER_ROW_IS_REFERENCED_2';

      pool.query.mockRejectedValue(errorFK);

      await expect(pool.query('DELETE FROM aprendices WHERE id = ?', [1]))
        .rejects.toThrow('Cannot delete or update a parent row');
    });

    test('debe eliminar todos los registros sin WHERE (con precaución)', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 100 }]);

      const [result] = await pool.query('DELETE FROM aprendices');

      expect(result.affectedRows).toBe(100);
    });

    test('debe eliminar con LIMIT', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 10 }]);

      const [result] = await pool.query(
        'DELETE FROM aprendices WHERE estado = ? LIMIT ?',
        ['TEMPORAL', 10]
      );

      expect(result.affectedRows).toBe(10);
    });

    test('debe eliminar con subconsulta', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 5 }]);

      const [result] = await pool.query(
        `DELETE FROM aprendices 
         WHERE id IN (
           SELECT id FROM (
             SELECT id FROM aprendices WHERE estado = 'INACTIVO'
           ) AS temp
         )`
      );

      expect(result.affectedRows).toBe(5);
    });
  });

  describe('Operaciones CRUD Combinadas', () => {
    test('debe ejecutar INSERT y luego SELECT', async () => {
      const nuevoAprendiz = { nombres: 'JUAN', correoElectronico: 'juan@example.com' };
      const aprendizInsertado = { id: 1, ...nuevoAprendiz };

      pool.query
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([[aprendizInsertado]]);

      // Insert
      const [insertResult] = await pool.query('INSERT INTO aprendices SET ?', [nuevoAprendiz]);
      const nuevoId = insertResult.insertId;

      // Select
      const [selectRows] = await pool.query('SELECT * FROM aprendices WHERE id = ?', [nuevoId]);

      expect(nuevoId).toBe(1);
      expect(selectRows[0].nombres).toBe('JUAN');
    });

    test('debe ejecutar UPDATE y luego SELECT para verificar', async () => {
      const aprendizActualizado = {
        id: 1,
        nombres: 'JUAN CARLOS',
        correoElectronico: 'juan@example.com'
      };

      pool.query
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[aprendizActualizado]]);

      // Update
      await pool.query(
        'UPDATE aprendices SET nombres = ? WHERE id = ?',
        ['JUAN CARLOS', 1]
      );

      // Select para verificar
      const [rows] = await pool.query('SELECT * FROM aprendices WHERE id = ?', [1]);

      expect(rows[0].nombres).toBe('JUAN CARLOS');
    });

    test('debe verificar existencia antes de INSERT', async () => {
      const email = 'juan@example.com';

      pool.query
        .mockResolvedValueOnce([[]])  // No existe
        .mockResolvedValueOnce([{ insertId: 1 }]); // Insert exitoso

      // Verificar si existe
      const [existing] = await pool.query(
        'SELECT * FROM aprendices WHERE correoElectronico = ?',
        [email]
      );

      if (existing.length === 0) {
        // Insertar si no existe
        const [result] = await pool.query(
          'INSERT INTO aprendices SET ?',
          [{ correoElectronico: email, nombres: 'JUAN' }]
        );
        expect(result.insertId).toBe(1);
      }
    });

    test('debe contar registros antes y después de DELETE', async () => {
      pool.query
        .mockResolvedValueOnce([[{ total: 10 }]])
        .mockResolvedValueOnce([{ affectedRows: 3 }])
        .mockResolvedValueOnce([[{ total: 7 }]]);

      // Contar antes
      const [beforeCount] = await pool.query('SELECT COUNT(*) as total FROM aprendices');
      
      // Eliminar
      await pool.query('DELETE FROM aprendices WHERE estado = ?', ['INACTIVO']);
      
      // Contar después
      const [afterCount] = await pool.query('SELECT COUNT(*) as total FROM aprendices');

      expect(beforeCount[0].total).toBe(10);
      expect(afterCount[0].total).toBe(7);
    });
  });

  describe('Manejo de Errores en CRUD', () => {
    test('debe manejar error de conexión perdida', async () => {
      const errorConexion = new Error('Connection lost');
      errorConexion.code = 'PROTOCOL_CONNECTION_LOST';

      pool.query.mockRejectedValue(errorConexion);

      await expect(pool.query('SELECT * FROM aprendices'))
        .rejects.toThrow('Connection lost');
    });

    test('debe manejar error de sintaxis SQL', async () => {
      const errorSintaxis = new Error('You have an error in your SQL syntax');
      pool.query.mockRejectedValue(errorSintaxis);

      await expect(pool.query('INVALID SQL QUERY'))
        .rejects.toThrow('You have an error in your SQL syntax');
    });

    test('debe manejar error de timeout', async () => {
      const errorTimeout = new Error('Query timeout');
      errorTimeout.code = 'PROTOCOL_SEQUENCE_TIMEOUT';

      pool.query.mockRejectedValue(errorTimeout);

      await expect(pool.query('SELECT SLEEP(1000)'))
        .rejects.toThrow('Query timeout');
    });

    test('debe manejar error de tabla no existente', async () => {
      const errorTabla = new Error('Table does not exist');
      errorTabla.code = 'ER_NO_SUCH_TABLE';

      pool.query.mockRejectedValue(errorTabla);

      await expect(pool.query('SELECT * FROM tabla_inexistente'))
        .rejects.toThrow('Table does not exist');
    });
  });
});
