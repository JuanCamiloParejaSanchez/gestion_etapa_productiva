// src/modulos/administrador/controladores/perfilAdministradorControlador.js
// Propósito: Maneja las operaciones del perfil personal del administrador

const { pool } = require('../../../configuracion/baseDatos');
const { generateSasUrl } = require('../../../configuracion/azureBlobConfig');

// Helper para procesar la URL de la foto
const procesarFotoPerfil = async (administrador) => {
    if (administrador.fotoPerfilPath) {
        // Si ya es una URL completa, no hacemos nada
        if (administrador.fotoPerfilPath.startsWith('http')) return;

        // Si es una ruta local (empieza con /), no hacemos nada
        if (administrador.fotoPerfilPath.startsWith('/')) return;

        // Si llegamos aquí, asumimos que es un blob path (ej: documentos/foto.jpg)
        // Verificamos si tenemos configuración de Azure
        if (process.env.AZURE_STORAGE_ACCOUNT_NAME) {
            try {
                // console.log(`🔄 Generando SAS URL para: ${administrador.fotoPerfilPath}`);
                const sasUrl = await generateSasUrl(administrador.fotoPerfilPath);
                administrador.fotoPerfilPath = sasUrl;
            } catch (sasError) {
                console.error('❌ Error generando SAS URL:', sasError);
            }
        }
    }
};

const perfilAdministradorControlador = {

    // Mostrar el perfil del administrador
    async mostrarPerfil(req, res) {
        try {
            console.log('🔍 [PERFIL] Accediendo al perfil del administrador');
            console.log('🔍 [PERFIL] Usuario ID de sesión:', req.session.userId);
            console.log('🔍 [PERFIL] Nombre de usuario de sesión:', req.session.userName);
            
            const adminId = req.session.userId;
            
            if (!adminId) {
                console.log('❌ [PERFIL] No hay ID de usuario en sesión, redirigiendo a login');
                return res.redirect('/auth/login');
            }

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
            
            const [resultados] = await pool.execute(consulta, [adminId]);
            
            if (resultados.length === 0) {
                return res.status(404).render('compartido/paginaError', {
                    titulo: 'Administrador no encontrado',
                    mensaje: 'No se encontró la información del administrador',
                    layout: 'plantillas/autenticacion'
                });
            }

            const administrador = resultados[0];
            
            // Procesar foto de perfil (SAS URL si es necesario)
            await procesarFotoPerfil(administrador);
            
            // Verificar si hay mensaje de éxito
            const success = req.query.success === '1';
            
            res.render('administrador/verMiPerfilAdministrador', {
                titulo: 'Mi Perfil - Administrador',
                administrador,
                success,
                esMiPerfil: true,
                layout: 'plantillas/principal'
            });

        } catch (error) {
            console.error('Error al mostrar perfil del administrador:', error);
            res.status(500).render('compartido/paginaError', {
                titulo: 'Error del Sistema',
                mensaje: 'Error al cargar la información del perfil',
                layout: 'plantillas/principal'
            });
        }
    },

    // Mostrar formulario de edición del perfil
    async editarPerfil(req, res) {
        try {
            const adminId = req.session.userId;
            
            if (!adminId) {
                return res.redirect('/auth/login');
            }

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
            
            const [resultados] = await pool.execute(consulta, [adminId]);
            
            if (resultados.length === 0) {
                return res.status(404).render('compartido/paginaError', {
                    titulo: 'Administrador no encontrado',
                    mensaje: 'No se encontró la información del administrador',
                    layout: 'plantillas/autenticacion'
                });
            }

            const administrador = resultados[0];
            
            // Procesar foto de perfil (SAS URL si es necesario)
            await procesarFotoPerfil(administrador);
            
            res.render('administrador/editarPerfilAdministrador', {
                titulo: 'Editar Mi Perfil - Administrador',
                administrador,
                layout: 'plantillas/principal'
            });

        } catch (error) {
            console.error('Error al cargar formulario de edición:', error);
            res.status(500).render('compartido/paginaError', {
                titulo: 'Error del Sistema',
                mensaje: 'Error al cargar el formulario de edición',
                layout: 'plantillas/principal'
            });
        }
    },

    // Actualizar el perfil del administrador
    async actualizarPerfil(req, res) {
        try {
            console.log('🔄 [ACTUALIZAR PERFIL] Iniciando actualización de perfil');
            console.log('📋 [ACTUALIZAR PERFIL] Body recibido:', req.body);
            console.log('📸 [ACTUALIZAR PERFIL] Archivo recibido:', req.file ? 'Sí' : 'No');
            console.log('📸 [ACTUALIZAR PERFIL] Foto procesada:', req.fotoPerfilProcesada ? 'Sí' : 'No');
            
            const adminId = req.session.userId;
            
            if (!adminId) {
                return res.redirect('/auth/login');
            }

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
            console.log('🟩 [PERFIL] Valores limpios:', {
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
                console.log('❌ [VALIDACIÓN] Campos faltantes:', {
                    nombreCompleto: nombreCompletoLimpio,
                    correo: correoInstitucionalLimpio,
                    numeroIdentificacion: numeroIdentificacionLimpio,
                    telefono: telefonoLimpio,
                    departamento: departamentoLimpio,
                    cargo: cargoLimpio
                });
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
            const [correoExistente] = await pool.execute(verificarCorreo, [correoInstitucionalLimpio, adminId]);
            
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
            const [identificacionExistente] = await pool.execute(verificarIdentificacion, [numeroIdentificacionLimpio, adminId]);
            
            if (identificacionExistente.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El número de identificación ya está registrado por otro administrador'
                });
            }

            // Preparar los datos para actualizar
            let actualizarConsulta;
            let parametros;

            // Verificar si se subió una nueva foto de perfil
            if (req.fotoPerfilProcesada) {
                console.log('📸 Nueva foto de perfil recibida:', {
                    filename: req.fotoPerfilProcesada.filename,
                    path: req.fotoPerfilProcesada.path
                });

                // Actualizar con la nueva foto
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

                parametros = [
                    nombreCompletoLimpio,
                    correoInstitucionalLimpio,
                    numeroIdentificacionLimpio,
                    telefonoLimpio,
                    departamentoLimpio,
                    cargoLimpio,
                    req.fotoPerfilProcesada.filename,
                    req.fotoPerfilProcesada.path,
                    adminId
                ];
            } else {
                // Actualizar sin cambiar la foto
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

                parametros = [
                    nombreCompletoLimpio,
                    correoInstitucionalLimpio,
                    numeroIdentificacionLimpio,
                    telefonoLimpio,
                    departamentoLimpio,
                    cargoLimpio,
                    adminId
                ];
            }

            console.log('🟨 [PERFIL] Parámetros para consulta SQL:', parametros);

            const [resultado] = await pool.execute(actualizarConsulta, parametros);

            // Verificar si la actualización fue exitosa
            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró el administrador para actualizar'
                });
            }

            // Actualizar la sesión con el nuevo nombre si cambió
            if (req.session.userName !== nombreCompletoLimpio) {
                req.session.userName = nombreCompletoLimpio;
            }

            // Responder con éxito
            res.json({ success: true, message: 'Perfil actualizado exitosamente.' });

        } catch (error) {
            console.error('Error al actualizar perfil del administrador:', error);
            
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
                message: 'Error interno del servidor al actualizar el perfil'
            });
        }
    }
};

module.exports = perfilAdministradorControlador;
