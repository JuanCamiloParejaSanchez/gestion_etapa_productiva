# Tests de Base de Datos

Esta carpeta contiene los tests completos para las operaciones de base de datos del proyecto.

## Estructura de Tests

### 1. repositorioAprendiz.test.js
Tests específicos para el repositorio de aprendices que cubren:

- **Operaciones de Búsqueda:**
  - Búsqueda por ID
  - Búsqueda por email
  - Búsqueda por número de documento
  - Manejo de registros inexistentes

- **Operaciones de Inserción:**
  - Inserción de aprendices
  - Manejo de duplicados
  - Campos con valores NULL

- **Operaciones de Actualización:**
  - Actualización de uno o múltiples campos
  - Actualización de contraseña
  - Manejo de registros inexistentes

- **Operaciones de Eliminación:**
  - Eliminación por ID
  - Restricciones de clave foránea

- **Operaciones de Consulta:**
  - Conteo de registros
  - Filtros múltiples
  - Paginación
  - Ordenamiento

### 2. operacionesCRUD.test.js
Tests genéricos para operaciones CRUD que cubren:

- **CREATE (Inserción):**
  - Inserción simple y completa
  - Inserción múltiple
  - Manejo de valores NULL
  - Duplicados

- **READ (Lectura):**
  - Lectura por ID
  - Lectura con filtros
  - Búsquedas parciales (LIKE)
  - Ordenamiento y paginación
  - JOINs
  - Agregaciones (COUNT, GROUP BY)

- **UPDATE (Actualización):**
  - Actualización de uno o múltiples campos
  - Actualización masiva
  - Valores NULL
  - Condiciones complejas

- **DELETE (Eliminación):**
  - Eliminación por ID
  - Eliminación con condiciones
  - Restricciones de clave foránea

### 3. transacciones.test.js
Tests completos para transacciones de base de datos que cubren:

- **Transacciones Básicas:**
  - BEGIN, COMMIT, ROLLBACK
  - Manejo de errores

- **Transacciones Múltiples:**
  - Múltiples operaciones en una transacción
  - Rollback en caso de fallo parcial

- **Transacciones Complejas:**
  - Inserciones relacionadas
  - Actualización masiva
  - Integridad referencial

- **Savepoints:**
  - Creación y liberación
  - Rollback parcial

- **Niveles de Aislamiento:**
  - READ COMMITTED
  - SERIALIZABLE

- **Deadlocks:**
  - Detección
  - Reintento automático

- **Manejo de Errores:**
  - Errores de commit/rollback
  - Timeout
  - Conexión perdida

## Cómo Ejecutar los Tests

### Todos los tests de base de datos:
```bash
npm test -- tests/base-datos
```

### Test específico:
```bash
# Repositorio
npm test -- tests/base-datos/repositorioAprendiz.test.js

# Operaciones CRUD
npm test -- tests/base-datos/operacionesCRUD.test.js

# Transacciones
npm test -- tests/base-datos/transacciones.test.js
```

### Con cobertura:
```bash
npm test -- --coverage tests/base-datos
```

### En modo watch:
```bash
npm test -- --watch tests/base-datos
```

## Configuración

Los tests utilizan mocks de la base de datos para no afectar los datos reales:

```javascript
jest.mock('../../src/configuracion/baseDatos', () => ({
  pool: {
    query: jest.fn(),
    execute: jest.fn(),
    getConnection: jest.fn()
  }
}));
```

## Cobertura de Tests

Los tests cubren:
- ✅ Todos los métodos del repositorio
- ✅ Operaciones CRUD completas
- ✅ Transacciones simples y complejas
- ✅ Manejo de errores
- ✅ Casos límite
- ✅ Validaciones

## Casos de Uso Especiales

### Transacciones con Rollback:
Los tests verifican que los cambios se deshacen correctamente cuando ocurre un error.

### Integridad Referencial:
Se valida el manejo de restricciones de clave foránea.

### Concurrencia:
Tests de deadlock y manejo de transacciones paralelas.

### Paginación:
Validación de LIMIT y OFFSET para consultas paginadas.

## Buenas Prácticas

1. **Cada test es independiente**: No dependen del estado de otros tests
2. **Mocks limpios**: Se limpian antes de cada test con `jest.clearAllMocks()`
3. **Nombres descriptivos**: Los nombres de test describen exactamente qué se está probando
4. **Assertions claras**: Cada test verifica comportamientos específicos
5. **Manejo de errores**: Se prueban tanto casos exitosos como de error

## Mantenimiento

Al agregar nuevas funcionalidades a los repositorios:
1. Agregar tests correspondientes en `repositorioAprendiz.test.js`
2. Si es una operación CRUD genérica, agregar en `operacionesCRUD.test.js`
3. Si involucra transacciones, agregar en `transacciones.test.js`
4. Ejecutar todos los tests para verificar que no se rompió nada

## Notas Importantes

- Los tests NO afectan la base de datos real
- Todos los tests usan mocks
- No se requiere configuración especial de base de datos para ejecutar los tests
- Los tests verifican comportamiento, no implementación específica
