# Guía de Solución: Despliegue en Azure App Service

## Problemas Identificados

1. **Node.js versión incorrecta**: Azure usaba Node.js v18.20.8, pero el proyecto requiere Node.js >=20.0.0
2. **Módulo 'dotenv' no encontrado**: Las dependencias no se instalaban correctamente en producción
3. **Configuración de deployment incorrecta**

## Soluciones Aplicadas

### 1. Archivos Creados/Modificados

#### `.nvmrc` (NUEVO)
```
20
```
Este archivo fuerza el uso de Node.js versión 20.

#### `.deployment` (MODIFICADO)
```ini
[config]
command = bash deploy.sh
SCM_DO_BUILD_DURING_DEPLOYMENT=true
WEBSITE_NODE_DEFAULT_VERSION=~20
NPM_CONFIG_PRODUCTION=false
WEBSITE_RUN_FROM_PACKAGE=0
```

#### `.npmrc` (MODIFICADO)
```ini
production=false
package-lock=true
engine-strict=false
prefer-offline=true
```

#### `deploy.sh` (NUEVO)
Script personalizado de deployment para Azure que asegura la correcta instalación de dependencias.

#### `startup.sh` (MODIFICADO)
Actualizado para verificar e instalar dependencias si no existen.

### 2. Configuración en Azure Portal

**IMPORTANTE**: Debes configurar las siguientes opciones en Azure App Service:

#### A. Configuración General (Settings > Configuration > General settings)
1. **Stack**: Node
2. **Major version**: 20 LTS
3. **Minor version**: 20 LTS
4. **Startup Command**: `bash startup.sh`

#### B. Variables de Aplicación (Settings > Configuration > Application settings)
Asegúrate de tener configuradas estas variables:

```bash
NODE_ENV=production
PORT=3000
WEBSITE_NODE_DEFAULT_VERSION=~20
SCM_DO_BUILD_DURING_DEPLOYMENT=true
NPM_CONFIG_PRODUCTION=false
WEBSITE_RUN_FROM_PACKAGE=0

# Variables de Base de Datos
DB_HOST=mysql-sena-etapa-productiva.mysql.database.azure.com
DB_USER=[tu_usuario]
DB_PASSWORD=[tu_password]
DB_DATABASE=[tu_database]
DB_PORT=3306

# Variables de Azure Blob Storage
USE_AZURE_BLOB=true
AZURE_STORAGE_ACCOUNT_NAME=[tu_account_name]
AZURE_STORAGE_ACCOUNT_KEY=[tu_account_key]
AZURE_STORAGE_CONNECTION_STRING=[tu_connection_string]

# Variables de Watson (si aplica)
WATSON_API_KEY=[tu_api_key]
WATSON_URL=[tu_url]
WATSON_ASSISTANT_ID=[tu_assistant_id]

# Variables de Sesión
SESSION_SECRET=[tu_secret_key]
```

### 3. Pasos para Desplegar

#### Opción 1: Desde VS Code (Recomendado)

1. Asegúrate de tener instalada la extensión **Azure App Service** en VS Code
2. Haz clic derecho en tu carpeta del proyecto
3. Selecciona **Deploy to Web App...**
4. Selecciona tu App Service
5. Confirma el despliegue

#### Opción 2: Desde Git/GitHub

```bash
# 1. Asegúrate de estar en la rama main
git checkout main

# 2. Agrega los cambios
git add .

# 3. Commit
git commit -m "Configuración para Azure App Service con Node.js 20"

# 4. Push
git push origin main
```

Si tienes configurado GitHub Actions o Azure Deployment Center, el despliegue se hará automáticamente.

#### Opción 3: Deployment Manual via Azure CLI

```bash
# Login en Azure
az login

# Configurar la versión de Node.js
az webapp config appsettings set --name sena-etapa-productiva \
  --resource-group [tu-resource-group] \
  --settings WEBSITE_NODE_DEFAULT_VERSION="~20"

# Desplegar desde ZIP
cd /ruta/a/tu/proyecto
zip -r deploy.zip . -x "*.git*" "node_modules/*" "*.log"
az webapp deployment source config-zip \
  --resource-group [tu-resource-group] \
  --name sena-etapa-productiva \
  --src deploy.zip
```

### 4. Verificación Post-Despliegue

1. **Ver logs en tiempo real**:
   ```bash
   az webapp log tail --name sena-etapa-productiva \
     --resource-group [tu-resource-group]
   ```

2. **Verificar que se use Node.js 20**:
   - En los logs deberías ver: `NodeJS Version : v20.x.x`

3. **Verificar que dotenv esté instalado**:
   - Los logs no deberían mostrar el error `Cannot find module 'dotenv'`

4. **Acceder a la aplicación**:
   - Abre: `https://sena-etapa-productiva-bdekf6f4b7abcyhv.azurewebsites.net`

### 5. Solución de Problemas Comunes

#### Si sigue usando Node.js 18:
1. Ve a Azure Portal > Tu App Service > Configuration > General settings
2. Cambia **Stack** a Node 20 LTS
3. Guarda los cambios
4. Ve a **Deployment Center** y haz un nuevo despliegue
5. Reinicia la aplicación

#### Si falta el módulo dotenv:
1. Verifica que `.npmrc` tenga `production=false`
2. Verifica que `.deployment` tenga `NPM_CONFIG_PRODUCTION=false`
3. SSH al contenedor y ejecuta:
   ```bash
   cd /home/site/wwwroot
   npm install
   ```

#### Para acceder vía SSH al contenedor:
1. Azure Portal > Tu App Service > SSH
2. O usa: `az webapp ssh --name sena-etapa-productiva --resource-group [tu-resource-group]`

### 6. Comandos Útiles

```bash
# Ver logs de deployment
az webapp log deployment show --name sena-etapa-productiva \
  --resource-group [tu-resource-group]

# Reiniciar la aplicación
az webapp restart --name sena-etapa-productiva \
  --resource-group [tu-resource-group]

# Ver configuración actual
az webapp config show --name sena-etapa-productiva \
  --resource-group [tu-resource-group]

# Listar variables de entorno
az webapp config appsettings list --name sena-etapa-productiva \
  --resource-group [tu-resource-group]
```

### 7. Checklist de Verificación

- [ ] Archivo `.nvmrc` creado con contenido `20`
- [ ] Archivo `.deployment` actualizado con configuración correcta
- [ ] Archivo `.npmrc` actualizado con `production=false`
- [ ] Archivo `deploy.sh` creado
- [ ] Archivo `startup.sh` actualizado
- [ ] Variables de entorno configuradas en Azure Portal
- [ ] Stack de Node.js configurado a 20 LTS en Azure Portal
- [ ] Startup Command configurado a `bash startup.sh` en Azure Portal
- [ ] Código desplegado
- [ ] Logs verificados sin errores
- [ ] Aplicación accesible desde el navegador

## Resultado Esperado

Después de aplicar estos cambios y desplegar, deberías ver en los logs:

```
NodeJS Version : v20.x.x
✅ Certificado SSL ya existe (o descargado exitosamente)
✅ Dependencias instaladas exitosamente
Iniciando aplicación Node.js...
Servidor escuchando en puerto 3000
```

Y la aplicación debería estar funcionando correctamente sin el error de `Cannot find module 'dotenv'`.
