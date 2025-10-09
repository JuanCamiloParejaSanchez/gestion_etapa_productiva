const servicioAlertas = require('../servicios/servicioAlertas');
const ServicioAprendiz = require('../../modulos/aprendiz/servicios/servicioAprendiz');
const servicioAprendiz = new ServicioAprendiz();
const servicioDocumentosAprendiz = require('../../modulos/aprendiz/servicios/servicioDocumentosAprendiz');

// Lista de documentos obligatorios para cada aprendiz
const DOCUMENTOS_OBLIGATORIOS = [
  'Bitácora 1', 'Bitácora 2', 'Bitácora 3', 'Bitácora 4', 'Bitácora 5', 'Bitácora 6',
  'Bitácora 7', 'Bitácora 8', 'Bitácora 9', 'Bitácora 10', 'Bitácora 11', 'Bitácora 12',
  'Propuesta de intervención', 'Diagnóstico', 'GFPI-F-023 V5'
];

const NOMBRES_PROGRAMAS = {
    'tecnoActividadFisica': 'Tec. Actividad Física',
    'tecnoEntrenamientoDeportivo': 'Tec. Entrenamiento Deportivo',
    'tecnoAnalisisDesarrollo': 'Tec. Análisis y Desarrollo',
    'tecProcesamientoPruebas': 'Téc. Pruebas de Software',
    'tecProgramacion': 'Téc. Programación de Software',
    'default': 'No especificado'
};
const NOMBRES_ALTERNATIVAS = {
    'contratoAprendizaje': 'Contrato de Aprendizaje',
    'pasantia': 'Pasantía',
    'apoyoEntidades': 'Apoyo a Entidades',
    'vinculoLaboral': 'Vínculo Laboral',
    'proyectosProductivos': 'Proyectos Productivos',
    'monitoria': 'Monitoria',
    'unidadesProductivas': 'Unidades Productivas',
    'default': 'No especificada'
};

exports.verAlertasPorTipo = async (req, res) => {
  const tipo = req.params.tipo;
  const alertas = await servicioAlertas.obtenerAlertasAdministrador();
  let lista = [];

  if (tipo === 'bitacora') {
    // Documentos pendientes del aprendiz: igual que antes
    const regexId = /\((\d+)\)/;
    const alertasTipo = alertas[tipo] || [];
    const aprendicesInfo = [];
    for (const alerta of alertasTipo) {
      const match = alerta.mensaje.match(regexId);
      if (match) {
        const numeroDocumento = match[1];
        const aprendizData = await buscarAprendizPorNumeroDocumento(numeroDocumento);
        if (aprendizData) {
          aprendicesInfo.push({
            id: aprendizData.id,
            nombre: `${aprendizData.nombres} ${aprendizData.primerApellido} ${aprendizData.segundoApellido || ''}`.trim(),
            programa: NOMBRES_PROGRAMAS[aprendizData.programaFormacion] || aprendizData.programaFormacion || 'No especificado',
            etapa: NOMBRES_ALTERNATIVAS[aprendizData.alternativaSeleccionada] || aprendizData.alternativaSeleccionada || 'No especificada',
            correo: aprendizData.correoElectronico || '',
            telefono: aprendizData.celular || aprendizData.telefonoFijo || '',
            documento: aprendizData.numeroDocumento || '',
            mensaje: alerta.mensaje
          });
        } else {
          aprendicesInfo.push({
            nombre: 'No encontrado', programa: '', etapa: '', correo: '', telefono: '', documento: numeroDocumento, mensaje: alerta.mensaje
          });
        }
      } else {
        aprendicesInfo.push({ nombre: '', programa: '', etapa: '', correo: '', telefono: '', mensaje: alerta.mensaje });
      }
    }
    lista = aprendicesInfo;
  } else {
    // Si se accede a un tipo no válido, redirigir a bitácoras
    return res.redirect('/administrador/alertas/bitacora');
  }
  
  res.render('administrador/aprendicesDocsPendientes', { tipo, lista, layout: 'plantillas/principal' });
};

// Nuevo endpoint: obtener documentos subidos y faltantes de un aprendiz
exports.obtenerDocumentosPendientes = async (req, res) => {
  try {
    const aprendizId = req.params.id;
    if (!aprendizId) {
      return res.status(400).json({ success: false, message: 'ID de aprendiz requerido.' });
    }
    const documentos = await servicioDocumentosAprendiz.obtenerDocumentosPorAprendiz(aprendizId) || [];
    // Mapear por tipo de documento para acceso rápido
    const docsMap = {};
    documentos.forEach(doc => {
      docsMap[doc.tipo_documento] = doc;
    });
    const resultado = DOCUMENTOS_OBLIGATORIOS.map(tipo => {
      if (docsMap[tipo]) {
        return {
          tipo,
          subido: true,
          nombre: docsMap[tipo].nombre_original || docsMap[tipo].nombre_guardado || '',
          fecha: docsMap[tipo].fecha_subida || docsMap[tipo].fecha || '',
          url: docsMap[tipo].ruta_archivo || docsMap[tipo].url || ''
        };
      } else {
        return {
          tipo,
          subido: false
        };
      }
    });
    res.json({ success: true, documentos: resultado });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener documentos pendientes.', error: error.message });
  }
};

// Función auxiliar para buscar aprendiz por número de documento
async function buscarAprendizPorNumeroDocumento(numeroDocumento) {
  const pool = require('../../configuracion/baseDatos').pool;
  const [rows] = await pool.query('SELECT * FROM aprendices WHERE numeroDocumento = ?', [numeroDocumento]);
  return rows.length > 0 ? rows[0] : null;
} 