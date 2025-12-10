-- =====================================================
-- SCRIPT SQL OPTIMIZADO - SENA ETAPA PRODUCTIVA
-- Versión: 2.1
-- =====================================================

-- Configuración inicial
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS `mysql-sena-etapa-productiva`
DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `mysql-sena-etapa-productiva`;

-- =====================================================
-- TABLA: APRENDICES
-- =====================================================

CREATE TABLE `aprendices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipoDocumento` enum('CC','TI','CE','PEP','PPT','RU') NOT NULL COMMENT 'Tipo de documento de identidad',
  `genero` enum('MASCULINO','FEMENINO','TRANSEXUAL','NO BINARIO','OTROS') NOT NULL COMMENT 'Género del aprendiz',
  `numeroDocumento` varchar(20) NOT NULL COMMENT 'Número de documento único',
  `estadoFormacion` enum('activo','inactivo','aplazado','retirado','por certificar','certificado') DEFAULT 'activo' COMMENT 'Estado actual de la formación (activo, inactivo, aplazado, retirado, por certificar, certificado)',
  `nombres` varchar(100) NOT NULL COMMENT 'Nombres del aprendiz',
  `primerApellido` varchar(50) NOT NULL COMMENT 'Primer apellido',
  `segundoApellido` varchar(50) DEFAULT NULL COMMENT 'Segundo apellido (opcional)',
  `fechaNacimiento` date NOT NULL COMMENT 'Fecha de nacimiento',
  `eps` varchar(150) DEFAULT NULL COMMENT 'Entidad prestadora de salud',
  `telefonoFijo` varchar(15) DEFAULT NULL COMMENT 'Teléfono fijo',
  `celular` varchar(15) NOT NULL COMMENT 'Número de celular',
  `direccion` varchar(255) NOT NULL COMMENT 'Dirección de residencia',
  `barrio` varchar(100) DEFAULT NULL COMMENT 'Barrio de residencia',
  `departamento` varchar(50) NOT NULL COMMENT 'Departamento',
  `municipio` varchar(50) NOT NULL COMMENT 'Municipio',
  `correoElectronico` varchar(100) NOT NULL COMMENT 'Correo electrónico único',
  `fechaInicioLectiva` date DEFAULT NULL COMMENT 'Fecha de inicio etapa lectiva',
  `fechaFinLectiva` date DEFAULT NULL COMMENT 'Fecha de fin etapa lectiva',
  `fechaInicioProductiva` date DEFAULT NULL COMMENT 'Fecha de inicio etapa productiva',
  `fechaFinProductiva` date DEFAULT NULL COMMENT 'Fecha de fin etapa productiva',
  `instructorLectiva` varchar(100) DEFAULT NULL COMMENT 'Instructor etapa lectiva',
  `instructorProductiva` varchar(100) DEFAULT NULL COMMENT 'Instructor etapa productiva',
  `numeroFicha` varchar(20) NOT NULL COMMENT 'Número de ficha de formación',
  `programaFormacion` varchar(300) NOT NULL COMMENT 'Programa de formación',
  `alternativaSeleccionada` varchar(100) DEFAULT NULL COMMENT 'Alternativa de etapa productiva',
  `areaFormacion` enum('SI','NO') DEFAULT 'NO' COMMENT '¿El área de práctica está relacionada con la formación?',
  `empresaPatrocinadora` varchar(255) DEFAULT NULL COMMENT 'Empresa patrocinadora',
  `areaPractica` varchar(255) DEFAULT NULL COMMENT 'Área de práctica en la empresa',
  `jefeInmediato` varchar(100) DEFAULT NULL COMMENT 'Jefe inmediato en la empresa',
  `telefonoEmpresa` varchar(15) DEFAULT NULL COMMENT 'Teléfono de la empresa',
  `celularEmpresa` varchar(15) DEFAULT NULL COMMENT 'Celular de contacto empresa',
  `direccionEmpresa` varchar(255) DEFAULT NULL COMMENT 'Dirección de la empresa',
  `correoEmpresa` varchar(100) DEFAULT NULL COMMENT 'Correo electrónico de la empresa',
  `horario` varchar(100) DEFAULT NULL COMMENT 'Horario de trabajo',
  `password` varchar(255) DEFAULT NULL COMMENT 'Contraseña hasheada',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del registro',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última actualización',
  `fechaUltimoCorreoAlerta` datetime DEFAULT NULL COMMENT 'Última fecha de envío de correo de alertas',
  `documentoSoporte` varchar(255) DEFAULT NULL COMMENT 'Nombre del archivo de documento de soporte',
  `documentoSoporteOriginal` varchar(255) DEFAULT NULL COMMENT 'Nombre original del documento de soporte',
  `documentoSoportePath` varchar(500) DEFAULT NULL COMMENT 'Ruta completa del documento de soporte',
  `fotoPerfil` varchar(255) DEFAULT NULL COMMENT 'Nombre del archivo de foto de perfil',
  `fotoPerfilPath` varchar(500) DEFAULT NULL COMMENT 'Ruta completa de la foto de perfil',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_numero_documento` (`numeroDocumento`),
  UNIQUE KEY `uk_correo_electronico` (`correoElectronico`),
  KEY `idx_programa_formacion` (`programaFormacion`),
  KEY `idx_alternativa_seleccionada` (`alternativaSeleccionada`),
  KEY `idx_fecha_creacion` (`created_at`),
  KEY `idx_departamento_municipio` (`departamento`, `municipio`),
  KEY `idx_numero_ficha` (`numeroFicha`),
  
  -- Validaciones a nivel de base de datos
  CONSTRAINT `chk_fechas_formacion` CHECK (
    (`fechaInicioLectiva` IS NULL OR `fechaFinProductiva` IS NULL) OR 
    (`fechaInicioLectiva` <= `fechaFinProductiva`)
  ),
  CONSTRAINT `chk_fechas_lectiva` CHECK (
    (`fechaInicioLectiva` IS NULL OR `fechaFinLectiva` IS NULL) OR 
    (`fechaInicioLectiva` <= `fechaFinLectiva`)
  ),
  CONSTRAINT `chk_fechas_productiva` CHECK (
    (`fechaInicioProductiva` IS NULL OR `fechaFinProductiva` IS NULL) OR 
    (`fechaInicioProductiva` <= `fechaFinProductiva`)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla principal de aprendices del SENA';

-- =====================================================
-- TABLA: ADMINISTRADORES
-- =====================================================

CREATE TABLE `administradores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numeroIdentificacion` varchar(30) NOT NULL COMMENT 'Número de identificación',
  `nombreCompleto` varchar(150) NOT NULL COMMENT 'Nombre completo del administrador',
  `fichaGrupo` varchar(100) DEFAULT NULL COMMENT 'Ficha o Grupo',
  `correoInstitucional` varchar(100) NOT NULL COMMENT 'Correo institucional único',
  `telefono` varchar(20) NOT NULL COMMENT 'Teléfono de contacto',
  `departamento` varchar(100) NOT NULL COMMENT 'Departamento o área',
  `cargo` varchar(100) DEFAULT NULL COMMENT 'Cargo o rol',
  `fotoPerfil` varchar(255) DEFAULT NULL COMMENT 'Nombre del archivo de foto de perfil',
  `fotoPerfilPath` varchar(500) DEFAULT NULL COMMENT 'Ruta completa de la foto de perfil',
  `password` varchar(255) DEFAULT NULL COMMENT 'Contraseña hasheada (NULL durante proceso de registro)',
  `rol` enum('admin','super_admin','instructor') DEFAULT 'admin' COMMENT 'Rol del administrador',
  `activo` boolean DEFAULT TRUE COMMENT 'Estado activo/inactivo',
  `ultimoAcceso` timestamp NULL DEFAULT NULL COMMENT 'Último acceso al sistema',
  `intentosFallidos` int DEFAULT 0 COMMENT 'Contador de intentos fallidos',
  `fechaBloqueo` timestamp NULL DEFAULT NULL COMMENT 'Fecha de bloqueo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de actualización',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_correo_institucional_admin` (`correoInstitucional`),
  UNIQUE KEY `uk_numero_identificacion_admin` (`numeroIdentificacion`),
  KEY `idx_rol` (`rol`),
  KEY `idx_activo` (`activo`),
  KEY `idx_ficha_grupo` (`fichaGrupo`),

  CONSTRAINT `chk_intentos_fallidos_admin` CHECK (`intentosFallidos` >= 0 AND `intentosFallidos` <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla de administradores del sistema';

-- =====================================================
-- TABLA: RESET_TOKENS
-- =====================================================

CREATE TABLE `reset_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL COMMENT 'Correo electrónico del usuario',
  `token` varchar(255) NOT NULL COMMENT 'Token único para reset de contraseña',
  `role` enum('admin','aprendiz') NOT NULL DEFAULT 'aprendiz' COMMENT 'Rol del usuario',
  `expiracion` datetime NOT NULL COMMENT 'Fecha de expiración del token',
  `usado` boolean DEFAULT FALSE COMMENT 'Indica si el token ya fue usado',
  `ip_solicitud` varchar(45) DEFAULT NULL COMMENT 'IP desde donde se solicitó el reset',
  `user_agent` text DEFAULT NULL COMMENT 'User agent del navegador',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del token',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_token` (`token`),
  KEY `idx_email` (`email`),
  KEY `idx_expiracion` (`expiracion`),
  KEY `idx_usado` (`usado`),
  KEY `idx_role` (`role`)
  
  -- Nota: La validación de expiración se maneja a nivel de aplicación
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tokens para reset de contraseñas';

-- =====================================================
-- TABLA: SESSIONS
-- =====================================================

CREATE TABLE `sessions` (
  `session_id` varchar(128) NOT NULL COMMENT 'ID único de la sesión',
  `user_id` int DEFAULT NULL COMMENT 'ID del usuario (aprendiz o admin)',
  `user_type` enum('aprendiz','admin') DEFAULT NULL COMMENT 'Tipo de usuario',
  `expires` int unsigned NOT NULL COMMENT 'Timestamp de expiración',
  `data` mediumtext COMMENT 'Datos de la sesión (JSON)',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP del usuario',
  `user_agent` text DEFAULT NULL COMMENT 'User agent del navegador',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
  `last_activity` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actividad',
  
  PRIMARY KEY (`session_id`),
  KEY `idx_user` (`user_id`, `user_type`),
  KEY `idx_expires` (`expires`),
  KEY `idx_last_activity` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sesiones de usuarios';

-- =====================================================
-- TABLA: DOCUMENTOS_APRENDIZ
-- =====================================================

CREATE TABLE `documentos_aprendiz` (
  `id` int NOT NULL AUTO_INCREMENT,
  `aprendiz_id` int NOT NULL COMMENT 'ID del aprendiz propietario',
  `nombre_original` varchar(255) NOT NULL COMMENT 'Nombre original del archivo',
  `nombre_guardado` varchar(255) NOT NULL COMMENT 'Nombre único del archivo en el servidor',
  `ruta_archivo` varchar(500) NOT NULL COMMENT 'Ruta completa del archivo',
  `tipo_mime` varchar(100) NOT NULL COMMENT 'Tipo MIME del archivo',
  `tamano_bytes` bigint NOT NULL COMMENT 'Tamaño del archivo en bytes',
  `tipo_documento` varchar(100) DEFAULT NULL COMMENT 'Tipo de documento (ej: Hoja de Vida, Certificado, etc.)',
  `descripcion` text COMMENT 'Descripción opcional del documento',
  `estado` ENUM('pendiente','aprobado','rechazado') DEFAULT 'pendiente' COMMENT 'Estado del documento',
  `activo` boolean DEFAULT TRUE COMMENT 'Estado activo/inactivo del documento',
  `fecha_subida` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de subida',
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última actualización',
  `fecha_revision` TIMESTAMP NULL DEFAULT NULL COMMENT 'Fecha de revisión del documento',
  `revisado_por` INT NULL COMMENT 'ID del administrador que revisó el documento',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_nombre_guardado` (`nombre_guardado`),
  KEY `idx_aprendiz_id` (`aprendiz_id`),
  KEY `idx_tipo_documento` (`tipo_documento`),
  KEY `idx_fecha_subida` (`fecha_subida`),
  KEY `idx_activo` (`activo`),
  KEY `idx_fecha_revision` (`fecha_revision`),
  KEY `idx_revisado_por` (`revisado_por`),

  CONSTRAINT `fk_documentos_aprendiz` FOREIGN KEY (`aprendiz_id`) REFERENCES `aprendices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_documentos_revisado_por` FOREIGN KEY (`revisado_por`) REFERENCES `administradores` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_tamano_archivo` CHECK (`tamano_bytes` > 0 AND `tamano_bytes` <= 10485760) -- Máximo 10MB
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Documentos subidos por los aprendices';


-- =====================================================
-- TABLA DE NOTIFICACIONES
-- =====================================================

CREATE TABLE IF NOT EXISTS `notificaciones` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `usuario_id` INT NOT NULL COMMENT 'ID del aprendiz',
  `tipo` VARCHAR(50) NOT NULL DEFAULT 'documento_rechazado' COMMENT 'Tipo de notificación',
  `titulo` VARCHAR(255) NOT NULL COMMENT 'Título de la notificación',
  `mensaje` TEXT NOT NULL COMMENT 'Mensaje de la notificación',
  `referencia_id` INT NULL COMMENT 'ID del documento u otro elemento relacionado',
  `referencia_tipo` VARCHAR(50) NULL COMMENT 'Tipo de referencia (documento, bitacora, etc.)',
  `retroalimentacion` TEXT NULL COMMENT 'Retroalimentación o comentarios adicionales',
  `archivo_adjunto` VARCHAR(500) NULL COMMENT 'Ruta del archivo adjunto',
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
-- VISTA PARA DOCUMENTOS PENDIENTES
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
-- PROCEDIMIENTO PARA MARCAR NOTIFICACIONES COMO LEÍDAS
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
-- TABLA: BITACORAS
-- =====================================================

CREATE TABLE `bitacoras` (
  `id` int NOT NULL AUTO_INCREMENT,
  `aprendizId` int NOT NULL COMMENT 'ID del aprendiz',
  `respuesta_desafio` text COMMENT 'Respuesta sobre desafíos enfrentados',
  `respuesta_logro` text COMMENT 'Respuesta sobre logros alcanzados',
  `respuesta_comunicacion` text COMMENT 'Respuesta sobre comunicación',
  `sentimiento_desafio` enum('muy_positivo','positivo','neutral','negativo','muy_negativo') DEFAULT 'neutral' COMMENT 'Sentimiento detectado en desafío',
  `sentimiento_logro` enum('muy_positivo','positivo','neutral','negativo','muy_negativo') DEFAULT 'neutral' COMMENT 'Sentimiento detectado en logro',
  `sentimiento_comunicacion` enum('muy_positivo','positivo','neutral','negativo','muy_negativo') DEFAULT 'neutral' COMMENT 'Sentimiento detectado en comunicación',
  `score_desafio` decimal(3,2) DEFAULT 0.00 COMMENT 'Score de sentimiento desafío (0-1)',
  `score_logro` decimal(3,2) DEFAULT 0.00 COMMENT 'Score de sentimiento logro (0-1)',
  `score_comunicacion` decimal(3,2) DEFAULT 0.00 COMMENT 'Score de sentimiento comunicación (0-1)',
  `sentimiento_general` enum('muy_positivo','positivo','neutral','negativo','muy_negativo') DEFAULT 'neutral' COMMENT 'Sentimiento general de la bitácora',
  `score_promedio` decimal(3,2) DEFAULT 0.00 COMMENT 'Score promedio de todos los sentimientos',
  `confianza` decimal(3,2) DEFAULT 0.00 COMMENT 'Nivel de confianza del análisis (0-1)',
  `contiene_ironia` boolean DEFAULT FALSE COMMENT 'Indica si se detectó ironía',
  `contextos_detectados` json DEFAULT NULL COMMENT 'Contextos detectados por IA',
  `recomendaciones` json DEFAULT NULL COMMENT 'Recomendaciones generadas por IA',
  `emociones_desafio` json DEFAULT NULL COMMENT 'Emociones detectadas por Watson en desafío',
  `emociones_logro` json DEFAULT NULL COMMENT 'Emociones detectadas por Watson en logro',
  `emociones_comunicacion` json DEFAULT NULL COMMENT 'Emociones detectadas por Watson en comunicación',
  `entidades_desafio` json DEFAULT NULL COMMENT 'Entidades detectadas por Watson en desafío',
  `entidades_logro` json DEFAULT NULL COMMENT 'Entidades detectadas por Watson en logro',
  `entidades_comunicacion` json DEFAULT NULL COMMENT 'Entidades detectadas por Watson en comunicación',
  `palabras_clave_desafio` json DEFAULT NULL COMMENT 'Palabras clave detectadas por Watson en desafío',
  `palabras_clave_logro` json DEFAULT NULL COMMENT 'Palabras clave detectadas por Watson en logro',
  `palabras_clave_comunicacion` json DEFAULT NULL COMMENT 'Palabras clave detectadas por Watson en comunicación',
  `estado` enum('borrador','enviada','revisada') DEFAULT 'enviada' COMMENT 'Estado de la bitácora',
  `comentarios_instructor` text COMMENT 'Comentarios del instructor',
  `fechaCreacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
  `fechaEnvio` timestamp NULL DEFAULT NULL COMMENT 'Fecha de envío',
  `fechaRevision` timestamp NULL DEFAULT NULL COMMENT 'Fecha de revisión',
  
  PRIMARY KEY (`id`),
  KEY `idx_aprendiz_fecha` (`aprendizId`, `fechaCreacion`),
  KEY `idx_sentimiento_general` (`sentimiento_general`),
  KEY `idx_score_promedio` (`score_promedio`),
  KEY `idx_fecha_creacion` (`fechaCreacion`),
  
  CONSTRAINT `fk_bitacoras_aprendiz` FOREIGN KEY (`aprendizId`) REFERENCES `aprendices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_scores_validos` CHECK (
    `score_desafio` >= 0 AND `score_desafio` <= 1 AND
    `score_logro` >= 0 AND `score_logro` <= 1 AND
    `score_comunicacion` >= 0 AND `score_comunicacion` <= 1 AND
    `score_promedio` >= 0 AND `score_promedio` <= 1 AND
    `confianza` >= 0 AND `confianza` <= 1
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bitácoras semanales de los aprendices';


-- Agregar columnas de emociones
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bitacoras' AND COLUMN_NAME = 'emociones_desafio') = 0,
    'ALTER TABLE bitacoras ADD COLUMN `emociones_desafio` json DEFAULT NULL COMMENT ''Emociones detectadas por Watson en desafío''',
    'SELECT ''La columna emociones_desafio ya existe'' AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bitacoras' AND COLUMN_NAME = 'emociones_logro') = 0,
    'ALTER TABLE bitacoras ADD COLUMN `emociones_logro` json DEFAULT NULL COMMENT ''Emociones detectadas por Watson en logro''',
    'SELECT ''La columna emociones_logro ya existe'' AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bitacoras' AND COLUMN_NAME = 'emociones_comunicacion') = 0,
    'ALTER TABLE bitacoras ADD COLUMN `emociones_comunicacion` json DEFAULT NULL COMMENT ''Emociones detectadas por Watson en comunicación''',
    'SELECT ''La columna emociones_comunicacion ya existe'' AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar columnas de entidades
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bitacoras' AND COLUMN_NAME = 'entidades_desafio') = 0,
    'ALTER TABLE bitacoras ADD COLUMN `entidades_desafio` json DEFAULT NULL COMMENT ''Entidades detectadas por Watson en desafío''',
    'SELECT ''La columna entidades_desafio ya existe'' AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bitacoras' AND COLUMN_NAME = 'entidades_logro') = 0,
    'ALTER TABLE bitacoras ADD COLUMN `entidades_logro` json DEFAULT NULL COMMENT ''Entidades detectadas por Watson en logro''',
    'SELECT ''La columna entidades_logro ya existe'' AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bitacoras' AND COLUMN_NAME = 'entidades_comunicacion') = 0,
    'ALTER TABLE bitacoras ADD COLUMN `entidades_comunicacion` json DEFAULT NULL COMMENT ''Entidades detectadas por Watson en comunicación''',
    'SELECT ''La columna entidades_comunicacion ya existe'' AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar columnas de palabras clave
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bitacoras' AND COLUMN_NAME = 'palabras_clave_desafio') = 0,
    'ALTER TABLE bitacoras ADD COLUMN `palabras_clave_desafio` json DEFAULT NULL COMMENT ''Palabras clave detectadas por Watson en desafío''',
    'SELECT ''La columna palabras_clave_desafio ya existe'' AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bitacoras' AND COLUMN_NAME = 'palabras_clave_logro') = 0,
    'ALTER TABLE bitacoras ADD COLUMN `palabras_clave_logro` json DEFAULT NULL COMMENT ''Palabras clave detectadas por Watson en logro''',
    'SELECT ''La columna palabras_clave_logro ya existe'' AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bitacoras' AND COLUMN_NAME = 'palabras_clave_comunicacion') = 0,
    'ALTER TABLE bitacoras ADD COLUMN `palabras_clave_comunicacion` json DEFAULT NULL COMMENT ''Palabras clave detectadas por Watson en comunicación''',
    'SELECT ''La columna palabras_clave_comunicacion ya existe'' AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- TABLA: LOGS_ACCESO
-- =====================================================
CREATE TABLE `logs_acceso` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL COMMENT 'ID del usuario',
  `user_type` enum('aprendiz','admin') NOT NULL COMMENT 'Tipo de usuario',
  `accion` enum('login','logout','reset_password','cambio_password','bloqueo','desbloqueo','actualizacion') NOT NULL COMMENT 'Acción realizada',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP del usuario',
  `user_agent` text DEFAULT NULL COMMENT 'User agent del navegador',
  `exitoso` boolean DEFAULT TRUE COMMENT 'Indica si la acción fue exitosa',
  `detalles` json DEFAULT NULL COMMENT 'Detalles adicionales de la acción',
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora del evento',
  
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`, `user_type`),
  KEY `idx_accion` (`accion`),
  KEY `idx_fecha` (`fecha`),
  KEY `idx_exitoso` (`exitoso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Logs de acceso y acciones de usuarios';

-- =====================================================
-- TABLA: MENSAJES (CHAT)
-- =====================================================

CREATE TABLE `mensajes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `remitente_id` int NOT NULL COMMENT 'ID del usuario remitente (aprendiz o admin)',
  `remitente_tipo` enum('aprendiz','admin') NOT NULL COMMENT 'Tipo de remitente',
  `destinatario_id` int NOT NULL COMMENT 'ID del usuario destinatario (aprendiz o admin)',
  `destinatario_tipo` enum('aprendiz','admin') NOT NULL COMMENT 'Tipo de destinatario',
  `mensaje` text NOT NULL COMMENT 'Contenido del mensaje',
  `leido` boolean DEFAULT FALSE COMMENT 'Indica si el mensaje fue leído',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de envío',
  `fecha_lectura` datetime NULL COMMENT 'Fecha en que se leyó el mensaje',

  PRIMARY KEY (`id`),
  KEY `idx_remitente` (`remitente_id`, `remitente_tipo`),
  KEY `idx_destinatario` (`destinatario_id`, `destinatario_tipo`),
  KEY `idx_leido` (`leido`),
  KEY `idx_fecha_creacion` (`fecha_creacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mensajes del sistema de chat entre aprendices y administradores';


-- =====================================================
-- TABLA: CONVERSACIONES_ELIMINADAS
-- =====================================================

CREATE TABLE `conversaciones_eliminadas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL COMMENT 'ID del usuario que eliminó la conversación',
  `usuario_tipo` enum('aprendiz','admin') NOT NULL COMMENT 'Tipo del usuario que eliminó',
  `otro_usuario_id` int NOT NULL COMMENT 'ID del otro usuario en la conversación',
  `otro_usuario_tipo` enum('aprendiz','admin') NOT NULL COMMENT 'Tipo del otro usuario',
  `fecha_eliminacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de eliminación',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conversacion_eliminada` (`usuario_id`, `usuario_tipo`, `otro_usuario_id`, `otro_usuario_tipo`),
  KEY `idx_usuario` (`usuario_id`, `usuario_tipo`),
  KEY `idx_otro_usuario` (`otro_usuario_id`, `otro_usuario_tipo`),
  KEY `idx_fecha_eliminacion` (`fecha_eliminacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Conversaciones eliminadas unilateralmente por usuarios';

-- =====================================================
-- TABLA: CONFIGURACION_SISTEMA
-- =====================================================
CREATE TABLE `configuracion_sistema` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clave` varchar(100) NOT NULL COMMENT 'Clave de configuración',
  `valor` text NOT NULL COMMENT 'Valor de la configuración',
  `tipo` enum('string','number','boolean','json') DEFAULT 'string' COMMENT 'Tipo de dato del valor',
  `descripcion` text COMMENT 'Descripción de la configuración',
  `categoria` varchar(50) DEFAULT 'general' COMMENT 'Categoría de la configuración',
  `editable` boolean DEFAULT TRUE COMMENT 'Indica si es editable desde la interfaz',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de actualización',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_clave` (`clave`),
  KEY `idx_categoria` (`categoria`),
  KEY `idx_editable` (`editable`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configuraciones del sistema';

-- =====================================================
-- INSERTAR CONFIGURACIONES INICIALES
-- =====================================================
INSERT INTO `configuracion_sistema` (`clave`, `valor`, `tipo`, `descripcion`, `categoria`) VALUES
('max_intentos_login', '5', 'number', 'Máximo número de intentos fallidos de login', 'seguridad'),
('tiempo_bloqueo_minutos', '30', 'number', 'Tiempo de bloqueo en minutos tras intentos fallidos', 'seguridad'),
('duracion_sesion_horas', '24', 'number', 'Duración de la sesión en horas', 'seguridad'),
('tamano_max_archivo_mb', '10', 'number', 'Tamaño máximo de archivo en MB', 'archivos'),
('tipos_archivo_permitidos', '["pdf","doc","docx","xls","xlsx","jpg","jpeg","png"]', 'json', 'Tipos de archivo permitidos', 'archivos'),
('habilitar_analisis_sentimientos', 'true', 'boolean', 'Habilitar análisis de sentimientos con IA', 'ia'),
('umbral_confianza_ia', '0.7', 'number', 'Umbral mínimo de confianza para análisis de IA', 'ia'),
('notificaciones_email', 'true', 'boolean', 'Habilitar notificaciones por email', 'notificaciones'),
('mantenimiento_modo', 'false', 'boolean', 'Modo mantenimiento del sistema', 'sistema');


-- =====================================================
-- CREAR VISTAS ÚTILES
-- =====================================================

-- Vista para estadísticas de aprendices (actualizada sin columna estado)
CREATE OR REPLACE VIEW `v_estadisticas_aprendices` AS
SELECT
    COUNT(*) as total_aprendices,
    COUNT(CASE WHEN estadoFormacion = 'activo' THEN 1 END) as activos,
    COUNT(CASE WHEN estadoFormacion = 'inactivo' THEN 1 END) as inactivos,
    COUNT(CASE WHEN estadoFormacion = 'aplazado' THEN 1 END) as aplazados,
    COUNT(CASE WHEN estadoFormacion = 'retirado' THEN 1 END) as retirados,
    COUNT(CASE WHEN estadoFormacion = 'certificado' THEN 1 END) as certificados
FROM aprendices;

-- Vista para resumen de bitácoras
CREATE OR REPLACE VIEW `v_resumen_bitacoras` AS
SELECT 
    a.id as aprendiz_id,
    CONCAT(a.nombres, ' ', a.primerApellido) as nombre_completo,
    a.numeroFicha,
    a.programaFormacion,
    COUNT(b.id) as total_bitacoras,
    COUNT(CASE WHEN b.sentimiento_general = 'positivo' THEN 1 END) as bitacoras_positivas,
    COUNT(CASE WHEN b.sentimiento_general = 'negativo' THEN 1 END) as bitacoras_negativas,
    COUNT(CASE WHEN b.sentimiento_general = 'neutral' THEN 1 END) as bitacoras_neutrales,
    AVG(b.score_promedio) as promedio_sentimiento,
    MAX(b.fechaCreacion) as ultima_bitacora
FROM aprendices a
LEFT JOIN bitacoras b ON a.id = b.aprendizId
GROUP BY a.id, a.nombres, a.primerApellido, a.numeroFicha, a.programaFormacion;

-- =====================================================
-- PROCEDIMIENTOS ALMACENADOS ÚTILES
-- =====================================================

DELIMITER //

-- Procedimiento para limpiar tokens expirados
CREATE PROCEDURE `sp_limpiar_tokens_expirados`()
BEGIN
    DELETE FROM reset_tokens 
    WHERE expiracion < NOW() OR usado = TRUE;
END //

-- Procedimiento para limpiar sesiones expiradas
CREATE PROCEDURE `sp_limpiar_sesiones_expiradas`()
BEGIN
    DELETE FROM sessions 
    WHERE expires < UNIX_TIMESTAMP();
END //

-- Procedimiento para obtener estadísticas de sentimientos
CREATE PROCEDURE `sp_estadisticas_sentimientos`(IN p_fecha_inicio DATE, IN p_fecha_fin DATE)
BEGIN
    SELECT
        sentimiento_general,
        COUNT(*) as cantidad,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM bitacoras WHERE DATE(fechaCreacion) BETWEEN p_fecha_inicio AND p_fecha_fin), 2) as porcentaje
    FROM bitacoras
    WHERE DATE(fechaCreacion) BETWEEN p_fecha_inicio AND p_fecha_fin
    GROUP BY sentimiento_general
    ORDER BY cantidad DESC;
END //

-- Procedimiento para desbloquear usuarios
CREATE PROCEDURE `sp_desbloquear_usuario`(IN p_user_id INT, IN p_user_type ENUM('aprendiz', 'admin'))
BEGIN
    IF p_user_type = 'aprendiz' THEN
        UPDATE aprendices
        SET intentosFallidos = 0, fechaBloqueo = NULL, estadoFormacion = 'activo'
        WHERE id = p_user_id;
    ELSE
        UPDATE administradores
        SET intentosFallidos = 0, fechaBloqueo = NULL, activo = TRUE
        WHERE id = p_user_id;
    END IF;
END //

DELIMITER //

DROP PROCEDURE IF EXISTS `sp_cumplimiento_documentos`//

CREATE PROCEDURE `sp_cumplimiento_documentos`(IN p_mes INT, IN p_anio INT)
BEGIN
    SELECT
        CASE
            WHEN porcentaje_cumplimiento >= 90 THEN 'Excelente (>=90%)'
            WHEN porcentaje_cumplimiento >= 80 THEN 'Bueno (80-89%)'
            WHEN porcentaje_cumplimiento >= 60 THEN 'Regular (60-79%)'
            WHEN porcentaje_cumplimiento > 0 THEN 'Deficiente (<60%)'
            ELSE 'Sin documentos'
        END as estado_documentos,
        COUNT(*) as cantidad,
        ROUND(AVG(porcentaje_cumplimiento), 1) as promedio_porcentaje
    FROM (
        SELECT
            a.id,
            COUNT(da.id) as docs_subidos,
            -- Calcular meses transcurridos desde inicio de etapa productiva
            LEAST(6, GREATEST(0, TIMESTAMPDIFF(MONTH, a.fechaInicioProductiva, NOW()))) as meses_etapa,
            -- Documentos esperados hasta ahora: (2 documentos x meses) + 3 documentos base
            GREATEST(3, (LEAST(6, GREATEST(0, TIMESTAMPDIFF(MONTH, a.fechaInicioProductiva, NOW()))) * 2) + 3) as docs_esperados,
            -- Porcentaje de cumplimiento basado en lo esperado vs lo subido
            CASE
                WHEN TIMESTAMPDIFF(MONTH, a.fechaInicioProductiva, NOW()) < 0 THEN 0
                ELSE ROUND((COUNT(da.id) / GREATEST(3, (LEAST(6, GREATEST(0, TIMESTAMPDIFF(MONTH, a.fechaInicioProductiva, NOW()))) * 2) + 3)) * 100, 1)
            END as porcentaje_cumplimiento
        FROM aprendices a
        LEFT JOIN documentos_aprendiz da ON a.id = da.aprendiz_id AND da.activo = 1
        WHERE a.estadoFormacion = 'activo'
        AND a.fechaInicioProductiva IS NOT NULL
        AND (p_mes IS NULL OR p_anio IS NULL OR (a.fechaInicioProductiva <= LAST_DAY(CONCAT(p_anio, '-', LPAD(p_mes, 2, '0'), '-01')) AND (a.fechaFinProductiva IS NULL OR a.fechaFinProductiva >= CONCAT(p_anio, '-', LPAD(p_mes, 2, '0'), '-01'))))
        GROUP BY a.id, a.fechaInicioProductiva
    ) cumplimiento
    GROUP BY estado_documentos
    ORDER BY
        CASE estado_documentos
            WHEN 'Excelente (>=90%)' THEN 1
            WHEN 'Bueno (80-89%)' THEN 2
            WHEN 'Regular (60-79%)' THEN 3
            WHEN 'Deficiente (<60%)' THEN 4
            ELSE 5
        END;
END//

DELIMITER //

DROP PROCEDURE IF EXISTS `sp_cumplimiento_seguimiento`//

CREATE PROCEDURE `sp_cumplimiento_seguimiento`(IN p_mes INT, IN p_anio INT)
BEGIN
    SELECT
        CASE
            WHEN porcentaje_cumplimiento >= 90 THEN 'Excelente (>=90%)'
            WHEN porcentaje_cumplimiento >= 80 THEN 'Bueno (80-89%)'
            WHEN porcentaje_cumplimiento >= 60 THEN 'Regular (60-79%)'
            WHEN porcentaje_cumplimiento > 0 THEN 'Deficiente (<60%)'
            ELSE 'Sin seguimientos'
        END as estado_seguimiento,
        COUNT(*) as cantidad,
        ROUND(AVG(porcentaje_cumplimiento), 1) as promedio_porcentaje
    FROM (
        SELECT
            a.id,
            COUNT(b.id) as bitacoras_enviadas,
            -- Calcular quincenas transcurridas desde inicio de etapa productiva (máximo 12 quincenas = 6 meses)
            LEAST(12, GREATEST(0, TIMESTAMPDIFF(DAY, a.fechaInicioProductiva, NOW()) DIV 15)) as quincenas_transcurridas,
            -- Bitácoras esperadas hasta ahora: 1 por cada quincena transcurrida
            GREATEST(0, LEAST(12, GREATEST(0, TIMESTAMPDIFF(DAY, a.fechaInicioProductiva, NOW()) DIV 15))) as bitacoras_esperadas,
            -- Porcentaje de cumplimiento basado en lo esperado vs lo enviado
            CASE
                WHEN TIMESTAMPDIFF(DAY, a.fechaInicioProductiva, NOW()) < 0 THEN 0
                WHEN LEAST(12, GREATEST(0, TIMESTAMPDIFF(DAY, a.fechaInicioProductiva, NOW()) DIV 15)) = 0 THEN 0
                ELSE ROUND((COUNT(b.id) / GREATEST(1, LEAST(12, GREATEST(0, TIMESTAMPDIFF(DAY, a.fechaInicioProductiva, NOW()) DIV 15)))) * 100, 1)
            END as porcentaje_cumplimiento
        FROM aprendices a
        LEFT JOIN bitacoras b ON a.id = b.aprendizId AND b.estado = 'enviada'
        WHERE a.estadoFormacion = 'activo'
        AND a.fechaInicioProductiva IS NOT NULL
        AND (p_mes IS NULL OR p_anio IS NULL OR (a.fechaInicioProductiva <= LAST_DAY(CONCAT(p_anio, '-', LPAD(p_mes, 2, '0'), '-01')) AND (a.fechaFinProductiva IS NULL OR a.fechaFinProductiva >= CONCAT(p_anio, '-', LPAD(p_mes, 2, '0'), '-01'))))
        GROUP BY a.id, a.fechaInicioProductiva
    ) cumplimiento
    GROUP BY estado_seguimiento
    ORDER BY
        CASE estado_seguimiento
            WHEN 'Excelente (>=90%)' THEN 1
            WHEN 'Bueno (80-89%)' THEN 2
            WHEN 'Regular (60-79%)' THEN 3
            WHEN 'Deficiente (<60%)' THEN 4
            ELSE 5
        END;
END//

DELIMITER ;

-- =====================================================
-- EVENTOS AUTOMÁTICOS
-- =====================================================

-- Evento para limpiar tokens expirados diariamente
CREATE EVENT `ev_limpiar_tokens_expirados`
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO CALL sp_limpiar_tokens_expirados();

-- Evento para limpiar sesiones expiradas cada hora
CREATE EVENT `ev_limpiar_sesiones_expiradas`
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO CALL sp_limpiar_sesiones_expiradas();

-- =====================================================
-- TRIGGERS PARA AUDITORÍA
-- =====================================================

DELIMITER //

-- Trigger para log de cambios en aprendices
CREATE TRIGGER `tr_aprendices_after_update`
AFTER UPDATE ON `aprendices`
FOR EACH ROW
BEGIN
    IF OLD.estadoFormacion != NEW.estadoFormacion THEN
        INSERT INTO logs_acceso (user_id, user_type, accion, exitoso, detalles)
        VALUES (NEW.id, 'aprendiz',
                CASE
                    WHEN NEW.estadoFormacion = 'retirado' THEN 'bloqueo'
                    WHEN OLD.estadoFormacion = 'retirado' AND NEW.estadoFormacion != 'retirado' THEN 'desbloqueo'
                    ELSE 'actualizacion'
                END,
                TRUE,
                JSON_OBJECT('estado_anterior', OLD.estadoFormacion, 'estado_nuevo', NEW.estadoFormacion));
    END IF;
END //

-- Trigger para log de cambios en administradores
CREATE TRIGGER `tr_administradores_after_update`
AFTER UPDATE ON `administradores`
FOR EACH ROW
BEGIN
    IF OLD.activo != NEW.activo THEN
        INSERT INTO logs_acceso (user_id, user_type, accion, exitoso, detalles)
        VALUES (NEW.id, 'admin', 
                CASE 
                    WHEN NEW.activo = FALSE THEN 'bloqueo'
                    ELSE 'desbloqueo'
                END,
                TRUE,
                JSON_OBJECT('activo_anterior', OLD.activo, 'activo_nuevo', NEW.activo));
    END IF;
END //

DELIMITER //

-- Trigger para validar antes de INSERT
CREATE TRIGGER tr_mensajes_before_insert
BEFORE INSERT ON mensajes
FOR EACH ROW
BEGIN
    -- Validar remitente
    IF NEW.remitente_tipo = 'aprendiz' THEN
        IF NOT EXISTS (SELECT 1 FROM aprendices WHERE id = NEW.remitente_id) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El remitente aprendiz especificado no existe';
        END IF;
    ELSEIF NEW.remitente_tipo = 'admin' THEN
        IF NOT EXISTS (SELECT 1 FROM administradores WHERE id = NEW.remitente_id) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El remitente administrador especificado no existe';
        END IF;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tipo de remitente inválido';
    END IF;

    -- Validar destinatario
    IF NEW.destinatario_tipo = 'aprendiz' THEN
        IF NOT EXISTS (SELECT 1 FROM aprendices WHERE id = NEW.destinatario_id) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El destinatario aprendiz especificado no existe';
        END IF;
    ELSEIF NEW.destinatario_tipo = 'admin' THEN
        IF NOT EXISTS (SELECT 1 FROM administradores WHERE id = NEW.destinatario_id) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El destinatario administrador especificado no existe';
        END IF;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tipo de destinatario inválido';
    END IF;
END //

-- Trigger para validar antes de UPDATE
CREATE TRIGGER tr_mensajes_before_update
BEFORE UPDATE ON mensajes
FOR EACH ROW
BEGIN
    -- Solo validar si cambian los campos de referencia
    IF NEW.remitente_id != OLD.remitente_id OR NEW.remitente_tipo != OLD.remitente_tipo THEN
        -- Validar remitente
        IF NEW.remitente_tipo = 'aprendiz' THEN
            IF NOT EXISTS (SELECT 1 FROM aprendices WHERE id = NEW.remitente_id) THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El remitente aprendiz especificado no existe';
            END IF;
        ELSEIF NEW.remitente_tipo = 'admin' THEN
            IF NOT EXISTS (SELECT 1 FROM administradores WHERE id = NEW.remitente_id) THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El remitente administrador especificado no existe';
            END IF;
        ELSE
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tipo de remitente inválido';
        END IF;
    END IF;

    IF NEW.destinatario_id != OLD.destinatario_id OR NEW.destinatario_tipo != OLD.destinatario_tipo THEN
        -- Validar destinatario
        IF NEW.destinatario_tipo = 'aprendiz' THEN
            IF NOT EXISTS (SELECT 1 FROM aprendices WHERE id = NEW.destinatario_id) THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El destinatario aprendiz especificado no existe';
            END IF;
        ELSEIF NEW.destinatario_tipo = 'admin' THEN
            IF NOT EXISTS (SELECT 1 FROM administradores WHERE id = NEW.destinatario_id) THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El destinatario administrador especificado no existe';
            END IF;
        ELSE
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tipo de destinatario inválido';
        END IF;
    END IF;
END //

DELIMITER ;


-- =====================================================
-- SCRIPT DE VERIFICACIÓN SIMPLE - SENA ETAPA PRODUCTIVA
-- Propósito: Verificar estructura básica y funcionalidad
-- Ejecutar comandos uno por uno para evitar errores
-- =====================================================

-- Seleccionar la base de datos
USE `mysql-sena-etapa-productiva`;

-- =====================================================
-- 1. VERIFICACIÓN BÁSICA DE TABLAS
-- =====================================================

-- Mostrar todas las tablas creadas
SHOW TABLES;

-- =====================================================
-- 2. VERIFICAR CONTEO DE REGISTROS
-- =====================================================

-- Verificar conteo de registros en cada tabla
SELECT 'aprendices' as tabla, COUNT(*) as registros FROM aprendices;
SELECT 'administradores' as tabla, COUNT(*) as registros FROM administradores;
SELECT 'bitacoras' as tabla, COUNT(*) as registros FROM bitacoras;
SELECT 'logs_acceso' as tabla, COUNT(*) as registros FROM logs_acceso;
SELECT 'configuracion_sistema' as tabla, COUNT(*) as registros FROM configuracion_sistema;

-- =====================================================
-- 3. VERIFICAR ESTRUCTURA DE TABLAS PRINCIPALES
-- =====================================================

-- Verificar estructura de tabla aprendices
DESCRIBE aprendices;

-- Verificar estructura de administradores
DESCRIBE administradores;

-- =====================================================
-- 4. VERIFICAR ÍNDICES
-- =====================================================

-- Mostrar índices de la tabla aprendices
SHOW INDEX FROM aprendices;

-- =====================================================
-- 5. VERIFICAR ADMINISTRADOR POR DEFECTO
-- =====================================================

-- Verificar que existe el administrador por defecto
SELECT 
    id, 
    nombreCompleto, 
    correoInstitucional, 
    rol, 
    activo,
    created_at
FROM administradores 
WHERE rol = 'super_admin';

-- =====================================================
-- 6. VERIFICAR CONFIGURACIONES
-- =====================================================

-- Verificar configuraciones del sistema
SELECT 
    clave,
    valor,
    tipo,
    descripcion,
    categoria
FROM configuracion_sistema
ORDER BY categoria, clave;

-- =====================================================
-- 7. INFORMACIÓN DEL SERVIDOR
-- =====================================================

-- Verificar versión de MySQL y base de datos actual
SELECT VERSION() as version_mysql;
SELECT DATABASE() as base_datos_actual;
SELECT USER() as usuario_actual;

-- =====================================================
-- MENSAJE FINAL
-- =====================================================

SELECT '✅ VERIFICACIÓN COMPLETADA' as estado;
SELECT 'La base de datos está funcionando correctamente' as mensaje;
SELECT 'Todas las tablas han sido creadas exitosamente' as detalle;


-- ===============================================================================================


select * from aprendices;
delete from aprendices;

select * from administradores;
delete from administradores where id='6';

SELECT * FROM mensajes ORDER BY fecha_creacion DESC LIMIT 5;
SELECT * FROM mensajes 
WHERE (remitente_id = 1 AND destinatario_id = 2) 
   OR (remitente_id = 1 AND destinatario_id = 2)
ORDER BY fecha_creacion ASC

DELETE FROM mensajes;
TRUNCATE TABLE mensajes;


