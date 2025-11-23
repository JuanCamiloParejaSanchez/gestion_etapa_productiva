// tests/servicios/notificacionesService.test.js
// Propósito: Tests para el servicio de notificaciones con adjuntos

const notificacionesService = require('../../src/compartido/servicios/notificacionesService');

// Mock del pool de base de datos
jest.mock('../../src/configuracion/baseDatos', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock de fs
jest.mock('fs', () => ({
  promises: {
    access: jest.fn()
  }
}));

const { pool } = require('../../src/configuracion/baseDatos');
const fs = require('fs');

describe('NotificacionesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('crearNotificacion', () => {
    test('debe crear notificación con archivo adjunto exitosamente', async () => {
      const params = {
        usuarioId: 1,
        tipo: 'documento_aprobado',
        titulo: 'Documento Aprobado',
        mensaje: 'Su documento ha sido aprobado',
        referenciaId: 123,
        referenciaTipo: 'documento',
        retroalimentacion: 'Excelente trabajo',
        archivoAdjunto: '/uploads/adjuntos/documento.pdf'
      };

      pool.query.mockResolvedValue([{ insertId: 1 }]);

      const result = await notificacionesService.crearNotificacion(params);

      expect(result.success).toBe(true);
      expect(result.notificacionId).toBe(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notificaciones'),
        expect.arrayContaining([
          params.usuarioId,
          params.tipo,
          params.titulo,
          params.mensaje,
          params.referenciaId,
          params.referenciaTipo,
          params.retroalimentacion,
          params.archivoAdjunto
        ])
      );
    });

    test('debe crear notificación sin archivo adjunto', async () => {
      const params = {
        usuarioId: 1,
        tipo: 'recordatorio',
        titulo: 'Recordatorio',
        mensaje: 'No olvide subir sus documentos'
      };

      pool.query.mockResolvedValue([{ insertId: 2 }]);

      const result = await notificacionesService.crearNotificacion(params);

      expect(result.success).toBe(true);
      expect(result.notificacionId).toBe(2);
    });

    test('debe manejar errores de base de datos', async () => {
      const params = {
        usuarioId: 1,
        tipo: 'error',
        titulo: 'Error',
        mensaje: 'Error de prueba'
      };

      pool.query.mockRejectedValue(new Error('Error de BD'));

      await expect(notificacionesService.crearNotificacion(params))
        .rejects.toThrow('Error de BD');
    });
  });

  describe('obtenerNotificaciones', () => {
    test('debe retornar notificaciones con archivos adjuntos existentes', async () => {
      const mockNotificaciones = [
        {
          id: 1,
          titulo: 'Documento Aprobado',
          archivo_adjunto: '/uploads/adjuntos/doc1.pdf',
          fecha_creacion: new Date()
        },
        {
          id: 2,
          titulo: 'Sin Adjunto',
          archivo_adjunto: null,
          fecha_creacion: new Date()
        }
      ];

      pool.query.mockResolvedValue([mockNotificaciones]);
      fs.promises.access.mockResolvedValue(); // Archivo existe

      const result = await notificacionesService.obtenerNotificaciones(1);

      expect(result).toHaveLength(2);
      expect(result[0].archivo_adjunto).toBe(null); // El archivo no existe, se filtra
      expect(result[1].archivo_adjunto).toBe(null);
    });

    test('debe filtrar archivos adjuntos que no existen', async () => {
      const mockNotificaciones = [
        {
          id: 1,
          titulo: 'Documento Aprobado',
          archivo_adjunto: '/uploads/adjuntos/doc1.pdf',
          fecha_creacion: new Date()
        }
      ];

      pool.query.mockResolvedValue([mockNotificaciones]);
      fs.promises.access.mockRejectedValue(new Error('Archivo no encontrado')); // Archivo no existe

      const result = await notificacionesService.obtenerNotificaciones(1);

      expect(result).toHaveLength(1);
      expect(result[0].archivo_adjunto).toBe(null); // Debe ser null porque no existe
    });

    test('debe retornar notificaciones vacías si no hay resultados', async () => {
      pool.query.mockResolvedValue([[]]);

      const result = await notificacionesService.obtenerNotificaciones(1);

      expect(result).toEqual([]);
    });
  });

  describe('marcarComoLeida', () => {
    test('debe marcar notificación como leída', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await notificacionesService.marcarComoLeida(1, 1);

      expect(result.success).toBe(true);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notificaciones'),
        [1, 1]
      );
    });

    test('debe manejar error cuando notificación no existe', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 0 }]);

      const result = await notificacionesService.marcarComoLeida(999, 1);

      expect(result.success).toBe(false);
    });
  });

  describe('eliminarNotificacion', () => {
    test('debe eliminar notificación exitosamente', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await notificacionesService.eliminarNotificacion(1, 1);

      expect(result.success).toBe(true);
      expect(result.message).toContain('eliminada correctamente');
    });

    test('debe manejar error al eliminar notificación inexistente', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 0 }]);

      const result = await notificacionesService.eliminarNotificacion(999, 1);

      expect(result.success).toBe(false);
      expect(result.message).toContain('no encontrada');
    });
  });

  describe('contarNoLeidas', () => {
    test('debe contar notificaciones no leídas', async () => {
      pool.query.mockResolvedValue([[{ count: 5 }]]);

      const result = await notificacionesService.contarNoLeidas(1);

      expect(result).toBe(5);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*) as count'),
        [1]
      );
    });

    test('debe retornar 0 si no hay notificaciones no leídas', async () => {
      pool.query.mockResolvedValue([[{ count: 0 }]]);

      const result = await notificacionesService.contarNoLeidas(1);

      expect(result).toBe(0);
    });
  });
});