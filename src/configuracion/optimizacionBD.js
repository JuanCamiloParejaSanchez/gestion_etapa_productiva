/* Ruta: src/configuracion/optimizacionBD.js */
/* Propósito: Optimizaciones de base de datos y consultas */

const { pool } = require('./baseDatos');
const { logDatabase } = require('../compartido/utilidades/logger');

// Configuración de índices recomendados
const indicesRecomendados = [
    'CREATE INDEX IF NOT EXISTS idx_aprendices_correo ON aprendices(correoElectronico)',
    'CREATE INDEX IF NOT EXISTS idx_aprendices_documento ON aprendices(tipoDocumento, numeroDocumento)',
    'CREATE INDEX IF NOT EXISTS idx_aprendices_programa ON aprendices(programaFormacion)',
    'CREATE INDEX IF NOT EXISTS idx_aprendices_alternativa ON aprendices(alternativaSeleccionada)',
    'CREATE INDEX IF NOT EXISTS idx_aprendices_estado ON aprendices(estadoFormacion)',
    'CREATE INDEX IF NOT EXISTS idx_bitacoras_aprendiz ON bitacoras(aprendizId)',
    'CREATE INDEX IF NOT EXISTS idx_bitacoras_fecha ON bitacoras(fechaRegistro)',
    'CREATE INDEX IF NOT EXISTS idx_bitacoras_estado ON bitacoras(estado)',
    'CREATE INDEX IF NOT EXISTS idx_documentos_aprendiz ON documentos_aprendiz(aprendiz_id)',
    'CREATE INDEX IF NOT EXISTS idx_administradores_correo ON administradores(correoInstitucional)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires)'
];

// Función para crear índices optimizados
async function crearIndicesOptimizados() {
    try {
        logDatabase('Creando índices optimizados');

        for (const sql of indicesRecomendados) {
            await pool.execute(sql);
        }

        logDatabase('Índices optimizados creados exitosamente');
    } catch (error) {
        logDatabase('Error creando índices optimizados', { error: error.message });
        throw error;
    }
}

