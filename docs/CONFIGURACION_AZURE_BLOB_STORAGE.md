# Configuración de Azure Blob Storage

Este documento explica cómo configurar Azure Blob Storage para el almacenamiento de archivos en la aplicación.

## 📋 Requisitos Previos

- Cuenta de Azure activa
- Azure Storage Account creado
- Credenciales de acceso (Connection String o Account Name + Account Key)

## 🚀 Paso 1: Crear Azure Storage Account

1. Inicia sesión en [Azure Portal](https://portal.azure.com)
2. Busca "Storage accounts" y haz clic en "Create"
3. Completa los siguientes campos:
   - **Subscription**: Selecciona tu suscripción
   - **Resource group**: Crea uno nuevo o usa uno existente
   - **Storage account name**: Nombre único (ej: `senastorage123`)
   - **Region**: Selecciona la más cercana a tus usuarios
   - **Performance**: Standard (para desarrollo) o Premium (producción)
   - **Redundancy**: LRS (más económico) o GRS (mayor disponibilidad)
4. Haz clic en "Review + create" y luego en "Create"

## 🔑 Paso 2: Obtener Credenciales

### Opción 1: Connection String (Recomendado para desarrollo)

1. Ve a tu Storage Account en Azure Portal
2. En el menú lateral, haz clic en "Access keys"
3. Copia el valor de "Connection string" de key1 o key2

### Opción 2: Account Name + Account Key

1. Ve a tu Storage Account en Azure Portal
2. En el menú lateral, haz clic en "Access keys"
3. Copia:
   - **Storage account name**: Nombre de tu cuenta
   - **Key**: Valor de key1 o key2

## 📦 Paso 3: Crear Contenedor (Container)

1. En tu Storage Account, ve a "Containers" en el menú lateral
2. Haz clic en "+ Container"
3. Configura:
   - **Name**: `documentos` (o el nombre que prefieras)
   - **Public access level**: "Blob (anonymous read access for blobs only)" si quieres que los archivos sean públicos, o "Private" si no
4. Haz clic en "Create"

## ⚙️ Paso 4: Configurar Variables de Entorno

Edita tu archivo `.env` y agrega las siguientes variables:

### Si usas Connection String:

```env
# Habilitar Azure Blob Storage
USE_AZURE_BLOB=true

# Connection String (incluye toda la cadena entre comillas)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=tu_cuenta;AccountKey=tu_clave;EndpointSuffix=core.windows.net

# Nombre del contenedor
AZURE_STORAGE_CONTAINER_NAME=documentos
```

### Si usas Account Name + Key:

```env
# Habilitar Azure Blob Storage
USE_AZURE_BLOB=true

# Nombre de la cuenta de almacenamiento
AZURE_STORAGE_ACCOUNT_NAME=senastorage123

# Clave de acceso
AZURE_STORAGE_ACCOUNT_KEY=tu_clave_de_acceso_muy_larga

# Nombre del contenedor
AZURE_STORAGE_CONTAINER_NAME=documentos
```

## 🔐 Paso 5: Seguridad en Producción

Para producción, se recomienda usar **Azure Active Directory (Azure AD)** en lugar de claves de acceso:

1. Asigna una **Managed Identity** a tu aplicación (App Service, VM, etc.)
2. Dale permisos de "Storage Blob Data Contributor" a la Managed Identity
3. En tu código, usa `DefaultAzureCredential` (ya está configurado en `azureBlobConfig.js`)
4. **No configures** `AZURE_STORAGE_CONNECTION_STRING` ni `AZURE_STORAGE_ACCOUNT_KEY` en el `.env` de producción

## 🧪 Paso 6: Probar la Configuración

1. Asegúrate de que las dependencias estén instaladas:
   ```bash
   npm install
   ```

2. Inicia la aplicación:
   ```bash
   npm start
   ```

3. Intenta subir un archivo desde la aplicación (ej: documento de aprendiz)

4. Verifica en Azure Portal > Storage Account > Containers > documentos que el archivo se haya subido correctamente

## 🛠️ Desarrollo Local

Para desarrollo local, puedes dejar `USE_AZURE_BLOB=false` para usar almacenamiento local en `public/uploads/documentos/`:

```env
USE_AZURE_BLOB=false
```

Los archivos se guardarán localmente y podrás hacer pruebas sin consumir recursos de Azure.

## 📊 Monitoreo y Costos

- **Monitoreo**: Ve a tu Storage Account > Monitoring > Metrics para ver el uso
- **Costos**: Los primeros 5GB son muy económicos (~$0.02/mes). Revisa [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/) para estimaciones

## 🚨 Solución de Problemas

### Error: "AZURE_STORAGE_ACCOUNT_NAME no está configurado"
- Verifica que las variables de entorno estén correctamente configuradas en tu `.env`
- Reinicia la aplicación después de modificar el `.env`

### Error: "Container does not exist"
- Asegúrate de que el contenedor exista en tu Storage Account
- Verifica que el nombre del contenedor en `.env` coincida exactamente con el de Azure

### Error de autenticación
- Verifica que la Connection String o las claves sean correctas
- Si usas Managed Identity, asegúrate de que tenga los permisos correctos

## 📚 Recursos Adicionales

- [Documentación oficial de Azure Blob Storage](https://learn.microsoft.com/azure/storage/blobs/)
- [SDK de Azure Storage para Node.js](https://learn.microsoft.com/javascript/api/overview/azure/storage-blob-readme)
- [Mejores prácticas de seguridad](https://learn.microsoft.com/azure/storage/common/storage-security-guide)

## 🔄 Migración de Datos Existentes

Si ya tienes archivos almacenados localmente o en Cloudinary, necesitarás migrarlos a Azure Blob Storage. Contacta al equipo de desarrollo para obtener un script de migración.
