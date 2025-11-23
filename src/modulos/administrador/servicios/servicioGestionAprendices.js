// src/modulos/administrador/servicios/servicioGestionAprendices.js
// Propósito: Servicio de negocio para la gestión de aprendices

const { pool } = require('../../../configuracion/baseDatos');
const { logger } = require('../../../compartido/utilidades/logger');
const { Cache } = require('../../../configuracion/cache');

// Listas de constantes
const COLUMNAS_PERMITIDAS = [
    'id', 'tipoDocumento', 'numeroDocumento', 'estadoFormacion', 'nombres', 'primerApellido', 'segundoApellido',
    'genero', 'fechaNacimiento', 'eps', 'telefonoFijo', 'celular', 'direccion', 'barrio', 'departamento', 'municipio',
    'correoElectronico', 'fechaInicioFormacion', 'fechaInicioLectiva', 'fechaFinLectiva', 'fechaInicioProductiva',
    'fechaFinProductiva', 'instructorLectiva', 'instructorProductiva', 'numeroFicha', 'programaFormacion',
    'alternativaSeleccionada', 'areaFormacion', 'empresaPatrocinadora', 'areaPractica', 'jefeInmediato',
    'telefonoEmpresa', 'celularEmpresa', 'direccionEmpresa', 'correoEmpresa', 'horario'
];

// Mapeo de valores de BD a nombres completos para reportes/gráficos
// Incluye variaciones en mayúsculas/minúsculas para compatibilidad con datos antiguos
const NOMBRES_PROGRAMAS = {
    'tecProgramasDeportivos': 'TÉCNICO EN EJECUCIÓN DE PROGRAMAS DEPORTIVOS',
    'TECPROGRAMASDEPORTIVOS': 'TÉCNICO EN EJECUCIÓN DE PROGRAMAS DEPORTIVOS',
    'tecRecreComunitaria': 'TÉCNICO EN RECREACIÓN COMUNITARIA',
    'TECRECRECOMUNITARIA': 'TÉCNICO EN RECREACIÓN COMUNITARIA',
    'tecOperativoRescateAcuatico': 'TÉCNICO OPERATIVO EN RESCATE ACUÁTICO EN AGUAS CONFINADAS',
    'TECOPERATIVORESCATEACUATICO': 'TÉCNICO OPERATIVO EN RESCATE ACUÁTICO EN AGUAS CONFINADAS',
    'tecProcesamientoPruebas': 'TÉCNICO EN PROCESAMIENTO DE PRUEBAS DE SOFTWARE',
    'TECPROCESAMIENTOPRUEBAS': 'TÉCNICO EN PROCESAMIENTO DE PRUEBAS DE SOFTWARE',
    'tecProgramacion': 'TÉCNICO EN PROGRAMACIÓN DE SOFTWARE',
    'TECPROGRAMACION': 'TÉCNICO EN PROGRAMACIÓN DE SOFTWARE',
    'tecProgramacionMoviles': 'TÉCNICO EN PROGRAMACIÓN DE APLICACIONES PARA DISPOSITIVOS MÓVILES',
    'TECPROGRAMACIONMOVILES': 'TÉCNICO EN PROGRAMACIÓN DE APLICACIONES PARA DISPOSITIVOS MÓVILES',
    'tecSeguridadWeb': 'TÉCNICO EN SEGURIDAD DE APLICACIONES WEB',
    'TECSEGURIDADWEB': 'TÉCNICO EN SEGURIDAD DE APLICACIONES WEB',
    'tecnoEntrenaFutbol': 'TECNOLOGÍA EN ENTRENAMIENTO Y FORMACIÓN EN FÚTBOL',
    'TECNOENTRENA FUTBOL': 'TECNOLOGÍA EN ENTRENAMIENTO Y FORMACIÓN EN FÚTBOL',
    'tecnoGestionServiciosRecreativos': 'TECNOLOGÍA EN GESTIÓN DE SERVICIOS RECREATIVOS',
    'TECNOGESTIONSERVICIOSRECREATIVOS': 'TECNOLOGÍA EN GESTIÓN DE SERVICIOS RECREATIVOS',
    'tecnoActividadFisica': 'TECNOLOGÍA EN ACTIVIDAD FÍSICA',
    'TECNOACTIVIDADFISICA': 'TECNOLOGÍA EN ACTIVIDAD FÍSICA',
    'tecnoEntrenamientoDeportivo': 'TECNOLOGÍA EN ENTRENAMIENTO DEPORTIVO',
    'TECNOENTRENAMIENTODEPORTIVO': 'TECNOLOGÍA EN ENTRENAMIENTO DEPORTIVO',
    'tecnoAnalisisDesarrollo': 'TECNOLOGÍA EN ANÁLISIS Y DESARROLLO DE SOFTWARE',
    'TECNOANALISISDESARROLLO': 'TECNOLOGÍA EN ANÁLISIS Y DESARROLLO DE SOFTWARE',
    'tecnoProcesosLogisticos': 'TECNOLOGÍA EN COORDINACIÓN DE PROCESOS LOGÍSTICOS',
    'TECNOPROCESOSLOGISTICOS': 'TECNOLOGÍA EN COORDINACIÓN DE PROCESOS LOGÍSTICOS',
    'default': 'NO ESPECIFICADO'
};

