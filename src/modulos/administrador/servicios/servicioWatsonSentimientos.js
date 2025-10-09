// src/modulos/administrador/servicios/servicioWatsonSentimientos.js
// Servicio de análisis de sentimientos usando IBM Watson Natural Language Understanding

const { crearInstanciaWatson, esConfiguracionValida, obtenerConfiguracion } = require('../../../configuracion/watsonConfig');

/**
 * @typedef {Object} ResultadoWatson
 * @property {number} score - Score de sentimiento (-1 a 1)
 * @property {string} label - Etiqueta del sentimiento (positive, negative, neutral)
 * @property {Object} emotions - Emociones detectadas
 * @property {Object} entities - Entidades detectadas
 * @property {Object} keywords - Palabras clave detectadas
 */

/**
 * @typedef {Object} ResultadoAnalisis
 * @property {number} score
 * @property {number} comparativo
 * @property {{positiva: string[], negativa: string[]}} palabras
 * @property {string[]} frasesDetectadas
 * @property {string} sentimiento
 * @property {number} intensidad
 * @property {number} confianza
 * @property {boolean} contieneIronia
 * @property {string[]} contextosDetectados
 * @property {Object} emociones - Emociones de Watson
 * @property {Object} entidades - Entidades de Watson
 * @property {Object} palabrasClave - Palabras clave de Watson
 */

/**
 * @typedef {Object} Bitacora
 * @property {string} [respuesta_desafio]
 * @property {string} [respuesta_logro]
 * @property {string} [respuesta_comunicacion]
 * @property {Date} [fechaCreacion]
 */

class ServicioWatsonSentimientos {
    constructor() {
        this.watson = null;
        this.config = obtenerConfiguracion();
        this.inicializarWatson();
    }

    /**
     * Inicializa la conexión con Watson
     */
    inicializarWatson() {
        if (esConfiguracionValida() && this.config.useWatson) {
            try {
                this.watson = crearInstanciaWatson();
                console.log('✅ IBM Watson Natural Language Understanding inicializado correctamente');
            } catch (error) {
                console.error('❌ Error al inicializar Watson:', error);
                this.watson = null;
            }
        } else {
            console.log('⚠️ IBM Watson no configurado. Usando análisis local.');
            this.watson = null;
        }
    }

    /**
     * Analiza el sentimiento de un texto usando IBM Watson
     * @param {string} texto - Texto a analizar
     * @returns {Promise<ResultadoWatson>} Resultado del análisis
     */
    async analizarConWatson(texto) {
        if (!this.watson || !texto || texto.trim().length === 0) {
            return null;
        }

        try {
            // Limitar el texto si es muy largo
            const textoLimitado = texto.length > this.config.maxTextLength 
                ? texto.substring(0, this.config.maxTextLength) 
                : texto;

            const analyzeParams = {
                text: textoLimitado,
                language: this.config.language,
                features: this.config.features
            };

            const resultado = await this.watson.analyze(analyzeParams);
            
            // Log completo de la respuesta de Watson para depuración
            console.log('Respuesta completa de Watson:', JSON.stringify(resultado, null, 2));
            // Verificar que la respuesta tenga la estructura esperada
            if (!resultado || !resultado.result) {
                console.error('Respuesta de Watson inválida:', resultado);
                return null;
            }

            // Extraer datos de sentimiento con validación
            const sentiment = resultado.result.sentiment;
            const emotion = resultado.result.emotion;
            const entities = resultado.result.entities || [];
            const keywords = resultado.result.keywords || [];

            // Verificar que sentiment existe y tiene document
            if (!sentiment || !sentiment.document) {
                console.error('Datos de sentimiento no disponibles en respuesta de Watson');
                return null;
            }

            return {
                score: this.mapearScoreWatson(sentiment.document.score || 0),
                label: sentiment.document.label || 'neutral',
                emotions: emotion?.document?.emotion || {},
                entities: entities,
                keywords: keywords
            };
        } catch (error) {
            console.error('Error en análisis de Watson:', error);
            return null;
        }
    }

