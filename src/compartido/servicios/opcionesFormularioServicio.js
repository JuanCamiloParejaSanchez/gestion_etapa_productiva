/**
 * Servicio Centralizado de Opciones del Formulario
 * 
 * Este servicio proporciona una única fuente de verdad para todas las opciones
 * de los campos select del formulario de registro de aprendices.
 * 
 * Mantiene sincronizadas las opciones entre:
 * - Formulario de registro (registroInicial.ejs)
 * - Filtros de tablas (listarAprendices.ejs, aprendicesDocsPendientes.ejs)
 * - Validaciones del backend
 */

const opcionesFormularioServicio = {
    /**
     * Opciones para el campo Tipo de Documento
     */
    tipoDocumento: [
        { value: 'CC', label: 'CÉDULA DE CIUDADANÍA' },
        { value: 'TI', label: 'TARJETA DE IDENTIDAD' },
        { value: 'CE', label: 'CÉDULA DE EXTRANJERÍA' },
        { value: 'PEP', label: 'PERMISO ESPECIAL DE PERMANENCIA' },
        { value: 'PPT', label: 'PERMISO DE PROTECCIÓN TEMPORAL' },
        { value: 'RU', label: 'REGISTRO ÚNICO' }
    ],

    /**
     * Opciones para el campo Género
     */
    genero: [
        { value: 'MASCULINO', label: 'MASCULINO' },
        { value: 'FEMENINO', label: 'FEMENINO' },
        { value: 'TRANSEXUAL', label: 'TRANSEXUAL' },
        { value: 'NO BINARIO', label: 'NO BINARIO' },
        { value: 'OTROS', label: 'OTROS' }
    ],

    /**
     * Opciones para el campo EPS
     */
    eps: [
        { value: 'COMFAMILIAR CARTAGENA', label: 'COMFAMILIAR CARTAGENA' },
        { value: 'CAJA DE COMPENSACIÓN FAMILIAR DE NARIÑO', label: 'CAJA DE COMPENSACIÓN FAMILIAR DE NARIÑO' },
        { value: 'COMFAORIENTE', label: 'COMFAORIENTE' },
        { value: 'CAJA DE COMPENSACIÓN FAMILIAR DEL CHOCÓ', label: 'CAJA DE COMPENSACIÓN FAMILIAR DEL CHOCÓ' },
        { value: 'COMFABOY', label: 'COMFABOY' },
        { value: 'CCF COLSUBSIDIO', label: 'CCF COLSUBSIDIO' },
        { value: 'CCF DE CORDOBA COMFACOR EPS-S', label: 'CCF DE CORDOBA COMFACOR EPS-S' },
        { value: 'CAFAM EPS REGIMEN SUBSIDIADO', label: 'CAFAM EPS REGIMEN SUBSIDIADO' },
        { value: 'CCF DEL CHOCO COMFACHOCO EPSS', label: 'CCF DEL CHOCO COMFACHOCO EPSS' },
        { value: 'CCF DE LA GUAJIRA', label: 'CCF DE LA GUAJIRA' },
        { value: 'COMFAMILIAR HUILA', label: 'COMFAMILIAR HUILA' },
        { value: 'COMFAMILIAR NARIÑO', label: 'COMFAMILIAR NARIÑO' },
        { value: 'COMFAMILIAR SUCRE', label: 'COMFAMILIAR SUCRE' },
        { value: 'COMFACUNDI', label: 'COMFACUNDI' },
        { value: 'CAJACOPI EPS', label: 'CAJACOPI EPS' },
        { value: 'EMPRESAS PUBLICAS DE MEDELLIN', label: 'EMPRESAS PUBLICAS DE MEDELLIN' },
        { value: 'FONDO DE PASIVO SOCIAL DE LOS FERROCARRILES NACIONALES', label: 'FONDO DE PASIVO SOCIAL DE LOS FERROCARRILES NACIONALES' },
        { value: 'COLMEDICA E.P.S. - ALIANSALUD', label: 'COLMEDICA E.P.S. - ALIANSALUD' },
        { value: 'SALUD TOTAL S.A. E.P.S.', label: 'SALUD TOTAL S.A. E.P.S.' },
        { value: 'E.P.S. SANITAS S.A.', label: 'E.P.S. SANITAS S.A.' },
        { value: 'COMPENSAR E.P.S.', label: 'COMPENSAR E.P.S.' },
        { value: 'E.P.S. PROGRAMA COMFENALCO ANTIOQUIA', label: 'E.P.S. PROGRAMA COMFENALCO ANTIOQUIA' },
        { value: 'SUSALUD - SURA - SURAMERICANA E.P.S.', label: 'SUSALUD - SURA - SURAMERICANA E.P.S.' },
        { value: 'COMFENALCO VALLE E.P.S.', label: 'COMFENALCO VALLE E.P.S.' },
        { value: 'HUMANA - VIVIR S.A. E.P.S.', label: 'HUMANA - VIVIR S.A. E.P.S.' },
        { value: 'SALUD COLPATRIA E.P.S.', label: 'SALUD COLPATRIA E.P.S.' },
        { value: 'COOMEVA E.P.S. S.A.', label: 'COOMEVA E.P.S. S.A.' },
        { value: 'E.P.S. FAMISANAR LIMITADA CAFAM-COLSUBSIDIO', label: 'E.P.S. FAMISANAR LIMITADA CAFAM-COLSUBSIDIO' },
        { value: 'E.P.S. SERVICIO OCCIDENTAL DE SALUD S.A. S.O.S.', label: 'E.P.S. SERVICIO OCCIDENTAL DE SALUD S.A. S.O.S.' },
        { value: 'CRUZ BLANCA E.P.S. S.A.', label: 'CRUZ BLANCA E.P.S. S.A.' },
        { value: 'SOLSALUD E.P.S. S.A.', label: 'SOLSALUD E.P.S. S.A.' },
        { value: 'SELVASALUD S.A. E.P.S.', label: 'SELVASALUD S.A. E.P.S.' },
        { value: 'SALUDVIDA S.A. E.P.S.', label: 'SALUDVIDA S.A. E.P.S.' },
        { value: 'NUEVA EPS', label: 'NUEVA EPS' },
        { value: 'GOLDEN GROUP', label: 'GOLDEN GROUP' },
        { value: 'SAVIA SALUD EPS', label: 'SAVIA SALUD EPS' },
        { value: 'MEDIMAS EPS S.A.S', label: 'MEDIMAS EPS S.A.S' },
        { value: 'FUNDACION SALUDMIA EPS', label: 'FUNDACION SALUDMIA EPS' },
        { value: 'UNISALUD', label: 'UNISALUD' },
        { value: 'FOSYGA - ADRES', label: 'FOSYGA - ADRES' },
        { value: 'EPS CAPRECOM', label: 'EPS CAPRECOM' },
        { value: 'CONVIDA', label: 'CONVIDA' },
        { value: 'CAPRESOCA EPS', label: 'CAPRESOCA EPS' },
        { value: 'CAPITAL SALUD', label: 'CAPITAL SALUD' },
        { value: 'MALLAMAS EPS INDIGENA', label: 'MALLAMAS EPS INDIGENA' },
        { value: 'DUSAKAWI EPSI', label: 'DUSAKAWI EPSI' },
        { value: 'MANEXKA EPS INDIGENA', label: 'MANEXKA EPS INDIGENA' },
        { value: 'ASOCIACION INDIGENA DEL CAUCA', label: 'ASOCIACION INDIGENA DEL CAUCA' },
        { value: 'ANASWAYUU', label: 'ANASWAYUU' },
        { value: 'MALLAMAS', label: 'MALLAMAS' },
        { value: 'PIJAOS SALUD EPSI', label: 'PIJAOS SALUD EPSI' },
        { value: 'EMDISALUD', label: 'EMDISALUD' },
        { value: 'ASOCIACIÓN MUTUAL SER EMPRESA SOLIDARIA DE SALUD A.R.S.', label: 'ASOCIACIÓN MUTUAL SER EMPRESA SOLIDARIA DE SALUD A.R.S.' },
        { value: 'ASOCIACION MUTUAL EMPRESA SOLIDARIA DE SALUD EMSSANAR EPS', label: 'ASOCIACION MUTUAL EMPRESA SOLIDARIA DE SALUD EMSSANAR EPS' },
        { value: 'COOSALUD', label: 'COOSALUD' },
        { value: 'COMPARTA EPS-S', label: 'COMPARTA EPS-S' },
        { value: 'ASMET SALUD', label: 'ASMET SALUD' },
        { value: 'AMBUQ EPS ESS', label: 'AMBUQ EPS ESS' },
        { value: 'ECOOPSOS', label: 'ECOOPSOS' },
        { value: 'EPS UNIVERSIDAD DE ANTIOQUIA', label: 'EPS UNIVERSIDAD DE ANTIOQUIA' },
        { value: 'NO APLICA', label: 'NO APLICA' }
    ],

    /**
     * Opciones para el campo Programa de Formación
     */
    programaFormacion: [
        { value: 'tecProgramasDeportivos', label: 'TÉCNICO EN EJECUCIÓN DE PROGRAMAS DEPORTIVOS' },
        { value: 'tecRecreComunitaria', label: 'TÉCNICO EN RECREACIÓN COMUNITARIA' },
        { value: 'tecOperativoRescateAcuatico', label: 'TÉCNICO OPERATIVO EN RESCATE ACUÁTICO EN AGUAS CONFINADAS' },
        { value: 'tecProcesamientoPruebas', label: 'TÉCNICO EN PROCESAMIENTO DE PRUEBAS DE SOFTWARE' },
        { value: 'tecProgramacion', label: 'TÉCNICO EN PROGRAMACIÓN DE SOFTWARE' },
        { value: 'tecProgramacionMoviles', label: 'TÉCNICO EN PROGRAMACIÓN DE APLICACIONES PARA DISPOSITIVOS MÓVILES' },
        { value: 'tecSeguridadWeb', label: 'TÉCNICO EN SEGURIDAD DE APLICACIONES WEB' },
        { value: 'tecnoEntrenaFutbol', label: 'TECNOLOGÍA EN ENTRENAMIENTO Y FORMACIÓN EN FÚTBOL' },
        { value: 'tecnoGestionServiciosRecreativos', label: 'TECNOLOGÍA EN GESTIÓN DE SERVICIOS RECREATIVOS' },
        { value: 'tecnoActividadFisica', label: 'TECNOLOGÍA EN ACTIVIDAD FÍSICA' },
        { value: 'tecnoEntrenamientoDeportivo', label: 'TECNOLOGÍA EN ENTRENAMIENTO DEPORTIVO' },
        { value: 'tecnoAnalisisDesarrollo', label: 'TECNOLOGÍA EN ANÁLISIS Y DESARROLLO DE SOFTWARE' },
        { value: 'tecnoProcesosLogisticos', label: 'TECNOLOGÍA EN COORDINACIÓN DE PROCESOS LOGÍSTICOS' }
    ],

    /**
     * Opciones para el campo Alternativa Seleccionada
     */
    alternativaSeleccionada: [
        { value: 'contratoAprendizaje', label: 'CONTRATO DE APRENDIZAJE' },
        { value: 'pasantia', label: 'VÍNCULO FORMATIVO' },
        { value: 'vinculoLaboral', label: 'VÍNCULO LABORAL' },
        { value: 'proyectosProductivos', label: 'PROYECTOS PRODUCTIVOS' },
        { value: 'monitoria', label: 'MONITORÍA' }
    ],

    /**
     * Opciones para el campo Área de Formación
     */
    areaFormacion: [
        { value: 'SI', label: 'SÍ' },
        { value: 'NO', label: 'NO' }
    ],

    /**
     * Opciones para el campo Estado de Formación
     */
    estadoFormacion: [
        { value: 'activo', label: 'ACTIVO' },
        { value: 'inactivo', label: 'INACTIVO (PROCESO DE CANCELACIÓN)' },
        { value: 'aplazado', label: 'APLAZADO' },
        { value: 'retirado', label: 'RETIRADO O CANCELADO' },
        { value: 'por certificar', label: 'POR CERTIFICAR' },
        { value: 'certificado', label: 'CERTIFICADO' }
    ],

    /**
     * Obtener todas las opciones en un formato compatible con el frontend
     * @returns {Object} Objeto con todas las opciones
     */
    obtenerTodasLasOpciones() {
        return {
            tipoDocumento: this.tipoDocumento,
            genero: this.genero,
            eps: this.eps,
            programaFormacion: this.programaFormacion,
            alternativaSeleccionada: this.alternativaSeleccionada,
            areaFormacion: this.areaFormacion,
            estadoFormacion: this.estadoFormacion
        };
    },

    /**
     * Obtener opciones por nombre de campo
     * @param {string} campo - Nombre del campo
     * @returns {Array} Array de opciones
     */
    obtenerOpcionesPorCampo(campo) {
        return this[campo] || [];
    },

    /**
     * Validar si un valor es válido para un campo específico
     * @param {string} campo - Nombre del campo
     * @param {string} valor - Valor a validar
     * @returns {boolean} True si el valor es válido
     */
    esValorValido(campo, valor) {
        const opciones = this.obtenerOpcionesPorCampo(campo);
        return opciones.some(opcion => opcion.value === valor);
    },

    /**
     * Obtener label de un valor específico
     * @param {string} campo - Nombre del campo
     * @param {string} valor - Valor del que se quiere obtener el label
     * @returns {string|null} Label del valor o null si no se encuentra
     */
    obtenerLabel(campo, valor) {
        const opciones = this.obtenerOpcionesPorCampo(campo);
        const opcion = opciones.find(opt => opt.value === valor);
        return opcion ? opcion.label : null;
    }
};

module.exports = opcionesFormularioServicio;
