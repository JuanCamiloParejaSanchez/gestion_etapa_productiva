// Ruta: public/js/autenticacion/recuperarContrasena.js
// Propósito: Maneja la lógica del formulario de recuperación de contraseña

document.addEventListener('DOMContentLoaded', function() {
    const recuperarForm = document.getElementById('recuperarForm');
    const messageContainer = document.getElementById('messageContainer');
    const codigoFormContainer = document.getElementById('codigoFormContainer');

    function showMessage(message, type = 'info') {
        messageContainer.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show">${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
    }

    // Paso 1: Solicitar código
    recuperarForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        showMessage('Enviando código...', 'info');
        try {
            const response = await fetch('/auth/recuperar-contrasena', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (data.success) {
                showMessage(data.message, 'success');
                mostrarFormularioCodigo(email);
            } else {
                showMessage(data.message || 'Error al enviar el código', 'danger');
            }
        } catch (err) {
            showMessage('Error de conexión. Intenta de nuevo.', 'danger');
        }
    });

    // Paso 2: Formulario para código y nueva contraseña
    function mostrarFormularioCodigo(email) {
        recuperarForm.style.display = 'none';
        codigoFormContainer.style.display = '';
        codigoFormContainer.innerHTML = `
            <form id="codigoForm">
                <div class="mb-3">
                    <label for="emailCodigo" class="form-label">Correo electrónico</label>
                    <input type="email" class="form-control" id="emailCodigo" name="email" value="${email}" readonly>
                </div>
                <div class="mb-3">
                    <label for="codigo" class="form-label">Código de verificación</label>
                    <input type="text" class="form-control" id="codigo" name="codigo" maxlength="6" required>
                </div>
                <div class="alert alert-info">
                    <strong>Requisitos de la contraseña:</strong>
                    <ul class="mb-0">
                        <li>Mínimo 12 caracteres</li>
                        <li>Al menos una letra mayúscula</li>
                        <li>Al menos una letra minúscula</li>
                        <li>Al menos un número</li>
                        <li>Al menos un símbolo</li>
                    </ul>
                </div>
                <div class="mb-3">
                    <label for="password" class="form-label">Nueva Contraseña</label>
                    <div class="input-group">
                        <input type="password" class="form-control" id="password" name="password" required>
                        <button class="btn btn-outline-secondary" type="button" id="togglePassword"><i class="fas fa-eye"></i></button>
                    </div>
                </div>
                <div class="mb-3">
                    <label for="confirmPassword" class="form-label">Confirmar Contraseña</label>
                    <div class="input-group">
                        <input type="password" class="form-control" id="confirmPassword" name="confirmPassword" required>
                        <button class="btn btn-outline-secondary" type="button" id="toggleConfirmPassword"><i class="fas fa-eye"></i></button>
                    </div>
                </div>
                <div class="d-grid">
                    <button type="submit" class="btn btn-success">Restablecer Contraseña</button>
                </div>
            </form>
        `;
        // Mostrar/ocultar contraseña
        const passInput = document.getElementById('password');
        const passBtn = document.getElementById('togglePassword');
        passBtn.onclick = function() {
            passInput.type = passInput.type === 'password' ? 'text' : 'password';
            passBtn.querySelector('i').classList.toggle('fa-eye');
            passBtn.querySelector('i').classList.toggle('fa-eye-slash');
        };
        const confInput = document.getElementById('confirmPassword');
        const confBtn = document.getElementById('toggleConfirmPassword');
        confBtn.onclick = function() {
            confInput.type = confInput.type === 'password' ? 'text' : 'password';
            confBtn.querySelector('i').classList.toggle('fa-eye');
            confBtn.querySelector('i').classList.toggle('fa-eye-slash');
        };
        // Validación y envío del segundo formulario
        document.getElementById('codigoForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('emailCodigo').value;
            const codigo = document.getElementById('codigo').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            // Validación frontend
            const errors = [];
            if (password.length < 12) errors.push('al menos 12 caracteres');
            if (!/[A-Z]/.test(password)) errors.push('una letra mayúscula');
            if (!/[a-z]/.test(password)) errors.push('una letra minúscula');
            if (!/[0-9]/.test(password)) errors.push('un número');
            if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) errors.push('un símbolo');
            if (errors.length > 0) {
                showMessage('La contraseña debe contener: ' + errors.join(', '), 'danger');
                return;
            }
            if (password !== confirmPassword) {
                showMessage('Las contraseñas no coinciden', 'danger');
                return;
            }
            showMessage('Procesando...', 'info');
            try {
                const response = await fetch('/auth/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, codigo, password, confirmPassword })
                });
                const data = await response.json();
                if (data.success) {
                    showMessage(data.message, 'success');
                    // Mostrar modal de éxito
                    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
                    successModal.show();

                    // Configurar el botón de aceptar para redirigir
                    document.getElementById('confirmButton').addEventListener('click', function() {
                        window.location.href = data.redirect || '/auth/login';
                    });
                } else {
                    showMessage(data.message || 'Error al restablecer la contraseña', 'danger');
                }
            } catch (err) {
                showMessage('Error de conexión. Intenta de nuevo.', 'danger');
            }
        });
    }
});