    /**
     * Mapea el score de Watson (-1 a 1) al formato de la aplicación (-5 a 5)
     * @param {number} scoreWatson - Score de Watson
     * @returns {number} Score mapeado
     */
    mapearScoreWatson(scoreWatson) {
        return scoreWatson * 5; // Convierte de -1,1 a -5,5
    }

    /**
     * Analiza el sentimiento de un texto (combinando Watson y análisis local)
     * @param {string} texto - Texto a analizar
     * @returns {Promise<ResultadoAnalisis>} Resultado del análisis
     */
    async analizarSentimiento(texto) {
        if (!texto || typeof texto !== 'string') {
            return this.resultadoNeutral();
        }

        // Intentar análisis con Watson primero
        let resultadoWatson = null;
        if (this.watson) {
            resultadoWatson = await this.analizarConWatson(texto);
        }

        // Si Watson falla o no está disponible, usar análisis local
        if (!resultadoWatson) {
            return this.analizarSentimientoLocal(texto);
        }

        // Combinar resultados de Watson con análisis local
        return this.combinarResultados(texto, resultadoWatson);
    }

    /**
     * Análisis local de sentimientos (fallback)
     * @param {string} texto - Texto a analizar
     * @returns {ResultadoAnalisis} Resultado del análisis local
     */
    analizarSentimientoLocal(texto) {
        // Implementación simplificada del análisis local
        const palabrasPositivas = ['feliz', 'contento', 'excelente', 'bueno', 'logré', 'aprendí', 'progreso'];
        const palabrasNegativas = ['triste', 'frustrado', 'difícil', 'problema', 'error', 'malo', 'no pude'];
        
        const textoLimpio = texto.toLowerCase();
        let score = 0;
        const palabrasPositivasEncontradas = [];
        const palabrasNegativasEncontradas = [];

        palabrasPositivas.forEach(palabra => {
            if (textoLimpio.includes(palabra)) {
                score += 1;
                palabrasPositivasEncontradas.push(palabra);
            }
        });

        palabrasNegativas.forEach(palabra => {
            if (textoLimpio.includes(palabra)) {
                score -= 1;
                palabrasNegativasEncontradas.push(palabra);
            }
        });

        return {
            score: Math.max(-5, Math.min(5, score)),
            comparativo: score,
            palabras: {
                positiva: palabrasPositivasEncontradas,
                negativa: palabrasNegativasEncontradas
            },
            frasesDetectadas: [],
            sentimiento: this.clasificarSentimiento(score),
            intensidad: Math.abs(score),
            confianza: 0.6,
            contieneIronia: false,
            contextosDetectados: [],
            emociones: {},
            entidades: [],
            palabrasClave: []
        };
    }

    /**
     * Combina los resultados de Watson con análisis local
     * @param {string} texto - Texto original
     * @param {ResultadoWatson} resultadoWatson - Resultado de Watson
     * @returns {ResultadoAnalisis} Resultado combinado
     */
    combinarResultados(texto, resultadoWatson) {
        const score = resultadoWatson.score;
        const emociones = resultadoWatson.emotions;
        const entidades = resultadoWatson.entities;
        const palabrasClave = resultadoWatson.keywords;

        // Extraer palabras clave relevantes
        const palabrasPositivas = palabrasClave
            .filter(kw => kw.sentiment && kw.sentiment.score > 0)
            .map(kw => kw.text);

        const palabrasNegativas = palabrasClave
            .filter(kw => kw.sentiment && kw.sentiment.score < 0)
            .map(kw => kw.text);

        // Detectar contextos basados en entidades
        const contextosDetectados = entidades
            .map(entity => entity.type)
            .filter((contexto, index, arr) => arr.indexOf(contexto) === index);

        // Calcular confianza basada en la cantidad de datos
        const confianza = Math.min(0.95, 0.7 + (palabrasClave.length * 0.05));

        return {
            score: score,
            comparativo: score,
            palabras: {
                positiva: palabrasPositivas,
                negativa: palabrasNegativas
            },
            frasesDetectadas: [],
            sentimiento: this.clasificarSentimiento(score),
            intensidad: Math.abs(score),
            confianza: confianza,
            contieneIronia: this.detectarIronia(texto),
            contextosDetectados: contextosDetectados,
            emociones: emociones,
            entidades: entidades,
            palabrasClave: palabrasClave
        };
    }

