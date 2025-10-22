// Script para generar datos de prueba masivos de aprendices
// Uso: node scripts/generar_datos_prueba.js

const fs = require('fs');
const path = require('path');

// Datos de ejemplo para generar información realista
const nombres = [
    'JUAN CARLOS', 'MARÍA JOSÉ', 'CARLOS ANDRÉS', 'ANA SOFÍA', 'DIEGO ALEJANDRO',
    'VALENTINA', 'SEBASTIÁN', 'ISABELLA', 'NICOLÁS', 'CAMILA',
    'DANIEL', 'LAURA', 'ALEJANDRO', 'GABRIELA', 'FELIPE',
    'DANIELA', 'CRISTIAN', 'PAULA', 'ANDRÉS', 'JULIANA',
    'DAVID', 'CAROLINA', 'JORGE', 'NATALIA', 'LUIS',
    'MARIANA', 'FERNANDO', 'VALERIA', 'RODRIGO', 'ALEJANDRA'
];

const apellidos = [
    'GONZÁLEZ', 'RODRÍGUEZ', 'PÉREZ', 'LÓPEZ', 'MARTÍNEZ',
    'GARCÍA', 'HERNÁNDEZ', 'DÍAZ', 'MORENO', 'JIMÉNEZ',
    'TORRES', 'RUIZ', 'SÁNCHEZ', 'RAMÍREZ', 'CRUZ',
    'FLORES', 'REYES', 'MORALES', 'ORTEGA', 'CASTILLO',
    'SILVA', 'VARGAS', 'ROMERO', 'NAVARRO', 'DOMÍNGUEZ',
    'GUERRERO', 'CORTÉS', 'HERRERA', 'VEGA', 'MOLINA'
];

const departamentos = [
    'ANTIOQUIA', 'CUNDINAMARCA', 'VALLE DEL CAUCA', 'ATLÁNTICO', 'SANTANDER',
    'BOLÍVAR', 'BOYACÁ', 'NARIÑO', 'CÓRDOBA', 'MAGDALENA'
];

const municipios = {
    'ANTIOQUIA': ['MEDELLÍN', 'BELLO', 'ENVIGADO', 'ITAGÜÍ', 'SABANETA'],
    'CUNDINAMARCA': ['BOGOTÁ', 'SOACHA', 'FACATATIVÁ', 'GIRARDOT', 'ZIPAQUIRÁ'],
    'VALLE DEL CAUCA': ['CALI', 'BUGA', 'PALMIRA', 'TULUÁ', 'CARTAGO'],
    'ATLÁNTICO': ['BARRANQUILLA', 'SOLEDAD', 'MALAMBO', 'SABANAGRANDE', 'GALAPA'],
    'SANTANDER': ['BUCARAMANGA', 'FLORIDABLANCA', 'GIRÓN', 'PIEDECUESTA', 'SAN GIL'],
    'BOLÍVAR': ['CARTAGENA', 'TURBACO', 'ARJONA', 'MAGANGUÉ', 'EL CARMEN'],
    'BOYACÁ': ['TUNJA', 'DUITAMA', 'SOGAMOSO', 'CHIQUINQUIRÁ', 'PAIPA'],
    'NARIÑO': ['PASTO', 'IPIALES', 'TUMACO', 'LA UNIÓN', 'SANDONÁ'],
    'CÓRDOBA': ['MONTERÍA', 'SAHAGÚN', 'LORICA', 'CERETÉ', 'PLANETA RICA'],
    'MAGDALENA': ['SANTA MARTA', 'CIÉNAGA', 'FUNDACIÓN', 'ARACATACA', 'EL BANCO']
};

const barrios = [
    'CENTRO', 'NORTE', 'SUR', 'ESTE', 'OESTE',
    'LA FLORESTA', 'EL PRADO', 'BELLAVISTA', 'SANTA RITA', 'LA SOLEDAD',
    'EL ROSARIO', 'SAN JOSÉ', 'LA CONCORDIA', 'EL CARMEN', 'SAN FRANCISCO',
    'LA LIBERTAD', 'EL RECREO', 'SAN ANTONIO', 'LA ESPERANZA', 'EL PARAÍSO'
];

