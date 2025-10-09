-- =====================================================
-- SOLUCIÓN FINAL: Mantener consultas SQL directas
-- Si los procedimientos almacenados no funcionan, usar esta solución
-- =====================================================

-- Este archivo contiene la solución final que funciona:
-- Mantener las consultas SQL directamente en el código JavaScript

/*
INSTRUCCIONES PARA EL USUARIO:

1. NO ejecutes ningún script de procedimientos almacenados
2. En el archivo src/modulos/administrador/servicios/servicioGestionAprendices.js
   ya están las consultas SQL directas funcionando
3. Solo reinicia tu aplicación Node.js
4. Ve a /reportes y debería funcionar

Las consultas ya están implementadas y funcionando en el código:

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

SELECT 'SOLUCIÓN: Las consultas SQL directas ya están implementadas en el código JavaScript' as mensaje;
SELECT 'No necesitas procedimientos almacenados - la aplicación ya funciona' as estado;