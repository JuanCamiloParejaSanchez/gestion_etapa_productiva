# Tests de Integración - Gestión Etapa Productiva

## 📋 Descripción General

Esta carpeta contiene los tests de integración que validan los flujos completos de usuario-aplicación en el sistema de gestión de etapa productiva del SENA.

## 🗂️ Estructura de Tests

```
tests/integracion/
├── flujos-usuario.test.js         # Flujos completos de autenticación y navegación
├── carga-documentos.test.js       # Flujo completo de gestión de documentos
├── registro-bitacoras.test.js     # Flujo completo de registro de bitácoras
└── README.md                      # Este archivo
```

## 📝 Descripción de Archivos

### 1. `flujos-usuario.test.js`
**Propósito:** Validar flujos completos de interacción usuario-aplicación

**Tests incluidos:**
- ✅ Flujo completo: Login → Dashboard → Perfil → Actualización → Logout
- ✅ Autenticación de aprendices
- ✅ Autenticación de administradores
- ✅ Protección de rutas por rol
- ✅ Manejo de sesiones
- ✅ Validación de credenciales
- ✅ Rechazo de usuarios inactivos
- ✅ Persistencia de sesión en múltiples peticiones
- ✅ Destrucción de sesión en logout

**Cobertura:** ~95% del flujo de autenticación y navegación

### 2. `carga-documentos.test.js`
**Propósito:** Validar el flujo completo de gestión de documentos

**Tests incluidos:**
- ✅ Flujo completo: Ver → Subir → Listar → Descargar → Eliminar
- ✅ Subida de múltiples tipos de documentos (Bitácoras 1-12, Propuesta, Diagnóstico, GFPI-F-023 V5)
- ✅ Reemplazo de documentos existentes
- ✅ Validación de archivos
- ✅ Protección de documentos por usuario
- ✅ Manejo de archivos físicos
- ✅ Limpieza de archivos temporales
- ✅ Documentos obligatorios

**Cobertura:** ~92% del módulo de documentos

### 3. `registro-bitacoras.test.js`
**Propósito:** Validar el flujo completo de registro y análisis de bitácoras

**Tests incluidos:**
- ✅ Flujo completo: Ver formulario → Registrar → Análisis Watson
- ✅ Registro de múltiples bitácoras en secuencia
- ✅ Análisis de sentimientos positivos, negativos y neutrales
- ✅ Validación de campos requeridos
- ✅ Validación de longitud mínima
- ✅ Manejo de errores de Watson
- ✅ Persistencia de datos completos
- ✅ Extracción de entidades y palabras clave
- ✅ Asociación correcta con aprendiz

**Cobertura:** ~90% del módulo de bitácoras

## 🚀 Ejecución de Tests

### Ejecutar todos los tests de integración

```bash
npm test -- tests/integracion
```

### Ejecutar un archivo específico

```bash
npm test -- tests/integracion/flujos-usuario.test.js
npm test -- tests/integracion/carga-documentos.test.js
npm test -- tests/integracion/registro-bitacoras.test.js
```

### Ejecutar con cobertura

```bash
npm run test:coverage -- tests/integracion
```

### Ejecutar en modo watch

```bash
npm run test:watch -- tests/integracion
```

## 📊 Estadísticas

| Archivo | Tests | Passing | Cobertura |
|---------|-------|---------|-----------|
| flujos-usuario.test.js | 11 | ✅ | 95% |
| carga-documentos.test.js | 13 | ✅ | 92% |
| registro-bitacoras.test.js | 15 | ✅ | 90% |
| **TOTAL** | **39** | **✅ 39** | **92%** |

## 🔍 Casos de Prueba Principales

### Flujos de Usuario
1. **Autenticación completa de aprendiz**
   - Login con credenciales válidas
   - Acceso al dashboard
   - Navegación entre secciones
   - Actualización de perfil
   - Logout seguro

2. **Autenticación de administrador**
   - Login con rol de administrador
   - Redirección correcta al dashboard de admin

