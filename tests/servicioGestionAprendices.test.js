const ServicioGestionAprendices = require('../src/modulos/administrador/servicios/servicioGestionAprendices');

// Mock del pool de base de datos
jest.mock('../src/configuracion/baseDatos', () => ({
  pool: {
    query: jest.fn(),
    execute: jest.fn()
  }
}));

const { pool } = require('../src/configuracion/baseDatos');

describe('ServicioGestionAprendices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('construirQueryDinamica', () => {
    test('debe construir query sin filtros', () => {
      const servicio = new ServicioGestionAprendices();
      const result = servicio.construirQueryDinamica({});

      expect(result.baseQuery).toBe('FROM aprendices');
      expect(result.params).toEqual([]);
    });

    test('debe construir query con filtro de nombre', () => {
      const servicio = new ServicioGestionAprendices();
      const result = servicio.construirQueryDinamica({ nombre: 'Juan' });

      expect(result.baseQuery).toBe('FROM aprendices WHERE (nombres LIKE ? OR primerApellido LIKE ? OR segundoApellido LIKE ?)');
      expect(result.params).toEqual(['%Juan%', '%Juan%', '%Juan%']);
    });

    test('debe construir query con múltiples filtros', () => {
      const servicio = new ServicioGestionAprendices();
      const result = servicio.construirQueryDinamica({
        nombre: 'Juan',
        programaFormacion: 'tecProgramacion'
      });

      expect(result.baseQuery).toBe('FROM aprendices WHERE (nombres LIKE ? OR primerApellido LIKE ? OR segundoApellido LIKE ?) AND programaFormacion = ?');
      expect(result.params).toEqual(['%Juan%', '%Juan%', '%Juan%', 'tecProgramacion']);
    });
  });

  describe('construirOrderClause', () => {
    test('debe retornar ordenamiento por defecto', () => {
      const servicio = new ServicioGestionAprendices();
      const result = servicio.construirOrderClause(null, 'listarAprendices');

      expect(result).toBe('ORDER BY nombres ASC');
    });

    test('debe construir ordenamiento ASC válido', () => {
      const servicio = new ServicioGestionAprendices();
      const orderData = [{ column: 0, dir: 'asc' }];
      const result = servicio.construirOrderClause(orderData, 'listarAprendices');

      expect(result).toBe('ORDER BY tipoDocumento ASC');
    });

    test('debe rechazar dirección inválida', () => {
      const servicio = new ServicioGestionAprendices();
      const orderData = [{ column: 0, dir: 'invalid' }];

      expect(() => {
        servicio.construirOrderClause(orderData, 'listarAprendices');
      }).toThrow('Dirección de ordenamiento inválida');
    });
  });

  describe('buscarPorId', () => {
    test('debe retornar aprendiz cuando existe', async () => {
      const mockAprendiz = { id: 1, nombres: 'Juan', primerApellido: 'Pérez' };
      pool.query.mockResolvedValue([[mockAprendiz]]);

      const servicio = new ServicioGestionAprendices();
      const result = await servicio.buscarPorId(1);

      expect(result).toEqual(mockAprendiz);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM aprendices WHERE id = ?', [1]);
    });

    test('debe retornar null cuando no existe', async () => {
      pool.query.mockResolvedValue([[]]);

      const servicio = new ServicioGestionAprendices();
      const result = await servicio.buscarPorId(999);

      expect(result).toBeNull();
    });

    test('debe manejar errores de base de datos', async () => {
      const error = new Error('Error de conexión');
      pool.query.mockRejectedValue(error);

      const servicio = new ServicioGestionAprendices();

      await expect(servicio.buscarPorId(1)).rejects.toThrow('Error de conexión');
    });
  });

  describe('actualizarAprendiz', () => {
    test('debe actualizar campos válidos', async () => {
      pool.execute.mockResolvedValue([{ affectedRows: 1 }]);

      const servicio = new ServicioGestionAprendices();
      const result = await servicio.actualizarAprendiz(1, { nombres: 'Juan Actualizado', telefonoFijo: '1234567' });

      expect(result.success).toBe(true);
      expect(result.affectedRows).toBe(1);
      expect(pool.execute).toHaveBeenCalledWith(
        'UPDATE aprendices SET nombres = ?, telefonoFijo = ? WHERE id = ?',
        ['Juan Actualizado', '1234567', 1]
      );
    });

    test('debe rechazar campos inválidos', async () => {
      const servicio = new ServicioGestionAprendices();

      await expect(servicio.actualizarAprendiz(1, { campoInvalido: 'valor' }))
        .rejects.toThrow('No hay datos válidos para actualizar');
    });
  });

  describe('eliminarAprendiz', () => {
    test('debe eliminar aprendiz exitosamente', async () => {
      pool.execute.mockResolvedValue([{ affectedRows: 1 }]);

      const servicio = new ServicioGestionAprendices();
      const result = await servicio.eliminarAprendiz(1);

      expect(result.success).toBe(true);
      expect(result.affectedRows).toBe(1);
      expect(pool.execute).toHaveBeenCalledWith('DELETE FROM aprendices WHERE id = ?', [1]);
    });
  });
});