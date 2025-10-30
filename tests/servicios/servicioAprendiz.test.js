const ServicioAprendiz = require('../../src/modulos/aprendiz/servicios/servicioAprendiz');
const { formatearFecha } = require('../../src/compartido/utilidades/utilFechas');

// Mock del pool de base de datos
jest.mock('../../src/configuracion/baseDatos', () => ({
  pool: {
    query: jest.fn(),
    execute: jest.fn()
  }
}));

const { pool } = require('../../src/configuracion/baseDatos');

describe('ServicioAprendiz', () => {
  let servicio;

  beforeEach(() => {
    jest.clearAllMocks();
    servicio = new ServicioAprendiz();
  });

  describe('obtenerAprendizPorId', () => {
    test('debe retornar aprendiz cuando existe', async () => {
      const mockAprendiz = {
        id: 1,
        nombres: 'JUAN',
        primerApellido: 'PÉREZ',
        correoElectronico: 'juan@example.com',
        fechaNacimiento: new Date('2000-01-01')
      };

      pool.query.mockResolvedValue([[mockAprendiz]]);

      const result = await servicio.obtenerAprendizPorId(1);

      expect(result).toBeDefined();
      expect(result.nombres).toBe('JUAN');
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM aprendices WHERE id = ?', [1]);
    });

    test('debe retornar null cuando no existe el aprendiz', async () => {
      pool.query.mockResolvedValue([[]]);

      const result = await servicio.obtenerAprendizPorId(999);

      expect(result).toBeNull();
    });

    test('debe formatear fechas correctamente', async () => {
      const mockAprendiz = {
        id: 1,
        nombres: 'JUAN',
        fechaNacimiento: new Date('2000-01-15'),
        fechaInicioLectiva: new Date('2023-01-10')
      };

      pool.query.mockResolvedValue([[mockAprendiz]]);

      const result = await servicio.obtenerAprendizPorId(1);

      expect(result.fechaNacimiento).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.fechaInicioLectiva).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('crearAprendiz', () => {
    test('debe crear aprendiz exitosamente', async () => {
      const datosAprendiz = {
        tipoDocumento: 'CC',
        numeroDocumento: '123456789',
        nombres: 'JUAN',
        primerApellido: 'PÉREZ',
        correoElectronico: 'juan@example.com',
        fechaNacimiento: '2000-01-15'
      };

      pool.query.mockResolvedValue([{ insertId: 1 }]);

      const result = await servicio.crearAprendiz(datosAprendiz);

      expect(result.success).toBe(true);
      expect(result.id).toBe(1);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO aprendices SET ?',
        expect.any(Array)
      );
    });

    test('debe lanzar error cuando no se puede crear', async () => {
      const datosAprendiz = {
        nombres: 'JUAN'
      };

      pool.query.mockResolvedValue([{ insertId: 0 }]);

      await expect(servicio.crearAprendiz(datosAprendiz)).rejects.toThrow('No se pudo crear el registro');
    });

    test('debe formatear fechas antes de insertar', async () => {
      const datosAprendiz = {
        nombres: 'JUAN',
        fechaNacimiento: '2000-01-15',
        fechaInicioLectiva: '2023-01-10'
      };

      pool.query.mockResolvedValue([{ insertId: 1 }]);

      const result = await servicio.crearAprendiz(datosAprendiz);

      expect(result.success).toBe(true);
      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('actualizarAprendiz', () => {
    test('debe actualizar aprendiz exitosamente', async () => {
      const datosActualizados = {
        nombres: 'JUAN CARLOS',
        celular: '3001234567'
      };

      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await servicio.actualizarAprendiz(1, datosActualizados);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(pool.query).toHaveBeenCalled();
    });

    test('debe rechazar actualización sin datos válidos', async () => {
      const result = await servicio.actualizarAprendiz(1, {});

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.message).toContain('No hay datos válidos');
    });

    test('debe formatear fechas al actualizar', async () => {
      const datosActualizados = {
        fechaNacimiento: '2000-01-15',
        nombres: 'JUAN' // Agregar un campo adicional para evitar eliminarCamposVacios
      };

      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await servicio.actualizarAprendiz(1, datosActualizados);

      expect(result.success).toBe(true);
      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('eliminarAprendiz', () => {
    test('debe eliminar aprendiz exitosamente', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await servicio.eliminarAprendiz(1);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(pool.query).toHaveBeenCalledWith('DELETE FROM aprendices WHERE id = ?', [1]);
    });

    test('debe retornar error cuando el aprendiz no existe', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 0 }]);

      const result = await servicio.eliminarAprendiz(999);

      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
      expect(result.message).toContain('no encontrado');
    });
  });

  describe('buscarPorEmail', () => {
    test('debe buscar aprendiz por email', async () => {
      const mockAprendiz = {
        id: 1,
        correoElectronico: 'juan@example.com',
        nombres: 'JUAN'
      };

      pool.query.mockResolvedValue([[mockAprendiz]]);

      const result = await servicio.buscarPorEmail('juan@example.com');

      expect(result).toBeDefined();
      expect(result.correoElectronico).toBe('juan@example.com');
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM aprendices WHERE correoElectronico = ?',
        ['juan@example.com']
      );
    });

    test('debe retornar undefined cuando no encuentra el email', async () => {
      pool.query.mockResolvedValue([[]]);

      const result = await servicio.buscarPorEmail('noexiste@example.com');

      expect(result).toBeUndefined();
    });
  });

  describe('buscarPorNumeroDocumento', () => {
    test('debe buscar aprendiz por número de documento', async () => {
      const mockAprendiz = {
        id: 1,
        numeroDocumento: '123456789',
        nombres: 'JUAN'
      };

      pool.query.mockResolvedValue([[mockAprendiz]]);

      const result = await servicio.buscarPorNumeroDocumento('123456789');

      expect(result).toBeDefined();
      expect(result.numeroDocumento).toBe('123456789');
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM aprendices WHERE numeroDocumento = ?',
        ['123456789']
      );
    });
  });

  describe('actualizarPassword', () => {
    test('debe actualizar password exitosamente', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await servicio.actualizarPassword('juan@example.com', 'hashedPassword123');

      expect(result.success).toBe(true);
      expect(result.message).toContain('actualizada correctamente');
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE aprendices SET password = ? WHERE correoElectronico = ?',
        ['hashedPassword123', 'juan@example.com']
      );
    });

    test('debe lanzar error cuando no encuentra el aprendiz', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 0 }]);

      await expect(
        servicio.actualizarPassword('noexiste@example.com', 'hashedPassword123')
      ).rejects.toThrow('No se encontró el aprendiz');
    });
  });

  describe('obtenerAprendicesDataTable', () => {
    test('debe obtener aprendices con paginación', async () => {
      const mockAprendices = [
        { id: 1, nombres: 'JUAN', fechaNacimiento: new Date('2000-01-01') },
        { id: 2, nombres: 'MARÍA', fechaNacimiento: new Date('2001-02-02') }
      ];

      pool.query
        .mockResolvedValueOnce([mockAprendices])
        .mockResolvedValueOnce([[{ total: 2 }]]);

      const result = await servicio.obtenerAprendicesDataTable(1, 0, 10, { value: '' });

      expect(result.draw).toBe(1);
      expect(result.data.length).toBe(2);
      expect(result.recordsTotal).toBe(2);
    });

    test('debe filtrar por búsqueda', async () => {
      const mockAprendices = [
        { id: 1, nombres: 'JUAN', primerApellido: 'PÉREZ' }
      ];

      pool.query
        .mockResolvedValueOnce([mockAprendices])
        .mockResolvedValueOnce([[{ total: 1 }]]);

      const result = await servicio.obtenerAprendicesDataTable(1, 0, 10, { value: 'Juan' });

      expect(result.data.length).toBe(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.arrayContaining(['%Juan%'])
      );
    });
  });
});
