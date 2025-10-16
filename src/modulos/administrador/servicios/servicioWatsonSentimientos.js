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
        this.cache = new Map(); // Cache para resultados de Watson
        this.lastRequestTime = 0; // Timestamp de último request
        this.minDelay = 200; // Delay mínimo entre requests (200ms)
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
                throw new Error('IBM Watson no se pudo inicializar. Verifique la configuración.');
            }
        } else {
            throw new Error('IBM Watson no está configurado. Configure las credenciales de Watson para usar el análisis de sentimientos.');
        }
    }

    /**
     * Analiza el sentimiento de un texto usando IBM Watson con optimizaciones
     * @param {string} texto - Texto a analizar
     * @returns {Promise<ResultadoWatson|null>} Resultado del análisis o null si hay error
     */
    async analizarConWatson(texto) {
        if (!this.watson || !texto || texto.trim().length === 0) {
            return null;
        }

        // Verificar cache primero
        const cacheKey = this.generarCacheKey(texto);
        if (this.cache.has(cacheKey)) {
            console.log('✅ Usando resultado del cache para Watson');
            return this.cache.get(cacheKey);
        }

        // Aplicar delay mínimo entre requests
        await this.aplicarDelayMinimo();

        try {
            // Limitar el texto si es muy largo (optimización)
            const textoLimitado = texto.length > this.config.maxTextLength
                ? texto.substring(0, this.config.maxTextLength)
                : texto;

            // Optimización: usar solo las features necesarias y reducir complejidad
            const analyzeParams = {
                text: textoLimitado,
                language: this.config.language,
                features: {
                    sentiment: {}, // Solo análisis de sentimiento básico
                    emotion: { document: true }, // Solo emociones del documento
                    keywords: { limit: 3, sentiment: false, emotion: false } // Reducir a 3 keywords sin análisis adicional
                }
            };

            const resultado = await this.watson.analyze(analyzeParams);
            this.lastRequestTime = Date.now(); // Actualizar timestamp

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

            const resultadoAnalisis = {
                score: this.mapearScoreWatson(sentiment.document.score || 0),
                label: sentiment.document.label || 'neutral',
                emotions: emotion?.document?.emotion || {},
                entities: entities,
                keywords: keywords
            };

            // Guardar en cache
            this.cache.set(cacheKey, resultadoAnalisis);

            return resultadoAnalisis;
        } catch (error) {
            console.error('Error en análisis de Watson:', error);

            // Si es error 429 (Too Many Requests), esperar y retornar resultado neutral
            if (error.status === 429) {
                console.log('⏳ Límite de API alcanzado. Usando análisis neutral para continuar...');
                await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos mínimo
                const resultadoNeutral = {
                    score: 0, // Score neutral
                    label: 'neutral',
                    emotions: { joy: 0, sadness: 0, anger: 0, fear: 0, disgust: 0 },
                    entities: [],
                    keywords: []
                };
                // Guardar resultado neutral en cache para evitar reintentos
                this.cache.set(cacheKey, resultadoNeutral);
                return resultadoNeutral;
            }

            return null;
        }
    }

    /**
     * Genera una clave de cache para el texto
     * @param {string} texto - Texto a cachear
     * @returns {string} Clave de cache
     */
    generarCacheKey(texto) {
        // Crear hash simple del texto para la clave
        let hash = 0;
        for (let i = 0; i < texto.length; i++) {
            const char = texto.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir a 32 bits
        }
        return `watson_${Math.abs(hash)}`;
    }

    /**
     * Aplica delay mínimo entre requests para evitar saturar la API
     */
    async aplicarDelayMinimo() {
        const tiempoTranscurrido = Date.now() - this.lastRequestTime;
        if (tiempoTranscurrido < this.minDelay) {
            const delayNecesario = this.minDelay - tiempoTranscurrido;
            await new Promise(resolve => setTimeout(resolve, delayNecesario));
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
     * Analiza el sentimiento de un texto usando únicamente IBM Watson
     * @param {string} texto - Texto a analizar
     * @returns {Promise<ResultadoAnalisis>} Resultado del análisis
     */
    async analizarSentimiento(texto) {
        if (!texto || typeof texto !== 'string') {
            return this.resultadoNeutral();
        }

        // Verificar que Watson esté disponible
        if (!this.watson) {
            console.warn('IBM Watson no está disponible. Usando análisis neutral.');
            return this.resultadoNeutral();
        }

        // Analizar únicamente con Watson
        const resultadoWatson = await this.analizarConWatson(texto);

        if (!resultadoWatson) {
            console.warn('Error en el análisis con IBM Watson. Usando análisis neutral.');
            return this.resultadoNeutral();
        }

        // Retornar resultados de Watson sin combinación con análisis local
        return this.procesarResultadoWatson(texto, resultadoWatson);
    }


    /**
     * Procesa los resultados simplificados de Watson enfocados en métricas clave
     * @param {string} texto - Texto original
     * @param {ResultadoWatson} resultadoWatson - Resultado de Watson
     * @returns {ResultadoAnalisis} Resultado procesado simplificado
     */
    procesarResultadoWatson(texto, resultadoWatson) {
        const score = resultadoWatson.score;
        const emociones = resultadoWatson.emotions;
        const entidades = resultadoWatson.entities;
        const palabrasClave = resultadoWatson.keywords;

        // Calcular confianza simplificada
        const confianza = Math.min(0.95, 0.7 + (palabrasClave.length * 0.05));

        // Contextos simplificados
        const contextosDetectados = entidades
            .map(entity => entity.type)
            .filter((contexto, index, arr) => arr.indexOf(contexto) === index);

        return {
            score: score,
            comparativo: score,
            palabras: { positiva: [], negativa: [] }, // Simplificado
            frasesDetectadas: [],
            sentimiento: this.clasificarSentimiento(score),
            intensidad: Math.abs(score),
            confianza: confianza,
            contieneIronia: false, // Simplificado
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
     * Genera recomendaciones simplificadas basadas en métricas clave
     * @param {number} score - Score de sentimiento
     * @param {number} compromiso - Nivel de compromiso
     * @param {string} tendencia - Tendencia del estado
     * @returns {Array} Array de recomendaciones simplificadas
     */
    generarRecomendacionesSimplificadas(score, compromiso, tendencia) {
        const recomendaciones = [];

        // Recomendaciones basadas en estado crítico
        if (score < -1) {
            recomendaciones.push({
                icono: 'fas fa-user-friends',
                texto: 'Programar reunión personal con el aprendiz',
                prioridad: 'danger'
            });
        }

        // Recomendaciones basadas en compromiso bajo
        if (compromiso < 50) {
            recomendaciones.push({
                icono: 'fas fa-tasks',
                texto: 'Revisar carga de trabajo y motivación',
                prioridad: 'warning'
            });
        }

        // Recomendaciones basadas en tendencia negativa
        if (tendencia === 'empeorando') {
            recomendaciones.push({
                icono: 'fas fa-search',
                texto: 'Identificar factores de estrés',
                prioridad: 'warning'
            });
        }

        // Recomendaciones positivas
        if (score >= 2 && compromiso >= 70) {
            recomendaciones.push({
                icono: 'fas fa-star',
                texto: 'Reconocer buen desempeño',
                prioridad: 'success'
            });
        }

        // Recomendación por defecto
        if (recomendaciones.length === 0) {
            recomendaciones.push({
                icono: 'fas fa-check-circle',
                texto: 'Mantener seguimiento regular',
                prioridad: 'info'
            });
        }

        return recomendaciones;
    }

    /**
     * Analiza una bitácora completa usando Watson optimizado
     * @param {Bitacora} bitacora - Bitácora a analizar
     * @returns {Promise<Object>} Análisis completo de la bitácora
     */
    async analizarBitacora(bitacora) {
        try {
            // Verificar que Watson esté disponible antes de procesar
            if (!this.watson) {
                console.warn('IBM Watson no está disponible. Usando análisis neutral para bitácora.');
                return this.analisisNeutralBitacora();
            }

            // OPTIMIZACIÓN: Combinar las 3 respuestas en un solo análisis para reducir requests
            const textoCompleto = [
                bitacora.respuesta_desafio || '',
                bitacora.respuesta_logro || '',
                bitacora.respuesta_comunicacion || ''
            ].join(' ').trim();

            if (!textoCompleto) {
                return this.analisisNeutralBitacora();
            }

            // Un solo análisis para toda la bitácora (reduce de 3 a 1 request)
            const analisisCompleto = await this.analizarSentimiento(textoCompleto);

            // Distribuir el resultado a las 3 categorías (aproximación)
            const analisisDetallado = {
                desafio: { ...analisisCompleto, score: analisisCompleto.score * 0.9 }, // Ligeramente ajustado
                logro: analisisCompleto,
                comunicacion: { ...analisisCompleto, score: analisisCompleto.score * 1.1 } // Ligeramente ajustado
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

            // Calcular confianza general (mejorada con análisis combinado)
            const confianzaGeneral = Math.min(0.95, analisisCompleto.confianza + 0.1); // Bonus por análisis combinado

            // Contextos del análisis combinado
            const contextosGenerales = analisisCompleto.contextosDetectados || [];

            // Generar recomendaciones simplificadas
            const recomendaciones = this.generarRecomendacionesSimplificadas(
                scorePromedio,
                Math.round(confianzaGeneral * 100),
                this.determinarTendencia([scorePromedio])
            );

            return {
                analisisDetallado,
                scorePromedio,
                sentimientoGeneral: this.clasificarSentimiento(scorePromedio),
                confianzaGeneral,
                contextosGenerales,
                recomendaciones,
                fechaAnalisis: new Date(),
                nivelCompromiso: Math.round(confianzaGeneral * 100),
                tendencia: this.determinarTendencia([scorePromedio])
            };
        } catch (error) {
            console.error('Error al analizar bitácora con Watson:', error);
            console.warn('Usando análisis neutral para continuar...');
            return this.analisisNeutralBitacora();
        }
    }

    /**
     * Retorna un análisis neutral para bitácora cuando Watson no está disponible
     * @returns {Object} Análisis neutral
     */
    analisisNeutralBitacora() {
        const analisisNeutral = this.resultadoNeutral();
        return {
            analisisDetallado: {
                desafio: analisisNeutral,
                logro: analisisNeutral,
                comunicacion: analisisNeutral
            },
            scorePromedio: 0,
            sentimientoGeneral: 'neutral',
            confianzaGeneral: 0.5,
            contextosGenerales: [],
            recomendaciones: this.generarRecomendacionesSimplificadas(0, 50, 'estable'),
            fechaAnalisis: new Date(),
            nivelCompromiso: 50,
            tendencia: 'estable'
        };
    }

    /**
     * Analiza las tendencias de todas las bitácoras de un aprendiz usando únicamente Watson
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

        // Verificar que Watson esté disponible
        if (!this.watson) {
            console.warn('IBM Watson no está disponible para el análisis de tendencias. Retornando análisis vacío.');
            return {
                scorePromedio: 0,
                sentimientoGeneral: 'neutral',
                tendencia: 'sin_datos',
                variabilidad: 0,
                nivelCompromiso: 0,
                recomendaciones: []
            };
        }

        // Procesar máximo 10 bitácoras más recientes para evitar sobrecarga
        const bitacorasLimitadas = bitacoras.slice(-10);
        const analisisBitacoras = [];
        const scores = [];

        for (const bitacora of bitacorasLimitadas) {
            try {
                const analisis = await this.analizarBitacora(bitacora);
                analisisBitacoras.push(analisis);
                scores.push(analisis.scorePromedio);
            } catch (error) {
                console.error('Error analizando bitácora con Watson:', error);

                // Si es error 429, esperar y continuar con análisis neutral
                if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('Too Many Requests')) {
                    console.log('⏳ Límite de API alcanzado. Usando análisis neutral para continuar...');
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos

                    // Crear análisis neutral para continuar
                    const analisisNeutral = {
                        analisisDetallado: {
                            desafio: this.resultadoNeutral(),
                            logro: this.resultadoNeutral(),
                            comunicacion: this.resultadoNeutral()
                        },
                        scorePromedio: 0,
                        sentimientoGeneral: 'neutral',
                        confianzaGeneral: 0.5,
                        contextosGenerales: [],
                        recomendaciones: this.generarRecomendacionesSimplificadas(0, 50, 'estable'),
                        fechaAnalisis: new Date(),
                        nivelCompromiso: 50,
                        tendencia: 'estable'
                    };

                    analisisBitacoras.push(analisisNeutral);
                    scores.push(0);
                    continue; // Continuar con la siguiente bitácora
                }

                throw error; // Re-lanzar otros errores
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

        // Generar recomendaciones simplificadas
        const recomendaciones = this.generarRecomendacionesSimplificadas(
            scorePromedio,
            nivelCompromiso,
            tendencia
        );

        return {
            scorePromedio,
            sentimientoGeneral: this.clasificarSentimiento(scorePromedio),
            tendencia,
            variabilidad,
            nivelCompromiso,
            recomendaciones,
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
            configuracion: this.config,
            cacheSize: this.cache.size,
            lastRequestTime: this.lastRequestTime,
            minDelay: this.minDelay
        };
    }

    /**
     * Limpia el cache de resultados (útil para desarrollo)
     */
    limpiarCache() {
        this.cache.clear();
        console.log('🧹 Cache de Watson limpiado');
    }
}

module.exports = ServicioWatsonSentimientos; 