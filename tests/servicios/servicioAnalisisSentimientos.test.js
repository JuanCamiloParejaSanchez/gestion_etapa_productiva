const ServicioAnalisisSentimientos = require('../../src/modulos/administrador/servicios/servicioAnalisisSentimientos');
const ServicioWatsonSentimientos = require('../../src/modulos/administrador/servicios/servicioWatsonSentimientos');

describe('ServicioAnalisisSentimientos', () => {
  test('debe ser una instancia de ServicioWatsonSentimientos', () => {
    // ServicioAnalisisSentimientos es solo un wrapper que exporta ServicioWatsonSentimientos
    expect(ServicioAnalisisSentimientos).toBe(ServicioWatsonSentimientos);
  });

  test('debe tener los mismos métodos que ServicioWatsonSentimientos', () => {
    // Verificar que tiene los métodos principales
    const metodosEsperados = [
      'analizarSentimiento',
      'analizarBitacora',
      'analizarTendenciasAprendiz',
      'clasificarSentimiento',
      'resultadoNeutral',
      'obtenerEstadoConexion'
    ];

    metodosEsperados.forEach(metodo => {
      expect(ServicioAnalisisSentimientos.prototype[metodo]).toBeDefined();
    });
  });
});
