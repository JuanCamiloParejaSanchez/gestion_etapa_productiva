# Servicios del Módulo Administrador

## ServicioGestionAprendices

### Propósito
Servicio de negocio que maneja todas las operaciones CRUD relacionadas con aprendices, incluyendo consultas dinámicas, reportes y gestión de datos.

### Responsabilidades
- Construcción de consultas SQL dinámicas con filtros y paginación
- Validación de datos de entrada
- Generación de reportes estadísticos
- Gestión de operaciones de base de datos para aprendices

### API Pública

#### `construirQueryDinamica(filtros)`
Construye una consulta SQL dinámica basada en filtros aplicados.

**Parámetros:**
- `filtros` (Object): Objeto con filtros opcionales (nombre, documento, programaFormacion, alternativaSeleccionada)

**Retorna:** `{ baseQuery: string, params: Array }`

**Ejemplo:**
```javascript
const { baseQuery, params } = servicio.construirQueryDinamica({
  nombre: 'Juan',
  programaFormacion: 'tecProgramacion'
});
// baseQuery: "FROM aprendices WHERE (nombres LIKE ? OR primerApellido LIKE ? OR segundoApellido LIKE ?) AND programaFormacion = ?"
// params: ["%Juan%", "%Juan%", "%Juan%", "tecProgramacion"]
```

#### `construirOrderClause(orderData, tableType)`
Construye la cláusula ORDER BY para consultas.

**Parámetros:**
- `orderData` (Array): Datos de ordenamiento de DataTables
- `tableType` (string): Tipo de tabla ('listarAprendices' o 'docsPendientes')

**Retorna:** `string` - Cláusula ORDER BY

#### `obtenerDatosAprendices(options)`
Obtiene datos paginados de aprendices con filtros aplicados.

**Parámetros:**
- `options` (Object): Opciones de consulta incluyendo filtros, paginación y ordenamiento

**Retorna:** `Promise<Object>` - Resultado con datos paginados y metadatos

**Ejemplo:**
```javascript
const result = await servicio.obtenerDatosAprendices({
  draw: 1,
  start: 0,
  length: 10,
  nombre: 'Juan',
  order: [{ column: 0, dir: 'asc' }]
});
// Retorna: { draw: 1, recordsTotal: 100, recordsFiltered: 5, data: [...] }
```

#### `obtenerDatosReportes()`
Genera datos estadísticos para reportes y gráficos.

**Retorna:** `Promise<Object>` - Datos para gráficos de programas, estados y alternativas

#### `buscarPorId(id)`
Busca un aprendiz específico por su ID.

**Parámetros:**
- `id` (number): ID del aprendiz

**Retorna:** `Promise<Object|null>` - Datos del aprendiz o null si no existe

#### `actualizarAprendiz(id, datosActualizados)`
Actualiza los datos de un aprendiz.

**Parámetros:**
- `id` (number): ID del aprendiz
- `datosActualizados` (Object): Campos a actualizar

**Retorna:** `Promise<Object>` - Resultado de la operación

#### `eliminarAprendiz(id)`
Elimina un aprendiz de la base de datos.

**Parámetros:**
- `id` (number): ID del aprendiz

**Retorna:** `Promise<Object>` - Resultado de la eliminación

## ServicioConsultasAdministrador

### Propósito
Maneja las consultas relacionadas con administradores del sistema.

### API Pública

#### `buscarPorEmail(email)`
Busca un administrador por su correo electrónico.

**Parámetros:**
- `email` (string): Correo electrónico del administrador

**Retorna:** `Promise<Object|undefined>` - Datos del administrador

#### `insertarAdministrador(datosAdmin)`
Inserta un nuevo administrador en la base de datos.

**Parámetros:**
- `datosAdmin` (Object): Datos del administrador (debe incluir password hasheado)

**Retorna:** `Promise<Object>` - Resultado de la inserción

#### `actualizarPassword(email, hashedPassword)`
Actualiza la contraseña de un administrador.

**Parámetros:**
- `email` (string): Correo electrónico del administrador
- `hashedPassword` (string): Nueva contraseña hasheada

**Retorna:** `Promise<Object>` - Resultado de la actualización

## ServicioWatsonSentimientos

### Propósito
Integra IBM Watson Natural Language Understanding para análisis de sentimientos en bitácoras de aprendices.

### Características
- Análisis de sentimientos en textos de bitácoras
- Detección de ironía y contextos
- Recomendaciones automáticas basadas en análisis
- Fallback local cuando Watson no está disponible

### API Pública

#### `analizarBitacora(bitacora)`
Analiza una bitácora individual.

**Parámetros:**
- `bitacora` (Object): Objeto de bitácora con contenido

**Retorna:** `Promise<Object>` - Análisis detallado de sentimientos

#### `analizarTendenciasAprendiz(bitacoras)`
Analiza tendencias en múltiples bitácoras de un aprendiz.

**Parámetros:**
- `bitacoras` (Array): Array de bitácoras

**Retorna:** `Promise<Object>` - Análisis de tendencias

#### `obtenerEstadoConexion()`
Verifica el estado de conexión con Watson.

**Retorna:** `Object` - Estado de la conexión

## ServicioAnalisisSentimientos

### Propósito
Servicio de análisis de sentimientos local como fallback cuando Watson no está disponible.

### Características
- Análisis básico de sentimientos usando librerías locales
- Procesamiento de lenguaje natural básico
- Recomendaciones predefinidas

## Dependencias
- `mysql2/promise`: Para conexiones a base de datos
- `ibm-watson`: Para análisis de IA (opcional)
- `compromise`: Para procesamiento de lenguaje natural
- `sentiment`: Para análisis de sentimientos básico

## Consideraciones de Seguridad
- Todas las consultas usan prepared statements para prevenir SQL injection
- Validación de entrada en todos los métodos públicos
- Logging de operaciones sensibles

## Consideraciones de Rendimiento
- Consultas optimizadas con índices apropiados
- Paginación para grandes conjuntos de datos
- Caching recomendado para datos frecuentemente accedidos

## Manejo de Errores
- Errores de base de datos se propagan con contexto
- Validaciones de entrada con mensajes descriptivos
- Logging de errores para debugging

## Testing
Los servicios incluyen tests unitarios completos con mocks para dependencias externas.