    /**
     * Clasifica el sentimiento basado en el score
     * @param {number} score - Score del sentimiento
     * @returns {string} Clasificación del sentimiento
     */
    clasificarSentimiento(score) {
        if (score >= 3) return 'muy_positivo';
        if (score >= 1) return 'positivo';
        if (score >= -1) return 'neutral';
        if (score >= -3) return 'negativo';
        return 'muy_negativo';
    }

    /**
     * Detecta ironía en el texto
     * @param {string} texto - Texto a analizar
     * @returns {boolean} True si se detecta ironía
     */
    detectarIronia(texto) {
        const frasesIronicas = [
            'por supuesto', 'claro que sí', 'excelente', 'perfecto',
            'maravilloso', 'fantástico', 'genial'
        ];
        
        const textoLimpio = texto.toLowerCase();
        return frasesIronicas.some(frase => 
            textoLimpio.includes(frase) && 
            (textoLimpio.includes('pero') || textoLimpio.includes('sin embargo'))
        );
    }

    /**
     * Unifica contextos de diferentes análisis
     * @param {string[]} contextos - Array de contextos
     * @returns {string[]} Contextos únicos
     */
    unificarContextos(contextos) {
        return [...new Set(contextos)].filter(contexto => contexto && contexto.trim() !== '');
    }

    /**
     * Genera recomendaciones basadas en el análisis
     * @param {number} scorePromedio - Score promedio
     * @param {Object} analisisDetallado - Análisis detallado
     * @returns {Array} Array de recomendaciones
     */
    generarRecomendaciones(scorePromedio, analisisDetallado) {
        const recomendaciones = [];
        
        if (scorePromedio < -1) {
            recomendaciones.push({
                area: 'Bienestar Emocional',
                mensaje: 'El aprendiz muestra sentimientos negativos. Considera brindar apoyo adicional.',
                prioridad: 'alta',
                acciones: ['Entrevista personal', 'Apoyo psicológico', 'Ajuste de carga de trabajo']
            });
        }
        
        if (scorePromedio > 2) {
            recomendaciones.push({
                area: 'Motivación',
                mensaje: 'El aprendiz muestra excelente motivación. Mantén el apoyo y reconoce su esfuerzo.',
                prioridad: 'baja',
                acciones: ['Reconocimiento público', 'Asignar proyectos desafiantes', 'Mentoría']
            });
        }
        
        return recomendaciones;
    }

