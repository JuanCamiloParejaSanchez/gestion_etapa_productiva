-- Script para agregar 'actualizacion' al enum de la columna accion en logs_acceso
USE sena_etapa_productiva;

ALTER TABLE logs_acceso
MODIFY COLUMN accion ENUM('login','logout','reset_password','cambio_password','bloqueo','desbloqueo','actualizacion') NOT NULL;