// Función para optimizar consultas con paginación
function crearConsultaPaginada(baseQuery, filtros = {}, ordenamiento = {}, paginacion = {}) {
    let whereClauses = [];
    let params = [];
    let filterParams = [];

    // Construir filtros
    Object.entries(filtros).forEach(([campo, valor]) => {
        if (valor !== undefined && valor !== null && valor !== '') {
            switch (campo) {
                case 'nombre':
                    whereClauses.push('(nombres LIKE ? OR primerApellido LIKE ? OR segundoApellido LIKE ?)');
                    const nombreParam = `%${valor}%`;
                    params.push(nombreParam, nombreParam, nombreParam);
                    filterParams.push(nombreParam, nombreParam, nombreParam);
                    break;

                case 'documento':
                    whereClauses.push('numeroDocumento LIKE ?');
                    const docParam = `%${valor}%`;
                    params.push(docParam);
                    filterParams.push(docParam);
                    break;

                case 'programaFormacion':
                case 'alternativaSeleccionada':
                case 'estadoFormacion':
                    whereClauses.push(`${campo} = ?`);
                    params.push(valor);
                    filterParams.push(valor);
                    break;

                default:
                    // Para otros campos, usar LIKE por defecto
                    whereClauses.push(`${campo} LIKE ?`);
                    params.push(`%${valor}%`);
                    filterParams.push(`%${valor}%`);
            }
        }
    });

    // Construir WHERE
    let whereClause = '';
    if (whereClauses.length > 0) {
        whereClause = ' WHERE ' + whereClauses.join(' AND ');
    }

    // Construir ORDER BY
    let orderClause = ' ORDER BY nombres ASC'; // Default
    if (ordenamiento.campo && ordenamiento.direccion) {
        const camposPermitidos = [
            'id', 'tipoDocumento', 'numeroDocumento', 'estadoFormacion', 'nombres',
            'primerApellido', 'segundoApellido', 'fechaNacimiento', 'eps', 'telefonoFijo',
            'celular', 'direccion', 'barrio', 'departamento', 'municipio', 'correoElectronico',
            'fechaInicioFormacion', 'fechaInicioLectiva', 'fechaFinLectiva', 'fechaInicioProductiva',
            'fechaFinProductiva', 'instructorLectiva', 'instructorProductiva', 'numeroFicha',
            'programaFormacion', 'alternativaSeleccionada', 'areaFormacion', 'empresaPatrocinadora',
            'areaPractica', 'jefeInmediato', 'telefonoEmpresa', 'celularEmpresa', 'direccionEmpresa',
            'correoEmpresa', 'horario'
        ];

        if (camposPermitidos.includes(ordenamiento.campo)) {
            const direccion = ordenamiento.direccion.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            orderClause = ` ORDER BY ${ordenamiento.campo} ${direccion}`;
        }
    }

    // Construir LIMIT
    let limitClause = '';
    if (paginacion.limit && paginacion.offset !== undefined) {
        if (paginacion.limit === -1) {
            // Sin límite
            limitClause = '';
        } else {
            limitClause = ' LIMIT ? OFFSET ?';
            params.push(parseInt(paginacion.limit), parseInt(paginacion.offset));
        }
    }

    // Query completa
    const fullQuery = baseQuery + whereClause + orderClause + limitClause;

    // Query para contar total filtrado
    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery + whereClause}) as subquery`;

    return {
        dataQuery: fullQuery,
        countQuery,
        params,
        filterParams
    };
}

// Función para ejecutar consultas con caché inteligente
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function ejecutarConsultaCacheada(sql, params = [], ttl = CACHE_TTL) {
    const cacheKey = JSON.stringify({ sql, params });

    // Verificar caché
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < ttl) {
        logDatabase('Consulta servida desde caché', { sql: sql.substring(0, 50) + '...' });
        return cached.result;
    }

    try {
        const [rows] = await pool.execute(sql, params);

        // Almacenar en caché
        cache.set(cacheKey, {
            result: rows,
            timestamp: Date.now()
        });

        // Limpiar caché antiguo
        if (cache.size > 100) {
            const oldestKey = cache.keys().next().value;
            cache.delete(oldestKey);
        }

        logDatabase('Consulta ejecutada y cacheada', {
            sql: sql.substring(0, 50) + '...',
            rowsCount: rows.length
        });

        return rows;
    } catch (error) {
        logDatabase('Error en consulta cacheada', {
            sql: sql.substring(0, 50) + '...',
            error: error.message
        });
        throw error;
    }
}

// Función para limpiar caché
function limpiarCache() {
    cache.clear();
    logDatabase('Caché de consultas limpiado');
}

// Función para obtener estadísticas de base de datos
async function obtenerEstadisticasBD() {
    try {
        const stats = {
            connections: {
                active: 0,
                idle: 0,
                total: 0
            },
            tables: {},
            indices: {},
            queries: {
                slow: [],
                frequent: []
            }
        };

        // Estadísticas de conexiones
        const [connectionStats] = await pool.execute(`
            SHOW PROCESSLIST
        `);

        stats.connections.total = connectionStats.length;
        stats.connections.active = connectionStats.filter(conn => conn.Command !== 'Sleep').length;
        stats.connections.idle = connectionStats.filter(conn => conn.Command === 'Sleep').length;

        // Información de tablas
        const [tables] = await pool.execute(`
            SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
        `);

        tables.forEach(table => {
            stats.tables[table.TABLE_NAME] = {
                rows: table.TABLE_ROWS,
                dataSize: table.DATA_LENGTH,
                indexSize: table.INDEX_LENGTH
            };
        });

        // Información de índices
        const [indices] = await pool.execute(`
            SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
            ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
        `);

        indices.forEach(index => {
            if (!stats.indices[index.TABLE_NAME]) {
                stats.indices[index.TABLE_NAME] = [];
            }
            stats.indices[index.TABLE_NAME].push({
                name: index.INDEX_NAME,
                column: index.COLUMN_NAME,
                sequence: index.SEQ_IN_INDEX
            });
        });

        logDatabase('Estadísticas de BD obtenidas', {
            tablesCount: Object.keys(stats.tables).length,
            indicesCount: Object.keys(stats.indices).length
        });

        return stats;
    } catch (error) {
        logDatabase('Error obteniendo estadísticas de BD', { error: error.message });
        throw error;
    }
}

// Función para optimizar consultas lentas
async function identificarConsultasLentas(thresholdMs = 1000) {
    try {
        // En MySQL, podemos usar el performance schema
        const [slowQueries] = await pool.execute(`
            SELECT
                sql_text,
                exec_count,
                avg_timer_wait / 1000000000 as avg_time_sec,
                max_timer_wait / 1000000000 as max_time_sec
            FROM performance_schema.events_statements_summary_by_digest
            WHERE avg_timer_wait > ? * 1000000000
            ORDER BY avg_timer_wait DESC
            LIMIT 10
        `, [thresholdMs / 1000]);

        logDatabase('Consultas lentas identificadas', {
            count: slowQueries.length,
            thresholdMs
        });

        return slowQueries;
    } catch (error) {
        logDatabase('Error identificando consultas lentas', { error: error.message });
        // Fallback si performance schema no está disponible
        return [];
    }
}

// Función para crear vistas materializadas (simuladas con tablas)
async function crearVistasOptimizadas() {
    try {
        // Vista para estadísticas de aprendices
        await pool.execute(`
            CREATE OR REPLACE VIEW vista_estadisticas_aprendices AS
            SELECT
                programaFormacion,
                alternativaSeleccionada,
                estadoFormacion,
                COUNT(*) as cantidad,
                COUNT(CASE WHEN fechaInicioProductiva IS NOT NULL THEN 1 END) as en_etapa_productiva,
                AVG(DATEDIFF(CURDATE(), fechaNacimiento) / 365.25) as edad_promedio
            FROM aprendices
            GROUP BY programaFormacion, alternativaSeleccionada, estadoFormacion
        `);

        // Vista para bitácoras recientes
        await pool.execute(`
            CREATE OR REPLACE VIEW vista_bitacoras_recientes AS
            SELECT
                b.id,
                b.aprendizId,
                b.contenido,
                b.fechaRegistro,
                b.estado,
                a.nombres,
                a.primerApellido,
                a.programaFormacion
            FROM bitacoras b
            JOIN aprendices a ON b.aprendizId = a.id
            WHERE b.fechaRegistro >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            ORDER BY b.fechaRegistro DESC
        `);

        logDatabase('Vistas optimizadas creadas');
    } catch (error) {
        logDatabase('Error creando vistas optimizadas', { error: error.message });
        throw error;
    }
}

// Función para monitorear uso de memoria de consultas
async function monitorearUsoMemoria() {
    try {
        const [memoryStats] = await pool.execute(`
            SHOW ENGINE INNODB STATUS
        `);

        // Extraer información relevante del status
        const statusText = memoryStats[0]['Status'];
        const bufferPoolSize = statusText.match(/Buffer pool size\s+(\d+)/)?.[1];
        const freeBuffers = statusText.match(/Free buffers\s+(\d+)/)?.[1];

        logDatabase('Uso de memoria monitoreado', {
            bufferPoolSize,
            freeBuffers
        });

        return {
            bufferPoolSize: parseInt(bufferPoolSize) || 0,
            freeBuffers: parseInt(freeBuffers) || 0
        };
    } catch (error) {
        logDatabase('Error monitoreando uso de memoria', { error: error.message });
        return null;
    }
}

module.exports = {
    crearIndicesOptimizados,
    crearConsultaPaginada,
    ejecutarConsultaCacheada,
    limpiarCache,
    obtenerEstadisticasBD,
    identificarConsultasLentas,
    crearVistasOptimizadas,
    monitorearUsoMemoria
};