const eps = [
    'SURA EPS', 'NUEVA EPS', 'FAMISANAR', 'SALUD TOTAL', 'COMPENSAR',
    'SANITAS', 'COOMEVA', 'MEDIMAS', 'FAMILIAR DE COLOMBIA', 'SALUD COLOMBIA',
    'COLSANITAS', 'SAVIA SALUD', 'EMSSANAR', 'CAPRECOM', 'COMFENALCO',
    'COMFAMA', 'COMFENALCO VALLE', 'COMFENALCO ANTIOQUIA', 'COMFENALCO SANTANDER', 'COMFENALCO ATLÁNTICO'
];

const empresas = [
    'EMPRESA COLOMBIANA DE PETRÓLEOS ECOPETROL S.A.',
    'BANCO DE BOGOTÁ S.A.',
    'BANCO POPULAR S.A.',
    'BANCO AV VILLAS S.A.',
    'BANCO OCCIDENTE DE COLOMBIA S.A.',
    'BANCO DAVIVIENDA S.A.',
    'BANCO COLOMBIA S.A.',
    'BANCO SANTANDER COLOMBIA S.A.',
    'BANCO BBVA COLOMBIA S.A.',
    'BANCO ITAÚ COLOMBIA S.A.',
    'GRUPO ÉXITO S.A.',
    'GRUPO AVAL ACCIONES Y VALORES S.A.',
    'GRUPO NUTRESA S.A.',
    'GRUPO ARGOS S.A.',
    'GRUPO SURA S.A.',
    'GRUPO BAVARIA S.A.',
    'GRUPO ENEL COLOMBIA S.A.',
    'GRUPO TELECOM S.A.',
    'GRUPO CEMENTOS ARGOS S.A.',
    'GRUPO ISA S.A.'
];

const areasPractica = [
    'ADMINISTRACIÓN', 'CONTABILIDAD', 'RECURSOS HUMANOS', 'MARKETING', 'VENTAS',
    'TECNOLOGÍA', 'SISTEMAS', 'DESARROLLO', 'SOPORTE TÉCNICO', 'REDES',
    'LOGÍSTICA', 'OPERACIONES', 'PRODUCCIÓN', 'CALIDAD', 'MANTENIMIENTO',
    'FINANZAS', 'AUDITORÍA', 'LEGAL', 'COMUNICACIONES', 'ATENCIÓN AL CLIENTE'
];

const instructores = [
    'MARÍA GONZÁLEZ', 'CARLOS RODRÍGUEZ', 'ANA PÉREZ', 'LUIS LÓPEZ', 'PATRICIA MARTÍNEZ',
    'JORGE GARCÍA', 'SANDRA HERNÁNDEZ', 'FERNANDO DÍAZ', 'CLAUDIA MORENO', 'ROBERTO JIMÉNEZ',
    'DIANA TORRES', 'MIGUEL RUIZ', 'LUCÍA SÁNCHEZ', 'ALEJANDRO RAMÍREZ', 'MARTA CRUZ',
    'EDUARDO FLORES', 'CARMEN REYES', 'HÉCTOR MORALES', 'GLORIA ORTEGA', 'RAFAEL CASTILLO'
];

// Función para generar un número de documento único
function generarNumeroDocumento() {
    return Math.floor(Math.random() * 90000000) + 10000000; // 8 dígitos
}

// Función para generar un número de celular
function generarCelular() {
    // Generar un número de 9 dígitos (100000000 a 999999999) y agregar '3' al inicio
    const numero = Math.floor(Math.random() * 900000000) + 100000000;
    return '3' + numero.toString(); // 10 dígitos total
}

// Función para generar un número de ficha
function generarNumeroFicha() {
    return Math.floor(Math.random() * 9000000) + 1000000; // 7 dígitos
}

// Función para generar una fecha aleatoria entre dos fechas
function fechaAleatoria(inicio, fin) {
    return new Date(inicio.getTime() + Math.random() * (fin.getTime() - inicio.getTime()));
}

// Función para generar un correo electrónico único
function generarCorreo(nombre, apellido, index) {
    const dominios = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'sena.edu.co'];
    const dominio = dominios[Math.floor(Math.random() * dominios.length)];
    const nombreLimpio = nombre.toLowerCase().replace(/\s+/g, '');
    const apellidoLimpio = apellido.toLowerCase();
    return `${nombreLimpio}.${apellidoLimpio}${index}@${dominio}`;
}

