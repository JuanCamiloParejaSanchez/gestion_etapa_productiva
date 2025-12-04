# 🚀 Guía de Solución: Error "Cannot find module 'dotenv'" en Azure App Service

## 📌 Diagnóstico Completo

### Error Principal Identificado
El error original "Cannot find module 'dotenv'" fue resuelto, pero la aplicación seguía fallando con **exit code: 1** al iniciar.

### Causa Raíz ✅
Tras análisis minucioso de los logs de Azure, se identificó que múltiples dependencias requieren **Node.js >= 20.0.0**, pero la aplicación estaba configurada con **Node.js 18.20.8**:

**Paquetes problemáticos:**
- `@azure/identity@4.13.0` - requiere Node >= 20.0.0
- `@azure/storage-blob@12.29.1` - requiere Node >= 20.0.0
- `@azure/core-auth@1.10.1` - requiere Node >= 20.0.0
- `ibm-watson@12.1.1` - requiere Node >= 20.0.0
- `joi@18.0.2` - requiere Node >= 20
- `marked@16.4.2` - requiere Node >= 20

```
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: '@azure/identity@4.13.0',
npm warn EBADENGINE   required: { node: '>=20.0.0' },
npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
```

## ✅ Cambios Realizados

### 1. Archivos Creados/Modificados
- ✅ `.npmrc` - Configuración para que NPM instale todas las dependencias
- ✅ `.deployment` - Actualizado con configuraciones adicionales
- ✅ `.azure/config` - Configuración de Azure CLI
- ✅ `package.json` - Agregado script `build`
- ✅ `.env.production.example` - Plantilla de variables de entorno

### 2. Variables de Entorno Configuradas en Azure
- ✅ `NPM_CONFIG_PRODUCTION=false`
- ✅ `WEBSITE_NODE_DEFAULT_VERSION=18.20.8`
- ✅ `SCM_DO_BUILD_DURING_DEPLOYMENT=true`

### 3. Git Push Completado
- ✅ Commit y push de cambios realizados

## 🔧 Pasos para Verificar y Completar la Configuración

### Opción 1: Verificar en Azure Portal (Recomendado)

1. **Ve a Azure Portal**: https://portal.azure.com
2. **Navega a tu App Service**: `sena-etapa-productiva`
3. **Ve a "Deployment Center"** (Centro de implementación)
4. **Verifica que está conectado a GitHub**
5. **Haz clic en "Sync"** para forzar un nuevo deployment

### Opción 2: Ver Logs en Tiempo Real

```bash
# Opción A: En Azure Portal
# 1. Ve a tu App Service
# 2. Selecciona "Log stream" en el menú lateral
# 3. Observa los logs en tiempo real

# Opción B: Desde Azure CLI
az webapp log tail --name sena-etapa-productiva --resource-group rg-sena-etapa-productiva
```

### Opción 3: Forzar Redeploy desde Local

```bash
# Si el sync automático no funciona, puedes forzar un redeploy:
az webapp deployment source sync --name sena-etapa-productiva --resource-group rg-sena-etapa-productiva

# O reiniciar la app:
az webapp restart --name sena-etapa-productiva --resource-group rg-sena-etapa-productiva
```

## 🔍 Qué Buscar en los Logs

### ✅ Logs Exitosos (deberías ver):
```
npm install
npm info using npm@10.9.2
npm info using node@v18.20.8
added XXX packages
✅ Build successful
Starting application...
Servidor escuchando en puerto 8080
```

### ❌ Si aún ves errores:
```
Error: Cannot find module 'XXX'
```

## 🆘 Si el Problema Persiste

### Verificar Variables de Entorno Críticas

Ve a **Azure Portal** → **App Service** → **Configuration** → **Application settings** y verifica:

#### Variables de Base de Datos:
```
DB_HOST=mysql-sena-etapa-productiva.mysql.database.azure.com
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=gestion_etapa_productiva
DB_PORT=3306
DB_SSL=true
DB_SSL_CA_PATH=/home/site/wwwroot/DigiCertGlobalRootG2.crt.pem
```

#### Variables de Azure Blob Storage:
```
USE_AZURE_BLOB=true
AZURE_STORAGE_ACCOUNT_NAME=tu_cuenta_storage
AZURE_STORAGE_ACCOUNT_KEY=tu_key
AZURE_STORAGE_CONTAINER_NAME=documentos
```

#### Variables de Aplicación:
```
NODE_ENV=production
PORT=8080
SESSION_SECRET=tu_secret_muy_largo_y_seguro
```

#### Variables de Build (YA CONFIGURADAS):
```
NPM_CONFIG_PRODUCTION=false
WEBSITE_NODE_DEFAULT_VERSION=18.20.8
SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

### Limpiar Cache y Forzar Rebuild Completo

```bash
# 1. Detener la aplicación
az webapp stop --name sena-etapa-productiva --resource-group rg-sena-etapa-productiva

# 2. Limpiar deployment (esto puede tardar)
az webapp deployment source delete --name sena-etapa-productiva --resource-group rg-sena-etapa-productiva

# 3. Volver a configurar el source
# Ve a Azure Portal → Deployment Center → Reconecta GitHub

# 4. Iniciar la aplicación
az webapp start --name sena-etapa-productiva --resource-group rg-sena-etapa-productiva
```

## 📝 Comandos Útiles

### Ver información de la aplicación:
```bash
az webapp show --name sena-etapa-productiva --resource-group rg-sena-etapa-productiva --output table
```

### Ver configuración actual:
```bash
az webapp config appsettings list --name sena-etapa-productiva --resource-group rg-sena-etapa-productiva --output table
```

### Reiniciar la aplicación:
```bash
az webapp restart --name sena-etapa-productiva --resource-group rg-sena-etapa-productiva
```

### Ver deployments recientes:
```bash
az webapp deployment list --name sena-etapa-productiva --resource-group rg-sena-etapa-productiva --output table
```

## 🎯 Próximos Pasos Después de Resolver

1. **Verificar que la aplicación inicie correctamente**
2. **Probar la conexión a la base de datos MySQL**
3. **Verificar que Azure Blob Storage funcione**
4. **Probar las funcionalidades principales**
5. **Configurar monitoreo con Application Insights** (si aún no lo has hecho)

## 🔗 URLs Importantes

- **App Service**: https://portal.azure.com/#resource/subscriptions/YOUR_SUB/resourceGroups/rg-sena-etapa-productiva/providers/Microsoft.Web/sites/sena-etapa-productiva
- **URL de la aplicación**: https://sena-etapa-productiva-bdekf6f4b7abcyhv.brazilsouth-01.azurewebsites.net
- **Kudu (Consola avanzada)**: https://sena-etapa-productiva-bdekf6f4b7abcyhv.scm.brazilsouth-01.azurewebsites.net

## 💡 Notas Importantes

1. **El archivo `.npmrc`** asegura que todas las dependencias se instalen (no solo las de producción)
2. **El script `build`** en `package.json` es necesario para que Azure detecte que necesita hacer build
3. **Las variables de entorno** son críticas - verifica que todas estén configuradas
4. **El certificado SSL** se descarga automáticamente en el `startup.sh`

---

**Última actualización**: 4 de diciembre de 2025
**Estado**: Configuración completada, esperando deployment automático
