# Solución al Error de Autenticación con Azure Blob Storage

El error `AggregateAuthenticationError: ChainedTokenCredential authentication failed` indica que la aplicación desplegada en Azure App Service no tiene permisos para acceder al Blob Storage. Aunque la subida de archivos funcionó (probablemente porque se hizo desde un entorno local con credenciales o porque la aplicación no reportó el error correctamente), la descarga está fallando porque el servidor en la nube no tiene una identidad válida.

## Causa del Problema

El código está intentando usar `DefaultAzureCredential`, que en Azure App Service busca una **Identidad Administrada (Managed Identity)**. El error `Attempted to use the IMDS endpoint, but it is not available` confirma que esta identidad no está habilitada o configurada.

## Solución Recomendada: Usar Identidad Administrada (Mejor Práctica)

Sigue estos pasos para habilitar la identidad y dar permisos:

### 1. Habilitar Identidad en App Service
1. Ve al [Azure Portal](https://portal.azure.com).
2. Busca tu **App Service** (`sena-etapa-productiva` o el nombre que le hayas dado).
3. En el menú izquierdo, busca **Settings** > **Identity** (Identidad).
4. En la pestaña **System assigned** (Asignado por el sistema), cambia el estado a **On** (Activado).
5. Haz clic en **Save** (Guardar) y confirma.
6. Espera unos segundos hasta que aparezca el **Object (principal) ID**.

### 2. Asignar Permisos en el Storage Account
1. Ve a tu recurso de **Storage Account** (donde están los documentos).
2. En el menú izquierdo, selecciona **Access Control (IAM)**.
3. Haz clic en **+ Add** > **Add role assignment**.
4. Busca y selecciona el rol: **Storage Blob Data Contributor** (Colaborador de datos de blobs de almacenamiento).
   *Nota: Es importante que sea este rol específico, no solo "Contributor".*
5. **IMPORTANTE**: Para que la aplicación pueda generar enlaces seguros (SAS Tokens) para ver los archivos, TAMBIÉN debes agregar el rol **Storage Blob Data Delegator** (Delegador de datos de blobs de almacenamiento).
   *Sin este rol, verás errores XML "PublicAccessNotPermitted" al intentar abrir los documentos.*
6. Haz clic en **Next**.
7. En **Assign access to**, selecciona **Managed identity**.
8. Haz clic en **+ Select members**.
9. En la suscripción, selecciona **App Service**.
10. Busca y selecciona tu App Service.
11. Haz clic en **Select** y luego en **Review + assign**.
   *Repite el proceso para asignar ambos roles si es necesario.*

### 3. Verificar Variables de Entorno
Asegúrate de que en la configuración del App Service (Configuration > Application settings) tengas definida la variable:
- `AZURE_STORAGE_ACCOUNT_NAME`: El nombre de tu cuenta de almacenamiento (ej: `senastorage123`).

### 4. Reiniciar
Reinicia el App Service para que tome los cambios de identidad.

---

## Solución Alternativa: Usar Connection String (Más Rápida)

Si prefieres no usar identidades administradas, puedes usar la cadena de conexión completa.

1. Ve a tu **Storage Account** > **Security + networking** > **Access keys**.
2. Copia la **Connection string** de la key1.
3. Ve a tu **App Service** > **Configuration** > **Application settings**.
4. Agrega una nueva variable:
   - **Name**: `AZURE_STORAGE_CONNECTION_STRING`
   - **Value**: (Pega la cadena de conexión que copiaste)
5. Haz clic en **Save** y reinicia el App Service.

*Nota: El código está preparado para usar `AZURE_STORAGE_CONNECTION_STRING` si existe, ignorando la autenticación por identidad.*
