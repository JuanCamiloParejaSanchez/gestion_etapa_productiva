// src/configuracion/azureBlobConfig.js
// Configuración para Azure Blob Storage

const { BlobServiceClient } = require('@azure/storage-blob');
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
        await containerClient.createIfNotExists({
            access: 'blob' // Acceso público a los blobs
        });

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
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        const downloadResponse = await blockBlobClient.download();
        return downloadResponse.readableStreamBody;
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

module.exports = {
    initializeBlobServiceClient,
    uploadFile,
    deleteFile,
    getUrl,
    downloadFile,
    getMimeType
};