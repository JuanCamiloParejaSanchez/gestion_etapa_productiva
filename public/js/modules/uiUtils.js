// Módulo de utilidades de interfaz de usuario
const UIUtils = {
    // Mostrar alertas con SweetAlert2
    showAlert: function(type, title, message, options = {}) {
        const defaultOptions = {
            icon: type,
            title: title,
            text: message,
            confirmButtonText: 'Aceptar',
            ...options
        };

        return Swal.fire(defaultOptions);
    },

    // Mostrar confirmación
    showConfirm: function(title, message, options = {}) {
        const defaultOptions = {
            icon: 'question',
            title: title,
            text: message,
            showCancelButton: true,
            confirmButtonText: 'Sí',
            cancelButtonText: 'No',
            ...options
        };

        return Swal.fire(defaultOptions);
    },

    // Mostrar loading
    showLoading: function(message = 'Cargando...') {
        Swal.fire({
            title: message,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    },

    // Ocultar loading
    hideLoading: function() {
        Swal.close();
    },

    // Mostrar notificación toast
    showToast: function(type, message, options = {}) {
        const defaultOptions = {
            icon: type,
            title: message,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            ...options
        };

        return Swal.fire(defaultOptions);
    },

    // Validar formulario básico
    validateForm: function(formSelector) {
        const form = document.querySelector(formSelector);
        if (!form) return false;

        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                this.showFieldError(field, 'Este campo es requerido');
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });

        return isValid;
    },

    // Mostrar error en campo
    showFieldError: function(field, message) {
        field.classList.add('is-invalid');

        let errorElement = field.parentNode.querySelector('.invalid-feedback');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'invalid-feedback';
            field.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    },

    // Limpiar error de campo
    clearFieldError: function(field) {
        field.classList.remove('is-invalid');
        const errorElement = field.parentNode.querySelector('.invalid-feedback');
        if (errorElement) {
            errorElement.remove();
        }
    },

    // Formatear fecha para display
    formatDate: function(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // Formatear número con separadores
    formatNumber: function(number) {
        return new Intl.NumberFormat('es-ES').format(number);
    },

    // Copiar al portapapeles
    copyToClipboard: async function(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('success', 'Copiado al portapapeles');
            return true;
        } catch (error) {
            console.error('Error al copiar:', error);
            this.showToast('error', 'Error al copiar');
            return false;
        }
    },

    // Descargar archivo
    downloadFile: function(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    // Toggle clase
    toggleClass: function(element, className) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.classList.toggle(className);
        }
    },

    // Agregar event listener con delegación
    addDelegatedEvent: function(parentSelector, childSelector, event, handler) {
        const parent = document.querySelector(parentSelector);
        if (parent) {
            parent.addEventListener(event, function(e) {
                if (e.target.matches(childSelector) || e.target.closest(childSelector)) {
                    handler.call(e.target, e);
                }
            });
        }
    }
};

// Exportar módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIUtils;
} else {
    window.UIUtils = UIUtils;
}