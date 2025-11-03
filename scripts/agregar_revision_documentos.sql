-- =====================================================
-- SCRIPT: Agregar funcionalidad de revisión de documentos
-- Fecha: 2 de noviembre de 2025
-- =====================================================

USE `sena_etapa_productiva`;

-- =====================================================
-- 1. AGREGAR COLUMNAS A TABLA documentos_aprendiz
-- =====================================================

-- Agregar columna de estado
ALTER TABLE `documentos_aprendiz` 
ADD COLUMN `estado` ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente' COMMENT 'Estado de revisión del documento'
AFTER `descripcion`;

-- Agregar columna de retroalimentación
ALTER TABLE `documentos_aprendiz` 
ADD COLUMN `retroalimentacion` TEXT NULL COMMENT 'Comentarios del administrador sobre el documento'
AFTER `estado`;

-- Agregar columna de fecha de revisión
ALTER TABLE `documentos_aprendiz` 
ADD COLUMN `fecha_revision` DATETIME NULL COMMENT 'Fecha en que se revisó el documento'
AFTER `retroalimentacion`;

-- Agregar columna del revisor
ALTER TABLE `documentos_aprendiz` 
ADD COLUMN `revisado_por` INT NULL COMMENT 'ID del administrador que revisó el documento'
AFTER `fecha_revision`;

-- Agregar foreign key para el revisor
ALTER TABLE `documentos_aprendiz`
ADD CONSTRAINT `fk_documentos_revisor` 
FOREIGN KEY (`revisado_por`) REFERENCES `administradores` (`id`) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Agregar índice para búsquedas por estado
ALTER TABLE `documentos_aprendiz`
ADD INDEX `idx_estado` (`estado`);

-- =====================================================
-- 2. CREAR TABLA DE NOTIFICACIONES
-- =====================================================

CREATE TABLE IF NOT EXISTS `notificaciones` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `usuario_id` INT NOT NULL COMMENT 'ID del aprendiz',
  `tipo` VARCHAR(50) NOT NULL DEFAULT 'documento_rechazado' COMMENT 'Tipo de notificación',
  `titulo` VARCHAR(255) NOT NULL COMMENT 'Título de la notificación',
  `mensaje` TEXT NOT NULL COMMENT 'Mensaje de la notificación',
  `referencia_id` INT NULL COMMENT 'ID del documento u otro elemento relacionado',
  `referencia_tipo` VARCHAR(50) NULL COMMENT 'Tipo de referencia (documento, bitacora, etc.)',
  `leida` BOOLEAN DEFAULT FALSE COMMENT 'Indica si la notificación fue leída',
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
  `fecha_lectura` DATETIME NULL COMMENT 'Fecha en que se leyó la notificación',
  
  PRIMARY KEY (`id`),
  KEY `idx_usuario_id` (`usuario_id`),
  KEY `idx_leida` (`leida`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_fecha_creacion` (`fecha_creacion`),
  
  CONSTRAINT `fk_notificaciones_aprendiz` 
  FOREIGN KEY (`usuario_id`) REFERENCES `aprendices` (`id`) 
  ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Notificaciones del sistema para aprendices';

-- =====================================================
-- 3. CREAR VISTA PARA DOCUMENTOS PENDIENTES
-- =====================================================

CREATE OR REPLACE VIEW `v_documentos_pendientes_revision` AS
SELECT 
    d.id,
    d.aprendiz_id,
    CONCAT(a.nombres, ' ', a.primerApellido, ' ', IFNULL(a.segundoApellido, '')) as nombre_aprendiz,
    a.correoElectronico,
    d.tipo_documento,
    d.nombre_original,
    d.fecha_subida,
    d.estado
FROM documentos_aprendiz d
INNER JOIN aprendices a ON d.aprendiz_id = a.id
WHERE d.estado = 'pendiente' AND d.activo = TRUE
ORDER BY d.fecha_subida ASC;

-- =====================================================
-- 4. CREAR PROCEDIMIENTO PARA MARCAR NOTIFICACIONES COMO LEÍDAS
-- =====================================================

DELIMITER //

DROP PROCEDURE IF EXISTS `sp_marcar_notificaciones_leidas`//

CREATE PROCEDURE `sp_marcar_notificaciones_leidas`(IN p_usuario_id INT)
BEGIN
    UPDATE notificaciones
    SET leida = TRUE,
        fecha_lectura = NOW()
    WHERE usuario_id = p_usuario_id 
      AND leida = FALSE;
END //

DELIMITER ;

-- =====================================================
-- 5. CREAR TRIGGER PARA NOTIFICACIONES AUTOMÁTICAS
-- =====================================================

DELIMITER //

DROP TRIGGER IF EXISTS `tr_documento_rechazado_notificacion`//

CREATE TRIGGER `tr_documento_rechazado_notificacion`
AFTER UPDATE ON `documentos_aprendiz`
FOR EACH ROW
BEGIN
    -- Si el documento cambia a estado 'rechazado', crear notificación
    IF NEW.estado = 'rechazado' AND OLD.estado != 'rechazado' THEN
        INSERT INTO notificaciones (
            usuario_id, 
            tipo, 
            titulo,
            mensaje, 
            referencia_id, 
            referencia_tipo
        ) VALUES (
            NEW.aprendiz_id,
            'documento_rechazado',
            CONCAT('Documento rechazado: ', NEW.tipo_documento),
            CONCAT('El documento "', NEW.tipo_documento, '" no fue aprobado. Revisa la retroalimentación hecha por el tutor(a) para que lo corrijas y lo envíes nuevamente.'),
            NEW.id,
            'documento'
        );
    END IF;
    
    -- Si el documento cambia a estado 'aprobado', crear notificación
    IF NEW.estado = 'aprobado' AND OLD.estado != 'aprobado' THEN
        INSERT INTO notificaciones (
            usuario_id, 
            tipo, 
            titulo,
            mensaje, 
            referencia_id, 
            referencia_tipo
        ) VALUES (
            NEW.aprendiz_id,
            'documento_aprobado',
            CONCAT('Documento aprobado: ', NEW.tipo_documento),
            CONCAT('El documento "', NEW.tipo_documento, '" ha sido aprobado correctamente.'),
            NEW.id,
            'documento'
        );
    END IF;
END //

DELIMITER ;

-- =====================================================
-- MENSAJE FINAL
-- =====================================================

SELECT '✅ SCRIPT EJECUTADO CORRECTAMENTE' as estado;
SELECT 'Funcionalidad de revisión de documentos agregada' as mensaje;
