# Corrección del Sistema de Ordenamiento de Tablas

## Problema Identificado

En el archivo `aprendicesDocsPendientes.ejs`, el sistema de ordenamiento solo funcionaba correctamente para las columnas `nombres`, `primerApellido` y `segundoApellido`, mientras que en `listarAprendices.ejs` funcionaba para todas las columnas.

## Causa del Problema

El problema se encontraba en el mapeo de columnas (`columnMapping`) dentro de la función `getOrderData()` en `aprendicesDocsPendientes.ejs`. **La diferencia fundamental es que ambas tablas tienen estructuras HTML completamente diferentes:**

- **listarAprendices.ejs**: Tiene 34 columnas (índices 0-33)
- **aprendicesDocsPendientes.ejs**: Tiene solo 13 columnas (índices 0-12)

### Estructura Real de las Tablas:

#### listarAprendices.ejs (34 columnas):
```html
<th data-column="tipoDocumento">Tipo Documento</th>          <!-- 0 -->
<th data-column="numeroDocumento">Número Documento</th>      <!-- 1 -->
<th data-column="estadoFormacion">Estado Formación</th>      <!-- 2 -->
<th data-column="nombres">Nombres</th>                      <!-- 3 -->
<th data-column="primerApellido">Primer Apellido</th>        <!-- 4 -->
<th data-column="segundoApellido">Segundo Apellido</th>      <!-- 5 -->
<th data-column="fechaNacimiento">Fecha Nacimiento</th>      <!-- 6 -->
<th data-column="eps">EPS</th>                              <!-- 7 -->
<!-- ... 25 columnas más ... -->
<th data-column="acciones" class="text-center">Acciones</th> <!-- 33 -->
```

#### aprendicesDocsPendientes.ejs (13 columnas):
```html
<th data-column="tipoDocumento">Tipo Documento</th>          <!-- 0 -->
<th data-column="numeroDocumento">Número Documento</th>      <!-- 1 -->
<th data-column="estadoFormacion">Estado Formación</th>      <!-- 2 -->
<th data-column="nombres">Nombres</th>                      <!-- 3 -->
<th data-column="primerApellido">Primer Apellido</th>        <!-- 4 -->
<th data-column="segundoApellido">Segundo Apellido</th>      <!-- 5 -->
<th data-column="telefonoFijo">Teléfono</th>                <!-- 6 -->
<th data-column="celular">Celular</th>                      <!-- 7 -->
<th data-column="correoElectronico">Correo</th>              <!-- 8 -->
<th data-column="numeroFicha">Ficha</th>                    <!-- 9 -->
<th data-column="programaFormacion">Programa</th>            <!-- 10 -->
<th data-column="alternativaSeleccionada">Alternativa</th>   <!-- 11 -->
<th data-column="acciones">Acciones</th>                    <!-- 12 -->
```

## Solución Implementada

Se corrigió el `columnMapping` en `aprendicesDocsPendientes.ejs` para que coincida exactamente con su estructura HTML específica de 13 columnas:

### Antes (Incorrecto - copiado de listarAprendices):
```javascript
const columnMapping = {
    'tipoDocumento': { index: 0, type: 'text' },
    'numeroDocumento': { index: 1, type: 'number' },
    // ... mapeo para 33 columnas que no existen en esta tabla
    'horario': { index: 32, type: 'text' }
};
// ❌ Intentaba mapear 33 columnas cuando la tabla solo tiene 13
```

### Después (Corregido - específico para aprendicesDocsPendientes):
```javascript
const columnMapping = {
    'tipoDocumento': { index: 0, type: 'text' },
    'numeroDocumento': { index: 1, type: 'number' },
    'estadoFormacion': { index: 2, type: 'text' },
    'nombres': { index: 3, type: 'text' },
    'primerApellido': { index: 4, type: 'text' },
    'segundoApellido': { index: 5, type: 'text' },
    'telefonoFijo': { index: 6, type: 'number' },
    'celular': { index: 7, type: 'number' },
    'correoElectronico': { index: 8, type: 'text' },
    'numeroFicha': { index: 9, type: 'number' },
    'programaFormacion': { index: 10, type: 'text' },
    'alternativaSeleccionada': { index: 11, type: 'text' },
    'acciones': { index: 12, type: 'none' }
};
// ✅ Mapeo correcto para las 13 columnas reales de la tabla
```

## Validación de la Corrección

Para verificar que la corrección es correcta, se puede contrastar con la estructura HTML real de la tabla en `aprendicesDocsPendientes.ejs`:

```html
<thead>
    <tr>
        <th data-column="tipoDocumento">Tipo Documento</th>          <!-- índice 0 -->
        <th data-column="numeroDocumento">Número Documento</th>      <!-- índice 1 -->
        <th data-column="estadoFormacion">Estado Formación</th>      <!-- índice 2 -->
        <th data-column="nombres">Nombres</th>                      <!-- índice 3 -->
        <th data-column="primerApellido">Primer Apellido</th>        <!-- índice 4 -->
        <th data-column="segundoApellido">Segundo Apellido</th>      <!-- índice 5 -->
        <th data-column="telefonoFijo">Teléfono</th>                <!-- índice 6 -->
        <th data-column="celular">Celular</th>                      <!-- índice 7 -->
        <th data-column="correoElectronico">Correo</th>              <!-- índice 8 -->
        <th data-column="numeroFicha">Ficha</th>                    <!-- índice 9 -->
        <th data-column="programaFormacion">Programa</th>            <!-- índice 10 -->
        <th data-column="alternativaSeleccionada">Alternativa</th>   <!-- índice 11 -->
        <th data-column="acciones">Acciones</th>                    <!-- índice 12 -->
    </tr>
</thead>
```

