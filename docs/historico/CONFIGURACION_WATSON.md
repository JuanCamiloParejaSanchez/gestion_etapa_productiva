# Configuración de IBM Watson Natural Language Understanding

## 🎯 Descripción

Este documento explica cómo configurar IBM Watson Natural Language Understanding para mejorar el análisis de sentimientos en la aplicación de gestión de etapa productiva.

## 🚀 Ventajas de IBM Watson

- ✅ **Análisis muy preciso** de sentimientos en español
- ✅ **Plan gratuito** con 30,000 requests/mes
- ✅ **Detección de emociones** avanzada
- ✅ **Análisis de entidades** y palabras clave
- ✅ **Fallback automático** a análisis local si Watson no está disponible

## 📋 Pasos para Configurar IBM Watson

### 1. Crear Cuenta en IBM Cloud

1. Ve a [IBM Cloud](https://cloud.ibm.com/)
2. Crea una cuenta gratuita
3. Verifica tu email

### 2. Crear Instancia de Natural Language Understanding

1. En IBM Cloud, busca "Natural Language Understanding"
2. Haz clic en "Crear"
3. Selecciona el plan "Lite" (gratuito)
4. Elige una región (recomendado: US South)
5. Haz clic en "Crear"

### 3. Obtener Credenciales

1. Ve a tu instancia de Natural Language Understanding
2. Haz clic en "Credenciales de servicio"
3. Crea nuevas credenciales
4. Copia la **API Key** y **Service URL**

### 4. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
# Configuración de IBM Watson Natural Language Understanding
WATSON_API_KEY=tu_api_key_aqui
WATSON_SERVICE_URL=https://api.us-south.natural-language-understanding.watson.cloud.ibm.com/instances/tu_instance_id
WATSON_VERSION=2022-04-07

# Activar Watson (true = usar Watson, false = usar análisis local)
USE_WATSON_SENTIMENT_ANALYSIS=true
```

### 5. Instalar Dependencias

```bash
npm install ibm-watson
```

## 🔧 Configuración del Servicio

El servicio está configurado para:

- **Análisis de sentimientos** con targets específicos del contexto educativo
- **Detección de emociones** (felicidad, tristeza, ira, miedo, etc.)
- **Análisis de entidades** relevantes para el aprendizaje
- **Extracción de palabras clave** con sentimiento

### Targets Configurados

**Sentimientos:**
- aprendizaje, equipo, proyecto, instructor, empresa
- tecnología, programación, desarrollo, comunicación
- ambiente, presión, apoyo, progreso, dificultad

**Emociones:**
- felicidad, tristeza, ira, miedo, sorpresa
- disgusto, orgullo, vergüenza, confianza, ansiedad

## 📊 Funcionalidades del Servicio

### 1. Análisis Individual de Textos
```javascript
const resultado = await servicioWatson.analizarSentimiento(texto);
// Retorna: score, sentimiento, emociones, entidades, palabras clave
```

### 2. Análisis de Bitácoras Completas
```javascript
const analisis = await servicioWatson.analizarBitacora(bitacora);
// Analiza: desafíos, logros, comunicación
```

### 3. Análisis de Tendencias
```javascript
const tendencias = await servicioWatson.analizarTendenciasAprendiz(bitacoras);
// Incluye: score promedio, tendencia, variabilidad, recomendaciones
```

## 🔄 Fallback Automático

Si Watson no está disponible, el sistema automáticamente:

1. **Usa análisis local** con diccionario de palabras
2. **Mantiene funcionalidad** completa
3. **Registra el error** para monitoreo
4. **Continúa funcionando** sin interrupciones

## 📈 Límites del Plan Gratuito

- **30,000 requests/mes** (suficiente para ~1,000 análisis diarios)
- **Máximo 50KB** por análisis de texto
- **Rate limit** de 10 requests/segundo

## 🛠️ Monitoreo y Debugging

### Verificar Estado de Conexión
```javascript
const estado = servicioWatson.obtenerEstadoConexion();
console.log(estado);
// Retorna: watsonDisponible, configuracionValida, usoWatson
```

### Logs del Sistema
- ✅ Watson inicializado correctamente
- ⚠️ Watson no configurado, usando análisis local
- ❌ Error al inicializar Watson

## 🔒 Seguridad

- Las credenciales se almacenan en variables de entorno
- No se incluyen en el código fuente
- Conexión HTTPS obligatoria
- Timeout configurado para evitar bloqueos

## 📝 Ejemplo de Uso

```javascript
// En tu controlador
const ServicioWatsonSentimientos = require('../servicios/servicioWatsonSentimientos');
const servicioWatson = new ServicioWatsonSentimientos();

// Analizar sentimiento
const resultado = await servicioWatson.analizarSentimiento(
    "Me siento muy feliz con mi progreso en el proyecto"
);

console.log(resultado);
// {
//   score: 3.2,
//   sentimiento: 'positivo',
//   emociones: { joy: 0.8, sadness: 0.1 },
//   entidades: [...],
//   palabrasClave: [...]
// }
```

## 🆘 Solución de Problemas

### Error: "API Key inválida"
- Verifica que la API Key esté correcta
- Asegúrate de que la instancia esté activa

### Error: "Service URL inválida"
- Verifica la URL del servicio
- Asegúrate de que incluya el ID de instancia

### Error: "Rate limit exceeded"
- Reduce la frecuencia de requests
- Implementa cache si es necesario

### Error: "Text too long"
- El texto excede 50KB
- Divide el texto en partes más pequeñas

## 📞 Soporte

- **IBM Cloud Support**: [Documentación oficial](https://cloud.ibm.com/docs/natural-language-understanding)
- **Comunidad**: [Stack Overflow](https://stackoverflow.com/questions/tagged/ibm-watson)
- **GitHub**: [Repositorio oficial](https://github.com/watson-developer-cloud/node-sdk)

---

**Nota**: Este servicio mejora significativamente la precisión del análisis de sentimientos, especialmente para textos en español y contexto educativo. 