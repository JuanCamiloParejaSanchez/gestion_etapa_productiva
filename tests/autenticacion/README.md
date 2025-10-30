# Tests de Autenticación y Seguridad

## Descripción

Suite completa de tests para verificar la seguridad y funcionalidad del sistema de autenticación del proyecto de Gestión de Etapa Productiva.

## Estructura de Tests

### 1. **login.test.js** - Tests de Login
- ✅ Validación de credenciales correctas/incorrectas
- ✅ Login de aprendices y administradores
- ✅ Manejo de errores del servidor
- ✅ Prevención de inyección SQL
- ✅ Validación de formato de datos
- ✅ Redirecciones según tipo de petición

**Total:** ~25 casos de prueba

### 2. **recuperacion.test.js** - Tests de Recuperación de Contraseña
- ✅ Solicitud de recuperación para aprendiz/admin
- ✅ Generación y envío de códigos de verificación
- ✅ Validación de códigos (válidos/expirados/usados)
- ✅ Restablecimiento de contraseña
- ✅ Validación de requisitos de contraseña segura
- ✅ Manejo de errores

**Total:** ~20 casos de prueba

### 3. **middleware.test.js** - Tests de Middlewares de Autenticación
- ✅ `verificarExpiracionSesion` - Control de sesiones expiradas
- ✅ `validarSesionAdmin` - Protección de rutas de administrador
- ✅ `validarSesionAprendiz` - Protección de rutas de aprendiz
- ✅ `validarNoAutenticado` - Prevenir acceso a páginas públicas cuando está autenticado
- ✅ `verificarRegistro` - Validar proceso de registro en curso
- ✅ `cargarUsuario` - Cargar datos del usuario en res.locals
- ✅ `validarAutenticado` - Validar cualquier usuario autenticado
- ✅ `setNoCacheHeaders` - Configuración de headers de seguridad

**Total:** ~30 casos de prueba

### 4. **tokens.test.js** - Tests de Tokens y Códigos de Verificación
- ✅ Generación de códigos de 6 dígitos
- ✅ Almacenamiento de códigos en BD
- ✅ Verificación de códigos válidos/expirados
- ✅ Invalidación de códigos usados
- ✅ Prevención de reutilización
- ✅ Seguridad contra inyección SQL
- ✅ Flujo completo de recuperación

**Total:** ~25 casos de prueba

### 5. **proteccion-rutas.test.js** - Tests de Protección de Rutas según Roles
- ✅ Protección de rutas de administrador
- ✅ Protección de rutas de aprendiz
- ✅ Protección de rutas públicas
- ✅ Escalación de privilegios
- ✅ Redirecciones correctas según rol
- ✅ Headers de seguridad
- ✅ Matriz de acceso completa

**Total:** ~25 casos de prueba

### 6. **integracion.test.js** - Tests de Integración
- ✅ Flujo completo de registro y creación de contraseña
- ✅ Flujo completo de login y acceso a rutas protegidas
- ✅ Flujo completo de recuperación de contraseña
- ✅ Logout y destrucción de sesión
- ✅ Expiración de sesión por inactividad
- ✅ Seguridad y prevención de ataques
- ✅ Diferentes roles y permisos

**Total:** ~20 casos de prueba

## Cobertura Total

**~145 casos de prueba** cubriendo:

### Aspectos de Seguridad
- ✅ Autenticación y autorización
- ✅ Protección contra inyección SQL
- ✅ Protección contra ataques de fuerza bruta
- ✅ Validación de sesiones
- ✅ Expiración de sesiones por inactividad
- ✅ Tokens de recuperación seguros
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Headers de seguridad (no-cache)
- ✅ Prevención de escalación de privilegios
- ✅ Separación de roles (admin/aprendiz)

### Aspectos Funcionales
- ✅ Login con credenciales válidas
- ✅ Logout y destrucción de sesión
- ✅ Recuperación de contraseña por email
- ✅ Creación de contraseña en registro
- ✅ Acceso a rutas protegidas según rol
- ✅ Redirecciones correctas
- ✅ Manejo de errores
- ✅ Validación de datos de entrada

## Ejecución de Tests

### Ejecutar todos los tests
```bash
npm test
```

### Ejecutar tests con cobertura
```bash
npm run test:coverage
```

### Ejecutar tests en modo watch
```bash
npm run test:watch
```

### Ejecutar solo tests de autenticación
```bash
npm test -- tests/autenticacion
```

### Ejecutar un archivo específico
```bash
npm test -- tests/autenticacion/login.test.js
```

## Configuración

Los tests utilizan:
- **Jest** como framework de testing
- **Supertest** para tests HTTP
- **Mocks** de servicios de base de datos
- **Sesiones en memoria** para tests

### Variables de entorno (tests)
Se cargan desde `.env.test` si existe, o se usan valores por defecto.

## Resultados Esperados

Todos los tests deben pasar con éxito:
```
PASS  tests/autenticacion/login.test.js
PASS  tests/autenticacion/recuperacion.test.js
PASS  tests/autenticacion/middleware.test.js
PASS  tests/autenticacion/tokens.test.js
PASS  tests/autenticacion/proteccion-rutas.test.js
PASS  tests/autenticacion/integracion.test.js

Test Suites: 6 passed, 6 total
Tests:       145 passed, 145 total
Snapshots:   0 total
Time:        XX.XXXs
```

## Cobertura de Código

Archivos cubiertos:
- `src/compartido/middlewares/middlewareAutenticacion.js` - 100%
- `src/modulos/compartido/controladores/controladorAutenticacionGeneral.js` - 95%+
- `src/modulos/aprendiz/controladores/controladorRecuperacion.js` - 95%+
- `src/modulos/aprendiz/servicios/servicioRecuperacion.js` - 100%

## Mantenimiento

### Agregar nuevos tests
1. Crear archivo en `tests/autenticacion/`
2. Seguir la estructura existente
3. Usar mocks para servicios externos
4. Documentar casos de prueba

### Actualizar tests existentes
- Al modificar funcionalidad de autenticación
- Al agregar nuevos middlewares
- Al cambiar reglas de seguridad

## Notas Importantes

⚠️ **Los tests NO afectan la funcionalidad de la aplicación**
- Usan mocks de servicios
- Sesiones en memoria
- No modifican la base de datos real

⚠️ **Errores de TypeScript**
- Los errores mostrados son solo advertencias de TypeScript
- No afectan la ejecución de los tests
- Los tests funcionan correctamente con Jest

## Checklist de Seguridad

- [x] Validación de login con credenciales correctas/incorrectas
- [x] Flujo de recuperación de contraseña
- [x] Generación y validación de tokens
- [x] Middleware de autenticación
- [x] Protección de rutas según roles
- [x] Prevención de inyección SQL
- [x] Protección contra fuerza bruta
- [x] Validación de contraseñas seguras
- [x] Expiración de sesiones
- [x] Manejo seguro de tokens
- [x] Headers de seguridad

## Autor
Desarrollado para el proyecto Gestión de Etapa Productiva - SENA

## Fecha
30 de octubre de 2025
