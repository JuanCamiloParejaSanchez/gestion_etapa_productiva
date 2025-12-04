# Script de despliegue para Azure App Service
# Asegura que todos los archivos necesarios estén presentes antes de desplegar

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Verificación Pre-Despliegue Azure" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Verificar archivos necesarios
$archivosNecesarios = @(
    ".nvmrc",
    ".deployment",
    ".npmrc",
    "deploy.sh",
    "startup.sh",
    "package.json"
)

$todosPresentes = $true

Write-Host "Verificando archivos necesarios..." -ForegroundColor Yellow
foreach ($archivo in $archivosNecesarios) {
    if (Test-Path $archivo) {
        Write-Host "✓ $archivo encontrado" -ForegroundColor Green
    } else {
        Write-Host "✗ $archivo NO encontrado" -ForegroundColor Red
        $todosPresentes = $false
    }
}

Write-Host ""

if (-not $todosPresentes) {
    Write-Host "ERROR: Faltan archivos necesarios para el despliegue" -ForegroundColor Red
    exit 1
}

# Verificar contenido de .nvmrc
Write-Host "Verificando configuración de Node.js..." -ForegroundColor Yellow
$nvmrcContent = Get-Content .nvmrc -Raw
if ($nvmrcContent.Trim() -eq "20") {
    Write-Host "✓ .nvmrc configurado correctamente (Node.js 20)" -ForegroundColor Green
} else {
    Write-Host "⚠ .nvmrc tiene contenido inesperado: $nvmrcContent" -ForegroundColor Yellow
}

Write-Host ""

# Verificar que dotenv esté en package.json
Write-Host "Verificando dependencias..." -ForegroundColor Yellow
$packageJson = Get-Content package.json | ConvertFrom-Json
if ($packageJson.dependencies.dotenv) {
    Write-Host "✓ dotenv está en dependencies" -ForegroundColor Green
} else {
    Write-Host "✗ dotenv NO está en dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Verificación completada con éxito" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Preguntar si desea continuar con el despliegue
$respuesta = Read-Host "¿Deseas desplegar ahora en Azure? (s/n)"

if ($respuesta -eq "s" -or $respuesta -eq "S") {
    Write-Host ""
    Write-Host "Opciones de despliegue:" -ForegroundColor Cyan
    Write-Host "1. Desplegar usando VS Code (Recomendado)"
    Write-Host "2. Desplegar usando Git"
    Write-Host "3. Desplegar usando Azure CLI"
    Write-Host "4. Solo hacer commit y push"
    Write-Host ""
    
    $opcion = Read-Host "Selecciona una opción (1-4)"
    
    switch ($opcion) {
        "1" {
            Write-Host ""
            Write-Host "Para desplegar usando VS Code:" -ForegroundColor Yellow
            Write-Host "1. Haz clic derecho en la carpeta del proyecto"
            Write-Host "2. Selecciona 'Deploy to Web App...'"
            Write-Host "3. Selecciona tu App Service: sena-etapa-productiva"
            Write-Host "4. Confirma el despliegue"
            Write-Host ""
            Write-Host "Presiona Enter para abrir VS Code..."
            Read-Host
            code .
        }
        "2" {
            Write-Host ""
            Write-Host "Desplegando usando Git..." -ForegroundColor Yellow
            git add .
            git commit -m "Fix: Configuración para Azure con Node.js 20 y corrección de dependencias"
            git push origin main
            Write-Host "✓ Push completado. Verifica el despliegue en Azure Portal" -ForegroundColor Green
        }
        "3" {
            Write-Host ""
            $resourceGroup = Read-Host "Ingresa el nombre de tu Resource Group"
            Write-Host "Creando archivo ZIP..." -ForegroundColor Yellow
            
            # Crear ZIP excluyendo archivos innecesarios
            $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
            $zipFile = "deploy_$timestamp.zip"
            
            Compress-Archive -Path * -DestinationPath $zipFile -Force -CompressionLevel Optimal
            
            Write-Host "Desplegando en Azure..." -ForegroundColor Yellow
            az webapp deployment source config-zip `
                --resource-group $resourceGroup `
                --name sena-etapa-productiva `
                --src $zipFile
                
            Write-Host "✓ Despliegue completado" -ForegroundColor Green
            
            # Limpiar archivo ZIP
            Remove-Item $zipFile
        }
        "4" {
            Write-Host ""
            Write-Host "Haciendo commit y push..." -ForegroundColor Yellow
            git add .
            $mensaje = Read-Host "Ingresa el mensaje del commit"
            git commit -m $mensaje
            git push origin main
            Write-Host "✓ Push completado" -ForegroundColor Green
        }
        default {
            Write-Host "Opción no válida" -ForegroundColor Red
        }
    }
} else {
    Write-Host ""
    Write-Host "Despliegue cancelado. Los archivos están listos cuando decidas desplegar." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "RECORDATORIO IMPORTANTE:" -ForegroundColor Red
Write-Host "Debes configurar Node.js 20 LTS en Azure Portal:" -ForegroundColor Yellow
Write-Host "Configuration > General settings > Stack > Node 20 LTS" -ForegroundColor Yellow
Write-Host "Startup Command: bash startup.sh" -ForegroundColor Yellow
Write-Host ""
Write-Host "Presiona Enter para finalizar..."
Read-Host
