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

        // 1. Bitácora quincenal (cada 15 días) no enviada
        // Determinar el periodo actual del mes (1-15 o 16-31)
        const hoy = new Date();
        const diaDelMes = hoy.getDate();
        const periodoActual = diaDelMes <= 15 ? 1 : 2; // 1 = primeros 15 días, 2 = últimos 15 días

        // Calcular el año y mes actual
        const year = hoy.getFullYear();
        const month = hoy.getMonth() + 1; // getMonth() devuelve 0-11

        const [bitacoraRows] = await pool.query(
            `SELECT id FROM bitacoras
             WHERE aprendizId = ?
               AND YEAR(fechaCreacion) = ?
               AND MONTH(fechaCreacion) = ?
               AND (
                   (DAY(fechaCreacion) BETWEEN 1 AND 15 AND ? = 1) OR
                   (DAY(fechaCreacion) > 15 AND ? = 2)
               )`,
            [aprendizId, year, month, periodoActual, periodoActual]
        );
        const bitacoraArray = Array.isArray(bitacoraRows) ? bitacoraRows : [];
        if (bitacoraArray.length === 0) {
            const periodoTexto = periodoActual === 1 ? 'primeros 15 días' : 'últimos 15 días';
            alertas.push({
                tipo: 'bitacora',
                mensaje: `No has registrado tu bitácora correspondiente a los ${periodoTexto} del mes.`
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
            'GFPI-F-023 V5',
            'Informe final',
            'Carta de certificación',
            'Documento de identidad'
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

        // Aprendices con bitácoras quincenales pendientes (cada 15 días)
        const hoy = new Date();
        const diaDelMes = hoy.getDate();
        const periodoActual = diaDelMes <= 15 ? 1 : 2;
        const year = hoy.getFullYear();
        const month = hoy.getMonth() + 1;

        const [pendientesRows] = await pool.query(
            `SELECT a.id, a.nombres, a.primerApellido, a.numeroDocumento
             FROM aprendices a
             LEFT JOIN bitacoras b ON a.id = b.aprendizId
               AND YEAR(b.fechaCreacion) = ?
               AND MONTH(b.fechaCreacion) = ?
               AND (
                   (DAY(b.fechaCreacion) BETWEEN 1 AND 15 AND ? = 1) OR
                   (DAY(b.fechaCreacion) > 15 AND ? = 2)
               )
             WHERE b.id IS NULL`,
            [year, month, periodoActual, periodoActual]
        );
        const pendientes = Array.isArray(pendientesRows) ? pendientesRows : [];
        pendientes.forEach(function(apr) {
            if (apr && apr.nombres && apr.primerApellido && apr.numeroDocumento) {
                const periodoTexto = periodoActual === 1 ? 'primeros 15 días' : 'últimos 15 días';
                alertasPorTipo.bitacora.push({
                    tipo: 'bitacora',
                    mensaje: 'El aprendiz ' + apr.nombres + ' ' + apr.primerApellido + ' (' + apr.numeroDocumento + ') no ha registrado su bitácora correspondiente a los ' + periodoTexto + ' del mes.'
                });
            }
        });

        return alertasPorTipo;
    }
};

module.exports = servicioAlertas; 