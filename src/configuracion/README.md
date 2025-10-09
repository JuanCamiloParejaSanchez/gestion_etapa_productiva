# Configuración del Sistema

## Base de Datos (baseDatos.js)

### Propósito
Módulo de configuración y conexión a la base de datos MySQL usando mysql2/promise.

### Características
- Pool de conexiones para mejor rendimiento
- Configuración por variables de entorno
- Verificación automática de conexión
- Manejo de errores y reconexión

### Configuración de Variables de Entorno

```bash
# Base de datos
DB_HOST=localhost
DB_USER=usuario
DB_PASSWORD=contraseña
DB_NAME=gestion_etapa_productiva
DB_PORT=3305
DB_CONNECTION_LIMIT=10

# Sesiones
SESSION_NAME=gestion_sesion
SESSION_SECRET=tu_clave_secreta_muy_segura
COOKIE_MAX_AGE=86400000
```

### API Pública

#### `pool`
Instancia del pool de conexiones MySQL.

**Tipo:** `mysql2.Pool`

**Uso:**
```javascript
const { pool } = require('./configuracion/baseDatos');

// Ejecutar consulta
const [rows] = await pool.execute('SELECT * FROM aprendices WHERE id = ?', [id]);
```

#### `verifyDatabaseConnection()`
Verifica la conexión a la base de datos.

**Retorna:** `Promise<boolean>` - true si la conexión es exitosa

**Ejemplo:**
```javascript
const { verifyDatabaseConnection } = require('./configuracion/baseDatos');

const isConnected = await verifyDatabaseConnection();
if (!isConnected) {
    console.error('No se pudo conectar a la base de datos');
    process.exit(1);
}
```

#### `cleanup()`
Cierra el pool de conexiones de manera ordenada.

**Retorna:** `Promise<void>`

### Configuración del Pool
- **host**: Host del servidor MySQL
- **user**: Usuario de la base de datos
- **password**: Contraseña del usuario
- **database**: Nombre de la base de datos
- **port**: Puerto del servidor MySQL (default: 3305)
- **waitForConnections**: Esperar conexiones si el pool está lleno
- **connectionLimit**: Máximo número de conexiones (default: 10)
- **queueLimit**: Límite de cola de conexiones (0 = ilimitado)
- **charset**: Charset de la conexión (utf8mb4)

### Manejo de Errores
- **PROTOCOL_CONNECTION_LOST**: Se perdió la conexión con el servidor
- **ER_CON_COUNT_ERROR**: El pool de conexiones está lleno
- **ECONNREFUSED**: Conexión rechazada por el servidor

### Mejores Prácticas
1. **Usar prepared statements**: Siempre usar `pool.execute()` con placeholders
2. **Liberar conexiones**: El pool maneja automáticamente la liberación
3. **Configurar límites apropiados**: Ajustar `connectionLimit` según la carga
4. **Manejar reconexiones**: El pool maneja automáticamente reconexiones fallidas
5. **Validar configuración**: Verificar variables de entorno al inicio

## Watson Configuration (watsonConfig.js)

### Propósito
Configuración de IBM Watson Natural Language Understanding para análisis de sentimientos.

### Configuración Requerida

```bash
# IBM Watson
WATSON_API_KEY=tu_api_key_de_watson
WATSON_URL=https://api.us-south.natural-language-understanding.watson.cloud.ibm.com
WATSON_VERSION=2021-08-01
```

### Características
- Configuración opcional (el sistema funciona sin Watson)
- Validación de credenciales
- Manejo de errores de conexión

### API Pública

#### `crearInstanciaWatson()`
Crea y configura una instancia de Watson NLU.

**Retorna:** `NaturalLanguageUnderstanding` - Instancia configurada de Watson

**Ejemplo:**
```javascript
const watson = crearInstanciaWatson();

// Usar para análisis
const analysis = await watson.analyze({
    text: 'Contenido de la bitácora',
    features: {
        sentiment: {},
        emotion: {}
    }
});
```

### Funciones de Análisis Soportadas
- **Sentiment Analysis**: Análisis de sentimientos positivos/negativos
- **Emotion Detection**: Detección de emociones (alegría, tristeza, enojo, etc.)
- **Keywords Extraction**: Extracción de palabras clave
- **Entities Recognition**: Reconocimiento de entidades

### Fallback Local
Cuando Watson no está configurado, el sistema usa análisis local con:
- Librería `sentiment` para análisis básico
- Librería `compromise` para procesamiento de lenguaje natural
- Algoritmos de análisis de sentimientos simples

### Consideraciones de Costo
- Watson NLU tiene costos por uso
- Considerar límites de API y cuotas
- Implementar caching para evitar llamadas repetidas

### Seguridad
- API keys deben almacenarse en variables de entorno
- No commitear credenciales en código
- Usar HTTPS para todas las comunicaciones

## Variables de Entorno Completas

### Base de Datos
```bash
DB_HOST=localhost
DB_USER=gestion_user
DB_PASSWORD=secure_password_123
DB_NAME=gestion_etapa_productiva
DB_PORT=3305
DB_CONNECTION_LIMIT=10
```

### Sesiones
```bash
SESSION_NAME=gestion_sesion
SESSION_SECRET=clave_ultra_secreta_de_64_caracteres_minimo_para_seguridad
COOKIE_MAX_AGE=86400000
NODE_ENV=production
```

### Correo Electrónico
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_app_password
```

### Watson (Opcional)
```bash
WATSON_API_KEY=tu_api_key_aqui
WATSON_URL=https://api.us-south.natural-language-understanding.watson.cloud.ibm.com
WATSON_VERSION=2021-08-01
```

### Servidor
```bash
PORT=3000
```

## Validación de Configuración
Se recomienda validar todas las variables críticas al inicio de la aplicación:

```javascript
// En servidor.js o archivo de inicialización
function validarConfiguracion() {
    const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'SESSION_SECRET'];

    for (const env of required) {
        if (!process.env[env]) {
            throw new Error(`Variable de entorno requerida faltante: ${env}`);
        }
    }

    // Validar formato de email si está presente
    if (process.env.EMAIL_USER && !process.env.EMAIL_USER.includes('@')) {
        throw new Error('EMAIL_USER debe ser una dirección de email válida');
    }
}
```

## Monitoreo y Logging
- Loggear intentos de conexión fallidos
- Monitorear uso del pool de conexiones
- Alertar sobre errores de Watson
- Rotar logs automáticamente (configurado en logger.js)

## Troubleshooting
1. **Error de conexión**: Verificar credenciales y conectividad de red
2. **Pool agotado**: Aumentar `connectionLimit` o optimizar consultas
3. **Watson no funciona**: Verificar API key y cuotas de uso
4. **Sesiones no persisten**: Verificar configuración de MySQL session store