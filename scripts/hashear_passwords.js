const connection = require('../src/config/connection');
const bcrypt = require('bcryptjs');

async function hashearPasswordsExistentes() {
    try {
        console.log('Iniciando proceso de hasheo de contraseñas...');
        
        // Obtener todos los usuarios
        const [usuarios] = await connection.execute(
            'SELECT id_usuario, password FROM usuarios'
        );

        for (const usuario of usuarios) {
            // Si la contraseña ya está hasheada (empieza con $2a$ o $2b$), saltar
            if (usuario.password && usuario.password.startsWith('$2')) {
                console.log(`Usuario ${usuario.id_usuario}: contraseña ya hasheada, saltando...`);
                continue;
            }

            // Hashear la contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(usuario.password, salt);

            // Actualizar en la base de datos
            await connection.execute(
                'UPDATE usuarios SET password = ? WHERE id_usuario = ?',
                [hashedPassword, usuario.id_usuario]
            );

            console.log(`Usuario ${usuario.id_usuario}: contraseña hasheada correctamente`);
        }

        console.log('Proceso completado exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('Error en el proceso:', error);
        process.exit(1);
    }
}

hashearPasswordsExistentes();