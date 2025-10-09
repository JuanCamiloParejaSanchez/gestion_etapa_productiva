// Ruta: public/js/autenticacion/resetPassword.js
// Propósito: Maneja la lógica del formulario de restablecimiento de contraseña
// Autor: JuanBogotá

document.addEventListener('DOMContentLoaded', function() {
    const resetForm = document.getElementById('resetPasswordForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Toggle password visibility
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.querySelector('i').classList.toggle('fa-eye');
        togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
    });

    function validatePassword(password) {
        // Mínimo 12 caracteres, al menos una mayúscula, una minúscula, un número y un símbolo
        return password.length >= 12 &&
            /[A-Z]/.test(password) &&
            /[a-z]/.test(password) &&
            /[0-9]/.test(password) &&
            /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    }

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

    // Manejo del formulario
    resetForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const password = /** @type {HTMLInputElement} */(document.getElementById('password')).value;
        const confirmPassword = /** @type {HTMLInputElement} */(document.getElementById('confirmPassword')).value;
        const token = /** @type {HTMLInputElement} */(document.getElementById('tokenInput')).value;

        // Validaciones
        if (!validatePassword(password)) {
            showMessage('La contraseña debe tener al menos 12 caracteres, una mayúscula, una minúscula, un número y un símbolo', 'danger');
            return;
        }

        if (password !== confirmPassword) {
            showMessage('Las contraseñas no coinciden', 'danger');
            return;
        }

        try {
            const response = await fetch('/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Contraseña actualizada exitosamente. Redirigiendo...', 'success');
                setTimeout(() => {
                    window.location.href = data.redirect || '/auth/login';
                }, 2000);
            } else {
                showMessage(data.message || 'Error al restablecer la contraseña', 'danger');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('Error de conexión. Por favor intenta más tarde', 'danger');
        }
    });
});
