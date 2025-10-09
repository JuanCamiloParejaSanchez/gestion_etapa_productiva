# INSTRUCCIONES PARA BASE DE DATOS OPTIMIZADA

## 📋 Resumen de Mejoras Implementadas

### 🔒 **Seguridad Mejorada**
- **Contraseñas hasheadas**: Todas las contraseñas se almacenan con hash bcrypt
- **Control de intentos fallidos**: Bloqueo automático tras 5 intentos fallidos
- **Tokens de reset seguros**: Tokens únicos con expiración automática
- **Auditoría completa**: Logs de todas las acciones de usuarios
- **Validaciones a nivel de BD**: Constraints para prevenir datos inválidos

### ⚡ **Rendimiento Optimizado**
- **Índices estratégicos**: Índices en campos de consulta frecuente
- **Tipos de datos optimizados**: Uso de ENUMs y tipos apropiados
- **Vistas precalculadas**: Estadísticas y resúmenes optimizados
- **Procedimientos almacenados**: Operaciones complejas optimizadas
- **Eventos automáticos**: Limpieza automática de datos temporales

### 🏗️ **Estructura Mejorada**
- **Integridad referencial**: Foreign keys con CASCADE
- **Campos de auditoría**: `created_at`, `updated_at`, `ultimoAcceso`
- **Estados controlados**: ENUMs para estados válidos
- **Configuración centralizada**: Tabla de configuraciones del sistema

## 📁 Archivos Creados

1. **`MySQL_Optimizado.sql`** - Script principal con toda la estructura optimizada
2. **`Script_Limpieza_Datos.sql`** - Script para limpiar datos existentes
3. **`INSTRUCCIONES_BASE_DATOS.md`** - Este documento de instrucciones

## 🚀 Pasos para Implementar

### Paso 1: Respaldar Base de Datos Actual (Opcional)
```sql
-- Si tienes datos importantes, respáldalos primero
mysqldump -u [usuario] -p sena_etapa_productiva > backup_antes_optimizacion.sql
```

### Paso 2: Ejecutar Script de Limpieza
```bash
# Conectar a MySQL y ejecutar
mysql -u [usuario] -p < Script_Limpieza_Datos.sql
```

### Paso 3: Ejecutar Script Principal
```bash
# Ejecutar el script optimizado
mysql -u [usuario] -p < MySQL_Optimizado.sql
```

### Paso 4: Verificar la Instalación
```sql
-- Verificar que todas las tablas se crearon correctamente
SHOW TABLES;

-- Verificar las vistas creadas
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Verificar los procedimientos almacenados
SHOW PROCEDURE STATUS WHERE Db = 'sena_etapa_productiva';

-- Verificar los eventos
SHOW EVENTS;
```

## 🔧 Configuraciones del Sistema

La tabla `configuracion_sistema` contiene configuraciones centralizadas:

| Clave | Valor | Descripción |
|-------|-------|-------------|
| `max_intentos_login` | 5 | Máximo intentos fallidos antes del bloqueo |
| `tiempo_bloqueo_minutos` | 30 | Tiempo de bloqueo en minutos |
| `duracion_sesion_horas` | 24 | Duración de sesión en horas |
| `tamano_max_archivo_mb` | 10 | Tamaño máximo de archivos |
| `habilitar_analisis_sentimientos` | true | Habilitar análisis de IA |
| `umbral_confianza_ia` | 0.7 | Umbral mínimo de confianza IA |

## 📊 Vistas Útiles Creadas

### `v_estadisticas_aprendices`
```sql
SELECT * FROM v_estadisticas_aprendices;
```
Muestra estadísticas generales de aprendices por estado.

### `v_resumen_bitacoras`
```sql
SELECT * FROM v_resumen_bitacoras;
```
Muestra resumen de bitácoras por aprendiz con análisis de sentimientos.

## 🔄 Procedimientos Almacenados

### `sp_limpiar_tokens_expirados()`
Limpia automáticamente tokens de reset expirados.

### `sp_limpiar_sesiones_expiradas()`
Limpia sesiones expiradas.

