// src/modulos/administrador/servicios/servicioGestionAprendices.js
// Propósito: Servicio de negocio para la gestión de aprendices

const { pool } = require('../../../configuracion/baseDatos');
const { logger } = require('../../../compartido/utilidades/logger');
const { Cache } = require('../../../configuracion/cache');

// Listas de constantes
const COLUMNAS_PERMITIDAS = [
    'id', 'tipoDocumento', 'numeroDocumento', 'estadoFormacion', 'nombres', 'primerApellido', 'segundoApellido',
    'fechaNacimiento', 'eps', 'telefonoFijo', 'celular', 'direccion', 'barrio', 'departamento', 'municipio',
    'correoElectronico', 'fechaInicioFormacion', 'fechaInicioLectiva', 'fechaFinLectiva', 'fechaInicioProductiva',
    'fechaFinProductiva', 'instructorLectiva', 'instructorProductiva', 'numeroFicha', 'programaFormacion',
    'alternativaSeleccionada', 'areaFormacion', 'empresaPatrocinadora', 'areaPractica', 'jefeInmediato',
    'telefonoEmpresa', 'celularEmpresa', 'direccionEmpresa', 'correoEmpresa', 'horario'
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

class ServicioGestionAprendices {

    /**
     * Construye la consulta dinámica para filtrado y paginación
     * @param {Object} filtros - Filtros aplicados
     * @returns {Object} - Objeto con baseQuery y params
     */
    construirQueryDinamica(filtros) {
        let baseQuery = 'FROM aprendices';
        const whereClauses = [];
        const params = [];

        const { nombre, documento, programaFormacion, alternativaSeleccionada, estadoFormacion } = filtros;

        if (nombre) {
            whereClauses.push('(nombres LIKE ? OR primerApellido LIKE ? OR segundoApellido LIKE ?)');
            const nombreParam = `%${nombre}%`;
            params.push(nombreParam, nombreParam, nombreParam);
        }

        if (documento) {
            whereClauses.push('numeroDocumento LIKE ?');
            params.push(`%${documento}%`);
        }

        if (programaFormacion) {
            whereClauses.push('programaFormacion = ?');
            params.push(programaFormacion);
        }

        if (alternativaSeleccionada) {
            whereClauses.push('alternativaSeleccionada = ?');
            params.push(alternativaSeleccionada);
        }

        if (estadoFormacion) {
            whereClauses.push('estadoFormacion = ?');
            params.push(estadoFormacion);
        }

        if (whereClauses.length > 0) {
            baseQuery += ' WHERE ' + whereClauses.join(' AND ');
        }

        return { baseQuery, params };
    }

    /**
     * Construye la cláusula ORDER BY
     * @param {Object} orderData - Datos de ordenamiento
     * @param {string} tableType - Tipo de tabla
     * @returns {string} - Cláusula ORDER BY
     */
    construirOrderClause(orderData, tableType) {
        if (!orderData || !Array.isArray(orderData) || orderData.length === 0) {
            return 'ORDER BY nombres ASC';
        }

        const orderColumn = orderData[0];
        const columnIndex = orderColumn.column;
        const direction = orderColumn.dir.toUpperCase();

        if (direction !== 'ASC' && direction !== 'DESC') {
            throw new Error('Dirección de ordenamiento inválida');
        }

        let columnMapping;
        if (tableType === 'docsPendientes') {
            columnMapping = [
                'tipoDocumento', 'numeroDocumento', 'estadoFormacion', 'nombres', 'primerApellido',
                'segundoApellido', 'telefonoFijo', 'celular', 'correoElectronico', 'numeroFicha',
                'programaFormacion', 'alternativaSeleccionada', 'acciones'
            ];
        } else {
            columnMapping = [
                'tipoDocumento', 'numeroDocumento', 'estadoFormacion', 'nombres', 'primerApellido',
                'segundoApellido', 'fechaNacimiento', 'eps', 'telefonoFijo', 'celular', 'direccion',
                'barrio', 'departamento', 'municipio', 'correoElectronico', 'fechaInicioLectiva',
                'fechaFinLectiva', 'fechaInicioProductiva', 'fechaFinProductiva', 'instructorLectiva',
                'instructorProductiva', 'numeroFicha', 'programaFormacion', 'alternativaSeleccionada',
                'areaFormacion', 'empresaPatrocinadora', 'areaPractica', 'jefeInmediato', 'telefonoEmpresa',
                'celularEmpresa', 'direccionEmpresa', 'correoEmpresa', 'horario'
            ];
        }

        if (columnIndex >= 0 && columnIndex < columnMapping.length) {
            const columnName = columnMapping[columnIndex];
            if (COLUMNAS_PERMITIDAS.includes(columnName)) {
                return `ORDER BY ${columnName} ${direction}`;
            }
        }

        return 'ORDER BY nombres ASC';
    }

    /**
     * Obtiene datos de aprendices con filtros y paginación
     * @param {Object} options - Opciones de consulta
     * @returns {Promise<Object>} - Resultados paginados
     */
    async obtenerDatosAprendices(options) {
        try {
            const { draw, start, length, order, tableType, ...filtros } = options;

            const { baseQuery, params } = this.construirQueryDinamica(filtros);
            const orderClause = this.construirOrderClause(order, tableType);

            // Contar total de registros filtrados
            const [totalFilteredResult] = await pool.query(`SELECT COUNT(*) as total ${baseQuery}`, params);
            const recordsFiltered = totalFilteredResult[0].total;

            // Contar total de registros sin filtros
            const [totalResult] = await pool.query('SELECT COUNT(*) as total FROM aprendices');
            const recordsTotal = totalResult[0].total;

            // Obtener datos paginados
            const dataQuery = `
                SELECT id, tipoDocumento, numeroDocumento, estadoFormacion, nombres, primerApellido, segundoApellido,
                       fechaNacimiento, eps, telefonoFijo, celular, direccion, barrio, departamento, municipio,
                       correoElectronico, fechaInicioLectiva, fechaFinLectiva, fechaInicioProductiva,
                       fechaFinProductiva, instructorLectiva, instructorProductiva, numeroFicha, programaFormacion,
                       alternativaSeleccionada, areaFormacion, empresaPatrocinadora, areaPractica, jefeInmediato,
                       telefonoEmpresa, celularEmpresa, direccionEmpresa, correoEmpresa, horario
                ${baseQuery}
                ${orderClause}
                LIMIT ? OFFSET ?
            `;

            let aprendices;
            const limit = parseInt(length);
            if (limit === -1) {
                const dataQuerySinLimit = `
                    SELECT id, tipoDocumento, numeroDocumento, estadoFormacion, nombres, primerApellido, segundoApellido,
                           fechaNacimiento, eps, telefonoFijo, celular, direccion, barrio, departamento, municipio,
                           correoElectronico, fechaInicioLectiva, fechaFinLectiva, fechaInicioProductiva,
                           fechaFinProductiva, instructorLectiva, instructorProductiva, numeroFicha, programaFormacion,
                           alternativaSeleccionada, areaFormacion, empresaPatrocinadora, areaPractica, jefeInmediato,
                           telefonoEmpresa, celularEmpresa, direccionEmpresa, correoEmpresa, horario
                    ${baseQuery}
                    ${orderClause}
                `;
                [aprendices] = await pool.query(dataQuerySinLimit, params);
            } else {
                params.push(limit || 10, parseInt(start) || 0);
                [aprendices] = await pool.query(dataQuery, params);
            }

            const processedData = aprendices.map(aprendiz => ({
                ...aprendiz,
                programaFormacion: NOMBRES_PROGRAMAS[aprendiz.programaFormacion] || aprendiz.programaFormacion,
                alternativaSeleccionada: aprendiz.alternativaSeleccionada ? aprendiz.alternativaSeleccionada.toUpperCase() : aprendiz.alternativaSeleccionada,
                areaFormacion: aprendiz.areaFormacion ? aprendiz.areaFormacion.toUpperCase() : aprendiz.areaFormacion
            }));

            return {
                draw: parseInt(draw) || 1,
                recordsTotal: recordsTotal,
                recordsFiltered: recordsFiltered,
                data: processedData
            };

        } catch (error) {
            logger.error('Error al obtener datos de aprendices:', error);
            throw error;
        }
    }

    /**
     * Obtiene datos para reportes con métricas adicionales
     * @returns {Promise<Object>} - Datos para gráficos y KPIs
     */
    async obtenerDatosReportes() {
        try {
            const cacheKey = 'reportes_aprendices_completos';
            const cacheTTL = 1800; // 30 minutos

            const cached = await Cache.getOrSet(cacheKey, async () => {
                // Consulta programas de formación
                const [programasResult] = await pool.execute(`
                    SELECT programaFormacion, COUNT(*) as cantidad
                    FROM aprendices
                    GROUP BY programaFormacion
                    ORDER BY cantidad DESC
                `);

                // Consulta estados de formación
                const [estadosResult] = await pool.execute(`
                    SELECT estadoFormacion, COUNT(*) as cantidad
                    FROM aprendices
                    GROUP BY estadoFormacion
                    ORDER BY cantidad DESC
                `);

                // Consulta alternativas de etapa productiva
                const [alternativasResult] = await pool.execute(`
                    SELECT alternativaSeleccionada, COUNT(*) as cantidad
                    FROM aprendices
                    WHERE alternativaSeleccionada IS NOT NULL AND alternativaSeleccionada != ''
                    GROUP BY alternativaSeleccionada
                    ORDER BY cantidad DESC
                `);

                // Consulta cumplimiento de documentos (usando procedimiento almacenado)
                const [documentosResult] = await pool.execute(`CALL sp_cumplimiento_documentos()`);
                // Los procedimientos almacenados devuelven un array de result sets
                // El primer elemento [0] contiene las filas del resultado
                const documentosRows = Array.isArray(documentosResult) && documentosResult.length > 0 ? documentosResult[0] : [];
                
                logger.debug('Datos de documentos obtenidos del procedimiento almacenado', {
                    documentosResultType: typeof documentosResult,
                    documentosResultLength: Array.isArray(documentosResult) ? documentosResult.length : 'no es array',
                    documentosRows: documentosRows
                });

                // Consulta cumplimiento de seguimiento (usando procedimiento almacenado)
                const [seguimientoResult] = await pool.execute(`CALL sp_cumplimiento_seguimiento()`);
                // Los procedimientos almacenados devuelven un array de result sets
                // El primer elemento [0] contiene las filas del resultado
                const seguimientoRows = Array.isArray(seguimientoResult) && seguimientoResult.length > 0 ? seguimientoResult[0] : [];
                
                logger.debug('Datos de seguimiento obtenidos del procedimiento almacenado', {
                    seguimientoResultType: typeof seguimientoResult,
                    seguimientoResultLength: Array.isArray(seguimientoResult) ? seguimientoResult.length : 'no es array',
                    seguimientoRows: seguimientoRows
                });

                // Consulta distribución por departamento
                const [departamentoResult] = await pool.execute(`
                    SELECT departamento, COUNT(*) as cantidad
                    FROM aprendices
                    WHERE departamento IS NOT NULL AND departamento != ''
                    GROUP BY departamento
                    ORDER BY cantidad DESC
                    LIMIT 10
                `);

                // Estadísticas generales
                const [estadisticasGenerales] = await pool.execute(`
                    SELECT
                        COUNT(*) as total_aprendices,
                        COUNT(CASE WHEN estadoFormacion = 'activo' THEN 1 END) as activos,
                        COUNT(CASE WHEN estadoFormacion = 'inactivo' THEN 1 END) as inactivos,
                        COUNT(CASE WHEN estadoFormacion = 'aplazado' THEN 1 END) as aplazados,
                        COUNT(CASE WHEN estadoFormacion = 'retirado' THEN 1 END) as retirados,
                        COUNT(CASE WHEN estadoFormacion = 'certificado' THEN 1 END) as certificados
                    FROM aprendices
                `);

                return {
                    programasResult,
                    estadosResult,
                    alternativasResult,
                    documentosRows,
                    seguimientoRows,
                    departamentoResult,
                    estadisticasGenerales: estadisticasGenerales[0]
                };
            }, cacheTTL);

            const { programasResult, estadosResult, alternativasResult, documentosRows, seguimientoRows, departamentoResult, estadisticasGenerales } = cached;

            const datosProgramas = {
                labels: programasResult.length > 0 ? programasResult.map(row => NOMBRES_PROGRAMAS[row.programaFormacion] || row.programaFormacion || 'No especificado') : ['No hay datos'],
                data: programasResult.length > 0 ? programasResult.map(row => row.cantidad) : [0]
            };

            const datosEstados = {
                labels: estadosResult.length > 0 ? estadosResult.map(row => row.estadoFormacion || 'No especificado') : ['No hay datos'],
                data: estadosResult.length > 0 ? estadosResult.map(row => row.cantidad) : [0]
            };

            const datosAlternativas = {
                labels: alternativasResult.length > 0 ? alternativasResult.map(row => NOMBRES_ALTERNATIVAS[row.alternativaSeleccionada] || NOMBRES_ALTERNATIVAS.default) : ['No hay datos'],
                data: alternativasResult.length > 0 ? alternativasResult.map(row => row.cantidad) : [0]
            };

            const datosDocumentos = {
                labels: documentosRows && documentosRows.length > 0 ? documentosRows.map(row => row.estado_documentos) : ['No hay datos'],
                data: documentosRows && documentosRows.length > 0 ? documentosRows.map(row => row.cantidad) : [0]
            };

            const datosSeguimiento = {
                labels: seguimientoRows && seguimientoRows.length > 0 ? seguimientoRows.map(row => row.estado_seguimiento) : ['No hay datos'],
                data: seguimientoRows && seguimientoRows.length > 0 ? seguimientoRows.map(row => row.cantidad) : [0]
            };

            const datosDepartamentos = {
                labels: departamentoResult.length > 0 ? departamentoResult.map(row => row.departamento) : ['No hay datos'],
                data: departamentoResult.length > 0 ? departamentoResult.map(row => row.cantidad) : [0]
            };

            logger.debug('Datos completos para reportes generados', {
                programas: datosProgramas.labels.length,
                estados: datosEstados.labels.length,
                alternativas: datosAlternativas.labels.length,
                documentos: datosDocumentos.labels.length,
                seguimiento: datosSeguimiento.labels.length,
                departamentos: datosDepartamentos.labels.length
            });

            return {
                datosProgramas,
                datosEstados,
                datosAlternativas,
                datosDocumentos,
                datosSeguimiento,
                datosDepartamentos,
                estadisticasGenerales
            };

        } catch (error) {
            logger.error('Error al obtener datos para reportes:', error);
            throw error;
        }
    }

    /**
     * Busca un aprendiz por ID
     * @param {number} id - ID del aprendiz
     * @returns {Promise<Object|null>} - Datos del aprendiz
     */
    async buscarPorId(id) {
        try {
            const [result] = await pool.query('SELECT * FROM aprendices WHERE id = ?', [id]);
            return result[0] || null;
        } catch (error) {
            logger.error(`Error al buscar aprendiz con ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * Actualiza un aprendiz
     * @param {number} id - ID del aprendiz
     * @param {Object} datosActualizados - Datos a actualizar
     * @returns {Promise<Object>} - Resultado de la actualización
     */
    async actualizarAprendiz(id, datosActualizados) {
        try {
            // Convertir el correo a minúsculas y los demás valores string a mayúsculas
            // Excepciones: estadoFormacion mantiene su formato específico del enum
            for (const key in datosActualizados) {
                if (typeof datosActualizados[key] === 'string') {
                    if (key === 'correoElectronico') {
                        datosActualizados[key] = datosActualizados[key].toLowerCase();
                    } else if (key === 'estadoFormacion') {
                        
                        const valorOriginal = datosActualizados[key].trim();
                        // Mapear variaciones comunes al formato correcto del enum
                        const mapeoEstados = {
                            'en formacion': 'activo',
                            'en formación': 'activo',
                            'enformacion': 'activo',
                            'activo': 'activo',
                            'inactivo': 'inactivo',
                            'aplazado': 'aplazado',
                            'retirado': 'retirado',
                            'certificado': 'certificado',
                            'culminado': 'certificado',
                            'suspendido': 'retirado'
                        };
                        datosActualizados[key] = mapeoEstados[valorOriginal.toLowerCase()] || valorOriginal;
                    } else {
                        datosActualizados[key] = datosActualizados[key].toUpperCase();
                    }
                }
            }

            const campos = Object.keys(datosActualizados).filter(key =>
                COLUMNAS_PERMITIDAS.includes(key) && datosActualizados[key] !== undefined
            );

            if (campos.length === 0) {
                throw new Error('No hay datos válidos para actualizar');
            }

            const setClause = campos.map(campo => `${campo} = ?`).join(', ');
            const valores = campos.map(campo => datosActualizados[campo]);
            valores.push(id);

            const [result] = await pool.execute(
                `UPDATE aprendices SET ${setClause} WHERE id = ?`,
                valores
            );

            logger.info(`Aprendiz ${id} actualizado`, { camposActualizados: campos.length });
            return { success: true, affectedRows: result.affectedRows };

        } catch (error) {
            logger.error(`Error al actualizar aprendiz ${id}:`, error);
            throw error;
        }
    }

    /**
     * Elimina un aprendiz
     * @param {number} id - ID del aprendiz
     * @returns {Promise<Object>} - Resultado de la eliminación
     */
    async eliminarAprendiz(id) {
        try {
            const [result] = await pool.execute('DELETE FROM aprendices WHERE id = ?', [id]);
            logger.info(`Aprendiz ${id} eliminado`);
            return { success: true, affectedRows: result.affectedRows };
        } catch (error) {
            logger.error(`Error al eliminar aprendiz ${id}:`, error);
            throw error;
        }
    }
}

module.exports = ServicioGestionAprendices;