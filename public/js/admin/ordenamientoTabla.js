// public/js/admin/ordenamientoTabla.js
// Propósito: Sistema de ordenamiento para la tabla de aprendices con filtros desplegables


class OrdenamientoTabla {
    constructor() {
        this.ordenamientoActual = {
            columna: null,
            direccion: 'asc'
        };
        this.init();
    }

    init() {
        // Verificar si se debe omitir la inicialización
        if (window.skipDataTableInit) {
            console.log('Inicialización de DataTable omitida por skipDataTableInit');
            return;
        }
        
        this.agregarIconosOrdenamiento();
        this.configurarEventos();
    }

    agregarIconosOrdenamiento() {
        const tabla = document.getElementById('aprendicesTable');
        if (!tabla) {
            console.log('Tabla aprendicesTable no encontrada, no se ejecutará el ordenamiento');
            return;
        }

        const thead = tabla.querySelector('thead tr');
        if (!thead) {
            console.log('Header de tabla no encontrado, reintentando...');
            setTimeout(() => this.agregarIconosOrdenamiento(), 100);
            return;
        }

        // Verificar si ya se agregaron los íconos
        if (thead.querySelector('.sortable-header')) {
            console.log('Íconos de ordenamiento ya agregados');
            return;
        }

        console.log('Agregando íconos de ordenamiento...');

        // Crear contenedor global para dropdowns
        if (!document.getElementById('global-dropdown-container')) {
            const dropdownContainer = document.createElement('div');
            dropdownContainer.id = 'global-dropdown-container';
            dropdownContainer.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 99999;';
            document.body.appendChild(dropdownContainer);
        }

        // Obtener todas las columnas excepto la última (acciones)
        const columnas = thead.querySelectorAll('th:not(:last-child)');
        
        columnas.forEach((th, index) => {
            const columnaData = th.getAttribute('data-column');
            if (!columnaData || columnaData === 'acciones') return;

            // Obtener el texto original del header
            const headerText = th.textContent.trim();
            
            // Crear contenedor para el header
            th.innerHTML = `
                <div class="header-content">
                    <span class="header-text">${headerText}</span>
                    <div class="sort-icon" data-column="${columnaData}" data-index="${index}">
                        <i class="fas fa-sort"></i>
                    </div>
                </div>
            `;
            
            // Agregar clase sortable-header al th
            th.classList.add('sortable-header');
        });

        console.log('Íconos de ordenamiento agregados exitosamente');
        
        // Configurar evento para cuando se muestren columnas ocultas
        this.configurarEventoColumnasVisibles();
    }

    configurarEventoColumnasVisibles() {
        // Escuchar cambios en la visibilidad de columnas
        const tabla = $('#aprendicesTable').DataTable();
        if (tabla) {
            tabla.on('column-visibility.dt', (e, settings, column, state) => {
                // Cuando una columna se hace visible, agregar íconos si no los tiene
                if (state) {
                    setTimeout(() => {
                        this.agregarIconosAColumnasOcultas();
                    }, 100);
                }
            });
        }
    }

    agregarIconosAColumnasOcultas() {
        const tabla = document.getElementById('aprendicesTable');
        if (!tabla) return;

        const thead = tabla.querySelector('thead tr');
        if (!thead) return;

        // Obtener todas las columnas excepto la última (acciones)
        const columnas = thead.querySelectorAll('th:not(:last-child)');
        
        columnas.forEach((th, index) => {
            const columnaData = th.getAttribute('data-column');
            if (!columnaData || columnaData === 'acciones') return;

            // Verificar si ya tiene controles de ordenamiento
            if (th.querySelector('.sort-controls')) return;

            // Obtener el texto del header
            const headerText = th.textContent.trim();
            
            // Crear contenedor para el header con controles de ordenamiento
            th.innerHTML = `
                <div class="header-content">
                    <span class="header-text">${headerText}</span>
                    <div class="sort-icon" data-column="${columnaData}" data-index="${index}">
                        <i class="fas fa-sort"></i>
                    </div>
                </div>
            `;
            
            // Agregar clase sortable-header al th
            th.classList.add('sortable-header');
        });

        console.log('Íconos agregados a columnas ocultas');
    }

