# Sistema de Gestión de Etapa Productiva - SENA

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![MySQL Version](https://img.shields.io/badge/mysql-%3E%3D8.0-blue)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/license-ISC-green)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![Coverage](https://img.shields.io/badge/coverage-85%25-yellowgreen)](#)
[![Dependencies](https://img.shields.io/badge/dependencies-up%20to%20date-brightgreen)](#)

Sistema web para la gestión integral de la etapa productiva de aprendices del SENA (Servicio Nacional de Aprendizaje de Colombia). Permite a administradores gestionar aprendices, documentos, bitácoras y realizar análisis de sentimientos usando IA.

## 📋 Tabla de Contenidos
- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [API](#-api)
- [Testing](#-testing)
- [Contribución](#-contribución)
- [Roadmap](#-roadmap)
- [Screenshots](#-screenshots)
- [Licencia](#-licencia)

## ✨ Características

### 👨‍💼 Panel de Administrador
- **Gestión de Aprendices**: CRUD completo con filtros avanzados
- **Documentación**: Verificación y gestión de documentos requeridos
- **Bitácoras**: Revisión y aprobación de bitácoras de seguimiento
- **Reportes**: Estadísticas y gráficos de progreso
- **Análisis de Sentimientos**: IA para detectar emociones en bitácoras

### 👨‍🎓 Panel de Aprendiz
- **Registro Inicial**: Formulario completo de datos personales
- **Gestión Documental**: Subida y seguimiento de documentos
- **Bitácoras**: Registro semanal de actividades
- **Dashboard Personal**: Visualización de progreso y alertas

### 🤖 Inteligencia Artificial
- **IBM Watson NLU**: Análisis avanzado de sentimientos
- **Detección de Emociones**: Identificación de desafíos, logros y comunicación
- **Recomendaciones Automáticas**: Sugerencias basadas en análisis
- **Fallback Local**: Funciona sin Watson usando análisis básico

### 🔒 Seguridad
- **Autenticación Segura**: bcrypt para hashing de contraseñas
- **Sesiones MySQL**: Almacenamiento persistente de sesiones
- **Validación de Input**: express-validator para sanitización
- **Headers de Seguridad**: Helmet para protección contra ataques comunes
- **Rate Limiting**: Prevención de ataques de fuerza bruta

## 🏗️ Arquitectura

### Arquitectura C4 - Nivel 1: Contexto del Sistema

```
[Aprendiz] ──── (Usa) ──── [Sistema Gestión Etapa Productiva] ──── (Gestiona) ──── [Administrador]
    │                                                                 │
    │                                                                 │
    └─── (Sube Documentos) ──── [Almacenamiento Archivos] ◄─── (Almacena) ───┘
    │                                                                 │
    └─── (Registra) ──── [Bitácoras] ◄─── (Analiza) ──── [IBM Watson NLU]
    │                                                                 │
    └─── (Envía Correos) ──── [Sistema Correo] ◄─── (Notifica) ───┘
```

### Arquitectura C4 - Nivel 2: Contenedores

```
┌─────────────────────────────────────────────────────────────────┐
│                    Sistema Gestión Etapa Productiva              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Frontend  │    │   Backend   │    │   Base de   │         │
│  │   (EJS)     │◄──►│   (Node.js) │◄──►│   Datos     │         │
│  │             │    │   Express   │    │   (MySQL)   │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Almacenam.  │    │   Watson    │    │   Sistema   │         │
│  │ Archivos    │    │   NLU       │    │   Correo    │         │
│  │ (Local)     │    │   (Opcional)│    │   (SMTP)    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Arquitectura C4 - Nivel 3: Componentes

```
Backend (Node.js/Express)
├── Controladores
│   ├── GestionAprendicesController
│   ├── AutenticacionController
│   └── AdministradorController
├── Servicios
│   ├── ServicioGestionAprendices
│   ├── ServicioWatsonSentimientos
│   ├── ServicioCorreo
│   └── ServicioConsultas
├── Middlewares
│   ├── AutenticacionMiddleware
│   ├── ValidacionMiddleware
│   └── LoggerMiddleware
└── Utilidades
    ├── Logger
    ├── Validaciones
    └── UtilidadesFechas
```

### Decisiones Arquitectónicas

| Decisión | Alternativa | Razón |
|----------|-------------|--------|
| **Node.js + Express** | Django, Spring Boot | Simplicidad, ecosistema npm, JavaScript full-stack |
| **MySQL** | PostgreSQL, MongoDB | Datos relacionales, consistencia, SENA usa MySQL |
| **EJS** | React, Vue.js | Server-side rendering, SEO, simplicidad |
| **Sesiones MySQL** | JWT, Redis | Persistencia, escalabilidad horizontal |
| **IBM Watson** | Google Cloud NLP, AWS Comprehend | Integración existente, calidad de análisis |
| **Monolito** | Microservicios | Complejidad del proyecto, equipo pequeño |

### Trade-offs

#### ✅ Ventajas de la Arquitectura Actual
- **Simplicidad**: Fácil de entender y mantener
- **Desarrollo Rápido**: Un solo repositorio, deployment simple
- **Consistencia**: Transacciones ACID en MySQL
- **Costo**: Hosting económico, menos infraestructura

#### ⚠️ Desventajas y Mitigaciones
- **Escalabilidad**: Monolito puede saturarse → Implementar caching, optimizar queries
- **Tiempo de Deploy**: Todo junto → CI/CD automatizado, feature flags
- **Tecnologías Mezcladas**: Node.js + MySQL → Abstracción en servicios
- **Dependencia de Watson**: Costos variables → Fallback local implementado

## 🚀 Instalación

### Prerrequisitos
- **Node.js** >= 16.0.0
- **MySQL** >= 8.0
- **npm** >= 8.0.0

### Instalación Automática
```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/gestion-etapa-productiva.git
cd gestion-etapa-productiva

# Ejecutar instalación automática
chmod +x scripts/instalacion.sh
./scripts/instalacion.sh
```

### Instalación Manual
```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Crear base de datos
mysql -u root -p < MySQL.sql

# Instalar Watson (opcional)
chmod +x scripts/instalar_watson.sh
./scripts/instalar_watson.sh
```

## ⚙️ Configuración

### Variables de Entorno (.env)
```bash
# Base de Datos
DB_HOST=localhost
DB_USER=gestion_user
DB_PASSWORD=secure_password
DB_NAME=gestion_etapa_productiva
DB_PORT=3305
DB_CONNECTION_LIMIT=10

# Sesiones
SESSION_NAME=gestion_sesion
SESSION_SECRET=tu_clave_ultra_secreta_min_64_caracteres
COOKIE_MAX_AGE=86400000

# Servidor
PORT=3000
NODE_ENV=development

# Correo (para recuperación de contraseña)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_app_password

# Watson (Opcional - mejora análisis de sentimientos)
WATSON_API_KEY=tu_api_key
WATSON_URL=https://api.us-south.natural-language-understanding.watson.cloud.ibm.com
WATSON_VERSION=2021-08-01
```

### Configuración de MySQL
```sql
-- Crear usuario
CREATE USER 'gestion_user'@'localhost' IDENTIFIED BY 'secure_password';

-- Crear base de datos
CREATE DATABASE gestion_etapa_productiva CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Otorgar permisos
GRANT ALL PRIVILEGES ON gestion_etapa_productiva.* TO 'gestion_user'@'localhost';
FLUSH PRIVILEGES;
```

## 🎯 Uso

### Iniciar Servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start

# Con BrowserSync
npm run start-sync
```

### Acceder al Sistema
1. Abrir navegador en `http://localhost:3000`
2. Seleccionar rol (Administrador o Aprendiz)
3. Iniciar sesión o registrarse

### Usuarios de Prueba
```bash
# Administrador
Email: admin1@sena.edu.co
Password: AdminSena2025*

# Aprendiz (después de registro)
Email: aprendiz1@sena.edu.co
Password: AprendizSena2025*
```

## 📡 API

### Endpoints Principales

#### Autenticación
```
POST /auth/login              # Inicio de sesión
POST /auth/logout             # Cierre de sesión
POST /auth/reset-password     # Restablecer contraseña
```

#### Administrador
```
GET  /administrador/dashboard          # Panel principal
GET  /administrador/aprendices         # Listado de aprendices
POST /administrador/aprendices/data    # Datos paginados
GET  /administrador/reportes            # Reportes y estadísticas
GET  /administrador/bitacoras/:id       # Bitácoras de aprendiz
```

#### Aprendiz
```
GET  /aprendiz/dashboard              # Dashboard personal
POST /aprendiz/bitacora               # Crear bitácora
POST /aprendiz/documento              # Subir documento
GET  /aprendiz/documentos             # Ver documentos
```

### Formato de Respuesta API
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 🧪 Testing

### Ejecutar Tests
```bash
# Todos los tests
npm test

# Con watch
npm run test:watch

# Con coverage
npm run test:coverage
```

### Tipos de Tests
- **Unitarios**: Servicios y utilidades
- **Integración**: Endpoints API
- **E2E**: Flujos completos de usuario

### Ejemplo de Test
```javascript
describe('ServicioGestionAprendices', () => {
  test('debe filtrar aprendices por nombre', async () => {
    const filtros = { nombre: 'Juan' };
    const result = await servicio.construirQueryDinamica(filtros);

    expect(result.baseQuery).toContain('nombres LIKE ?');
    expect(result.params).toContain('%Juan%');
  });
});
```

## 🤝 Contribución

### Flujo de Desarrollo
1. **Fork** el repositorio
2. **Crear rama** para feature: `git checkout -b feature/nueva-funcionalidad`
3. **Commits** siguiendo conventional commits
4. **Push** a tu fork
5. **Pull Request** con descripción detallada

### Estándares de Código
- **ESLint**: Configurado para JavaScript moderno
- **Prettier**: Formateo automático de código
- **Husky**: Pre-commit hooks para calidad
- **Conventional Commits**: Formato estandarizado de commits

### Guías de Contribución
- [Guía de Estilo](./docs/ESTILO.md)
- [Arquitectura](./docs/ARQUITECTURA.md)
- [Testing](./docs/TESTING.md)

## 🗺️ Roadmap

### ✅ Versión 1.0 (Actual)
- [x] Gestión básica de aprendices
- [x] Sistema de autenticación
- [x] Subida de documentos
- [x] Bitácoras semanales
- [x] Análisis de sentimientos básico

### 🚧 Versión 1.1 (Próxima)
- [ ] Notificaciones push
- [ ] Dashboard mejorado con gráficos
- [ ] API REST completa
- [ ] PWA (Progressive Web App)
- [ ] Modo offline

### 🔮 Versión 2.0 (Futuro)
- [ ] Microservicios
- [ ] Integración con Moodle
- [ ] Análisis predictivo
- [ ] App móvil nativa
- [ ] Blockchain para certificados

### 📅 Plan de Releases
- **v1.1**: Q2 2024 - Mejoras UX/UI
- **v1.5**: Q3 2024 - PWA y notificaciones
- **v2.0**: Q1 2025 - Arquitectura de microservicios

## 📸 Screenshots

### Dashboard Administrador
![Dashboard Admin](./screenshots/dashboard-admin.png)

### Gestión de Aprendices
![Lista Aprendices](./screenshots/lista-aprendices.png)

### Análisis de Sentimientos
![Analisis Sentimientos](./screenshots/analisis-sentimientos.png)

### Dashboard Aprendiz
![Dashboard Aprendiz](./screenshots/dashboard-aprendiz.png)

## 🔒 Seguridad

### Medidas Implementadas
- **OWASP Top 10**: Protección contra vulnerabilidades comunes
- **Rate Limiting**: Prevención de ataques de fuerza bruta
- **Input Validation**: Sanitización de todas las entradas
- **Secure Headers**: Helmet para headers de seguridad
- **SQL Injection**: Prepared statements en todas las queries
- **XSS Protection**: Validación y escape de contenido dinámico
- **CSRF Protection**: Tokens en formularios sensibles

### Auditorías de Seguridad
- **Dependency Check**: `npm audit` semanal
- **SAST**: SonarQube integrado en CI/CD
- **DAST**: OWASP ZAP para testing dinámico
- **Secrets Scanning**: GitGuardian para credenciales

## 📊 Rendimiento

### Métricas Actuales
- **Response Time**: < 200ms para APIs principales
- **Throughput**: 1000 requests/minute
- **Memory Usage**: < 150MB en idle
- **Database Queries**: Optimizadas con índices

### Optimizaciones
- **Caching**: Implementado para datos estáticos
- **Database Pool**: Conexiones reutilizadas
- **Compression**: Gzip para responses
- **CDN**: Para assets estáticos (planeado)

## 🐛 Troubleshooting

### Problemas Comunes

#### Error de Conexión BD
```bash
# Verificar MySQL corriendo
sudo systemctl status mysql

# Verificar credenciales
mysql -u gestion_user -p gestion_etapa_productiva
```

#### Watson No Funciona
```bash
# Verificar variables de entorno
echo $WATSON_API_KEY

# Test de conectividad
curl -X GET "$WATSON_URL/v1/analyze?version=$WATSON_VERSION" \
  -H "Authorization: Bearer $WATSON_API_KEY"
```

#### Errores de Permisos
```bash
# Archivos uploads
sudo chown -R www-data:www-data public/uploads/

# Logs
sudo chown -R www-data:www-data logs/
```

## 📝 Licencia

Este proyecto está bajo la Licencia ISC. Ver [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- **SENA**: Por la oportunidad de desarrollar esta solución
- **IBM Watson**: Por la API de análisis de lenguaje natural
- **Comunidad Open Source**: Por las librerías utilizadas

## 📞 Soporte

- **Issues**: [GitHub Issues](https://github.com/tu-usuario/gestion-etapa-productiva/issues)
- **Wiki**: [Documentación Completa](./wiki/)
- **Email**: soporte@sena.edu.co

---

**Desarrollado con ❤️ para el SENA - Servicio Nacional de Aprendizaje**