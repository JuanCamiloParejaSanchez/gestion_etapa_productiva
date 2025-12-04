// Ruta: src/servidor.js
// Propósito: Archivo principal de configuración del servidor y rutas

require('dotenv').config();

const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const setupMiddlewares = require('./compartido/middlewares/middlewareConfig');
const AuthMiddleware = require('./compartido/middlewares/middlewareAutenticacion');
const { logger, httpLoggerMiddleware } = require('./compartido/utilidades/logger');

// --- Importación de routers ---
const rutasRegistroAdministrador = require('./modulos/administrador/rutas/rutasRegistroAdministrador');
// Es crucial que estos archivos exporten un 'router' de Express

const rutasGestionAprendices = require('./modulos/administrador/rutas/rutasGestionAprendices');
const rutasAdministrador = require('./modulos/administrador/rutas/rutasAdministrador');
const rutasRegistroAprendiz = require('./modulos/aprendiz/rutas/rutasRegistroAprendiz');
const rutasAprendiz = require('./modulos/aprendiz/rutas/rutasAprendiz');
const rutasAutenticacion = require('./modulos/aprendiz/rutas/rutasAutenticacion');

// Importar el controlador de autenticación general, aunque no se usa directamente aquí, es una buena práctica.
const controladorAutenticacionGeneral = require('./modulos/compartido/controladores/controladorAutenticacionGeneral');

const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const fs = require('fs');

const app = express();


app.get('/test-login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/test/test-login.html'));
});





// Configuración de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.set('layout', 'plantillas/principal');
app.use(expressLayouts);

// Configuración de archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));


// Servir archivos de data
app.use('/data', express.static(path.join(__dirname, '../data')));

// Configuración de almacenamiento de sesiones MySQL
const mysqlOptions = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT),
  waitForConnections: true,
};

if (String(process.env.DB_SSL).toLowerCase() === 'true') {
  try {
    const caPath = process.env.DB_SSL_CA_PATH || '/home/site/wwwroot/DigiCertGlobalRootG2.crt.pem';
    if (fs.existsSync(caPath)) {
      mysqlOptions.ssl = { ca: fs.readFileSync(caPath, 'utf8') };
    }
  } catch (e) {
    console.error('Error cargando CA SSL para MySQL:', e && e.message ? e.message : e);
  }
}

const sessionStore = new MySQLStore(mysqlOptions);

// Configuración de sesiones
app.use(session({
  name: process.env.SESSION_NAME,
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: parseInt(process.env.COOKIE_MAX_AGE),
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Configuración de middlewares
setupMiddlewares(app);
app.use(httpLoggerMiddleware);

// Middleware de expiración de sesión por inactividad
app.use(AuthMiddleware.verificarExpiracionSesion);

// Middleware para cargar la información del usuario en res.locals
app.use(AuthMiddleware.cargarUsuario);

// --- Rutas públicas ---
const gestionAdministradoresControlador = require('./modulos/administrador/controladores/gestionAdministradoresControlador');
const gestionAprendicesControlador = require('./modulos/administrador/controladores/gestionAprendicesControlador');

// Ruta pública para obtener lista de administradores (para registro de aprendices)
app.get('/api/administradores', gestionAdministradoresControlador.obtenerListaAdministradores);

// Ruta pública para obtener opciones de filtros (para registro de aprendices)
app.get('/api/opciones-filtros', gestionAprendicesControlador.obtenerOpcionesFiltros);

// --- Uso de routers ---
// Rutas de registro de administradores (sin autenticación previa)
app.use('/', rutasRegistroAdministrador);
// Usa las rutas de registro de aprendiz
app.use('/', rutasRegistroAprendiz);

// Usa las rutas de autenticación general para /auth
// CORRECCIÓN: Usamos la variable 'rutasAutenticacion'
app.use('/auth', rutasAutenticacion);

// Ruta principal - Selección de rol para autenticación
app.get('/', (req, res) => {
  res.render('autenticacion/seleccionRol', {
    layout: 'plantillas/principal'
  });
});

// Rutas del módulo de aprendiz. Protegidas con el middleware de rol.
// Nota: 'rutasAprendiz' ya contiene el middleware 'validarSesionAprendiz'.
app.use('/aprendiz', rutasAprendiz);

// Rutas del módulo de administrador.
// CORRECCIÓN: Registrar primero las rutas específicas del administrador (incluye perfil)
app.use('/administrador', AuthMiddleware.validarSesionAdmin, rutasAdministrador);
// Luego las rutas de gestión de aprendices
app.use('/administrador', AuthMiddleware.validarSesionAdmin, rutasGestionAprendices);

// --- Manejo de errores ---

// --- Manejo de errores ---
// Manejo de errores 404 (debe ir al final de todas las rutas)
app.use((req, res) => {
    res.status(404).render('compartido/paginaError', {
        title: 'Error 404',
        message: 'Página no encontrada',
        error: {
            status: 404,
            description: 'La página que buscas no existe'
        },
        layout: 'plantillas/principal'
    });
});

// Manejo de errores generales (middleware de 4 argumentos)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).render('compartido/paginaError', {
        title: 'Error',
        message: err.message || 'Error interno del servidor',
        error: {
            status: err.status || 500,
            description: err.stack || err.message
        },
        layout: 'plantillas/principal'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Servidor corriendo en puerto ${PORT}`);
});
