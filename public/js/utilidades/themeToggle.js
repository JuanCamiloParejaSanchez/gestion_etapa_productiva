// Ruta: public/js/utilidades/themeToggle.js
// Propósito: Gestión del tema oscuro/claro de la aplicación

(function() {
    'use strict';

    // Función directa para cambiar el tema
    function toggleTheme() {
        const button = document.querySelector('.theme-toggle-btn');
        const isDark = document.documentElement.classList.contains('dark-mode');

        if (isDark) {
            // Cambiar a tema claro
            document.documentElement.classList.remove('dark-mode');
            if (button) button.innerHTML = '<i class="fas fa-sun"></i>';
            try {
                localStorage.setItem('sena-theme-preference', 'light');
            } catch (e) {
                console.warn('No se pudo guardar la preferencia de tema');
            }
            console.log('🌞 Cambiado a tema claro');
        } else {
            // Cambiar a tema oscuro
            document.documentElement.classList.add('dark-mode');
            if (button) button.innerHTML = '<i class="fas fa-moon"></i>';
            try {
                localStorage.setItem('sena-theme-preference', 'dark');
            } catch (e) {
                console.warn('No se pudo guardar la preferencia de tema');
            }
            console.log('🌙 Cambiado a tema oscuro');
        }
    }

    // Función para crear el botón de toggle
    function createThemeButton() {
        // Verificar si ya existe el botón
        if (document.querySelector('.theme-toggle-btn')) {
            console.log('El botón de tema ya existe');
            return;
        }

        console.log('Creando botón de tema...');

        const button = document.createElement('button');
        button.className = 'theme-toggle-btn';
        const isDark = document.documentElement.classList.contains('dark-mode');
        button.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        button.title = 'Cambiar tema';

        // Event listener directo
        button.addEventListener('click', function(e) {
            console.log('🎯 Botón de tema clickeado');
            console.log('🌙 Estado actual:', document.documentElement.classList.contains('dark-mode') ? 'oscuro' : 'claro');

            toggleTheme();

            console.log('🌙 Nuevo estado:', document.documentElement.classList.contains('dark-mode') ? 'oscuro' : 'claro');
        });

        // Insertar al final del body (los estilos se aplican desde CSS)
        document.body.appendChild(button);

        console.log('✅ Botón de tema creado exitosamente');
        console.log('📍 Posición del botón:', button.getBoundingClientRect());
    }

    // Inicializar el botón cuando el DOM esté listo
    function init() {
        console.log('🚀 Inicializando sistema de tema...');

        // Cargar tema guardado
        try {
            const savedTheme = localStorage.getItem('sena-theme-preference');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

            if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
                document.documentElement.classList.add('dark-mode');
                console.log('🌙 Tema oscuro aplicado desde preferencia guardada');
            }
        } catch (e) {
            console.warn('No se pudo cargar la preferencia de tema');
        }

        // Crear el botón
        createThemeButton();
    }

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();