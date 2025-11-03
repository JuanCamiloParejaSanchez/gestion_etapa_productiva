# 📋 Guía de Implementación - Sistema de Revisión de Documentos

## 🎯 Descripción

Este sistema permite a los administradores aprobar o rechazar documentos subidos por los aprendices, con retroalimentación automática a través de notificaciones en la aplicación.

---

## 📝 Pasos para Implementar

### 1. **Ejecutar el Script SQL**

Antes de usar la funcionalidad, debes ejecutar el script SQL que modifica la base de datos:

```bash
# Ubicación del script:
scripts/agregar_revision_documentos.sql
```

**Opción A - Desde MySQL Workbench o phpMyAdmin:**
1. Abre el archivo `scripts/agregar_revision_documentos.sql`
2. Ejecuta todo el contenido del script
3. Verifica que no haya errores

**Opción B - Desde línea de comandos:**
```bash
mysql -u tu_usuario -p sena_etapa_productiva < scripts/agregar_revision_documentos.sql
```

### 2. **Verificar las Modificaciones en la Base de Datos**

El script agregará:

✅ **Columnas a `documentos_aprendiz`:**
- `estado` (pendiente | aprobado | rechazado)
- `retroalimentacion` (TEXT)
- `fecha_revision` (DATETIME)
- `revisado_por` (INT - FK a administradores)

✅ **Nueva tabla `notificaciones`:**
- Almacena todas las notificaciones del sistema
- Rastrea notificaciones leídas y no leídas

✅ **Trigger automático:**
- Se crea automáticamente una notificación cuando un documento es rechazado o aprobado

✅ **Vista y procedimientos almacenados:**
- Para facilitar consultas de documentos pendientes
- Procedimientos para marcar notificaciones como leídas

---

## 🚀 Funcionalidades Implementadas

### **Vista del Administrador** (`/administrador/aprendiz/verificar-documentacion/:id`)

#### Características:
1. **Columna de Estado** - Muestra el estado actual de cada documento:
   - 🟡 Pendiente (amarillo)
   - 🟢 Aprobado (verde)
   - 🔴 Rechazado (rojo)

2. **Botones de Acción:**
   - 👁️ **Ver** - Abre el documento en nueva pestaña
   - ✅ **Aprobar** - Aprueba el documento (no disponible si ya está aprobado)
   - ❌ **Rechazar** - Abre modal para escribir retroalimentación
   - 💬 **Ver Retroalimentación** - Ver comentarios previos (solo en documentos rechazados)

3. **Modal de Retroalimentación:**
   - Campo de texto para escribir la retroalimentación
   - Checkbox para enviar notificación por email (opcional)
   - Validación: No se puede rechazar sin retroalimentación

### **Vista del Aprendiz** (`/aprendiz/dashboard`)

#### Características:
1. **Icono de Campana** 🔔
   - Aparece en el navbar junto al botón "Cerrar Sesión"
   - Badge rojo con el número de notificaciones no leídas
   - Se actualiza automáticamente cada 30 segundos

2. **Modal de Notificaciones:**
   - Se abre al hacer clic en la campana
   - Muestra todas las notificaciones ordenadas por fecha
   - Badges "Nuevo" para notificaciones no leídas
   - Muestra la retroalimentación completa del tutor
   - Botones para marcar como leída individual o todas

3. **Tipos de Notificaciones:**
   - 🔴 Documento rechazado (con retroalimentación)
   - 🟢 Documento aprobado

---

## 🔗 Endpoints Creados

### **Administrador:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/administrador/documentos/:id/aprobar` | Aprueba un documento |
| POST | `/administrador/documentos/:id/rechazar` | Rechaza un documento con retroalimentación |

### **Aprendiz:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/aprendiz/notificaciones/contador` | Obtiene el número de notificaciones no leídas |
| GET | `/aprendiz/notificaciones` | Obtiene todas las notificaciones |
| POST | `/aprendiz/notificaciones/:id/marcar-leida` | Marca una notificación como leída |
| POST | `/aprendiz/notificaciones/marcar-todas-leidas` | Marca todas las notificaciones como leídas |

---

## 📂 Archivos Modificados/Creados

### **Nuevos Archivos:**
```
scripts/agregar_revision_documentos.sql
src/compartido/servicios/notificacionesService.js
```

### **Archivos Modificados:**
```
views/administrador/verificarDocumentacion.ejs
views/aprendiz/dashboard.ejs
src/modulos/administrador/rutas/rutasGestionAprendices.js
src/modulos/administrador/controladores/gestionAprendicesControlador.js
src/modulos/aprendiz/rutas/rutasAprendiz.js
src/modulos/aprendiz/controladores/controladorDashboardAprendiz.js
```

---

## 🔄 Flujo de Trabajo

### **Escenario 1: Documento Aprobado**

