#!/bin/bash

# Script de comandos útiles para Azure App Service
# Uso: chmod +x azure-commands.sh && ./azure-commands.sh

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

APP_NAME="sena-etapa-productiva"

echo -e "${CYAN}=================================${NC}"
echo -e "${CYAN}Azure App Service - Comandos Útiles${NC}"
echo -e "${CYAN}=================================${NC}"
echo ""

# Verificar si Azure CLI está instalado
if ! command -v az &> /dev/null; then
    echo -e "${RED}ERROR: Azure CLI no está instalado${NC}"
    echo "Descarga desde: https://aka.ms/installazurecliwindows"
    exit 1
fi

echo -e "${GREEN}✓ Azure CLI instalado${NC}"
echo ""

# Pedir Resource Group si no está definido
if [ -z "$RESOURCE_GROUP" ]; then
    echo -e "${YELLOW}Ingresa el nombre de tu Resource Group:${NC}"
    read RESOURCE_GROUP
    export RESOURCE_GROUP
fi

echo ""
echo -e "${CYAN}Selecciona una opción:${NC}"
echo "1. Ver logs en tiempo real (log streaming)"
echo "2. Ver configuración de la aplicación"
echo "3. Ver variables de entorno"
echo "4. Configurar Node.js 20"
echo "5. Configurar Startup Command"
echo "6. Reiniciar aplicación"
echo "7. Desplegar aplicación (ZIP)"
echo "8. Ver últimos deployments"
echo "9. SSH al contenedor"
echo "10. Ver estado de la aplicación"
echo "11. Configurar todas las variables necesarias"
echo "0. Salir"
echo ""

read -p "Opción: " opcion

case $opcion in
    1)
        echo -e "${YELLOW}Conectando a logs...${NC}"
        az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP
        ;;
    2)
        echo -e "${YELLOW}Obteniendo configuración...${NC}"
        az webapp config show --name $APP_NAME --resource-group $RESOURCE_GROUP
        ;;
    3)
        echo -e "${YELLOW}Listando variables de entorno...${NC}"
        az webapp config appsettings list --name $APP_NAME --resource-group $RESOURCE_GROUP
        ;;
    4)
        echo -e "${YELLOW}Configurando Node.js 20...${NC}"
        az webapp config appsettings set --name $APP_NAME \
            --resource-group $RESOURCE_GROUP \
            --settings WEBSITE_NODE_DEFAULT_VERSION="~20"
        
        az webapp config set --name $APP_NAME \
            --resource-group $RESOURCE_GROUP \
            --linux-fx-version "NODE|20-lts"
        
        echo -e "${GREEN}✓ Node.js 20 configurado${NC}"
        ;;
    5)
        echo -e "${YELLOW}Configurando Startup Command...${NC}"
        az webapp config set --name $APP_NAME \
            --resource-group $RESOURCE_GROUP \
            --startup-file "bash startup.sh"
        
        echo -e "${GREEN}✓ Startup Command configurado${NC}"
        ;;
    6)
        echo -e "${YELLOW}Reiniciando aplicación...${NC}"
        az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP
        echo -e "${GREEN}✓ Aplicación reiniciada${NC}"
        ;;
    7)
        echo -e "${YELLOW}Creando archivo ZIP...${NC}"
        timestamp=$(date +"%Y%m%d_%H%M%S")
        zip_file="deploy_$timestamp.zip"
        
        zip -r $zip_file . -x "*.git*" "node_modules/*" "*.log" "azure-logs/*" "coverage/*"
        
        echo -e "${YELLOW}Desplegando...${NC}"
        az webapp deployment source config-zip \
            --resource-group $RESOURCE_GROUP \
            --name $APP_NAME \
            --src $zip_file
        
        echo -e "${GREEN}✓ Despliegue completado${NC}"
        rm $zip_file
        ;;
    8)
        echo -e "${YELLOW}Obteniendo deployments...${NC}"
        az webapp deployment list --name $APP_NAME --resource-group $RESOURCE_GROUP
        ;;
    9)
        echo -e "${YELLOW}Conectando via SSH...${NC}"
        az webapp ssh --name $APP_NAME --resource-group $RESOURCE_GROUP
        ;;
    10)
        echo -e "${YELLOW}Obteniendo estado...${NC}"
        az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query state
        ;;
    11)
        echo -e "${YELLOW}Configurando todas las variables necesarias...${NC}"
        
        az webapp config appsettings set --name $APP_NAME \
            --resource-group $RESOURCE_GROUP \
            --settings \
                WEBSITE_NODE_DEFAULT_VERSION="~20" \
                SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
                NPM_CONFIG_PRODUCTION="false" \
                NODE_ENV="production" \
                PORT="3000" \
                WEBSITE_RUN_FROM_PACKAGE="0"
        
        echo -e "${GREEN}✓ Variables configuradas${NC}"
        echo -e "${YELLOW}Configurando Startup Command...${NC}"
        
        az webapp config set --name $APP_NAME \
            --resource-group $RESOURCE_GROUP \
            --startup-file "bash startup.sh" \
            --linux-fx-version "NODE|20-lts"
        
        echo -e "${GREEN}✓ Configuración completa${NC}"
        
        echo ""
        echo -e "${CYAN}¿Deseas reiniciar la aplicación ahora? (s/n)${NC}"
        read restart
        
        if [ "$restart" = "s" ] || [ "$restart" = "S" ]; then
            az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP
            echo -e "${GREEN}✓ Aplicación reiniciada${NC}"
        fi
        ;;
    0)
        echo -e "${CYAN}¡Hasta luego!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Opción no válida${NC}"
        ;;
esac

echo ""
echo -e "${CYAN}Presiona Enter para continuar...${NC}"
read
