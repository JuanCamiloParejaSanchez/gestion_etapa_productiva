-- Script para agregar índice faltante en estadoFormacion para optimizar consultas de reportes
USE sena_etapa_productiva;

-- Agregar índice para estadoFormacion si no existe
SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'aprendices'
     AND INDEX_NAME = 'idx_estado_formacion') = 0,
    'ALTER TABLE aprendices ADD INDEX idx_estado_formacion (estadoFormacion)',
    'SELECT "El índice idx_estado_formacion ya existe" AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar que el índice se creó
SHOW INDEX FROM aprendices WHERE Key_name = 'idx_estado_formacion';