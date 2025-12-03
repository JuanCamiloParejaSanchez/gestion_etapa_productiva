# ✅ Configuración de Variables de Entorno en Azure App Service - COMPLETADA

## 📋 Resumen de Configuración

Se han configurado exitosamente **29 variables de entorno** en tu Azure App Service:
- **Aplicación**: `sena-etapa-productiva`
- **Grupo de Recursos**: `rg-sena-etapa-productiva`
- **Región**: Brazil South

---

## 🔐 Variables Configuradas

### Configuración General del Servidor
- ✅ PORT=3000
- ✅ NODE_ENV=production
- ✅ SESSION_SECRET (configurado)
- ✅ SESSION_NAME=sena_session
- ✅ COOKIE_MAX_AGE=86400000

### Configuración de Base de Datos MySQL Azure
- ✅ DB_HOST=mysql-sena-etapa-productiva.mysql.database.azure.com
- ✅ DB_USER=senaadmin
- ✅ DB_PASSWORD (configurado - sensible)
- ✅ DB_NAME=mysql-sena-etapa-productiva
- ✅ DB_PORT=3306
- ✅ DB_SSL=true
- ✅ DB_SSL_CA_PATH=./DigiCertGlobalRootCA.crt.pem
- ✅ DB_CONNECTION_LIMIT=10
- ✅ DB_RETRY_ATTEMPTS=3
- ✅ DB_RETRY_DELAY=2000

### Configuración de Azure Blob Storage
- ✅ USE_AZURE_BLOB=true
- ✅ AZURE_STORAGE_ACCOUNT_NAME=gestionsena
- ✅ AZURE_STORAGE_ACCOUNT_KEY (configurado - sensible)
- ✅ AZURE_STORAGE_CONTAINER_NAME=documentos

### Configuración de Correo SMTP
- ✅ SMTP_HOST=smtp.gmail.com
- ✅ SMTP_PORT=587
- ✅ SMTP_SECURE=false
- ✅ SMTP_USER=jcparejas80@gmail.com
- ✅ SMTP_PASS (configurado - sensible)

### Configuración de IBM Watson NLU
- ✅ WATSON_API_KEY (configurado - sensible)
- ✅ WATSON_SERVICE_URL (configurado)
- ✅ WATSON_VERSION=2022-04-07
- ✅ USE_WATSON_SENTIMENT_ANALYSIS=true

### Otras Variables
- ✅ BASE_URL=https://sena-etapa-productiva-bdekf6f4b7abcyhv.brazilsouth-01.azurewebsites.net

---

## ⚠️ ACCIONES IMPORTANTES PENDIENTES

### 1. Certificado SSL de MySQL

El archivo `DigiCertGlobalRootCA.crt.pem` debe estar incluido en tu despliegue. Asegúrate de:

**a) Verificar que el archivo esté en el repositorio:**
```bash
git status DigiCertGlobalRootCA.crt.pem
git add DigiCertGlobalRootCA.crt.pem
git commit -m "Agregar certificado SSL de MySQL Azure"
git push
```

**b) Verificar que NO esté en .gitignore:**
```bash
# Revisa tu .gitignore y asegúrate de que NO incluya:
*.pem
*.crt
DigiCertGlobalRootCA.crt.pem
```

**c) Alternativa - Descargar desde Azure App Service:**
Puedes configurar un script de inicio que descargue el certificado automáticamente:

Crea un archivo `startup.sh`:
```bash
#!/bin/bash
echo "Descargando certificado SSL de MySQL..."
curl https://dl.cacerts.digicert.com/DigiCertGlobalRootCA.crt.pem -o DigiCertGlobalRootCA.crt.pem
echo "Certificado descargado exitosamente"
```

Y configura el comando de inicio en Azure:
```bash
az webapp config set \
  --resource-group rg-sena-etapa-productiva \
  --name sena-etapa-productiva \
  --startup-file "startup.sh && npm start"
```

### 2. Configurar Reglas de Firewall de MySQL

Asegúrate de que tu base de datos MySQL Azure permita conexiones desde tu App Service:

```bash
# Obtener las IPs de salida de tu App Service
az webapp show \
  --resource-group rg-sena-etapa-productiva \
  --name sena-etapa-productiva \
  --query outboundIpAddresses \
  --output tsv

# Agregar reglas de firewall en MySQL (ejecuta para cada IP)
az mysql flexible-server firewall-rule create \
  --resource-group rg-sena-etapa-productiva \
  --name mysql-sena-etapa-productiva \
  --rule-name AllowAppService \
  --start-ip-address <IP_DE_SALIDA> \
  --end-ip-address <IP_DE_SALIDA>
```

