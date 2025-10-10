// Ruta: public/js/admin-script.js
// Propósito: Maneja la funcionalidad del panel de administración

document.addEventListener('DOMContentLoaded', function () {
    // Carga contenido dinámicamente en el panel principal
    const cargarContenido = (seccion) => {
        const contenidoPrincipal = document.getElementById('contenidoPrincipal');

        if (!contenidoPrincipal) {
            console.warn('No se encontró el contenedor con ID "contenidoPrincipal"');
            return;
        }

        fetch(`/admin/${seccion}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error al cargar la sección: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                contenidoPrincipal.innerHTML = html;
            })
            .catch(error => {
                console.error('Error al cargar contenido dinámico:', error);
                contenidoPrincipal.innerHTML = '<p class="text-danger">Error al cargar el contenido.</p>';
            });
    };

    // Función para asignar eventos a botones existentes
    const addClickListener = (id, seccion) => {
        const elemento = document.getElementById(id);
        if (!elemento) {
            console.warn(`Elemento con ID "${id}" no encontrado`);
            return;
        }

        elemento.addEventListener('click', function (e) {
            e.preventDefault();
            cargarContenido(seccion);
        });
    };

    // Vincula eventos a botones de navegación
    addClickListener('verDocumentacion', 'verificarDocumentacion');
    addClickListener('gestionarUsuarios', 'gestionarUsuarios');
    addClickListener('cargarDatos', 'cargarDatos');

    // Delegación de eventos para eliminación de aprendiz
    document.addEventListener('click', function (e) {
        const boton = e.target.closest('.eliminar-aprendiz');
        if (boton) {
            const id = boton.dataset.id;
            if (!id) {
                alert('ID de aprendiz no válido');
                return;
            }

            const confirmado = confirm('¿Está seguro de que desea eliminar este aprendiz?');
            if (confirmado) {
                eliminarAprendiz(id);
            }
        }
    });
});

/**
 * Elimina un aprendiz mediante una solicitud DELETE.
 * @param {string} id - ID del aprendiz a eliminar
 */
function eliminarAprendiz(id) {
    fetch(`/admin/aprendiz/eliminar/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(async response => {
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al procesar la solicitud');
            }

            alert('Aprendiz eliminado exitosamente');
            window.location.reload();
        })
        .catch(error => {
            console.error('Error en eliminación:', error);
            alert(`Error al eliminar el aprendiz: ${error.message}`);
        });
}

// Exportar al ámbito global (si se usa desde otros scripts o views)
window.eliminarAprendiz = eliminarAprendiz;
window.cargarContenido = window.cargarContenido || (() => {}); // ← evita error si aún no se ha definido