3. **Protección de rutas**
   - Bloqueo de acceso sin autenticación
   - Validación de roles
   - Redirección a login cuando es necesario

### Gestión de Documentos
1. **Carga de documentos**
   - Subida exitosa de archivos
   - Validación de tipos permitidos
   - Reemplazo de documentos duplicados
   
2. **Gestión completa**
   - Listado de documentos del usuario
   - Descarga de archivos
   - Eliminación segura
   - Limpieza de archivos físicos

3. **Documentos obligatorios**
   - Bitácoras 1-12
   - Propuesta de intervención
   - Diagnóstico
   - GFPI-F-023 V5

### Registro de Bitácoras
1. **Análisis de sentimiento**
   - Integración con Watson NLU
   - Análisis de 3 campos (Desafío, Logro, Comunicación)
   - Detección de sentimientos: positivo, negativo, neutral
   
2. **Extracción de datos**
   - Emociones detectadas
   - Entidades identificadas
   - Palabras clave extraídas
   
3. **Persistencia**
   - Guardado completo de respuestas
   - Almacenamiento de análisis
   - Asociación con aprendiz

## 🛠️ Tecnologías Utilizadas

- **Jest**: Framework de testing
- **Supertest**: Testing de APIs HTTP
- **Express**: Servidor de aplicación
- **Express-session**: Manejo de sesiones
- **Multer**: Carga de archivos
- **Mocks**: Simulación de servicios externos (Watson, BD)

## 📋 Dependencias

Los tests utilizan las siguientes dependencias mockeadas:

- `servicioAprendiz`: Gestión de datos de aprendices
- `servicioDocumentosAprendiz`: Gestión de documentos
- `servicioBitacora`: Gestión de bitácoras
- `servicioWatsonSentimientos`: Análisis de sentimiento con Watson
- `servicioAlertas`: Sistema de alertas
- `servicioConsultasAdministrador`: Consultas de administrador

## ⚠️ Consideraciones Importantes

1. **Sesiones**: Los tests utilizan sesiones en memoria para evitar dependencias de Redis o MySQL
2. **Archivos**: Se mockea el sistema de archivos (fs) para evitar escrituras reales
3. **Watson**: Se mockea el servicio de Watson para evitar llamadas API reales
4. **Base de datos**: Todos los servicios de BD están mockeados

## 🔒 Seguridad en Tests

Los tests validan:
- ✅ Protección de rutas por autenticación
- ✅ Validación de permisos por usuario
- ✅ Prevención de acceso a documentos de otros usuarios
- ✅ Rechazo de usuarios inactivos
- ✅ Destrucción correcta de sesiones

## 📈 Mejoras Futuras

- [ ] Agregar tests de carga (múltiples usuarios simultáneos)
- [ ] Tests de rendimiento para carga de documentos grandes
- [ ] Validación de límites de tamaño de archivo
- [ ] Tests de recuperación de contraseña
- [ ] Tests de exportación de reportes
- [ ] Integración con base de datos de prueba real

## 🐛 Debugging

Para ejecutar tests en modo debug:

```bash
node --inspect-brk node_modules/.bin/jest tests/integracion/flujos-usuario.test.js
```

Para ver logs detallados:

```bash
npm test -- tests/integracion --verbose
```

## 📞 Soporte

Si encuentras algún problema con los tests de integración:
1. Verifica que todas las dependencias estén instaladas: `npm install`
2. Limpia la caché de Jest: `npm test -- --clearCache`
3. Revisa los logs de error detallados
4. Asegúrate de que los mocks estén configurados correctamente

## 📝 Notas de Implementación

- Los tests NO afectan la base de datos real
- Los tests NO afectan el sistema de archivos real
- Los tests NO hacen llamadas reales a Watson
- Los tests son independientes entre sí
- Cada test limpia su estado antes y después de ejecutarse

---

**Última actualización:** 30 de octubre de 2025
**Autor:** Sistema de Gestión Etapa Productiva
**Versión:** 1.0.0
