# ✅ PRÓXIMOS PASOS - Despliegue en Azure

## 🎯 Estado Actual
✅ Todos los archivos de configuración han sido creados y actualizados correctamente.  
✅ El proyecto está listo para ser desplegado en Azure App Service.  
⚠️ **Acción requerida**: Debes configurar manualmente Azure Portal y desplegar.

---

## 📋 Paso 1: Configurar Azure Portal (OBLIGATORIO)

### 1.1 Acceder a tu App Service
1. Ve a [Azure Portal](https://portal.azure.com)
2. Busca: **sena-etapa-productiva**
3. Haz clic en tu App Service

### 1.2 Configurar Node.js 20
1. En el menú izquierdo: **Settings** > **Configuration**
2. Pestaña: **General settings**
3. Configura:
   ```
   Stack: Node
   Major version: 20 LTS
   Minor version: 20 LTS (o la última disponible)
   ```
4. En **Startup Command**, escribe exactamente:
   ```bash
   bash startup.sh
   ```
5. **Guarda** los cambios (botón "Save" arriba)

### 1.3 Verificar Variables de Entorno
1. En el mismo menú **Configuration**
2. Pestaña: **Application settings**
3. Verifica que existan estas variables (si no, agrégalas):

```bash
WEBSITE_NODE_DEFAULT_VERSION = ~20
SCM_DO_BUILD_DURING_DEPLOYMENT = true
NPM_CONFIG_PRODUCTION = false
NODE_ENV = production
PORT = 3000
```

4. **Guarda** los cambios

---

## 📋 Paso 2: Desplegar la Aplicación

Elige **UNA** de las siguientes opciones:

### Opción A: Usando PowerShell Script (Recomendado para Windows) ⭐
```powershell
# Abre PowerShell en la carpeta del proyecto
.\scripts\deploy-azure.ps1
```
El script te guiará paso a paso.

### Opción B: Usando VS Code (Más fácil) 🎨
1. Abre este proyecto en VS Code
2. Instala la extensión: **Azure App Service**
3. Haz clic derecho en la carpeta raíz del proyecto
4. Selecciona: **Deploy to Web App...**
5. Selecciona: **sena-etapa-productiva**
6. Confirma el despliegue
7. Espera a que termine (verás progreso en la parte inferior)

### Opción C: Usando Git (Si tienes configurado deployment) 📦
```bash
# Agregar todos los cambios
git add .

# Commit
git commit -m "Fix: Configuración Azure con Node.js 20 y corrección dotenv"

# Push
git push origin main
```

### Opción D: Usando Azure CLI (Para usuarios avanzados) 🔧
```bash
# Si usas bash (Git Bash en Windows)
./scripts/azure-commands.sh

# O manualmente:
# 1. Crear ZIP
zip -r deploy.zip . -x "*.git*" "node_modules/*" "*.log"

# 2. Desplegar
az webapp deployment source config-zip \
  --resource-group TU-RESOURCE-GROUP \
  --name sena-etapa-productiva \
  --src deploy.zip
```

---

## 📋 Paso 3: Verificar el Despliegue

### 3.1 Ver Logs en Tiempo Real
En Azure Portal:
1. Ve a tu App Service
2. En el menú izquierdo: **Monitoring** > **Log stream**
3. Espera a que aparezcan los logs

Deberías ver algo como:
```
NodeJS Version : v20.x.x
✅ Dependencias instaladas exitosamente
✅ Certificado SSL ya existe
Iniciando aplicación Node.js...
```

### 3.2 Verificar Errores
❌ Si ves: `Error: Cannot find module 'dotenv'`
- Ve al **Paso 4** de solución de problemas

❌ Si ves: `NodeJS Version : v18.x.x`
- Vuelve al **Paso 1.2** y asegúrate de configurar Node.js 20
- Luego reinicia la aplicación

✅ Si todo está bien, continúa al siguiente paso

### 3.3 Acceder a la Aplicación
1. Abre tu navegador
2. Ve a: https://sena-etapa-productiva-bdekf6f4b7abcyhv.azurewebsites.net
3. Verifica que la aplicación cargue correctamente

---

## 📋 Paso 4: Solución de Problemas

### Problema: Sigue mostrando Node.js 18
**Solución**:
1. Azure Portal > App Service > **Deployment Center**
2. Haz clic en **Sync** o **Redeploy**
3. Ve a **Overview** > **Restart**
4. Espera 2-3 minutos
5. Verifica logs nuevamente

### Problema: Cannot find module 'dotenv'
**Solución A - Desde Azure Portal**:
1. Azure Portal > App Service > **SSH** (menú izquierdo)
2. Ejecuta estos comandos:
```bash
cd /home/site/wwwroot
npm install --production=false
```
3. Reinicia la aplicación

**Solución B - Verificar archivos**:
1. Asegúrate que `.npmrc` contenga `production=false`
2. Vuelve a desplegar
3. Reinicia la aplicación

### Problema: La aplicación no inicia
**Solución**:
1. Revisa **Log stream** para ver el error exacto
2. Verifica que **Startup Command** sea: `bash startup.sh`
3. Verifica que el archivo `startup.sh` exista en el proyecto
4. Reinicia la aplicación

---

## 📋 Paso 5: Configuración Adicional (Opcional pero Recomendado)

### 5.1 Configurar Always On (Evita que la app se duerma)
1. Azure Portal > App Service > **Configuration** > **General settings**
2. **Always On**: `On`
3. **Guarda**

### 5.2 Configurar HTTPS Only
1. Azure Portal > App Service > **Settings** > **TLS/SSL settings**
2. **HTTPS Only**: `On`
3. **Guarda**

### 5.3 Configurar Logs de Diagnóstico
1. Azure Portal > App Service > **Monitoring** > **App Service logs**
2. **Application Logging**: `File System`
3. **Level**: `Information`
4. **Guarda**

---

## 🔍 Comandos Útiles para Monitoreo

### Ver logs en terminal (requiere Azure CLI)
```bash
# Ver logs en tiempo real
az webapp log tail --name sena-etapa-productiva --resource-group TU-RESOURCE-GROUP

# Ver configuración
az webapp config show --name sena-etapa-productiva --resource-group TU-RESOURCE-GROUP

# Ver variables de entorno
az webapp config appsettings list --name sena-etapa-productiva --resource-group TU-RESOURCE-GROUP

# Reiniciar app
az webapp restart --name sena-etapa-productiva --resource-group TU-RESOURCE-GROUP
```

### Script auxiliar (Linux/Mac/Git Bash)
```bash
chmod +x scripts/azure-commands.sh
./scripts/azure-commands.sh
```

---

## 📚 Documentación de Referencia

Si necesitas más información:
1. **INSTRUCCIONES_AZURE.md** - Guía rápida
2. **docs/GUIA_SOLUCION_AZURE.md** - Guía completa técnica
3. **RESUMEN_CAMBIOS.md** - Detalles de todos los cambios

---

## ✅ Checklist Final

Marca cada paso cuando lo completes:

### Configuración Azure Portal
- [ ] Stack configurado a Node 20 LTS
- [ ] Startup Command: `bash startup.sh`
- [ ] Variables de entorno verificadas
- [ ] Always On activado (opcional)
- [ ] HTTPS Only activado (opcional)

### Despliegue
- [ ] Código desplegado exitosamente
- [ ] Logs verificados
- [ ] Node.js versión 20.x.x confirmada
- [ ] No hay error de dotenv
- [ ] Aplicación accesible desde navegador

### Post-Despliegue
- [ ] Base de datos conecta correctamente
- [ ] Azure Blob Storage funciona
- [ ] Autenticación funciona
- [ ] Todas las funcionalidades probadas

---

## 🆘 ¿Necesitas Ayuda?

Si después de seguir todos estos pasos aún tienes problemas:

1. **Copia los logs completos**:
   - Azure Portal > Log stream
   - Copia todo el contenido

2. **Verifica el checklist**:
   - ¿Configuraste Node.js 20 en Azure Portal?
   - ¿El Startup Command es correcto?
   - ¿Las variables de entorno están configuradas?

3. **Revisa la documentación**:
   - `GUIA_SOLUCION_AZURE.md` tiene soluciones detalladas
   - Busca tu error específico en la sección de solución de problemas

4. **Comandos de diagnóstico**:
```bash
# Ver estado de la app
az webapp show --name sena-etapa-productiva --resource-group TU-RESOURCE-GROUP

# Ver últimos deployments
az webapp deployment list --name sena-etapa-productiva --resource-group TU-RESOURCE-GROUP
```

---

## 🎉 Resultado Esperado

Cuando todo esté configurado correctamente, deberías ver en los logs:

```
   _____                               
  /  _  \ __________ _________   ____  
 /  /_\  \\___   /  |  \_  __ \_/ __ \ 
/    |    \/    /|  |  /|  | \/\  ___/ 
\____|__  /_____ \____/ |__|    \___  >
        \/      \/                  \/ 
A P P   S E R V I C E   O N   L I N U X

NodeJS Version : v20.x.x
✅ Certificado SSL ya existe
✅ Dependencias instaladas exitosamente
Variables de entorno configuradas:
- NODE_ENV: production
- PORT: 3000
- DB_HOST: mysql-sena-etapa-productiva.mysql.database.azure.com
- USE_AZURE_BLOB: true
Iniciando aplicación Node.js...
Servidor escuchando en puerto 3000
```

Y tu aplicación estará disponible en:
**https://sena-etapa-productiva-bdekf6f4b7abcyhv.azurewebsites.net**

---

¡Buena suerte con el despliegue! 🚀
