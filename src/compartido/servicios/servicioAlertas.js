// Servicio centralizado de alertas para aprendices y administradores
// Archivo JavaScript puro, sin anotaciones de tipo

const ServicioAprendiz = require('../../modulos/aprendiz/servicios/servicioAprendiz');
const servicioAprendiz = new ServicioAprendiz();
const servicioDocumentosAprendiz = require('../../modulos/aprendiz/servicios/servicioDocumentosAprendiz');
const pool = require('../../configuracion/baseDatos').pool;

const servicioAlertas = {
    // Alertas para el dashboard del aprendiz
    async obtenerAlertasAprendiz(aprendizId) {
        const alertas = [];

        // 1. Bitácora semanal no enviada
        const [bitacoraRows] = await pool.query(
            `SELECT id FROM bitacoras WHERE aprendizId = ? AND YEARWEEK(fechaCreacion, 1) = YEARWEEK(CURDATE(), 1)`,
            [aprendizId]
        );
        const bitacoraArray = Array.isArray(bitacoraRows) ? bitacoraRows : [];
        if (bitacoraArray.length === 0) {
            alertas.push({
                tipo: 'bitacora',
                mensaje: 'No has registrado tu bitácora de esta semana.'
            });
        }

        // 2. Documentos obligatorios faltantes (según tipos definidos)
        const tiposObligatorios = [
            'Bitácora 1',
            'Bitácora 2',
            'Bitácora 3',
            'Bitácora 4',
            'Bitácora 5',
            'Bitácora 6',
            'Bitácora 7',
            'Bitácora 8',
            'Bitácora 9',
            'Bitácora 10',
            'Bitácora 11',
            'Bitácora 12',
            'Propuesta de intervención',
            'Diagnóstico',
            'GFPI-F-023 V5'
        ];
        const documentos = await servicioDocumentosAprendiz.obtenerDocumentosPorAprendiz(aprendizId) || [];
        tiposObligatorios.forEach(function(tipo) {
            if (!documentos.some(function(doc) { return doc.tipo_documento === tipo; })) {
                alertas.push({
                    tipo: 'documento',
                    mensaje: 'Falta subir el documento obligatorio: ' + tipo
                });
            }
        });

        // 3. Datos personales incompletos (ejemplo: celular, dirección, etc)
        const aprendiz = await servicioAprendiz.obtenerAprendizPorId(aprendizId) || {};
        const camposRequeridos = ['celular', 'direccion', 'barrio', 'departamento', 'municipio'];
        camposRequeridos.forEach(function(campo) {
            if (!aprendiz[campo]) {
                alertas.push({
                    tipo: 'datos',
                    mensaje: 'Te falta diligenciar el campo: ' + campo
                });
            }
        });

        return alertas;
    },

    // Alertas para el panel principal del administrador
    async obtenerAlertasAdministrador() {
        const alertasPorTipo = { bitacora: [] };

        // Aprendices con documentos pendientes de entrega (bitácoras no registradas esta semana)
        const [pendientesRows] = await pool.query(
            `SELECT a.id, a.nombres, a.primerApellido, a.numeroDocumento
             FROM aprendices a
             LEFT JOIN bitacoras b ON a.id = b.aprendizId AND YEARWEEK(b.fechaCreacion, 1) = YEARWEEK(CURDATE(), 1)
             WHERE b.id IS NULL`
        );
        const pendientes = Array.isArray(pendientesRows) ? pendientesRows : [];
        pendientes.forEach(function(apr) {
            if (apr && apr.nombres && apr.primerApellido && apr.numeroDocumento) {
                alertasPorTipo.bitacora.push({
                    tipo: 'bitacora',
                    mensaje: 'El aprendiz ' + apr.nombres + ' ' + apr.primerApellido + ' (' + apr.numeroDocumento + ') no ha registrado su bitácora esta semana.'
                });
            }
        });

        return alertasPorTipo;
    }
};

module.exports = servicioAlertas; 