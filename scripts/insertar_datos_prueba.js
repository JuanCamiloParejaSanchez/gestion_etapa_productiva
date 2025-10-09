// Script para insertar datos de prueba directamente en la base de datos
// Uso: node scripts/insertar_datos_prueba.js [cantidad]

const { generarDatosPrueba } = require('./generar_datos_prueba');
const { pool } = require('../src/configuracion/baseDatos');

async function insertarDatosPrueba(cantidad = 50) {
    console.log(`🔄 Iniciando inserción de ${cantidad} registros de aprendices...`);
    
    try {
        // Generar datos de prueba
        const aprendices = generarDatosPrueba(cantidad);
        
        // Verificar conexión a la base de datos
        await pool.query('SELECT 1');
        console.log('✅ Conexión a la base de datos establecida');
        
        let exitosos = 0;
        let fallidos = 0;
        
        // Insertar cada aprendiz
        for (let i = 0; i < aprendices.length; i++) {
            const aprendiz = aprendices[i];
            
            try {
                // Preparar la consulta
                const columns = Object.keys(aprendiz);
                const values = Object.values(aprendiz);
                const placeholders = columns.map(() => '?').join(', ');
                
                const query = `INSERT INTO aprendices (${columns.join(', ')}) VALUES (${placeholders})`;
                
                // Ejecutar la inserción
                const [resultado] = await pool.query(query, values);
                
                if (resultado && resultado.insertId) {
                    exitosos++;
                    console.log(`✅ Aprendiz ${i + 1}/${aprendices.length}: ${aprendiz.nombres} ${aprendiz.primerApellido} - ID: ${resultado.insertId}`);
                } else {
                    fallidos++;
                    console.log(`❌ Aprendiz ${i + 1}/${aprendices.length}: Error al insertar`);
                }
                
                // Pequeña pausa para no sobrecargar la base de datos
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                fallidos++;
                console.log(`❌ Aprendiz ${i + 1}/${aprendices.length}: ${error.message}`);
            }
        }
        
        console.log('\n📊 RESUMEN DE INSERCIÓN:');
        console.log(`✅ Registros exitosos: ${exitosos}`);
        console.log(`❌ Registros fallidos: ${fallidos}`);
        console.log(`📈 Total procesados: ${aprendices.length}`);
        
        if (exitosos > 0) {
            console.log('\n🎉 ¡Inserción completada exitosamente!');
            console.log('💡 Ahora puedes probar los filtros y funcionalidades del sistema');
        }
        
    } catch (error) {
        console.error('❌ Error durante la inserción:', error.message);
        process.exit(1);
    } finally {
        // Cerrar la conexión
        await pool.end();
    }
}

// Función principal
function main() {
    const cantidad = process.argv[2] ? parseInt(process.argv[2]) : 50;
    
    if (isNaN(cantidad) || cantidad <= 0) {
        console.error('❌ Error: La cantidad debe ser un número positivo');
        console.log('💡 Uso: node scripts/insertar_datos_prueba.js [cantidad]');
        console.log('💡 Ejemplo: node scripts/insertar_datos_prueba.js 25');
        process.exit(1);
    }
    
    console.log(`🚀 Iniciando inserción de ${cantidad} aprendices de prueba...`);
    console.log('⚠️  Asegúrate de que tu servidor de base de datos esté ejecutándose\n');
    
    insertarDatosPrueba(cantidad);
}

// Ejecutar si es el archivo principal
if (require.main === module) {
    main();
}

module.exports = { insertarDatosPrueba }; 