// Script para generar una colección completa de Postman con usuarios de prueba
// Incluye aprendices, administradores y login
// Uso: node scripts/generar_coleccion_postman_completa.js [cantidad_aprendices] [cantidad_admins]

const fs = require('fs');
const path = require('path');

// Importar el generador de aprendices existente
const { generarAprendiz } = require('./generar_datos_prueba.js');

// Datos para generar administradores
const nombresAdmin = [
    'CARLOS RODRÍGUEZ', 'ANA GONZÁLEZ', 'LUIS MARTÍNEZ', 'MARÍA LÓPEZ',
    'JORGE PÉREZ', 'PATRICIA GARCÍA', 'RICARDO HERNÁNDEZ', 'LAURA DÍAZ',
    'FERNANDO MORENO', 'CLAUDIA JIMÉNEZ'
];

const cargosAdmin = [
    'COORDINADOR ACADÉMICO', 'INSTRUCTOR ESPECIALISTA', 'JEFE DE ÁREA',
    'COORDINADOR DE SEGUIMIENTO', 'INSTRUCTOR LÍDER', 'SUBDIRECTOR',
    'COORDINADOR DE BIENESTAR', 'INSTRUCTOR SENIOR', 'JEFE DE PROGRAMA',
    'COORDINADOR DE PRÁCTICAS'
];

const departamentosAdmin = [
    'ACADÉMICO', 'FORMACIÓN PROFESIONAL', 'BIENESTAR ESTUDIANTIL',
    'SEGUIMIENTO A EGRESADOS', 'PRÁCTICAS EMPRESARIALES', 'COORDINACIÓN',
    'SISTEMAS', 'ADMINISTRACIÓN', 'CALIDAD', 'INVESTIGACIÓN'
];

// Función para generar un administrador aleatorio
function generarAdministrador(index) {
    const nombreCompleto = nombresAdmin[index % nombresAdmin.length];
    const nombres = nombreCompleto.split(' ')[0];
    const apellidos = nombreCompleto.split(' ').slice(1).join(' ');
    
    return {
        nombreCompleto: nombreCompleto,
        correoInstitucional: `${nombres.toLowerCase()}.${apellidos.toLowerCase().replace(' ', '')}@sena.edu.co`,
        numeroIdentificacion: `10${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`,
        telefono: `3${Math.floor(Math.random() * 899999999 + 100000000)}`,
        departamento: departamentosAdmin[Math.floor(Math.random() * departamentosAdmin.length)],
        cargo: cargosAdmin[Math.floor(Math.random() * cargosAdmin.length)],
        contrasena: 'AdminSena2025*',
        confirmarContrasena: 'AdminSena2025*'
    };
}

