// Ruta: src/compartido/utilidades/utilValidaciones.js
// Propósito: Utilidades para validación y limpieza de campos de formularios

/**
 * Constantes de Validación
 */
const REGEX = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    documento: /^\d{8,12}$/,
    celular: /^\d{10}$/,
    texto: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
};

/**
 * Alternativas de etapa productiva
 */
const ALTERNATIVAS = {
    CONTRATO: 'contratoAprendizaje',
    PASANTIA: 'pasantia',
    VINCULO_FORMATIVO: 'vinculoFormativo',
    APOYO: 'apoyoEntidades',
    VINCULO: 'vinculoLaboral',
    PROYECTOS: 'proyectosProductivos',
    MONITORIA: 'monitoria',
    UNIDADES: 'unidadesProductivas'
};

/**
 * Elimina campos vacíos de un objeto
 * @param {Object} objeto - Objeto a limpiar
 * @returns {Object} Objeto sin campos vacíos
 */
function eliminarCamposVacios(objeto) {
    const objetoLimpio = {};
    Object.keys(objeto).forEach(key => {
        if (objeto[key] !== null && objeto[key] !== undefined && objeto[key] !== '') {
            objetoLimpio[key] = objeto[key];
        }
    });
    return objetoLimpio;
}

/**
 * Sanitiza campos de texto
 * @param {string} texto - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
function sanitizarTexto(texto) {
    if (!texto) return '';
    return texto
        .trim()
        .replace(/[<>]/g, '') // Elimina < y >
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Válida un correo electrónico
 * @param {string} email - Correo electrónico a validar
 * @returns {boolean} True si el correo es válido
 */
function validarEmail(email) {
    return REGEX.email.test(email);
}

/**
 * Mapea valores de alternativa de etapa productiva
 */
const mapeoAlternativas = {
    'contrato': ALTERNATIVAS.CONTRATO,
    'pasantia': ALTERNATIVAS.PASANTIA,
    'vinculoFormativo': ALTERNATIVAS.VINCULO_FORMATIVO,
    'apoyo': ALTERNATIVAS.APOYO,
    'vinculo': ALTERNATIVAS.VINCULO,
    'proyectos': ALTERNATIVAS.PROYECTOS,
    'monitoria': ALTERNATIVAS.MONITORIA,
    'unidades': ALTERNATIVAS.UNIDADES
};

/**
 * Mapea una alternativa a su valor normalizado
 * @param {string} alternativa - Alternativa a mapear
 * @returns {string} Alternativa mapeada
 */
function mapearAlternativa(alternativa) {
    return mapeoAlternativas[alternativa] || alternativa;
}

module.exports = {
    REGEX,
    ALTERNATIVAS,
    eliminarCamposVacios,
    sanitizarTexto,
    validarEmail,
    mapearAlternativa,
    mapeoAlternativas
};