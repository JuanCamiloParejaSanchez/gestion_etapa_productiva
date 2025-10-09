-- =====================================================
-- ALTERNATIVA: Mantener consultas SQL en código JavaScript
-- Si hay problemas con procedimientos almacenados, revertir a este enfoque
-- =====================================================

-- Este archivo documenta cómo volver a las consultas SQL originales
-- en caso de que los procedimientos almacenados no funcionen

/*
En servicioGestionAprendices.js, reemplazar:

// Consulta cumplimiento de documentos (usando procedimiento almacenado)
const [documentosResult] = await pool.execute('CALL sp_cumplimiento_documentos()');

// Consulta cumplimiento de seguimiento (usando procedimiento almacenado)
const [seguimientoResult] = await pool.execute('CALL sp_cumplimiento_seguimiento()');

POR:

// Consulta cumplimiento de documentos (consulta SQL directa)
const [documentosResult] = await pool.execute(`
    SELECT
        CASE
            WHEN docs_subidos >= 13 THEN 'Al día'
            ELSE 'Pendiente'
        END as estado_documentos,
        COUNT(*) as cantidad
    FROM (
        SELECT
            a.id,
            COUNT(da.id) as docs_subidos
        FROM aprendices a
        LEFT JOIN documentos_aprendiz da ON a.id = da.aprendiz_id AND da.activo = 1
        GROUP BY a.id
    ) as resumen_docs
    GROUP BY estado_documentos
    ORDER BY estado_documentos DESC
`);

// Consulta cumplimiento de seguimiento (consulta SQL directa)
const [seguimientoResult] = await pool.execute(`
    SELECT
        CASE
            WHEN bitacoras_recientes > 0 THEN 'Al día'
            ELSE 'Pendiente'
        END as estado_seguimiento,
        COUNT(*) as cantidad
    FROM (
        SELECT
            a.id,
            COUNT(CASE WHEN b.fechaCreacion >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as bitacoras_recientes
        FROM aprendices a
        LEFT JOIN bitacoras b ON a.id = b.aprendizId
        GROUP BY a.id
    ) as resumen_bitacoras
    GROUP BY estado_seguimiento
    ORDER BY estado_seguimiento DESC
`);

*/

SELECT 'Este archivo contiene las consultas SQL originales como alternativa' as info;
SELECT 'Usar solo si hay problemas con los procedimientos almacenados' as nota;