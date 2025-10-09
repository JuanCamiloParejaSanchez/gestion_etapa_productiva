// Consulta y actualiza el badge de alertas y el modal en el dashboard del aprendiz
let ultimoContadorAlertas = null;

async function actualizarAlertasDashboard() {
    try {
        const res = await fetch('/aprendiz/alertas/contador');
        const data = await res.json();
        const badge = document.getElementById('badge-alertas');
        const btnVer = document.getElementById('btn-ver-alertas');
        const listaAlertas = document.getElementById('lista-alertas');

        if (data.success && data.contador > 0) {
            // Si el número cambió, aplicar animación de rebote
            if (badge.textContent !== String(data.contador)) {
                badge.classList.remove('rebote');
                // Forzar reflow para reiniciar la animación
                void badge.offsetWidth;
                badge.classList.add('rebote');
            }
            badge.textContent = data.contador;
            badge.style.display = 'flex';
            btnVer.disabled = false;
        } else {
            badge.style.display = 'none';
            btnVer.disabled = true;
        }

        // Actualizar la lista del modal
        if (listaAlertas) {
            listaAlertas.innerHTML = '';
            if (data.success && data.alertas && data.alertas.length > 0) {
                data.alertas.forEach(alerta => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item d-flex align-items-center';
                    li.innerHTML = `<i class='fas fa-exclamation-circle text-danger me-2'></i> ${alerta.mensaje}`;
                    listaAlertas.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.className = 'list-group-item text-center text-muted';
                li.textContent = 'No tienes alertas pendientes.';
                listaAlertas.appendChild(li);
            }
        }
    } catch (e) {
        // En caso de error, ocultar badge y deshabilitar botón
        const badge = document.getElementById('badge-alertas');
        const btnVer = document.getElementById('btn-ver-alertas');
        if (badge) badge.style.display = 'none';
        if (btnVer) btnVer.disabled = true;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    actualizarAlertasDashboard();
    setInterval(actualizarAlertasDashboard, 10000); // Actualiza cada 10 segundos
    // También actualizar al abrir el modal
    const btnVer = document.getElementById('btn-ver-alertas');
    if (btnVer) {
        btnVer.addEventListener('click', actualizarAlertasDashboard);
    }
    // Remover la clase de rebote al terminar la animación
    const badge = document.getElementById('badge-alertas');
    if (badge) {
        badge.addEventListener('animationend', function() {
            badge.classList.remove('rebote');
        });
    }
}); 