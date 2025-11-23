// public/js/admin/utilidadesAdmin.js
// Propósito: Funcionalidades para administración (formulario, DataTable, validaciones)

import { validacionesUI, MESSAGES } from '../utilidades/validacionesUI.js';

class AdminUtils {
    constructor() {
        this.tabla = null;
    }

    async validarFormulario(formulario) {
        let isValid = true;
        const campos = formulario.querySelectorAll('input, select, textarea');

        campos.forEach(campo => {
            validacionesUI.limpiarError(campo);

            if (campo.hasAttribute('required') && !campo.value.trim()) {
                validacionesUI.mostrarError(campo, MESSAGES.REQUIRED);
                isValid = false;
                return;
            }

            if (campo.value.trim()) {
                let error = null;

                switch (campo.id) {
                    case 'numeroDocumento':
                        if (!/^\d{7,12}$/.test(campo.value.trim())) {
                            error = 'El número de documento debe tener entre 7 y 12 dígitos';
                        }
                        break;
                    case 'correoElectronico':
                        if (!validacionesUI.correoElectronico(campo.value)) {
                            error = MESSAGES.INVALID_EMAIL;
                        }
                        break;
                    case 'celular':
                        if (!validacionesUI.celular(campo.value)) {
                            error = MESSAGES.INVALID_PHONE;
                        }
                        break;
                }

                if (error) {
                    validacionesUI.mostrarError(campo, error);
                    isValid = false;
                }
            }
        });

        return isValid;
    }

