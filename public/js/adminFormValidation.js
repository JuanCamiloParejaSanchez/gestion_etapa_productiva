// public/js/adminFormValidation.js
// Propósito: Maneja la validación y envío del formulario de registro de administradores

import { validacionesUI, MESSAGES } from './utilidades/validacionesUI.js';

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('adminForm');

    // Validaciones en tiempo real
    const fieldsToValidate = {
        nombreCompleto: { validacion: val => val.trim().length >= 5, mensaje: 'El nombre completo debe tener al menos 5 caracteres' },
        correoInstitucional: { validacion: validacionesUI.correoElectronico, mensaje: 'Correo electrónico inválido' },
        numeroIdentificacion: { validacion: val => validacionesUI.soloNumeros(val) && validacionesUI.numeroDocumento(val), mensaje: 'Solo números, entre 7 y 12 dígitos' },
        telefono: { validacion: val => validacionesUI.soloNumeros(val) && validacionesUI.celular(val), mensaje: 'Solo números, exactamente 10 dígitos' },
        departamento: { validacion: val => val.trim().length >= 3, mensaje: 'El departamento debe tener al menos 3 caracteres' },
        cargo: { validacion: val => val.trim().length >= 3, mensaje: 'El cargo debe tener al menos 3 caracteres' }
    };

    Object.entries(fieldsToValidate).forEach(([fieldId, validation]) => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', () => {
                if (field.value.trim() === '') {
                    // Campo vacío - mostrar error para campos obligatorios
                    validacionesUI.mostrarError(field, 'Este campo es obligatorio');
                } else if (!validation.validacion(field.value)) {
                    validacionesUI.mostrarError(field, validation.mensaje);
                } else {
                    validacionesUI.mostrarExito(field);
                }
            });
            field.addEventListener('focus', () => {
                validacionesUI.limpiarError(field);
            });
        }
    });

    // Prevenir entrada de caracteres no numéricos en campos numéricos
    const camposNumericos = ['numeroIdentificacion', 'telefono'];
    camposNumericos.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.addEventListener('input', (e) => {
                // Remover caracteres no numéricos
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });
        }
    });

    // Validar campos requeridos al enviar
    async function validateForm() {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                validacionesUI.mostrarError(field, MESSAGES.REQUIRED);
            } else {
                validacionesUI.mostrarExito(field);
            }
        });
        // Validaciones específicas
        Object.entries(fieldsToValidate).forEach(([fieldId, validation]) => {
            const field = form.querySelector(`#${fieldId}`);
            if (field && field.value) {
                if (!validation.validacion(field.value)) {
                    isValid = false;
                    validacionesUI.mostrarError(field, validation.mensaje);
                } else {
                    validacionesUI.mostrarExito(field);
                }
            }
        });
        return isValid;
    }

    // Manejar envío del formulario
    async function handleSubmit(event) {
        event.preventDefault();
        console.log('Iniciando envío del formulario de administrador');

        if (!await validateForm()) {
            validacionesUI.mostrarError(form, 'Por favor, corrija los errores en el formulario');
            return;
        }

        try {
            const formData = new FormData(form);
            const jsonData = Object.fromEntries(formData);
            console.log('Datos a enviar:', jsonData);

            const response = await fetch('/registrar-administrador', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(jsonData)
            });

            let result;
            try {
                result = await response.json();
            } catch (parseError) {
                console.error('Error al parsear respuesta JSON:', parseError);
                throw new Error('Error en la respuesta del servidor');
            }

            if (response.ok && result.success) {
                // Mostrar modal de éxito
                const modal = new bootstrap.Modal(document.getElementById('modalRegistroExitosoAdmin'));
                modal.show();
            } else {
                // Mostrar error específico del servidor
                throw new Error(result.message || `Error del servidor (${response.status})`);
            }
        } catch (error) {
            console.error('Error:', error);
            
            // Mostrar error en el formulario
            validacionesUI.mostrarMensajeError(form, error.message || 'Error al procesar el formulario');
        }
    }

    // Event listeners
    form.addEventListener('submit', handleSubmit);

    // Normalizar inputs a mayúsculas en frontend (EXCEPTO EMAIL)
    const upperCaseInputs = document.querySelectorAll('input[type="text"], input[type="tel"]');
    upperCaseInputs.forEach(input => {
        input.style.textTransform = 'uppercase';
        input.addEventListener('input', function() {
            this.value = this.value.toUpperCase();
        });
    });

    // Manejar email por separado (convertir a minúsculas)
    const emailInput = document.querySelector('input[type="email"]');
    if (emailInput) {
        emailInput.style.textTransform = 'lowercase';
        emailInput.addEventListener('input', function() {
            this.value = this.value.toLowerCase();
        });
    }
}); 