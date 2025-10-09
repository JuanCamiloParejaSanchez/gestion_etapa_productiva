# Guía para Crear Usuarios de Prueba con Postman

## 📋 R## 📝 **Orden de Ejecución Recomendado**

### Para Colección Completa:

1. **👤 Administradores**
   - Ejecuta "Crear Admin Temporal 1" y "Crear Admin Temporal 2"
   - Ejecuta los registros de administradores completos

2. **🎓 Aprendices (FLUJO COMPLETO)**
   - **Paso 1:** Ejecuta "Registrar Aprendiz 1, 2, 3..." (esto crea el usuario sin contraseña)
   - **Paso 2:** Ejecuta "Crear Contraseña Aprendiz 1, 2, 3..." (esto establece la contraseña)
   - **Paso 3:** Ejecuta "Login Aprendiz" (ahora puedes autenticarte)

3. **🔒 Autenticación**
   - Prueba el login con las credenciales creadas
   - Usa "Cerrar Sesión" cuando termines

4. **🧪 Testing**
   - Accede a dashboards y panels con usuarios autenticadosyecto incluye scripts automatizados para generar colecciones de Postman con usuarios de prueba para el Sistema de Gestión de Etapa Productiva del SENA.

## 🚀 Comandos Disponibles

### 1. Generar Solo Aprendices
```bash
node scripts/generar_datos_prueba.js [cantidad] postman
```

**Ejemplo:**
```bash
node scripts/generar_datos_prueba.js 20 postman
```
- Genera una colección con 20 aprendices
- Endpoint: `POST /registrar-aprendiz`

### 2. Generar Colección Completa (Recomendado)
```bash
node scripts/generar_coleccion_postman_completa.js [aprendices] [administradores]
```

**Ejemplo:**
```bash
node scripts/generar_coleccion_postman_completa.js 10 5
```
- Genera 10 aprendices
- Genera 5 administradores
- Incluye endpoints de autenticación y testing

## 📁 Archivos Generados

Los scripts generan archivos JSON en la carpeta `scripts/` con nombres como:
- `coleccion_completa_10aprendices_5admins_2025-08-14T01-24-57-767Z.json`
- `postman_collection_2025-08-14T01-23-31-697Z.json`

## 🔧 Configuración en Postman

### Paso 1: Importar la Colección
1. Abre Postman
2. Click en "Import"
3. Selecciona el archivo JSON generado
4. La colección aparecerá en tu sidebar

### Paso 2: Configurar Variables de Entorno
1. En Postman, ve a "Environments"
2. Crea un nuevo environment llamado "SENA Development"
3. Añade la variable:
   - **Variable:** `base_url`
   - **Initial Value:** `http://localhost:3000`
   - **Current Value:** `http://localhost:3000`

### Paso 3: Activar el Environment
1. Selecciona "SENA Development" en el dropdown de environments
2. Verifica que la variable `{{base_url}}` se resuelva correctamente

## 📝 Orden de Ejecución Recomendado

### Para Colección Completa:

1. **👤 Administradores**
   - Ejecuta "Crear Admin Temporal 1" y "Crear Admin Temporal 2"
   - Ejecuta los registros de administradores completos

2. **🎓 Aprendices**
   - Ejecuta todos los registros de aprendices
   - Los aprendices deberán crear contraseñas después del registro

3. **🔒 Autenticación**
   - Prueba el login con las credenciales creadas
   - Usa "Cerrar Sesión" cuando termines

4. **🧪 Testing**
   - Accede a dashboards y panels con usuarios autenticados

## 🔑 Credenciales de Prueba

### Administradores Temporales
- **Usuario:** admin1@sena.edu.co / **Contraseña:** AdminSena2025*
- **Usuario:** admin2@sena.edu.co / **Contraseña:** AdminSena2025*

### Administradores Completos
Los administradores generados tienen la contraseña: `AdminSena2025*`

### Aprendices
**IMPORTANTE:** Los aprendices tienen un flujo especial de 3 pasos:

1. **Registro:** `POST /registrar-aprendiz` (crea usuario sin contraseña)
2. **Crear Contraseña:** `POST /crear-password` (establece contraseña segura)
3. **Login:** `POST /auth/login` (autentica con email y contraseña)

**Credenciales después del flujo completo:**
- **Email:** generado automáticamente (ej: `juan.perez@sena.edu.co`)
- **Contraseña:** `AprendizSena2025*`

## 🌐 Endpoints Principales

### Autenticación
- `POST /auth/login` - Login general
- `GET /auth/logout` - Cerrar sesión
- `POST /auth/admin/register-temp` - Crear admin temporal

### Registro
- `POST /registrar-aprendiz` - Registrar aprendiz (sin contraseña)
- `POST /crear-password` - Crear contraseña para aprendiz registrado
- `POST /registrar-administrador` - Registrar administrador completo

### Dashboards
- `GET /administrador/panel-principal` - Panel de administrador
- `GET /aprendiz/dashboard` - Dashboard de aprendiz
- `GET /administrador/listar-aprendices` - Lista de aprendices

## ⚡ Tips de Uso

### Runner de Postman (Ejecución Masiva)
1. Selecciona la colección o carpeta
2. Click en "Run collection"
3. Configura el delay entre requests (500ms recomendado)
4. Ejecuta para insertar todos los usuarios de una vez

### Variables Dinámicas
Las colecciones incluyen variables como:
- `{{base_url}}` - URL base del servidor
- Datos generados automáticamente para cada usuario

### Manejo de Errores
Si un request falla:
- Verifica que el servidor esté corriendo en `http://localhost:3000`
- Revisa que la base de datos esté conectada
- Confirma que no hay usuarios duplicados

## 🔍 Verificación de Datos

Después de ejecutar la colección, verifica en la aplicación:

1. **Administradores:** Inicia sesión y ve al panel principal
2. **Aprendices:** Revisa la lista en el panel de administrador
3. **Base de Datos:** Consulta directamente las tablas `administradores` y `aprendices`

## 🛠 Troubleshooting

### Error: "Puerto 3000 ocupado"
```bash
# Cambiar puerto del servidor o matar el proceso
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F
```

### Error: "Variable base_url no definida"
- Asegúrate de haber creado y seleccionado el environment correcto
- Verifica que la variable `base_url` esté definida

### Error: "Credenciales incorrectas"
- Los administradores temporales tienen contraseña predefinida
- Los aprendices deben crear contraseña después del registro
- Verifica que el usuario se haya creado correctamente

## 📊 Información Adicional

### Datos Generados
- **Aprendices:** Datos realistas con información colombiana
- **Administradores:** Cargos y departamentos del SENA
- **Emails:** Formato institucional @sena.edu.co
- **Contraseñas:** Cumplen políticas de seguridad

### Formatos Disponibles
Además de Postman, los scripts pueden generar:
- JSON puro para otras herramientas
- SQL para inserción directa en base de datos

¡Listo! Con estos comandos y configuraciones tendrás usuarios de prueba para desarrollar y probar tu aplicación del SENA. 🎯
