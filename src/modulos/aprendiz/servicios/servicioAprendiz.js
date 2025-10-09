// Ruta: src/servicios/servicioAprendiz.js
// Propósito: Lógica de negocio y operaciones con la base de datos para aprendices
// Autor: JuanBogotá


const { pool } = require('../../../configuracion/baseDatos');
const { formatearFechaParaDB, formatearFechaParaVista } = require('../../../compartido/utilidades/utilFechas');
const { eliminarCamposVacios, mapearAlternativa } = require('../../../compartido/utilidades/utilValidaciones');

class ServicioAprendiz {
    // Campos de fecha que requieren formateo
    #camposFecha = [
        'fechaNacimiento',
        'fechaInicioLectiva',
        'fechaFinLectiva',
        'fechaInicioProductiva',
        'fechaFinProductiva'
    ];


    #formatearRegistroAprendiz(registro) {
        const registroFormateado = { ...registro };
        this.#camposFecha.forEach(campo => {
            if (registro[campo]) {
                registroFormateado[campo] = new Date(registro[campo]).toISOString().split('T')[0];
            }
        });
        return registroFormateado;
    }

    async obtenerAprendicesDataTable(draw, start, length, search) {
        let query = 'SELECT * FROM aprendices';
        let countQuery = 'SELECT COUNT(*) as total FROM aprendices';
        const params = [];

        if (search && search.value) {
            const searchTerm = `%${search.value}%`;
            query += ` WHERE nombres LIKE ? OR primerApellido LIKE ? OR numeroDocumento LIKE ?`;
            countQuery += ` WHERE nombres LIKE ? OR primerApellido LIKE ? OR numeroDocumento LIKE ?`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ` LIMIT ? OFFSET ?`;
        params.push(parseInt(length), parseInt(start));

        const [rows] = await pool.query(query, params);
        const [total] = await pool.query(countQuery, params.slice(0, -2));

        return {
            draw: parseInt(draw),
            recordsTotal: total[0].total,
            recordsFiltered: total[0].total,
            data: rows.map(row => this.#formatearRegistroAprendiz(row))
        };
    }

    async obtenerAprendizPorId(id) {
        const [rows] = await pool.query('SELECT * FROM aprendices WHERE id = ?', [id]);
        if (!rows.length) return null;
        return this.#formatearRegistroAprendiz(rows[0]);
    }

    async crearAprendiz(datos) {
        try {
            const datosFormateados = { ...datos };

            this.#camposFecha.forEach(campo => {
                if (datosFormateados[campo]) {
                    datosFormateados[campo] = formatearFechaParaDB(datosFormateados[campo]);
                }
            });

            if (datosFormateados.alternativaSeleccionada) {
                datosFormateados.alternativaSeleccionada = mapearAlternativa(datosFormateados.alternativaSeleccionada);
            }

            const [resultado] = await pool.query('INSERT INTO aprendices SET ?', [datosFormateados]);

            if (!resultado.insertId) {
                throw new Error('No se pudo crear el registro');
            }

            return {
                success: true,
                id: resultado.insertId
            };
        } catch (error) {
            console.error('Error creando aprendiz:', error);
            throw error;
        }
    }

    async actualizarAprendiz(id, datos) {
        let datosActualizados = { ...datos };

        if (datosActualizados.alternativaSeleccionada) {
            datosActualizados.alternativaSeleccionada =
                mapearAlternativa(datosActualizados.alternativaSeleccionada);
        }

        this.#camposFecha.forEach(campo => {
            if (datosActualizados[campo] !== null && datosActualizados[campo]) {
                datosActualizados[campo] = formatearFechaParaDB(datosActualizados[campo]);
            }
        });

        datosActualizados = eliminarCamposVacios(datosActualizados);

        if (Object.keys(datosActualizados).length === 0) {
            return {
                success: false,
                status: 400,
                message: 'No hay datos válidos para actualizar'
            };
        }

        const setClause = Object.keys(datosActualizados)
            .map(key => `${key} = ?`)
            .join(', ');
        const valores = [...Object.values(datosActualizados), id];

        const [resultado] = await pool.query(
            `UPDATE aprendices SET ${setClause} WHERE id = ?`,
            valores
        );

        return {
            success: true,
            status: 200,
            message: 'Aprendiz actualizado exitosamente'
        };
    }

    async eliminarAprendiz(id) {
        const [resultado] = await pool.query('DELETE FROM aprendices WHERE id = ?', [id]);

        if (resultado.affectedRows === 0) {
            return {
                success: false,
                status: 404,
                message: 'Aprendiz no encontrado'
            };
        }

        return {
            success: true,
            status: 200,
            message: 'Aprendiz eliminado exitosamente'
        };
    }

    async buscarPorEmail(email) {
        try {
            const [rows] = await pool.query('SELECT * FROM aprendices WHERE correoElectronico = ?', [email]);
            return rows[0];
        } catch (error) {
            console.error('Error al buscar aprendiz por email:', error);
            throw error;
        }
    }

    async buscarPorNumeroDocumento(numeroDocumento) {
        try {
            const [rows] = await pool.query('SELECT * FROM aprendices WHERE numeroDocumento = ?', [numeroDocumento]);
            return rows[0];
        } catch (error) {
            console.error('Error al buscar aprendiz por número de documento:', error);
            throw error;
        }
    }

    async actualizarPassword(email, hashedPassword) {
        try {
            const [result] = await pool.query('UPDATE aprendices SET password = ? WHERE correoElectronico = ?', [hashedPassword, email]);

            if (result.affectedRows === 0) {
                throw new Error('No se encontró el aprendiz');
            }

            return { success: true, message: 'Contraseña actualizada correctamente' };
        } catch (error) {
            console.error('Error al actualizar contraseña:', error);
            throw error;
        }
    }
}

module.exports = ServicioAprendiz;