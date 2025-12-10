// src/modulos/administrador/controladores/gestionAdministradoresControlador.js
// Propósito: Maneja las operaciones CRUD para la gestión de administradores.

const { pool } = require('../../../configuracion/baseDatos');
const { generateSasUrl } = require('../../../configuracion/azureBlobConfig');

/**
 * Muestra la página de listado de administradores
 */
const listarAdministradores = async (req, res) => {
    try {
        res.render('administrador/listarAdministradores', {
            layout: 'plantillas/principal',
            title: 'Listado de Administradores',
            usuario: req.session.usuario,
            userId: req.session.userId
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
                fichaGrupo,
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
                fichaGrupo LIKE ? OR
                numeroIdentificacion LIKE ? OR
                correoInstitucional LIKE ? OR
                departamento LIKE ? OR
                cargo LIKE ?
            )`;
            const searchValue = `%${search.value.trim()}%`;
            params.push(searchValue, searchValue, searchValue, searchValue, searchValue, searchValue);
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
                'numeroIdentificacion', 'nombreCompleto', 'fichaGrupo', 'correoInstitucional',
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
    try {
        const { id } = req.params;

        // Consultar los datos del administrador
        const consulta = `
            SELECT
                id,
                nombreCompleto,
                correoInstitucional,
                numeroIdentificacion,
                telefono,
                departamento,
                cargo,
                fotoPerfil,
                fotoPerfilPath,
                created_at as fechaRegistro
            FROM administradores
            WHERE id = ?
        `;

        const [resultados] = await pool.execute(consulta, [id]);

        if (resultados.length === 0) {
            return res.status(404).render('compartido/paginaError', {
                layout: 'plantillas/principal',
                title: 'Administrador no encontrado',
                mensaje: 'El administrador solicitado no existe',
                usuario: req.session.usuario
            });
        }

        const administrador = resultados[0];

        // Generar SAS URL si se usa Azure Blob Storage
        if (administrador.fotoPerfilPath && !administrador.fotoPerfilPath.startsWith('/') && !administrador.fotoPerfilPath.startsWith('http')) {
            if (process.env.AZURE_STORAGE_ACCOUNT_NAME) {
                try {
                    console.log(`🔄 [ADMIN-VER] Generando SAS URL para: ${administrador.fotoPerfilPath}`);
                    const sasUrl = await generateSasUrl(administrador.fotoPerfilPath);
                    administrador.fotoPerfilPath = sasUrl;
                } catch (sasError) {
                    console.error('❌ Error generando SAS URL:', sasError);
                }
            }
        }

        res.render('administrador/verMiPerfilAdministrador', {
            layout: 'plantillas/principal',
            title: 'Ver Administrador',
            administrador,
            usuario: req.session.usuario,
            esMiPerfil: req.session.userId == id
        });

    } catch (error) {
        console.error('Error al ver administrador:', error);
        res.status(500).render('compartido/paginaError', {
            layout: 'plantillas/principal',
            title: 'Error del Servidor',
            mensaje: 'Error interno del servidor',
            usuario: req.session.usuario
        });
    }
};

/**
 * Mostrar formulario de edición de administrador
 */
const editarAdministrador = async (req, res) => {
    try {
        const { id } = req.params;

        // Consultar los datos actuales del administrador
        const consulta = `
            SELECT
                id,
                nombreCompleto,
                correoInstitucional,
                numeroIdentificacion,
                telefono,
                departamento,
                cargo,
                fotoPerfil,
                fotoPerfilPath
            FROM administradores
            WHERE id = ?
        `;

        const [resultados] = await pool.execute(consulta, [id]);

        if (resultados.length === 0) {
            return res.status(404).render('compartido/paginaError', {
                layout: 'plantillas/principal',
                title: 'Administrador no encontrado',
                mensaje: 'El administrador solicitado no existe',
                usuario: req.session.usuario
            });
        }

        const administrador = resultados[0];

        // Generar SAS URL si se usa Azure Blob Storage
        if (administrador.fotoPerfilPath && !administrador.fotoPerfilPath.startsWith('/') && !administrador.fotoPerfilPath.startsWith('http')) {
            if (process.env.AZURE_STORAGE_ACCOUNT_NAME) {
                try {
                    console.log(`🔄 [ADMIN-EDIT] Generando SAS URL para: ${administrador.fotoPerfilPath}`);
                    const sasUrl = await generateSasUrl(administrador.fotoPerfilPath);
                    administrador.fotoPerfilPath = sasUrl;
                } catch (sasError) {
                    console.error('❌ Error generando SAS URL:', sasError);
                }
            }
        }

        res.render('administrador/editarPerfilAdministrador', {
            layout: 'plantillas/principal',
            title: 'Editar Administrador',
            administrador,
            usuario: req.session.usuario,
            esMiPerfil: req.session.userId == id
        });

    } catch (error) {
        console.error('Error al editar administrador:', error);
        res.status(500).render('compartido/paginaError', {
            layout: 'plantillas/principal',
            title: 'Error del Servidor',
            mensaje: 'Error interno del servidor',
            usuario: req.session.usuario
        });
    }
};

/**
 * Actualizar datos de un administrador
 */
const actualizarAdministrador = async (req, res) => {
    try {
        const { id } = req.params;

        // Log detallado de cada campo recibido
        console.log('🟦 [ADMIN] Campos recibidos:', {
            nombreCompleto: req.body.nombreCompleto,
            correoInstitucional: req.body.correoInstitucional,
            numeroIdentificacion: req.body.numeroIdentificacion,
            telefono: req.body.telefono,
            departamento: req.body.departamento,
            cargo: req.body.cargo
        });

        // Función para limpiar valores undefined/null
        const limpiarValor = (valor) => {
            if (valor === undefined || valor === null || valor === '') {
                return null;
            }
            return valor;
        };

        // Extraer y limpiar todos los campos
        const {
            nombreCompleto = '',
            correoInstitucional = '',
            numeroIdentificacion = '',
            telefono = '',
            departamento = '',
            cargo = ''
        } = req.body;

        // Limpiar y normalizar todos los valores
        const nombreCompletoLimpio = limpiarValor(nombreCompleto.trim());
        const correoInstitucionalLimpio = limpiarValor(correoInstitucional.trim().toLowerCase());
        const numeroIdentificacionLimpio = limpiarValor(numeroIdentificacion.trim());
        const telefonoLimpio = limpiarValor(telefono.trim());
        const departamentoLimpio = limpiarValor(departamento.trim());
        const cargoLimpio = limpiarValor(cargo.trim());

        // Log de valores limpios
        console.log('🟩 [ADMIN] Valores limpios:', {
            nombreCompletoLimpio,
            correoInstitucionalLimpio,
            numeroIdentificacionLimpio,
            telefonoLimpio,
            departamentoLimpio,
            cargoLimpio
        });

        // Validaciones básicas
        if (!nombreCompletoLimpio || !correoInstitucionalLimpio || !numeroIdentificacionLimpio ||
            !telefonoLimpio || !departamentoLimpio || !cargoLimpio) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        // Validar formato de correo
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correoInstitucionalLimpio)) {
            return res.status(400).json({
                success: false,
                message: 'El formato del correo electrónico no es válido'
            });
        }

        // Validar número de identificación
        if (!/^\d{7,12}$/.test(numeroIdentificacionLimpio)) {
            return res.status(400).json({
                success: false,
                message: 'El número de identificación debe tener entre 7 y 12 dígitos'
            });
        }

        // Validar teléfono
        if (!/^\d{10}$/.test(telefonoLimpio)) {
            return res.status(400).json({
                success: false,
                message: 'El teléfono debe tener exactamente 10 dígitos'
            });
        }

        // Verificar que el correo no esté en uso por otro administrador
        const verificarCorreo = `
            SELECT id FROM administradores
            WHERE correoInstitucional = ? AND id != ?
        `;
        const [correoExistente] = await pool.execute(verificarCorreo, [correoInstitucionalLimpio, id]);

        if (correoExistente.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico ya está registrado por otro administrador'
            });
        }

        // Verificar que el número de identificación no esté en uso por otro administrador
        const verificarIdentificacion = `
            SELECT id FROM administradores
            WHERE numeroIdentificacion = ? AND id != ?
        `;
        const [identificacionExistente] = await pool.execute(verificarIdentificacion, [numeroIdentificacionLimpio, id]);

        if (identificacionExistente.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El número de identificación ya está registrado por otro administrador'
            });
        }

        // Si se recibió una nueva foto de perfil, actualizar también los campos de la foto
        let actualizarConsulta, actualizarParams;
        if (req.file && req.fotoPerfilProcesada) {
            // Usar la información procesada por el middleware
            const fotoPerfil = req.fotoPerfilProcesada.filename;
            const fotoPerfilPath = req.fotoPerfilProcesada.path;

            actualizarConsulta = `
                UPDATE administradores
                SET
                    nombreCompleto = ?,
                    correoInstitucional = ?,
                    numeroIdentificacion = ?,
                    telefono = ?,
                    departamento = ?,
                    cargo = ?,
                    fotoPerfil = ?,
                    fotoPerfilPath = ?
                WHERE id = ?
            `;

            actualizarParams = [
                nombreCompletoLimpio,
                correoInstitucionalLimpio,
                numeroIdentificacionLimpio,
                telefonoLimpio,
                departamentoLimpio,
                cargoLimpio,
                fotoPerfil,
                fotoPerfilPath,
                id
            ];
        } else {
            actualizarConsulta = `
                UPDATE administradores
                SET
                    nombreCompleto = ?,
                    correoInstitucional = ?,
                    numeroIdentificacion = ?,
                    telefono = ?,
                    departamento = ?,
                    cargo = ?
                WHERE id = ?
            `;
            actualizarParams = [
                nombreCompletoLimpio,
                correoInstitucionalLimpio,
                numeroIdentificacionLimpio,
                telefonoLimpio,
                departamentoLimpio,
                cargoLimpio,
                id
            ];
        }

        console.log('🟨 [ADMIN] Parámetros para consulta SQL:', actualizarParams);

        const [resultado] = await pool.execute(actualizarConsulta, actualizarParams);

        // Verificar si la actualización fue exitosa
        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró el administrador para actualizar'
            });
        }

        // Responder con JSON exitoso
        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar administrador:', error);

        // Manejar errores específicos de base de datos
        if (error.code === 'ER_DUP_ENTRY') {
            if (error.message.includes('correo_institucional')) {
                return res.status(409).json({
                    success: false,
                    message: 'Ya existe un administrador con este correo institucional'
                });
            } else if (error.message.includes('numero_identificacion')) {
                return res.status(409).json({
                    success: false,
                    message: 'Ya existe un administrador con este número de identificación'
                });
            }
        }

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al actualizar el administrador'
        });
    }
};

/**
 * Obtener lista de administradores para select (solo nombres completos)
 */
const obtenerListaAdministradores = async (req, res) => {
    console.log('🔍 Ejecutando obtenerListaAdministradores');
    try {
        const consulta = `
            SELECT
                id,
                nombreCompleto
            FROM administradores
            WHERE activo = TRUE
            ORDER BY nombreCompleto ASC
        `;

        console.log('📝 Consulta SQL:', consulta);
        const [resultados] = await pool.execute(consulta);
        console.log('📊 Resultados obtenidos:', resultados.length, 'administradores');

        res.json({
            success: true,
            administradores: resultados
        });

    } catch (error) {
        console.error('❌ Error al obtener lista de administradores:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener administradores'
        });
    }
};

/**
 * Eliminar un administrador
 */
const eliminarAdministrador = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el administrador existe
        const consultaExistencia = `SELECT id, nombreCompleto FROM administradores WHERE id = ?`;
        const [resultadoExistencia] = await pool.execute(consultaExistencia, [id]);

        if (resultadoExistencia.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'El administrador no existe'
            });
        }

        // Verificar que no sea el administrador actual (para evitar auto-eliminación)
        if (req.session.userId == id) {
            return res.status(400).json({
                success: false,
                message: 'No puedes eliminar tu propio usuario'
            });
        }

        // Eliminar el administrador
        const consultaEliminar = `DELETE FROM administradores WHERE id = ?`;
        const [resultadoEliminar] = await pool.execute(consultaEliminar, [id]);

        if (resultadoEliminar.affectedRows === 0) {
            return res.status(500).json({
                success: false,
                message: 'No se pudo eliminar el administrador'
            });
        }

        res.json({
            success: true,
            message: 'Administrador eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar administrador:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al eliminar el administrador'
        });
    }
};

module.exports = {
    listarAdministradores,
    obtenerDatosAdministradores,
    obtenerListaAdministradores,
    verAdministrador,
    editarAdministrador,
    actualizarAdministrador,
    eliminarAdministrador
};