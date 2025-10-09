# Sistema de Gestión de Etapa Productiva - SENA

## 🎯 Descripción

Sistema web desarrollado para la gestión integral de la etapa productiva de aprendices del SENA. Incluye funcionalidades de administración, seguimiento de aprendices, reportes estadísticos y análisis de sentimientos con inteligencia artificial.

## ✨ Características Principales

### 🔧 Gestión de Aprendices
- Registro y gestión completa de aprendices
- Seguimiento de etapa productiva
- Gestión de documentación
- Bitácoras semanales

### 📊 Reportes y Estadísticas
- Gráficos interactivos de programas de formación
- Estadísticas por estado de aprendices
- Análisis de alternativas de etapa productiva
- Exportación de datos

### 🤖 Análisis de Sentimientos con IA
- Análisis automático de bitácoras semanales con IBM Watson
- Detección de emociones y sentimientos avanzada
- Seguimiento de tendencias temporales
- Alertas y recomendaciones automáticas
- Fallback automático a análisis local

### 🔐 Sistema de Autenticación
- Login seguro para administradores y aprendices
- Recuperación de contraseñas
- Gestión de sesiones

## 🚀 Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MySQL** - Base de datos
- **EJS** - Motor de plantillas

### Frontend
- **Bootstrap 5** - Framework CSS
- **Chart.js** - Gráficos interactivos
- **DataTables** - Tablas dinámicas
- **Font Awesome** - Iconos

### Inteligencia Artificial
- **IBM Watson** - Análisis de sentimientos y emociones
- **Natural** - Procesamiento de lenguaje natural (fallback)
- **Sentiment** - Análisis de sentimientos (fallback)
- **Compromise** - Análisis avanzado de texto (fallback)

## 📦 Instalación

### Requisitos Previos
- Node.js (versión 14 o superior)
- MySQL (versión 5.7 o superior)
- npm o yarn

### Instalación Automática
```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd gestion_etapa_productiva

# Ejecutar script de instalación
./scripts/instalacion.sh

# Configurar IBM Watson (opcional pero recomendado)
./scripts/instalar_watson.sh
```

### Instalación Manual
```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Configurar base de datos
mysql -u tu_usuario -p tu_base_datos < MySQL.sql

# 4. Configurar IBM Watson (opcional pero recomendado)
npm install ibm-watson
# Editar .env con credenciales de Watson

# 5. Ejecutar el sistema
npm run dev
```

## ⚙️ Configuración

### Variables de Entorno (.env)
```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=gestion_etapa_productiva

# Sesiones
SESSION_SECRET=tu_secreto_super_seguro
SESSION_NAME=sena_session

# Correo (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_password_aplicacion

# Servidor
PORT=3000
NODE_ENV=development

# IBM Watson Natural Language Understanding (opcional)
WATSON_API_KEY=tu_api_key_aqui
WATSON_SERVICE_URL=https://api.us-south.natural-language-understanding.watson.cloud.ibm.com/instances/tu_instance_id
WATSON_VERSION=2022-04-07
USE_WATSON_SENTIMENT_ANALYSIS=true
```

## 🎮 Uso del Sistema

### Acceso al Sistema
- **URL**: http://localhost:3000
- **Panel Administrador**: `/administrador/panel-principal`
- **Dashboard Aprendiz**: `/aprendiz/dashboard`

### Funcionalidades Principales

#### Para Administradores
1. **Panel Principal**: Vista general del sistema
2. **Gestión de Aprendices**: CRUD completo de aprendices
3. **Reportes**: Estadísticas y gráficos
4. **Análisis de Sentimientos**: IA para análisis de bitácoras
5. **Verificación de Documentos**: Gestión de documentación

#### Para Aprendices
1. **Dashboard Personal**: Información del aprendiz
2. **Bitácora Semanal**: Registro de experiencias
3. **Gestión de Documentos**: Subida y gestión de archivos
4. **Perfil**: Actualización de información personal

## 📊 Análisis de Sentimientos con IBM Watson

