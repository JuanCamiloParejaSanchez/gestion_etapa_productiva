// Ruta: public/js/autenticacion/login.js
// Descripción: Lógica de login robusta, clara y corregida

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const roleInput = /** @type {HTMLInputElement} */ (document.getElementById('roleInput'));
    const emailInput = /** @type {HTMLInputElement} */ (document.getElementById('email'));
    const passwordInput = /** @type {HTMLInputElement} */ (document.getElementById('password'));


    if (!loginForm || !roleInput || !togglePassword) {
        console.error("❌ Faltan elementos del DOM. Revisa los IDs en login.ejs.");
        return;
    }

    // Eliminar referencias a btnAprendiz, btnAdmin y lógica de cambio de rol
    // Solo tomamos el valor de roleInput, que ya viene del backend

    // --- ENVÍO DEL FORMULARIO ---
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const requestBody = {
            email: emailInput.value,
            password: passwordInput.value,
            role: roleInput.value // El rol ya viene definido por el backend
        };

        console.log('🟢 Enviando con rol:', roleInput.value);

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                mostrarMensaje('success', 'Inicio de sesión exitoso. Redirigiendo...');
                setTimeout(() => {
                    window.location.href = data.data.redirect;
                }, 1000);
            } else {
                mostrarMensaje('error', data.message || 'Error desconocido');
            }

        } catch (error) {
            console.error('Error de red al intentar iniciar sesión:', error);
            mostrarMensaje('error', 'Error de red. Revisa la consola.');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });

    // --- MOSTRAR / OCULTAR CONTRASEÑA ---
    togglePassword.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.querySelector('i').classList.toggle('fa-eye-slash');
    });

    // --- FUNCIÓN PARA MOSTRAR MENSAJES ---
    function mostrarMensaje(tipo, mensaje) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${tipo === 'error' ? 'danger' : 'success'} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        const existingAlert = document.querySelector('.alert');
        if (existingAlert) existingAlert.remove();

        const cardBody = document.querySelector('.card-body');
        const form = document.querySelector('form');
        if (cardBody && form) {
            cardBody.insertBefore(alertDiv, form);
        } else {
            console.error('No se encontró .card-body o form para insertar el mensaje.');
        }
    }

    // --- BOTÓN DE REGISTRO TEMPORAL DE ADMIN (SOLO DESARROLLO) ---
    const btnRegistrarAdmin = document.getElementById('btnRegistrarAdmin');
    if (btnRegistrarAdmin) {
        btnRegistrarAdmin.addEventListener('click', async function () {
            const email = prompt("Ingresa el email para el nuevo admin:");
            if (!email) return;
            const password = prompt("Ingresa la contraseña para el nuevo admin:");
            if (!password) return;
            const nombreUsuario = prompt("Ingresa el nombre de usuario para el nuevo admin:");
            if (!nombreUsuario) return;

            try {
                const response = await fetch('/auth/admin/register-temp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombreUsuario, email, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    alert(data.message + '\nAhora puedes iniciar sesión con estas credenciales.');
                } else {
                    alert('Error al registrar admin: ' + (data.message || 'Ocurrió un error.'));
                }
            } catch (error) {
                console.error('Error al registrar admin:', error);
                alert('Ocurrió un error de red al registrar el admin.');
            }
        });
    }
});
