// Sistema de cierre automático por inactividad
// Sincronizado con el servidor (10 minutos de timeout)

(function() {
    const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos (igual que el servidor)
    const WARNING_TIME = 2 * 60 * 1000; // Mostrar advertencia 2 minutos antes
    let inactivityTimer;
    let warningShown = false;

    function resetTimer() {
        clearTimeout(inactivityTimer);
        if (warningShown) {
            hideWarning();
        }
        inactivityTimer = setTimeout(() => {
            showWarning();
        }, INACTIVITY_TIMEOUT - WARNING_TIME);
    }

    function showWarning() {
        if (warningShown) return;
        warningShown = true;

        // Crear modal de advertencia
        const warningModal = document.createElement('div');
        warningModal.className = 'modal fade';
        warningModal.id = 'inactivityWarningModal';
        warningModal.setAttribute('tabindex', '-1');
        warningModal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="fas fa-clock me-2"></i>
                            Sesión Expirando
                        </h5>
                    </div>
                    <div class="modal-body text-center">
                        <i class="fas fa-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
                        <h4 class="mt-3">Tu sesión está a punto de expirar</h4>
                        <p>Por seguridad, tu sesión se cerrará automáticamente en 2 minutos debido a inactividad.</p>
                        <p>¿Deseas continuar trabajando?</p>
                    </div>
                    <div class="modal-footer justify-content-center">
                        <button type="button" class="btn btn-secondary px-4" onclick="extendSession()">
                            <i class="fas fa-check me-2"></i>
                            Continuar
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(warningModal);
        const modal = new bootstrap.Modal(warningModal);
        modal.show();

        // Auto-logout después de 2 minutos si no se extiende
        setTimeout(() => {
            if (warningShown) {
                logout();
            }
        }, WARNING_TIME);
    }

    function hideWarning() {
        const modal = document.getElementById('inactivityWarningModal');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
            modal.remove();
        }
        warningShown = false;
    }

    function extendSession() {
        hideWarning();
        resetTimer();
    }

    function logout() {
        // Cerrar sesión y redirigir a selección de rol
        fetch('/auth/logout', {
            method: 'GET',
            credentials: 'same-origin'
        }).then(() => {
            window.location.href = '/';
        }).catch(() => {
            // En caso de error, redirigir igualmente
            window.location.href = '/';
        });
    }

    // Eventos de actividad del usuario
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
        document.addEventListener(event, resetTimer, true);
    });

    // Iniciar el timer
    resetTimer();

    // Función global para extender sesión (usada en el modal)
    window.extendSession = extendSession;
})();