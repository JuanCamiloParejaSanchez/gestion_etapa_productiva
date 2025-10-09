-- Script para probar los procedimientos almacenados de reportes
-- Ejecutar después de crear la base de datos con MySQL.sql

USE sena_etapa_productiva;

-- =====================================================
-- PRUEBA DE PROCEDIMIENTOS DE REPORTES
-- =====================================================

SELECT "=== PRUEBA: Cumplimiento de Documentos ===" as prueba;
CALL sp_cumplimiento_documentos();

SELECT "=== PRUEBA: Cumplimiento de Seguimiento ===" as prueba;
CALL sp_cumplimiento_seguimiento();

-- Verificar que los procedimientos existen
SELECT "=== PROCEDIMIENTOS DISPONIBLES ===" as info;
SHOW PROCEDURE STATUS WHERE Db = 'sena_etapa_productiva' AND Name LIKE 'sp_cumplimiento_%';

-- Verificar estructura de resultados
SELECT "=== ESTRUCTURA DE RESULTADOS ===" as info;
DESCRIBE aprendices;
DESCRIBE documentos_aprendiz;
DESCRIBE bitacoras;

-- Conteo de registros para validar cálculos
SELECT "=== VALIDACIÓN DE DATOS ===" as validacion;
SELECT
    "Total aprendices" as descripcion,
    COUNT(*) as cantidad
FROM aprendices
UNION ALL
SELECT
    "Documentos activos" as descripcion,
    COUNT(*) as cantidad
FROM documentos_aprendiz
WHERE activo = 1
UNION ALL
SELECT
    "Bitácoras totales" as descripcion,
    COUNT(*) as cantidad
FROM bitacoras
UNION ALL
SELECT
    "Bitácoras últimas 30 días" as descripcion,
    COUNT(*) as cantidad
FROM bitacoras
WHERE fechaCreacion >= DATE_SUB(NOW(), INTERVAL 30 DAY);

SELECT "✅ PRUEBAS COMPLETADAS" as resultado;