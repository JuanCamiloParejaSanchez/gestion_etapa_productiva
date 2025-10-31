# Tests de Controladores

## Descripción
Esta carpeta contiene todos los tests relacionados con los controladores de la aplicación, incluyendo pruebas de respuestas HTTP, manejo de errores y validaciones.

## Estructura de Tests

### 1. baseController.test.js
- Tests para el controlador base
- Métodos de validación
- Métodos de respuestas HTTP
- Manejo de autenticación y autorización

### 2. gestionAdministradoresControlador.test.js
- Tests para operaciones CRUD de administradores
- Validaciones de entrada
- Manejo de errores de base de datos
- Respuestas HTTP correctas

### 3. controladorDashboardAprendiz.test.js
- Tests para el dashboard del aprendiz
- Gestión de perfil
- Gestión de documentos
- Registro de bitácoras

### 4. controladorAlertas.test.js
- Tests para el sistema de alertas
- Notificaciones
- Respuestas HTTP

## Ejecutar Tests

```bash
# Ejecutar todos los tests de controladores
npm test -- tests/controladores

# Ejecutar un archivo específico
npm test -- tests/controladores/baseController.test.js

# Ejecutar con cobertura
npm run test:coverage -- tests/controladores

# Ejecutar en modo watch
npm run test:watch -- tests/controladores
```

## Cobertura Esperada
- Respuestas HTTP: 100%
- Manejo de errores: 100%
- Validaciones: 100%
- Lógica de negocio: >90%

## Convenciones
- Usar `describe` para agrupar tests relacionados
- Usar `it` o `test` para casos específicos
- Siempre limpiar mocks después de cada test
- Usar `supertest` para tests de endpoints HTTP
- Mockear servicios y base de datos cuando sea necesario
