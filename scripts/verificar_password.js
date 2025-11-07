const bcrypt = require('bcryptjs');
const connection = require('../src/config/connection');

async function verificarPassword(username, passwordPrueba) {
    try {
        const [usuarios] = await connection.execute(
            'SELECT id_usuario, username, password, estado FROM usuarios WHERE username = ?',
            [username]
        );

        if (usuarios.length === 0) {
            console.log('❌ Usuario no encontrado');
            return;
        }

        const usuario = usuarios[0];
        console.log('\n📋 Información del usuario:');
        console.log('  ID:', usuario.id_usuario);
        console.log('  Username:', usuario.username);
        console.log('  Estado:', usuario.estado);
        console.log('  Password hash:', usuario.password);
        console.log('  Longitud del hash:', usuario.password.length);
        console.log('  Hash empieza con $2:', usuario.password.startsWith('$2'));

        console.log('\n🔐 Probando contraseña:', passwordPrueba);
        const match = await bcrypt.compare(passwordPrueba, usuario.password);
        console.log('  Resultado:', match ? '✅ COINCIDE' : '❌ NO COINCIDE');

        // Generar nuevo hash para comparar
        console.log('\n🔧 Generando nuevo hash de prueba...');
        const nuevoHash = await bcrypt.hash(passwordPrueba, 10);
        console.log('  Nuevo hash:', nuevoHash);
        const matchNuevo = await bcrypt.compare(passwordPrueba, nuevoHash);
        console.log('  Verificación:', matchNuevo ? '✅ OK' : '❌ FALLO');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Cambiar estos valores por los datos reales del usuario admin2
const username = 'admin2';
const password = 'la_contraseña_que_intentas_usar';

verificarPassword(username, password);