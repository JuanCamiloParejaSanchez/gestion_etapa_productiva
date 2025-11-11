// Script de prueba para verificar filtros dinámicos
// Ejecutar desde la consola del navegador en cualquier página de administrador

async function probarFiltrosDinamicos() {
    console.log('🧪 Iniciando prueba de filtros dinámicos...\n');
    
    try {
        // 1. Probar endpoint
        console.log('📡 Paso 1: Probando endpoint /administrador/opciones-filtros');
        const response = await fetch('/administrador/opciones-filtros');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Respuesta recibida:', data);
        
        // 2. Validar estructura
        console.log('\n📋 Paso 2: Validando estructura de datos');
        if (!data.success) {
            console.error('❌ Error: success = false');
            return;
        }
        
        if (!data.data || !data.data.programas || !data.data.alternativas) {
            console.error('❌ Error: Estructura de datos incorrecta');
            return;
        }
        
        console.log('✅ Estructura válida');
        
        // 3. Mostrar estadísticas
        console.log('\n📊 Paso 3: Estadísticas');
        console.log(`   Programas encontrados: ${data.data.programas.length}`);
        console.log(`   Alternativas encontradas: ${data.data.alternativas.length}`);
        
        // 4. Mostrar datos
        console.log('\n📚 Paso 4: Datos obtenidos');
        console.log('   Programas:');
        data.data.programas.forEach((p, i) => {
            console.log(`      ${i + 1}. ${p.label} (${p.value})`);
        });
        
        console.log('\n   Alternativas:');
        data.data.alternativas.forEach((a, i) => {
            console.log(`      ${i + 1}. ${a.label} (${a.value})`);
        });
        
        // 5. Verificar elementos en la página
        console.log('\n🔍 Paso 5: Verificando elementos del DOM');
        const programaSelect = document.getElementById('programaBusqueda');
        const alternativaSelect = document.getElementById('alternativaBusqueda');
        
        if (programaSelect) {
            console.log(`✅ Select de programas encontrado (${programaSelect.options.length} opciones)`);
        } else {
            console.log('⚠️  Select de programas no encontrado en esta página');
        }
        
        if (alternativaSelect) {
            console.log(`✅ Select de alternativas encontrado (${alternativaSelect.options.length} opciones)`);
        } else {
            console.log('⚠️  Select de alternativas no encontrado en esta página');
        }
        
        console.log('\n✨ Prueba completada exitosamente!\n');
        return data;
        
    } catch (error) {
        console.error('\n❌ Error durante la prueba:', error);
        console.error('Detalles:', error.message);
    }
}

// Ejecutar prueba automáticamente
console.log('%c🚀 Script de prueba de filtros dinámicos cargado', 'color: #00ff00; font-weight: bold; font-size: 14px;');
console.log('%cEjecuta: probarFiltrosDinamicos()', 'color: #00aaff; font-size: 12px;');

// Auto-ejecutar si estamos en la página correcta
if (window.location.pathname.includes('/administrador/')) {
    setTimeout(() => {
        console.log('\n%c⚡ Auto-ejecutando prueba...', 'color: #ffaa00; font-weight: bold;');
        probarFiltrosDinamicos();
    }, 1000);
}