**Importante**: Esta tabla tiene exactamente 13 columnas (índices 0-12), no 34 como `listarAprendices.ejs`.

## Diferencias Clave Entre Ambas Tablas

| Aspecto | listarAprendices.ejs | aprendicesDocsPendientes.ejs |
|---------|---------------------|------------------------------|
| **Total de columnas** | 34 columnas | 13 columnas |
| **Columnas únicas** | Incluye fechas, direcciones, empresa, etc. | Solo información básica del aprendiz |
| **Propósito** | Vista completa de todos los aprendices | Vista específica para documentos pendientes |
| **columnMapping** | Índices 0-33 | Índices 0-12 |

## Resultado Esperado

Después de esta corrección completa (frontend + backend):
- ✅ Todas las 13 columnas en `aprendicesDocsPendientes.ejs` deberían permitir ordenamiento
- ✅ El ordenamiento debería funcionar correctamente según el tipo de datos:
  - **Texto** (A-Z, Z-A): tipoDocumento, estadoFormacion, nombres, primerApellido, segundoApellido, correoElectronico, programaFormacion, alternativaSeleccionada
  - **Número** (menor a mayor, mayor a menor): numeroDocumento, telefonoFijo, celular, numeroFicha
- ✅ Los íconos de ordenamiento deberían mostrar las opciones apropiadas para cada tipo de columna
- ✅ El servidor ahora distingue correctamente entre ambas tablas usando el parámetro `tableType`
- ✅ `listarAprendices.ejs` sigue funcionando correctamente sin cambios

## Cómo Probar la Corrección

1. **Acceder a la página de documentos pendientes** (generalmente desde alertas/bitácora)
2. **Hacer clic en los íconos de ordenamiento** de cualquier columna
3. **Verificar que aparecen las opciones correctas** según el tipo de columna
4. **Confirmar que el ordenamiento se aplica** y los datos se reorganizan correctamente
5. **Verificar en la consola del navegador** que no hay errores de JavaScript

## Archivos de Referencia (No Modificados)

- `views/administrador/listarAprendices.ejs` - Funcionaba correctamente, usado como referencia
- `public/js/admin/ordenamientoTabla.js` - Lógica de ordenamiento funcional
- `public/estilos/general/estilosBase.css` - Estilos CSS funcionando correctamente

## Archivos Modificados

### Frontend:
- `views/administrador/aprendicesDocsPendientes.ejs` - Corregido el mapeo de columnas y agregado parámetro `tableType`

### Backend:
- `src/modulos/administrador/controladores/gestionAprendicesControlador.js` - Agregada lógica para distinguir entre ambos tipos de tabla

## Cambios Implementados

### 1. **Frontend (aprendicesDocsPendientes.ejs)**:
- ✅ Corregido el `columnMapping` para coincidir con las 13 columnas reales
- ✅ Agregado parámetro `tableType: 'docsPendientes'` en la petición AJAX
- ✅ Comentarios explicativos sobre la diferencia con listarAprendices.ejs

### 2. **Backend (gestionAprendicesControlador.js)**:
- ✅ Agregado soporte para el parámetro `tableType`
- ✅ Lógica condicional para usar diferentes mapeos de columnas:
  - **docsPendientes**: 13 columnas específicas para aprendicesDocsPendientes.ejs
  - **default**: 33 columnas para listarAprendices.ejs
- ✅ Validación y seguridad mantenidas

### 3. **Mapeos de Columnas**:

#### Servidor - docsPendientes (13 columnas):
```javascript
columnMapping = [
    'tipoDocumento', 'numeroDocumento', 'estadoFormacion', 'nombres', 'primerApellido', 
    'segundoApellido', 'telefonoFijo', 'celular', 'correoElectronico', 'numeroFicha', 
    'programaFormacion', 'alternativaSeleccionada', 'acciones'
];
```

#### Servidor - listarAprendices (33 columnas):
```javascript
columnMapping = [
    'tipoDocumento', 'numeroDocumento', 'estadoFormacion', 'nombres', 'primerApellido', 
    'segundoApellido', 'fechaNacimiento', 'eps', 'telefonoFijo', 'celular', 'direccion', 
    'barrio', 'departamento', 'municipio', 'correoElectronico', 'fechaInicioLectiva', 
    'fechaFinLectiva', 'fechaInicioProductiva', 'fechaFinProductiva', 'instructorLectiva', 
    'instructorProductiva', 'numeroFicha', 'programaFormacion', 'alternativaSeleccionada', 
    'areaFormacion', 'empresaPatrocinadora', 'areaPractica', 'jefeInmediato', 'telefonoEmpresa', 
    'celularEmpresa', 'direccionEmpresa', 'correoEmpresa', 'horario'
];
```

---

**Fecha de corrección**: 11 de agosto de 2025  
**Desarrollador**: GitHub Copilot