// Función principal para generar la colección
function generarColeccionCompleta(cantidadAprendices = 1, cantidadAdmins = 20) {
    console.log(`Generando colección completa con ${cantidadAprendices} aprendices y ${cantidadAdmins} administradores...`);
    
    // Generar aprendices
    const aprendices = [];
    for (let i = 0; i < cantidadAprendices; i++) {
        aprendices.push(generarAprendiz(i));
    }
    
    // Generar administradores
    const administradores = [];
    for (let i = 0; i < cantidadAdmins; i++) {
        administradores.push(generarAdministrador(i));
    }
    
    // Crear la colección de Postman
    const collection = {
        info: {
            name: "Sistema Gestión Etapa Productiva - Datos de Prueba",
            description: "Colección completa para insertar usuarios de prueba y probar endpoints del sistema",
            schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        variable: [
            {
                key: "base_url",
                value: "http://localhost:3000",
                type: "string"
            }
        ],
        item: [
            // Carpeta de Administradores
            {
                name: "👤 Administradores",
                item: [
                    // Login Admin
                    {
                        name: "🔐 Login Administrador",
                        request: {
                            method: "POST",
                            header: [
                                {
                                    key: "Content-Type",
                                    value: "application/json"
                                }
                            ],
                            body: {
                                mode: "raw",
                                raw: JSON.stringify({
                                    email: "admin1@sena.edu.co",
                                    password: "AdminSena2025*",
                                    role: "admin"
                                }, null, 2)
                            },
                            url: {
                                raw: "{{base_url}}/auth/login",
                                host: ["{{base_url}}"],
                                path: ["auth", "login"]
                            }
                        }
                    },
                    // Crear administradores completos
                    ...administradores.map((admin, index) => ({
                        name: `➕ Registrar Admin ${index + 1} - ${admin.nombreCompleto}`,
                        request: {
                            method: "POST",
                            header: [
                                {
                                    key: "Content-Type",
                                    value: "application/json"
                                }
                            ],
                            body: {
                                mode: "raw",
                                raw: JSON.stringify(admin, null, 2)
                            },
                            url: {
                                raw: "{{base_url}}/registrar-administrador",
                                host: ["{{base_url}}"],
                                path: ["registrar-administrador"]
                            }
                        }
                    }))
                ]
            },
            // Carpeta de Aprendices
            {
                name: "🎓 Aprendices",
                item: [
                    // Registrar aprendices
                    ...aprendices.map((aprendiz, index) => ({
                        name: `➕ Registrar Aprendiz ${index + 1} - ${aprendiz.nombres} ${aprendiz.primerApellido}`,
                        request: {
                            method: "POST",
                            header: [
                                {
                                    key: "Content-Type",
                                    value: "application/json"
                                }
                            ],
                            body: {
                                mode: "raw",
                                raw: JSON.stringify(aprendiz, null, 2)
                            },
                            url: {
                                raw: "{{base_url}}/registrar-aprendiz",
                                host: ["{{base_url}}"],
                                path: ["registrar-aprendiz"]
                            }
                        }
                    })),
                    // Crear contraseñas para aprendices
                    ...aprendices.slice(0, 3).map((aprendiz, index) => ({
                        name: `🔑 Crear Contraseña Aprendiz ${index + 1} - ${aprendiz.nombres}`,
                        request: {
                            method: "POST",
                            header: [
                                {
                                    key: "Content-Type",
                                    value: "application/json"
                                }
                            ],
                            body: {
                                mode: "raw",
                                raw: JSON.stringify({
                                    password: "AprendizSena2025*",
                                    confirmPassword: "AprendizSena2025*",
                                    correoElectronico: aprendiz.correoElectronico
                                }, null, 2)
                            },
                            url: {
                                raw: "{{base_url}}/crear-password",
                                host: ["{{base_url}}"],
                                path: ["crear-password"]
                            }
                        }
                    })),
                    // Login Aprendiz (después de crear contraseña)
                    {
                        name: "🔐 Login Aprendiz",
                        request: {
                            method: "POST",
                            header: [
                                {
                                    key: "Content-Type",
                                    value: "application/json"
                                }
                            ],
                            body: {
                                mode: "raw",
                                raw: JSON.stringify({
                                    email: aprendices[0]?.correoElectronico || "aprendiz1@sena.edu.co",
                                    password: "AprendizSena2025*",
                                    role: "aprendiz"
                                }, null, 2)
                            },
                            url: {
                                raw: "{{base_url}}/auth/login",
                                host: ["{{base_url}}"],
                                path: ["auth", "login"]
                            }
                        }
                    }
                ]
            },
            // Carpeta de Autenticación
            {
                name: "🔒 Autenticación",
                item: [
                    {
                        name: "🔓 Cerrar Sesión",
                        request: {
                            method: "GET",
                            header: [],
                            url: {
                                raw: "{{base_url}}/auth/logout",
                                host: ["{{base_url}}"],
                                path: ["auth", "logout"]
                            }
                        }
                    },
                    {
                        name: "📋 Selección de Rol",
                        request: {
                            method: "GET",
                            header: [],
                            url: {
                                raw: "{{base_url}}/",
                                host: ["{{base_url}}"],
                                path: [""]
                            }
                        }
                    }
                ]
            },
            // Carpeta de Testing - Endpoints útiles
            {
                name: "🧪 Testing",
                item: [
                    {
                        name: "📊 Panel Administrador",
                        request: {
                            method: "GET",
                            header: [],
                            url: {
                                raw: "{{base_url}}/administrador/panel-principal",
                                host: ["{{base_url}}"],
                                path: ["administrador", "panel-principal"]
                            }
                        }
                    },
                    {
                        name: "📊 Dashboard Aprendiz",
                        request: {
                            method: "GET",
                            header: [],
                            url: {
                                raw: "{{base_url}}/aprendiz/dashboard",
                                host: ["{{base_url}}"],
                                path: ["aprendiz", "dashboard"]
                            }
                        }
                    },
                    {
                        name: "📝 Listar Aprendices",
                        request: {
                            method: "GET",
                            header: [],
                            url: {
                                raw: "{{base_url}}/administrador/listar-aprendices",
                                host: ["{{base_url}}"],
                                path: ["administrador", "listar-aprendices"]
                            }
                        }
                    }
                ]
            }
        ]
    };
    
    return collection;
}

// Función para guardar la colección
function guardarColeccion(collection, cantidadAprendices, cantidadAdmins) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `coleccion_completa_${cantidadAprendices}aprendices_${cantidadAdmins}admins_${timestamp}.json`;
    const filepath = path.join(__dirname, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(collection, null, 2));
    console.log(`✅ Colección completa guardada en: ${filepath}`);
    return filepath;
}