    /**
     * Analiza una bitácora completa
     * @param {Bitacora} bitacora - Bitácora a analizar
     * @returns {Promise<Object>} Análisis completo de la bitácora
     */
    async analizarBitacora(bitacora) {
        try {
            const analisisDetallado = {
                desafio: await this.analizarSentimiento(bitacora.respuesta_desafio || ''),
                logro: await this.analizarSentimiento(bitacora.respuesta_logro || ''),
                comunicacion: await this.analizarSentimiento(bitacora.respuesta_comunicacion || '')
            };

            // Calcular score promedio
            const scores = [
                analisisDetallado.desafio.score,
                analisisDetallado.logro.score,
                analisisDetallado.comunicacion.score
            ].filter(score => score !== 0);

            const scorePromedio = scores.length > 0 
                ? scores.reduce((a, b) => a + b, 0) / scores.length 
                : 0;

            // Calcular confianza general
            const confianzas = [
                analisisDetallado.desafio.confianza,
                analisisDetallado.logro.confianza,
                analisisDetallado.comunicacion.confianza
            ].filter(conf => conf > 0);

            const confianzaGeneral = confianzas.length > 0 
                ? confianzas.reduce((a, b) => a + b, 0) / confianzas.length 
                : 0.6;

            // Unificar contextos
            const contextosGenerales = this.unificarContextos([
                ...analisisDetallado.desafio.contextosDetectados,
                ...analisisDetallado.logro.contextosDetectados,
                ...analisisDetallado.comunicacion.contextosDetectados
            ]);

            // Generar recomendaciones
            const recomendaciones = this.generarRecomendaciones(scorePromedio, analisisDetallado);

            return {
                analisisDetallado,
                scorePromedio,
                sentimientoGeneral: this.clasificarSentimiento(scorePromedio),
                confianzaGeneral,
                contextosGenerales,
                recomendaciones,
                fechaAnalisis: new Date()
            };
        } catch (error) {
            console.error('Error al analizar bitácora:', error);
            // Retornar análisis neutral en caso de error
            return {
                analisisDetallado: {
                    desafio: this.resultadoNeutral(),
                    logro: this.resultadoNeutral(),
                    comunicacion: this.resultadoNeutral()
                },
                scorePromedio: 0,
                sentimientoGeneral: 'neutral',
                confianzaGeneral: 0,
                contextosGenerales: [],
                recomendaciones: [],
                fechaAnalisis: new Date()
            };
        }
    }

    /**
     * Analiza las tendencias de todas las bitácoras de un aprendiz
     * @param {Bitacora[]} bitacoras - Array de bitácoras del aprendiz
     * @returns {Promise<Object>} Análisis de tendencias
     */
    async analizarTendenciasAprendiz(bitacoras) {
        if (!bitacoras || bitacoras.length === 0) {
            return {
                scorePromedio: 0,
                sentimientoGeneral: 'neutral',
                tendencia: 'sin_datos',
                variabilidad: 0,
                nivelCompromiso: 0,
                recomendaciones: []
            };
        }

        const analisisBitacoras = [];
        const scores = [];

        for (const bitacora of bitacoras) {
            try {
                const analisis = await this.analizarBitacora(bitacora);
                analisisBitacoras.push(analisis);
                scores.push(analisis.scorePromedio);
            } catch (error) {
                console.error('Error analizando bitácora:', error);
            }
        }

        if (scores.length === 0) {
            return {
                scorePromedio: 0,
                sentimientoGeneral: 'neutral',
                tendencia: 'sin_datos',
                variabilidad: 0,
                nivelCompromiso: 0,
                recomendaciones: []
            };
        }

        const scorePromedio = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variabilidad = this.calcularVariabilidad(scores);
        const tendencia = this.determinarTendencia(scores);
        const nivelCompromiso = this.calcularNivelCompromiso(analisisBitacoras);

        return {
            scorePromedio,
            sentimientoGeneral: this.clasificarSentimiento(scorePromedio),
            tendencia,
            variabilidad,
            nivelCompromiso,
            recomendaciones: this.generarRecomendaciones(scorePromedio, variabilidad, nivelCompromiso),
            analisisDetallado: analisisBitacoras
        };
    }

    /**
     * Calcula la variabilidad de los scores
     * @param {number[]} scores - Array de scores
     * @returns {number} Variabilidad (0-1)
     */
    calcularVariabilidad(scores) {
        if (scores.length < 2) return 0;
        
        const media = scores.reduce((a, b) => a + b, 0) / scores.length;
        const varianza = scores.reduce((sum, score) => sum + Math.pow(score - media, 2), 0) / scores.length;
        const desviacion = Math.sqrt(varianza);
        
        return Math.min(1, desviacion / 5); // Normalizar a 0-1
    }

    /**
     * Determina la tendencia de los scores
     * @param {number[]} scores - Array de scores
     * @returns {string} Tendencia
     */
    determinarTendencia(scores) {
        if (scores.length < 3) return 'sin_datos';
        
        const mitad = Math.floor(scores.length / 2);
        const primeraMitad = scores.slice(0, mitad);
        const segundaMitad = scores.slice(mitad);
        
        const promedioPrimera = primeraMitad.reduce((a, b) => a + b, 0) / primeraMitad.length;
        const promedioSegunda = segundaMitad.reduce((a, b) => a + b, 0) / segundaMitad.length;
        
        const diferencia = promedioSegunda - promedioPrimera;
        
        if (diferencia > 0.5) return 'mejorando';
        if (diferencia < -0.5) return 'empeorando';
        return 'estable';
    }

