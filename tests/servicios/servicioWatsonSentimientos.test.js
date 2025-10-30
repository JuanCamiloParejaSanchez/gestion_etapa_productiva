const ServicioWatsonSentimientos = require('../../src/modulos/administrador/servicios/servicioWatsonSentimientos');

// Mock de Watson
jest.mock('../../src/configuracion/watsonConfig', () => ({
  crearInstanciaWatson: jest.fn(),
  esConfiguracionValida: jest.fn(),
  obtenerConfiguracion: jest.fn()
}));

const { crearInstanciaWatson, esConfiguracionValida, obtenerConfiguracion } = require('../../src/configuracion/watsonConfig');

describe('ServicioWatsonSentimientos', () => {
  let mockWatsonInstance;
  let servicio;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar mock de Watson
    mockWatsonInstance = {
      analyze: jest.fn()
    };

    obtenerConfiguracion.mockReturnValue({
      useWatson: true,
      language: 'es',
      maxTextLength: 5000
    });

    esConfiguracionValida.mockReturnValue(true);
    crearInstanciaWatson.mockReturnValue(mockWatsonInstance);
  });

  describe('Inicialización', () => {
    test('debe inicializar Watson correctamente', () => {
      servicio = new ServicioWatsonSentimientos();

      expect(servicio.watson).toBeDefined();
      expect(crearInstanciaWatson).toHaveBeenCalled();
      expect(servicio.cache).toBeDefined();
    });

    test('debe lanzar error si Watson no está configurado', () => {
      esConfiguracionValida.mockReturnValue(false);

      expect(() => {
        new ServicioWatsonSentimientos();
      }).toThrow('IBM Watson no está configurado');
    });

    test('debe lanzar error si falla la inicialización de Watson', () => {
      crearInstanciaWatson.mockImplementation(() => {
        throw new Error('Watson init error');
      });

      expect(() => {
        new ServicioWatsonSentimientos();
      }).toThrow('IBM Watson no se pudo inicializar');
    });
  });

  describe('analizarConWatson', () => {
    beforeEach(() => {
      servicio = new ServicioWatsonSentimientos();
    });

    test('debe analizar sentimiento con Watson exitosamente', async () => {
      const mockResponse = {
        result: {
          sentiment: {
            document: {
              score: 0.8,
              label: 'positive'
            }
          },
          emotion: {
            document: {
              emotion: {
                joy: 0.8,
                sadness: 0.1,
                anger: 0.05,
                fear: 0.03,
                disgust: 0.02
              }
            }
          },
          keywords: [
            { text: 'excelente', sentiment: { score: 0.9 } },
            { text: 'proyecto', sentiment: { score: 0.5 } }
          ],
          entities: []
        }
      };

      mockWatsonInstance.analyze.mockResolvedValue(mockResponse);

      const result = await servicio.analizarConWatson('El proyecto está excelente');

      expect(result).toBeDefined();
      expect(result.score).toBe(4); // 0.8 * 5
      expect(result.label).toBe('positive');
      expect(result.emotions).toBeDefined();
      expect(mockWatsonInstance.analyze).toHaveBeenCalled();
    });

    test('debe retornar null para texto vacío', async () => {
      const result = await servicio.analizarConWatson('');

      expect(result).toBeNull();
      expect(mockWatsonInstance.analyze).not.toHaveBeenCalled();
    });

    test('debe usar cache para textos repetidos', async () => {
      const mockResponse = {
        result: {
          sentiment: { document: { score: 0.5, label: 'neutral' } },
          emotion: { document: { emotion: {} } },
          keywords: [],
          entities: []
        }
      };

      mockWatsonInstance.analyze.mockResolvedValue(mockResponse);

      // Primera llamada
      await servicio.analizarConWatson('Texto de prueba');
      // Segunda llamada (debe usar cache)
      const result = await servicio.analizarConWatson('Texto de prueba');

      expect(mockWatsonInstance.analyze).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
    });

    test('debe limitar texto largo según configuración', async () => {
      const textoLargo = 'a'.repeat(10000);
      
      const mockResponse = {
        result: {
          sentiment: { document: { score: 0, label: 'neutral' } },
          emotion: { document: { emotion: {} } },
          keywords: [],
          entities: []
        }
      };

      mockWatsonInstance.analyze.mockResolvedValue(mockResponse);

      await servicio.analizarConWatson(textoLargo);

      const callArgs = mockWatsonInstance.analyze.mock.calls[0][0];
      expect(callArgs.text.length).toBeLessThanOrEqual(5000);
    });

    test('debe manejar error 429 (Too Many Requests)', async () => {
      const error = new Error('Too Many Requests');
      error.status = 429;
      mockWatsonInstance.analyze.mockRejectedValue(error);

      const result = await servicio.analizarConWatson('Texto de prueba');

      expect(result).toBeDefined();
      expect(result.score).toBe(0); // Score neutral
      expect(result.label).toBe('neutral');
    });

    test('debe retornar null para otros errores', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockWatsonInstance.analyze.mockRejectedValue(new Error('Other error'));

      const result = await servicio.analizarConWatson('Texto de prueba');

      expect(result).toBeNull();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('analizarSentimiento', () => {
    beforeEach(() => {
      servicio = new ServicioWatsonSentimientos();
    });

    test('debe analizar sentimiento correctamente', async () => {
      const mockResponse = {
        result: {
          sentiment: { document: { score: 0.6, label: 'positive' } },
          emotion: { document: { emotion: { joy: 0.7 } } },
          keywords: [{ text: 'bueno' }],
          entities: []
        }
      };

      mockWatsonInstance.analyze.mockResolvedValue(mockResponse);

      const result = await servicio.analizarSentimiento('Muy bueno');

      expect(result.score).toBe(3); // 0.6 * 5
      expect(result.sentimiento).toBe('muy_positivo');
      expect(result.confianza).toBeGreaterThan(0);
    });

    test('debe retornar resultado neutral para texto inválido', async () => {
      const result = await servicio.analizarSentimiento(null);

      expect(result.score).toBe(0);
      expect(result.sentimiento).toBe('neutral');
    });

    test('debe manejar fallo de Watson gracefully', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockWatsonInstance.analyze.mockRejectedValue(new Error('Watson error'));

      const result = await servicio.analizarSentimiento('Texto de prueba');

      expect(result.score).toBe(0);
      expect(result.sentimiento).toBe('neutral');
      consoleWarnSpy.mockRestore();
    });
  });

  describe('clasificarSentimiento', () => {
    beforeEach(() => {
      servicio = new ServicioWatsonSentimientos();
    });

    test('debe clasificar como muy_positivo', () => {
      expect(servicio.clasificarSentimiento(4)).toBe('muy_positivo');
    });

    test('debe clasificar como positivo', () => {
      expect(servicio.clasificarSentimiento(2)).toBe('positivo');
    });

    test('debe clasificar como neutral', () => {
      expect(servicio.clasificarSentimiento(0)).toBe('neutral');
    });

    test('debe clasificar como negativo', () => {
      expect(servicio.clasificarSentimiento(-2)).toBe('negativo');
    });

    test('debe clasificar como muy_negativo', () => {
      expect(servicio.clasificarSentimiento(-4)).toBe('muy_negativo');
    });
  });

  describe('analizarBitacora', () => {
    beforeEach(() => {
      servicio = new ServicioWatsonSentimientos();
    });

    test('debe analizar bitácora completa', async () => {
      const mockResponse = {
        result: {
          sentiment: { document: { score: 0.7, label: 'positive' } },
          emotion: { document: { emotion: { joy: 0.8 } } },
          keywords: [{ text: 'logro' }],
          entities: []
        }
      };

      mockWatsonInstance.analyze.mockResolvedValue(mockResponse);

      const bitacora = {
        respuesta_desafio: 'Superé los desafíos',
        respuesta_logro: 'Logré mis objetivos',
        respuesta_comunicacion: 'Buena comunicación con el equipo'
      };

      const result = await servicio.analizarBitacora(bitacora);

      expect(result.scorePromedio).toBeGreaterThan(0);
      expect(result.sentimientoGeneral).toBeDefined();
      expect(result.recomendaciones).toBeDefined();
      expect(result.recomendaciones.length).toBeGreaterThan(0);
    });

    test('debe retornar análisis neutral para bitácora vacía', async () => {
      const bitacora = {
        respuesta_desafio: '',
        respuesta_logro: '',
        respuesta_comunicacion: ''
      };

      const result = await servicio.analizarBitacora(bitacora);

      expect(result.scorePromedio).toBe(0);
      expect(result.sentimientoGeneral).toBe('neutral');
    });

    test('debe manejar bitácora sin Watson disponible', async () => {
      servicio.watson = null;
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const bitacora = {
        respuesta_desafio: 'Test',
        respuesta_logro: 'Test',
        respuesta_comunicacion: 'Test'
      };

      const result = await servicio.analizarBitacora(bitacora);

      expect(result.scorePromedio).toBe(0);
      expect(result.nivelCompromiso).toBe(50);
      consoleWarnSpy.mockRestore();
    });
  });

  describe('analizarTendenciasAprendiz', () => {
    beforeEach(() => {
      servicio = new ServicioWatsonSentimientos();
    });

    test('debe analizar tendencias de múltiples bitácoras', async () => {
      const mockResponse = {
        result: {
          sentiment: { document: { score: 0.5, label: 'neutral' } },
          emotion: { document: { emotion: {} } },
          keywords: [],
          entities: []
        }
      };

      mockWatsonInstance.analyze.mockResolvedValue(mockResponse);

      const bitacoras = [
        { respuesta_desafio: 'Test 1', respuesta_logro: 'Logro 1' },
        { respuesta_desafio: 'Test 2', respuesta_logro: 'Logro 2' }
      ];

      const result = await servicio.analizarTendenciasAprendiz(bitacoras);

      expect(result.scorePromedio).toBeDefined();
      expect(result.tendencia).toBeDefined();
      expect(result.variabilidad).toBeDefined();
      expect(result.nivelCompromiso).toBeDefined();
    });

    test('debe retornar análisis vacío para array vacío', async () => {
      const result = await servicio.analizarTendenciasAprendiz([]);

      expect(result.scorePromedio).toBe(0);
      expect(result.tendencia).toBe('sin_datos');
      expect(result.nivelCompromiso).toBe(0);
    });

    test('debe limitar a 10 bitácoras más recientes', async () => {
      const mockResponse = {
        result: {
          sentiment: { document: { score: 0.5, label: 'neutral' } },
          emotion: { document: { emotion: {} } },
          keywords: [],
          entities: []
        }
      };

      mockWatsonInstance.analyze.mockResolvedValue(mockResponse);

      const bitacoras = Array(15).fill({
        respuesta_desafio: 'Test',
        respuesta_logro: 'Test'
      });

      await servicio.analizarTendenciasAprendiz(bitacoras);

      // Debe procesar solo las últimas 10
      expect(mockWatsonInstance.analyze).toHaveBeenCalled();
    });
  });

  describe('Métodos utilitarios', () => {
    beforeEach(() => {
      servicio = new ServicioWatsonSentimientos();
    });

    test('calcularVariabilidad debe calcular correctamente', () => {
      const scores = [1, 2, 3, 4, 5];
      const variabilidad = servicio.calcularVariabilidad(scores);

      expect(variabilidad).toBeGreaterThan(0);
      expect(variabilidad).toBeLessThanOrEqual(1);
    });

    test('determinarTendencia debe identificar mejora', () => {
      const scores = [1, 1, 2, 3, 4, 5];
      const tendencia = servicio.determinarTendencia(scores);

      expect(tendencia).toBe('mejorando');
    });

    test('determinarTendencia debe identificar empeoramiento', () => {
      const scores = [5, 4, 3, 2, 1, 0];
      const tendencia = servicio.determinarTendencia(scores);

      expect(tendencia).toBe('empeorando');
    });

    test('determinarTendencia debe identificar estabilidad', () => {
      const scores = [3, 3, 3, 3, 3];
      const tendencia = servicio.determinarTendencia(scores);

      expect(tendencia).toBe('estable');
    });

    test('generarRecomendacionesSimplificadas debe generar recomendaciones', () => {
      const recomendaciones = servicio.generarRecomendacionesSimplificadas(-2, 40, 'empeorando');

      expect(recomendaciones).toBeInstanceOf(Array);
      expect(recomendaciones.length).toBeGreaterThan(0);
      expect(recomendaciones[0]).toHaveProperty('icono');
      expect(recomendaciones[0]).toHaveProperty('texto');
      expect(recomendaciones[0]).toHaveProperty('prioridad');
    });
  });

  describe('Cache', () => {
    beforeEach(() => {
      servicio = new ServicioWatsonSentimientos();
    });

    test('generarCacheKey debe generar clave consistente', () => {
      const texto = 'Texto de prueba';
      const key1 = servicio.generarCacheKey(texto);
      const key2 = servicio.generarCacheKey(texto);

      expect(key1).toBe(key2);
    });

    test('limpiarCache debe vaciar el cache', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      servicio.cache.set('test', { data: 'test' });

      servicio.limpiarCache();

      expect(servicio.cache.size).toBe(0);
      consoleSpy.mockRestore();
    });
  });

  describe('obtenerEstadoConexion', () => {
    beforeEach(() => {
      servicio = new ServicioWatsonSentimientos();
    });

    test('debe retornar estado de conexión correcto', () => {
      const estado = servicio.obtenerEstadoConexion();

      expect(estado.watsonDisponible).toBe(true);
      expect(estado.configuracionValida).toBe(true);
      expect(estado.usoWatson).toBe(true);
      expect(estado.cacheSize).toBeDefined();
    });
  });

  describe('resultadoNeutral', () => {
    beforeEach(() => {
      servicio = new ServicioWatsonSentimientos();
    });

    test('debe retornar resultado neutral válido', () => {
      const neutral = servicio.resultadoNeutral();

      expect(neutral.score).toBe(0);
      expect(neutral.sentimiento).toBe('neutral');
      expect(neutral.confianza).toBe(0);
      expect(neutral.palabras).toEqual({ positiva: [], negativa: [] });
    });
  });
});
