// src/configuracion/watsonConfig.js
// Configuración para IBM Watson Natural Language Understanding

require('dotenv').config();

const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

/**
 * Configuración de IBM Watson Natural Language Understanding
 * Para obtener las credenciales:
 * 1. Ve a https://cloud.ibm.com/apis/natural-language-understanding
 * 2. Crea una nueva instancia del servicio
 * 3. Obtén la API Key y Service URL
 */

const watsonConfig = {
    // Configuración de autenticación
    apiKey: process.env.WATSON_API_KEY || 'tu_api_key_aqui',
    serviceUrl: process.env.WATSON_SERVICE_URL || 'https://api.us-south.natural-language-understanding.watson.cloud.ibm.com/instances/tu_instance_id',
    version: process.env.WATSON_VERSION || '2022-04-07',
    
    // Configuración de uso
    useWatson: process.env.USE_WATSON_SENTIMENT_ANALYSIS === 'true' || false,
    
    // Configuración de análisis
    features: {
        sentiment: {
            targets: [
                'aprendizaje', 'equipo', 'proyecto', 'instructor', 'empresa',
                'tecnología', 'programación', 'desarrollo', 'comunicación',
                'ambiente', 'presión', 'apoyo', 'progreso', 'dificultad'
            ]
        },
        emotion: {
            targets: [
                'felicidad', 'tristeza', 'ira', 'miedo', 'sorpresa',
                'disgusto', 'orgullo', 'vergüenza', 'confianza', 'ansiedad'
            ]
        },
        entities: {
            sentiment: true,
            emotion: true,
            limit: 10
        },
        keywords: {
            sentiment: true,
            emotion: true,
            limit: 10
        }
    },
    
    // Configuración de idioma
    language: 'es',
    
    // Configuración de límites
    maxTextLength: 50000, // Máximo 50KB por análisis
    
    // Configuración de reintentos
    maxRetries: 3,
    retryDelay: 1000, // 1 segundo
};

/**
 * Crea una instancia autenticada de Watson NLU
 * @returns {NaturalLanguageUnderstandingV1} Instancia configurada
 */
function crearInstanciaWatson() {
    try {
        const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
            version: watsonConfig.version,
            authenticator: new IamAuthenticator({
                apikey: watsonConfig.apiKey,
            }),
            serviceUrl: watsonConfig.serviceUrl,
        });
        
        return naturalLanguageUnderstanding;
    } catch (error) {
        console.error('Error al crear instancia de Watson:', error);
        return null;
    }
}

/**
 * Verifica si la configuración de Watson es válida
 * @returns {boolean} True si la configuración es válida
 */
function esConfiguracionValida() {
    return watsonConfig.apiKey && 
           watsonConfig.apiKey !== 'tu_api_key_aqui' &&
           watsonConfig.serviceUrl && 
           watsonConfig.serviceUrl !== 'https://api.us-south.natural-language-understanding.watson.cloud.ibm.com/instances/tu_instance_id';
}

/**
 * Obtiene la configuración de Watson
 * @returns {Object} Configuración completa
 */
function obtenerConfiguracion() {
    return watsonConfig;
}

module.exports = {
    watsonConfig,
    crearInstanciaWatson,
    esConfiguracionValida,
    obtenerConfiguracion
}; 