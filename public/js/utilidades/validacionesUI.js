// Ruta: public/js/utilidades/validacionesUI.js
// Propósito: Centraliza todas las validaciones y utilidades de UI para formularios del frontend.
//           Proporciona funciones de validación reutilizables y mensajes estandarizados.
// Autor: JuanBogotá


export const REGEX = {
    correoElectronico: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    numeroDocumento: /^\d{7,12}$/,
    celular: /^\d{10}$/,
    password: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{12,}$/
};

export const MESSAGES = {
    REQUIRED: 'Este campo es obligatorio',
    INVALID_EMAIL: 'Correo electrónico inválido',
    INVALID_DOCUMENT: 'Número de documento inválido',
    INVALID_PHONE: 'Número de celular inválido',
    INVALID_PASSWORD: 'La contraseña debe tener al menos 12 caracteres, una mayúscula, una minúscula, un número y un símbolo',
    INVALID_AGE: 'Debe ser mayor de 14 años'
};

export const validacionesUI = {
    // Validaciones de campos
    correoElectronico: (email) => REGEX.correoElectronico.test(email),
    numeroDocumento: (num) => REGEX.numeroDocumento.test(num),
    celular: (cel) => REGEX.celular.test(cel),
    telefonoFijo: (tel) => /^\d{7,10}$/.test(tel),
    password: (pass) => REGEX.password.test(pass),
    fechaValida: (fecha) => !isNaN(Date.parse(fecha)),
    fechaNacimiento: (fecha) => {
        const hoy = new Date();
        const fechaNac = new Date(fecha);
        let edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes = hoy.getMonth() - fechaNac.getMonth();

        if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
            edad--;
        }
        return edad >= 14;
    },

    // UI Feedback
    mostrarError: (field, message) => {
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');
        // Eliminar mensaje debajo del input
        const helpId = field.id + 'Help';
        const helpElem = document.getElementById(helpId);
        if (helpElem) {
            helpElem.innerHTML = '';
            helpElem.style.display = 'none';
            helpElem.classList.remove('text-danger', 'text-success');
        }
        // Mostrar ícono de error dentro del input
        validacionesUI.insertarIcono(field, 'error');
        if (field.tagName === 'SELECT') {
            field.style.borderColor = '#d32f2f';
        }
    },

    mostrarExito: (field, message) => {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
        // Eliminar mensaje debajo del input
        const helpId = field.id + 'Help';
        const helpElem = document.getElementById(helpId);
        if (helpElem) {
            helpElem.innerHTML = '';
            helpElem.style.display = 'none';
            helpElem.classList.remove('text-danger', 'text-success');
        }
        // Solo mostrar ícono de éxito si el campo tiene contenido
        if (field.value && field.value.trim() !== '') {
            validacionesUI.insertarIcono(field, 'success');
        } else {
            validacionesUI.eliminarIcono(field);
        }
        if (field.tagName === 'SELECT') {
            field.style.borderColor = '#388e3c';
        }
    },

    limpiarError: (field) => {
        field.classList.remove('is-invalid');
        field.classList.remove('is-valid');
        const helpId = field.id + 'Help';
        const helpElem = document.getElementById(helpId);
        if (helpElem) {
            helpElem.innerHTML = '';
            helpElem.style.display = 'none';
            helpElem.classList.remove('text-danger', 'text-success');
        }
        validacionesUI.eliminarIcono(field);
        if (field.tagName === 'SELECT') {
            field.style.borderColor = '';
        }
    },

    insertarIcono: (field, tipo) => {
        validacionesUI.eliminarIcono(field);
        const icon = document.createElement('span');
        icon.className = tipo === 'success' ? 'input-icon input-icon-success' : 'input-icon input-icon-error';
        icon.innerHTML = tipo === 'success' ? '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10" fill="#388e3c"/><path d="M6 10.5L9 13.5L14 8.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10" fill="#d32f2f"/><path d="M7 7L13 13M13 7L7 13" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>';
        icon.style.position = 'absolute';
        icon.style.right = '12px';
        icon.style.top = '50%';
        icon.style.transform = 'translateY(-50%)';
        icon.style.pointerEvents = 'none';
        icon.style.zIndex = '10';
        // Asegurar que el input esté en un contenedor relativo
        let parent = field.parentNode;
        if (getComputedStyle(parent).position === 'static') {
            parent.style.position = 'relative';
        }
        icon.setAttribute('data-input-icon', 'true');
        parent.appendChild(icon);
    },

    eliminarIcono: (field) => {
        let parent = field.parentNode;
        const icon = parent.querySelector('span[data-input-icon="true"]');
        if (icon && icon.parentNode === parent) {
            parent.removeChild(icon);
        }
    },

    // Validar campo y mostrar feedback visual
    validarCampo: (field, validacion, mensaje) => {
        if (!validacion(field.value)) {
            validacionesUI.mostrarError(field, mensaje);
            return false;
        } else {
            validacionesUI.mostrarExito(field);
            return true;
        }
    },

    // Validar select obligatorio
    validarSelectObligatorio: (field, mensaje) => {
        if (!field.value || field.value === '' || field.value === 'SELECCIONE...' || field.value === 'SELECCIONE UN MUNICIPIO...') {
            validacionesUI.mostrarError(field, mensaje);
            return false;
        } else {
            validacionesUI.mostrarExito(field);
            return true;
        }
    },


    // Validar que solo contenga números
    soloNumeros: (valor) => {
        return /^\d+$/.test(valor);
    },

    // Mostrar mensaje global de éxito
    mostrarMensajeExito: (container, message) => {
        validacionesUI.limpiarMensajesGlobales(container);
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show';
        alert.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        container.insertBefore(alert, container.firstChild);
    },

    // Mostrar mensaje global de error
    mostrarMensajeError: (container, message) => {
        validacionesUI.limpiarMensajesGlobales(container);
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show';
        alert.innerHTML = `
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        container.insertBefore(alert, container.firstChild);
    },

    // Limpiar mensajes globales
    limpiarMensajesGlobales: (container) => {
        const alerts = container.querySelectorAll('.alert');
        alerts.forEach(alert => alert.remove());
    }
};