# 🚀 INSTRUCCIONES RÁPIDAS - Despliegue en Azure

## ⚠️ ACCIÓN INMEDIATA REQUERIDA

Debes configurar **manualmente** estas opciones en Azure Portal antes de desplegar:

### 1️⃣ Configurar Stack de Node.js (MUY IMPORTANTE)

1. Ve a [Azure Portal](https://portal.azure.com)
2. Busca tu App Service: **sena-etapa-productiva**
3. En el menú izquierdo: **Configuration** (Configuración)
4. Pestaña: **General settings**
5. En **Stack settings**:
   - **Stack**: Selecciona `Node`
   - **Node version**: Selecciona `20 LTS` o `20-lts`
6. En **Startup Command**: Escribe exactamente:
   ```
   bash startup.sh
   ```
7. Haz clic en **Save** (Guardar) arriba

### 2️⃣ Verificar Variables de Entorno

1. En el mismo menú **Configuration**
2. Pestaña: **Application settings**
3. Verifica que tengas estas variables (si no existen, agrégalas):

```
WEBSITE_NODE_DEFAULT_VERSION = ~20
SCM_DO_BUILD_DURING_DEPLOYMENT = true
NPM_CONFIG_PRODUCTION = false
NODE_ENV = production
PORT = 3000
```

4. Haz clic en **Save** (Guardar)

### 3️⃣ Desplegar la Aplicación

#### Opción A: Desde VS Code (Más fácil)
1. Abre VS Code en este proyecto
2. Instala la extensión: **Azure App Service**
3. Haz clic derecho en la carpeta raíz del proyecto
4. Selecciona: **Deploy to Web App...**
5. Selecciona tu App Service: `sena-etapa-productiva`
6. Confirma el despliegue

#### Opción B: Desde la Terminal
```bash
# 1. Commit los cambios
git add .
git commit -m "Fix: Configuración para Node.js 20 y dotenv"

# 2. Push (si tienes configurado Git deployment)
git push origin main
```

### 4️⃣ Verificar el Despliegue

1. Ve a tu App Service en Azure Portal
2. En el menú izquierdo: **Log stream**
3. Deberías ver:
   ```
   NodeJS Version : v20.x.x
   ✅ Dependencias instaladas exitosamente
   ✅ Certificado SSL ya existe
   Iniciando aplicación Node.js...
   ```

### 5️⃣ Si Algo Sale Mal

#### Error: Sigue usando Node.js 18
1. Ve a **Deployment Center** en tu App Service
2. Haz clic en **Redeploy** o **Sync**
3. Luego reinicia: **Overview** > **Restart**

#### Error: Cannot find module 'dotenv'
1. Ve a **SSH** en tu App Service (menú izquierdo)
2. Ejecuta estos comandos:
   ```bash
   cd /home/site/wwwroot
   npm install --production=false
   ```

#### Ver logs en detalle
```bash
# Desde tu terminal local (necesitas Azure CLI)
az webapp log tail --name sena-etapa-productiva \
  --resource-group [TU-RESOURCE-GROUP]
```

## 📋 Checklist

Marca cuando completes cada paso:

- [ ] Stack de Node.js configurado a 20 LTS
- [ ] Startup Command: `bash startup.sh`
- [ ] Variables de entorno verificadas
- [ ] Código desplegado
- [ ] Logs verificados (NodeJS Version : v20.x.x)
- [ ] Aplicación funciona sin error de dotenv

## 🔗 Enlaces Útiles

- **App Service URL**: https://sena-etapa-productiva-bdekf6f4b7abcyhv.azurewebsites.net
- **Azure Portal**: https://portal.azure.com
- **Documentación completa**: Ver archivo `GUIA_SOLUCION_AZURE.md`

## ❓ Necesitas Ayuda

Si después de seguir estos pasos aún tienes errores:

1. Copia el contenido completo de los logs
2. Verifica que hayas seguido TODOS los pasos
3. Revisa el archivo `GUIA_SOLUCION_AZURE.md` para solución de problemas comunes
