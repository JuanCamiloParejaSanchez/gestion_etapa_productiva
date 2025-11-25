# Configuración de Cloudinary para Almacenamiento Gratuito

Esta guía explica cómo configurar **Cloudinary** para el almacenamiento persistente de archivos en producción, solucionando el problema de pérdida de archivos en Render.

## ¿Por qué Cloudinary?

✅ **100% GRATUITO** para empezar (25GB almacenamiento, 25GB transferencia mensual)
✅ **Fácil configuración** - solo necesitas registrarte
✅ **URLs directas** - no necesitas URLs firmadas como S3
✅ **Optimización automática** de imágenes
✅ **API simple** y bien documentada

## Configuración de Cloudinary

### 1. Crear Cuenta en Cloudinary

1. Ve a [https://cloudinary.com](https://cloudinary.com)
2. Regístrate con tu email (plan gratuito)
3. Verifica tu cuenta

### 2. Obtener Credenciales

1. En el dashboard, ve a **"Account"** → **"Settings"**
2. En la pestaña **"Account"**, copia:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 3. Configurar Variables de Entorno

En **Render** (o tu plataforma de hosting):

```bash
USE_CLOUDINARY=true
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

**Importante:** Asegúrate de que `USE_S3=false` para evitar conflictos.

## Plan Gratuito de Cloudinary

| Característica | Límite Gratuito |
|----------------|-----------------|
| Almacenamiento | 25GB |
| Transferencia mensual | 25GB |
| Imágenes transformadas/mes | 25,000 |
| Videos transformados/mes | 500 minutos |

Para una aplicación educativa como la tuya, el plan gratuito es **más que suficiente**.

## Funcionamiento

### En Desarrollo (USE_CLOUDINARY=false)
- Archivos se guardan localmente en `public/uploads/documentos/`

### En Producción (USE_CLOUDINARY=true)
- Archivos se suben automáticamente a Cloudinary
- URLs directas para descarga (sin expiración)
- Archivos accesibles públicamente

## Instalación y Configuración

Las dependencias ya están incluidas:
```bash
npm install cloudinary multer-storage-cloudinary
```

## Prueba Rápida

1. **Configura las variables de entorno** en Render
2. **Despliega tu aplicación**
3. **Sube un archivo** - se guardará automáticamente en Cloudinary
4. **Descarga el archivo** - funcionará con URL directa

## Solución de Problemas

### Error: "Invalid cloud_name"
- Verifica que `CLOUDINARY_CLOUD_NAME` sea correcto
- Asegúrate de que no tenga espacios

### Error: "Invalid API key"
- Verifica `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`
- Confirma que las credenciales sean de la cuenta correcta

### Error 404: "No se encuentra esta página res.cloudinary.com"
- **Causa**: La aplicación está intentando descargar archivos locales como si fueran de Cloudinary
- **Solución**: El código ya está corregido para detectar correctamente archivos locales vs Cloudinary
- **Verificación**:
  - Archivos locales: comienzan con `public/uploads/` → se descargan del servidor
  - Archivos de Cloudinary: comienzan con `documentos/` → se descargan de Cloudinary

### Archivos no se suben
- Verifica que `USE_CLOUDINARY=true`
- Revisa logs de la aplicación
- Confirma que las variables de entorno estén configuradas en Render

### Archivos existentes no funcionan
- Los archivos subidos antes de activar Cloudinary permanecen como archivos locales
- Para migrar archivos existentes a Cloudinary, necesitarías un script de migración personalizado

## Archivos Modificados

- `src/configuracion/cloudinaryConfig.js` - Nueva configuración
- `src/compartido/middlewares/multerConfig.js` - Soporte para Cloudinary
- `src/modulos/aprendiz/controladores/controladorDashboardAprendiz.js` - Lógica actualizada
- `.env.example` - Variables de entorno de ejemplo