**O MEJOR AÚN**, habilitar conexiones desde servicios de Azure:
```bash
az mysql flexible-server firewall-rule create \
  --resource-group rg-sena-etapa-productiva \
  --name mysql-sena-etapa-productiva \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### 3. Reiniciar la Aplicación

Para que los cambios surtan efecto:
```bash
az webapp restart \
  --resource-group rg-sena-etapa-productiva \
  --name sena-etapa-productiva
```

---

## 🔍 Comandos Útiles para Verificación

### Ver todas las variables de entorno:
```bash
az webapp config appsettings list \
  --resource-group rg-sena-etapa-productiva \
  --name sena-etapa-productiva \
  --output table
```

### Ver logs en tiempo real:
```bash
az webapp log tail \
  --resource-group rg-sena-etapa-productiva \
  --name sena-etapa-productiva
```

### Ver estado de la aplicación:
```bash
az webapp show \
  --resource-group rg-sena-etapa-productiva \
  --name sena-etapa-productiva \
  --query state
```

### SSH a la instancia (para debugging):
```bash
az webapp ssh \
  --resource-group rg-sena-etapa-productiva \
  --name sena-etapa-productiva
```

---

## 🔒 Recomendaciones de Seguridad

### 1. Rotar credenciales sensibles periódicamente:
- SESSION_SECRET
- DB_PASSWORD
- AZURE_STORAGE_ACCOUNT_KEY
- SMTP_PASS
- WATSON_API_KEY

### 2. Considerar usar Azure Key Vault:

En lugar de almacenar secretos directamente, puedes usar Azure Key Vault:

```bash
# Crear Key Vault
az keyvault create \
  --name sena-keyvault \
  --resource-group rg-sena-etapa-productiva \
  --location brazilsouth

# Agregar secretos
az keyvault secret set \
  --vault-name sena-keyvault \
  --name DB-PASSWORD \
  --value "SenaEtapa2024!@"

# Referenciar en App Settings
az webapp config appsettings set \
  --resource-group rg-sena-etapa-productiva \
  --name sena-etapa-productiva \
  --settings DB_PASSWORD="@Microsoft.KeyVault(SecretUri=https://sena-keyvault.vault.azure.net/secrets/DB-PASSWORD/)"
```

### 3. Habilitar Application Insights para monitoreo:
Tu aplicación ya tiene Application Insights configurado. Revisa los logs y métricas en:
https://portal.azure.com → Application Insights → sena-etapa-productiva

---

## 📊 Monitoreo de Costos

Servicios activos:
- ✅ App Service (Basic B1)
- ✅ MySQL Flexible Server
- ✅ Azure Blob Storage
- ✅ Application Insights

Revisa el costo mensual estimado en:
https://portal.azure.com → Cost Management + Billing

---

## 🚀 Despliegue Continuo

Si usas GitHub Actions o Azure DevOps, las variables de entorno ya están en Azure y no necesitas configurarlas en cada despliegue. Solo asegúrate de:

1. ✅ Incluir `DigiCertGlobalRootCA.crt.pem` en el repositorio
2. ✅ Configurar el comando de inicio si es necesario
3. ✅ Las variables de entorno persisten entre despliegues

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisa los logs**:
   ```bash
   az webapp log tail --resource-group rg-sena-etapa-productiva --name sena-etapa-productiva
   ```

2. **Verifica la conectividad a MySQL**:
   ```bash
   az webapp ssh --resource-group rg-sena-etapa-productiva --name sena-etapa-productiva
   # Dentro del SSH:
   nc -zv mysql-sena-etapa-productiva.mysql.database.azure.com 3306
   ```

3. **Verifica Azure Blob Storage**:
   ```bash
   az storage container list --account-name gestionsena --output table
   ```

---

## ✅ Checklist Final

- [x] Variables de entorno configuradas en Azure App Service
- [ ] Certificado SSL de MySQL incluido en el despliegue
- [ ] Reglas de firewall de MySQL configuradas
- [ ] Aplicación reiniciada
- [ ] Logs verificados sin errores
- [ ] Prueba de conexión a base de datos exitosa
- [ ] Prueba de carga de archivos a Blob Storage exitosa

---

**Fecha de configuración**: 2 de diciembre de 2025
**Configurado por**: GitHub Copilot