// Función principal
function main() {
    const cantidadAprendices = process.argv[2] ? parseInt(process.argv[2]) : 5;
    const cantidadAdmins = process.argv[3] ? parseInt(process.argv[3]) : 3;
    
    if (isNaN(cantidadAprendices) || cantidadAprendices <= 0) {
        console.error('Error: La cantidad de aprendices debe ser un número positivo');
        process.exit(1);
    }
    
    if (isNaN(cantidadAdmins) || cantidadAdmins <= 0) {
        console.error('Error: La cantidad de administradores debe ser un número positivo');
        process.exit(1);
    }
    
    try {
        const collection = generarColeccionCompleta(cantidadAprendices, cantidadAdmins);
        const archivoGenerado = guardarColeccion(collection, cantidadAprendices, cantidadAdmins);
        
        console.log(`\n📋 Colección generada exitosamente:`);
        console.log(`   - ${cantidadAprendices} aprendices`);
        console.log(`   - ${cantidadAdmins} administradores completos`);
        console.log(`   - 2 administradores temporales`);
        console.log(`   - Endpoints de autenticación y testing`);
        
        console.log(`\n🚀 Para usar en Postman:`);
        console.log(`1. Importa el archivo JSON en Postman`);
        console.log(`2. Configura la variable de entorno "base_url" (por defecto: http://localhost:3000)`);
        console.log(`3. Ejecuta primero los administradores temporales`);
        console.log(`4. Registra los aprendices`);
        console.log(`5. Crea contraseñas para los aprendices registrados`);
        console.log(`6. Haz login con los usuarios creados`);
        console.log(`7. Prueba los dashboards correspondientes`);
        
        console.log(`\n💡 Credenciales de prueba:`);
        console.log(`   Admin: admin1@sena.edu.co / AdminSena2025*`);
        console.log(`   Aprendiz: [después de crear contraseña] / AprendizSena2025*`);
        console.log(`   Nota: Los aprendices deben registrarse → crear contraseña → hacer login`);
        
    } catch (error) {
        console.error('Error generando colección:', error.message);
        process.exit(1);
    }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
    main();
}

module.exports = {
    generarColeccionCompleta,
    generarAdministrador
};
