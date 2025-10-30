# Tests de Validaciones

Este directorio contiene tests exhaustivos para todos los módulos de validación del sistema de gestión de etapa productiva.

## 📁 Estructura de Tests

```
tests/validaciones/
├── aprendizValidaciones.test.js       # Tests para validaciones de aprendices
├── esquemasValidacion.test.js         # Tests para esquemas Joi
├── validacionesMejoradas.test.js      # Tests para validaciones mejoradas
├── integracionFormularios.test.js     # Tests de integración de formularios
└── README.md                          # Este archivo
```

## 🧪 Archivos de Tests

### 1. `aprendizValidaciones.test.js`
Tests para validaciones de express-validator relacionadas con aprendices.

**Cobertura:**
- ✅ Validaciones de campos básicos (nombres, apellidos, documentos)
- ✅ Validaciones de ubicación (dirección, departamento, municipio)
- ✅ Validaciones de contacto y formación
- ✅ Validaciones de etapa productiva
- ✅ Validaciones de fechas
- ✅ Validación de parámetros (ID)
- ✅ Validación de filtros de búsqueda
- ✅ Validación completa de actualización

**Tests incluidos:** 60+

### 2. `esquemasValidacion.test.js`
Tests para esquemas de validación usando Joi.

**Cobertura:**
- ✅ Función `validarDatos()`
- ✅ Esquemas de registro de aprendiz
- ✅ Esquemas de actualización de perfil
- ✅ Esquemas de bitácoras
- ✅ Esquemas de administradores
- ✅ Esquemas de autenticación (login, reset password, change password)

**Tests incluidos:** 80+

### 3. `validacionesMejoradas.test.js`
Tests para validaciones mejoradas con sanitización y seguridad.

**Cobertura:**
- ✅ Manejo de errores de validación
- ✅ Sanitización de entrada (XSS, SQL injection)
- ✅ Validación de archivos subidos
- ✅ Validaciones de autenticación (login, registro, reset)
- ✅ Validaciones de gestión de aprendices
- ✅ Validaciones de administradores
- ✅ Validaciones de bitácoras
- ✅ Validaciones de documentos

**Tests incluidos:** 70+

### 4. `integracionFormularios.test.js`
Tests de integración end-to-end para validación de formularios.

**Cobertura:**
- ✅ Flujo completo de registro de aprendiz
- ✅ Flujo completo de actualización de perfil
- ✅ Flujo completo de carga de documentos
- ✅ Flujo completo de registro de bitácoras
- ✅ Validaciones en cascada

**Tests incluidos:** 30+

## 🚀 Ejecutar Tests

### Todos los tests de validaciones
```bash
npm test tests/validaciones
```

### Test específico
```bash
npm test tests/validaciones/aprendizValidaciones.test.js
npm test tests/validaciones/esquemasValidacion.test.js
npm test tests/validaciones/validacionesMejoradas.test.js
npm test tests/validaciones/integracionFormularios.test.js
```

### Con cobertura
```bash
npm run test:coverage -- tests/validaciones
```

### Modo watch (desarrollo)
```bash
npm run test:watch -- tests/validaciones
```

## 📊 Cobertura Esperada

Los tests de validaciones deben mantener una cobertura mínima de:
- **Statements:** 95%
- **Branches:** 90%
- **Functions:** 95%
- **Lines:** 95%

## ✅ Casos de Prueba Principales

### Validaciones Positivas (Happy Path)
- Datos completamente válidos
- Formatos correctos
- Rangos válidos
- Relaciones correctas entre campos

### Validaciones Negativas (Error Cases)
- Campos vacíos o faltantes
- Formatos inválidos
- Valores fuera de rango
- Caracteres especiales no permitidos
- Longitud incorrecta
- Tipos de datos incorrectos

### Validaciones de Seguridad
- Inyección SQL
- Cross-Site Scripting (XSS)
- Path Traversal
- Archivos maliciosos
- Datos demasiado grandes

### Validaciones de Negocio
- Edades válidas
- Fechas en orden cronológico
- Relaciones entre entidades
- Reglas específicas del SENA

## 🔧 Mantenimiento

### Al agregar nuevas validaciones:
1. Crear tests en el archivo correspondiente
2. Incluir casos positivos y negativos
3. Verificar cobertura de código
4. Actualizar este README si es necesario

### Al modificar validaciones existentes:
1. Actualizar tests afectados
2. Verificar que no se rompan tests existentes
3. Ejecutar suite completa de tests
4. Revisar cobertura de código

## 🐛 Reporte de Bugs

Si encuentra un bug en las validaciones:
1. Verificar que el bug sea reproducible
2. Crear un test que falle mostrando el bug
3. Corregir el código de validación
4. Verificar que el test ahora pase
5. Ejecutar toda la suite para evitar regresiones

## 📝 Notas Importantes

- Los tests usan mocks para evitar dependencias externas
- No se conectan a la base de datos real
- No envían emails reales
- Son rápidos y determinísticos
- Se pueden ejecutar en cualquier orden

## 🔐 Seguridad

Los tests incluyen validaciones de seguridad para proteger contra:
- ✅ Inyección SQL
- ✅ Cross-Site Scripting (XSS)
- ✅ Command Injection
- ✅ Path Traversal
- ✅ File Upload vulnerabilities
- ✅ Mass Assignment
- ✅ Buffer Overflow

## 📚 Recursos Adicionales

- [Express Validator Documentation](https://express-validator.github.io/)
- [Joi Documentation](https://joi.dev/)
- [Jest Documentation](https://jestjs.io/)
- [OWASP Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
