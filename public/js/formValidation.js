// public/js/formValidation.js
// Propósito: Maneja la validación y envío del formulario de registro de aprendices

import { validacionesUI, MESSAGES } from './utilidades/validacionesUI.js';

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('aprendizForm');

    // Validaciones en tiempo real - TODOS LOS CAMPOS
    const fieldsToValidate = {
        // Datos Personales
        nombres: { validacion: val => val.trim().length >= 2, mensaje: 'El nombre debe tener al menos 2 caracteres' },
        primerApellido: { validacion: val => val.trim().length >= 2, mensaje: 'El apellido debe tener al menos 2 caracteres' },
        segundoApellido: { validacion: val => val.trim().length >= 2 || val.trim() === '', mensaje: 'El apellido debe tener al menos 2 caracteres' },
        tipoDocumento: { validacion: val => val !== '' && val !== 'SELECCIONE...', mensaje: MESSAGES.REQUIRED },
        genero: { validacion: val => val !== '' && val !== 'SELECCIONE...', mensaje: MESSAGES.REQUIRED },
        numeroDocumento: { validacion: val => /^\d{7,10}$/.test(val), mensaje: 'El número de documento debe tener entre 7 y 10 dígitos' },
        fechaNacimiento: { validacion: val => validacionesUI.fechaNacimiento(val), mensaje: MESSAGES.INVALID_AGE },
        eps: { validacion: val => val !== '' && val !== 'SELECCIONE...', mensaje: MESSAGES.REQUIRED },
        
        // Datos de Ubicación
        telefonoFijo: { validacion: val => val === '' || validacionesUI.telefonoFijo(val), mensaje: 'Teléfono fijo inválido (7-10 dígitos)' },
        celular: { validacion: val => validacionesUI.celular(val), mensaje: MESSAGES.INVALID_PHONE },
        direccion: { validacion: val => val.trim().length >= 5, mensaje: 'La dirección debe tener al menos 5 caracteres' },
        barrio: { validacion: val => val.trim().length >= 2, mensaje: 'El barrio debe tener al menos 2 caracteres' },
        departamento: { validacion: val => val !== '' && val !== 'SELECCIONE...', mensaje: MESSAGES.REQUIRED },
        municipio: { validacion: val => val !== '' && val !== 'SELECCIONE UN MUNICIPIO...', mensaje: MESSAGES.REQUIRED },
        correoElectronico: { validacion: val => validacionesUI.correoElectronico(val), mensaje: MESSAGES.INVALID_EMAIL },
        
        // Datos de la Formación
        fechaInicioLectiva: { validacion: val => validacionesUI.fechaValida(val), mensaje: 'Fecha inválida' },
        fechaFinLectiva: { validacion: val => validacionesUI.fechaValida(val), mensaje: 'Fecha inválida' },
        instructorLectiva: { validacion: val => val.trim().length >= 3, mensaje: 'El nombre debe tener al menos 3 caracteres' },
        instructorProductiva: { validacion: val => val.trim().length >= 3, mensaje: 'El nombre debe tener al menos 3 caracteres' },
        numeroFicha: { validacion: val => /^\d{1,10}$/.test(val), mensaje: 'Número de ficha inválido' },
        programaFormacion: { validacion: val => val !== '' && val !== 'SELECCIONE...', mensaje: MESSAGES.REQUIRED },
        
        // Datos de la Alternativa de Etapa Productiva
        alternativaSeleccionada: { validacion: val => val !== '' && val !== 'SELECCIONE...', mensaje: MESSAGES.REQUIRED },
        areaFormacion: { validacion: val => val !== '' && val !== 'SELECCIONE...', mensaje: MESSAGES.REQUIRED },
        fechaInicioProductiva: { validacion: val => validacionesUI.fechaValida(val), mensaje: 'Fecha inválida' },
        fechaFinProductiva: { validacion: val => validacionesUI.fechaValida(val), mensaje: 'Fecha inválida' },
        empresaPatrocinadora: { validacion: val => val.trim().length >= 3, mensaje: 'El nombre debe tener al menos 3 caracteres' },
        areaPractica: { validacion: val => val.trim().length >= 3, mensaje: 'El área debe tener al menos 3 caracteres' },
        jefeInmediato: { validacion: val => val.trim().length >= 3, mensaje: 'El nombre debe tener al menos 3 caracteres' },
        telefonoEmpresa: { validacion: val => val === '' || validacionesUI.telefonoFijo(val), mensaje: 'Teléfono inválido (7-10 dígitos)' },
        celularEmpresa: { validacion: val => validacionesUI.celular(val), mensaje: MESSAGES.INVALID_PHONE },
        direccionEmpresa: { validacion: val => val.trim().length >= 5, mensaje: 'La dirección debe tener al menos 5 caracteres' },
        correoEmpresa: { validacion: val => validacionesUI.correoElectronico(val), mensaje: MESSAGES.INVALID_EMAIL },
        horario: { validacion: val => val.trim().length >= 5, mensaje: 'El horario debe tener al menos 5 caracteres' }
    };

    // Función para validar campo individual
    function validateField(fieldId, validation) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        const value = field.value.trim();

        // Para campos opcionales vacíos, no mostrar error
        if (!field.hasAttribute('required') && value === '') {
            validacionesUI.limpiarError(field);
            return;
        }

        if (value === '') {
            validacionesUI.mostrarError(field, MESSAGES.REQUIRED);
            return;
        }

        if (validation.validacion(value)) {
            validacionesUI.mostrarExito(field);
        } else {
            validacionesUI.mostrarError(field, validation.mensaje);
        }
    }

    // Agregar event listeners para validación en tiempo real
    Object.entries(fieldsToValidate).forEach(([fieldId, validation]) => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', () => validateField(fieldId, validation));
            field.addEventListener('input', () => {
                // Limpiar errores al empezar a escribir
                if (field.classList.contains('is-invalid')) {
                    validacionesUI.limpiarError(field);
                }
            });
        }
    });

    // Validación especial para fechas (comparar inicio y fin)
    function validateFechasLectivas() {
        const inicio = document.getElementById('fechaInicioLectiva').value;
        const fin = document.getElementById('fechaFinLectiva').value;

        if (inicio && fin) {
            const fechaInicio = new Date(inicio);
            const fechaFin = new Date(fin);

            if (fechaFin <= fechaInicio) {
                validacionesUI.mostrarError(document.getElementById('fechaFinLectiva'), 'La fecha de fin debe ser posterior a la fecha de inicio');
                return false;
            }
        }
        return true;
    }

    function validateFechasProductivas() {
        const inicio = document.getElementById('fechaInicioProductiva').value;
        const fin = document.getElementById('fechaFinProductiva').value;

        if (inicio && fin) {
            const fechaInicio = new Date(inicio);
            const fechaFin = new Date(fin);

            if (fechaFin <= fechaInicio) {
                validacionesUI.mostrarError(document.getElementById('fechaFinProductiva'), 'La fecha de fin debe ser posterior a la fecha de inicio');
                return false;
            }
        }
        return true;
    }

    // Event listeners para validación de fechas
    document.getElementById('fechaFinLectiva').addEventListener('blur', validateFechasLectivas);
    document.getElementById('fechaFinProductiva').addEventListener('blur', validateFechasProductivas);

    // Validar formulario completo
    async function validateForm() {
        let isValid = true;

        // Validar todos los campos
        Object.entries(fieldsToValidate).forEach(([fieldId, validation]) => {
            validateField(fieldId, validation);
            const field = document.getElementById(fieldId);
            if (field && field.classList.contains('is-invalid')) {
                isValid = false;
            }
        });

        // Validar fechas
        if (!validateFechasLectivas() || !validateFechasProductivas()) {
            isValid = false;
        }

        return isValid;
    }

    // Manejar envío del formulario
    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        if (!await validateForm()) {
            validacionesUI.mostrarMensajeError(document.getElementById('messageContainer'), 'Por favor, corrija los errores en el formulario');
            return;
        }

        // Preparar datos del formulario
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/registrar-aprendiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                // Mostrar modal de éxito
                const modal = new bootstrap.Modal(document.getElementById('modalRegistroExitoso'));
                modal.show();
            } else {
                // Mostrar mensaje de error
                validacionesUI.mostrarMensajeError(document.getElementById('messageContainer'), result.message || 'Error al registrar el aprendiz');
            }
        } catch (error) {
            console.error('Error en el envío:', error);
            validacionesUI.mostrarMensajeError(document.getElementById('messageContainer'), 'Error de conexión. Intente nuevamente.');
        }
    });
});