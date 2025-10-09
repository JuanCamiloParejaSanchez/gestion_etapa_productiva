const { pool } = require('../../../configuracion/baseDatos');

class RepositorioAprendiz {
    async buscarPorId(id) {
        const [rows] = await pool.query('SELECT * FROM aprendices WHERE id = ?', [id]);
        return rows[0] || null;
    }

    async buscarPorEmail(email) {
        const [rows] = await pool.query('SELECT * FROM aprendices WHERE correoElectronico = ?', [email]);
        return rows[0] || null;
    }

    async buscarPorNumeroDocumento(numeroDocumento) {
        const [rows] = await pool.query('SELECT * FROM aprendices WHERE numeroDocumento = ?', [numeroDocumento]);
        return rows[0] || null;
    }

    async insertar(aprendiz) {
        const [result] = await pool.query('INSERT INTO aprendices SET ?', [aprendiz]);
        return { id: result.insertId };
    }

    async actualizar(id, datos) {
        const setClause = Object.keys(datos).map(key => `${key} = ?`).join(', ');
        const valores = [...Object.values(datos), id];
        const [result] = await pool.query(`UPDATE aprendices SET ${setClause} WHERE id = ?`, valores);
        return result;
    }

    async actualizarPassword(email, hashedPassword) {
        const [result] = await pool.query('UPDATE aprendices SET password = ? WHERE correoElectronico = ?', [hashedPassword, email]);
        return result;
    }

    async eliminar(id) {
        const [result] = await pool.query('DELETE FROM aprendices WHERE id = ?', [id]);
        return result;
    }

    async contarTodos() {
        const [result] = await pool.query('SELECT COUNT(*) as total FROM aprendices');
        return result[0].total;
    }

    async obtenerTodosConFiltros(filtros, orden, limite, offset) {
        let query = 'SELECT * FROM aprendices WHERE 1=1';
        const params = [];

        if (filtros.nombre) {
            query += ' AND (nombres LIKE ? OR primerApellido LIKE ? OR segundoApellido LIKE ?)';
            const nombreParam = `%${filtros.nombre}%`;
            params.push(nombreParam, nombreParam, nombreParam);
        }

        if (filtros.documento) {
            query += ' AND numeroDocumento LIKE ?';
            params.push(`%${filtros.documento}%`);
        }

        if (filtros.programaFormacion) {
            query += ' AND programaFormacion = ?';
            params.push(filtros.programaFormacion);
        }

        if (filtros.alternativaSeleccionada) {
            query += ' AND alternativaSeleccionada = ?';
            params.push(filtros.alternativaSeleccionada);
        }

        if (orden) {
            query += ` ORDER BY ${orden}`;
        }

        if (limite) {
            query += ' LIMIT ?';
            params.push(limite);
        }

        if (offset) {
            query += ' OFFSET ?';
            params.push(offset);
        }

        const [rows] = await pool.query(query, params);
        return rows;
    }
}

module.exports = new RepositorioAprendiz();