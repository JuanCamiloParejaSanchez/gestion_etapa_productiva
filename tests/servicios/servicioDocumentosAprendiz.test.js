const servicioDocumentosAprendiz = require('../../src/modulos/aprendiz/servicios/servicioDocumentosAprendiz');

// Mock del pool de base de datos
jest.mock('../../src/configuracion/baseDatos', () => ({
  pool: {
    query: jest.fn(),
    execute: jest.fn()
  }
}));

const { pool } = require('../../src/configuracion/baseDatos');

describe('ServicioDocumentosAprendiz', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('insertarDocumento', () => {
    test('debe insertar documento con nomenclatura snake_case', async () => {
      pool.query.mockResolvedValue([{ insertId: 1 }]);

      const datosDocumento = {
        aprendiz_id: 1,
        nombre_original: 'documento.pdf',
        nombre_guardado: 'doc_123.pdf',
        ruta_archivo: '/uploads/documentos/',
        tipo_mime: 'application/pdf',
        tamano_bytes: 1024,
        descripcion: 'Documento de prueba',
        tipo_documento: 'cedula',
        activo: 1
      };

      const result = await servicioDocumentosAprendiz.insertarDocumento(datosDocumento);

      expect(result.success).toBe(true);
      expect(result.id).toBe(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO documentos_aprendiz'),
        expect.arrayContaining([1, 'documento.pdf', 'doc_123.pdf'])
      );
    });

    test('debe insertar documento con nomenclatura camelCase', async () => {
      pool.query.mockResolvedValue([{ insertId: 2 }]);

      const datosDocumento = {
        aprendizId: 1,
        nombreOriginal: 'foto.jpg',
        nombreGuardado: 'foto_123.jpg',
        rutaArchivo: '/uploads/fotos/',
        tipoMime: 'image/jpeg',
        tamanoBytes: 2048,
        descripcion: 'Foto de prueba',
        tipoDocumento: 'foto'
      };

      const result = await servicioDocumentosAprendiz.insertarDocumento(datosDocumento);

      expect(result.success).toBe(true);
      expect(result.id).toBe(2);
    });

    test('debe usar activo=1 por defecto si no se proporciona', async () => {
      pool.query.mockResolvedValue([{ insertId: 3 }]);

      const datosDocumento = {
        aprendiz_id: 1,
        nombre_original: 'doc.pdf',
        nombre_guardado: 'doc_456.pdf',
        ruta_archivo: '/uploads/',
        tipo_mime: 'application/pdf',
        tamano_bytes: 500
      };

      const result = await servicioDocumentosAprendiz.insertarDocumento(datosDocumento);

      expect(result.success).toBe(true);
      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([1]) // activo = 1
      );
    });

    test('debe retornar error si falla la inserción', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      const datosDocumento = {
        aprendiz_id: 1,
        nombre_original: 'doc.pdf'
      };

      const result = await servicioDocumentosAprendiz.insertarDocumento(datosDocumento);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Error al insertar el documento');
    });
  });

  describe('obtenerDocumentosPorAprendiz', () => {
    test('debe obtener documentos de un aprendiz', async () => {
      const mockDocumentos = [
        { id: 1, aprendiz_id: 1, nombre_original: 'doc1.pdf', fecha_subida: new Date() },
        { id: 2, aprendiz_id: 1, nombre_original: 'doc2.pdf', fecha_subida: new Date() }
      ];

      pool.query.mockResolvedValue([mockDocumentos]);

      const result = await servicioDocumentosAprendiz.obtenerDocumentosPorAprendiz(1);

      expect(result).toHaveLength(2);
      expect(result[0].aprendiz_id).toBe(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE aprendiz_id = ?'),
        [1]
      );
    });

    test('debe ordenar documentos por fecha descendente', async () => {
      pool.query.mockResolvedValue([[]]);

      await servicioDocumentosAprendiz.obtenerDocumentosPorAprendiz(1);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY fecha_subida DESC'),
        [1]
      );
    });

    test('debe retornar array vacío si no hay documentos', async () => {
      pool.query.mockResolvedValue([[]]);

      const result = await servicioDocumentosAprendiz.obtenerDocumentosPorAprendiz(999);

      expect(result).toEqual([]);
    });
  });

  describe('obtenerDocumentoPorNombreGuardadoYAprendiz', () => {
    test('debe obtener documento por nombre guardado y aprendiz', async () => {
      const mockDocumento = {
        id: 1,
        aprendiz_id: 1,
        nombre_guardado: 'doc_123.pdf',
        nombre_original: 'documento.pdf'
      };

      pool.query.mockResolvedValue([[mockDocumento]]);

      const result = await servicioDocumentosAprendiz.obtenerDocumentoPorNombreGuardadoYAprendiz(
        'doc_123.pdf',
        1
      );

      expect(result).toEqual(mockDocumento);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE nombre_guardado = ? AND aprendiz_id = ?'),
        ['doc_123.pdf', 1]
      );
    });

    test('debe retornar null si no encuentra el documento', async () => {
      pool.query.mockResolvedValue([[]]);

      const result = await servicioDocumentosAprendiz.obtenerDocumentoPorNombreGuardadoYAprendiz(
        'noexiste.pdf',
        1
      );

      expect(result).toBeNull();
    });
  });

  describe('obtenerDocumentoPorId', () => {
    test('debe obtener documento por ID', async () => {
      const mockDocumento = {
        id: 1,
        aprendiz_id: 1,
        nombre_original: 'documento.pdf'
      };

      pool.query.mockResolvedValue([[mockDocumento]]);

      const result = await servicioDocumentosAprendiz.obtenerDocumentoPorId(1);

      expect(result).toEqual(mockDocumento);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = ?'),
        [1]
      );
    });

    test('debe retornar null si no existe el documento', async () => {
      pool.query.mockResolvedValue([[]]);

      const result = await servicioDocumentosAprendiz.obtenerDocumentoPorId(999);

      expect(result).toBeNull();
    });
  });

  describe('obtenerDocumentoPorNombreOriginalYAprendiz', () => {
    test('debe obtener documento por nombre original y aprendiz', async () => {
      const mockDocumento = {
        id: 1,
        aprendiz_id: 1,
        nombre_original: 'documento.pdf'
      };

      pool.query.mockResolvedValue([[mockDocumento]]);

      const result = await servicioDocumentosAprendiz.obtenerDocumentoPorNombreOriginalYAprendiz(
        'documento.pdf',
        1
      );

      expect(result).toEqual(mockDocumento);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE nombre_original = ? AND aprendiz_id = ?'),
        ['documento.pdf', 1]
      );
    });
  });

  describe('eliminarDocumentoPorId', () => {
    test('debe eliminar documento exitosamente', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await servicioDocumentosAprendiz.eliminarDocumentoPorId(1);

      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM documentos_aprendiz WHERE id = ?'),
        [1]
      );
    });

    test('debe retornar false si no elimina ningún documento', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 0 }]);

      const result = await servicioDocumentosAprendiz.eliminarDocumentoPorId(999);

      expect(result).toBe(false);
    });

    test('debe lanzar error si falla la eliminación', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(
        servicioDocumentosAprendiz.eliminarDocumentoPorId(1)
      ).rejects.toThrow();
    });
  });

  describe('obtenerDocumentoPorIdYAprendiz', () => {
    test('debe obtener documento por ID y aprendiz', async () => {
      const mockDocumento = {
        id: 1,
        aprendiz_id: 1,
        nombre_original: 'documento.pdf'
      };

      pool.query.mockResolvedValue([[mockDocumento]]);

      const result = await servicioDocumentosAprendiz.obtenerDocumentoPorIdYAprendiz(1, 1);

      expect(result).toEqual(mockDocumento);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = ? AND aprendiz_id = ?'),
        [1, 1]
      );
    });

    test('debe retornar null si el documento no pertenece al aprendiz', async () => {
      pool.query.mockResolvedValue([[]]);

      const result = await servicioDocumentosAprendiz.obtenerDocumentoPorIdYAprendiz(1, 999);

      expect(result).toBeNull();
    });
  });

  describe('obtenerDocumentosPorIds', () => {
    test('debe obtener múltiples documentos por IDs', async () => {
      const mockDocumentos = [
        { id: 1, aprendiz_id: 1, nombre_original: 'doc1.pdf' },
        { id: 2, aprendiz_id: 1, nombre_original: 'doc2.pdf' }
      ];

      pool.query.mockResolvedValue([mockDocumentos]);

      const result = await servicioDocumentosAprendiz.obtenerDocumentosPorIds(['1', '2'], 1);

      expect(result).toHaveLength(2);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id IN (?,?)'),
        ['1', '2', 1]
      );
    });

    test('debe filtrar por aprendiz_id', async () => {
      pool.query.mockResolvedValue([[]]);

      await servicioDocumentosAprendiz.obtenerDocumentosPorIds(['1', '2', '3'], 1);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('AND aprendiz_id = ?'),
        ['1', '2', '3', 1]
      );
    });

    test('debe manejar array vacío de IDs', async () => {
      pool.query.mockResolvedValue([[]]);

      const result = await servicioDocumentosAprendiz.obtenerDocumentosPorIds([], 1);

      expect(result).toEqual([]);
    });
  });

  describe('obtenerDocumentoPorTipoYAprendiz', () => {
    test('debe obtener documento por tipo y aprendiz', async () => {
      const mockDocumento = {
        id: 1,
        aprendiz_id: 1,
        tipo_documento: 'cedula',
        nombre_original: 'cedula.pdf'
      };

      pool.query.mockResolvedValue([[mockDocumento]]);

      const result = await servicioDocumentosAprendiz.obtenerDocumentoPorTipoYAprendiz('cedula', 1);

      expect(result).toEqual(mockDocumento);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE tipo_documento = ? AND aprendiz_id = ? LIMIT 1'),
        ['cedula', 1]
      );
    });

    test('debe retornar null si no encuentra documento del tipo', async () => {
      pool.query.mockResolvedValue([[]]);

      const result = await servicioDocumentosAprendiz.obtenerDocumentoPorTipoYAprendiz('eps', 999);

      expect(result).toBeNull();
    });

    test('debe limitar a 1 resultado', async () => {
      pool.query.mockResolvedValue([[]]);

      await servicioDocumentosAprendiz.obtenerDocumentoPorTipoYAprendiz('cedula', 1);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 1'),
        expect.any(Array)
      );
    });
  });

  describe('Compatibilidad de nomenclatura', () => {
    test('debe aceptar datos en snake_case y camelCase mezclados', async () => {
      pool.query.mockResolvedValue([{ insertId: 1 }]);

      const datosDocumento = {
        aprendiz_id: 1,
        nombreOriginal: 'documento.pdf', // camelCase
        nombre_guardado: 'doc_123.pdf', // snake_case
        rutaArchivo: '/uploads/', // camelCase
        tipo_mime: 'application/pdf', // snake_case
        tamanoBytes: 1024 // camelCase
      };

      const result = await servicioDocumentosAprendiz.insertarDocumento(datosDocumento);

      expect(result.success).toBe(true);
    });
  });

  describe('Manejo de errores', () => {
    test('debe manejar errores de base de datos en obtenerDocumentosPorAprendiz', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(
        servicioDocumentosAprendiz.obtenerDocumentosPorAprendiz(1)
      ).rejects.toThrow();

      consoleErrorSpy.mockRestore();
    });

    test('debe manejar errores en obtenerDocumentoPorId', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(
        servicioDocumentosAprendiz.obtenerDocumentoPorId(1)
      ).rejects.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });
});
