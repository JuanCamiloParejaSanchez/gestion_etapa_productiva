/**
 * Tests para Transacciones de Base de Datos
 * Verifica el manejo correcto de transacciones, commits y rollbacks
 */

// Mock del pool de base de datos
jest.mock('../../src/configuracion/baseDatos', () => ({
  pool: {
    query: jest.fn(),
    execute: jest.fn(),
    getConnection: jest.fn()
  }
}));

const { pool } = require('../../src/configuracion/baseDatos');

describe('Transacciones de Base de Datos', () => {
  let mockConnection;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de la conexión
    mockConnection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      query: jest.fn(),
      execute: jest.fn(),
      release: jest.fn()
    };

    pool.getConnection.mockResolvedValue(mockConnection);
  });

  describe('Transacciones básicas', () => {
    test('debe iniciar, ejecutar y confirmar una transacción exitosamente', async () => {
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.query.mockResolvedValue([{ insertId: 1 }]);
      mockConnection.commit.mockResolvedValue();

      const connection = await pool.getConnection();
      
      await connection.beginTransaction();
      await connection.query('INSERT INTO aprendices SET ?', [{ nombres: 'JUAN' }]);
      await connection.commit();
      connection.release();

      expect(connection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(connection.query).toHaveBeenCalledTimes(1);
      expect(connection.commit).toHaveBeenCalledTimes(1);
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    test('debe hacer rollback en caso de error', async () => {
      const errorDB = new Error('Error al insertar');
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.query.mockRejectedValue(errorDB);
      mockConnection.rollback.mockResolvedValue();

      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();
        await connection.query('INSERT INTO aprendices SET ?', [{ nombres: 'JUAN' }]);
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        connection.release();
      }

      expect(connection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.commit).not.toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    test('debe liberar la conexión incluso si hay error', async () => {
      const errorDB = new Error('Error crítico');
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.query.mockRejectedValue(errorDB);
      mockConnection.rollback.mockResolvedValue();

      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();
        await connection.query('INVALID QUERY');
        await connection.commit();
      } catch (error) {
        await connection.rollback();
      } finally {
        connection.release();
      }

      expect(connection.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('Transacciones con múltiples operaciones', () => {
    test('debe ejecutar múltiples inserciones en una transacción', async () => {
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.query
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([{ insertId: 2 }])
        .mockResolvedValueOnce([{ insertId: 3 }]);
      mockConnection.commit.mockResolvedValue();

      const connection = await pool.getConnection();

      await connection.beginTransaction();
      await connection.query('INSERT INTO aprendices SET ?', [{ nombres: 'JUAN' }]);
      await connection.query('INSERT INTO aprendices SET ?', [{ nombres: 'MARÍA' }]);
      await connection.query('INSERT INTO aprendices SET ?', [{ nombres: 'PEDRO' }]);
      await connection.commit();
      connection.release();

      expect(connection.query).toHaveBeenCalledTimes(3);
      expect(connection.commit).toHaveBeenCalledTimes(1);
      expect(connection.rollback).not.toHaveBeenCalled();
    });

    test('debe hacer rollback si falla una de múltiples operaciones', async () => {
      const errorDB = new Error('Error en segunda inserción');
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.query
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockRejectedValueOnce(errorDB);
      mockConnection.rollback.mockResolvedValue();

      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();
        await connection.query('INSERT INTO aprendices SET ?', [{ nombres: 'JUAN' }]);
        await connection.query('INSERT INTO aprendices SET ?', [{ nombres: 'MARÍA' }]);
        await connection.commit();
      } catch (error) {
        await connection.rollback();
      } finally {
        connection.release();
      }

      expect(connection.query).toHaveBeenCalledTimes(2);
      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.commit).not.toHaveBeenCalled();
    });

    test('debe ejecutar INSERT, UPDATE y DELETE en una transacción', async () => {
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.query
        .mockResolvedValueOnce([{ insertId: 10 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);
      mockConnection.commit.mockResolvedValue();

      const connection = await pool.getConnection();

      await connection.beginTransaction();
      
      // Insertar
      const insertResult = await connection.query(
        'INSERT INTO aprendices SET ?',
        [{ nombres: 'NUEVO' }]
      );
      
      // Actualizar
      await connection.query(
        'UPDATE aprendices SET nombres = ? WHERE id = ?',
        ['ACTUALIZADO', 5]
      );
      
      // Eliminar
      await connection.query(
        'DELETE FROM aprendices WHERE id = ?',
        [3]
      );

      await connection.commit();
      connection.release();

      expect(connection.query).toHaveBeenCalledTimes(3);
      expect(connection.commit).toHaveBeenCalledTimes(1);
      expect(insertResult[0].insertId).toBe(10);
    });
  });

  describe('Transacciones complejas', () => {
    test('debe manejar transacción con inserciones relacionadas', async () => {
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.query
        .mockResolvedValueOnce([{ insertId: 100 }]) // Insertar aprendiz
        .mockResolvedValueOnce([{ insertId: 200 }]) // Insertar documento relacionado
        .mockResolvedValueOnce([{ insertId: 300 }]); // Insertar seguimiento
      mockConnection.commit.mockResolvedValue();

      const connection = await pool.getConnection();

      await connection.beginTransaction();

      // Insertar aprendiz principal
      const aprendizResult = await connection.query(
        'INSERT INTO aprendices SET ?',
        [{ nombres: 'JUAN', correoElectronico: 'juan@example.com' }]
      );
      const aprendizId = aprendizResult[0].insertId;

      // Insertar documento relacionado
      await connection.query(
        'INSERT INTO documentos SET ?',
        [{ aprendiz_id: aprendizId, tipo: 'CV', ruta: '/docs/cv.pdf' }]
      );

      // Insertar seguimiento
      await connection.query(
        'INSERT INTO seguimientos SET ?',
        [{ aprendiz_id: aprendizId, estado: 'ACTIVO' }]
      );

      await connection.commit();
      connection.release();

      expect(connection.query).toHaveBeenCalledTimes(3);
      expect(connection.commit).toHaveBeenCalledTimes(1);
      expect(aprendizId).toBe(100);
    });

    test('debe hacer rollback cuando falla inserción de datos relacionados', async () => {
      const errorFK = new Error('Foreign key constraint fails');
      errorFK.code = 'ER_NO_REFERENCED_ROW_2';

      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.query
        .mockResolvedValueOnce([{ insertId: 100 }])
        .mockRejectedValueOnce(errorFK);
      mockConnection.rollback.mockResolvedValue();

      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        // Insertar aprendiz
        const aprendizResult = await connection.query(
          'INSERT INTO aprendices SET ?',
          [{ nombres: 'JUAN' }]
        );

        // Intentar insertar con FK inválida
        await connection.query(
          'INSERT INTO documentos SET ?',
          [{ aprendiz_id: 99999, tipo: 'CV' }]
        );

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        expect(error.code).toBe('ER_NO_REFERENCED_ROW_2');
      } finally {
        connection.release();
      }

      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.commit).not.toHaveBeenCalled();
    });

    test('debe manejar transacción con actualización de múltiples registros', async () => {
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.query
        .mockResolvedValueOnce([{ affectedRows: 5 }])
        .mockResolvedValueOnce([{ affectedRows: 5 }]);
      mockConnection.commit.mockResolvedValue();

      const connection = await pool.getConnection();

      await connection.beginTransaction();

      // Actualizar múltiples aprendices
      const updateResult1 = await connection.query(
        'UPDATE aprendices SET estado = ? WHERE programaFormacion = ?',
        ['INACTIVO', 'PROGRAMA_ANTIGUO']
      );

      // Actualizar documentos relacionados
      const updateResult2 = await connection.query(
        'UPDATE documentos SET estado = ? WHERE aprendiz_id IN (SELECT id FROM aprendices WHERE programaFormacion = ?)',
        ['ARCHIVADO', 'PROGRAMA_ANTIGUO']
      );

      await connection.commit();
      connection.release();

      expect(updateResult1[0].affectedRows).toBe(5);
      expect(updateResult2[0].affectedRows).toBe(5);
      expect(connection.commit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Manejo de errores en transacciones', () => {
    test('debe manejar error al iniciar transacción', async () => {
      const errorInicio = new Error('Cannot start transaction');
      mockConnection.beginTransaction.mockRejectedValue(errorInicio);

      const connection = await pool.getConnection();

      await expect(connection.beginTransaction()).rejects.toThrow('Cannot start transaction');
      
      connection.release();
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    test('debe manejar error al hacer commit', async () => {
      const errorCommit = new Error('Cannot commit transaction');
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.query.mockResolvedValue([{ insertId: 1 }]);
      mockConnection.commit.mockRejectedValue(errorCommit);
      mockConnection.rollback.mockResolvedValue();

      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();
        await connection.query('INSERT INTO aprendices SET ?', [{ nombres: 'JUAN' }]);
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        expect(error.message).toBe('Cannot commit transaction');
      } finally {
        connection.release();
      }

      expect(connection.rollback).toHaveBeenCalledTimes(1);
    });

    test('debe manejar error al hacer rollback', async () => {
      const errorQuery = new Error('Query error');
      const errorRollback = new Error('Cannot rollback');
      
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.query.mockRejectedValue(errorQuery);
      mockConnection.rollback.mockRejectedValue(errorRollback);

      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();
        await connection.query('INVALID QUERY');
        await connection.commit();
      } catch (error) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          expect(rollbackError.message).toBe('Cannot rollback');
        }
      } finally {
        connection.release();
      }

      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    test('debe manejar error de timeout en transacción', async () => {
      const errorTimeout = new Error('Transaction timeout');
      errorTimeout.code = 'PROTOCOL_SEQUENCE_TIMEOUT';

      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.query.mockRejectedValue(errorTimeout);
      mockConnection.rollback.mockResolvedValue();

      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();
        await connection.query('LONG RUNNING QUERY');
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        expect(error.code).toBe('PROTOCOL_SEQUENCE_TIMEOUT');
      } finally {
        connection.release();
      }
    });

    test('debe manejar error de conexión perdida durante transacción', async () => {
      const errorConexion = new Error('Connection lost');
      errorConexion.code = 'PROTOCOL_CONNECTION_LOST';

      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.query
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockRejectedValueOnce(errorConexion);

      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();
        await connection.query('INSERT INTO aprendices SET ?', [{ nombres: 'JUAN' }]);
        await connection.query('INSERT INTO aprendices SET ?', [{ nombres: 'MARÍA' }]);
        await connection.commit();
      } catch (error) {
        expect(error.code).toBe('PROTOCOL_CONNECTION_LOST');
        // En caso de pérdida de conexión, el rollback puede fallar
        try {
          await connection.rollback();
        } catch (rollbackError) {
          // Esperado que falle el rollback si se perdió la conexión
        }
      } finally {
        connection.release();
      }
    });
  });

  describe('Transacciones anidadas y concurrencia', () => {
    test('debe obtener múltiples conexiones para transacciones paralelas', async () => {
      const mockConnection1 = { ...mockConnection };
      const mockConnection2 = { ...mockConnection };

      pool.getConnection
        .mockResolvedValueOnce(mockConnection1)
        .mockResolvedValueOnce(mockConnection2);

      mockConnection1.beginTransaction = jest.fn().mockResolvedValue();
      mockConnection1.query = jest.fn().mockResolvedValue([{ insertId: 1 }]);
      mockConnection1.commit = jest.fn().mockResolvedValue();
      mockConnection1.release = jest.fn();

      mockConnection2.beginTransaction = jest.fn().mockResolvedValue();
      mockConnection2.query = jest.fn().mockResolvedValue([{ insertId: 2 }]);
      mockConnection2.commit = jest.fn().mockResolvedValue();
      mockConnection2.release = jest.fn();

      // Transacción 1
      const connection1 = await pool.getConnection();
      await connection1.beginTransaction();
      await connection1.query('INSERT INTO aprendices SET ?', [{ nombres: 'JUAN' }]);
      await connection1.commit();
      connection1.release();

      // Transacción 2
      const connection2 = await pool.getConnection();
      await connection2.beginTransaction();
      await connection2.query('INSERT INTO aprendices SET ?', [{ nombres: 'MARÍA' }]);
      await connection2.commit();
      connection2.release();

      expect(pool.getConnection).toHaveBeenCalledTimes(2);
      expect(mockConnection1.commit).toHaveBeenCalledTimes(1);
      expect(mockConnection2.commit).toHaveBeenCalledTimes(1);
    });

    test('debe liberar conexión antes de obtener otra', async () => {
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.query.mockResolvedValue([{ insertId: 1 }]);
      mockConnection.commit.mockResolvedValue();

      // Primera transacción
      const connection1 = await pool.getConnection();
      await connection1.beginTransaction();
      await connection1.query('INSERT INTO aprendices SET ?', [{ nombres: 'JUAN' }]);
      await connection1.commit();
      connection1.release();

      // Segunda transacción
      const connection2 = await pool.getConnection();
      await connection2.beginTransaction();
      await connection2.query('INSERT INTO aprendices SET ?', [{ nombres: 'MARÍA' }]);
      await connection2.commit();
      connection2.release();

      expect(mockConnection.release).toHaveBeenCalledTimes(2);
      expect(pool.getConnection).toHaveBeenCalledTimes(2);
    });
  });

  describe('Savepoints en transacciones', () => {
    test('debe crear y liberar savepoint exitosamente', async () => {
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.query
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce() // SAVEPOINT
        .mockResolvedValueOnce([{ insertId: 2 }])
        .mockResolvedValueOnce(); // RELEASE SAVEPOINT
      mockConnection.commit.mockResolvedValue();

      const connection = await pool.getConnection();

      await connection.beginTransaction();
      await connection.query('INSERT INTO aprendices SET ?', [{ nombres: 'JUAN' }]);
      await connection.query('SAVEPOINT sp1');
      await connection.query('INSERT INTO aprendices SET ?', [{ nombres: 'MARÍA' }]);
      await connection.query('RELEASE SAVEPOINT sp1');
      await connection.commit();
      connection.release();

      expect(connection.query).toHaveBeenCalledWith('SAVEPOINT sp1');
      expect(connection.query).toHaveBeenCalledWith('RELEASE SAVEPOINT sp1');
      expect(connection.commit).toHaveBeenCalledTimes(1);
    });

    test('debe hacer rollback a savepoint en caso de error parcial', async () => {
      const errorDB = new Error('Error en operación');
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.query
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce() // SAVEPOINT
        .mockRejectedValueOnce(errorDB)
        .mockResolvedValueOnce() // ROLLBACK TO SAVEPOINT
        .mockResolvedValueOnce([{ insertId: 3 }]);
      mockConnection.commit.mockResolvedValue();

      const connection = await pool.getConnection();

      await connection.beginTransaction();
      await connection.query('INSERT INTO aprendices SET ?', [{ nombres: 'JUAN' }]);
      await connection.query('SAVEPOINT sp1');
      
      try {
        await connection.query('INVALID QUERY');
      } catch (error) {
        await connection.query('ROLLBACK TO SAVEPOINT sp1');
      }

      await connection.query('INSERT INTO aprendices SET ?', [{ nombres: 'PEDRO' }]);
      await connection.commit();
      connection.release();

      expect(connection.query).toHaveBeenCalledWith('ROLLBACK TO SAVEPOINT sp1');
      expect(connection.commit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Aislamiento de transacciones', () => {
    test('debe configurar nivel de aislamiento READ COMMITTED', async () => {
      mockConnection.query
        .mockResolvedValueOnce() // SET TRANSACTION
        .mockResolvedValueOnce([{ insertId: 1 }]);
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.commit.mockResolvedValue();

      const connection = await pool.getConnection();

      await connection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
      await connection.beginTransaction();
      await connection.query('INSERT INTO aprendices SET ?', [{ nombres: 'JUAN' }]);
      await connection.commit();
      connection.release();

      expect(connection.query).toHaveBeenCalledWith('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    });

    test('debe configurar nivel de aislamiento SERIALIZABLE', async () => {
      mockConnection.query
        .mockResolvedValueOnce() // SET TRANSACTION
        .mockResolvedValueOnce([{ insertId: 1 }]);
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.commit.mockResolvedValue();

      const connection = await pool.getConnection();

      await connection.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
      await connection.beginTransaction();
      await connection.query('INSERT INTO aprendices SET ?', [{ nombres: 'MARÍA' }]);
      await connection.commit();
      connection.release();

      expect(connection.query).toHaveBeenCalledWith('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
    });
  });

  describe('Deadlocks', () => {
    test('debe detectar y manejar deadlock', async () => {
      const errorDeadlock = new Error('Deadlock found when trying to get lock');
      errorDeadlock.code = 'ER_LOCK_DEADLOCK';

      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.query.mockRejectedValue(errorDeadlock);
      mockConnection.rollback.mockResolvedValue();

      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();
        await connection.query('UPDATE aprendices SET nombres = ? WHERE id = ?', ['NUEVO', 1]);
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        expect(error.code).toBe('ER_LOCK_DEADLOCK');
      } finally {
        connection.release();
      }

      expect(connection.rollback).toHaveBeenCalledTimes(1);
    });

    test('debe reintentar transacción después de deadlock', async () => {
      const errorDeadlock = new Error('Deadlock found');
      errorDeadlock.code = 'ER_LOCK_DEADLOCK';

      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.query
        .mockRejectedValueOnce(errorDeadlock)
        .mockResolvedValueOnce([{ affectedRows: 1 }]);
      mockConnection.rollback.mockResolvedValue();
      mockConnection.commit.mockResolvedValue();

      const connection = await pool.getConnection();

      let exito = false;
      let intentos = 0;
      const maxIntentos = 2;

      while (!exito && intentos < maxIntentos) {
        try {
          intentos++;
          await connection.beginTransaction();
          await connection.query('UPDATE aprendices SET nombres = ? WHERE id = ?', ['NUEVO', 1]);
          await connection.commit();
          exito = true;
        } catch (error) {
          await connection.rollback();
          if (error.code !== 'ER_LOCK_DEADLOCK' || intentos >= maxIntentos) {
            throw error;
          }
        }
      }

      connection.release();

      expect(intentos).toBe(2);
      expect(exito).toBe(true);
      expect(connection.commit).toHaveBeenCalledTimes(1);
    });
  });
});
