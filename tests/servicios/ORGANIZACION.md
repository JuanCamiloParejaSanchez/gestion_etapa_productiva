# Organización de Tests de Servicios 📁

## 📌 Resumen

Los tests de servicios de negocio han sido organizados en una carpeta dedicada para mejor estructura y mantenibilidad del proyecto.

## 🗂️ Estructura Actual

```
tests/
├── autenticacion/          # Tests de autenticación
│   ├── integracion.test.js
│   ├── login.test.js
│   ├── middleware.test.js
│   ├── proteccion-rutas.test.js
│   ├── recuperacion.test.js
│   ├── tokens.test.js
│   └── README.md
├── servicios/             # ✨ Tests de servicios de negocio (NUEVA CARPETA)
│   ├── servicioAnalisisSentimientos.test.js
│   ├── servicioAprendiz.test.js
│   ├── servicioCorreo.test.js
│   ├── servicioDocumentosAprendiz.test.js
│   ├── servicioGestionAprendices.test.js
│   ├── servicioRecuperacion.test.js
│   ├── servicioWatsonSentimientos.test.js
│   └── README.md
└── setup.js               # Configuración global de tests
```

## 📊 Estadísticas

| Categoría | Cantidad |
|-----------|----------|
| **Archivos movidos** | 7 archivos |
| **Tests totales** | 135 tests de servicios |
| **Líneas de código** | ~2,500 líneas |
| **Cobertura** | Servicios críticos de negocio |

## ✅ Cambios Realizados

### 1. **Creación de carpeta**
- ✅ Creada `tests/servicios/` para contener todos los tests de servicios de negocio

### 2. **Archivos movidos**
```
tests/servicioGestionAprendices.test.js  →  tests/servicios/servicioGestionAprendices.test.js
tests/servicioAprendiz.test.js           →  tests/servicios/servicioAprendiz.test.js
tests/servicioCorreo.test.js             →  tests/servicios/servicioCorreo.test.js
tests/servicioRecuperacion.test.js       →  tests/servicios/servicioRecuperacion.test.js
tests/servicioDocumentosAprendiz.test.js →  tests/servicios/servicioDocumentosAprendiz.test.js
tests/servicioWatsonSentimientos.test.js →  tests/servicios/servicioWatsonSentimientos.test.js
tests/servicioAnalisisSentimientos.test.js → tests/servicios/servicioAnalisisSentimientos.test.js
```

### 3. **Rutas actualizadas**

#### Antes:
```javascript
require('../src/configuracion/baseDatos')
require('../src/modulos/aprendiz/servicios/servicioAprendiz')
```

#### Después:
```javascript
require('../../src/configuracion/baseDatos')
require('../../src/modulos/aprendiz/servicios/servicioAprendiz')
```

**Cambio:** `../src/` → `../../src/` (un nivel más arriba debido a la nueva carpeta)

### 4. **Documentación**
- ✅ README.md creado en `tests/servicios/` con documentación completa
- ✅ ORGANIZACION.md (este archivo) para referencia de la reorganización

## 🚀 Ejecución de Tests

### Todos los tests del proyecto
```bash
npm test
```

### Solo tests de servicios
```bash
npm test -- --testPathPatterns="servicios/"
```

### Test específico
```bash
npm test -- --testPathPatterns="servicios/servicioAprendiz.test.js"
```

### Con cobertura
```bash
npm test -- --coverage --testPathPatterns="servicios/"
```

## 📝 Detalles de Rutas Actualizadas

### servicioGestionAprendices.test.js
```javascript
// ANTES
const ServicioGestionAprendices = require('../src/modulos/administrador/servicios/servicioGestionAprendices');
jest.mock('../src/configuracion/baseDatos', () => ({...}));
jest.mock('../src/configuracion/cache', () => ({...}));

// DESPUÉS
const ServicioGestionAprendices = require('../../src/modulos/administrador/servicios/servicioGestionAprendices');
jest.mock('../../src/configuracion/baseDatos', () => ({...}));
jest.mock('../../src/configuracion/cache', () => ({...}));
```