### `sp_estadisticas_sentimientos(fecha_inicio, fecha_fin)`
```sql
CALL sp_estadisticas_sentimientos('2024-01-01', '2024-12-31');
```

### `sp_desbloquear_usuario(user_id, user_type)`
```sql
CALL sp_desbloquear_usuario(1, 'aprendiz');
```

## ⏰ Eventos Automáticos

- **`ev_limpiar_tokens_expirados`**: Se ejecuta diariamente
- **`ev_limpiar_sesiones_expiradas`**: Se ejecuta cada hora

## 🔍 Triggers de Auditoría

- **`tr_aprendices_after_update`**: Registra cambios de estado de aprendices
- **`tr_administradores_after_update`**: Registra cambios de estado de administradores

## 📝 Campos Nuevos Agregados

### Tabla `aprendices`
- `ultimoAcceso`: Timestamp del último acceso
- `intentosFallidos`: Contador de intentos fallidos
- `fechaBloqueo`: Fecha de bloqueo por intentos fallidos
- `updated_at`: Fecha de última actualización

### Tabla `bitacoras`
- `semana`: Número de semana del programa
- `estado`: Estado de la bitácora (borrador/enviada/revisada)
- `comentarios_instructor`: Comentarios del instructor
- `fechaEnvio`: Fecha de envío
- `fechaRevision`: Fecha de revisión

## 🆕 Tablas Nuevas

### `logs_acceso`
Registra todas las acciones de usuarios para auditoría.

### `configuracion_sistema`
Almacena configuraciones centralizadas del sistema.

## ⚠️ Consideraciones Importantes

### 1. **Contraseñas de Administradores**
El script inserta un administrador por defecto con un hash placeholder. **DEBES** actualizar la contraseña:

```sql
-- Actualizar contraseña del admin (reemplaza 'tu_password_hash' con el hash real)
UPDATE administradores 
SET password = 'tu_password_hash' 
WHERE nombreUsuario = 'admin';
```

### 2. **Configuración de Variables de Entorno**
Asegúrate de que tu archivo `.env` tenga las configuraciones correctas:

```env
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=sena_etapa_productiva
DB_PORT=3306
DB_CONNECTION_LIMIT=10
```

### 3. **Permisos de MySQL**
El usuario de la base de datos necesita permisos para:
- CREATE, ALTER, DROP (para tablas)
- CREATE EVENT (para eventos automáticos)
- CREATE PROCEDURE (para procedimientos almacenados)
- CREATE TRIGGER (para triggers)

### 4. **Compatibilidad**
- MySQL 8.0+ recomendado
- Soporte para JSON (MySQL 5.7+)
- Soporte para CHECK constraints (MySQL 8.0+)

## 🔧 Mantenimiento

### Limpieza Manual de Datos Temporales
```sql
-- Limpiar tokens expirados
CALL sp_limpiar_tokens_expirados();

-- Limpiar sesiones expiradas
CALL sp_limpiar_sesiones_expiradas();
```

### Verificar Estado del Sistema
```sql
-- Verificar eventos activos
SHOW EVENTS;

-- Verificar procedimientos
SHOW PROCEDURE STATUS WHERE Db = 'sena_etapa_productiva';

-- Verificar triggers
SHOW TRIGGERS;
```

## 📞 Soporte

Si encuentras algún problema:

1. Verifica los logs de MySQL
2. Revisa que todos los permisos estén correctos
3. Confirma que la versión de MySQL sea compatible
4. Verifica que las variables de entorno estén configuradas

## ✅ Checklist de Verificación

- [ ] Script de limpieza ejecutado sin errores
- [ ] Script principal ejecutado sin errores
- [ ] Todas las tablas creadas correctamente
- [ ] Vistas creadas correctamente
- [ ] Procedimientos almacenados creados
- [ ] Eventos automáticos activos
- [ ] Triggers funcionando
- [ ] Contraseña de admin actualizada
- [ ] Configuraciones del sistema verificadas
- [ ] Conexión desde la aplicación probada

---

**¡La base de datos está ahora optimizada, segura y lista para producción!** 🎉 