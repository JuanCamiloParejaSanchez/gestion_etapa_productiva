// src/configuracion/azureBlobConfig.js
// Configuración para Azure Blob Storage

const { 
    BlobServiceClient, 
    generateBlobSASQueryParameters, 
    BlobSASPermissions, 
    StorageSharedKeyCredential,
    SASProtocol
} = require('@azure/storage-blob');
const { DefaultAzureCredential } = require('@azure/identity');
const { v4: uuidv4 } = require('uuid');

// Obtener configuración desde variables de entorno
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'documentos';

let blobServiceClient;

// Inicializar cliente de Azure Blob Storage
const initializeBlobServiceClient = () => {
    if (!accountName) {
        throw new Error('AZURE_STORAGE_ACCOUNT_NAME no está configurado en las variables de entorno');
    }

    // Si hay una connection string, usarla (desarrollo/pruebas)
    if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
        blobServiceClient = BlobServiceClient.fromConnectionString(
            process.env.AZURE_STORAGE_CONNECTION_STRING
        );
    } else {
        // Usar Azure AD authentication (producción)
        const accountUrl = `https://${accountName}.blob.core.windows.net`;
        blobServiceClient = new BlobServiceClient(accountUrl, new DefaultAzureCredential());
    }

    return blobServiceClient;
};

// Función para subir un archivo a Azure Blob Storage
const uploadFile = async (buffer, originalName, folder = 'documentos') => {
    try {
        const client = blobServiceClient || initializeBlobServiceClient();
        const containerClient = client.getContainerClient(containerName);

        // Crear contenedor si no existe
        await containerClient.createIfNotExists();

        // Generar nombre único para el blob
        const path = require('path');
        const ext = path.extname(originalName).toLowerCase();
        const basename = path.basename(originalName, ext);
        const slugify = (text) => {
            return text
                .toString()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '')
                .replace(/--+/g, '-');
        };
        const sanitizedBasename = slugify(basename);
        const blobName = `${folder}/${sanitizedBasename}-${Date.now()}${ext}`;

        console.log(`[Azure Upload] Subiendo archivo: ${blobName} al contenedor: ${containerName}`);

        // Subir archivo
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.upload(buffer, buffer.length, {
            blobHTTPHeaders: {
                blobContentType: getMimeType(ext)
            }
        });

        return {
            blobName,
            url: blockBlobClient.url
        };
    } catch (error) {
        console.error('Error al subir archivo a Azure Blob Storage:', error);
        throw error;
    }
};

// Función para eliminar archivo de Azure Blob Storage
const deleteFile = async (blobName) => {
    try {
        const client = blobServiceClient || initializeBlobServiceClient();
        const containerClient = client.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.deleteIfExists();
        return { success: true };
    } catch (error) {
        console.error('Error al eliminar archivo de Azure Blob Storage:', error);
        throw error;
    }
};

// Función para obtener URL de un blob
const getUrl = (blobName) => {
    const client = blobServiceClient || initializeBlobServiceClient();
    const containerClient = client.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    return blockBlobClient.url;
};

// Función para descargar archivo de Azure Blob Storage
const downloadFile = async (blobName) => {
    try {
        const client = blobServiceClient || initializeBlobServiceClient();
        const containerClient = client.getContainerClient(containerName);
        
        console.log(`[Azure Download] Intentando descargar blob: ${blobName} del contenedor: ${containerName}`);
        let blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        try {
            const downloadResponse = await blockBlobClient.download();
            return downloadResponse.readableStreamBody;
        } catch (initialError) {
            // Si falla y el blobName comienza con el nombre del contenedor, intentamos sin el prefijo
            // Esto maneja el caso donde la ruta guardada incluye el contenedor pero el blob está en la raíz
            if (initialError.statusCode === 404 && blobName.startsWith(containerName + '/')) {
                const newBlobName = blobName.substring(containerName.length + 1);
                console.log(`[Azure Download] Blob no encontrado en ${blobName}. Intentando ruta alternativa: ${newBlobName}`);
                
                blockBlobClient = containerClient.getBlockBlobClient(newBlobName);
                const retryResponse = await blockBlobClient.download();
                return retryResponse.readableStreamBody;
            }
            throw initialError;
        }
    } catch (error) {
        console.error('Error al descargar archivo de Azure Blob Storage:', error);
        throw error;
    }
};

// Función auxiliar para determinar el tipo MIME
const getMimeType = (ext) => {
    const mimeTypes = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg'
    };
    return mimeTypes[ext] || 'application/octet-stream';
};

// Función para generar URL con SAS (Shared Access Signature)
const generateSasUrl = async (blobName, permissions = 'r', expiresInMinutes = 60) => {
    try {
        const client = blobServiceClient || initializeBlobServiceClient();
        const containerClient = client.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // Definir permisos y tiempo de expiración
        const sasPermissions = BlobSASPermissions.parse(permissions);
        const startsOn = new Date();
        // Ajustar startsOn un poco hacia atrás para evitar problemas de reloj
        startsOn.setMinutes(startsOn.getMinutes() - 5);
        const expiresOn = new Date(new Date().valueOf() + expiresInMinutes * 60 * 1000);

        if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
            // Caso 1: Usando Connection String (Desarrollo/Pruebas)
            const matches = process.env.AZURE_STORAGE_CONNECTION_STRING.match(/AccountName=([^;]+);AccountKey=([^;]+)/);
            if (!matches) {
                throw new Error('Invalid Connection String');
            }
            const accountName = matches[1];
            const accountKey = matches[2];
            const credential = new StorageSharedKeyCredential(accountName, accountKey);

            const sasToken = generateBlobSASQueryParameters({
                containerName,
                blobName,
                permissions: sasPermissions,
                startsOn,
                expiresOn,
                protocol: SASProtocol.HttpsAndHttp
            }, credential).toString();

            return `${blockBlobClient.url}?${sasToken}`;

        } else {
            // Caso 2: Usando Managed Identity (Producción)
            const userDelegationKey = await client.getUserDelegationKey(
                startsOn, 
                expiresOn
            );

            const sasToken = generateBlobSASQueryParameters({
                containerName,
                blobName,
                permissions: sasPermissions,
                startsOn,
                expiresOn,
                protocol: SASProtocol.Https
            }, userDelegationKey, accountName).toString();

            return `${blockBlobClient.url}?${sasToken}`;
        }
    } catch (error) {
        console.error('Error al generar SAS URL:', error);
        // Fallback a URL pública si falla
        return getUrl(blobName);
    }
};

module.exports = {
    initializeBlobServiceClient,
    uploadFile,
    deleteFile,
    getUrl,
    downloadFile,
    getMimeType,
    generateSasUrl
};