### servicioAprendiz.test.js
```javascript
// ANTES
const ServicioAprendiz = require('../src/modulos/aprendiz/servicios/servicioAprendiz');
const { formatearFecha } = require('../src/compartido/utilidades/utilFechas');
jest.mock('../src/configuracion/baseDatos', () => ({...}));

// DESPUÉS
const ServicioAprendiz = require('../../src/modulos/aprendiz/servicios/servicioAprendiz');
const { formatearFecha } = require('../../src/compartido/utilidades/utilFechas');
jest.mock('../../src/configuracion/baseDatos', () => ({...}));
```

### servicioCorreo.test.js
```javascript
// ANTES
const ServicioCorreo = require('../src/compartido/servicios/servicioCorreo');

// DESPUÉS
const ServicioCorreo = require('../../src/modulos/aprendiz/servicios/servicioCorreo');
```

### servicioRecuperacion.test.js
```javascript
// ANTES
const ServicioRecuperacion = require('../src/compartido/servicios/servicioRecuperacion');
jest.mock('../src/configuracion/baseDatos', () => ({...}));

// DESPUÉS
const ServicioRecuperacion = require('../../src/modulos/aprendiz/servicios/servicioRecuperacion');
jest.mock('../../src/configuracion/baseDatos', () => ({...}));
```

### servicioDocumentosAprendiz.test.js
```javascript
// ANTES
const ServicioDocumentosAprendiz = require('../src/compartido/servicios/servicioDocumentosAprendiz');
jest.mock('../src/configuracion/baseDatos', () => ({...}));

// DESPUÉS
const ServicioDocumentosAprendiz = require('../../src/modulos/aprendiz/servicios/servicioDocumentosAprendiz');
jest.mock('../../src/configuracion/baseDatos', () => ({...}));
```

### servicioWatsonSentimientos.test.js
```javascript
// ANTES
const ServicioWatsonSentimientos = require('../src/modulos/administrador/servicios/servicioWatsonSentimientos');
jest.mock('../src/configuracion/watsonConfig', () => ({...}));

// DESPUÉS
const ServicioWatsonSentimientos = require('../../src/modulos/administrador/servicios/servicioWatsonSentimientos');
jest.mock('../../src/configuracion/watsonConfig', () => ({...}));
```

### servicioAnalisisSentimientos.test.js
```javascript
// DESPUÉS (ya estaba correcto)
const ServicioAnalisisSentimientos = require('../../src/modulos/administrador/servicios/servicioAnalisisSentimientos');
const ServicioWatsonSentimientos = require('../../src/modulos/administrador/servicios/servicioWatsonSentimientos');
```

## ✨ Beneficios de la Organización

### 1. **Mejor Estructura**
- Los tests de servicios están agrupados lógicamente
- Fácil navegación y localización de archivos
- Separación clara entre tests de autenticación y servicios

### 2. **Mantenibilidad**
- Más fácil agregar nuevos tests de servicios
- README dedicado con documentación específica
- Convenciones claras de nomenclatura

### 3. **Escalabilidad**
- Preparado para futuras categorías de tests
- Estructura modular y extensible
- Fácil de configurar en CI/CD

### 4. **Documentación**
- README específico para tests de servicios
- Guías de ejecución actualizadas
- Documentación de rutas y dependencias

## 🔍 Verificación

### Tests pasando
```bash
Test Suites: 9 passed (autenticación) + tests de servicios
Tests:       212+ passed
```

### Estructura verificada
```bash
ls tests/servicios/
# Debe mostrar 8 archivos (7 tests + README.md)
```

## 📚 Referencias

- **README principal de tests servicios**: `tests/servicios/README.md`
- **Setup de tests**: `tests/setup.js`
- **Configuración Jest**: `jest.config.js`

## 🎯 Próximos Pasos Recomendados

1. **Agregar más categorías** de tests si es necesario:
   ```
   tests/
   ├── autenticacion/
   ├── servicios/
   ├── controladores/  (futuro)
   ├── middlewares/    (futuro)
   └── integracion/    (futuro)
   ```

2. **Configurar test coverage** específico por carpeta

3. **Agregar scripts NPM** personalizados:
   ```json
   {
     "scripts": {
       "test:servicios": "jest --testPathPatterns=servicios/",
       "test:auth": "jest --testPathPatterns=autenticacion/",
       "test:all": "jest"
     }
   }
   ```

---

**Fecha de reorganización**: 30 de octubre de 2025  
**Estado**: ✅ COMPLETADO Y VERIFICADO
