# Scripts de Automatización - Gestión Etapa Productiva

## 🚀 Gestión de Procesos con PM2

### Instalación
PM2 ya está instalado globalmente. Para usar PM2 localmente:
```bash
npm install pm2 --save-dev
```

### Comandos Básicos

#### Desarrollo con Hot Reload
```bash
# Iniciar servidor de desarrollo con watch
npm run pm2:start:dev

# Ver logs en tiempo real
npm run pm2:logs

# Reiniciar aplicación
npm run pm2:restart

# Detener aplicación
npm run pm2:stop

# Eliminar aplicación
npm run pm2:delete
```

#### Producción
```bash
# Iniciar en modo producción
npm run prod:start

# Ver monitor de procesos
npm run pm2:monit
```

### Configuración PM2

El archivo `ecosystem.config.js` contiene:
- **gestion-etapa-productiva**: Configuración para producción
- **gestion-etapa-productiva-dev**: Configuración para desarrollo con hot reload

### Características
- ✅ Auto-restart en caso de fallos
- ✅ Watch automático de archivos en desarrollo
- ✅ Logs separados por aplicación
- ✅ Monitoreo de memoria y CPU
- ✅ Reinicio automático por uso de memoria
- ✅ Configuración de cluster para escalabilidad

## 🛠️ Limpieza de Puertos

### Scripts Disponibles

#### 1. kill-port.bat - Puerto Específico
```bash
# Liberar puerto específico (por defecto 3000)
scripts\kill-port.bat
scripts\kill-port.bat 8080

# O usando npm
npm run kill-port 3000
```

#### 2. kill-node-ports.bat - Múltiples Puertos
```bash
# Liberar todos los puertos comunes de desarrollo
scripts\kill-node-ports.bat

# O usando npm
npm run kill-ports
```

#### 3. Kill-NodePorts.ps1 - PowerShell Avanzado
```powershell
# Liberar puerto específico
.\scripts\Kill-NodePorts.ps1 -Port 3000

# Liberar todos los puertos comunes
.\scripts\Kill-NodePorts.ps1 -All
```

### Puertos que se Limpian Automáticamente
- 3000 (Express default)
- 3001, 3002 (Desarrollo alternativo)
- 8000, 8080 (APIs)
- 5000 (Python/FastAPI)
- 4000, 9000 (Otros servicios)

## 🔄 Flujos de Trabajo Recomendados

### Desarrollo Diario
```bash
# 1. Limpiar puertos previos
npm run kill-ports

# 2. Iniciar desarrollo con PM2
npm run pm2:start:dev

# 3. Ver logs
npm run pm2:logs

# 4. Cuando termines
npm run pm2:stop
```

### Solución Rápida de "Puerto en Uso"
```bash
# Una sola línea para limpiar e iniciar
npm run dev:clean
```

### Producción
```bash
# Desplegar en producción
npm run prod:start

# Monitorear
npm run pm2:monit
```

## 📊 Monitoreo y Logs

### Ver Estado de PM2
```bash
pm2 list
pm2 show gestion-etapa-productiva
pm2 monit
```

### Logs
```bash
# Todos los logs
pm2 logs

# Logs de aplicación específica
pm2 logs gestion-etapa-productiva

# Logs con seguimiento
pm2 logs --lines 100
```

### Gestión de Procesos
```bash
# Reiniciar todas las aplicaciones
pm2 restart all

# Recargar configuración
pm2 reload ecosystem.config.js

# Guardar estado actual
pm2 save

# Restaurar al iniciar sistema
pm2 startup
pm2 resurrect
```

## 🛡️ Seguridad

### Políticas de PM2
- Solo mata procesos de Node.js (verificación por nombre)
- No interfiere con otros servicios del sistema
- Logs separados para auditoría
- Reinicio automático con límites de memoria

### Verificación de Puertos
Los scripts verifican que los procesos sean realmente de Node.js antes de terminarlos, evitando matar procesos importantes del sistema.

## 🚨 Solución de Problemas

### PM2 no inicia
```bash
# Limpiar completamente
npm run clean

# Verificar instalación
pm2 --version

# Reinstalar si es necesario
npm install -g pm2
```

### Puerto aún ocupado
```bash
# Ver qué proceso usa el puerto
netstat -ano | findstr :3000

# Usar script específico
scripts\kill-port.bat 3000
```

### Logs no aparecen
```bash
# Verificar directorio de logs
dir logs\

# Ver logs de PM2
pm2 logs --err
```

## 📋 Checklist de Desarrollo

### Inicio de Sesión
- [ ] Ejecutar `npm run kill-ports`
- [ ] Iniciar con `npm run pm2:start:dev`
- [ ] Verificar logs con `npm run pm2:logs`

### Durante Desarrollo
- [ ] Usar `npm run pm2:restart` para cambios importantes
- [ ] Monitorear logs regularmente
- [ ] Verificar uso de memoria

### Fin de Sesión
- [ ] Detener procesos con `npm run pm2:stop`
- [ ] Limpiar puertos si es necesario

## 🔧 Configuración Avanzada

### Variables de Entorno para PM2
```javascript
// En ecosystem.config.js
env: {
  NODE_ENV: 'development',
  LOG_LEVEL: 'debug',
  PORT: 3000
}
```

### Configuración de Watch
```javascript
watch: ['src', 'views'],
ignore_watch: ['node_modules', 'logs'],
watch_options: {
  interval: 1000,
  usePolling: true
}
```

### Límites de Memoria
```javascript
max_memory_restart: '500M', // Desarrollo
max_memory_restart: '1G',   // Producción
```

---

## 🎯 Resumen Ejecutivo

Este sistema de automatización resuelve definitivamente el problema de "puertos en uso" y proporciona gestión profesional de procesos:

### ✅ Beneficios Implementados
- **Cero conflictos de puertos** en desarrollo
- **Reinicio automático** en caso de fallos
- **Hot reload** eficiente en desarrollo
- **Monitoreo completo** de aplicaciones
- **Logs estructurados** para debugging
- **Gestión profesional** de procesos

### ✅ Casos de Uso Resueltos
- Desarrollo con múltiples instancias
- Puertos ocupados por procesos huérfanos
- Reinicio automático tras crashes
- Monitoreo de rendimiento en tiempo real
- Despliegue simplificado a producción

### ✅ Comandos Más Usados
```bash
npm run dev:clean     # Limpia e inicia desarrollo
npm run pm2:logs      # Ver logs en tiempo real
npm run pm2:restart   # Reiniciar aplicación
npm run kill-ports    # Liberar puertos
```

**Sistema completamente automatizado y listo para uso profesional** 🚀