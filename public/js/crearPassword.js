// Ruta: public/js/crearPassword.js
// Propósito: Maneja la validación y envío del formulario de creación de contraseña


document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('crearPasswordForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // Mostrar/ocultar contraseña
    [passwordInput, confirmPasswordInput].forEach(input => {
        const wrapper = input.parentElement;
        if (wrapper && !wrapper.classList.contains('input-group')) {
            const group = document.createElement('div');
            group.className = 'input-group';
            input.parentNode.insertBefore(group, input);
            group.appendChild(input);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn-outline-secondary';
            btn.innerHTML = '<i class="fas fa-eye"></i>';
            btn.onclick = function() {
                if (input instanceof HTMLInputElement) {
                    input.type = input.type === 'password' ? 'text' : 'password';
                }
                btn.querySelector('i').classList.toggle('fa-eye');
                btn.querySelector('i').classList.toggle('fa-eye-slash');
            };
            group.appendChild(btn);
        }
    });

    function showMessage(message, type) {
        const messageContainer = document.getElementById('messageContainer');
        if (!messageContainer) return;

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        messageContainer.innerHTML = '';
        messageContainer.appendChild(alertDiv);
    }

    function validatePassword(password) {
        const errors = [];
        if (password.length < 12) errors.push('al menos 12 caracteres');
        if (!/[A-Z]/.test(password)) errors.push('una letra mayúscula');
        if (!/[a-z]/.test(password)) errors.push('una letra minúscula');
        if (!/[0-9]/.test(password)) errors.push('un número');
        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) errors.push('un símbolo');
        return errors;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const passwordElem = form.querySelector('#password');
        const confirmPasswordElem = form.querySelector('#confirmPassword');
        const correoElectronicoElem = form.querySelector('#correoElectronico');
        const password = passwordElem && 'value' in passwordElem ? passwordElem.value : '';
        const confirmPassword = confirmPasswordElem && 'value' in confirmPasswordElem ? confirmPasswordElem.value : '';
        const correoElectronico = correoElectronicoElem && 'value' in correoElectronicoElem ? correoElectronicoElem.value : '';

        // Validar contraseña
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            showMessage('La contraseña debe contener: ' + passwordErrors.join(', '), 'danger');
            return;
        }

        // Validar coincidencia
        if (password !== confirmPassword) {
            showMessage('Las contraseñas no coinciden', 'danger');
            return;
        }

        try {
            const response = await fetch('/crear-contrasena', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    correoElectronico,
                    password,
                    confirmPassword
                })
            });

            const responseText = await response.text();
            console.log('Respuesta del servidor:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Error parseando JSON:', parseError);
                console.log('Respuesta original:', responseText);
                throw new Error('Respuesta del servidor no válida');
            }

            if (data.success && data.data && data.data.redirect) {
                showMessage('¡Contraseña creada exitosamente! Redirigiendo...', 'success');
                setTimeout(() => {
                    window.location.href = data.data.redirect;
                }, 1500);
            } else if (data.message && data.message.includes('Sesión inválida')) {
                showMessage('Tu sesión ha expirado. Por favor, vuelve a registrarte o inicia sesión.', 'danger');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2500);
            } else {
                showMessage(data.message || 'Error al crear la contraseña', 'danger');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage(error.message || 'Error al procesar la solicitud', 'danger');
        }
    }

    form.addEventListener('submit', handleSubmit);
});