### ¿Cómo Funciona?
El sistema utiliza IBM Watson Natural Language Understanding para analizar las respuestas de las bitácoras semanales:

1. **Recolección**: Los aprendices responden 3 preguntas semanales
2. **Procesamiento**: IBM Watson analiza el sentimiento y emociones
3. **Análisis**: Se calculan scores y se detectan patrones
4. **Visualización**: Resultados se muestran en el panel del administrador
5. **Alertas**: Se generan recomendaciones automáticas
6. **Fallback**: Si Watson no está disponible, usa análisis local

### Métricas Analizadas
- **Score de Sentimiento**: -5 a +5 (95% precisión con Watson)
- **Emociones Detectadas**: Felicidad, tristeza, ira, miedo, sorpresa, etc.
- **Entidades Identificadas**: Personas, lugares, conceptos relevantes
- **Palabras Clave**: Términos importantes con sentimiento
- **Tendencias Temporales**: Mejorando/Empeorando/Estable
- **Variabilidad Emocional**: Estabilidad del aprendiz
- **Alertas**: Problemas detectados automáticamente

## 🔧 Desarrollo

### Estructura del Proyecto
```
gestion_etapa_productiva/
├── src/
│   ├── modulos/
│   │   ├── administrador/     # Módulo de administración
│   │   ├── aprendiz/         # Módulo de aprendices
│   │   └── compartido/       # Funcionalidades compartidas
│   ├── configuracion/        # Configuración de BD
│   └── servidor.js          # Archivo principal
├── views/                   # Plantillas EJS
├── public/                  # Archivos estáticos
├── scripts/                 # Scripts de instalación
└── docs/                    # Documentación
```

### Comandos de Desarrollo
```bash
# Modo desarrollo (con recarga automática)
npm run dev

# Modo producción
npm start

# Instalar nuevas dependencias
npm install nombre-paquete

# Verificar estructura
npm run lint
```

## 📈 Mejoras Implementadas

### ✅ Problemas Resueltos
1. **Botones del Panel Principal**: Funcionalidad completa implementada
2. **Sistema de Reportes**: Optimizado y mejorado
3. **Análisis de Sentimientos**: Nueva funcionalidad con IA
4. **Optimización de BD**: Consultas mejoradas y seguras

### 🆕 Nuevas Funcionalidades
- Análisis automático de sentimientos
- Gráficos de tendencias temporales
- Alertas y recomendaciones automáticas
- Interfaz mejorada con visualizaciones

## 🛡️ Seguridad

### Medidas Implementadas
- Consultas preparadas (prevención SQL injection)
- Validación de datos de entrada
- Gestión segura de sesiones
- Sanitización de archivos subidos
- Control de acceso por roles

## 📚 Documentación

### Archivos de Documentación
- `MEJORAS_IMPLEMENTADAS.md` - Detalles técnicos de mejoras
- `Manual de usuario.pdf` - Guía de usuario
- `Documentacion Tecnica.pdf` - Documentación técnica
- `MySQL.sql` - Estructura de base de datos

## 🤝 Contribución

### Cómo Contribuir
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de Código
- Usar ESLint para consistencia
- Comentar funciones complejas
- Seguir convenciones de nombres
- Documentar APIs

## 🐛 Reportar Errores

Para reportar errores o solicitar nuevas funcionalidades:
1. Revisa si ya existe un issue similar
2. Crea un nuevo issue con descripción detallada
3. Incluye pasos para reproducir el problema
4. Adjunta logs o capturas de pantalla si es necesario

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**JuanBogotá**
- Desarrollador Full Stack
- Especialista en Node.js y JavaScript
- Experiencia en sistemas educativos

## 🙏 Agradecimientos

- SENA por la oportunidad de desarrollar este sistema
- Comunidad de desarrolladores de Node.js
- Contribuidores y revisores del código

## 📞 Contacto

Para preguntas o soporte técnico:
- Email: [tu-email@ejemplo.com]
- GitHub: [tu-usuario-github]

---

**Versión**: 1.0  
**Última actualización**: Diciembre 2024  
**Estado**: En desarrollo activo 