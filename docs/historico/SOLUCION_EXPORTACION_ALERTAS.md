# Corrección de Botones de Exportación en Lista de Alertas

## Problema Identificado

En la página `/administrador/alertas/bitacora` había una tabla llamada "Aprendices con documentos pendientes de entrega" que tenía dos botones de exportación (Excel y PDF) que no funcionaban.

### Causa del Problema

Los botones de exportación estaban definidos en el HTML pero no tenían ninguna funcionalidad JavaScript implementada para manejar las exportaciones.

## Solución Implementada

### 1. Funcionalidad de Exportación a Excel

- **Librería utilizada**: SheetJS (XLSX)
- **Carga dinámica**: La librería se carga automáticamente desde CDN cuando se necesita
- **Características**:
  - Extrae datos solo de las filas visibles de la tabla
  - Respeta las columnas ocultas/mostradas por el selector de columnas
  - Genera nombre de archivo con fecha actual
  - Incluye headers de la tabla
  - Configura ancho de columnas automáticamente

### 2. Funcionalidad de Exportación a PDF

- **Librería utilizada**: html2pdf.js (ya estaba incluida)
- **Características**:
  - Orientación horizontal (landscape) para mejor visualización de tablas
  - Incluye encabezado con logo SENA y título
  - Fecha de generación
  - Estilos específicos para PDF (colores, bordes, tipografía)
  - Remover filas expandidas automáticamente
  - Pie de página con información adicional

### 3. Funciones Implementadas

#### `initializeExportButtons()`
- Configura los event listeners para los botones de exportación
- Se ejecuta automáticamente al cargar la página

#### `exportToExcel()`
- Maneja la exportación a Excel
- Carga SheetJS dinámicamente si no está disponible

#### `performExcelExport()`
- Realiza la exportación efectiva a Excel
- Extrae datos de la tabla respetando columnas visibles

#### `exportTableToPDF()`
- Maneja la exportación a PDF de la tabla completa
- Clona y limpia la tabla para generar una versión optimizada para PDF

#### `showSuccessNotification()`
- Muestra notificaciones de éxito usando Bootstrap Toast

### 4. Integración con el Sistema Existente

- Se mantiene compatibilidad con el sistema de ordenamiento existente
- Se respeta el selector de columnas visibles/ocultas
- Se integra con el sistema de filtros de la página

## Archivos Modificados

### `views/administrador/listaAlertas.ejs`
- Agregada función `initializeExportButtons()` al final del script
- Agregadas funciones de exportación completas
- Integración con el sistema de inicialización existente

## Librerías Utilizadas

### SheetJS (XLSX) - Para Excel
- **CDN**: `https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js`
- **Carga**: Dinámica cuando se necesita
- **Funcionalidad**: Generación de archivos Excel (.xlsx)

### html2pdf.js - Para PDF
- **Estado**: Ya estaba incluida en el proyecto
- **Funcionalidad**: Conversión de HTML a PDF

## Uso

1. **Exportación a Excel**:
   - Hacer clic en el botón "Excel" 
   - Se descargará automáticamente un archivo `.xlsx` con los datos visibles de la tabla

2. **Exportación a PDF**:
   - Hacer clic en el botón "PDF"
   - Se generará y descargará un archivo PDF con formato profesional

## Características Técnicas

### Compatibilidad
- Compatible con todos los navegadores modernos
- Manejo de errores robusto
- Carga progresiva de librerías

### Rendimiento
- Carga diferida de librerías
- Procesamiento eficiente de datos de tabla
- Indicadores de carga para operaciones largas

### Accesibilidad
- Botones con íconos descriptivos
- Notificaciones claras de estado
- Manejo de errores con mensajes comprensibles

## Notas de Mantenimiento

- Las librerías se cargan desde CDN para mantener el proyecto actualizado
- El código es modular y fácil de mantener
- Se pueden agregar fácilmente más formatos de exportación siguiendo el mismo patrón

## Testing

Para probar la funcionalidad:

1. Navegar a `/administrador/alertas/bitacora`
2. Verificar que existan datos en la tabla
3. Probar el botón "Excel" - debe descargar un archivo .xlsx
4. Probar el botón "PDF" - debe generar y descargar un PDF
5. Verificar que las exportaciones respeten los filtros y columnas visibles

## Logs y Debugging

Las funciones incluyen logs detallados en la consola del navegador para facilitar el debugging:
- Estado de inicialización de botones
- Progreso de exportación
- Errores detallados si algo falla