// Función para generar un aprendiz
function generarAprendiz(index) {
    const nombre = nombres[Math.floor(Math.random() * nombres.length)];
    const primerApellido = apellidos[Math.floor(Math.random() * apellidos.length)];
    const segundoApellido = Math.random() > 0.3 ? apellidos[Math.floor(Math.random() * apellidos.length)] : null;
    
    const departamento = departamentos[Math.floor(Math.random() * departamentos.length)];
    const municipio = municipios[departamento][Math.floor(Math.random() * municipios[departamento].length)];
    const barrio = barrios[Math.floor(Math.random() * barrios.length)];
    
    const fechaNacimiento = fechaAleatoria(new Date(1990, 0, 1), new Date(2005, 11, 31));
    const fechaInicioLectiva = fechaAleatoria(new Date(2023, 0, 1), new Date(2023, 11, 31));
    const fechaFinLectiva = new Date(fechaInicioLectiva.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 año después
    const fechaInicioProductiva = new Date(fechaFinLectiva.getTime() + (30 * 24 * 60 * 60 * 1000)); // 1 mes después
    const fechaFinProductiva = new Date(fechaInicioProductiva.getTime() + (6 * 30 * 24 * 60 * 60 * 1000)); // 6 meses después
    
    const alternativaSeleccionada = [
        'contrato de aprendizaje', 'pasantia', 'apoyo a entidades', 'vinculo laboral', 
        'proyectos productivos', 'monitoria', 'unidades productivas familiares'
    ][Math.floor(Math.random() * 7)];
    
    const programas = ['tec actividad física', 'tec entrenamiento deportivo', 'tec análisis y dllo software', 'tec proc pruebas software', 'tec programación de software'];
    const programaFormacion = programas[Math.floor(Math.random() * programas.length)];
    
    const aprendiz = {
        tipoDocumento: ['CC', 'TI', 'CE', 'PEP', 'PPT'][Math.floor(Math.random() * 5)],
        numeroDocumento: generarNumeroDocumento().toString(),
        estadoFormacion: ['Activo', 'Inactivo', 'Aplazado', 'Retirado'][Math.floor(Math.random() * 4)],
        nombres: nombre,
        primerApellido: primerApellido,
        segundoApellido: segundoApellido,
        fechaNacimiento: fechaNacimiento.toISOString().split('T')[0],
        eps: eps[Math.floor(Math.random() * eps.length)],
        telefonoFijo: Math.random() > 0.5 ? (Math.floor(Math.random() * 9000000) + 1000000).toString() : null,
        celular: generarCelular().toString(),
        direccion: `CRA ${Math.floor(Math.random() * 100) + 1} #${Math.floor(Math.random() * 100) + 1}-${Math.floor(Math.random() * 100) + 1}`,
        barrio: barrio,
        departamento: departamento,
        municipio: municipio,
        correoElectronico: generarCorreo(nombre, primerApellido, index),
        fechaInicioLectiva: fechaInicioLectiva.toISOString().split('T')[0],
        fechaFinLectiva: fechaFinLectiva.toISOString().split('T')[0],
        fechaInicioProductiva: fechaInicioProductiva.toISOString().split('T')[0],
        fechaFinProductiva: fechaFinProductiva.toISOString().split('T')[0],
        instructorLectiva: instructores[Math.floor(Math.random() * instructores.length)],
        instructorProductiva: instructores[Math.floor(Math.random() * instructores.length)],
        numeroFicha: generarNumeroFicha().toString(),
        programaFormacion: programaFormacion,
        alternativaSeleccionada: alternativaSeleccionada,
        areaFormacion: Math.random() > 0.3 ? 'si' : 'no',
        empresaPatrocinadora: Math.random() > 0.2 ? empresas[Math.floor(Math.random() * empresas.length)] : null,
        areaPractica: Math.random() > 0.2 ? areasPractica[Math.floor(Math.random() * areasPractica.length)] : null,
        jefeInmediato: Math.random() > 0.2 ? instructores[Math.floor(Math.random() * instructores.length)] : null,
        telefonoEmpresa: Math.random() > 0.2 ? (Math.floor(Math.random() * 9000000) + 1000000).toString() : null,
        celularEmpresa: Math.random() > 0.2 ? generarCelular().toString() : null,
        direccionEmpresa: Math.random() > 0.2 ? `CRA ${Math.floor(Math.random() * 100) + 1} #${Math.floor(Math.random() * 100) + 1}-${Math.floor(Math.random() * 100) + 1}` : null,
        correoEmpresa: Math.random() > 0.2 ? `empresa${index}@empresa.com` : null,
        horario: Math.random() > 0.2 ? `${Math.floor(Math.random() * 12) + 6}:00 - ${Math.floor(Math.random() * 12) + 12}:00` : null,
        estado: ['pendiente', 'activo', 'inactivo', 'bloqueado'][Math.floor(Math.random() * 4)]
    };
    
    return aprendiz;
}

// Función principal para generar datos
function generarDatosPrueba(cantidad = 50) {
    console.log(`Generando ${cantidad} registros de aprendices...`);
    
    const aprendices = [];
    const numerosDocumento = new Set();
    const correos = new Set();
    
    for (let i = 0; i < cantidad; i++) {
        let aprendiz;
        let intentos = 0;
        
        // Asegurar que no haya duplicados
        do {
            aprendiz = generarAprendiz(i + 1);
            intentos++;
        } while ((numerosDocumento.has(aprendiz.numeroDocumento) || correos.has(aprendiz.correoElectronico)) && intentos < 10);
        
        if (intentos < 10) {
            numerosDocumento.add(aprendiz.numeroDocumento);
            correos.add(aprendiz.correoElectronico);
            aprendices.push(aprendiz);
        }
    }
    
    return aprendices;
}

// Función para guardar en diferentes formatos
function guardarDatos(aprendices, formato = 'json') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    switch (formato) {
        case 'json':
            const jsonPath = path.join(__dirname, `datos_prueba_aprendices_${timestamp}.json`);
            fs.writeFileSync(jsonPath, JSON.stringify(aprendices, null, 2));
            console.log(`Datos guardados en: ${jsonPath}`);
            return jsonPath;
            
        case 'sql':
            const sqlPath = path.join(__dirname, `datos_prueba_aprendices_${timestamp}.sql`);
            let sqlContent = '-- Script de inserción de datos de prueba\n';
            sqlContent += '-- Generado automáticamente\n\n';
            
            aprendices.forEach(aprendiz => {
                const columns = Object.keys(aprendiz);
                const values = Object.values(aprendiz).map(val => 
                    val === null ? 'NULL' : `'${val}'`
                );
                sqlContent += `INSERT INTO aprendices (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
            });
            
            fs.writeFileSync(sqlPath, sqlContent);
            console.log(`Script SQL guardado en: ${sqlPath}`);
            return sqlPath;
            
        case 'postman':
            const postmanPath = path.join(__dirname, `postman_collection_${timestamp}.json`);
            const postmanCollection = {
                info: {
                    name: "Inserción Masiva Aprendices",
                    description: "Colección para insertar datos de prueba de aprendices",
                    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
                },
                item: aprendices.map((aprendiz, index) => ({
                    name: `Insertar Aprendiz ${index + 1} - ${aprendiz.nombres} ${aprendiz.primerApellido}`,
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
                }))
            };
            
            fs.writeFileSync(postmanPath, JSON.stringify(postmanCollection, null, 2));
            console.log(`Colección Postman guardada en: ${postmanPath}`);
            return postmanPath;
            
        default:
            throw new Error('Formato no soportado');
    }
}

// Función principal
function main() {
    const cantidad = process.argv[2] ? parseInt(process.argv[2]) : 50;
    const formato = process.argv[3] || 'json';
    
    if (isNaN(cantidad) || cantidad <= 0) {
        console.error('Error: La cantidad debe ser un número positivo');
        process.exit(1);
    }
    
    if (!['json', 'sql', 'postman'].includes(formato)) {
        console.error('Error: Formato debe ser json, sql o postman');
        process.exit(1);
    }
    
    try {
        const aprendices = generarDatosPrueba(cantidad);
        const archivoGenerado = guardarDatos(aprendices, formato);
        
        console.log(`\n✅ Se generaron ${aprendices.length} registros de aprendices exitosamente`);
        console.log(`📁 Archivo generado: ${archivoGenerado}`);
        
        if (formato === 'json') {
            console.log('\n📋 Para usar con Postman:');
            console.log('1. Importa el archivo JSON en Postman');
            console.log('2. Configura la variable de entorno "base_url" con tu URL del servidor');
            console.log('3. Ejecuta la colección');
        } else if (formato === 'sql') {
            console.log('\n📋 Para usar el script SQL:');
            console.log('1. Ejecuta el script en tu base de datos MySQL');
            console.log('2. Verifica que la tabla aprendices exista');
        }
        
    } catch (error) {
        console.error('Error generando datos:', error.message);
        process.exit(1);
    }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
    main();
}

module.exports = {
    generarDatosPrueba,
    guardarDatos,
    generarAprendiz
}; 