const NOMBRES_ALTERNATIVAS = {
    'contratoAprendizaje': 'CONTRATO DE APRENDIZAJE',
    'CONTRATOAPRENDIZAJE': 'CONTRATO DE APRENDIZAJE',
    'pasantia': 'VÍNCULO FORMATIVO',
    'PASANTIA': 'VÍNCULO FORMATIVO',
    'vinculoFormativo': 'VÍNCULO FORMATIVO',
    'VINCULOFORMATIVO': 'VÍNCULO FORMATIVO',
    'vinculoLaboral': 'VÍNCULO LABORAL',
    'VINCULOLABORAL': 'VÍNCULO LABORAL',
    'proyectosProductivos': 'PROYECTOS PRODUCTIVOS',
    'PROYECTOSPRODUCTIVOS': 'PROYECTOS PRODUCTIVOS',
    'monitoria': 'MONITORÍA',
    'MONITORIA': 'MONITORÍA',
    'default': 'NO ESPECIFICADA'
};

class ServicioGestionAprendices {

    /**
     * Normaliza un objeto aprendiz para mostrar datos uniformes
     * @param {Object} aprendiz - Datos del aprendiz
     * @returns {Object} - Aprendiz con datos normalizados
     */
    normalizarAprendiz(aprendiz) {
        if (!aprendiz) return null;
        
        const normalizado = { ...aprendiz };
        
        // Convertir programaFormacion al nombre completo desde la BD
        if (normalizado.programaFormacion) {
            // Intentar búsqueda directa primero
            let nombrePrograma = NOMBRES_PROGRAMAS[normalizado.programaFormacion];
            
            // Si no encuentra, intentar búsqueda sin distinción de mayúsculas
            if (!nombrePrograma) {
                const valorOriginal = normalizado.programaFormacion.toUpperCase();
                nombrePrograma = NOMBRES_PROGRAMAS[valorOriginal];
            }
            
            // Si aún no encuentra, intentar sin espacios ni guiones
            if (!nombrePrograma) {
                const valorLimpio = normalizado.programaFormacion.replace(/[\s-_]/g, '').toUpperCase();
                nombrePrograma = NOMBRES_PROGRAMAS[valorLimpio];
            }
            
            // Usar el nombre encontrado o el valor original en mayúsculas
            normalizado.programaFormacion = nombrePrograma || normalizado.programaFormacion.toUpperCase();
        }
        
        // Convertir alternativaSeleccionada al nombre completo desde la BD
        if (normalizado.alternativaSeleccionada) {
            // Intentar búsqueda directa primero
            let nombreAlternativa = NOMBRES_ALTERNATIVAS[normalizado.alternativaSeleccionada];
            
            // Si no encuentra, intentar búsqueda sin distinción de mayúsculas
            if (!nombreAlternativa) {
                const valorOriginal = normalizado.alternativaSeleccionada.toUpperCase();
                nombreAlternativa = NOMBRES_ALTERNATIVAS[valorOriginal];
            }
            
            // Si aún no encuentra, intentar sin espacios ni guiones
            if (!nombreAlternativa) {
                const valorLimpio = normalizado.alternativaSeleccionada.replace(/[\s-_]/g, '').toUpperCase();
                nombreAlternativa = NOMBRES_ALTERNATIVAS[valorLimpio];
            }
            
            // Usar el nombre encontrado o el valor original en mayúsculas
            normalizado.alternativaSeleccionada = nombreAlternativa || normalizado.alternativaSeleccionada.toUpperCase();
        }
        
        // Normalizar campos de texto a MAYÚSCULAS (excepto email)
        const camposTexto = [
            'nombres', 'primerApellido', 'segundoApellido', 'tipoDocumento',
            'eps', 'direccion', 'barrio', 'departamento', 'municipio',
            'instructorLectiva', 'instructorProductiva', 'areaFormacion',
            'empresaPatrocinadora', 'areaPractica', 'jefeInmediato',
            'direccionEmpresa', 'horario', 'genero', 'estadoFormacion'
        ];
        
        camposTexto.forEach(campo => {
            if (normalizado[campo] && typeof normalizado[campo] === 'string') {
                normalizado[campo] = normalizado[campo].toUpperCase();
            }
        });
        
        // El email se mantiene en minúsculas
        if (normalizado.correoElectronico) {
            normalizado.correoElectronico = normalizado.correoElectronico.toLowerCase();
        }
        
        // El email de empresa también en minúsculas
        if (normalizado.correoEmpresa) {
            normalizado.correoEmpresa = normalizado.correoEmpresa.toLowerCase();
        }
        
        return normalizado;
    }

