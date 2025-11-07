const bcrypt = require('bcryptjs');
const connection = require('../src/config/connection');

async function resetearPassword(username, nuevaPassword) {
    try {
        console.log('🔄 Reseteando contraseña para:', username);
        
        // Verificar que el usuario existe
        const [usuarios] = await connection.execute(
            'SELECT id_usuario, username, estado FROM usuarios WHERE username = ?',
            [username]
        );

        if (usuarios.length === 0) {
            console.log('❌ Usuario no encontrado');
            return;
        }

        console.log('✅ Usuario encontrado:', usuarios[0].username);
        
        // Generar nuevo hash
        console.log('🔐 Generando hash para nueva contraseña...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(nuevaPassword, salt);
        
        console.log('  Nueva contraseña:', nuevaPassword);
        console.log('  Nuevo hash:', hashedPassword);
        console.log('  Longitud:', hashedPassword.length);

        // Actualizar en la base de datos
        await connection.execute(
            'UPDATE usuarios SET password = ? WHERE username = ?',
            [hashedPassword, username]
        );

        console.log('✅ Contraseña actualizada correctamente');

        // Verificar que funciona
        console.log('\n🧪 Verificando nueva contraseña...');
        const match = await bcrypt.compare(nuevaPassword, hashedPassword);
        console.log('  Verificación:', match ? '✅ ÉXITO' : '❌ FALLO');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// CAMBIAR ESTOS VALORES
const username = 'Empubaraya';
const nuevaPassword = '12345678'; // La nueva contraseña que quieres usar

resetearPassword(username, nuevaPassword);