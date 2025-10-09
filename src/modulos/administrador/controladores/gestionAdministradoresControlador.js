// src/modulos/administrador/controladores/gestionAdministradoresControlador.js
// Propósito: Maneja las operaciones CRUD para la gestión de administradores.
// Autor: Juan Bogotá

const { pool } = require('../../../configuracion/baseDatos');

/**
 * Muestra la página de listado de administradores
 */
const listarAdministradores = async (req, res) => {
    try {
        res.render('administrador/listarAdministradores', {
            layout: 'plantillas/principal',
            title: 'Listado de Administradores',
            usuario: req.session.usuario
        });
    } catch (error) {
        console.error('Error al mostrar la página de administradores:', error);
        res.status(500).render('compartido/paginaError', {
            layout: 'plantillas/principal',
            title: 'Error del Servidor',
            mensaje: 'Error interno del servidor',
            usuario: req.session.usuario
        });
    }
};

/**
 * Obtiene los datos de administradores para la tabla dinámica
 */
const obtenerDatosAdministradores = async (req, res) => {
    try {
        console.log('=== obtenerDatosAdministradores llamado ===');
        console.log('Request body:', req.body);
        
        let { start = 0, length = 10, search = {}, order = [] } = req.body;
        length = parseInt(length) || 10;
        start = parseInt(start) || 0;
        const { nombre = '', documento = '' } = req.body;

        let query = `
            SELECT 
                id,
                numeroIdentificacion,
                nombreCompleto,
                correoInstitucional,
                telefono,
                departamento,
                cargo
            FROM administradores 
            WHERE 1=1
        `;

        const params = [];

        // Filtros de búsqueda específicos
        if (nombre && nombre.trim()) {
            query += ` AND nombreCompleto LIKE ?`;
            params.push(`%${nombre.trim()}%`);
        }

        if (documento && documento.trim()) {
            query += ` AND numeroIdentificacion LIKE ?`;
            params.push(`%${documento.trim()}%`);
        }

        // Búsqueda global de DataTables
        if (search.value && search.value.trim()) {
            query += ` AND (
                nombreCompleto LIKE ? OR 
                numeroIdentificacion LIKE ? OR 
                correoInstitucional LIKE ? OR 
                departamento LIKE ? OR 
                cargo LIKE ?
            )`;
            const searchValue = `%${search.value.trim()}%`;
            params.push(searchValue, searchValue, searchValue, searchValue, searchValue);
        }

        // Contar total de registros sin filtros
        const [totalResult] = await pool.query('SELECT COUNT(*) as total FROM administradores');
        const recordsTotal = totalResult[0].total;

        // Contar registros filtrados
        const countQuery = query.replace(/SELECT[\s\S]*?FROM/i, 'SELECT COUNT(*) as total FROM');
        const [filteredResult] = await pool.query(countQuery, params);
        const recordsFiltered = filteredResult[0].total;

        // Ordenamiento
        if (order && order.length > 0) {
            const columnIndex = parseInt(order[0].column);
            const direction = order[0].dir === 'desc' ? 'DESC' : 'ASC';
            
            const columnNames = [
                'numeroIdentificacion', 'nombreCompleto', 'correoInstitucional', 
                'telefono', 'departamento', 'cargo'
            ];
            
            if (columnIndex >= 0 && columnIndex < columnNames.length) {
                const columnName = columnNames[columnIndex];
                query += ` ORDER BY ${columnName} ${direction}`;
            }
        } else {
            query += ` ORDER BY nombreCompleto ASC`;
        }

        // Paginación
        if (length !== -1) {
            query += ` LIMIT ? OFFSET ?`;
            params.push(length, start);
        }

        console.log('Query final:', query);
        console.log('Params:', params);

        // Ejecutar consulta principal
        const [result] = await pool.query(query, params);

        console.log('Resultado obtenido:', result.length, 'registros');

        res.json({
            draw: parseInt(req.body.draw) || 1,
            recordsTotal: recordsTotal,
            recordsFiltered: recordsFiltered,
            data: result
        });

    } catch (error) {
        console.error('Error completo en obtenerDatosAdministradores:', error);
        res.status(500).json({
            error: 'Error interno del servidor: ' + error.message,
            draw: parseInt(req.body.draw) || 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            data: []
        });
    }
};

/**
 * Ver detalles de un administrador específico
 */
const verAdministrador = async (req, res) => {
    res.status(501).json({ message: 'Función no implementada aún' });
};

/**
 * Mostrar formulario de edición de administrador
 */
const editarAdministrador = async (req, res) => {
    res.status(501).json({ message: 'Función no implementada aún' });
};

/**
 * Actualizar datos de un administrador
 */
const actualizarAdministrador = async (req, res) => {
    res.status(501).json({ message: 'Función no implementada aún' });
};

/**
 * Eliminar un administrador
 */
const eliminarAdministrador = async (req, res) => {
    res.status(501).json({ message: 'Función no implementada aún' });
};

module.exports = {
    listarAdministradores,
    obtenerDatosAdministradores,
    verAdministrador,
    editarAdministrador,
    actualizarAdministrador,
    eliminarAdministrador
};