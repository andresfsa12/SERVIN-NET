const connection = require('../config/connection');

async function validateUser(username, password) {
    try {
        const conn = await connection;
        const [rows] = await conn.execute(
            'SELECT id_usuario, nombre, password, rol_fk FROM usuarios WHERE username = ?',
            [username]
        );

        if (!rows || rows.length === 0) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        const user = rows[0];

        if (user.password !== password) {
            return { success: false, message: 'Contraseña incorrecta' };
        }

        return {
            success: true,
            userId: user.id_usuario,
            userName: user.nombre,
            userRole: user.rol_fk, 
            message: 'Login exitoso'
        };
    } catch (error) {
        console.error('Error en la validación:', error);
        return { success: false, message: 'Error en el servidor' };
    }
}

module.exports = { validateUser };