    async manejarEnvioFormulario(evento) {
        evento.preventDefault();
        const formulario = evento.target;
        const botonSubmit = formulario.querySelector('button[type="submit"]');
        const textoOriginal = botonSubmit?.innerHTML || '';

        try {
            if (!await this.validarFormulario(formulario)) return;

            if (botonSubmit) {
                botonSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
                botonSubmit.disabled = true;
            }

            const formData = new FormData(formulario);
            const datosFormulario = Object.fromEntries(formData);

            const urlParts = window.location.pathname.split('/');
            const id = urlParts[urlParts.length - 1];

            const response = await fetch(`/administrador/aprendiz/actualizar/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(datosFormulario)
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const texto = await response.text();
                console.error('Respuesta no JSON:', texto);
                throw new Error('Respuesta del servidor no es JSON válido');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Error: ${response.status}`);
            }

            const messageContainer = document.getElementById('messageContainer');
            if (messageContainer) {
                messageContainer.innerHTML = `
                    <div class="alert alert-success alert-dismissible fade show" role="alert">
                        Cambios guardados exitosamente
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                `;
            }

            setTimeout(() => {
                window.location.href = '/administrador/listar-aprendices';
            }, 1500);

        } catch (error) {
            console.error('Error:', error);
            const messageContainer = document.getElementById('messageContainer');
            if (messageContainer) {
                messageContainer.innerHTML = `
                    <div class="alert alert-danger alert-dismissible fade show" role="alert">
                        ${error.message || 'Error al actualizar los datos'}
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                `;
            }
        } finally {
            if (botonSubmit) {
                botonSubmit.innerHTML = textoOriginal;
                botonSubmit.disabled = false;
            }
        }
    }

    configurarEventosFormulario() {
        const formularios = document.querySelectorAll('form');
        formularios.forEach(formulario => {
            formulario.removeEventListener('submit', this.manejarEnvioFormulario);
            formulario.addEventListener('submit', this.manejarEnvioFormulario.bind(this));
        });
    }

    inicializarTablaAprendices(idTabla, opcionesPersonalizadas = {}) {
        // Verificar si se debe omitir la inicialización de DataTables
        if (window.skipDataTableInit) {
            console.log('Inicialización de DataTable omitida por skipDataTableInit');
            return null;
        }

        // Verificar que la tabla existe en el DOM
        const elemento = document.querySelector(idTabla);
        if (!elemento) {
            console.log(`Tabla ${idTabla} no encontrada en el DOM`);
            return null;
        }

        const configuracionBase = {
            serverSide: true,
            processing: true,
            language: {
                "sProcessing":     "Procesando...",
                "sLengthMenu":     "Mostrar _MENU_ registros",
                "sZeroRecords":    "No se encontraron resultados",
                "sEmptyTable":     "Ningún dato disponible en esta tabla",
                "sInfo":           "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
                "sInfoEmpty":      "Mostrando registros del 0 al 0 de un total de 0 registros",
                "sInfoFiltered":   "(filtrado de un total de _MAX_ registros)",
                "sInfoPostFix":    "",
                "sSearch":         "Buscar:",
                "sUrl":            "",
                "sInfoThousands":  ",",
                "sLoadingRecords": "Cargando...",
                "oPaginate": {
                    "sFirst":    "Primero",
                    "sLast":     "Último",
                    "sNext":     "Siguiente",
                    "sPrevious": "Anterior"
                },
                "oAria": {
                    "sSortAscending":  ": Activar para ordenar la columna de manera ascendente",
                    "sSortDescending": ": Activar para ordenar la columna de manera descendente"
                },
                "buttons": {
                    "copy": "Copiar",
                    "colvis": "Visibilidad"
                }
            },
            lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "Todos"]],
            pageLength: 10,
            dom: '<"d-flex justify-content-between align-items-center mb-3"l<"d-flex gap-2"B>f>rtip',
            select: true,
            buttons: [
                {
                    extend: 'excel',
                    className: 'btn btn-sm btn-success d-none',
                    text: '<i class="fas fa-file-excel"></i> Excel'
                },
                {
                    extend: 'pdf',
                    className: 'btn btn-sm btn-danger d-none',
                    text: '<i class="fas fa-file-pdf"></i> PDF'
                }
            ],
            responsive: true,
            // Configuración mejorada para móviles y producción
            ajax: function(data, callback, settings) {
                const ajaxConfig = {
                    timeout: 30000, // 30 segundos timeout (antes era default ~10s)
                    retries: 3, // Reintentar hasta 3 veces
                    retryDelay: 1000, // Esperar 1 segundo entre reintentos
                    ...opcionesPersonalizadas.ajax
                };

                // Función para ejecutar la petición con reintentos
                const executeAjax = (attempt = 1) => {
                    console.log(`DataTables Ajax - Intento ${attempt}/${ajaxConfig.retries + 1}`);

                    $.ajax({
                        ...ajaxConfig,
                        data: data,
                        success: function(response) {
                            console.log('DataTables Ajax - Éxito en intento', attempt);
                            callback(response);
                        },
                        error: function(xhr, textStatus, errorThrown) {
                            console.warn(`DataTables Ajax - Error en intento ${attempt}:`, {
                                status: xhr.status,
                                statusText: xhr.statusText,
                                textStatus: textStatus,
                                errorThrown: errorThrown
                            });

                            // Si no es el último intento y el error es recuperable, reintentar
                            if (attempt <= ajaxConfig.retries &&
                                (xhr.status === 0 || xhr.status === 500 || xhr.status >= 502)) {

                                console.log(`Reintentando en ${ajaxConfig.retryDelay}ms...`);
                                setTimeout(() => {
                                    executeAjax(attempt + 1);
                                }, ajaxConfig.retryDelay);
                            } else {
                                // Último intento fallido o error no recuperable
                                console.error('DataTables Ajax - Todos los intentos fallaron');
                                callback({
                                    error: true,
                                    message: `Error después de ${attempt} intentos: ${textStatus}`,
                                    data: []
                                });
                            }
                        }
                    });
                };

                executeAjax();
            },
            // Mejorar manejo de errores
            initComplete: function(settings, json) {
                // Configurar manejo de errores global para esta tabla
                const table = this;
                $(table).on('error.dt', function(e, settings, techNote, message) {
                    console.error('Error en DataTables:', {
                        settings: settings,
                        techNote: techNote,
                        message: message,
                        url: opcionesPersonalizadas.ajax?.url || 'URL no especificada'
                    });

                    // Mostrar mensaje de error más específico
                    let mensajeError = 'Error al cargar los datos. ';
                    if (message && message.includes('timeout')) {
                        mensajeError += 'La conexión tardó demasiado. Verifique su conexión a internet.';
                    } else if (message && message.includes('401')) {
                        mensajeError += 'Sesión expirada. Recargue la página.';
                    } else if (message && message.includes('403')) {
                        mensajeError += 'Acceso denegado.';
                    } else if (message && message.includes('500')) {
                        mensajeError += 'Error interno del servidor.';
                    } else {
                        mensajeError += 'Intente recargar la página.';
                    }

                    // Mostrar alerta al usuario
                    if (typeof Swal !== 'undefined') {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error de conexión',
                            text: mensajeError,
                            confirmButtonText: 'Reintentar',
                            showCancelButton: true,
                            cancelButtonText: 'Cancelar'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                // Reintentar cargar la tabla
                                table.DataTable().ajax.reload();
                            }
                        });
                    } else {
                        if (confirm(mensajeError + ' ¿Desea reintentar?')) {
                            table.DataTable().ajax.reload();
                        }
                    }
                });
            },
            ...opcionesPersonalizadas
        };

        try {
            this.tabla = $(idTabla).DataTable(configuracionBase);

            if (!document.getElementById('datatables-custom-styles')) {
                const style = document.createElement('style');
                style.id = 'datatables-custom-styles';
                style.textContent = `
                    .dataTables_length { margin-bottom: 0 !important; }
                    .dataTables_length label {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        margin-bottom: 0;
                    }
                    .dataTables_length select {
                        width: auto;
                        padding: 0.375rem 2.25rem 0.375rem 0.75rem;
                        font-size: 0.875rem;
                        line-height: 1.5;
                        color: #212529;
                        background-color: #fff;
                        border: 1px solid #ced4da;
                        border-radius: 0.25rem;
                    }
                    .dt-buttons {
                        display: inline-block;
                        margin-right: 1rem;
                    }
                    .dataTables_filter {
                        float: right;
                        margin-bottom: 1rem;
                    }
                    .dataTables_filter input {
                        padding: 0.375rem 0.75rem;
                        border: 1px solid #ced4da;
                        border-radius: 0.25rem;
                        margin-left: 0.5rem;
                    }
                    table.dataTable tbody tr.selected {
                        background-color: rgba(0, 123, 255, 0.15) !important;
                        color: #212529 !important;
                    }
                    table.dataTable tbody tr:hover {
                        background-color: rgba(0, 123, 255, 0.05);
                        cursor: pointer;
                    }
                    .dataTables_wrapper .row:first-child {
                        margin-bottom: 1rem;
                        align-items: center;
                    }
                    .dataTables_wrapper .row:last-child {
                        background: transparent !important;
                        margin-top: 1rem;
                        align-items: center;
                    }
                `;
                document.head.appendChild(style);
            }

            return this.tabla;
        } catch (error) {
            console.error('Error al inicializar DataTable:', error);
            throw error;
        }
    }

    inicializarTablaAdministradores(idTabla, opcionesPersonalizadas = {}) {
        // Verificar si se debe omitir la inicialización de DataTables
        if (window.skipDataTableInit) {
            console.log('Inicialización de DataTable omitida por skipDataTableInit');
            return null;
        }
        
        // Verificar que la tabla existe en el DOM
        const elemento = document.querySelector(idTabla);
        if (!elemento) {
            console.log(`Tabla ${idTabla} no encontrada en el DOM`);
            return null;
        }
        
        const configuracionBase = {
            serverSide: true,
            processing: true,
            language: {
                "sProcessing":     "Procesando...",
                "sLengthMenu":     "Mostrar _MENU_ registros",
                "sZeroRecords":    "No se encontraron resultados",
                "sEmptyTable":     "Ningún dato disponible en esta tabla",
                "sInfo":           "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
                "sInfoEmpty":      "Mostrando registros del 0 al 0 de un total de 0 registros",
                "sInfoFiltered":   "(filtrado de un total de _MAX_ registros)",
                "sInfoPostFix":    "",
                "sSearch":         "Buscar:",
                "sUrl":            "",
                "sInfoThousands":  ",",
                "sLoadingRecords": "Cargando...",
                "oPaginate": {
                    "sFirst":    "Primero",
                    "sLast":     "Último",
                    "sNext":     "Siguiente",
                    "sPrevious": "Anterior"
                },
                "oAria": {
                    "sSortAscending":  ": Activar para ordenar la columna de manera ascendente",
                    "sSortDescending": ": Activar para ordenar la columna de manera descendente"
                },
                "buttons": {
                    "copy": "Copiar",
                    "excel": "Excel",
                    "pdf": "PDF",
                    "colvis": "Columnas"
                }
            },
            dom: 'Bfrtip',
            buttons: [
                {
                    extend: 'excel',
                    text: '<i class="fas fa-file-excel"></i> Excel',
                    className: 'btn btn-success',
                    title: 'Listado de Administradores'
                },
                {
                    extend: 'pdf',
                    text: '<i class="fas fa-file-pdf"></i> PDF',
                    className: 'btn btn-danger',
                    title: 'Listado de Administradores',
                    orientation: 'landscape',
                    pageSize: 'LEGAL',
                    exportOptions: {
                        columns: [0, 1, 2, 3, 4, 5, 6]
                    },
                    customize: function(doc) {
                        // Personalizar el documento PDF
                        doc.content[1].table.widths = ['10%', '20%', '10%', '20%', '10%', '20%', '10%'];
                    }
                }                
            ],
            pageLength: 10,
            responsive: true,
            autoWidth: false
        };

        try {
            // Combinar configuración base con opciones personalizadas
            const configuracionFinal = { ...configuracionBase, ...opcionesPersonalizadas };
            
            // Inicializar DataTable
            this.tabla = $(idTabla).DataTable(configuracionFinal);
            
            // Aplicar estilos personalizados
            if (!document.getElementById('admin-table-styles')) {
                const style = document.createElement('style');
                style.id = 'admin-table-styles';
                style.textContent = `
                    .dataTables_wrapper .dataTables_length,
                    .dataTables_wrapper .dataTables_filter,
                    .dataTables_wrapper .dataTables_info,
                    .dataTables_wrapper .dataTables_paginate {
                        margin: 0.5rem 0;
                    }
                    .dataTables_wrapper .row:first-child {
                        margin-bottom: 1rem;
                        align-items: center;
                    }
                `;
                document.head.appendChild(style);
            }

            return this.tabla;
        } catch (error) {
            console.error('Error al inicializar DataTable:', error);
            throw error;
        }
    }
}

export default new AdminUtils();
