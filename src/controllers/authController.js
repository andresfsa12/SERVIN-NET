const connection = require('../config/connection');
const bcrypt = require('bcryptjs');

async function validateUser(username, password) {
    try {
        console.log('validateUser - Iniciando validación para usuario:', username);
        
        // Buscar usuario por username
        const [usuarios] = await connection.execute(
            'SELECT id_usuario, nombre, password, rol_fk, estado FROM usuarios WHERE username = ? LIMIT 1',
            [username]
        );

        console.log('validateUser - Usuarios encontrados:', usuarios.length);

        // Si no existe el usuario
        if (usuarios.length === 0) {
            console.log('validateUser - Usuario no encontrado');
            return {
                success: false,
                message: 'Usuario o contraseña incorrectos'
            };
        }

        const usuario = usuarios[0];
        console.log('validateUser - Usuario encontrado:', {
            id: usuario.id_usuario,
            nombre: usuario.nombre,
            estado: usuario.estado,
            rol: usuario.rol_fk,
            passwordHash: usuario.password ? 'presente' : 'ausente'
        });

        // Verificar si el usuario está activo
        if (usuario.estado !== 'Activo') {
            console.log('validateUser - Usuario inactivo');
            return {
                success: false,
                message: 'Usuario inactivo. Contacte al administrador.'
            };
        }

        // Comparar contraseña ingresada con el hash almacenado
        console.log('validateUser - Comparando contraseñas...');
        const passwordMatch = await bcrypt.compare(password, usuario.password);
        console.log('validateUser - Contraseña coincide:', passwordMatch);

        if (!passwordMatch) {
            console.log('validateUser - Contraseña incorrecta');
            return {
                success: false,
                message: 'Usuario o contraseña incorrectos'
            };
        }

        // Si todo es correcto, retornar datos del usuario
        console.log('validateUser - Login exitoso');
        return {
            success: true,
            userId: usuario.id_usuario,
            userName: usuario.nombre,
            userRole: usuario.rol_fk,
            message: 'Login exitoso'
        };

    } catch (error) {
        console.error('Error en validateUser:', error);
        return {
            success: false,
            message: 'Error en el servidor al validar usuario'
        };
    }
}

module.exports = { validateUser };