    /**
     * Calcula el nivel de compromiso del aprendiz
     * @param {Array} analisisBitacoras - Análisis de todas las bitácoras
     * @returns {number} Nivel de compromiso (0-100)
     */
    calcularNivelCompromiso(analisisBitacoras) {
        if (analisisBitacoras.length === 0) return 0;
        
        let puntajeTotal = 0;
        let maxPuntaje = 0;
        
        analisisBitacoras.forEach(analisis => {
            // Puntaje por sentimiento general
            const puntajeSentimiento = Math.max(0, analisis.scorePromedio + 5) * 10; // 0-100
            
            // Puntaje por completitud de respuestas
            const respuestasCompletas = [
                analisis.analisisDetallado.desafio.score !== 0,
                analisis.analisisDetallado.logro.score !== 0,
                analisis.analisisDetallado.comunicacion.score !== 0
            ].filter(Boolean).length;
            
            const puntajeCompletitud = (respuestasCompletas / 3) * 30; // 0-30
            
            puntajeTotal += puntajeSentimiento + puntajeCompletitud;
            maxPuntaje += 130; // 100 + 30
        });
        
        return Math.round((puntajeTotal / maxPuntaje) * 100);
    }

    /**
     * Genera recomendaciones basadas en el análisis
     * @param {number} scorePromedio - Score promedio
     * @param {number} variabilidad - Variabilidad de scores
     * @param {number} nivelCompromiso - Nivel de compromiso
     * @returns {Array} Array de recomendaciones
     */
    generarRecomendaciones(scorePromedio, variabilidad, nivelCompromiso) {
        const recomendaciones = [];
        
        if (scorePromedio < -1) {
            recomendaciones.push({
                area: 'Bienestar Emocional',
                mensaje: 'El aprendiz muestra sentimientos negativos. Considera brindar apoyo adicional.',
                prioridad: 'alta',
                acciones: ['Entrevista personal', 'Apoyo psicológico', 'Ajuste de carga de trabajo']
            });
        }
        
        if (variabilidad > 0.7) {
            recomendaciones.push({
                area: 'Estabilidad Emocional',
                mensaje: 'Alta variabilidad en sentimientos. Monitoreo cercano recomendado.',
                prioridad: 'media',
                acciones: ['Seguimiento semanal', 'Comunicación frecuente', 'Identificar factores estresantes']
            });
        }
        
        if (nivelCompromiso < 50) {
            recomendaciones.push({
                area: 'Compromiso',
                mensaje: 'Bajo nivel de compromiso detectado. Revisar motivación y condiciones.',
                prioridad: 'alta',
                acciones: ['Revisar objetivos', 'Mejorar condiciones', 'Incentivos adicionales']
            });
        }
        
        return recomendaciones;
    }

    /**
     * Retorna un resultado neutral
     * @returns {ResultadoAnalisis} Resultado neutral
     */
    resultadoNeutral() {
        return {
            score: 0,
            comparativo: 0,
            palabras: { positiva: [], negativa: [] },
            frasesDetectadas: [],
            sentimiento: 'neutral',
            intensidad: 1,
            confianza: 0,
            contieneIronia: false,
            contextosDetectados: [],
            emociones: {},
            entidades: [],
            palabrasClave: []
        };
    }

    /**
     * Verifica el estado de la conexión con Watson
     * @returns {Object} Estado de la conexión
     */
    obtenerEstadoConexion() {
        return {
            watsonDisponible: this.watson !== null,
            configuracionValida: esConfiguracionValida(),
            usoWatson: this.config.useWatson,
            configuracion: this.config
        };
    }
}

module.exports = ServicioWatsonSentimientos; 