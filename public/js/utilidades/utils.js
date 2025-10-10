// Ruta: public/js/utils.js
// Propósito: Funciones de utilidad generales para toda la aplicación.
// Maneja mensajes y validaciones básicas que se usan en múltiples partes.

// Sistema de mensajes
function showMessage(message, type) {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) return;

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type=button class=btn-close data-bs-dismiss=alert"></button>
    `;

    messageContainer.appendChild(alertDiv);

    setTimeout(() => {
        if (alertDiv && alertDiv.parentNode) {
            alertDiv.remove();
        }
    },5000);
}

// Funciones de mensaje específicas
function showSuccessMessage(message) {
    showMessage(message, 'success');
}

function showErrorMessage(message) {
    if (typeof message === 'object') {
        message = message.message || 'Ha ocurrido un error. Por favor, inténtelo de nuevo.';
    }
    showMessage(message, 'danger');
}

// Validaciones básicas
const validaciones = {
    esEmailValido: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    esDocumentoValido: (documento) => /^\d{8,12}$/.test(documento),
    esTelefonoValido: (telefono) => /^\d{7,10}$/.test(telefono),
    esFechaValida: (fecha) => !isNaN(Date.parse(fecha))
};

// Error handling global
window.addEventListener('error', function(e) {
    console.error('Error global:', e);
    showErrorMessage('Ha ocurrido un error en la aplicación');
}); 

// Exportar funciones para uso como módulos
export { showSuccessMessage, showErrorMessage, validaciones };