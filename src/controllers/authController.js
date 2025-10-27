const connection = require('../config/connection');
const bcrypt = require('bcrypt');

async function validateUser(username, password) {
    try {
        const conn = await connection;
        const [rows] = await conn.execute(
            'SELECT id_usuario, password FROM usuarios WHERE username = ?',
            [username]
        );

        if (!rows || rows.length === 0) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        const user = rows[0];

         // Detectar si la contraseña almacenada es un hash bcrypt
        const isHashed = typeof user.password === 'string' && user.password.startsWith('$2');

        if (isHashed) {
            const match = await bcrypt.compare(password, user.password);
            if (!match) return { success: false, message: 'Contraseña incorrecta' };
        } else {
            // Comparación directa (temporal — migrar a hashes lo antes posible)
            if (user.password !== password) {
                return { success: false, message: 'Contraseña incorrecta' };
            }
        }

        return { 
            success: true, 
            userId: rows[0].id_usuario,
            message: 'Login exitoso' 
        };
    } catch (error) {
        console.error('Error en la validación:', error);
        return { success: false, message: 'Error en el servidor' };
    }
}

module.exports = { validateUser };