```
1. Aprendiz sube documento → Estado: "pendiente"
2. Admin revisa documento → Hace clic en "✅ Aprobar"
3. Sistema confirma con SweetAlert
4. Admin confirma
5. Sistema actualiza: estado = "aprobado"
6. Se crea notificación automática (trigger)
7. Aprendiz ve notificación en campana 🔔
```

### **Escenario 2: Documento Rechazado**

```
1. Aprendiz sube documento → Estado: "pendiente"
2. Admin revisa documento → Hace clic en "❌ Rechazar"
3. Se abre modal de retroalimentación
4. Admin escribe: "Por favor, actualiza la fecha en la página 2"
5. Admin marca checkbox "Enviar email" (opcional)
6. Admin hace clic en "Rechazar Documento"
7. Sistema actualiza:
   - estado = "rechazado"
   - retroalimentacion = "Por favor, actualiza la fecha..."
8. Trigger crea notificación automática
9. Aprendiz ve notificación: 
   "El [nombre del documento] no fue aprobado..."
10. Aprendiz hace clic y lee la retroalimentación completa
11. Aprendiz corrige el documento y lo vuelve a subir
12. Vuelve al paso 1 con nuevo estado "pendiente"
```

---

## 🎨 Características de UX/UI

### **Modo Oscuro Compatible:**
- Todos los estilos tienen versiones para modo oscuro
- Colores adaptados para `.dark-mode`

### **Responsive:**
- Modales centrados y responsive
- Botones adaptados para móviles

### **Feedback Visual:**
- Badges de colores según estado
- Animaciones en notificaciones
- Spinners de carga
- Confirmaciones con SweetAlert2

---

## 🧪 Pruebas Recomendadas

### **Como Administrador:**
1. ✅ Ver lista de documentos de un aprendiz
2. ✅ Aprobar un documento pendiente
3. ✅ Rechazar un documento con retroalimentación
4. ✅ Ver que los botones se ocultan según el estado
5. ✅ Verificar que no se pueda rechazar sin escribir retroalimentación

### **Como Aprendiz:**
1. ✅ Ver el badge de notificaciones en la campana
2. ✅ Abrir modal de notificaciones
3. ✅ Leer una notificación de documento rechazado
4. ✅ Ver la retroalimentación completa del tutor
5. ✅ Marcar notificación como leída
6. ✅ Marcar todas las notificaciones como leídas
7. ✅ Verificar que el badge se actualiza automáticamente

---

## 🐛 Solución de Problemas

### **El badge no muestra el número correcto:**
- Verifica que el trigger esté creado correctamente
- Revisa la consola del navegador (F12) por errores de JavaScript
- Verifica que la ruta `/aprendiz/notificaciones/contador` funcione

### **Las notificaciones no se crean:**
- Verifica que el trigger `tr_documento_rechazado_notificacion` exista
- Ejecuta: `SHOW TRIGGERS LIKE 'documentos_aprendiz';`

### **Error al aprobar/rechazar:**
- Verifica que las columnas nuevas existan en `documentos_aprendiz`
- Revisa los logs del servidor
- Verifica la sesión del administrador

---

## 📊 Consultas Útiles

### **Ver documentos rechazados:**
```sql
SELECT d.*, a.nombres, a.primerApellido, d.retroalimentacion
FROM documentos_aprendiz d
INNER JOIN aprendices a ON d.aprendiz_id = a.id
WHERE d.estado = 'rechazado';
```

### **Ver notificaciones no leídas:**
```sql
SELECT n.*, a.nombres, a.primerApellido
FROM notificaciones n
INNER JOIN aprendices a ON n.usuario_id = a.id
WHERE n.leida = FALSE;
```

### **Estadísticas de documentos:**
```sql
SELECT 
    estado,
    COUNT(*) as cantidad,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM documentos_aprendiz), 2) as porcentaje
FROM documentos_aprendiz
GROUP BY estado;
```

---

## 🔐 Seguridad

- ✅ Validación de sesión en todas las rutas
- ✅ Verificación de permisos (admin/aprendiz)
- ✅ Sanitización de entrada de datos
- ✅ Foreign keys para integridad referencial
- ✅ Logs de todas las acciones importantes

---

## 📞 Soporte

Si tienes problemas con la implementación:
1. Revisa los logs del servidor
2. Verifica la consola del navegador
3. Revisa que todas las columnas existan en la BD
4. Verifica que los triggers estén creados

---

## ✅ Checklist de Implementación

- [ ] Ejecutar script SQL
- [ ] Verificar que las columnas se agregaron correctamente
- [ ] Verificar que la tabla `notificaciones` existe
- [ ] Verificar que el trigger se creó
- [ ] Reiniciar el servidor Node.js
- [ ] Probar aprobar un documento
- [ ] Probar rechazar un documento
- [ ] Verificar que las notificaciones aparecen
- [ ] Probar marcar como leída
- [ ] Verificar el badge se actualiza

---

**¡Listo!** El sistema de revisión de documentos está completamente funcional. 🎉