    /**
     * Construye la consulta dinámica para filtrado y paginación
     * @param {Object} filtros - Filtros aplicados
     * @returns {Object} - Objeto con baseQuery y params
     */
    construirQueryDinamica(filtros) {
        let baseQuery = 'FROM aprendices';
        const whereClauses = [];
        const params = [];


        const { nombre, documento, programaFormacion, alternativaSeleccionada, estadoFormacion, numeroFicha, instructorProductiva } = filtros;

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

        // Filtro por ficha
        if (numeroFicha) {
            whereClauses.push('numeroFicha = ?');
            params.push(numeroFicha);
        }

        // Filtro por instructor productiva
        if (instructorProductiva) {
            whereClauses.push('instructorProductiva = ?');
            params.push(instructorProductiva);
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
        // Nuevo: usar el nombre de la columna si está presente
        const columnName = orderColumn.data || null;
        const direction = orderColumn.dir ? orderColumn.dir.toUpperCase() : 'ASC';

        if (direction !== 'ASC' && direction !== 'DESC') {
            throw new Error('Dirección de ordenamiento inválida');
        }

        if (columnName && COLUMNAS_PERMITIDAS.includes(columnName)) {
            return `ORDER BY ${columnName} ${direction}`;
        }

        // Fallback: si no se envía el nombre, usar el índice como antes
        if (typeof orderColumn.column === 'number') {
            let columnMapping;
            if (tableType === 'docsPendientes') {
                columnMapping = [
                    'tipoDocumento', 'genero', 'numeroDocumento', 'estadoFormacion', 'nombres', 'primerApellido',
                    'segundoApellido', 'telefonoFijo', 'celular', 'correoElectronico', 'numeroFicha',
                    'programaFormacion', 'alternativaSeleccionada', 'acciones'
                ];
            } else {
                columnMapping = [
                    'tipoDocumento', 'genero', 'numeroDocumento', 'estadoFormacion', 'nombres', 'primerApellido',
                    'segundoApellido', 'fechaNacimiento', 'eps', 'telefonoFijo', 'celular', 'direccion',
                    'barrio', 'departamento', 'municipio', 'correoElectronico', 'fechaInicioLectiva',
                    'fechaFinLectiva', 'fechaInicioProductiva', 'fechaFinProductiva', 'instructorLectiva',
                    'instructorProductiva', 'numeroFicha', 'programaFormacion', 'alternativaSeleccionada',
                    'areaFormacion', 'empresaPatrocinadora', 'areaPractica', 'jefeInmediato', 'telefonoEmpresa',
                    'celularEmpresa', 'direccionEmpresa', 'correoEmpresa', 'horario'
                ];
            }
            const idx = orderColumn.column;
            if (idx >= 0 && idx < columnMapping.length) {
                const col = columnMapping[idx];
                if (COLUMNAS_PERMITIDAS.includes(col)) {
                    return `ORDER BY ${col} ${direction}`;
                }
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
                SELECT id, tipoDocumento, genero, numeroDocumento, estadoFormacion, nombres, primerApellido, segundoApellido,
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
                    SELECT id, tipoDocumento, genero, numeroDocumento, estadoFormacion, nombres, primerApellido, segundoApellido,
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

            // Normalizar datos para mostrar uniformemente en mayúsculas
            const processedData = aprendices.map(aprendiz => this.normalizarAprendiz(aprendiz));

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
     * @param {Object} filtros - Filtros opcionales (mes, anio)
     * @returns {Promise<Object>} - Datos para gráficos y KPIs
     */
    async obtenerDatosReportes(filtros = {}) {
        try {
            // Crear clave de cache que incluya filtros de fecha
            const cacheKey = filtros.mes && filtros.anio
                ? `reportes_aprendices_${filtros.anio}_${filtros.mes}`
                : 'reportes_aprendices_completos';
            const cacheTTL = 1800; // 30 minutos

            const cached = await Cache.getOrSet(cacheKey, async () => {
                // Construir condición de fecha si se especifica mes/año
                let fechaCondition = '';
                const fechaParams = [];
                if (filtros.mes && filtros.anio) {
                    fechaCondition = 'WHERE YEAR(fechaInicioProductiva) = ? AND MONTH(fechaInicioProductiva) = ?';
                    fechaParams.push(filtros.anio, filtros.mes);
                }

                // Consulta programas de formación
                const [programasResult] = await pool.execute(`
                    SELECT programaFormacion, COUNT(*) as cantidad
                    FROM aprendices
                    ${fechaCondition}
                    GROUP BY programaFormacion
                    ORDER BY cantidad DESC
                `, fechaParams);

                // Consulta estados de formación
                const [estadosResult] = await pool.execute(`
                    SELECT
                        CASE
                            WHEN LOWER(estadoFormacion) = 'retirado' THEN 'retirado'
                            WHEN LOWER(estadoFormacion) = 'activo' THEN 'activo'
                            WHEN LOWER(estadoFormacion) = 'inactivo' THEN 'inactivo'
                            WHEN LOWER(estadoFormacion) = 'aplazado' THEN 'aplazado'
                            WHEN LOWER(estadoFormacion) = 'certificado' THEN 'certificado'
                            WHEN LOWER(estadoFormacion) = 'por certificar' THEN 'por certificar'
                            ELSE LOWER(estadoFormacion)
                        END as estado_normalizado,
                        COUNT(*) as cantidad
                    FROM aprendices
                    ${fechaCondition}
                    GROUP BY estado_normalizado
                    ORDER BY cantidad DESC
                `, fechaParams);

                // Consulta alternativas de etapa productiva
                const [alternativasResult] = await pool.execute(`
                    SELECT alternativaSeleccionada, COUNT(*) as cantidad
                    FROM aprendices
                    WHERE alternativaSeleccionada IS NOT NULL AND alternativaSeleccionada != ''
                    ${fechaCondition ? 'AND ' + fechaCondition.substring(6) : ''}
                    GROUP BY alternativaSeleccionada
                    ORDER BY cantidad DESC
                `, fechaParams);

                // Consulta cumplimiento de documentos (usando procedimiento almacenado con filtros de fecha)
                const [documentosResult] = await pool.execute(`CALL sp_cumplimiento_documentos(?, ?)`, [filtros.mes || null, filtros.anio || null]);
                // Los procedimientos almacenados devuelven un array de result sets
                // El primer elemento [0] contiene las filas del resultado
                const documentosRows = Array.isArray(documentosResult) && documentosResult.length > 0 ? documentosResult[0] : [];

                logger.debug('Datos de documentos obtenidos del procedimiento almacenado', {
                    documentosResultType: typeof documentosResult,
                    documentosResultLength: Array.isArray(documentosResult) ? documentosResult.length : 'no es array',
                    documentosRows: documentosRows,
                    filtros: filtros
                });

                // Consulta cumplimiento de seguimiento (usando procedimiento almacenado con filtros de fecha)
                const [seguimientoResult] = await pool.execute(`CALL sp_cumplimiento_seguimiento(?, ?)`, [filtros.mes || null, filtros.anio || null]);
                // Los procedimientos almacenados devuelven un array de result sets
                // El primer elemento [0] contiene las filas del resultado
                const seguimientoRows = Array.isArray(seguimientoResult) && seguimientoResult.length > 0 ? seguimientoResult[0] : [];

                logger.debug('Datos de seguimiento obtenidos del procedimiento almacenado', {
                    seguimientoResultType: typeof seguimientoResult,
                    seguimientoResultLength: Array.isArray(seguimientoResult) ? seguimientoResult.length : 'no es array',
                    seguimientoRows: seguimientoRows,
                    filtros: filtros
                });

                // Consulta distribución por departamento
                const [departamentoResult] = await pool.execute(`
                    SELECT departamento, COUNT(*) as cantidad
                    FROM aprendices
                    WHERE departamento IS NOT NULL AND departamento != ''
                    ${fechaCondition ? 'AND ' + fechaCondition.substring(6) : ''}
                    GROUP BY departamento
                    ORDER BY cantidad DESC
                    LIMIT 10
                `, fechaParams);

                // Estadísticas generales
                const [estadisticasGenerales] = await pool.execute(`
                    SELECT
                        COUNT(*) as total_aprendices,
                        COUNT(CASE WHEN LOWER(estadoFormacion) = 'activo' THEN 1 END) as activos,
                        COUNT(CASE WHEN LOWER(estadoFormacion) = 'inactivo' THEN 1 END) as inactivos,
                        COUNT(CASE WHEN LOWER(estadoFormacion) = 'aplazado' THEN 1 END) as aplazados,
                        COUNT(CASE WHEN LOWER(estadoFormacion) = 'retirado' THEN 1 END) as retirados,
                        COUNT(CASE WHEN LOWER(estadoFormacion) = 'certificado' THEN 1 END) as certificados,
                        COUNT(CASE WHEN LOWER(estadoFormacion) = 'por certificar' THEN 1 END) as por_certificar
                    FROM aprendices
                    ${fechaCondition}
                `, fechaParams);

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
                labels: estadosResult.length > 0 ? estadosResult.map(row => row.estado_normalizado || 'No especificado') : ['No hay datos'],
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