    configurarEventos() {
        // Eventos para íconos de ordenamiento
        document.addEventListener('click', (e) => {
            if (e.target.closest('.sort-icon')) {
                this.toggleDropdown(e.target.closest('.sort-icon'));
            } else if (e.target.closest('.sort-option')) {
                this.aplicarOrdenamiento(e.target.closest('.sort-option'));
            } else {
                this.cerrarTodosLosDropdowns();
            }
        });

        // Cerrar dropdowns al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.sort-icon') && !e.target.closest('.sort-dropdown')) {
                this.cerrarTodosLosDropdowns();
            }
        });
    }

    toggleDropdown(iconElement) {
        const columna = iconElement.getAttribute('data-column');
        const isOpen = document.querySelector(`.sort-dropdown[data-column="${columna}"].show`);
        
        // Cerrar todos los dropdowns
        this.cerrarTodosLosDropdowns();
        
        // Abrir el dropdown actual si no estaba abierto
        if (!isOpen) {
            this.crearDropdown(iconElement, columna);
            iconElement.classList.add('active');
        }
    }

    crearDropdown(iconElement, columna) {
        const dropdownContainer = document.getElementById('global-dropdown-container');
        if (!dropdownContainer) return;

        // Obtener la posición del ícono
        const iconRect = iconElement.getBoundingClientRect();
        
        // Calcular posición inteligente
        const dropdownWidth = 200;
        const dropdownHeight = 160; // Aproximadamente 4 opciones * 40px cada una
        const margin = 10;
        
        // Posición horizontal - Centrar el dropdown respecto al ícono con pequeño offset a la derecha
        let left = iconRect.left + (iconRect.width / 2) - (dropdownWidth / 2) + 50;
        if (left < margin) {
            left = margin; // No salirse por la izquierda
        } else if (left + dropdownWidth > window.innerWidth - margin) {
            left = window.innerWidth - dropdownWidth - margin; // No salirse por la derecha
        }
        
        // Posición vertical
        let top = iconRect.bottom + 5;
        if (top + dropdownHeight > window.innerHeight - margin) {
            // Si no cabe abajo, mostrar arriba
            top = iconRect.top - dropdownHeight - 5;
        }
        
        // Crear el dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'sort-dropdown show';
        dropdown.setAttribute('data-column', columna);
        dropdown.style.cssText = `
            position: absolute;
            top: ${top}px;
            left: ${left}px;
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            width: ${dropdownWidth}px;
            max-width: ${dropdownWidth}px;
            z-index: 100000;
            pointer-events: auto;
            overflow: hidden;
        `;
        
        // Determinar el tipo de columna para mostrar opciones específicas
        const columnType = this.getColumnType(columna);
        const sortOptions = this.getSortOptionsForType(columnType);
        
        dropdown.innerHTML = `
            <div class="sort-options">
                ${sortOptions.map(option => `
                    <button type="button" class="sort-option" data-sort="${option.value}" data-column="${columna}">
                        <i class="${option.icon}"></i> ${option.label}
                    </button>
                `).join('')}
            </div>
        `;
        
        dropdownContainer.appendChild(dropdown);
    }

    cerrarTodosLosDropdowns() {
        const dropdownContainer = document.getElementById('global-dropdown-container');
        if (dropdownContainer) {
            dropdownContainer.innerHTML = '';
        }
        document.querySelectorAll('.sort-icon').forEach(icon => {
            icon.classList.remove('active');
        });
    }

    aplicarOrdenamiento(option) {
        const columna = option.getAttribute('data-column');
        const tipoOrden = option.getAttribute('data-sort');
        
        // Actualizar estado
        this.ordenamientoActual = {
            columna: columna,
            direccion: tipoOrden
        };

        // Actualizar variable global para DataTables
        window.ordenamientoActual = this.ordenamientoActual;

        // Actualizar íconos visuales
        this.actualizarIconos(columna, tipoOrden);

        // Aplicar ordenamiento en DataTable
        this.aplicarOrdenamientoDataTable(columna, tipoOrden);

        // Cerrar dropdown
        this.cerrarTodosLosDropdowns();
    }

    actualizarIconos(columna, tipoOrden) {
        // Resetear todos los íconos y headers
        document.querySelectorAll('.sortable-header').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
        });
        
        document.querySelectorAll('.sort-icon i').forEach(icon => {
            icon.className = 'fas fa-sort';
        });

        // Actualizar ícono y header de la columna actual
        const iconElement = document.querySelector(`.sort-icon[data-column="${columna}"]`);
        if (iconElement) {
            const icon = iconElement.querySelector('i');
            const header = iconElement.closest('.sortable-header');
            
            if (icon && header) {
                switch (tipoOrden) {
                    case 'asc':
                        icon.className = 'fas fa-sort-up';
                        header.classList.add('sort-asc');
                        break;
                    case 'desc':
                        icon.className = 'fas fa-sort-down';
                        header.classList.add('sort-desc');
                        break;
                    case 'oldest':
                        icon.className = 'fas fa-calendar-minus';
                        header.classList.add('sort-asc');
                        break;
                    case 'newest':
                        icon.className = 'fas fa-calendar-plus';
                        header.classList.add('sort-desc');
                        break;
                }
            }
        }
    }

    aplicarOrdenamientoDataTable(columna, tipoOrden) {
        // Obtener la instancia de DataTable
        const tabla = $('#aprendicesTable').DataTable();
        if (!tabla) {
            console.error('DataTable no encontrada');
            return;
        }

        // Obtener el índice real de la columna visible usando el atributo data-column
        const columnIndex = tabla.column(`[data-column="${columna}"]`).index();
        if (columnIndex === undefined || columnIndex === -1) {
            console.error('No se encontró el índice de la columna:', columna);
            return;
        }

        console.log('Aplicando ordenamiento:', { columna, tipoOrden, columnIndex });

        // Actualizar variable global para que se use en la próxima recarga
        window.ordenamientoActual = {
            columna: columna,
            direccion: tipoOrden,
            columnIndex: columnIndex
        };

        // Recargar la tabla para aplicar el ordenamiento
        tabla.ajax.reload(() => {
            console.log('Tabla recargada con ordenamiento:', window.ordenamientoActual);
        });
    }

    // Método para obtener el ordenamiento actual
    getOrdenamientoActual() {
        return this.ordenamientoActual;
    }

    // Método para obtener el tipo de columna
    getColumnType(columna) {
        const columnTypes = {
            'instructorProductiva': 'text',
            'programaFormacion': 'text',
            'numeroFicha': 'number',
            'genero': 'text',
            'tipoDocumento': 'text',
            'numeroDocumento': 'number',
            'estadoFormacion': 'text',
            'nombres': 'text',
            'primerApellido': 'text',
            'segundoApellido': 'text',
            'fechaNacimiento': 'date',
            'eps': 'text',
            'telefonoFijo': 'number',
            'celular': 'number',
            'direccion': 'text',
            'barrio': 'text',
            'departamento': 'text',
            'municipio': 'text',
            'correoElectronico': 'text',
            'fechaInicioLectiva': 'date',
            'fechaFinLectiva': 'date',
            'fechaInicioProductiva': 'date',
            'fechaFinProductiva': 'date',
            'instructorLectiva': 'text',
            'alternativaSeleccionada': 'text',
            'areaFormacion': 'text',
            'empresaPatrocinadora': 'text',
            'areaPractica': 'text',
            'jefeInmediato': 'text',
            'telefonoEmpresa': 'number',
            'celularEmpresa': 'number',
            'direccionEmpresa': 'text',
            'correoEmpresa': 'text',
            'horario': 'text'
        };

        return columnTypes[columna] || 'text';
    }

    // Método para obtener opciones de ordenamiento según el tipo
    getSortOptionsForType(type) {
        switch (type) {
            case 'date':
                return [
                    { value: 'oldest', label: 'Más Antiguo', icon: 'fas fa-calendar-minus' },
                    { value: 'newest', label: 'Más Reciente', icon: 'fas fa-calendar-plus' }
                ];
            case 'number':
                return [
                    { value: 'asc', label: 'Menor a Mayor', icon: 'fas fa-sort-numeric-down' },
                    { value: 'desc', label: 'Mayor a Menor', icon: 'fas fa-sort-numeric-up' }
                ];
            case 'text':
            default:
                return [
                    { value: 'asc', label: 'A-Z', icon: 'fas fa-sort-alpha-down' },
                    { value: 'desc', label: 'Z-A', icon: 'fas fa-sort-alpha-up' }
                ];
        }
    }

    // Método para resetear ordenamiento
    resetearOrdenamiento() {
        this.ordenamientoActual = {
            columna: null,
            direccion: 'asc'
        };
        
        // Resetear variable global
        window.ordenamientoActual = null;
        
        // Resetear íconos y headers
        document.querySelectorAll('.sortable-header').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
        });
        
        document.querySelectorAll('.sort-icon i').forEach(icon => {
            icon.className = 'fas fa-sort';
        });
    }
}

// Exportar la clase
window.OrdenamientoTabla = OrdenamientoTabla; 
 