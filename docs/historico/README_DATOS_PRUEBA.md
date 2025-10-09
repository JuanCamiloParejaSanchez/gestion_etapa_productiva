# 📊 Scripts de Datos de Prueba - Sistema SENA

Este directorio contiene scripts para generar e insertar datos de prueba masivos en el sistema de gestión de etapa productiva del SENA.

## 🚀 Scripts Disponibles

### 1. `generar_datos_prueba.js`
Genera datos de prueba en diferentes formatos (JSON, SQL, Postman).

### 2. `insertar_datos_prueba.js`
Inserta datos de prueba directamente en la base de datos.

## 📋 Uso de los Scripts

### Opción 1: Generar archivos de datos

```bash
# Generar 50 registros en formato JSON (por defecto)
node scripts/generar_datos_prueba.js

# Generar 25 registros en formato JSON
node scripts/generar_datos_prueba.js 25

# Generar 100 registros en formato SQL
node scripts/generar_datos_prueba.js 100 sql

# Generar 30 registros en formato Postman
node scripts/generar_datos_prueba.js 30 postman
```

**Formatos disponibles:**
- `json`: Archivo JSON con array de objetos
- `sql`: Script SQL con INSERT statements
- `postman`: Colección de Postman para importar

### Opción 2: Inserción directa en base de datos

```bash
# Insertar 50 registros (por defecto)
node scripts/insertar_datos_prueba.js

# Insertar 25 registros
node scripts/insertar_datos_prueba.js 25
```

## 🔧 Requisitos Previos

1. **Base de datos configurada**: Asegúrate de que tu base de datos MySQL esté ejecutándose
2. **Configuración de conexión**: Verifica que `src/configuracion/baseDatos.js` esté configurado correctamente
3. **Tabla creada**: La tabla `aprendices` debe existir en tu base de datos

## 📁 Archivos Generados

Los scripts generan archivos con timestamp en el directorio `scripts/`:

- `datos_prueba_aprendices_YYYY-MM-DDTHH-MM-SS.json`
- `datos_prueba_aprendices_YYYY-MM-DDTHH-MM-SS.sql`
- `postman_collection_YYYY-MM-DDTHH-MM-SS.json`

## 🎯 Datos Generados

Los scripts generan datos realistas que incluyen:

### Información Personal
- Nombres y apellidos colombianos
- Tipos de documento (CC, TI, CE, PEP, PPT)
- Números de documento únicos
- Fechas de nacimiento (1990-2005)
- Información de contacto (teléfonos, correos)

### Información de Ubicación
- Departamentos y municipios colombianos
- Direcciones y barrios realistas
- EPS del sistema de salud colombiano

### Información Académica
- Programas de formación (Tec. Actividad Física, Tec. Entrenamiento Deportivo)
- Números de ficha únicos
- Fechas de etapas lectiva y productiva
- Instructores asignados

### Información de Etapa Productiva
- Alternativas seleccionadas (contrato de aprendizaje, pasantía, etc.)
- Empresas patrocinadoras realistas
- Áreas de práctica variadas
- Información de contacto empresarial

## 📊 Uso con Postman

1. **Generar colección**:
   ```bash
   node scripts/generar_datos_prueba.js 20 postman
   ```

2. **Importar en Postman**:
   - Abre Postman
   - Ve a "Import" → "File" → Selecciona el archivo generado

3. **Configurar variables de entorno**:
   - Crea una variable `base_url` con tu URL del servidor
   - Ejemplo: `http://localhost:3000`

4. **Ejecutar la colección**:
   - Selecciona la colección
   - Haz clic en "Run collection"

## 🗄️ Uso con SQL

1. **Generar script SQL**:
   ```bash
   node scripts/generar_datos_prueba.js 50 sql
   ```

2. **Ejecutar en MySQL**:
   ```sql
   -- Conectar a tu base de datos
   USE sena_etapa_productiva;
   
   -- Ejecutar el script generado
   SOURCE scripts/datos_prueba_aprendices_YYYY-MM-DDTHH-MM-SS.sql;
   ```

## ⚠️ Consideraciones Importantes

### Duplicados
- Los scripts verifican que no haya números de documento duplicados
- Los correos electrónicos son únicos por registro
- Si se detectan duplicados, se generan nuevos datos

### Validaciones
- Los datos generados cumplen con las validaciones del sistema
- Fechas coherentes entre etapas lectiva y productiva
- Números de documento y celular en formatos válidos

### Rendimiento
- La inserción directa incluye pausas para no sobrecargar la BD
- Se recomienda no generar más de 1000 registros de una vez
- Para grandes volúmenes, usar el script SQL es más eficiente

## 🔍 Verificación de Datos

Después de insertar los datos, puedes verificar:

1. **En el panel de administrador**: Lista de aprendices
2. **Filtros**: Probar búsquedas por nombre, documento, programa
3. **Reportes**: Verificar que los datos aparezcan en los reportes
4. **Base de datos**: Consultar directamente la tabla `aprendices`

## 🛠️ Personalización

Puedes modificar los arrays de datos en `generar_datos_prueba.js` para:

- Agregar más nombres y apellidos
- Incluir más departamentos y municipios
- Agregar más empresas o áreas de práctica
- Modificar las probabilidades de ciertos campos

## 📞 Soporte

Si encuentras problemas:

1. Verifica la conexión a la base de datos
2. Asegúrate de que la tabla `aprendices` existe
3. Revisa los logs de error en la consola
4. Verifica que los campos requeridos estén presentes

---

**¡Listo para probar tu sistema con datos realistas! 🎉** 